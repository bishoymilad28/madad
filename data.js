// طبقة البيانات: Firebase عند توفر الإعدادات، وإلا وضع تجريبي محلي
// الدخول برقم الهاتف ورمز تحقق يصل برسالة SMS
import { CONFIG } from './config.js';

export const isDemo = !CONFIG.firebase || !CONFIG.firebase.apiKey;
export const DEMO_CODE = '123456';
const ADMIN_PHONES = CONFIG.adminPhones || [];
const effectiveRole = (phone, role) => ADMIN_PHONES.includes(phone || '') ? 'admin' : (role || 'participant');
const PUBLIC_STATUSES = ['approved', 'implemented'];
const PUBLIC_TYPES = ['proposal', 'innovation', 'research']; // الملاحظات لا تُنشر للعامة

// توحيد الرقم إلى الصيغة الدولية: 0501234567 أو 501234567 أو 00971... ← +971501234567
export function normalizePhone(raw) {
  let p = String(raw || '').replace(/[\s\-()]/g, '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  if (p.startsWith('00')) p = '+' + p.slice(2);
  if (!p.startsWith('+')) p = (CONFIG.countryCode || '+971') + p.replace(/^0+/, '');
  return /^\+\d{8,15}$/.test(p) ? p : null;
}

export const api = isDemo ? demoImpl() : await firebaseImpl();

/* ---------------- Firebase ---------------- */
async function firebaseImpl() {
  const V = '12.19.0';
  const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
  const A = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`);
  const F = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`);
  const app = initializeApp(CONFIG.firebase);
  const auth = A.getAuth(app);
  auth.languageCode = 'ar';
  const db = F.getFirestore(app);
  const col = n => F.collection(db, n);
  const list = async q => (await F.getDocs(q)).docs.map(d => ({ id: d.id, ...d.data() }));
  let _st = null; const storageMod = () => _st || (_st = import(`https://www.gstatic.com/firebasejs/${V}/firebase-storage.js`));

  async function profileFor(u) {
    const snap = await F.getDoc(F.doc(db, 'users', u.uid));
    if (!snap.exists()) return { uid: u.uid, phone: u.phoneNumber, needsProfile: true, role: effectiveRole(u.phoneNumber) };
    const p = snap.data();
    return { uid: u.uid, ...p, role: effectiveRole(u.phoneNumber, p.role) };
  }

  let verifier = null, confirmation = null;
  return {
    onAuth(cb) { A.onAuthStateChanged(auth, async u => cb(u ? await profileFor(u) : null)); },
    async sendCode(phone, buttonId) {
      if (verifier) { try { verifier.clear(); } catch { } }
      verifier = new A.RecaptchaVerifier(auth, buttonId, { size: 'invisible' });
      confirmation = await A.signInWithPhoneNumber(auth, phone, verifier);
    },
    async verifyCode(code) {
      if (!confirmation) { const e = new Error('auth/code-expired'); e.code = 'auth/code-expired'; throw e; }
      const c = await confirmation.confirm(code);
      return profileFor(c.user);
    },
    async completeProfile({ name, category }) {
      const u = auth.currentUser;
      await F.setDoc(F.doc(db, 'users', u.uid), { name, category, phone: u.phoneNumber, role: 'participant', createdAt: Date.now() });
      return profileFor(u);
    },
    signOut: () => A.signOut(auth),
    async getPlan() { const s = await F.getDoc(F.doc(db, 'site', 'plan')); return s.exists() ? s.data() : null; },
    savePlan: data => F.setDoc(F.doc(db, 'site', 'plan'), data),
    listLibrary: () => list(F.query(col('library'), F.orderBy('createdAt', 'desc'))),
    addLibrary: data => F.addDoc(col('library'), { ...data, createdAt: Date.now() }),
    delLibrary: id => F.deleteDoc(F.doc(db, 'library', id)),
    publicSubs: () => list(F.query(col('submissions'), F.where('status', 'in', PUBLIC_STATUSES), F.where('type', 'in', PUBLIC_TYPES))),
    // ===== الصوت: يُحفظ في Cloud Storage، ولا يصل إليه إلا صاحبه ولجنة الابتكار =====
    async uploadAudio(blob, uid) {
      const St = await storageMod();
      const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm';
      const path = `audio/${uid}/${Date.now()}.${ext}`;
      await St.uploadBytes(St.ref(St.getStorage(app), path), blob, { contentType: blob.type || 'audio/webm' });
      return path;
    },
    async audioUrl(path) { const St = await storageMod(); return St.getDownloadURL(St.ref(St.getStorage(app), path)); },
    // ===== الذكاء الاصطناعي: Gemini عبر Firebase AI Logic يستمع للتسجيل ويعبّئ النموذج =====
    async voiceToForm({ blob, base64, prompt, schema }) {
      const AI = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-ai.js`);
      const ai = AI.getAI(app, { backend: new AI.GoogleAIBackend() });
      const model = AI.getGenerativeModel(ai, { model: CONFIG.ai?.model || 'gemini-3.8-flash', generationConfig: { responseMimeType: 'application/json', responseSchema: schema(AI.Schema), temperature: 0.2 } });
      const r = await model.generateContent([prompt, { inlineData: { data: base64, mimeType: blob.type || 'audio/webm' } }]);
      return JSON.parse(r.response.text());
    },
    mySubs: uid => list(F.query(col('submissions'), F.where('authorId', '==', uid))),
    allSubs: () => list(col('submissions')),
    addSub: data => F.addDoc(col('submissions'), data),
    updateSub: (id, patch) => F.updateDoc(F.doc(db, 'submissions', id), patch),
    listUsers: () => list(col('users')).then(us => us.map(u => ({ uid: u.id, ...u, role: effectiveRole(u.phone, u.role) }))),
    setRole: (uid, role) => F.updateDoc(F.doc(db, 'users', uid), { role })
  };
}

/* ---------------- الوضع التجريبي (localStorage) ---------------- */
function idb(op, key, val) {
  return new Promise((res, rej) => {
    const o = indexedDB.open('midad_audio', 1);
    o.onupgradeneeded = () => o.result.createObjectStore('a');
    o.onerror = () => rej(o.error);
    o.onsuccess = () => { const tx = o.result.transaction('a', op === 'get' ? 'readonly' : 'readwrite'), st = tx.objectStore('a'); const r = op === 'get' ? st.get(key) : st.put(val, key); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); };
  });
}
function demoImpl() {
  const K = 'midad_demo_v2';
  const load = () => { try { return JSON.parse(localStorage.getItem(K)) || null; } catch { return null; } };
  const save = s => { try { localStorage.setItem(K, JSON.stringify(s)); } catch { } };
  let S = load();
  if (!S) {
    const now = Date.now(), day = 864e5;
    const adminPhone = ADMIN_PHONES[0] || '+971500000000';
    S = {
      users: {
        u_admin: { name: 'مسؤول المنصة', phone: adminPhone, category: 'staff', role: 'admin', createdAt: now - 20 * day },
        u_demo: { name: 'مشارك تجريبي', phone: '+971501111111', category: 'member', role: 'participant', createdAt: now - 9 * day }
      },
      session: null, pending: null, plan: null, library: [],
      subs: [
        { id: 's1', type: 'research', ref: 'MDD-R-EX01', title: '(مثال) دراسة حالة: رفع مشاركة الناشئين في الأنشطة الصيفية', category: 'رياضي', fields: { kind: 'دراسة حالة', authors: 'فريق الأنشطة', abstract: 'مثال توضيحي لدراسة حالة منشورة في المكتبة بعد اعتمادها من اللجنة.', findings: 'نص توضيحي.' }, authorId: 'u_demo', authorName: 'مشارك تجريبي', authorPhone: '+971501111111', authorCategory: 'member', status: 'approved', note: '', history: [], createdAt: now - 6 * day },
        { id: 's2', type: 'innovation', ref: 'MDD-I-EX02', title: '(مثال) حجز الملاعب عبر رمز QR', category: 'تقنية ورقمنة', fields: { innType: 'ابتكار في خدمة', novelty: 'جديد على النادي', solution: 'مثال توضيحي لابتكار منفذ.' }, authorId: 'u_demo', authorName: 'مشارك تجريبي', authorPhone: '+971501111111', authorCategory: 'member', status: 'implemented', note: '', history: [], createdAt: now - 4 * day },
        { id: 's3', type: 'proposal', ref: 'MDD-P-EX03', title: '(مثال) تمديد ساعات المكتبة في الإجازات', category: 'ثقافي', fields: { idea: 'مثال توضيحي لمقترح قيد الدراسة.' }, authorId: 'u_demo', authorName: 'مشارك تجريبي', authorPhone: '+971501111111', authorCategory: 'member', status: 'evaluation', note: '', history: [], createdAt: now - day }
      ]
    };
    save(S);
  }
  const listeners = [];
  const prof = uid => ({ uid, ...S.users[uid], role: effectiveRole(S.users[uid].phone, S.users[uid].role) });
  const me = () => S.session && S.users[S.session] ? prof(S.session) : null;
  const emit = () => { save(S); const u = me(); listeners.forEach(cb => cb(u)); };
  const wait = v => new Promise(r => setTimeout(() => r(v), 250));
  const err = code => { const e = new Error(code); e.code = code; throw e; };
  const id = () => Math.random().toString(36).slice(2, 10);
  return {
    demoPhones: () => ({ admin: S.users.u_admin.phone, member: S.users.u_demo.phone }),
    resetDemo() { try { localStorage.removeItem(K); } catch { } location.reload(); },
    onAuth(cb) { listeners.push(cb); setTimeout(() => cb(me()), 0); },
    async sendCode(phone) { S.pending = phone; save(S); return wait(); },
    async verifyCode(code) {
      await wait();
      if (!S.pending) err('auth/code-expired');
      if (code !== DEMO_CODE) err('auth/invalid-verification-code');
      const found = Object.entries(S.users).find(([, u]) => u.phone === S.pending);
      if (found) { S.session = found[0]; S.pending = null; emit(); return me(); }
      return { uid: null, phone: S.pending, needsProfile: true, role: effectiveRole(S.pending) };
    },
    async completeProfile({ name, category }) {
      const uid = 'u_' + id();
      S.users[uid] = { name, category, phone: S.pending, role: 'participant', createdAt: Date.now() };
      S.session = uid; S.pending = null; emit(); return wait(me());
    },
    async signOut() { S.session = null; emit(); return wait(); },
    getPlan: () => wait(S.plan),
    savePlan: data => { S.plan = data; save(S); return wait(); },
    listLibrary: () => wait([...S.library].sort((a, b) => b.createdAt - a.createdAt)),
    addLibrary: data => { S.library.push({ id: id(), ...data, createdAt: Date.now() }); save(S); return wait(); },
    delLibrary: lid => { S.library = S.library.filter(x => x.id !== lid); save(S); return wait(); },
    publicSubs: () => wait(S.subs.filter(s => PUBLIC_STATUSES.includes(s.status) && PUBLIC_TYPES.includes(s.type))),
    // الصوت في الوضع التجريبي يُحفظ في IndexedDB على هذا المتصفح
    async uploadAudio(blob) { const k = 'a_' + id(); await idb('put', k, blob); return 'idb:' + k; },
    async audioUrl(path) { const b = await idb('get', path.replace(/^idb:/, '')); if (!b) throw new Error('missing'); return URL.createObjectURL(b); },
    // للاختبار فقط: يمكن تمرير ردّ ذكاء اصطناعي مُحاكى عبر window.__midadDemoAI
    async voiceToForm() { if (window.__midadDemoAI) return wait(window.__midadDemoAI); err('demo-ai'); },
    mySubs: uid => wait(S.subs.filter(s => s.authorId === uid)),
    allSubs: () => wait([...S.subs]),
    addSub: data => { const d = { id: id(), ...data }; S.subs.push(d); save(S); return wait({ id: d.id }); },
    updateSub: (sid, patch) => { const s = S.subs.find(x => x.id === sid); Object.assign(s, patch); save(S); return wait(); },
    listUsers: () => wait(Object.keys(S.users).map(prof)),
    setRole: (uid, role) => { S.users[uid].role = role; emit(); return wait(); }
  };
}
