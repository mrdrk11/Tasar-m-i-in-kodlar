// Page behaviour: header state, reveals, the phone action bar, the motion
// switch, and the 3D scenes with their scroll choreography.
//
// Two modes, chosen in index.html before first paint:
//   html.kaydir  pinned stages; scrolling drives the 3D (WebGL, motion allowed)
//   otherwise    plain layout; scenes show one still state each
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SceneHost } from '../gl/host.js';

gsap.registerPlugin(ScrollTrigger);

const html = document.documentElement;
const KAYDIR = html.classList.contains('kaydir');
const GL = html.classList.contains('gl');
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (x, a = 0, b = 1) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

const SCENES = {
  doner: () => import('../gl/scenes/doner.js'),
  madalyon: () => import('../gl/scenes/madalyon.js'),
  lezzetler: () => import('../gl/scenes/lezzetler.js'),
  tasfirin: () => import('../gl/scenes/tasfirin.js'),
  yedi24: () => import('../gl/scenes/yedi24.js'),
};
const hosts = {};
if (import.meta.env.DEV) window.__hosts = hosts; // for the development tools

/* ------------------------------------------------------------------------ */
/* Small things                                                              */
/* ------------------------------------------------------------------------ */

function ustBilgi() {
  const ust = $('#ust');
  const guncelle = () => ust.classList.toggle('kaydi', window.scrollY > 12);
  guncelle();
  window.addEventListener('scroll', guncelle, { passive: true });
}

function yillar() {
  const now = new Date().getFullYear();
  $$('[data-yil-sayaci]').forEach((el) => { el.textContent = String(now - 1988); });
  $$('[data-bu-yil]').forEach((el) => { el.textContent = String(now); });
}

function girisler() {
  const groups = ['.yil__metin', '.siparis__ana', '.siparis__yan', '.alt__ic', '.lezzet__son-ic'];
  const singles = ['.yil__madalyon'];
  if (!KAYDIR) groups.push('.sahne__doner', '.lezzet__ust', '.firin__metin', '.saat__ic');
  const targets = [];
  groups.forEach((g) => $$(g).forEach((parent) => [...parent.children].forEach((el, i) => {
    el.style.setProperty('--sira', i);
    targets.push(el);
  })));
  singles.forEach((s) => $$(s).forEach((el) => targets.push(el)));
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('gorundu'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  targets.forEach((el) => { el.setAttribute('data-gir', ''); io.observe(el); });
}

function cubuk() {
  const bar = $('[data-cubuk]');
  if (!bar) return;
  const guncelle = () => bar.classList.toggle('acik', window.scrollY > window.innerHeight * 0.55);
  guncelle();
  window.addEventListener('scroll', guncelle, { passive: true });
}

function hareketDugmesi() {
  const btn = $('[data-hareket]');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const durdu = !html.classList.contains('duruk');
    html.classList.toggle('duruk', durdu);
    btn.setAttribute('aria-pressed', String(durdu));
    btn.textContent = durdu ? 'Hareketi başlat' : 'Hareketi durdur';
    Object.values(hosts).forEach((h) => {
      h.reducedMotion = durdu || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (h.api) h.needsRender = true;
      h._sync();
    });
  });
}

/* ------------------------------------------------------------------------ */
/* Scenes                                                                    */
/* ------------------------------------------------------------------------ */

function sahneleriKur() {
  if (!GL) return;
  $$('[data-scene]').forEach((el) => {
    const name = el.dataset.scene;
    if (!SCENES[name]) return;
    hosts[name] = new SceneHost(el, SCENES[name], { eager: name === 'doner' });
  });

  // Still states for the plain layout.
  if (!KAYDIR) {
    hosts.doner?.setParam('stage', 1);
    hosts.doner?.setProgress(0.52);
    hosts.tasfirin?.setProgress(0.92);
    hosts.lezzetler?.setParam('index', 0);
  }

  // Pointer parallax, only for real pointers.
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    window.addEventListener('pointermove', (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1, y = (e.clientY / window.innerHeight) * 2 - 1;
      for (const h of Object.values(hosts)) if (h.visible) h.setPointer(x, y);
    }, { passive: true });
  }
}

/* ------------------------------------------------------------------------ */
/* Sahne: the döner that is the İ                                            */
/* ------------------------------------------------------------------------ */

function sahne() {
  const kat = $('.sahne__kat');
  const host = hosts.doner;
  const slot = $('[data-doner-yuvasi]');
  if (!kat || !host) return;

  host.el.addEventListener('scene:live', () => kat.classList.add('canli'), { once: true });

  // Drag sideways on the stage to spin the döner; vertical drags still scroll.
  let drag = null;
  kat.style.touchAction = 'pan-y';
  kat.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button')) return;
    drag = { x: e.clientX, y: e.clientY, on: false, id: e.pointerId };
  });
  kat.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      drag.on = true;
      kat.setPointerCapture?.(e.pointerId);
    }
    host.addSpin(dx * 0.009);
    drag.x = e.clientX;
    drag.y = e.clientY;
  });
  const birak = () => { drag = null; };
  kat.addEventListener('pointerup', birak);
  kat.addEventListener('pointercancel', birak);

  if (!KAYDIR) return;

  // Where the döner sits: first in the İ slot of the headline, later on its stage.
  const yuva = { x: 0.6, y: 0.3, w: 0.1, h: 0.4 };
  const sahneKutusu = { x: 0, y: 0, w: 1, h: 1 };
  const kare = { x: 0, y: 0, w: 1, h: 1 };
  const olc = () => {
    const W = kat.clientWidth, H = kat.clientHeight;
    if (!W || !H) return;
    // Layout offsets ignore transforms, so the slot can be measured at any scroll position.
    let x = 0, y = 0, el = slot;
    while (el && el !== kat) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
    const w = slot.offsetWidth, h = slot.offsetHeight;
    const full = h * 1.29; // cap height plus the dot of the İ
    yuva.x = x / W; yuva.w = w / W;
    yuva.y = (y + h - full) / H; yuva.h = full / H;
    const genis = W >= 900;
    Object.assign(sahneKutusu, genis ? { x: 0.43, y: 0.035, w: 0.57, h: 0.94 } : { x: 0, y: 0.31, w: 1, h: 0.62 });
  };

  const durum = { asama: 0, kesim: 0 };
  const uygula = () => {
    const t = smooth(durum.asama);
    kare.x = lerp(yuva.x, sahneKutusu.x, t);
    kare.y = lerp(yuva.y, sahneKutusu.y, t);
    kare.w = lerp(yuva.w, sahneKutusu.w, t);
    kare.h = lerp(yuva.h, sahneKutusu.h, t);
    host.setParam('stage', durum.asama);
    host.setFrame(kare);
    host.setProgress(durum.kesim);
    host.needsRender = true;
  };

  const girisParcalari = ['.ustyazi', '.slogan', '.sahne__metin', '.sahne__giris .dugmeler'].map((s) => $(s, kat)).filter(Boolean);
  const harfler = $$('.kilit__harfler, .kilit__48', kat);

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '.sahne',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      onRefresh: () => { olc(); uygula(); },
    },
    onUpdate: uygula,
  });
  tl.to($('.ipucu', kat), { autoAlpha: 0, duration: 0.03 }, 0.01)
    .to(girisParcalari, { autoAlpha: 0, y: -24, duration: 0.07, stagger: 0.008 }, 0.02)
    .to(harfler, { autoAlpha: 0, xPercent: -10, duration: 0.13, stagger: 0.01 }, 0.045)
    .to(durum, { asama: 1, duration: 0.2, ease: 'power1.inOut' }, 0.03)
    .to($('.sahne__perde .dev', kat), { autoAlpha: 1, duration: 0.1 }, 0.2)
    .fromTo($('.sahne__doner', kat), { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: 0.08, ease: 'power2.out' }, 0.235)
    .to(durum, { kesim: 1, duration: 0.6 }, 0.27)
    .to({}, { duration: 0.13 }, 0.87);

  olc();
  uygula();
  // Fonts change the size of the lockup; measure again when they are in.
  document.fonts?.ready.then(() => { olc(); uygula(); ScrollTrigger.refresh(); });
}

/* Intro: the lockup arrives once the fonts are ready. */
function acilis() {
  const kat = $('.sahne__kat');
  if (!kat) return;
  const parcalar = ['.ustyazi', '.kilit__satir:nth-of-type(2) .kilit__harfler', '.kilit__satir:nth-of-type(3) .kilit__harfler', '.kilit__48', '.slogan', '.sahne__metin', '.sahne__giris .dugmeler']
    .map((s) => $(s, kat)).filter(Boolean);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const baslat = () => {
    html.classList.add('hazir');
    if (reduced) return;
    gsap.from(parcalar, {
      autoAlpha: 0, y: 34, duration: 0.9, ease: 'expo.out', stagger: 0.07, clearProps: 'transform,opacity,visibility',
    });
  };
  const fontlar = document.fonts?.ready ?? Promise.resolve();
  Promise.race([fontlar, new Promise((r) => setTimeout(r, 1400))]).then(baslat);
}

/* ------------------------------------------------------------------------ */
/* Lezzetler                                                                 */
/* ------------------------------------------------------------------------ */

function lezzetler() {
  const bolum = $('#lezzetler');
  if (!bolum) return;
  const sekmeler = $$('[role="tab"]', bolum);
  const panolar = $$('[role="tabpanel"]', bolum);
  const afis = $('.gl__afis[data-afis]', bolum);
  let secili = 0;

  const sec = (i) => {
    if (i === secili) return;
    secili = i;
    bolum.dataset.secili = String(i);
    sekmeler.forEach((b, k) => {
      b.setAttribute('aria-selected', String(k === i));
      b.tabIndex = k === i ? 0 : -1;
    });
    panolar.forEach((p, k) => { p.hidden = k !== i; });
    hosts.lezzetler?.setParam('index', i);
    if (afis) afis.src = afis.src.replace(/lezzet-\d\.webp/, `lezzet-${i}.webp`);
  };

  const ray = $('.lezzet__ray', bolum);
  const git = (i) => {
    if (!KAYDIR) { sec(i); return; }
    // Scroll to the middle of that dish's stretch of the pinned stage.
    const r = ray.getBoundingClientRect();
    const top = window.scrollY + r.top, span = ray.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + ((i + 0.5) / 4) * span, behavior: 'smooth' });
  };

  sekmeler.forEach((b, i) => {
    b.addEventListener('click', () => git(i));
    b.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : e.key === 'Home' ? -i : e.key === 'End' ? 3 - i : 0;
      if (!d) return;
      e.preventDefault();
      const n = (i + d + 4) % 4;
      sekmeler[n].focus();
      git(n);
    });
  });

  if (KAYDIR) {
    ScrollTrigger.create({
      trigger: ray,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => sec(Math.min(3, Math.floor(self.progress * 4))),
    });
  }
}

/* ------------------------------------------------------------------------ */
/* 1988, taş fırın, 7/24                                                     */
/* ------------------------------------------------------------------------ */

function digerSahneler() {
  if (!KAYDIR) return;

  if (hosts.madalyon) {
    ScrollTrigger.create({
      trigger: '.yil',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0.6,
      onUpdate: (self) => hosts.madalyon.setProgress(smooth(self.progress, 0.25, 0.85)),
    });
  }

  if (hosts.tasfirin) {
    const adimlar = $$('.adimlar li');
    ScrollTrigger.create({
      trigger: '.firin',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      onUpdate: (self) => {
        const p = self.progress;
        hosts.tasfirin.setProgress(p);
        const etkin = p < 0.38 ? 0 : p < 0.64 ? 1 : 2;
        adimlar.forEach((li, i) => li.classList.toggle('etkin', i === etkin));
      },
    });
  }

  if (hosts.yedi24) {
    const [, aksam, gece] = $$('.saat__gok i');
    ScrollTrigger.create({
      trigger: '.saat',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      onUpdate: (self) => {
        const p = self.progress;
        hosts.yedi24.setProgress(p * 0.5); // noon → midnight
        aksam.style.opacity = String(smooth(p, 0.22, 0.5));
        gece.style.opacity = String(smooth(p, 0.56, 0.86));
      },
    });
  }
}

/* ------------------------------------------------------------------------ */

export function baslat() {
  ustBilgi();
  yillar();
  cubuk();
  hareketDugmesi();
  sahneleriKur();
  sahne();
  acilis();
  lezzetler();
  digerSahneler();
  girisler();
  // Late layout changes (fonts, images) move trigger positions.
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
