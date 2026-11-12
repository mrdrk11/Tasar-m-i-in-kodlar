// Scene laboratory (development only; not part of the built site).
// lab.html?scene=doner&p=0.4&t=2.5&q=high&bg=0d1a10&px=0.3&py=-0.2&spin=1.2&reduced=1
//   scene  module name in src/gl/scenes/
//   p      scroll progress 0..1
//   t      freeze the clock at this many seconds (omit to animate live)
//   q      quality tier: high | mid | low
//   bg     page background behind the transparent canvas (hex without #)
//   px,py  pointer position, -1..1
//   spin   drag rotation in radians
//   frame  x,y,w,h as fractions of the canvas: where the subject should sit
//   any other key is passed to the scene as a param (numbers are parsed), e.g. &index=2
import { SceneHost } from './gl/host.js';

const q = new URLSearchParams(location.search);
const name = q.get('scene') || 'doner';
if (q.get('bg')) document.body.style.setProperty('--bg', q.get('bg') === 'none' ? 'transparent' : '#' + q.get('bg'));
const scenes = import.meta.glob('./gl/scenes/*.js');
const load = scenes[`./gl/scenes/${name}.js`];
const el = document.getElementById('stage');

if (!load) {
  el.textContent = `Sahne bulunamadı: ${name}`;
  window.__ready = true;
} else {
  const host = new SceneHost(el, load, {
    eager: true,
    quality: q.get('q') || undefined,
    reducedMotion: q.get('reduced') === '1',
    fixedTime: q.has('t') ? parseFloat(q.get('t')) : null,
  });
  host.setProgress(parseFloat(q.get('p') || '0'));
  if (q.has('px') || q.has('py')) {
    const x = parseFloat(q.get('px') || '0'), y = parseFloat(q.get('py') || '0');
    host.pointer.x = host.pointer.tx = x;
    host.pointer.y = host.pointer.ty = y;
  }
  if (q.has('spin')) host.spin.angle = parseFloat(q.get('spin'));
  if (q.has('frame')) {
    const [x, y, w, h] = q.get('frame').split(',').map(Number);
    host.setFrame({ x, y, w, h });
  }
  const known = new Set(['scene', 'p', 't', 'q', 'bg', 'px', 'py', 'spin', 'reduced', 'frame']);
  for (const [k, v] of q) if (!known.has(k)) host.params[k] = Number.isNaN(Number(v)) ? v : Number(v);
  el.addEventListener('scene:live', () => { window.__ready = true; });
  window.addEventListener('pointermove', (e) => {
    if (q.has('px')) return;
    host.setPointer((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
  });
  window.__lab = {
    host,
    set({ p, t }) {
      if (p != null) host.setProgress(p);
      if (t != null) host.fixedTime = t;
      host.needsRender = true;
      host._render(host.fixedTime ?? performance.now() / 1000, 0);
    },
    stats() {
      const i = host.renderer?.info;
      return i ? { calls: i.render.calls, triangles: i.render.triangles, geometries: i.memory.geometries, textures: i.memory.textures, programs: i.programs?.length } : null;
    },
  };
}
