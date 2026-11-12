// Stylised food models built from code: pide, lahmacun, şiş and dürüm, plus
// the plates and boards they sit on. Each builder returns a THREE.Group whose
// origin is the centre of its footprint on the table (y = 0 is the table).
import * as THREE from 'three';
import { canvasTexture, noise3, fbm3, rng, sat, lerp, smooth } from './kit.js';

export const FOOD = {
  doughRaw: 0xf3e2bd,
  doughBaked: 0xd08f3c,
  fillRaw: 0xb24a36,
  fillBaked: 0x7c3a1c,
  meat: 0x8a4318,
  meatDark: 0x4a2110,
  lavash: 0xf0ddb4,
  tomato: 0xd92a1c,
  pepper: 0x3f9a2b,
  parsley: 0x2f8a2a,
  lemon: 0xf6d83a,
  ceramic: 0xf4ead6,
  brass: 0xd9a233,
  steel: 0xcfd3d6,
  wood: 0xb98a4e,
  paper: 0x26611d,
};

const glossy = (color, extra = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.2, ...extra });

/** Dots and blobs on a base colour; used for toppings and toasted spots. */
function speckle(w, h, base, layers, seed = 1, opts) {
  return canvasTexture(w, h, (g) => {
    const r = rng(seed);
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (const [color, n, size] of layers) {
      g.fillStyle = color;
      for (let i = 0; i < n; i++) {
        g.beginPath();
        g.ellipse(r() * w, r() * h, 0.6 + r() * size, 0.6 + r() * size * 0.75, r() * 3.14, 0, 6.283);
        g.fill();
      }
    }
  }, opts);
}

/* ------------------------------------------------------------------------ */
/* Tableware                                                                 */
/* ------------------------------------------------------------------------ */

export function buildPlate(radius = 0.82) {
  const g = new THREE.Group();
  const s = radius / 0.82;
  const pts = [[0, 0], [0.46, 0], [0.56, 0.012], [0.78, 0.062], [0.82, 0.078], [0.805, 0.088], [0.58, 0.04], [0.44, 0.03], [0, 0.03]]
    .map(([x, y]) => new THREE.Vector2(x * s, y * s));
  const plate = new THREE.Mesh(new THREE.LatheGeometry(pts, 72), glossy(FOOD.ceramic, { roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 }));
  g.add(plate);
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.812 * s, 0.007 * s, 8, 96),
    new THREE.MeshStandardMaterial({ color: FOOD.brass, metalness: 1, roughness: 0.25 }),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.086 * s;
  g.add(rim);
  g.userData.top = 0.031 * s; // height of the flat centre
  return g;
}

export function buildBoard(length = 1.45, width = 0.62) {
  const g = new THREE.Group();
  const w = width / 2, l = length / 2, r = Math.min(w, l) * 0.42;
  const s = new THREE.Shape();
  s.moveTo(-l + r, -w);
  s.lineTo(l - r, -w); s.quadraticCurveTo(l, -w, l, -w + r);
  s.lineTo(l, w - r); s.quadraticCurveTo(l, w, l - r, w);
  s.lineTo(-l + r, w); s.quadraticCurveTo(-l, w, -l, w - r);
  s.lineTo(-l, -w + r); s.quadraticCurveTo(-l, -w, -l + r, -w);
  const grain = canvasTexture(256, 256, (c, cw, ch) => {
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, cw, ch);
    const rr = rng(4);
    for (let i = 0; i < 80; i++) {
      c.strokeStyle = `rgba(95,58,24,${0.08 + rr() * 0.22})`;
      c.lineWidth = 0.6 + rr() * 2.6;
      const y = rr() * ch;
      c.beginPath();
      c.moveTo(0, y);
      c.bezierCurveTo(cw * 0.33, y + (rr() - 0.5) * 20, cw * 0.66, y + (rr() - 0.5) * 20, cw, y + (rr() - 0.5) * 12);
      c.stroke();
    }
  });
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.045, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2 });
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / length + 0.5, p.getY(i) / width + 0.5);
  const board = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: FOOD.wood, map: grain, roughness: 0.6 }));
  board.rotation.x = -Math.PI / 2;
  board.position.y = 0.012;
  g.add(board);
  g.userData.top = 0.07;
  return g;
}

/* ------------------------------------------------------------------------ */
/* Pide                                                                      */
/* ------------------------------------------------------------------------ */

const PIDE_L = 0.52, PIDE_W = 0.2;
// Boat outline with pointed ends, t in 0..2π.
const pideOutline = (t, s = 1) => {
  const c = Math.cos(t), sn = Math.sin(t);
  return [PIDE_L * s * c * (0.82 + 0.18 * Math.abs(c)), PIDE_W * s * sn * (1 - 0.42 * c * c)];
};

/** A kıymalı pide. `group.userData.bake(0..1)` takes it from raw dough to baked. */
export function buildPide() {
  const group = new THREE.Group();

  const shape = new THREE.Shape();
  for (let i = 0; i <= 64; i++) {
    const [x, y] = pideOutline((i / 64) * Math.PI * 2);
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  const doughMat = new THREE.MeshPhysicalMaterial({ color: FOOD.doughRaw, roughness: 0.75, clearcoat: 0.12, clearcoatRoughness: 0.6 });
  const base = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: false }), doughMat);
  base.rotation.x = -Math.PI / 2;
  group.add(base);

  // Folded crust: a lumpy tube around the outline, thicker at the pinched ends.
  const pts = [];
  for (let i = 0; i < 72; i++) {
    const t = (i / 72) * Math.PI * 2;
    const [x, z] = pideOutline(t, 0.97);
    pts.push(new THREE.Vector3(x, 0.05 + noise3(x * 9, z * 9, 2) * 0.008, -z));
  }
  const crustGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 144, 0.046, 12, true);
  {
    const p = crustGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const n = 1 + fbm3(x * 7, y * 7, z * 7, 3) * 0.22;
      const end = 1 + smooth(Math.abs(x) / PIDE_L, 0.8, 1) * 0.35;
      p.setXYZ(i, x, 0.05 + (y - 0.05) * n * end, z * (1 + (n - 1) * 0.15));
    }
    crustGeo.computeVertexNormals();
  }
  const crustMat = new THREE.MeshPhysicalMaterial({ color: FOOD.doughRaw, roughness: 0.62, clearcoat: 0.25, clearcoatRoughness: 0.45 });
  group.add(new THREE.Mesh(crustGeo, crustMat));

  // Filling: light specks tinted by the material colour, with pepper and
  // tomato pieces that keep their own colour through the bake.
  const fillTex = canvasTexture(256, 128, (g, w, h) => {
    const r = rng(21);
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, w, h);
    for (const [c, n, s] of [['#f1dccd', 520, 5], ['#c9a48f', 420, 4], ['#fff6ea', 160, 3], ['#e9b8a0', 220, 6]]) {
      g.fillStyle = c;
      for (let i = 0; i < n; i++) {
        g.beginPath();
        g.ellipse(r() * w, r() * h, 1 + r() * s, 1 + r() * s * 0.8, r() * 3, 0, 6.283);
        g.fill();
      }
    }
    for (let i = 0; i < 46; i++) {
      g.fillStyle = r() > 0.5 ? '#3f8f2c' : '#d8301c';
      g.beginPath();
      g.ellipse(r() * w, r() * h, 2.2 + r() * 3.4, 1.4 + r() * 2, r() * 3, 0, 6.283);
      g.fill();
    }
  });
  const fillShape = new THREE.Shape();
  for (let i = 0; i <= 48; i++) {
    const [x, y] = pideOutline((i / 48) * Math.PI * 2, 0.86);
    if (i === 0) fillShape.moveTo(x, y); else fillShape.lineTo(x, y);
  }
  const fillGeo = new THREE.ShapeGeometry(fillShape, 12);
  {
    const p = fillGeo.attributes.position, uvA = fillGeo.attributes.uv;
    for (let i = 0; i < p.count; i++) uvA.setXY(i, p.getX(i) / (PIDE_L * 2) + 0.5, p.getY(i) / (PIDE_W * 2) + 0.5);
  }
  const fillMat = new THREE.MeshPhysicalMaterial({ map: fillTex, bumpMap: fillTex, bumpScale: 3, color: FOOD.fillRaw, roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.4 });
  const fill = new THREE.Mesh(fillGeo, fillMat);
  fill.rotation.x = -Math.PI / 2;
  fill.position.y = 0.047;
  group.add(fill);

  const cRaw = new THREE.Color(FOOD.doughRaw), cBaked = new THREE.Color(FOOD.doughBaked);
  const fRaw = new THREE.Color(FOOD.fillRaw), fBaked = new THREE.Color(FOOD.fillBaked);
  const baseBaked = cBaked.clone().lerp(cRaw, 0.35);
  group.userData.bake = (b) => {
    crustMat.color.copy(cRaw).lerp(cBaked, b);
    doughMat.color.copy(cRaw).lerp(baseBaked, b);
    fillMat.color.copy(fRaw).lerp(fBaked, b);
    crustMat.clearcoat = lerp(0.25, 0.6, b);
    fillMat.clearcoat = lerp(0.3, 0.75, b);
    group.scale.y = lerp(0.92, 1.12, b); // the crust puffs up
  };
  group.userData.bake(1);
  return group;
}

/* ------------------------------------------------------------------------ */
/* Small garnishes                                                           */
/* ------------------------------------------------------------------------ */

function lemonWedge() {
  const g = new THREE.Group();
  const skin = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 16, 0, Math.PI / 2.6), glossy(FOOD.lemon, { roughness: 0.42, clearcoat: 0.4 }));
  g.add(skin);
  const pulpTex = canvasTexture(64, 64, (c, w, h) => {
    c.fillStyle = '#f7d94a';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(255,250,215,0.85)';
    c.lineWidth = 1.2;
    for (let i = 0; i < 9; i++) {
      c.beginPath();
      c.moveTo(w / 2, h / 2);
      c.lineTo(w / 2 + Math.cos((i / 9) * 6.283) * w, h / 2 + Math.sin((i / 9) * 6.283) * h);
      c.stroke();
    }
  });
  const pulp = new THREE.MeshPhysicalMaterial({ map: pulpTex, roughness: 0.35, clearcoat: 0.6, side: THREE.DoubleSide });
  for (const a of [0, Math.PI / 2.6]) {
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.148, 20, -Math.PI / 2, Math.PI), pulp);
    face.rotation.y = -a + Math.PI / 2;
    g.add(face);
  }
  return g;
}

function parsley(seed = 1) {
  const g = new THREE.Group();
  const r = rng(seed);
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.04, 0.02, 0.06, 0.07, 0.03, 0.1);
  s.bezierCurveTo(0.03, 0.13, 0.01, 0.14, 0, 0.16);
  s.bezierCurveTo(-0.01, 0.14, -0.03, 0.13, -0.03, 0.1);
  s.bezierCurveTo(-0.06, 0.07, -0.04, 0.02, 0, 0);
  const geo = new THREE.ShapeGeometry(s, 4);
  const mat = new THREE.MeshStandardMaterial({ color: FOOD.parsley, roughness: 0.6, side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(geo, mat);
    leaf.rotation.set(-Math.PI / 2 + (r() - 0.5) * 0.9, r() * 6.28, (r() - 0.5) * 0.6);
    leaf.position.set((r() - 0.5) * 0.12, 0.012 + r() * 0.03, (r() - 0.5) * 0.12);
    leaf.scale.setScalar(0.7 + r() * 0.6);
    g.add(leaf);
  }
  return g;
}

function longPepper(color = FOOD.pepper, length = 0.5) {
  const geo = new THREE.CapsuleGeometry(0.05, length, 8, 18);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), t = sat((y + length / 2 + 0.05) / (length + 0.1));
    const s = lerp(1.1, 0.4, t * t);
    p.setXYZ(i, p.getX(i) * s + Math.sin(t * 2.2) * 0.05, y, p.getZ(i) * s);
  }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, glossy(color, { roughness: 0.34 }));
}

/* ------------------------------------------------------------------------ */
/* Lahmacun                                                                  */
/* ------------------------------------------------------------------------ */

export function buildLahmacun() {
  const g = new THREE.Group();
  const R = 0.6;
  const tex = canvasTexture(512, 512, (c, w, h) => {
    const r = rng(8);
    c.fillStyle = '#d9a35c';
    c.fillRect(0, 0, w, h);
    // Thin crisp rim with toasted spots.
    for (let i = 0; i < 260; i++) {
      const a = r() * 6.283, d = (0.9 + r() * 0.1) * w / 2;
      c.fillStyle = `rgba(110,55,18,${0.15 + r() * 0.4})`;
      c.beginPath();
      c.ellipse(w / 2 + Math.cos(a) * d, h / 2 + Math.sin(a) * d, 3 + r() * 9, 2 + r() * 5, a, 0, 6.283);
      c.fill();
    }
    // Spiced meat spread, slightly uneven at its edge.
    c.fillStyle = '#8f3a1e';
    c.beginPath();
    for (let i = 0; i <= 90; i++) {
      const a = (i / 90) * 6.283, d = (0.865 + noise3(Math.cos(a) * 3, Math.sin(a) * 3, 1) * 0.03) * w / 2;
      const x = w / 2 + Math.cos(a) * d, y = h / 2 + Math.sin(a) * d;
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.fill();
    const dots = [['#6e2a15', 1100, 5], ['#a84e2a', 620, 4], ['#4e1c0e', 520, 3], ['#c8321e', 200, 4], ['#3e8f2e', 260, 3.5], ['#efd9ae', 130, 3]];
    for (const [col, n, s] of dots) {
      c.fillStyle = col;
      for (let i = 0; i < n; i++) {
        const a = r() * 6.283, d = Math.sqrt(r()) * 0.84 * w / 2;
        c.beginPath();
        c.ellipse(w / 2 + Math.cos(a) * d, h / 2 + Math.sin(a) * d, 0.8 + r() * s, 0.8 + r() * s * 0.7, r() * 3, 0, 6.283);
        c.fill();
      }
    }
  });
  const rings = [0, 0.15, 0.3, 0.42, 0.5, 0.555, 0.585, 0.6];
  const geo = new THREE.LatheGeometry(rings.map((x, i) => new THREE.Vector2(x, i >= rings.length - 2 ? 0.02 : 0.012)), 80);
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), z = p.getZ(i);
    const d = Math.hypot(x, z), a = Math.atan2(z, x);
    const k = 1 + noise3(Math.cos(a) * 2.2, Math.sin(a) * 2.2, 5) * 0.045 * (d / R);
    x *= k; z *= k;
    const y = p.getY(i) + fbm3(x * 3.2, z * 3.2, 7, 3) * 0.02 * sat(d / R + 0.2);
    p.setXYZ(i, x, y, z);
    uv.setXY(i, x / (R * 2.1) + 0.5, z / (R * 2.1) + 0.5);
  }
  geo.computeVertexNormals();
  const disc = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ map: tex, bumpMap: tex, bumpScale: 2.5, roughness: 0.66, clearcoat: 0.22, clearcoatRoughness: 0.5, side: THREE.DoubleSide }));
  g.add(disc);

  const lemon = lemonWedge();
  lemon.position.set(0.3, 0.035, 0.26);
  lemon.rotation.set(0.2, 0.6, 1.25);
  g.add(lemon);
  const herbs = parsley(3);
  herbs.position.set(-0.22, 0.02, 0.18);
  herbs.scale.setScalar(1.5);
  g.add(herbs);
  const herbs2 = parsley(6);
  herbs2.position.set(0.12, 0.02, -0.28);
  herbs2.scale.setScalar(1.2);
  g.add(herbs2);
  return g;
}

/* ------------------------------------------------------------------------ */
/* Şiş (ızgara)                                                              */
/* ------------------------------------------------------------------------ */

function meatChunk(seed) {
  const geo = new THREE.BoxGeometry(0.17, 0.15, 0.17, 4, 4, 4);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const round = v.clone().normalize().multiplyScalar(0.1);
    v.lerp(round, 0.45);
    v.multiplyScalar(1 + noise3(v.x * 14 + seed, v.y * 14, v.z * 14) * 0.1);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export function buildSis() {
  const g = new THREE.Group();
  const grill = canvasTexture(128, 128, (c, w, h) => {
    const r = rng(14);
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 380; i++) {
      c.fillStyle = `rgba(60,24,8,${0.08 + r() * 0.22})`;
      c.beginPath();
      c.arc(r() * w, r() * h, 1 + r() * 4, 0, 6.283);
      c.fill();
    }
    c.strokeStyle = 'rgba(28,10,4,0.82)';
    c.lineWidth = 7;
    for (let i = -2; i < 6; i++) {
      c.beginPath();
      c.moveTo(i * 30, 0);
      c.lineTo(i * 30 + 60, h);
      c.stroke();
    }
  }, { repeat: [1, 1] });
  const meatMat = new THREE.MeshPhysicalMaterial({ color: FOOD.meat, map: grill, roughness: 0.5, clearcoat: 0.55, clearcoatRoughness: 0.3 });
  const steel = new THREE.MeshStandardMaterial({ color: FOOD.steel, metalness: 1, roughness: 0.25 });
  const pepperMat = glossy(FOOD.pepper, { roughness: 0.36 });
  const tomatoMat = glossy(FOOD.tomato, { roughness: 0.28 });

  const skewer = (seed) => {
    const s = new THREE.Group();
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 1.5, 10), steel);
    rod.rotation.z = Math.PI / 2;
    s.add(rod);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.011, 8, 20), steel);
    ring.position.x = -0.79;
    s.add(ring);
    const order = ['m', 'p', 'm', 't', 'm', 'p', 'm'];
    order.forEach((kind, i) => {
      const x = -0.5 + i * 0.165;
      let m;
      if (kind === 'm') {
        m = new THREE.Mesh(meatChunk(seed + i), meatMat);
        m.rotation.x = (seed + i) * 1.3;
      } else if (kind === 'p') {
        m = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.15, 2, 3, 3), pepperMat);
        const p = m.geometry.attributes.position;
        for (let k = 0; k < p.count; k++) p.setX(k, p.getX(k) + Math.sin(p.getY(k) * 14) * 0.012);
        m.geometry.computeVertexNormals();
        m.rotation.x = seed * 0.7 + i;
      } else {
        m = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 14), tomatoMat);
        m.scale.set(0.8, 1, 1);
      }
      m.position.x = x;
      s.add(m);
    });
    return s;
  };

  // Lavash underneath.
  const lavTex = speckle(256, 256, '#f0ddb4', [['rgba(170,105,45,0.35)', 60, 12], ['rgba(120,65,20,0.4)', 36, 6], ['rgba(255,255,255,0.4)', 50, 9]], 5);
  const lavGeo = new THREE.CircleGeometry(0.62, 48);
  const lp = lavGeo.attributes.position;
  for (let i = 0; i < lp.count; i++) {
    const x = lp.getX(i), y = lp.getY(i), a = Math.atan2(y, x), d = Math.hypot(x, y);
    const k = 1 + noise3(Math.cos(a) * 1.6, Math.sin(a) * 1.6, 3) * 0.14 * (d / 0.62);
    lp.setXYZ(i, x * k, y * k * 0.78, 0);
  }
  const lavash = new THREE.Mesh(lavGeo, new THREE.MeshStandardMaterial({ map: lavTex, roughness: 0.8, side: THREE.DoubleSide }));
  lavash.rotation.x = -Math.PI / 2;
  lavash.position.y = 0.006;
  g.add(lavash);

  const a = skewer(1);
  a.position.set(0.03, 0.1, -0.12);
  a.rotation.y = 0.12;
  g.add(a);
  const b = skewer(5);
  b.position.set(-0.02, 0.1, 0.12);
  b.rotation.y = -0.1;
  g.add(b);

  const pep = longPepper(0x4f8f2a, 0.42);
  pep.rotation.set(Math.PI / 2, 0, 1.2);
  pep.position.set(0.28, 0.06, 0.36);
  g.add(pep);
  const half = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), tomatoMat);
  half.position.set(-0.4, 0.012, 0.34);
  g.add(half);
  return g;
}

/* ------------------------------------------------------------------------ */
/* Dürüm                                                                     */
/* ------------------------------------------------------------------------ */

export function buildDurum() {
  const g = new THREE.Group();
  const lavTex = speckle(256, 128, '#f0ddb4', [['rgba(170,105,45,0.4)', 70, 11], ['rgba(110,60,20,0.45)', 40, 5], ['rgba(255,255,255,0.35)', 40, 8]], 17, { repeat: [1, 1] });
  const lavMat = new THREE.MeshStandardMaterial({ map: lavTex, roughness: 0.78 });
  const fillTex = speckle(128, 128, '#7a3c18', [['#5a2810', 60, 9], ['#a85a26', 70, 8], ['#c98236', 40, 6], ['#d8301c', 16, 7], ['#3f9a2b', 20, 6], ['#f3e6c8', 14, 5]], 23);
  const fillMat = new THREE.MeshPhysicalMaterial({ map: fillTex, bumpMap: fillTex, bumpScale: 4, roughness: 0.5, clearcoat: 0.5, clearcoatRoughness: 0.3 });
  const paperTex = canvasTexture(128, 64, (c, w, h) => {
    c.fillStyle = '#26611d';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#f2ab00';
    c.fillRect(0, 6, w, 5);
    c.fillRect(0, h - 11, w, 5);
  });
  const paperMat = new THREE.MeshStandardMaterial({ map: paperTex, roughness: 0.7 });
  const bitMat = new THREE.MeshPhysicalMaterial({ color: 0xa85a26, roughness: 0.5, clearcoat: 0.5 });
  const greenMat = new THREE.MeshStandardMaterial({ color: FOOD.parsley, roughness: 0.6 });
  const redMat = glossy(FOOD.tomato);

  const half = (seed) => {
    const h = new THREE.Group(); // roll lies along X; cut face at +X
    const r = rng(seed);
    const L = 0.66, R = 0.165;
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.97, L, 36, 6, true), lavMat);
    {
      const p = tube.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const k = 1 + noise3(x * 9 + seed, y * 5, z * 9) * 0.05;
        p.setXYZ(i, x * k, y, z * k * 0.94);
      }
      tube.geometry.computeVertexNormals();
    }
    tube.rotation.z = -Math.PI / 2;
    h.add(tube);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(R * 0.97, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), lavMat);
    cap.rotation.z = Math.PI / 2;
    cap.scale.set(1, 0.55, 0.94);
    cap.position.x = -L / 2;
    h.add(cap);
    const face = new THREE.Mesh(new THREE.CircleGeometry(R * 0.93, 28), fillMat);
    face.rotation.y = Math.PI / 2;
    face.position.x = L / 2 - 0.004;
    face.scale.y = 1;
    h.add(face);
    // Meat and greens poking out of the cut.
    for (let i = 0; i < 9; i++) {
      const a = r() * 6.283, d = Math.sqrt(r()) * R * 0.7;
      const kind = r();
      const m = new THREE.Mesh(
        kind < 0.62 ? new THREE.BoxGeometry(0.07, 0.016, 0.05) : new THREE.SphereGeometry(0.022, 8, 6),
        kind < 0.62 ? bitMat : kind < 0.82 ? greenMat : redMat,
      );
      m.position.set(L / 2 + 0.006 + r() * 0.025, Math.sin(a) * d, Math.cos(a) * d * 0.94);
      m.rotation.set(r() * 3, r() * 3, r() * 3);
      h.add(m);
    }
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.05, R * 1.03, 0.36, 36, 1, true), paperMat);
    sleeve.rotation.z = -Math.PI / 2;
    sleeve.scale.z = 0.95;
    sleeve.position.x = -L / 2 + 0.2;
    h.add(sleeve);
    return h;
  };

  const a = half(2);
  a.position.set(-0.1, 0.165, 0.12);
  a.rotation.y = 0.35;
  g.add(a);
  const b = half(7);
  b.position.set(0.12, 0.3, -0.12);
  b.rotation.set(0, 0.2, 0.42);
  g.add(b);
  return g;
}
