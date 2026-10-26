// الحركة في مِداد: GSAP + ScrollTrigger + Lenis
// تأثيرات مستوحاة من React Bits و 21st.dev ومكتوبة هنا بجافاسكربت عادية (المنصة لا تستخدم React):
//   BlurText (ظهور العنوان كلمةً كلمة) · CountUp (عدّ الأرقام) · SpotlightCard (ضوء يتبع المؤشر)
//   Magnet (زر ينجذب للمؤشر) · ScrollVelocity (شريط القيم يتسارع مع التمرير) · Aurora (خلفية متحركة)
// الفكرة: الحبر يُكتب وأنت تقرأ — الريشة تكتب في الواجهة، وخط الحبر يُرسم تحت العناوين ومسار الطلب مع التمرير.
// كل شيء يتوقف تلقائياً لمن فعّل «تقليل الحركة» في جهازه، والمنصة تعمل كاملة بدون هذه المكتبات.

const G = window.gsap, ST = window.ScrollTrigger, Lenis = window.Lenis;
const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
export const motionOn = !!G && !reduce;

let lenis = null, ctx = null, tickers = [];

export function initMotion() {
  // شريط التنقل يتغير شكله بعد بداية التمرير (يعمل حتى بدون المكتبات)
  const onScroll = () => document.body.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (!motionOn) return;
  if (ST) G.registerPlugin(ST);
  if (Lenis) {
    lenis = new Lenis({ autoRaf: false, lerp: 0.11, smoothWheel: true, wheelMultiplier: 1 });
    if (ST) lenis.on('scroll', ST.update);
    G.ticker.add(t => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
  }
  // Spotlight: ضوء ذهبي يتبع المؤشر داخل البطاقات
  document.addEventListener('pointermove', e => {
    const c = e.target.closest?.('.spot'); if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', `${e.clientX - r.left}px`); c.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });
  // Magnet: الزر الأساسي ينجذب قليلاً نحو المؤشر
  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    document.querySelectorAll('.magnet').forEach(el => {
      const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy, near = Math.hypot(dx, dy) < Math.max(r.width, 90);
      G.to(el, { x: near ? dx * 0.22 : 0, y: near ? dy * 0.3 : 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
    });
  }, { passive: true });
}

// فتح وإغلاق لوحة بحركة ارتفاع ناعمة (لوحة «تعرّف على استراتيجيتنا»)
export function expand(el, open) {
  if (!el) return;
  if (!motionOn) { el.hidden = !open; return; }
  G.killTweensOf(el);
  if (open) {
    el.hidden = false;
    G.fromTo(el, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.6, ease: 'power3.out', clearProps: 'height,opacity', onComplete: () => ST && ST.refresh() });
    reveal(el.querySelector('.strat-pane:not([hidden])'), 0.15);
  } else {
    G.to(el, { height: 0, opacity: 0, duration: 0.45, ease: 'power3.inOut', onComplete: () => { el.hidden = true; G.set(el, { clearProps: 'height,opacity' }); ST && ST.refresh(); } });
  }
}
// عناصر اللوحة تظهر تباعاً عند فتحها أو التنقل بين تبويباتها
export function reveal(pane, delay = 0) {
  if (!motionOn || !pane) return;
  const items = pane.querySelectorAll('.vm, .goal, .val');
  G.fromTo(items, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, delay, ease: 'power3.out', clearProps: 'all' });
}

export function toTop() { if (lenis) lenis.scrollTo(0, { immediate: true }); else window.scrollTo(0, 0); }
export function lockScroll(on) { if (lenis) on ? lenis.stop() : lenis.start(); }

const draw = (el, vars = {}) => {
  const len = el.getTotalLength?.() || 300;
  G.set(el, { strokeDasharray: `${len} ${len * 2}`, strokeDashoffset: len + 2 });
  return G.to(el, { strokeDashoffset: 0, ease: 'power2.inOut', duration: 1.2, ...vars });
};
const countUp = (el, vars = {}) => {
  const raw = el.textContent.trim(), m = raw.match(/^(\d+)(.*)$/); if (!m) return;
  const end = +m[1], suf = m[2], o = { v: 0 };
  el.textContent = '0' + suf;
  return G.to(o, { v: end, duration: Math.min(1.6, 0.6 + end / 40), ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v) + suf; }, ...vars });
};
const onView = (trigger, fn, start = 'top 86%') => ST ? ST.create({ trigger, start, once: true, onEnter: fn }) : fn();

// يُستدعى بعد كل عرض للصفحة. entered = انتقال لصفحة جديدة (وليس إعادة رسم بسبب البحث مثلاً)
export function afterRender(root, { entered, page }) {
  if (!motionOn) return;
  if (ctx) ctx.revert();
  tickers.forEach(f => G.ticker.remove(f)); tickers = [];
  ctx = G.context(() => {
    const dirRtl = document.documentElement.dir !== 'ltr';
    if (page === 'home') home(root, entered, dirRtl);
    else if (entered) {
      const main = root.querySelector('main');
      G.from(main.children, { opacity: 0, y: 16, duration: 0.5, stagger: 0.07, ease: 'power3.out', clearProps: 'all' });
      const cards = root.querySelectorAll('.grid3 .item, .items .item, .libtab');
      if (cards.length) G.from(cards, { opacity: 0, y: 18, duration: 0.5, stagger: 0.04, delay: 0.1, ease: 'power3.out', clearProps: 'all' });
      root.querySelectorAll('.kpis .stat b, .stats .stat b').forEach(b => countUp(b, { delay: 0.15 }));
      root.querySelectorAll('.bar .b i').forEach(i => G.from(i, { scaleX: 0, transformOrigin: dirRtl ? 'right' : 'left', duration: 0.9, delay: 0.2, ease: 'power3.out' }));
      const ink = root.querySelector('.auth-ink path'); if (ink) draw(ink, { duration: 0.9, delay: 0.15 });
    }
  }, root);
  if (ST) requestAnimationFrame(() => ST.refresh());
}

function home(root, entered, rtl) {
  // Aurora: بقع ضوء تتحرك ببطء خلف الواجهة
  root.querySelectorAll('.hero-bg i').forEach((b, k) => {
    G.to(b, { xPercent: G.utils.random(-25, 25), yPercent: G.utils.random(-20, 20), scale: G.utils.random(0.85, 1.25), duration: G.utils.random(7, 11), repeat: -1, yoyo: true, ease: 'sine.inOut', delay: k * 0.6 });
  });

  if (entered) {
    const tl = G.timeline({ defaults: { ease: 'power3.out' } });
    // BlurText: العنوان يظهر كلمةً كلمة
    tl.from('.hero-title .w > span', { yPercent: 115, opacity: 0, filter: 'blur(10px)', duration: 0.9, stagger: 0.07 }, 0.15);
    // الختم: الحلقة تُرسم، ثم الريشة، ثم خط الحبر والنقطة
    const ring = root.querySelector('.seal .ring'); if (ring) tl.add(draw(ring, { duration: 1.4, ease: 'power2.inOut' }), 0);
    tl.from('.seal .disc', { scale: 0.86, opacity: 0, transformOrigin: '50% 50%', duration: 0.9 }, 0.15)
      .from('.seal .quill', { opacity: 0, x: 30, y: -30, rotate: 14, transformOrigin: '186px 100px', duration: 0.9, ease: 'back.out(1.6)' }, 0.55)
      .from('.seal .nib', { opacity: 0, duration: 0.3 }, 0.95)
      .from('.seal .word', { opacity: 0, y: 14, duration: 0.7 }, 0.75);
    const sealInk = root.querySelector('.seal .ink'); if (sealInk) tl.add(draw(sealInk, { duration: 0.9 }), 1.05);
    // المصباح: يُبنى من القاعدة، ثم تتصل الخطوط وتظهر العُقد، ثم يضيء
    tl.from('.seal .base path', { opacity: 0, scaleX: 0, transformOrigin: '50% 50%', duration: 0.35, stagger: -0.08 }, 1.75);
    root.querySelectorAll('.seal .edges path').forEach((e, k) => tl.add(draw(e, { duration: 0.35, ease: 'power1.out' }), 1.95 + k * 0.035));
    tl.from('.seal .nodes circle', { scale: 0, transformOrigin: '50% 50%', duration: 0.4, stagger: 0.05, ease: 'back.out(3)' }, 2.05)
      .from('.seal .glow', { opacity: 0, scale: 0.4, transformOrigin: '50% 50%', duration: 0.8 }, 2.4);
    // خط الحبر تحت العنوان يكمل ما بدأته الريشة
    const heroInk = root.querySelector('.hero-ink path'); if (heroInk) tl.add(draw(heroInk, { duration: 1.1 }), 1.2);
    tl.from('.hero-lead, .hero .acts > *', { opacity: 0, y: 14, duration: 0.6, stagger: 0.08 }, 0.8);
    root.querySelectorAll('.hero-stats b').forEach(b => tl.add(countUp(b), 1.1));
    tl.from('.hero-stats > div', { opacity: 0, y: 10, duration: 0.5, stagger: 0.06 }, 1.0);
  }
  // الريشة تتنفس بهدوء بعد الكتابة
  G.to('.seal .quill', { rotate: -3, transformOrigin: '186px 100px', duration: 3.2, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: entered ? 2.2 : 0 });
  // المصباح يتوهج بهدوء كأن الفكرة تعمل
  G.to('.seal .glow', { opacity: 0.45, duration: 1.8, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: entered ? 3.2 : 0 });

  // خط الحبر تحت كل عنوان يُرسم عند الوصول إليه
  root.querySelectorAll('.ink-u path').forEach(p => {
    const len = p.getTotalLength(); G.set(p, { strokeDasharray: `${len} ${len * 2}`, strokeDashoffset: len + 2 });
    onView(p, () => G.to(p, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }));
  });


  // مسار الطلب: الحبر يملأ الخط مع التمرير وتضيء المراحل
  const j = root.querySelector('.journey');
  if (j && ST) {
    const fill = j.querySelector('.j-fill'), steps = [...j.querySelectorAll('.step')];
    const vertical = window.matchMedia('(max-width:620px)').matches;
    G.fromTo(fill, vertical ? { scaleY: 0 } : { scaleX: 0 }, {
      ...(vertical ? { scaleY: 1, transformOrigin: 'center top' } : { scaleX: 1, transformOrigin: rtl ? 'right center' : 'left center' }), ease: 'none',
      scrollTrigger: { trigger: j, start: 'clamp(top 85%)', end: 'clamp(bottom 62%)', scrub: 0.6,
        onUpdate: s => steps.forEach((st, k) => st.classList.toggle('lit', s.progress >= k / (steps.length - 1) - 0.02)) }
    });
    steps.forEach(st => st.classList.remove('lit'));
  }

  // ScrollVelocity: شريط القيم يتحرك ويتسارع مع سرعة التمرير
  const track = root.querySelector('.marquee-track');
  if (track) {
    let off = 0, half = track.scrollWidth / 2;
    const ro = new ResizeObserver(() => { half = track.scrollWidth / 2; }); ro.observe(track);
    const f = (t, dt) => {
      const v = lenis ? Math.abs(lenis.velocity) : 0;
      off = (off + (0.04 + Math.min(v, 60) * 0.02) * dt) % (half || 1);
      track.style.transform = `translate3d(${rtl ? off : -off}px,0,0)`;
    };
    G.ticker.add(f); tickers.push(f);
  }
}
