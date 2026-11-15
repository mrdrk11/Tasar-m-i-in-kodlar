// Menu page: builds the categories and cards from menu-veri.js, runs the 3D
// dishes, the category colours, the card tilt and the item sheet.
import '@fontsource-variable/archivo/standard.css';
import '@fontsource-variable/fraunces/full-italic.css';
import './styles/temel.css';
import './styles/bolumler.css';
import './styles/menu.css';
import { SceneHost } from './gl/host.js';
import { KATEGORILER, WHATSAPP } from './menu-veri.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const foto = (ad) => `${import.meta.env.BASE_URL}menu/${ad}`;
const iki = (n) => String(n).padStart(2, '0');

/* ---- Build ---------------------------------------------------------------- */

const kok = $('[data-kategoriler]');
const mnav = $('[data-mnav]');

mnav.innerHTML = KATEGORILER.map((k) => `<a href="#kat-${k.id}" data-kat="${k.id}" style="--v:${k.renk.zemin};--vo:${k.renk.on}">${esc(k.ad)}</a>`).join('');

kok.innerHTML = KATEGORILER.map((k, i) => {
  const koyu = k.renk.on !== '#141413'; // dark ground: cream cards; light ground: dark cards
  const kartlar = k.urunler.map((u, j) => `
    <article class="kart${u.foto ? ' kart--foto' : ''}" style="--sira:${j % 4}">
      <button class="kart__dugme" type="button" data-urun="${i}:${j}" aria-haspopup="dialog">
        ${u.foto ? `<span class="kart__foto"><img src="${foto(u.foto)}" alt="${esc(u.ad)}" loading="lazy" decoding="async" width="640" height="480"></span>` : ''}
        <span class="kart__metin">
          <span class="kart__ad">${esc(u.ad)}</span>
          ${u.aciklama ? `<span class="kart__acik">${esc(u.aciklama)}</span>` : ''}
        </span>
        <span class="kart__alt">
          ${u.fiyat ? `<span class="kart__fiyat">${esc(u.fiyat)}</span>` : '<span></span>'}
          <span class="kart__git">Sipariş</span>
        </span>
      </button>
    </article>`).join('');
  return `
  <section class="kat${koyu ? '' : ' kat--acik'}" id="kat-${k.id}" data-kat="${k.id}" style="--zemin:${k.renk.zemin};--on:${k.renk.on};--vurgu:${k.renk.vurgu}">
    <header class="kat__bas">
      <span class="kat__dev" aria-hidden="true">${esc(k.ad.split(' ')[0])}</span>
      <div class="kat__gl gl" data-dish="${k.tabak}" aria-hidden="true"></div>
      <div class="sar kat__bas-ic">
        <p class="kat__no">${iki(i + 1)} <i>/ ${iki(KATEGORILER.length)}</i></p>
        <h2 class="kat__ad">${esc(k.ad)}</h2>
        <p class="kat__soz">${esc(k.soz)}</p>
      </div>
    </header>
    <div class="sar kat__izgara">${kartlar}</div>
  </section>`;
}).join('');

/* ---- Header, phone bar, year ---------------------------------------------- */

const ust = $('#ust');
const bar = $('[data-cubuk]');
const kaydir = () => {
  ust.classList.toggle('kaydi', window.scrollY > 12);
  bar?.classList.toggle('acik', window.scrollY > window.innerHeight * 0.4);
};
kaydir();
window.addEventListener('scroll', kaydir, { passive: true });
$$('[data-bu-yil]').forEach((el) => { el.textContent = new Date().getFullYear(); });

/* ---- 3D: the carousel in the hero, one turning dish per category ----------- */

const hosts = [];
const mh = $('[data-mh-gl]');
const hero = new SceneHost(mh, () => import('./gl/scenes/lezzetler.js'), { eager: true, params: { index: 0 } });
hosts.push(hero);
let sira = 0, dur = reduced;
setInterval(() => {
  if (dur || document.hidden) return;
  sira = (sira + 1) % 4;
  hero.setParam('index', sira);
}, 2600);

$$('.kat__gl').forEach((el) => {
  const host = new SceneHost(el, () => import('./gl/scenes/tabak.js'), { params: { dish: el.dataset.dish, rot: 0.4 } });
  hosts.push(host);
  // Drag (or swipe sideways) to turn the dish.
  let x = null;
  el.addEventListener('pointerdown', (e) => { x = e.clientX; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', (e) => { if (x == null) return; host.addSpin((e.clientX - x) * 0.012); x = e.clientX; });
  const birak = () => { x = null; };
  el.addEventListener('pointerup', birak);
  el.addEventListener('pointercancel', birak);
});
if (fine) {
  window.addEventListener('pointermove', (e) => {
    const px = (e.clientX / window.innerWidth) * 2 - 1, py = (e.clientY / window.innerHeight) * 2 - 1;
    hosts.forEach((h) => h.setPointer(px, py));
  }, { passive: true });
}

const hareket = $('[data-hareket]');
hareket?.addEventListener('click', () => {
  dur = !dur;
  hosts.forEach((h) => h.setStill(dur));
  document.documentElement.classList.toggle('duruk', dur);
  hareket.setAttribute('aria-pressed', String(dur));
  hareket.textContent = dur ? 'Hareketi başlat' : 'Hareketi durdur';
});

/* ---- Category in view: chip state and page colour -------------------------- */

const cipler = new Map($$('a', mnav).map((a) => [a.dataset.kat, a]));
const etkin = (id) => {
  cipler.forEach((a, k) => {
    if (k === id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
  });
  const a = cipler.get(id);
  if (a) mnav.scrollTo({ left: a.offsetLeft - (mnav.clientWidth - a.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
};
const gozcu = new IntersectionObserver((kayitlar) => {
  kayitlar.forEach((k) => { if (k.isIntersecting) etkin(k.target.dataset.kat); });
}, { rootMargin: '-35% 0px -60% 0px' });
$$('.kat').forEach((el) => gozcu.observe(el));

/* ---- Cards: rise in, tilt under the pointer -------------------------------- */

const gir = new IntersectionObserver((kayitlar) => {
  kayitlar.forEach((k) => { if (k.isIntersecting) { k.target.classList.add('gorundu'); gir.unobserve(k.target); } });
}, { rootMargin: '0px 0px -8% 0px' });
$$('.kart, .kat__bas-ic').forEach((el) => gir.observe(el));

if (fine && !reduced) {
  kok.addEventListener('pointermove', (e) => {
    const d = e.target.closest('.kart__dugme');
    if (!d) return;
    const r = d.getBoundingClientRect();
    d.style.setProperty('--ry', `${(((e.clientX - r.left) / r.width) - 0.5) * 12}deg`);
    d.style.setProperty('--rx', `${(0.5 - ((e.clientY - r.top) / r.height)) * 10}deg`);
  });
  kok.addEventListener('pointerout', (e) => {
    const d = e.target.closest('.kart__dugme');
    if (d && !d.contains(e.relatedTarget)) { d.style.setProperty('--rx', '0deg'); d.style.setProperty('--ry', '0deg'); }
  });
}

/* ---- Item sheet ------------------------------------------------------------ */

const detay = $('[data-detay]');
const parca = (ad) => $(`[data-detay-${ad}]`, detay);
let acan = null;

function doldur(i, j) {
  const k = KATEGORILER[i], u = k.urunler[j];
  detay.style.setProperty('--zemin', k.renk.zemin);
  detay.style.setProperty('--on', k.renk.on);
  detay.style.setProperty('--vurgu', k.renk.vurgu);
  parca('kat').textContent = k.ad;
  parca('ad').textContent = u.ad;
  parca('acik').textContent = u.aciklama || '';
  parca('acik').hidden = !u.aciklama;
  parca('fiyat').textContent = u.fiyat || '';
  parca('fiyat').hidden = !u.fiyat;
  const f = parca('foto');
  f.hidden = !u.foto;
  f.innerHTML = u.foto ? `<img src="${foto(u.foto)}" alt="${esc(u.ad)}" width="960" height="720">` : '';
  parca('wa').href = `${WHATSAPP}&text=${encodeURIComponent(`Merhaba, ${u.ad} sipariş vermek istiyorum.`)}`;
}

function ac(dugme) {
  const [i, j] = dugme.dataset.urun.split(':').map(Number);
  acan = dugme;
  const kaynak = $('.kart__foto', dugme);
  const goster = () => { doldur(i, j); detay.showModal(); };
  // Where the browser can, the card's photo grows into the sheet's photo.
  if (kaynak && document.startViewTransition && !reduced) {
    kaynak.style.viewTransitionName = 'urun-foto';
    const gecis = document.startViewTransition(() => {
      kaynak.style.viewTransitionName = '';
      goster();
      parca('foto').style.viewTransitionName = 'urun-foto';
    });
    gecis.finished.finally(() => { parca('foto').style.viewTransitionName = ''; });
  } else {
    goster();
  }
}

kok.addEventListener('click', (e) => {
  const d = e.target.closest('.kart__dugme');
  if (d) ac(d);
});
$('[data-detay-kapat]').addEventListener('click', () => detay.close());
detay.addEventListener('click', (e) => { if (e.target === detay) detay.close(); }); // click on the backdrop
detay.addEventListener('close', () => { acan?.focus({ preventScroll: true }); acan = null; });

document.documentElement.classList.add('hazir');
