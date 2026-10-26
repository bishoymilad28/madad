import { CONFIG } from './config.js';
import { api, isDemo, normalizePhone, DEMO_CODE } from './data.js';
import { LANG, isEn, setLang, applyLang, startTranslator, translateNow, tr } from './i18n.js';
import { initMotion, afterRender, toTop, lockScroll, expand, reveal } from './motion.js';
import { micSupported, startRecording, fmtDur, blobToBase64, MAX_SEC } from './voice.js';

/* ============ ثوابت ============ */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = s => document.querySelector(s);
const fmtDate = t => t ? new Date(t).toLocaleDateString(isEn() ? 'en-GB' : 'ar-AE', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

const DEFAULT_PLAN = {
  period: '2026–2031',
  vision: 'نادٍ رائد، صانعُ المواهب والإنجاز المستدام.',
  mission: 'تطوير منظومة رياضية وثقافية متكاملة تُمكّن المواهب، وتعزز التنافسية، وتبني قيادات شابة، عبر شراكات فاعلة تحقق إنجازًا مستدامًا وتعزز جودة الحياة المجتمعية.',
  goals: [
    { code: 'SO01', title: 'بناء منظومة مستدامة للمواهب والتميز الرياضي', aim: 'تطوير منظومة رياضية متكاملة تدعم اكتشاف وتأهيل المواهب، ورفع مستوى التميز والتنافسية الرياضية.' },
    { code: 'SO02', title: 'تعزيز الدور الرياضي والثقافي والمجتمعي', aim: 'ترسيخ دور النادي كمركز رياضي وثقافي ومجتمعي فاعل يعزز جودة الحياة والانتماء.' },
    { code: 'SO03', title: 'تعزيز التميز المؤسسي عبر الحوكمة والابتكار', aim: 'بناء منظومة مؤسسية مبتكرة وأكثر كفاءة تدعم جودة الأداء والتطوير المستمر.' },
    { code: 'SO04', title: 'تعزيز الاستدامة المالية من خلال تنمية الموارد الاستثمارية', aim: 'دعم الاستقرار المالي والاستدامة التشغيلية وتعزيز قدرة النادي على التطوير.' },
    { code: 'SO05', title: 'استقطاب وتمكين الكفاءات الرياضية والإدارية والقيادية', aim: 'إعداد وتمكين كوادر وقيادات رياضية وإدارية شابة قادرة على دعم التحول المؤسسي.' },
    { code: 'SO06', title: 'تعزيز الشراكات المؤسسية والمجتمعية', aim: 'توسيع الشراكات الفاعلة بما يدعم التنمية الرياضية والمجتمعية.' }
  ],
  values: ['الأخلاق الرياضية', 'جودة الحياة', 'المواطنة الإيجابية', 'النزاهة والشفافية', 'الابتكار والتميز', 'الاحترافية والأداء', 'الاستدامة']
};

// المجالات التي تُسهم فيها الفكرة: صياغة مبسطة لأهداف الخطة الاستراتيجية (الرمز يُحفظ للتقارير ولا يظهر للمشارك)
const GOAL_AREAS = { SO01: 'المواهب والتميز الرياضي', SO02: 'الأنشطة الرياضية والثقافية والمجتمعية', SO03: 'الخدمات والأداء المؤسسي', SO04: 'الموارد المالية والاستثمار', SO05: 'الكفاءات والقيادات', SO06: 'الشراكات المؤسسية والمجتمعية' };
const AREA_UNSURE = 'غير متأكد';
const areaOptions = () => (plan().goals || []).map(g => ({ code: g.code, label: GOAL_AREAS[g.code] || g.title }));
const CATS = ['رياضي', 'ثقافي', 'مجتمعي', 'إداري', 'مالي', 'تقنية ورقمنة', 'الصحة والسلامة والبيئة', 'خدمة المتعاملين'];
const AUDIENCE = { staff: 'موظف في النادي', member: 'عضو في النادي', public: 'من الجمهور' };
const ROLES = { participant: 'مشارك', reviewer: 'عضو لجنة', admin: 'مسؤول' };
const TYPES = {
  proposal: { label: 'مقترح', action: 'تقديم مقترح', prefix: 'P', desc: 'فكرة لتحسين خدمة أو إجراء أو نشاط قائم في النادي.',
    fields: [
      { id: 'current', label: 'الوضع الحالي أو المشكلة', type: 'textarea', full: true },
      { id: 'idea', label: 'المقترح', type: 'textarea', req: true, full: true },
      { id: 'benefit', label: 'الفائدة المتوقعة', type: 'textarea', hint: 'وفر في الوقت أو التكلفة، رضا المتعاملين، السلامة…' },
      { id: 'owner', label: 'الجهة المقترحة للتنفيذ', type: 'text' }] },
  innovation: { label: 'ابتكار', action: 'تقديم ابتكار', prefix: 'I', desc: 'حل جديد لم يُطبّق في النادي من قبل: خدمة أو عملية أو منتج.',
    fields: [
      { id: 'innType', label: 'نوع الابتكار', type: 'select', req: true, options: ['ابتكار في خدمة', 'ابتكار في عملية', 'ابتكار في منتج', 'ابتكار في نموذج العمل'] },
      { id: 'novelty', label: 'مستوى الجِدّة', type: 'select', req: true, options: ['تحسين جذري لما هو قائم', 'جديد على النادي', 'جديد على مستوى الدولة', 'جديد عالمياً'] },
      { id: 'problem', label: 'التحدي الذي يعالجه', type: 'textarea', full: true },
      { id: 'solution', label: 'وصف الابتكار وطريقة عمله', type: 'textarea', req: true, full: true },
      { id: 'impact', label: 'الأثر المتوقع ومؤشر قياسه', type: 'textarea' },
      { id: 'resources', label: 'الموارد المطلوبة', type: 'textarea', hint: 'ميزانية تقديرية، فريق، تقنية، شراكات' }] },
  research: { label: 'بحث / دراسة حالة', action: 'تقديم بحث أو دراسة حالة', prefix: 'R', desc: 'بحث أو دراسة حالة أو تجربة موثقة، تُنشر في المكتبة بعد المراجعة.',
    fields: [
      { id: 'kind', label: 'نوع العمل', type: 'select', req: true, options: ['بحث', 'دراسة حالة', 'ورقة عمل', 'تقرير مقارنة معيارية', 'درس مستفاد'] },
      { id: 'authors', label: 'المؤلفون', type: 'text', req: true },
      { id: 'abstract', label: 'الملخص', type: 'textarea', req: true, full: true },
      { id: 'method', label: 'المنهجية', type: 'textarea' },
      { id: 'findings', label: 'أهم النتائج', type: 'textarea', req: true },
      { id: 'recs', label: 'التوصيات', type: 'textarea', full: true },
      { id: 'link', label: 'رابط الملف الكامل', type: 'url', full: true, hint: 'رابط OneDrive أو SharePoint أو Google Drive' }] },
  feedback: { label: 'ملاحظة', action: 'تقديم ملاحظة', prefix: 'F', desc: 'ملاحظة على خدمة أو مرفق أو تجربة في النادي، تصل مباشرة للجهة المعنية ولا تُنشر للعامة.', private: true,
    fields: [
      { id: 'fbType', label: 'نوع الملاحظة', type: 'select', req: true, options: ['اقتراح تحسين', 'شكوى', 'إشادة', 'ملاحظة عامة'] },
      { id: 'place', label: 'الخدمة أو المرفق المعني', type: 'text', hint: 'مثل: الصالة الرياضية، المكتبة، التسجيل في الأنشطة' },
      { id: 'details', label: 'الملاحظة', type: 'textarea', req: true, full: true },
      { id: 'when', label: 'متى حدث ذلك؟', type: 'text', hint: 'تاريخ أو وقت تقريبي' }] }
};
// الحقل الرئيسي لكل نوع (يُكتب فيه النص عند التفريغ دون ذكاء اصطناعي)
const MAIN_FIELD = { proposal: 'idea', innovation: 'solution', research: 'abstract', feedback: 'details' };
const FLOW = [
  { k: 'received', l: 'مستلم', d: 'تسجيل الطلب برقم مرجعي' },
  { k: 'screening', l: 'فرز أولي', d: 'اكتمال البيانات وارتباطها بالأهداف' },
  { k: 'evaluation', l: 'تقييم اللجنة', d: 'الجدوى والأثر والجِدّة' },
  { k: 'approved', l: 'معتمد', d: 'قرار الاعتماد وتحديد المسؤول' },
  { k: 'implemented', l: 'منفذ / منشور', d: 'قياس الأثر أو النشر في المكتبة' }];
const EXTRA = { revise: 'مطلوب استكمال', rejected: 'غير معتمد' };
const stLabel = k => (FLOW.find(f => f.k === k) || {}).l || EXTRA[k] || 'مستلم';
const LIBSECS = [
  { k: 'research', l: 'دراسات الحالة والبحوث', d: 'البحوث ودراسات الحالة المعتمدة للنشر.' },
  { k: 'innovation', l: 'الابتكارات', d: 'الابتكارات المعتمدة والمنفذة في النادي.' },
  { k: 'proposal', l: 'المقترحات', d: 'المقترحات المعتمدة والمنفذة في النادي.' }];
const LIBKINDS = ['دراسة حالة', 'بحث', 'مرجع ومواصفة', 'دليل وأداة', 'تقرير', 'رابط خارجي'];

const MARK = `<svg viewBox="0 0 300 300" aria-hidden="true"><defs><linearGradient id="mg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#A47A22"/><stop offset=".55" stop-color="#D9A93E"/><stop offset="1" stop-color="#F0C870"/></linearGradient><radialGradient id="mbg"><stop offset="0" stop-color="#E2B865" stop-opacity=".4"/><stop offset="1" stop-color="#E2B865" stop-opacity="0"/></radialGradient></defs><circle cx="150" cy="150" r="136" fill="none" stroke="#C9962F" stroke-width="10"/><circle cx="150" cy="150" r="120" fill="#2A3B63"/><path d="M150 214 C170 160 210 110 268 70 C252 130 214 182 160 220 Z" fill="url(#mg)"/><path d="M152 218 L264 74" stroke="#2A3B63" stroke-width="5" stroke-linecap="round"/><path d="M146 210 L160 222 L132 246 Z" fill="#F3EFE6"/><path d="M132 246 C118 256 96 256 82 243" fill="none" stroke="#D9A93E" stroke-width="7" stroke-linecap="round"/><g transform="translate(82 240) scale(1.55) translate(-93 -118)"><g stroke="#F3EFE6" stroke-width="3" stroke-linecap="round"><path d="M76 66 L95 57"/><path d="M95 57 L112 71"/><path d="M112 71 L108 92"/><path d="M108 92 L101 100"/><path d="M76 66 L72 87"/><path d="M72 87 L84 100"/><path d="M93 80 L76 66"/><path d="M93 80 L112 71"/><path d="M93 80 L72 87"/><path d="M93 80 L108 92"/><path d="M95 57 L93 80"/><path d="M84 100 L101 100"/></g><circle cx="76" cy="66" r="5.8" fill="#F3EFE6"/><circle cx="95" cy="57" r="8.0" fill="#E2B865"/><circle cx="112" cy="71" r="5.2" fill="#F3EFE6"/><circle cx="72" cy="87" r="6.5" fill="#F3EFE6"/><circle cx="93" cy="80" r="7.0" fill="#E2B865"/><circle cx="108" cy="92" r="4.8" fill="#F3EFE6"/><circle cx="84" cy="100" r="4.0" fill="#F3EFE6"/><circle cx="101" cy="100" r="4.0" fill="#F3EFE6"/><g stroke="#F3EFE6" stroke-width="4.4" stroke-linecap="round"><path d="M83 106 L103 106"/><path d="M85.5 112 L100.5 112"/><path d="M88.5 118 L97.5 118"/></g></g></svg>`;
const ICON = {
  proposal: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3Z"/></svg>',
  innovation: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/><circle cx="12" cy="12" r="3"/></svg>',
  feedback: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/><path d="M8.5 10.5h7M8.5 13.5h4.5"/></svg>',
  research: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"/><path d="M8 8h8M8 12h6"/></svg>'
};

/* ============ الحالة ============ */
const S = { user: undefined, plan: null, library: [], pub: [], mine: [], all: [], users: [], libSec: 'research', libQ: '', admF: { type: 'all', status: 'all', q: '' }, lastRef: null, after: null, stratOpen: false, stratTab: 'vm', auth: { step: 'phone', phone: '', until: 0 } };
const isStaff = () => S.user && ['admin', 'reviewer'].includes(S.user.role);
const isAdmin = () => S.user && S.user.role === 'admin';
const plan = () => S.plan || DEFAULT_PLAN;
// الخطة كما تُعرض: النسخة الإنجليزية إن أدخلها المسؤول، وإلا تُترجم النصوص الافتراضية تلقائياً
function planView() {
  const p = plan(), e = p.en;
  if (!isEn() || !e) return p;
  return { ...p, vision: e.vision || p.vision, mission: e.mission || p.mission, goals: e.goals?.length ? e.goals : p.goals, values: e.values?.length ? e.values : p.values };
}
const parseGoals = txt => (txt || '').split('\n').map(l => l.trim()).filter(Boolean).map((l, i) => { const [code, title, aim] = l.split('|').map(x => (x || '').trim()); const c = 'SO' + String(i + 1).padStart(2, '0'); return title ? { code: code || c, title, aim: aim || '' } : { code: c, title: code, aim: '' }; });
const goalsText = gs => (gs || []).map(g => `${g.code} | ${g.title} | ${g.aim || ''}`).join('\n');

/* ============ أدوات ============ */
function toast(t) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2800); }
function openDlg(html) { $('#dlg-body').innerHTML = html; lockScroll(true); try { $('#dlg').showModal(); } catch { $('#dlg').setAttribute('open', ''); } }
function closeDlg() { lockScroll(false); try { $('#dlg').close(); } catch { $('#dlg').removeAttribute('open'); } }
function authError(e) {
  const c = e?.code || e?.message || '';
  if (c.includes('invalid-phone-number') || c.includes('missing-phone-number')) return 'رقم الهاتف غير صحيح. اكتبه هكذا: 05xxxxxxxx';
  if (c.includes('invalid-verification-code') || c.includes('missing-verification-code')) return 'الرمز غير صحيح. تأكد من الأرقام الستة وحاول مجدداً.';
  if (c.includes('code-expired') || c.includes('session-expired')) return 'انتهت صلاحية الرمز. اطلب رمزاً جديداً.';
  if (c.includes('too-many-requests') || c.includes('quota-exceeded')) return 'محاولات كثيرة. انتظر قليلاً ثم حاول مرة أخرى.';
  if (c.includes('billing-not-enabled') || c.includes('operation-not-allowed')) return 'خدمة الرسائل غير مفعّلة بعد في إعدادات المنصة. تواصل مع المسؤول.';
  if (c.includes('captcha')) return 'تعذّر التحقق الأمني. حدّث الصفحة وحاول مرة أخرى.';
  if (c.includes('network')) return 'تعذّر الاتصال. تحقق من الإنترنت.';
  if (c.includes('permission')) return 'لا تملك صلاحية تنفيذ هذا الإجراء.';
  return 'حدث خطأ غير متوقع. حاول مرة أخرى.';
}
function makeRef(type) {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  return `MDD-${TYPES[type].prefix}-${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
function track(st) {
  const idx = FLOW.findIndex(f => f.k === st), rej = st === 'rejected';
  const n = rej ? 3 : st === 'revise' ? 2 : Math.max(idx, 0) + 1;
  return `<div class="track ${rej ? 'rej' : ''}" aria-hidden="true">${FLOW.map((_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div>`;
}
const badgeType = t => `<span class="badge t-${t}">${esc(TYPES[t]?.label || t)}</span>`;
const badgeSt = s => `<span class="badge s-${s}">${esc(stLabel(s))}</span>`;
function detailsKV(s) {
  const t = TYPES[s.type], f = s.fields || {};
  return `<dl class="kv">${t.fields.filter(x => f[x.id]).map(x => `<div><dt>${esc(x.label)}</dt><dd>${x.type === 'url' ? `<a href="${esc(f[x.id])}" target="_blank" rel="noopener" dir="ltr">${esc(f[x.id])}</a>` : x.type === 'select' ? esc(f[x.id]) : `<span translate="no">${esc(f[x.id])}</span>`}</dd></div>`).join('')}</dl>`;
}

/* ============ التوجيه ============ */
const route = () => (location.hash.replace(/^#\/?/, '') || '').split('/');
function go(path) { location.hash = '#/' + path; }
window.addEventListener('hashchange', () => { S.lastRef = null; render(); toTop(); });

async function loadPublic() {
  const [p, lib, pub] = await Promise.all([api.getPlan().catch(() => null), api.listLibrary().catch(() => []), api.publicSubs().catch(() => [])]);
  S.plan = p; S.library = lib; S.pub = pub;
}
async function loadMine() { if (S.user) S.mine = (await api.mySubs(S.user.uid).catch(() => [])).sort((a, b) => b.createdAt - a.createdAt); }
async function loadAdmin() {
  if (!isStaff()) return;
  S.all = (await api.allSubs().catch(() => [])).sort((a, b) => b.createdAt - a.createdAt);
  if (isAdmin()) S.users = await api.listUsers().catch(() => []);
}

/* ============ الإطار ============ */
function shell(inner) {
  const r = route()[0] || '';
  const nav = [['', 'الرئيسية'], ['library', 'مكتبة المعرفة'], ['submit', 'قدّم'], ...(S.user ? [['mine', 'طلباتي']] : []), ...(isStaff() ? [['admin', 'لوحة الإدارة']] : [])];
  const userbox = S.user
    ? `<span class="chip">${esc(ROLES[S.user.role] || 'مشارك')}</span><span style="font-size:.88rem" translate="no">${esc(S.user.name)}</span><button class="btn sm ghost" data-act="logout">خروج</button>`
    : `<a class="btn sm gold" href="#/login">دخول</a>`;
  const demo = isDemo ? `<div class="demo-band"><div class="wrap"><b>وضع تجريبي:</b> البيانات تُحفظ في متصفحك فقط. ${S.user ? '' : 'جرّب:'} ${S.user ? '' : `<button class="btn sm line" data-act="demo" data-who="admin">دخول كمسؤول</button><button class="btn sm line" data-act="demo" data-who="member">دخول كمشارك</button><button class="btn sm line" data-act="demo" data-who="new">رقم جديد</button>`}<button class="btn sm line" data-act="demo-reset">إعادة ضبط البيانات</button></div></div>` : '';
  return `${demo}<header class="topbar"><div class="wrap">
    <a class="brands" href="#/" aria-label="الرئيسية"><img class="lg-ssc" src="assets/ssc-logo.png" alt="مجلس الشارقة الرياضي"><i aria-hidden="true"></i><img class="lg-club" src="assets/club-logo.png" alt="${esc(CONFIG.orgName)}"><i aria-hidden="true"></i><span class="brand">${MARK}<span><b>${esc(CONFIG.platformName)}</b><small>${esc(CONFIG.platformNameEn)}</small></span></span></a>
    <nav class="nav" aria-label="القائمة الرئيسية">${nav.map(([k, l]) => `<a href="#/${k}" class="${(k === r || (k === 'admin' && r === 'admin')) ? 'on' : ''}">${l}</a>`).join('')}</nav>
    <div class="userbox"><button class="btn sm ghost langbtn" data-act="lang" aria-label="${isEn() ? 'العربية' : 'English'}" lang="${isEn() ? 'ar' : 'en'}" translate="no">${isEn() ? 'ع' : 'EN'}</button>${userbox}</div></div></header>
  <main class="wrap">${inner}</main>
  <footer><div class="wrap"><span>${esc(CONFIG.platformName)} · منصة ${esc(CONFIG.orgName)} للمعرفة والابتكار</span><span>منهجية التقييم وفق إرشادات ISO 56002 و ISO 56007</span></div></footer>`;
}

/* ============ الصفحات العامة ============ */
// الختم المتحرك (نفس شعار مِداد، مقسّم لأجزاء تتحرك)
const SEAL = `<svg class="seal" viewBox="0 0 300 300" aria-hidden="true"><defs><linearGradient id="sq" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#A47A22"/><stop offset=".55" stop-color="#D9A93E"/><stop offset="1" stop-color="#F0C870"/></linearGradient><radialGradient id="sbg"><stop offset="0" stop-color="#E2B865" stop-opacity=".4"/><stop offset="1" stop-color="#E2B865" stop-opacity="0"/></radialGradient><radialGradient id="sd" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#2A3B63"/><stop offset="1" stop-color="#16213F"/></radialGradient></defs>
  <circle class="ring" cx="150" cy="150" r="136" fill="none" stroke="#C9962F" stroke-width="4"/>
  <circle class="disc" cx="150" cy="150" r="124" fill="url(#sd)"/>
  <g class="quill"><path d="M186 100 C200 66 224 40 266 18 C252 58 228 86 186 100 Z" fill="url(#sq)"/><path d="M186 100 L266 18" stroke="#1E2D4F" stroke-width="2.2" stroke-linecap="round"/><path d="M205 80 L203 66 M220 64 L219 50 M236 48 L236 36 M212 82 L226 82 M228 66 L242 65" stroke="#1E2D4F" stroke-width="1.8" stroke-linecap="round"/></g>
  <path class="nib" d="M189.6 103.5 L182.4 96.5 L172 114.4 Z" fill="#F3EFE6"/>
  <path class="ink" d="M172 114 C150 131 110 133 93 121" fill="none" stroke="#D9A93E" stroke-width="3" stroke-linecap="round"/>
  <g class="bulb" transform="translate(93 118) scale(1.28) translate(-93 -118)"><circle class="glow" cx="93" cy="80" r="34" fill="url(#sbg)"/><g class="edges" stroke="#F3EFE6" stroke-width="2.2" stroke-linecap="round"><path d="M76 66 L95 57"/><path d="M95 57 L112 71"/><path d="M112 71 L108 92"/><path d="M108 92 L101 100"/><path d="M76 66 L72 87"/><path d="M72 87 L84 100"/><path d="M93 80 L76 66"/><path d="M93 80 L112 71"/><path d="M93 80 L72 87"/><path d="M93 80 L108 92"/><path d="M95 57 L93 80"/><path d="M84 100 L101 100"/></g><g class="nodes"><circle cx="76" cy="66" r="4.6" fill="#F3EFE6"/><circle cx="95" cy="57" r="6.4" fill="#E2B865"/><circle cx="112" cy="71" r="4.2" fill="#F3EFE6"/><circle cx="72" cy="87" r="5.2" fill="#F3EFE6"/><circle cx="93" cy="80" r="5.6" fill="#E2B865"/><circle cx="108" cy="92" r="3.8" fill="#F3EFE6"/><circle cx="84" cy="100" r="3.2" fill="#F3EFE6"/><circle cx="101" cy="100" r="3.2" fill="#F3EFE6"/></g><g class="base" stroke="#F3EFE6" stroke-width="3.4" stroke-linecap="round"><path d="M83 106 L103 106"/><path d="M85.5 112 L100.5 112"/><path d="M88.5 118 L97.5 118"/></g></g>
  <g class="word"><text x="150" y="178" text-anchor="middle" direction="rtl" font-family="Alexandria, Tahoma, sans-serif" font-weight="800" font-size="60" textLength="150" lengthAdjust="spacingAndGlyphs" fill="#F3EFE6">مِداد</text><text x="150" y="212" text-anchor="middle" font-family="Alexandria, Tahoma, sans-serif" font-weight="700" font-size="21" textLength="150" lengthAdjust="spacing" fill="#E2B865">MIDAD</text><path d="M110 236 L190 236" stroke="#6B5A3E" stroke-width="1.5" stroke-linecap="round"/></g></svg>`;
const INK_U = `<svg class="ink-u" viewBox="0 0 240 14" preserveAspectRatio="none" aria-hidden="true"><path d="M3 9 C 48 3, 96 12, 140 7 S 214 4, 237 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;
const words = t => t.split(' ').map(w => `<span class="w"><span>${w}</span></span>`).join(' ');
const head = (title, sub = '') => `<div class="sec-head"><div><h2>${title}</h2>${INK_U}</div>${sub}</div>`;

function pageHome() {
  const p = planView();
  const libCount = S.pub.length + S.library.length;
  const impl = S.pub.filter(s => s.status === 'implemented').length;
  const title = isEn()
    ? `${words('Every idea is')} <span class="w"><span><em>ink</em>,</span></span><br>${words('every experience lasting knowledge.')}`
    : `${words('كل فكرة')} <span class="w"><span><em>مِداد</em>،</span></span><br>${words('وكل تجربة معرفة تبقى.')}`;
  const vals = (p.values || []).map(v => `<span class="mq-item">${esc(v)}</span><svg class="mq-sep" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20 C9 12 14 7 21 3 C18 10 13 15 6 19 Z" fill="currentColor"/></svg>`).join('');
  return `
  <section class="hero">
    <div class="hero-bg" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="hero-in">
      <div class="hero-copy">
        <p class="hero-org">حياكم في منصة ${esc(CONFIG.orgName)}</p>
        <h1 class="hero-title">${title}</h1>
        <svg class="hero-ink" viewBox="0 0 420 22" preserveAspectRatio="none" aria-hidden="true"><path d="M4 14 C 70 4, 150 20, 230 11 S 360 6, 416 12" fill="none" stroke="#D9A93E" stroke-width="3.2" stroke-linecap="round"/></svg>
        <p class="hero-lead">منصة لتقديم المقترحات والابتكارات والبحوث ودراسات الحالة، ومكتبة معرفة مفتوحة للجميع. ادخل برقم هاتفك في أقل من دقيقة وابدأ.</p>
        <div class="acts">${S.user ? `<a class="btn gold lg magnet" href="#/submit">قدّم الآن</a><a class="btn ghost lg" href="#/mine">طلباتي</a>` : `<a class="btn gold lg magnet" href="#/login">ادخل برقم هاتفك</a><a class="btn ghost lg" href="#/library">تصفّح المكتبة</a>`}</div>
      </div>
      <div class="seal-wrap">${SEAL}</div>
    </div>
    <div class="hero-stats">
      <div><b>${libCount}</b><span>عنصر في مكتبة المعرفة</span></div>
      <div><b>${S.pub.filter(s => s.type === 'research').length}</b><span>بحث ودراسة حالة منشورة</span></div>
      <div><b>${S.pub.filter(s => s.type === 'innovation').length}</b><span>ابتكار معتمد</span></div>
      <div><b>${impl}</b><span>فكرة تحولت إلى واقع</span></div>
    </div>
  </section>

  <section class="strat">${head('فكرتك تُسهم في مستقبل النادي')}
    <p class="strat-lead">${isEn() ? `We connect ideas and knowledge to Al Madam Club’s ${esc(p.period || '')} goals, to develop talent, services and institutional performance.` : `نربط الأفكار والمعرفة بأهداف نادي المُدام ${esc(p.period || '')}، لتطوير المواهب والخدمات والأداء المؤسسي.`}</p>
    <button class="strat-toggle" data-act="strat" aria-expanded="${S.stratOpen ? 'true' : 'false'}" aria-controls="strat-panel"><span>${S.stratOpen ? 'إخفاء الاستراتيجية' : 'تعرّف على استراتيجيتنا'}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    <div id="strat-panel" class="strat-panel" ${S.stratOpen ? '' : 'hidden'}><div class="strat-in">
      <div class="strat-tabs" role="tablist" aria-label="الخطة الاستراتيجية">${[['vm', 'الرؤية والرسالة'], ['goals', 'الأهداف'], ['values', 'القيم']].map(([k, l]) => `<button role="tab" id="st-${k}" aria-controls="sp-${k}" aria-selected="${S.stratTab === k}" class="${S.stratTab === k ? 'on' : ''}" data-act="strat-tab" data-k="${k}">${l}</button>`).join('')}</div>
      <div class="strat-pane" id="sp-vm" role="tabpanel" aria-labelledby="st-vm" ${S.stratTab === 'vm' ? '' : 'hidden'}><div class="vm-row">
        <div class="vm vision"><h3>رؤيتنا</h3><p>${esc(p.vision)}</p></div>
        <div class="vm mission"><h3>رسالتنا</h3><p>${esc(p.mission)}</p></div></div></div>
      <div class="strat-pane" id="sp-goals" role="tabpanel" aria-labelledby="st-goals" ${S.stratTab === 'goals' ? '' : 'hidden'}>
        <div class="goals">${(p.goals || []).map(g => `<div class="goal spot"><b>${esc(g.title)}</b>${g.aim ? `<small>${esc(g.aim)}</small>` : ''}</div>`).join('')}</div></div>
      <div class="strat-pane" id="sp-values" role="tabpanel" aria-labelledby="st-values" ${S.stratTab === 'values' ? '' : 'hidden'}>
        <div class="vals">${(p.values || []).map(v => `<span class="val">${esc(v)}</span>`).join('')}</div></div>
      <p class="strat-period">الخطة الاستراتيجية ${esc(p.period || '')}</p>
    </div></div>
  </section>

  <div class="marquee" aria-label="قيمنا"><div class="marquee-track"><div class="mq-set">${vals}</div><div class="mq-set" aria-hidden="true">${vals}</div></div></div>

  <section>${head('ماذا تريد أن تقدّم؟')}
    <div class="doors">${Object.entries(TYPES).map(([k, t]) => `<a class="door spot t-${k}" href="#/submit/${k}"><span class="ico">${ICON[k]}</span><h3>${t.action}</h3><p>${t.desc}</p><span class="go">ابدأ ←</span></a>`).join('')}</div></section>

  <section>${head('رحلة الطلب')}
    <div class="journey"><div class="j-line" aria-hidden="true"><i class="j-fill"></i></div>${FLOW.map(f => `<div class="step lit"><span class="j-dot" aria-hidden="true"></span><b>${f.l}</b><span>${f.d}</span></div>`).join('')}</div></section>`;
}

function libItems() {
  const subs = S.pub.map(s => ({ src: 'sub', id: s.id, section: s.type, kind: s.type === 'research' ? (s.fields?.kind || 'بحث') : (s.status === 'implemented' ? 'منفذ' : 'معتمد'), title: s.title, summary: s.type === 'research' ? s.fields?.abstract : (s.fields?.idea || s.fields?.solution), url: s.fields?.link, date: s.createdAt, author: s.authorName, sub: s }));
  const cur = S.library.map(l => ({ src: 'lib', id: l.id, section: l.section || 'research', kind: l.kind || 'مرجع', title: l.title, summary: l.summary, url: l.url, date: l.createdAt }));
  return [...subs, ...cur];
}
function pageLibrary() {
  const all = libItems(), sec = LIBSECS.find(x => x.k === S.libSec) || LIBSECS[0], q = S.libQ.trim();
  const inSec = all.filter(i => i.section === sec.k), shown = inSec.filter(i => !q || (i.title + ' ' + (i.summary || '') + ' ' + i.kind).includes(q));
  return `<section><div class="sec-head"><div><div class="eyebrow">إدارة المعرفة</div><h2>مكتبة المعرفة</h2><p class="muted">مفتوحة للجميع، ويُضاف إليها كل ما تعتمده لجنة الابتكار.</p></div></div>
    <div class="libtabs" role="tablist">${LIBSECS.map(x => { const n = all.filter(i => i.section === x.k).length; return `<button role="tab" class="libtab ${x.k === sec.k ? 'on' : ''}" data-act="libsec" data-k="${x.k}" aria-selected="${x.k === sec.k}"><b>${x.l}</b><span>${n} ${n === 1 ? 'عنصر' : 'عناصر'}</span></button>`; }).join('')}</div>
    <div class="toolbar"><input id="lib-q" type="search" placeholder="ابحث في ${sec.l}…" value="${esc(S.libQ)}" aria-label="ابحث"><span class="muted" style="font-size:.88rem">${sec.d}</span></div>
    ${shown.length ? `<div class="grid3">${shown.map(i => `<article class="item"><div class="item-top"><span class="badge t-${i.section}">${esc(i.kind)}</span><span class="muted" style="font-size:.8rem">${fmtDate(i.date)}</span></div><h3 translate="no">${esc(i.title)}</h3>${i.summary ? `<p translate="no" class="muted" style="font-size:.9rem;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden">${esc(i.summary)}</p>` : ''}${i.author ? `<div class="meta"><span translate="no">${esc(i.author)}</span></div>` : ''}<div class="actions" style="margin-top:4px">${i.url ? `<a class="btn sm" href="${esc(i.url)}" target="_blank" rel="noopener">فتح الملف</a>` : ''}${i.src === 'sub' ? `<button class="btn sm line" data-act="view" data-id="${esc(i.id)}" data-from="pub">التفاصيل</button>` : ''}${i.src === 'lib' && isStaff() ? `<button class="btn sm danger" data-act="dellib" data-id="${esc(i.id)}">حذف</button>` : ''}</div></article>`).join('')}</div>`
      : `<div class="empty"><b>${inSec.length ? 'لا نتائج مطابقة' : 'لا يوجد محتوى في ' + sec.l + ' بعد'}</b><span>${inSec.length ? 'جرّب كلمة أخرى.' : 'يُضاف هنا كل طلب في هذا القسم فور اعتماده.'}</span></div>`}</section>`;
}

/* ============ الدخول والتسجيل ============ */
const maskPhone = p => p ? p.replace(/^(\+\d{3})(\d{2})(\d+)(\d{3})$/, (_, a, b, m, z) => `${a} ${b} ${'•'.repeat(m.length)} ${z}`) : '';
function authSteps(n) {
  return `<ol class="auth-steps" aria-label="خطوات الدخول">${['رقم الهاتف', 'رمز التحقق', 'بياناتك'].map((l, i) => `<li class="${i < n ? 'done' : i === n ? 'on' : ''}"><i>${i + 1}</i>${l}</li>`).join('')}</ol>`;
}
function pageLogin() {
  const A = S.auth;
  const demoHint = isDemo ? `<div class="msg info">وضع تجريبي: لا تُرسل رسالة فعلية، والرمز دائماً <b dir="ltr">${DEMO_CODE}</b></div>` : '';
  if (A.step === 'code') {
    const left = Math.max(0, Math.ceil((A.until - Date.now()) / 1000));
    return `<section class="panel narrow auth">${authSteps(1)}
      <div class="sec-head"><div><div class="eyebrow">تحقق</div><h2>أدخل الرمز</h2><p class="muted">أرسلنا رمزاً من 6 أرقام إلى <b dir="ltr">${esc(maskPhone(A.phone))}</b></p></div></div>
      <form id="f-code" novalidate class="form" style="grid-template-columns:1fr">
        <div class="field"><label for="otp">رمز التحقق</label><input id="otp" name="code" class="otp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" maxlength="6" dir="ltr" placeholder="••••••" required></div>
      </form>
      <div id="auth-msg" style="margin-top:12px">${demoHint}</div>
      <div class="actions"><button class="btn gold wide" form="f-code" type="submit">دخول</button></div>
      <div class="auth-foot"><button class="linkbtn" data-act="auth-change">تغيير الرقم</button>
        <button class="linkbtn" id="resend" data-act="auth-resend" ${left ? 'disabled' : ''}>${left ? `إعادة الإرسال بعد <span id="cd">${left}</span> ث` : 'إعادة إرسال الرمز'}</button></div>
      <div id="recaptcha"></div></section>`;
  }
  if (A.step === 'profile') {
    return `<section class="panel narrow auth">${authSteps(2)}
      <div class="sec-head"><div><div class="eyebrow">أهلاً بك في ${esc(CONFIG.platformName)}</div><h2>عرّفنا بنفسك</h2><p class="muted">مرة واحدة فقط، وبعدها تدخل برقمك مباشرة.</p></div></div>
      <form id="f-profile" novalidate class="form" style="grid-template-columns:1fr">
        <div class="field"><label for="pf-name">الاسم <span class="req">*</span></label><input id="pf-name" name="name" autocomplete="name" required maxlength="80"></div>
        <div class="field"><label>صفتك <span class="req">*</span></label><div class="choice">${Object.entries(AUDIENCE).map(([k, v], i) => `<label><input type="radio" name="category" value="${k}" ${i === 0 ? 'checked' : ''}><span>${v}</span></label>`).join('')}</div></div>
        <label class="consent"><input type="checkbox" name="ok" required> أوافق على استخدام بياناتي لأغراض المنصة فقط</label>
      </form>
      <div id="auth-msg" style="margin-top:12px"></div>
      <div class="actions"><button class="btn gold wide" form="f-profile" type="submit">ابدأ</button></div></section>`;
  }
  return `<section class="panel narrow auth">${authSteps(0)}
    <div class="sec-head"><div><div class="eyebrow">دخول وتسجيل في خطوة واحدة</div><h2>ادخل برقم هاتفك</h2><p class="muted">نرسل لك رمز تحقق برسالة نصية، وتدخل مباشرة. لا كلمات مرور.</p></div></div>
    <form id="f-phone" novalidate class="form" style="grid-template-columns:1fr">
      <div class="field"><label for="ph">رقم الهاتف المتحرك</label>
        <div class="phone" dir="ltr"><span class="cc">${esc(CONFIG.countryCode || '+971')}</span><input id="ph" name="phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="5X XXX XXXX" value="${esc(A.raw || '')}" required></div>
        <span class="hint">مثال: 0501234567 — ولرقم من دولة أخرى اكتبه مع رمزها: <bdi dir="ltr">+966…</bdi></span></div>
    </form>
    <div id="auth-msg" style="margin-top:12px">${demoHint}</div>
    <div class="actions"><button class="btn gold wide" id="send-code" form="f-phone" type="submit">أرسل الرمز</button></div>
    <div id="recaptcha"></div></section>`;
}

/* ============ التقديم ============ */
function fieldHTML(f) {
  const r = f.req ? ' <span class="req">*</span>' : '';
  let c;
  if (f.type === 'textarea') c = `<textarea id="f-${f.id}" name="${f.id}" ${f.req ? 'required' : ''}></textarea>`;
  else if (f.type === 'select') c = `<select id="f-${f.id}" name="${f.id}" ${f.req ? 'required' : ''}><option value="">اختر…</option>${f.options.map(o => `<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select>`;
  else c = `<input id="f-${f.id}" name="${f.id}" type="${f.type === 'url' ? 'url' : 'text'}" ${f.type === 'url' ? 'dir="ltr" placeholder="https://"' : ''} ${f.req ? 'required' : ''}>`;
  return `<div class="field ${f.full ? 'full' : ''}"><label for="f-${f.id}">${esc(f.label)}${r}</label>${c}${f.hint ? `<span class="hint">${esc(f.hint)}</span>` : ''}</div>`;
}
/* ============ التقديم بالصوت ============ */
const MIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
let recCtl = null;
function dropVoice() { if (recCtl) { recCtl.cancel(); recCtl = null; } if (S.voice?.url) URL.revokeObjectURL(S.voice.url); S.voice = null; }
function voiceHTML(k) {
  const v = S.voice;
  if (v?.blob) return `<div class="voice done" id="voice">
      <div class="voice-row"><span class="voice-ico">${MIC}</span><div class="voice-copy"><b>تسجيلك الصوتي</b><span>${fmtDur(v.dur)} · يُحفظ مع طلبك</span></div></div>
      <audio controls src="${v.url}"></audio>
      ${v.msg ? `<div class="msg ${v.ok ? 'ok' : 'info'}">${v.msg}</div>` : ''}
      <div class="voice-acts"><button type="button" class="btn sm line" data-act="rec">إعادة التسجيل</button><button type="button" class="btn sm line" data-act="rec-del">حذف التسجيل</button></div></div>`;
  const can = micSupported();
  return `<div class="voice" id="voice">
    <div class="voice-row"><button type="button" class="mic" data-act="rec" ${can ? '' : 'disabled'} aria-label="ابدأ التسجيل">${MIC}</button>
      <div class="voice-copy"><b>${k === 'feedback' ? 'قلها بصوتك' : 'قدّمها بصوتك'}</b><span>${can ? 'تحدّث بطريقتك، ويكتب الذكاء الاصطناعي كلامك في النموذج لتراجعه قبل الإرسال. يُحفظ التسجيل مع طلبك.' : 'التسجيل الصوتي غير متاح في هذا المتصفح. يمكنك تعبئة النموذج كتابةً.'}</span></div></div></div>`;
}
function recUI(box) {
  box.className = 'voice recording';
  box.innerHTML = `<div class="voice-row"><button type="button" class="mic live" data-act="rec-stop" aria-label="إيقاف التسجيل"><i></i></button>
    <div class="voice-copy"><b>جارٍ التسجيل… <span class="rec-t" dir="ltr">0:00</span></b><span>اذكر الفكرة، والمشكلة التي تعالجها، وفائدتها. اضغط للإيقاف (حد أقصى ${MAX_SEC / 60} دقائق).</span></div>
    <div class="meter" aria-hidden="true">${'<i></i>'.repeat(18)}</div></div>`;
}
async function beginRec() {
  const box = $('#voice'); if (!box) return;
  dropVoice();
  try {
    let hist = Array(18).fill(0);
    recCtl = await startRecording({
      liveLang: isDemo ? (isEn() ? 'en-US' : 'ar-AE') : null,
      onLevel: l => { hist = [...hist.slice(1), l]; box.querySelectorAll('.meter i').forEach((b, i) => b.style.transform = `scaleY(${0.12 + hist[i] * 0.88})`); },
      onTick: s => { const t = box.querySelector('.rec-t'); if (t) t.textContent = fmtDur(s); },
      onAutoStop: () => endRec()
    });
    recUI(box); translateNow(box);
  } catch (err) {
    recCtl = null;
    box.insertAdjacentHTML('beforeend', `<div class="msg err" style="margin-top:10px">${err?.name === 'NotAllowedError' ? 'لم يُسمح باستخدام الميكروفون. اسمح به من إعدادات المتصفح ثم حاول مرة أخرى.' : 'تعذّر تشغيل الميكروفون في هذا المتصفح.'}</div>`);
  }
}
async function endRec() {
  if (!recCtl) return;
  const ctl = recCtl; recCtl = null;
  const box = $('#voice'); if (box) { box.className = 'voice working'; box.innerHTML = `<div class="voice-row"><span class="spin" aria-hidden="true"></span><div class="voice-copy"><b>جارٍ تحويل صوتك إلى نموذج…</b><span>يستمع الذكاء الاصطناعي للتسجيل ويعبّئ الحقول.</span></div></div>`; }
  const r = await ctl.stop();
  const f = $('#f-sub'), type = f?.dataset.type;
  S.voice = { ...r, type, url: URL.createObjectURL(r.blob) };
  if (r.dur < 2 || r.blob.size < 1500) { S.voice.msg = 'التسجيل قصير جداً. أعد التسجيل وتحدّث لثوانٍ أكثر.'; return paintVoice(); }
  try {
    const out = await aiFill(type, r.blob);
    S.voice.transcript = out.transcript || '';
    const n = applyFill(f, type, out);
    S.voice.ok = true; S.voice.msg = n ? `عبّأ الذكاء الاصطناعي ${n} ${n === 1 ? 'حقلاً' : 'حقول'} من كلامك. راجعها وعدّل ما تريد قبل الإرسال.` : 'لم نجد في التسجيل ما يكفي لتعبئة الحقول. أكملها كتابةً، وسيُحفظ التسجيل مع طلبك.';
  } catch (err) {
    if (err?.code === 'demo-ai' && r.live) {
      S.voice.transcript = r.live;
      const words = r.live.split(/\s+/);
      const n = applyFill(f, type, { title: words.slice(0, 8).join(' ') + (words.length > 8 ? '…' : ''), [MAIN_FIELD[type]]: r.live });
      S.voice.msg = `وضع تجريبي: كُتب نص كلامك في ${n} حقول. التعبئة الذكية لكل الحقول تعمل بعد ربط المنصة بـ Firebase AI.`;
    } else S.voice.msg = err?.code === 'demo-ai' ? 'وضع تجريبي: حُفظ التسجيل. تحويل الصوت إلى نموذج يعمل بعد ربط المنصة بـ Firebase AI.' : 'حُفظ التسجيل، لكن تعذّر تحويله الآن. أكمل الحقول كتابةً، وسيصل التسجيل للجنة مع طلبك.';
  }
  paintVoice();
}
function paintVoice() { const box = $('#voice'), k = $('#f-sub')?.dataset.type; if (!box) return; box.outerHTML = voiceHTML(k); translateNow($('#voice')); }
async function aiFill(type, blob) {
  const t = TYPES[type], en = isEn(), flds = t.fields.filter(x => x.type !== 'url');
  const areas = [...areaOptions(), { code: 'other', label: AREA_UNSURE }];
  const prompt = `أنت مساعد في منصة «مِداد» التابعة لـ${CONFIG.orgName}. المرفق تسجيل صوتي لشخص يقدّم «${t.label}».
المطلوب:
1) transcript: النص الحرفي لما قيل بلغة المتحدث كما هي.
2) عبّئ حقول النموذج التالية مما قيل فقط، بصياغة واضحة ومرتبة ${en ? 'بالإنجليزية' : 'بالعربية الفصحى المبسطة'}، دون إضافة أي معلومة لم تُذكر. اترك الحقل فارغاً ("") إن لم يُذكر ما يخصه.
- title: عنوان قصير معبّر (أقل من 12 كلمة)
- area: رمز المجال الأقرب من: ${areas.map(a => `${a.code} = ${a.label}`).join('، ')}. استخدم other إن لم يتضح.
${flds.map(x => `- ${x.id}: ${x.label}${x.options ? ` — اختر قيمة واحدة حرفياً من: ${x.options.join(' | ')}` : ''}${x.hint ? ` (${x.hint})` : ''}`).join('\n')}`;
  const schema = Sc => Sc.object({
    properties: { transcript: Sc.string(), title: Sc.string(), area: Sc.enumString({ enum: areas.map(a => a.code) }), ...Object.fromEntries(flds.map(x => [x.id, x.options ? Sc.enumString({ enum: x.options }) : Sc.string()])) },
    optionalProperties: ['title', 'area', ...flds.map(x => x.id)]
  });
  return api.voiceToForm({ blob, base64: await blobToBase64(blob), prompt, schema });
}
function applyFill(f, type, out) {
  if (!f || !out) return 0;
  let n = 0;
  const put = (el, v) => { if (!el || !v || !String(v).trim()) return; el.value = String(v).trim(); const fld = el.closest('.field'); fld?.classList.add('ai-filled'); n++; };
  put(f.querySelector('#f-title'), out.title);
  for (const x of TYPES[type].fields) {
    const el = f.querySelector('#f-' + x.id), v = out[x.id];
    if (x.options) { if (x.options.includes(v)) put(el, v); } else put(el, v);
  }
  const ar = out.area && f.querySelector(`input[name=area][value="${CSS.escape(out.area)}"]`);
  if (ar) { ar.checked = true; ar.closest('.area-q')?.classList.add('ai-filled'); n++; }
  return n;
}
// تحميل روابط التسجيلات المحفوظة عند عرضها
function hydrateAudio(root) {
  root?.querySelectorAll('audio[data-audio]:not([src])').forEach(a => api.audioUrl(a.dataset.audio).then(u => { a.src = u; }).catch(() => { a.replaceWith(Object.assign(document.createElement('span'), { className: 'hint', textContent: tr('تعذّر تحميل التسجيل.') })); }));
}
const audioBlock = s => s.audio?.path ? `<div class="voice-saved"><div class="vs-head">${MIC}<b>التسجيل الصوتي</b><span dir="ltr">${fmtDur(s.audio.dur || 0)}</span></div><audio controls preload="none" data-audio="${esc(s.audio.path)}"></audio>${s.transcript ? `<details><summary>النص المفرّغ من التسجيل</summary><p translate="no">${esc(s.transcript)}</p></details>` : ''}</div>` : '';

function pageSubmit(type) {
  if (!S.user) return `<section class="panel narrow" style="text-align:center;display:grid;gap:14px;justify-items:center"><h2>ادخل أولاً لتقديم طلبك</h2><p class="muted">برقم هاتفك ورمز يصلك برسالة، وتتابع بعدها حالة طلبك وقرار اللجنة.</p><div class="actions" style="justify-content:center"><a class="btn gold" href="#/login">ادخل برقم هاتفك</a></div></section>`;
  if (S.lastRef) return `<section class="panel narrow" style="text-align:center;display:grid;gap:12px;justify-items:center"><h2>تم استلام طلبك</h2><p class="muted">احتفظ بالرقم المرجعي لمتابعة الطلب</p><span class="ref">${esc(S.lastRef)}</span><p class="muted">ستجد حالته في «طلباتي»، ويصلك قرار اللجنة مكتوباً فيه.</p><div class="actions" style="justify-content:center"><a class="btn" href="#/mine">متابعة طلباتي</a><a class="btn line" href="#/submit">تقديم طلب آخر</a></div></section>`;
  const k = TYPES[type] ? type : 'proposal', t = TYPES[k];
  if (S.voice && S.voice.type !== k) dropVoice();
  return `<section class="panel"><div class="sec-head"><div><div class="eyebrow">نموذج التقديم</div><h2>${t.action}</h2><p class="muted">${t.desc}</p></div></div>
    <div class="seg" style="margin-bottom:18px">${Object.entries(TYPES).map(([x, y]) => `<a href="#/submit/${x}" class="${x === k ? 'on' : ''}">${y.label}</a>`).join('')}</div>
    ${voiceHTML(k)}
    <form id="f-sub" data-type="${k}" novalidate><div class="form">
      <div class="field full"><label for="f-title">العنوان <span class="req">*</span></label><input id="f-title" name="title" required maxlength="140"></div>
      <fieldset class="field full area-q"><legend>${k === 'feedback' ? 'ما المجال الذي تتعلق به ملاحظتك؟' : 'ما المجال الذي تُسهم فكرتك في تطويره؟'}</legend>
        <div class="areas">${[...areaOptions(), { code: 'other', label: AREA_UNSURE }].map((o, i) => `<label class="area"><input type="radio" name="area" value="${esc(o.code)}" data-label="${esc(o.label)}"><span>${esc(o.label)}</span></label>`).join('')}</div></fieldset>
      ${t.fields.map(fieldHTML).join('')}</div>
      <div id="sub-msg" style="margin-top:14px"></div>
      <div class="actions"><button class="btn gold" type="submit">إرسال ${t.label}</button><span class="hint">الحقول المعلّمة بـ * مطلوبة</span></div></form></section>`;
}

function subCard(s, opts = {}) {
  return `<article class="item"><div class="item-top"><div style="display:flex;gap:6px">${badgeType(s.type)}${badgeSt(s.status)}</div><span class="muted" style="font-size:.8rem" dir="ltr">${esc(s.ref)}</span></div>
    <h3 translate="no">${esc(s.title)}</h3><div class="meta">${s.category ? `<span>${esc(s.category)}</span>` : ''}<span>${fmtDate(s.createdAt)}</span>${opts.author ? `<span><bdi translate="no">${esc(s.authorName)}</bdi> · <span>${esc(AUDIENCE[s.authorCategory] || '')}</span></span>` : ''}</div>
    ${track(s.status)}${s.note ? `<div class="note"><b>ملاحظة اللجنة:</b> <span translate="no">${esc(s.note)}</span></div>` : ''}
    <details><summary>التفاصيل</summary>${detailsKV(s)}${audioBlock(s)}</details></article>`;
}
function pageMine() {
  if (!S.user) return pageSubmit();
  return `<section><div class="sec-head"><div><div class="eyebrow">متابعة</div><h2>طلباتي</h2></div><a class="btn gold sm" href="#/submit">طلب جديد</a></div>
    ${S.mine.length ? `<div class="items">${S.mine.map(s => subCard(s)).join('')}</div>` : `<div class="empty"><b>لم تقدّم أي طلب بعد</b><span>مقترحاتك وابتكاراتك وبحوثك ستظهر هنا مع حالة كل منها.</span><a class="btn sm" href="#/submit">ابدأ أول طلب</a></div>`}</section>`;
}

/* ============ لوحة الإدارة ============ */
function adminShell(sub, inner) {
  const links = [['', 'نظرة عامة'], ['requests', 'الطلبات'], ['library', 'المكتبة'], ...(isAdmin() ? [['plan', 'الخطة الاستراتيجية'], ['users', 'المستخدمون']] : [])];
  return `<div class="admin"><nav class="side" aria-label="أقسام الإدارة"><span class="lbl">لوحة الإدارة</span>${links.map(([k, l]) => `<a href="#/admin/${k}" class="${k === sub ? 'on' : ''}">${l}</a>`).join('')}</nav><div style="display:grid;gap:20px;min-width:0">${inner}</div></div>`;
}
function bars(rows) { const max = Math.max(1, ...rows.map(r => r[1])); return `<div class="bars">${rows.map(([l, v]) => `<div class="bar"><span>${esc(l)}</span><span class="b"><i style="width:${(v / max) * 100}%"></i></span><em>${v}</em></div>`).join('')}</div>`; }
function pageAdmin(sub) {
  if (!S.user) return pageLogin();
  if (!isStaff()) return `<div class="empty"><b>هذه الصفحة للجنة الابتكار ومسؤولي المنصة</b><a class="btn sm" href="#/">العودة للرئيسية</a></div>`;
  const A = S.all;
  if (sub === 'requests') return adminShell(sub, adminRequests());
  if (sub === 'library') return adminShell(sub, adminLibrary());
  if (sub === 'plan' && isAdmin()) return adminShell(sub, adminPlan());
  if (sub === 'users' && isAdmin()) return adminShell(sub, adminUsers());
  const pending = A.filter(s => ['received', 'screening', 'evaluation', 'revise'].includes(s.status)).length;
  const decided = A.filter(s => ['approved', 'implemented', 'rejected'].includes(s.status));
  const rate = decided.length ? Math.round(decided.filter(s => s.status !== 'rejected').length / decided.length * 100) : 0;
  return adminShell('', `<div class="sec-head"><div><div class="eyebrow">لوحة الإدارة</div><h2>نظرة عامة</h2></div><button class="btn sm line" data-act="csv">تصدير الطلبات CSV</button></div>
    <div class="kpis"><div class="stat gold"><b>${A.length}</b><span>إجمالي الطلبات</span></div><div class="stat"><b>${pending}</b><span>قيد الدراسة</span></div><div class="stat"><b>${A.filter(s => ['approved', 'implemented'].includes(s.status)).length}</b><span>معتمد أو منفذ</span></div><div class="stat"><b>${rate}%</b><span>نسبة الاعتماد</span></div></div>
    <div class="two"><div class="card"><h3 style="font-size:1rem;margin-bottom:12px">حسب النوع</h3>${bars(Object.entries(TYPES).map(([k, t]) => [t.label, A.filter(s => s.type === k).length]))}</div>
      <div class="card"><h3 style="font-size:1rem;margin-bottom:12px">حسب المرحلة</h3>${bars([...FLOW.map(f => [f.l, A.filter(s => s.status === f.k).length]), [EXTRA.revise, A.filter(s => s.status === 'revise').length], [EXTRA.rejected, A.filter(s => s.status === 'rejected').length]])}</div></div>
    <div class="card"><h3 style="font-size:1rem;margin-bottom:12px">حسب المجال الاستراتيجي</h3>${bars([...areaOptions().map(o => [o.label, A.filter(s => s.goal === o.code).length]), [AREA_UNSURE, A.filter(s => s.goal === 'other').length]])}</div>
    <div class="two"><div class="card"><h3 style="font-size:1rem;margin-bottom:12px">حسب صفة المقدّم</h3>${bars(Object.entries(AUDIENCE).map(([k, l]) => [l, A.filter(s => s.authorCategory === k).length]))}</div>
      <div class="card"><h3 style="font-size:1rem;margin-bottom:12px">أحدث الطلبات</h3>${A.slice(0, 5).map(s => `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--line)"><a href="#" data-act="view" data-id="${esc(s.id)}" data-from="all" style="text-decoration:none" translate="no">${esc(s.title)}</a>${badgeSt(s.status)}</div>`).join('') || '<p class="muted">لا توجد طلبات بعد.</p>'}</div></div>`);
}
function adminRequests() {
  const F = S.admF, q = F.q.trim();
  const list = S.all.filter(s => (F.type === 'all' || s.type === F.type) && (F.status === 'all' || (F.status === 'open' ? ['received', 'screening', 'evaluation', 'revise'].includes(s.status) : s.status === F.status)) && (!q || (s.title + s.ref + (s.authorName || '')).includes(q)));
  return `<div class="sec-head"><div><div class="eyebrow">لجنة الابتكار</div><h2>الطلبات</h2><p class="muted">${list.length} من ${S.all.length}</p></div><button class="btn sm line" data-act="csv">تصدير CSV</button></div>
    <div class="toolbar"><input id="adm-q" type="search" placeholder="بحث بالعنوان أو الرقم أو الاسم" value="${esc(F.q)}">
      <select id="adm-type" aria-label="النوع"><option value="all">كل الأنواع</option>${Object.entries(TYPES).map(([k, t]) => `<option value="${k}" ${F.type === k ? 'selected' : ''}>${t.label}</option>`).join('')}</select>
      <select id="adm-status" aria-label="المرحلة"><option value="all">كل المراحل</option><option value="open" ${F.status === 'open' ? 'selected' : ''}>قيد الدراسة</option>${[...FLOW.map(f => [f.k, f.l]), ...Object.entries(EXTRA)].map(([k, l]) => `<option value="${k}" ${F.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    ${list.length ? `<div class="tablebox"><table><thead><tr><th>الرقم</th><th>العنوان</th><th>النوع</th><th>المقدّم</th><th>التاريخ</th><th>المرحلة</th></tr></thead><tbody>${list.map(s => `<tr class="click" data-act="view" data-id="${esc(s.id)}" data-from="all"><td dir="ltr" style="white-space:nowrap">${esc(s.ref)}</td><td translate="no">${esc(s.title)}</td><td>${badgeType(s.type)}</td><td><span translate="no">${esc(s.authorName)}</span><br><span class="muted" style="font-size:.78rem">${esc(AUDIENCE[s.authorCategory] || '')}</span></td><td style="white-space:nowrap">${fmtDate(s.createdAt)}</td><td>${badgeSt(s.status)}</td></tr>`).join('')}</tbody></table></div>` : `<div class="empty"><b>لا توجد طلبات مطابقة</b></div>`}`;
}
function reviewForm(s) {
  const opts = [...FLOW.map(f => [f.k, f.l]), ...Object.entries(EXTRA)];
  return `<form class="review" data-review="${esc(s.id)}"><div class="field"><label for="rs">قرار المرحلة</label><select id="rs" name="status">${opts.map(([k, l]) => `<option value="${k}" ${k === s.status ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="field"><label for="rn">ملاحظة لمقدّم الطلب</label><input id="rn" name="note" value="${esc(s.note || '')}" placeholder="سبب القرار أو المطلوب استكماله"></div><button class="btn" type="submit">حفظ القرار</button></form>`;
}
function adminLibrary() {
  return `<div class="sec-head"><div><div class="eyebrow">إدارة المعرفة</div><h2>إضافة إلى المكتبة</h2><p class="muted">الطلبات المعتمدة تُضاف تلقائياً. استخدم هذا النموذج للمراجع الإضافية.</p></div></div>
    <form id="f-lib" class="panel" novalidate><div class="form">
      <div class="field full"><label for="l-title">العنوان <span class="req">*</span></label><input id="l-title" name="title" required></div>
      <div class="field"><label for="l-sec">القسم</label><select id="l-sec" name="section">${LIBSECS.map(x => `<option value="${x.k}">${x.l}</option>`).join('')}</select></div>
      <div class="field"><label for="l-kind">النوع</label><select id="l-kind" name="kind">${LIBKINDS.map(k => `<option value="${k}">${k}</option>`).join('')}</select></div>
      <div class="field full"><label for="l-url">الرابط</label><input id="l-url" name="url" type="url" dir="ltr" placeholder="https://"></div>
      <div class="field full"><label for="l-sum">نبذة</label><textarea id="l-sum" name="summary"></textarea></div></div>
      <div id="lib-msg" style="margin-top:12px"></div><div class="actions"><button class="btn gold" type="submit">إضافة</button></div></form>
    <div class="card"><h3 style="font-size:1rem;margin-bottom:10px">المراجع المضافة (${S.library.length})</h3>${S.library.length ? S.library.map(l => `<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line)"><span><span translate="no">${esc(l.title)}</span> <span class="muted" style="font-size:.8rem">· ${esc((LIBSECS.find(x => x.k === l.section) || {}).l || '')}</span></span><button class="btn sm danger" data-act="dellib" data-id="${esc(l.id)}">حذف</button></div>`).join('') : '<p class="muted">لا توجد مراجع مضافة.</p>'}</div>`;
}
function adminPlan() {
  const p = plan();
  return `<div class="sec-head"><div><div class="eyebrow">مكتب التخطيط الاستراتيجي</div><h2>الخطة الاستراتيجية</h2></div></div>
    <form id="f-plan" class="panel" novalidate><div class="form">
      <div class="field"><label for="p-period">الفترة</label><input id="p-period" name="period" value="${esc(p.period || '')}"></div><div></div>
      <div class="field full"><label for="p-vision">الرؤية</label><textarea id="p-vision" name="vision">${esc(p.vision)}</textarea></div>
      <div class="field full"><label for="p-mission">الرسالة</label><textarea id="p-mission" name="mission">${esc(p.mission)}</textarea></div>
      <div class="field full"><label for="p-goals">الأهداف</label><textarea id="p-goals" name="goals" style="min-height:200px">${esc(goalsText(p.goals))}</textarea><span class="hint">هدف في كل سطر بالصيغة: الرمز | العنوان | الغاية</span></div>
      <div class="field full"><label for="p-values">القيم</label><input id="p-values" name="values" value="${esc((p.values || []).join('، '))}"><span class="hint">افصل بينها بفاصلة</span></div></div>
      <details class="en-plan" ${p.en ? 'open' : ''}><summary>النسخة الإنجليزية (اختياري)</summary><p class="hint">تظهر لمن يتصفح المنصة بالإنجليزية. اتركها فارغة لاستخدام الترجمة الافتراضية.</p>
      <div class="form" dir="ltr" lang="en">
        <div class="field full"><label for="p-vision-en">الرؤية بالإنجليزية</label><textarea id="p-vision-en" name="vision_en">${esc(p.en?.vision || '')}</textarea></div>
        <div class="field full"><label for="p-mission-en">الرسالة بالإنجليزية</label><textarea id="p-mission-en" name="mission_en">${esc(p.en?.mission || '')}</textarea></div>
        <div class="field full"><label for="p-goals-en">الأهداف بالإنجليزية</label><textarea id="p-goals-en" name="goals_en" style="min-height:160px" placeholder="SO01 | Title | Aim">${esc(goalsText(p.en?.goals))}</textarea></div>
        <div class="field full"><label for="p-values-en">القيم بالإنجليزية</label><input id="p-values-en" name="values_en" value="${esc((p.en?.values || []).join(', '))}"></div></div></details>
      <div class="actions"><button class="btn gold" type="submit">حفظ الخطة</button></div></form>`;
}
function adminUsers() {
  const U = [...S.users].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return `<div class="sec-head"><div><div class="eyebrow">المشاركون</div><h2>المستخدمون (${U.length})</h2></div></div>
    <div class="kpis">${Object.entries(AUDIENCE).map(([k, l]) => `<div class="stat"><b>${U.filter(u => u.category === k).length}</b><span>${l}</span></div>`).join('')}<div class="stat gold"><b>${U.filter(u => u.role !== 'participant').length}</b><span>لجنة ومسؤولون</span></div></div>
    <div class="tablebox"><table><thead><tr><th>الاسم</th><th>الهاتف</th><th>الصفة</th><th>تاريخ التسجيل</th><th>الدور</th></tr></thead><tbody>${U.map(u => `<tr><td translate="no">${esc(u.name)}</td><td dir="ltr" style="white-space:nowrap">${esc(u.phone || '—')}</td><td>${esc(AUDIENCE[u.category] || '')}</td><td style="white-space:nowrap">${fmtDate(u.createdAt)}</td><td>${u.uid === S.user.uid ? `<span class="chip">${ROLES[u.role]}</span>` : `<select data-role="${esc(u.uid)}" aria-label="دور ${esc(u.name)}">${Object.entries(ROLES).map(([k, l]) => `<option value="${k}" ${u.role === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`}</td></tr>`).join('')}</tbody></table></div>`;
}

/* ============ العرض ============ */
async function render() {
  if (S.user === undefined) return;
  const [r, sub] = route();
  if (r === 'mine') await loadMine();
  if (r === 'admin') await loadAdmin();
  const pages = { '': pageHome, library: pageLibrary, login: () => S.user ? (go(S.after || ''), '') : pageLogin(), register: () => (go('login'), ''), submit: () => pageSubmit(sub), mine: pageMine, admin: () => pageAdmin(sub || '') };
  const html = shell((pages[r] || pageHome)()), key = location.hash, entered = key !== S.lastKey;
  S.lastKey = key;
  const app = $('#app'); app.innerHTML = html;
  document.body.dataset.page = r || 'home';
  translateNow(app);
  afterRender(app, { entered, page: (pages[r] ? r : '') || 'home' });
  hydrateAudio(app);
}

/* ============ الأحداث ============ */
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act;
  if (b.tagName === 'A') e.preventDefault();
  if (act === 'lang') { setLang(isEn() ? 'ar' : 'en'); closeDlg(); render(); }
  else if (act === 'logout') { await api.signOut(); go(''); toast('تم تسجيل الخروج'); }
  else if (act === 'demo') {
    const P = api.demoPhones(), ph = b.dataset.who === 'admin' ? P.admin : b.dataset.who === 'member' ? P.member : '+97150' + String(Math.floor(1e6 + Math.random() * 8e6));
    S.after = b.dataset.who === 'admin' ? 'admin' : 'submit';
    S.auth = { step: 'phone', raw: ph.replace(/^\+971/, '0') }; if (route()[0] !== 'login') go('login'); else render();
    setTimeout(() => { const i = $('#ph'); if (i) i.focus(); }, 50);
  }
  else if (act === 'auth-change') { S.auth = { step: 'phone', raw: S.auth.raw }; render(); }
  else if (act === 'auth-resend') { if (Date.now() < S.auth.until) return; await sendCode(S.auth.phone, b); }
  else if (act === 'demo-reset') api.resetDemo();
  else if (act === 'rec') beginRec();
  else if (act === 'rec-stop') endRec();
  else if (act === 'rec-del') { dropVoice(); paintVoice(); document.querySelectorAll('.ai-filled').forEach(x => x.classList.remove('ai-filled')); }
  else if (act === 'strat') {
    S.stratOpen = !S.stratOpen;
    b.setAttribute('aria-expanded', S.stratOpen); b.querySelector('span').textContent = tr(S.stratOpen ? 'إخفاء الاستراتيجية' : 'تعرّف على استراتيجيتنا');
    expand($('#strat-panel'), S.stratOpen);
  }
  else if (act === 'strat-tab') {
    S.stratTab = b.dataset.k;
    document.querySelectorAll('.strat-tabs [role=tab]').forEach(t => { const on = t.dataset.k === S.stratTab; t.classList.toggle('on', on); t.setAttribute('aria-selected', on); });
    document.querySelectorAll('.strat-pane').forEach(pn => { pn.hidden = pn.id !== 'sp-' + S.stratTab; });
    reveal($('#sp-' + S.stratTab));
  }
  else if (act === 'libsec') { S.libSec = b.dataset.k; render(); }
  else if (act === 'view') {
    const src = b.dataset.from === 'all' ? S.all : S.pub, s = src.find(x => x.id === b.dataset.id); if (!s) return;
    openDlg(`<div class="sec-head"><div style="display:flex;gap:6px">${badgeType(s.type)}${badgeSt(s.status)}</div><button class="btn sm line" data-act="close">إغلاق</button></div><h2 style="font-size:1.3rem" translate="no">${esc(s.title)}</h2>
      <div class="meta" style="margin-top:6px"><span dir="ltr">${esc(s.ref)}</span>${s.category ? `<span>${esc(s.category)}</span>` : ''}<span>${fmtDate(s.createdAt)}</span><span translate="no">${esc(s.authorName)}</span>${isStaff() && (s.authorPhone || s.authorEmail) ? `<span dir="ltr">${esc(s.authorPhone || s.authorEmail)}</span>` : ''}</div>
      <div style="margin-top:10px">${track(s.status)}</div>${detailsKV(s)}${isStaff() || s.authorId === S.user?.uid ? audioBlock(s) : ''}${b.dataset.from === 'all' && isStaff() ? reviewForm(s) : ''}`);
    translateNow($('#dlg-body')); hydrateAudio($('#dlg-body'));
  }
  else if (act === 'close') closeDlg();
  else if (act === 'dellib') { if (b.dataset.confirm !== '1') { b.dataset.confirm = '1'; b.textContent = 'تأكيد الحذف'; return; } await api.delLibrary(b.dataset.id); S.library = await api.listLibrary(); toast('تم الحذف'); render(); }
  else if (act === 'csv') {
    const head = ['الرقم المرجعي', 'النوع', 'العنوان', 'المجال الاستراتيجي', 'المرحلة', 'المقدّم', 'الهاتف', 'الصفة', 'التاريخ', 'ملاحظة اللجنة', 'تسجيل صوتي'];
    const rows = S.all.map(s => [s.ref, tr(TYPES[s.type]?.label), s.title, tr(s.category), tr(stLabel(s.status)), s.authorName, s.authorPhone || s.authorEmail || '', tr(AUDIENCE[s.authorCategory] || ''), new Date(s.createdAt).toISOString().slice(0, 10), s.note || '', s.audio?.path ? tr('نعم') : '']);
    const csv = '﻿' + [head.map(tr), ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = `midad-requests-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'lib-q') { S.libQ = e.target.value; const pos = e.target.selectionStart; render().then(() => { const i = $('#lib-q'); if (i) { i.focus(); try { i.setSelectionRange(pos, pos); } catch { } } }); }
  if (e.target.id === 'adm-q') { S.admF.q = e.target.value; const pos = e.target.selectionStart; render().then(() => { const i = $('#adm-q'); if (i) { i.focus(); try { i.setSelectionRange(pos, pos); } catch { } } }); }
});
document.addEventListener('change', async e => {
  if (e.target.id === 'adm-type') { S.admF.type = e.target.value; render(); }
  if (e.target.id === 'adm-status') { S.admF.status = e.target.value; render(); }
  if (e.target.dataset.role) { try { await api.setRole(e.target.dataset.role, e.target.value); toast('تم تحديث الدور'); } catch (err) { toast(authError(err)); } }
});
document.addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target, fd = new FormData(f), btn = f.querySelector('[type=submit]') || document.querySelector(`[form="${f.id}"]`);
  const missing = [...f.querySelectorAll('[required]')].filter(x => x.type === 'checkbox' ? !x.checked : !x.value.trim());
  const showMsg = (sel, html) => { const m = $(sel); if (m) m.innerHTML = html; };
  if (f.id === 'f-phone') {
    const raw = fd.get('phone').trim(), phone = normalizePhone(raw);
    S.auth.raw = raw;
    if (!phone) return showMsg('#auth-msg', '<div class="msg err">اكتب رقم هاتف صحيحاً، مثل 0501234567</div>');
    await sendCode(phone, btn);
  }
  else if (f.id === 'f-code') {
    const code = (fd.get('code') || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\D/g, '');
    if (code.length !== 6) return showMsg('#auth-msg', '<div class="msg err">الرمز مكوّن من 6 أرقام.</div>');
    btn.disabled = true; btn.textContent = 'جارٍ التحقق…';
    try {
      const u = await api.verifyCode(code);
      if (u?.needsProfile) { S.auth = { ...S.auth, step: 'profile' }; render(); setTimeout(() => $('#pf-name')?.focus(), 30); }
      else { S.auth = { step: 'phone' }; toast(`أهلاً ${u?.name || ''}`.trim()); }
    } catch (err) { btn.disabled = false; btn.textContent = 'دخول'; showMsg('#auth-msg', `<div class="msg err">${authError(err)}</div>`); const i = $('#otp'); if (i) { i.select(); i.focus(); } }
  }
  else if (f.id === 'f-profile') {
    const name = (fd.get('name') || '').trim();
    if (!name) return showMsg('#auth-msg', '<div class="msg err">اكتب اسمك.</div>');
    if (!fd.get('ok')) return showMsg('#auth-msg', '<div class="msg err">وافق على شرط استخدام البيانات للمتابعة.</div>');
    btn.disabled = true;
    try { const u = await api.completeProfile({ name, category: fd.get('category') || 'public' }); S.auth = { step: 'phone' }; S.user = u; toast('أهلاً بك في مِداد'); go(S.after || 'submit'); S.after = null; }
    catch (err) { btn.disabled = false; showMsg('#auth-msg', `<div class="msg err">${authError(err)}</div>`); }
  }
  else if (f.id === 'f-sub') {
    const areaEl = f.querySelector('input[name=area]:checked');
    if (missing.length) { showMsg('#sub-msg', `<div class="msg err">أكمل الحقول المطلوبة (${missing.length}) قبل الإرسال.</div>`); missing[0].focus(); return; }
    const url = f.querySelector('input[type=url]'); if (url && url.value && !/^https?:\/\//i.test(url.value.trim())) return showMsg('#sub-msg', '<div class="msg err">الرابط يجب أن يبدأ بـ https://</div>');
    const type = f.dataset.type, fields = {}; TYPES[type].fields.forEach(x => { const v = (fd.get(x.id) || '').toString().trim(); if (v) fields[x.id] = v; });
    const ref = makeRef(type), now = Date.now();
    btn.disabled = true; btn.textContent = 'جارٍ الإرسال…';
    try {
      const v = S.voice?.blob && S.voice.type === type ? S.voice : null;
      const extra = v ? { audio: { path: await api.uploadAudio(v.blob, S.user.uid), dur: v.dur, mime: v.mime }, transcript: v.transcript || '' } : {};
      await api.addSub({ ...extra, type, ref, title: fd.get('title').trim(), category: areaEl?.dataset.label || '', goal: areaEl?.value || '', fields, authorId: S.user.uid, authorName: S.user.name, authorPhone: S.user.phone || '', authorCategory: S.user.category || 'public', status: 'received', note: '', history: [{ status: 'received', at: now }], createdAt: now, updatedAt: now });
      dropVoice(); S.lastRef = ref; render(); toTop();
    } catch (err) { btn.disabled = false; btn.textContent = 'إرسال'; showMsg('#sub-msg', `<div class="msg err">${authError(err)}</div>`); }
  }
  else if (f.dataset.review) {
    const s = S.all.find(x => x.id === f.dataset.review), st = fd.get('status'), note = fd.get('note').trim();
    if (s.status === st && (s.note || '') === note) return closeDlg();
    const history = [...(s.history || []), { status: st, at: Date.now(), by: S.user.uid }].slice(-30);
    btn.disabled = true; try { await api.updateSub(s.id, { status: st, note, history, updatedAt: Date.now() }); Object.assign(s, { status: st, note, history }); closeDlg(); toast('تم حفظ القرار'); await loadPublic(); render(); } catch (err) { btn.disabled = false; toast(authError(err)); }
  }
  else if (f.id === 'f-lib') {
    const title = fd.get('title').trim(), url = fd.get('url').trim();
    if (!title) return showMsg('#lib-msg', '<div class="msg err">العنوان مطلوب.</div>');
    if (url && !/^https?:\/\//i.test(url)) return showMsg('#lib-msg', '<div class="msg err">الرابط يجب أن يبدأ بـ https://</div>');
    btn.disabled = true; await api.addLibrary({ title, section: fd.get('section'), kind: fd.get('kind'), url, summary: fd.get('summary').trim() }); S.library = await api.listLibrary(); toast('تمت الإضافة إلى المكتبة'); render();
  }
  else if (f.id === 'f-plan') {
    const goals = parseGoals(fd.get('goals'));
    const data = { period: fd.get('period').trim(), vision: fd.get('vision').trim(), mission: fd.get('mission').trim(), goals, values: fd.get('values').split(/[،,]/).map(x => x.trim()).filter(Boolean) };
    const en = { vision: (fd.get('vision_en') || '').trim(), mission: (fd.get('mission_en') || '').trim(), goals: parseGoals(fd.get('goals_en')), values: (fd.get('values_en') || '').split(',').map(x => x.trim()).filter(Boolean) };
    if (en.vision || en.mission || en.goals.length || en.values.length) data.en = en;
    btn.disabled = true; try { await api.savePlan(data); S.plan = data; toast('تم حفظ الخطة'); render(); } catch (err) { btn.disabled = false; toast(authError(err)); }
  }
});

/* ============ رمز التحقق ============ */
let cdTimer = null;
function startCountdown() {
  clearInterval(cdTimer);
  cdTimer = setInterval(() => {
    const b = $('#resend'); if (!b || S.auth.step !== 'code') return clearInterval(cdTimer);
    const left = Math.max(0, Math.ceil((S.auth.until - Date.now()) / 1000));
    if (left) b.innerHTML = `إعادة الإرسال بعد <span id="cd">${left}</span> ث`; else { b.disabled = false; b.textContent = 'إعادة إرسال الرمز'; clearInterval(cdTimer); }
  }, 1000);
}
async function sendCode(phone, btn) {
  const label = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = 'جارٍ الإرسال…'; }
  try {
    await api.sendCode(phone, 'recaptcha');
    S.auth = { ...S.auth, step: 'code', phone, until: Date.now() + 60000 };
    render(); startCountdown(); setTimeout(() => $('#otp')?.focus(), 30);
    toast('أُرسل رمز التحقق');
  } catch (err) {
    if (btn) { btn.disabled = false; btn.textContent = label; }
    const m = $('#auth-msg'); if (m) m.innerHTML = `<div class="msg err">${authError(err)}</div>`;
  }
}
document.addEventListener('input', e => {
  if (e.target.id === 'otp') { const v = e.target.value.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\D/g, '').slice(0, 6); e.target.value = v; if (v.length === 6) e.target.form.requestSubmit(); }
});

/* ============ التشغيل ============ */
applyLang();
startTranslator();
initMotion();
$('#dlg').addEventListener('close', () => lockScroll(false));
await loadPublic();
api.onAuth(async u => {
  if (u?.needsProfile) { S.user = null; S.auth = { ...S.auth, step: 'profile', phone: u.phone }; if (route()[0] !== 'login') { go('login'); return; } render(); return; }
  S.user = u;
  const [r] = route();
  if (u && (r === 'login' || r === 'register')) { const to = S.after || (u.role !== 'participant' ? 'admin' : 'submit'); S.after = null; go(to); return; }
  render();
});
