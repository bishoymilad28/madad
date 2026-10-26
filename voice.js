// التسجيل الصوتي: MediaRecorder + مقياس مستوى الصوت + (في الوضع التجريبي) تفريغ مباشر عبر متصفح المستخدم
export const micSupported = () => !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
const MIMES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
export const MAX_SEC = 180;

export async function startRecording({ onLevel, onTick, onAutoStop, liveLang } = {}) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const mime = MIMES.find(m => MediaRecorder.isTypeSupported?.(m)) || '';
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined);
  const chunks = []; rec.ondataavailable = e => e.data.size && chunks.push(e.data);
  const t0 = Date.now();

  // مقياس المستوى
  let ac = null, raf = 0;
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    const an = ac.createAnalyser(); an.fftSize = 512; ac.createMediaStreamSource(stream).connect(an);
    const buf = new Uint8Array(an.fftSize);
    const loop = () => { an.getByteTimeDomainData(buf); let s = 0; for (const v of buf) { const x = (v - 128) / 128; s += x * x; } onLevel?.(Math.min(1, Math.sqrt(s / buf.length) * 3.2)); raf = requestAnimationFrame(loop); };
    loop();
  } catch { }
  const tick = setInterval(() => { const sec = Math.floor((Date.now() - t0) / 1000); onTick?.(sec); if (sec >= MAX_SEC) onAutoStop?.(); }, 250);

  // تفريغ مباشر (اختياري) عبر خدمة التعرف على الكلام في المتصفح
  let live = '', sr = null;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (liveLang && SR) {
    try {
      sr = new SR(); sr.lang = liveLang; sr.continuous = true; sr.interimResults = false;
      sr.onresult = e => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) live += e.results[i][0].transcript + ' '; };
      sr.onerror = () => { }; sr.start();
    } catch { sr = null; }
  }
  rec.start(1000);

  const cleanup = () => { clearInterval(tick); cancelAnimationFrame(raf); try { ac?.close(); } catch { } stream.getTracks().forEach(t => t.stop()); try { sr?.stop(); } catch { } };
  return {
    stop: () => new Promise(res => {
      rec.onstop = () => { cleanup(); const type = (rec.mimeType || mime || 'audio/webm').split(';')[0]; setTimeout(() => res({ blob: new Blob(chunks, { type }), mime: type, dur: Math.round((Date.now() - t0) / 1000), live: live.trim() }), sr ? 400 : 0); };
      rec.stop();
    }),
    cancel: () => { rec.onstop = null; try { rec.stop(); } catch { } cleanup(); }
  };
}

export const fmtDur = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
export const blobToBase64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onloadend = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
