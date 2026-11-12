// Stone oven scene: the brick arch from the logo, built in 3D and set into a
// wall of glossy green herringbone tiles like the restaurant's interior.
// A fire burns inside. As the visitor scrolls, a wooden peel carries a pide
// into the oven and brings it back baked.
//
// state.progress: 0 → 0.42 the pide goes in, 0.42 → 0.6 it bakes,
// 0.6 → 1 it comes out golden and is presented to the camera.
import {
  fitCameraBox, makeEnvironment, Embers, flameMaterial, canvasTexture, radialTexture,
  disposeTree, noise3, rng, sat, lerp, smooth, damp, tier,
} from '../kit.js';
import { buildPide } from '../food.js';

const PALETTE = {
  brickA: 0x7a3d18,
  brickB: 0x5f2c10,
  brickC: 0x93501f,
  mortar: 0x2a1a10,
  stone: 0xcbbd9f,
  brass: 0xd9a233,
  wood: 0xc79a5a,
  woodDark: 0x8a5a2a,
  tileDark: [0x0d, 0x33, 0x24],
  tileMid: [0x17, 0x4d, 0x33],
  tileLight: [0x23, 0x69, 0x44],
  grout: [0x07, 0x17, 0x11],
};

const R_IN = 0.95; // oven mouth radius
const R_OUT = 1.44; // outer radius of the brick arch
const SPRING = 0.72; // height where the arch starts
const DEPTH = 1.7; // how far the oven goes back

/* ------------------------------------------------------------------------ */
/* Herringbone tile maps                                                     */
/* ------------------------------------------------------------------------ */

function herringboneMaps(THREE, size, across) {
  const mk = () => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    return c;
  };
  const cMap = mk(), cRough = mk(), cBump = mk();
  const gMap = cMap.getContext('2d'), gRough = cRough.getContext('2d'), gBump = cBump.getContext('2d');
  const dMap = gMap.createImageData(size, size), dRough = gRough.createImageData(size, size), dBump = gBump.createImageData(size, size);
  const hash = (a, b, c) => {
    let h = Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(c, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const S = Math.SQRT1_2;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const x = (px / size - 0.5) * across, y = (py / size - 0.5) * across;
      // 45 degree herringbone: rotate, then the classic staircase rule.
      const rx = (x - y) * S, ry = (x + y) * S;
      const ix = Math.floor(rx), iy = Math.floor(ry);
      const fx = rx - ix, fy = ry - iy;
      const d = (((ix - iy) % 4) + 4) % 4;
      let u, v, ox, oy, o;
      if (d === 0) { u = fx / 2; v = fy; ox = ix; oy = iy; o = 0; }
      else if (d === 1) { u = (1 + fx) / 2; v = fy; ox = ix - 1; oy = iy; o = 0; }
      else if (d === 3) { u = fy / 2; v = fx; ox = ix; oy = iy; o = 1; }
      else { u = (1 + fy) / 2; v = fx; ox = ix; oy = iy - 1; o = 1; }
      const edge = Math.min(Math.min(u, 1 - u) * 2, Math.min(v, 1 - v));
      const h = hash(ox, oy, o);
      const tileness = smooth(edge, 0.035, 0.075);
      const bevel = smooth(edge, 0.035, 0.17);
      // Hand-made glaze: tone differs per tile and pools slightly inside each.
      const pool = noise3(rx * 1.7 + h * 9, ry * 1.7, h * 20) * 0.5 + 0.5;
      const k = sat(h * 0.75 + pool * 0.35 - 0.05);
      const i = (py * size + px) * 4;
      for (let ch = 0; ch < 3; ch++) {
        const tile = k < 0.5
          ? lerp(PALETTE.tileDark[ch], PALETTE.tileMid[ch], k * 2)
          : lerp(PALETTE.tileMid[ch], PALETTE.tileLight[ch], (k - 0.5) * 2);
        dMap.data[i + ch] = lerp(PALETTE.grout[ch], tile, tileness);
      }
      dMap.data[i + 3] = 255;
      const rough = lerp(0.9, 0.1 + h * 0.14, tileness) * 255;
      dRough.data[i] = dRough.data[i + 1] = dRough.data[i + 2] = rough;
      dRough.data[i + 3] = 255;
      const bump = (bevel * 0.85 + pool * 0.15 * tileness) * 255;
      dBump.data[i] = dBump.data[i + 1] = dBump.data[i + 2] = bump;
      dBump.data[i + 3] = 255;
    }
  }
  gMap.putImageData(dMap, 0, 0);
  gRough.putImageData(dRough, 0, 0);
  gBump.putImageData(dBump, 0, 0);
  const tex = (c, srgb) => {
    const t = new THREE.CanvasTexture(c);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };
  return { map: tex(cMap, true), roughnessMap: tex(cRough, false), bumpMap: tex(cBump, false) };
}

/* ------------------------------------------------------------------------ */
/* Scene                                                                     */
/* ------------------------------------------------------------------------ */

export default function create({ THREE, renderer, quality, size, reducedMotion }) {
  const Q = tier(quality, {
    high: { tex: 1024, embers: 90, bricks: 13 },
    mid: { tex: 512, embers: 60, bricks: 13 },
    low: { tex: 512, embers: 32, bricks: 11 },
  });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, size.w / size.h, 0.1, 100);
  const center = new THREE.Vector3(0.12, 1.22, 0.25);
  const camDir = new THREE.Vector3();
  let aspect = size.w / size.h;

  const env = makeEnvironment(renderer, {
    top: 0x24301f,
    bottom: 0x050604,
    panels: [
      { color: 0xfff1dc, intensity: 3.4, position: [-4.5, 4.5, 5], size: [4, 6] },
      { color: 0xffd9a0, intensity: 2.2, position: [5.5, 2.5, 4], size: [3, 6] },
      { color: 0xffb070, intensity: 1.1, position: [0, 0.5, 6], size: [5, 2] },
      { color: 0x9fe0b0, intensity: 1.2, position: [-6, 1, -1], size: [3, 5] },
    ],
  });
  scene.environment = env.texture;
  scene.environmentIntensity = 0.9;

  const key = new THREE.DirectionalLight(0xfff4e6, 2.4);
  key.position.set(-3, 5, 6);
  scene.add(key);
  const fire = new THREE.PointLight(0xff7a22, 26, 6.5, 1.6);
  fire.position.set(0, 0.55, -0.35);
  scene.add(fire);
  const spill = new THREE.PointLight(0xff9a40, 3.2, 2.6, 2);
  spill.position.set(0, 0.45, 0.7);
  scene.add(spill);

  /* Tile wall with the oven mouth cut out */
  const WALL_W = 5.4, WALL_H = 4.5, WALL_Y0 = -0.75;
  const mouth = new THREE.Path();
  mouth.moveTo(-R_IN, 0);
  mouth.lineTo(-R_IN, SPRING);
  mouth.absarc(0, SPRING, R_IN, Math.PI, 0, true);
  mouth.lineTo(R_IN, 0);
  mouth.closePath();
  const wallShape = new THREE.Shape();
  wallShape.moveTo(-WALL_W / 2, WALL_Y0);
  wallShape.lineTo(WALL_W / 2, WALL_Y0);
  wallShape.lineTo(WALL_W / 2, WALL_Y0 + WALL_H);
  wallShape.lineTo(-WALL_W / 2, WALL_Y0 + WALL_H);
  wallShape.closePath();
  wallShape.holes.push(mouth);
  const wallGeo = new THREE.ShapeGeometry(wallShape, 40);
  {
    const p = wallGeo.attributes.position, uv = wallGeo.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / WALL_W + 0.5, (p.getY(i) - WALL_Y0) / WALL_H);
  }
  const tiles = herringboneMaps(THREE, Q.tex, 27);
  const fadeTex = canvasTexture(256, 256, (g, w, h) => {
    // Soft edges so the wall melts into the page instead of ending in a rectangle.
    const grad = g.createRadialGradient(w / 2, h * 0.52, w * 0.2, w / 2, h * 0.52, w * 0.56);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.62, '#fff');
    grad.addColorStop(1, '#000');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }, { srgb: false, mipmaps: false });
  const wallMat = new THREE.MeshPhysicalMaterial({
    map: tiles.map, roughnessMap: tiles.roughnessMap, bumpMap: tiles.bumpMap, bumpScale: 2.4,
    roughness: 1, metalness: 0, clearcoat: 0.9, clearcoatRoughness: 0.12,
    alphaMap: fadeTex, transparent: true,
  });
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.renderOrder = -3;
  scene.add(wall);

  /* Oven interior: a dark vault behind the opening */
  const mouthShape = new THREE.Shape(mouth.getPoints(24));
  const vault = new THREE.Mesh(
    new THREE.ExtrudeGeometry(mouthShape, { depth: DEPTH, bevelEnabled: false, curveSegments: 24 }),
    new THREE.MeshStandardMaterial({ color: 0x1a0d07, roughness: 0.95, side: THREE.BackSide }),
  );
  vault.position.z = -DEPTH;
  scene.add(vault);

  // Glowing ember bed on the oven floor and logs at the back.
  const bedTex = radialTexture(128, [[0, 'rgba(255,190,90,1)'], [0.45, 'rgba(240,90,20,0.75)'], [1, 'rgba(120,20,0,0)']]);
  const bed = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 1.5),
    new THREE.MeshBasicMaterial({ map: bedTex, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }),
  );
  bed.rotation.x = -Math.PI / 2;
  bed.position.set(0, 0.012, -1.0);
  scene.add(bed);
  const logMat = new THREE.MeshStandardMaterial({ color: 0x1c0f08, roughness: 0.9, emissive: 0xd4380a, emissiveIntensity: 0.12 });
  const logs = [];
  [[-0.32, 0.09, -1.18, 0.5], [0.3, 0.09, -1.22, -0.4], [0.0, 0.2, -1.2, 1.45]].forEach(([x, y, z, ry]) => {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.95, 10), logMat);
    log.rotation.set(0, ry, Math.PI / 2);
    log.position.set(x, y, z);
    scene.add(log);
    logs.push(log);
  });

  // Fire: three sheets at different depths, speeds and tints.
  const flames = [
    { w: 1.5, h: 1.25, z: -1.25, o: { speed: 0.9, tongues: 2.6, intensity: 1.05, occlusion: 0.75 } },
    { w: 1.25, h: 1.05, z: -1.05, o: { speed: 1.25, tongues: 3.4, intensity: 1.15, occlusion: 0.5, mid: 0xffb238 } },
    { w: 0.95, h: 0.8, z: -0.85, o: { speed: 1.6, tongues: 4.2, intensity: 1.2, occlusion: 0.3, core: 0xfff6d0 } },
  ].map(({ w, h, z, o }, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), flameMaterial(o));
    m.position.set((i - 1) * 0.12, h / 2 + 0.02, z);
    m.renderOrder = 2 + i;
    scene.add(m);
    return m;
  });

  /* Brick arch */
  const brickBump = canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#808080';
    g.fillRect(0, 0, w, h);
    const r = rng(9);
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = r() > 0.5 ? `rgba(255,255,255,${r() * 0.2})` : `rgba(0,0,0,${r() * 0.26})`;
      g.beginPath();
      g.arc(r() * w, r() * h, 0.5 + r() * 2.6, 0, 6.283);
      g.fill();
    }
  }, { srgb: false, repeat: [1.5, 1.5] });
  const brickColors = [PALETTE.brickA, PALETTE.brickB, PALETTE.brickC].map((c) => new THREE.Color(c));
  const br = rng(33);
  const brickMat = () => new THREE.MeshStandardMaterial({
    color: brickColors[Math.floor(br() * 3)].clone().offsetHSL(0, (br() - 0.5) * 0.08, (br() - 0.5) * 0.06),
    roughness: 0.86, bumpMap: brickBump, bumpScale: 2.2,
  });
  const extrude = { depth: 0.42, bevelEnabled: true, bevelSize: 0.022, bevelThickness: 0.022, bevelSegments: 2, curveSegments: 6 };
  const arch = new THREE.Group();
  scene.add(arch);
  const N = Q.bricks, gap = 0.028;
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI + gap, a1 = ((i + 1) / N) * Math.PI - gap;
    const s = new THREE.Shape();
    s.absarc(0, 0, R_OUT - 0.02, a0, a1, false);
    s.absarc(0, 0, R_IN + 0.02, a1, a0, true);
    s.closePath();
    const b = new THREE.Mesh(new THREE.ExtrudeGeometry(s, extrude), brickMat());
    b.position.set(0, SPRING, 0.02 + (br() - 0.5) * 0.03);
    arch.add(b);
  }
  // Piers: stacked bricks under each end of the arch.
  const pierW = R_OUT - R_IN - 0.04, rows = 3;
  for (const side of [-1, 1]) {
    for (let j = 0; j < rows; j++) {
      const hgt = SPRING / rows - 0.03;
      const s = new THREE.Shape();
      s.moveTo(-pierW / 2, 0); s.lineTo(pierW / 2, 0); s.lineTo(pierW / 2, hgt); s.lineTo(-pierW / 2, hgt); s.closePath();
      const b = new THREE.Mesh(new THREE.ExtrudeGeometry(s, extrude), brickMat());
      b.position.set(side * (R_IN + R_OUT) / 2, j * (SPRING / rows) + 0.015, 0.02 + (br() - 0.5) * 0.03);
      arch.add(b);
    }
  }

  // Hearth: a stone shelf with a brass edge, the peel rests on it.
  const stoneMat = new THREE.MeshStandardMaterial({ color: PALETTE.stone, roughness: 0.8, bumpMap: brickBump, bumpScale: 1.2 });
  const hearth = new THREE.Mesh(new THREE.BoxGeometry(R_OUT * 2 + 0.5, 0.14, 1.0), stoneMat);
  hearth.position.set(0, -0.07, 0.4);
  scene.add(hearth);
  const brass = new THREE.MeshStandardMaterial({ color: PALETTE.brass, metalness: 1, roughness: 0.28 });
  const trim = new THREE.Mesh(new THREE.BoxGeometry(R_OUT * 2 + 0.56, 0.05, 1.04), brass);
  trim.position.set(0, -0.165, 0.4);
  scene.add(trim);

  // Warm glow spilling out of the mouth onto the tiles.
  const glowTex = radialTexture(256, [[0, 'rgba(255,150,60,0.5)'], [0.4, 'rgba(240,100,30,0.2)'], [1, 'rgba(200,60,0,0)']]);
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 3.2),
    new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }),
  );
  glow.position.set(0, 0.9, 0.03);
  glow.renderOrder = -2;
  scene.add(glow);

  /* Peel with the pide */
  const peel = new THREE.Group();
  scene.add(peel);
  {
    const s = new THREE.Shape();
    const w = 0.36, l = 0.72, r = 0.12;
    s.moveTo(-w + r, -l);
    s.lineTo(w - r, -l); s.quadraticCurveTo(w, -l, w, -l + r);
    s.lineTo(w, l - r * 2); s.quadraticCurveTo(w, l, w - r * 2, l);
    s.lineTo(-w + r * 2, l); s.quadraticCurveTo(-w, l, -w, l - r * 2);
    s.lineTo(-w, -l + r); s.quadraticCurveTo(-w, -l, -w + r, -l);
    const woodTex = canvasTexture(256, 256, (g, wd, hg) => {
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, wd, hg);
      const rr = rng(4);
      for (let i = 0; i < 90; i++) {
        g.strokeStyle = `rgba(110,70,30,${0.08 + rr() * 0.2})`;
        g.lineWidth = 0.6 + rr() * 2.4;
        const x = rr() * wd;
        g.beginPath();
        g.moveTo(x, 0);
        g.bezierCurveTo(x + (rr() - 0.5) * 22, hg * 0.33, x + (rr() - 0.5) * 22, hg * 0.66, x + (rr() - 0.5) * 12, hg);
        g.stroke();
      }
    }, { repeat: [1, 1] });
    const woodMat = new THREE.MeshStandardMaterial({ color: PALETTE.wood, map: woodTex, roughness: 0.62 });
    const boardGeo = new THREE.ExtrudeGeometry(s, { depth: 0.028, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 });
    {
      const p = boardGeo.attributes.position, uv = boardGeo.attributes.uv;
      for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 0.72 + 0.5, p.getY(i) / 1.44 + 0.5);
    }
    const board = new THREE.Mesh(boardGeo, woodMat);
    board.rotation.x = -Math.PI / 2;
    peel.add(board);
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.032, 2.1, 12),
      new THREE.MeshStandardMaterial({ color: PALETTE.woodDark, roughness: 0.6 }),
    );
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0, 0.014, 0.72 + 1.05);
    peel.add(handle);
  }
  const pide = buildPide();
  pide.position.set(0, 0.04, -0.12);
  pide.rotation.y = Math.PI / 2;
  peel.add(pide);

  const embers = new Embers({
    count: Q.embers, area: [1.7, 2.6, 1.4], origin: [0, 0.2, -0.3], size: 70, speed: 0.26, seed: 12,
  });
  scene.add(embers.points);

  /* Animation */
  let orbit = 0, elev = 0, first = true;
  const P_REST = new THREE.Vector3(1.05, 0.34, 2.15);
  const P_SHELF = new THREE.Vector3(0.1, 0.03, 0.72);
  const P_IN = new THREE.Vector3(0, 0.03, -0.62);
  const P_SHOW = new THREE.Vector3(0.62, 0.62, 1.75);
  const tmp = new THREE.Vector3();

  function update({ time, dt, progress: p, pointer }) {
    const t = reducedMotion ? 0 : time;
    const baking = smooth(p, 0.36, 0.46) * (1 - smooth(p, 0.58, 0.68)); // 1 while the pide is inside
    const surge = 1 + baking * 0.35;

    flames.forEach((f, i) => {
      f.material.uniforms.uTime.value = t + i * 3.7;
      f.material.uniforms.uIntensity.value = [1.05, 1.15, 1.2][i] * surge;
      f.scale.y = 1 + baking * 0.12;
    });
    const flick = 0.9 + 0.07 * Math.sin(t * 8.1) + 0.05 * Math.sin(t * 17.7 + 1.3);
    fire.intensity = 26 * flick * surge;
    spill.intensity = 3.2 * flick * surge;
    glow.material.opacity = (0.5 + 0.12 * flick) * (0.9 + baking * 0.3);
    bed.material.opacity = 0.75 + 0.25 * flick;
    logMat.emissiveIntensity = 0.1 + 0.06 * flick;
    embers.update(t, renderer);

    // Peel path: rest → shelf → inside → shelf → presented.
    const goIn = smooth(p, 0.02, 0.2), slideIn = smooth(p, 0.2, 0.42);
    const slideOut = smooth(p, 0.6, 0.76), present = smooth(p, 0.76, 0.98);
    tmp.copy(P_REST).lerp(P_SHELF, goIn).lerp(P_IN, slideIn);
    if (slideOut > 0) tmp.lerp(P_SHELF, slideOut);
    if (present > 0) tmp.lerp(P_SHOW, present);
    peel.position.copy(tmp);
    const yaw = lerp(0.55, 0.0, goIn) + present * 0.5;
    const tilt = present * 0.32;
    peel.rotation.set(tilt, yaw, 0);
    const bake = smooth(p, 0.4, 0.62);
    pide.userData.bake(bake);
    pide.rotation.y = Math.PI / 2 + present * (0.5 + (reducedMotion ? 0 : Math.sin(t * 0.6) * 0.08));

    const tOrbit = lerp(0.34, 0.18, smooth(p, 0, 0.5)) + smooth(p, 0.7, 1) * 0.12 + pointer.x * 0.08;
    const tElev = lerp(0.16, 0.2, smooth(p, 0.6, 1)) - pointer.y * 0.04;
    if (first || !dt) { orbit = tOrbit; elev = tElev; first = false; }
    else { orbit = damp(orbit, tOrbit, 5, dt); elev = damp(elev, tElev, 5, dt); }
    camDir.set(Math.sin(orbit) * Math.cos(elev), Math.sin(elev), Math.cos(orbit) * Math.cos(elev));
    fitCameraBox(camera, { center, width: 4.3, height: 3.5, depth: 2.6, aspect, margin: 1.02, dir: camDir });
  }

  return {
    scene,
    camera,
    update,
    resize(w, h) { aspect = w / h; },
    dispose() {
      embers.dispose();
      disposeTree(scene);
      [tiles.map, tiles.roughnessMap, tiles.bumpMap, fadeTex, bedTex, glowTex, brickBump].forEach((x) => x.dispose());
      env.dispose();
    },
  };
}
