// Hero scene: a large döner on its spit in front of a glowing burner.
// It turns slowly, catches warm light, and as the visitor scrolls a knife
// comes down and shaves strips that fall into the tray.
//
// state.progress 0 → 1 drives the camera and the slicing; state.spin adds the
// visitor's drag rotation; state.pointer gives a small parallax.
// state.params.stage 0 → 1: at 0 only the spit with its meat and the tomato
// on top are shown, upright and straight on, so the döner can stand in for
// the letter İ in the headline; at 1 the burner, tray and embers are there.
// state.frame places the döner inside a part of the canvas.
import {
  fitCameraBox, applyFrame, makeEnvironment, Embers, contactShadow, canvasTexture, radialTexture,
  disposeTree, fbm3, noise3, rng, sat, lerp, range, smooth, damp, tier, GLSL_NOISE,
} from '../kit.js';

const PALETTE = {
  char: 0x2a1108,
  roast: 0x6a2d10,
  caramel: 0x9c4f1c,
  golden: 0xc98236,
  fat: 0xedc58c,
  steel: 0xcfd3d6,
  housing: 0x1b1d1f,
  brass: 0xd9a233,
  tomato: 0xd92a1c,
  pepper: 0x3f9a2b,
  wood: 0x4a2a16,
  glowHot: 0xffb347,
  glowDeep: 0xd4380a,
};

const HEIGHT = 2.5; // meat height
const BASE_Y = 0.42; // bottom of the meat above the floor

/* ------------------------------------------------------------------------ */
/* Meat                                                                      */
/* ------------------------------------------------------------------------ */

function meatRadius(v) {
  const taper = lerp(0.36, 0.68, Math.pow(v, 0.72));
  const dome = v > 0.9 ? Math.sqrt(Math.max(0, 1 - Math.pow((v - 0.9) / 0.1, 2))) * 0.8 + 0.2 : 1;
  const foot = v < 0.05 ? lerp(0.7, 1, v / 0.05) : 1;
  return taper * dome * foot;
}

function buildMeat(THREE, { layers, sub, radial }) {
  const rand = rng(48);
  const layerRand = Array.from({ length: layers }, () => ({
    scale: (rand() - 0.5) * 0.06,
    ox: rand() * 40,
    oy: rand() * 40,
    tone: rand() - 0.5,
    fat: rand(),
    flap: rand(),
    flapPhase: rand() * 6.283,
    flapFreq: 3 + Math.floor(rand() * 5),
  }));
  const rings = layers * sub;
  const cols = radial + 1;
  const count = (rings + 1) * cols;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const c = {
    char: new THREE.Color(PALETTE.char),
    roast: new THREE.Color(PALETTE.roast),
    caramel: new THREE.Color(PALETTE.caramel),
    golden: new THREE.Color(PALETTE.golden),
    fat: new THREE.Color(PALETTE.fat),
  };
  const tmp = new THREE.Color();

  for (let j = 0; j <= rings; j++) {
    const v = j / rings;
    const lf = Math.min(layers - 1e-4, v * layers);
    const li = Math.floor(lf);
    const f = lf - li;
    const bulge = Math.pow(Math.sin(Math.PI * f), 0.55);
    const L = layerRand[li];
    for (let i = 0; i < cols; i++) {
      const th = (i / radial) * Math.PI * 2;
      const cx = Math.cos(th), sz = Math.sin(th);
      const lobes = fbm3(cx * 1.7 + L.ox, sz * 1.7 + L.oy, li * 0.37, 3);
      const fine = noise3(cx * 8 + li * 1.3, sz * 8, v * 46);
      // Some layers have a torn flap that sticks out and droops a little.
      const flap = L.flap > 0.58 ? Math.pow(Math.max(0, Math.sin(th * L.flapFreq + L.flapPhase)), 3) * (L.flap - 0.58) * 2.4 : 0;
      let r = meatRadius(v) * (1 + L.scale + 0.075 * lobes + 0.022 * fine + 0.07 * flap * bulge);
      r *= 0.95 + 0.05 * bulge;
      const y = BASE_Y + v * HEIGHT + 0.012 * lobes - 0.018 * flap * bulge;
      const k = (j * cols + i) * 3;
      pos[k] = cx * r;
      pos[k + 1] = y;
      pos[k + 2] = sz * r;
      uv[(j * cols + i) * 2] = i / radial;
      uv[(j * cols + i) * 2 + 1] = v;

      // Colour: caramel to golden body, crisp dark edges where a layer sticks
      // out, dark seams between layers, a pale fat line on some layers.
      const blot = noise3(cx * 3.1 + 9, sz * 3.1 + 4, v * 9);
      const exposed = sat(0.46 + lobes * 1.1 + (bulge - 0.55) * 0.45 + L.tone * 0.35 + flap * 0.9);
      tmp.copy(c.caramel).lerp(c.golden, sat(0.55 + blot * 1.1 - L.tone * 0.5));
      tmp.lerp(c.roast, smooth(exposed, 0.5, 0.84) * 0.8);
      tmp.lerp(c.char, smooth(exposed, 0.78, 1.0) * 0.75);
      if (L.fat > 0.55) tmp.lerp(c.fat, Math.pow(sat(1 - Math.abs(f - 0.5) * 7), 2) * 0.6 * sat(0.7 - blot));
      const seam = 0.58 + 0.42 * smooth(bulge, 0.0, 0.45);
      const topRoast = lerp(1, 0.82, smooth(v, 0.86, 1));
      tmp.multiplyScalar(seam * topRoast);
      col[k] = tmp.r;
      col[k + 1] = tmp.g;
      col[k + 2] = tmp.b;
    }
  }

  const index = [];
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < radial; i++) {
      const a = j * cols + i, b = a + 1, d = a + cols, e = d + 1;
      index.push(a, d, b, b, d, e);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  // Weld the shading across the seam column.
  const n = geo.attributes.normal;
  for (let j = 0; j <= rings; j++) {
    const a = j * cols, b = a + radial;
    const x = n.getX(a) + n.getX(b), y = n.getY(a) + n.getY(b), z = n.getZ(a) + n.getZ(b);
    const l = Math.hypot(x, y, z) || 1;
    n.setXYZ(a, x / l, y / l, z / l);
    n.setXYZ(b, x / l, y / l, z / l);
  }
  return geo;
}

function meatBump() {
  // Fine horizontal fibres plus speckle; used as a bump map only.
  return canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#808080';
    g.fillRect(0, 0, w, h);
    const r = rng(5);
    for (let i = 0; i < 2600; i++) {
      const y = r() * h, x = r() * w, len = 12 + r() * 70, a = 0.05 + r() * 0.16;
      g.strokeStyle = r() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
      g.lineWidth = 0.6 + r() * 1.8;
      g.beginPath();
      g.moveTo(x, y);
      g.bezierCurveTo(x + len * 0.3, y + (r() - 0.5) * 5, x + len * 0.7, y + (r() - 0.5) * 5, x + len, y + (r() - 0.5) * 3);
      g.stroke();
    }
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.2})`;
      g.beginPath();
      g.arc(r() * w, r() * h, 0.6 + r() * 2.2, 0, 6.283);
      g.fill();
    }
  }, { srgb: false, repeat: [5, 3] });
}

/* ------------------------------------------------------------------------ */
/* Burner                                                                    */
/* ------------------------------------------------------------------------ */

function burnerMaterial(THREE) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uHot: { value: new THREE.Color(PALETTE.glowHot) },
      uDeep: { value: new THREE.Color(PALETTE.glowDeep) },
      uLevel: { value: 1 },
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */ `
      varying vec2 vUv; uniform float uTime, uLevel; uniform vec3 uHot, uDeep;
      ${GLSL_NOISE}
      void main(){
        // Ceramic burner tile: a grid of glowing cells that breathe slowly.
        vec2 g = vUv * vec2(14.0, 9.0);
        vec2 cell = fract(g) - 0.5;
        float hole = smoothstep(0.46, 0.18, length(cell));
        float breathe = kNoise(vec3(floor(g) * 0.35, uTime * 0.6));
        float wave = kNoise(vec3(vUv * 2.5, uTime * 0.35));
        float heat = clamp(0.45 + 0.4 * breathe + 0.35 * wave, 0.0, 1.0) * uLevel;
        vec3 col = mix(uDeep * 0.55, uHot, heat) * (0.35 + hole * 1.15);
        float edge = smoothstep(0.0, 0.06, vUv.x) * smoothstep(0.0, 0.06, 1.0 - vUv.x) * smoothstep(0.0, 0.08, vUv.y) * smoothstep(0.0, 0.08, 1.0 - vUv.y);
        gl_FragColor = vec4(col * (0.25 + 0.75 * edge), 1.0);
      }`,
  });
}

/* ------------------------------------------------------------------------ */
/* Scene                                                                     */
/* ------------------------------------------------------------------------ */

export default function create({ THREE, renderer, quality, size, reducedMotion }) {
  const Q = tier(quality, {
    high: { layers: 74, sub: 3, radial: 120, embers: 170, shavings: 44 },
    mid: { layers: 58, sub: 3, radial: 84, embers: 100, shavings: 30 },
    low: { layers: 42, sub: 2, radial: 56, embers: 56, shavings: 18 },
  });

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, size.w / size.h, 0.1, 100);
  const center = new THREE.Vector3(-0.22, 1.7, -0.25);
  const camDir = new THREE.Vector3();

  const env = makeEnvironment(renderer, {
    top: 0x2b1c12,
    bottom: 0x050302,
    panels: [
      { color: 0xff8a3c, intensity: 7, position: [-2.5, 2.2, -4.5], size: [5, 5] }, // burner glow
      { color: 0xfff0dc, intensity: 3.2, position: [5, 4.5, 4], size: [4, 6] }, // soft key
      { color: 0xffd9a0, intensity: 1.6, position: [-6, 3, 3], size: [3, 6] }, // warm fill
      { color: 0x3c9a3a, intensity: 1.1, position: [3, 0.2, -5], size: [6, 2] }, // brand-green kick
      { color: 0xfff6e8, intensity: 2.4, position: [1.5, 2.5, 7], size: [3, 7] }, // front strip: gloss on meat and steel
      { color: 0xfff2e0, intensity: 2.0, position: [7, 2.2, 1.5], size: [3, 6] }, // right strip: keeps the blade bright
    ],
  });
  scene.environment = env.texture;
  scene.environmentIntensity = 0.95;

  const key = new THREE.DirectionalLight(0xffe6c8, 2.6);
  key.position.set(3.2, 4.2, 5.5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x9fd0a0, 0.35);
  fill.position.set(-4, 1.5, 3);
  scene.add(fill);
  const heat = new THREE.PointLight(0xff6a1f, 34, 7, 1.7);
  heat.position.set(-0.55, 1.7, -1.25);
  scene.add(heat);

  /* Spit assembly (everything that turns) */
  const spit = new THREE.Group();
  scene.add(spit);

  const bump = meatBump();
  const meatMat = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.5,
    metalness: 0,
    bumpMap: bump,
    bumpScale: 2.2,
    clearcoat: 0.75,
    clearcoatRoughness: 0.24,
    sheen: 0.25,
    sheenColor: new THREE.Color(0xffb070),
    sheenRoughness: 0.5,
  });
  const meat = new THREE.Mesh(buildMeat(THREE, Q), meatMat);
  spit.add(meat);

  const steel = new THREE.MeshStandardMaterial({ color: PALETTE.steel, metalness: 1, roughness: 0.22 });
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, HEIGHT + 1.15, 20), steel);
  rod.position.y = BASE_Y + (HEIGHT + 1.15) / 2 - 0.35;
  spit.add(rod);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.16, 20), steel);
  tip.position.y = rod.position.y + (HEIGHT + 1.15) / 2 + 0.08;
  spit.add(tip);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.07, 40), steel);
  collar.position.y = BASE_Y - 0.035;
  spit.add(collar);

  // Garnish on top: tomato and a green pepper, the classic crown.
  const tomato = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 40, 28),
    new THREE.MeshPhysicalMaterial({ color: PALETTE.tomato, roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.15 }),
  );
  tomato.scale.set(1, 0.84, 1);
  tomato.position.y = BASE_Y + HEIGHT + 0.2;
  spit.add(tomato);
  const calyx = new THREE.Mesh(
    new THREE.ConeGeometry(0.1, 0.05, 6),
    new THREE.MeshStandardMaterial({ color: 0x2f6f22, roughness: 0.7, flatShading: true }),
  );
  calyx.position.y = tomato.position.y + 0.165;
  spit.add(calyx);
  const pepperMat = new THREE.MeshPhysicalMaterial({ color: PALETTE.pepper, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.2 });
  const pepper = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.3, 8, 20), pepperMat);
  pepper.geometry.translate(0, 0.15, 0);
  {
    // Taper and bend the capsule so it reads as a long green pepper.
    const p = pepper.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i), t = sat((y + 0.075) / 0.45);
      const s = lerp(1.05, 0.45, t * t);
      p.setXYZ(i, p.getX(i) * s + t * t * 0.07, y, p.getZ(i) * s);
    }
    pepper.geometry.computeVertexNormals();
  }
  pepper.position.set(0.02, tomato.position.y + 0.13, 0);
  pepper.rotation.z = -0.5;
  spit.add(pepper);

  /* Static rig: base, tray, burner */
  const rig = new THREE.Group();
  scene.add(rig);

  const dishPts = [
    [0.0, 0.0], [0.86, 0.0], [0.95, 0.035], [1.0, 0.13], [0.975, 0.14], [0.93, 0.075], [0.84, 0.05], [0.0, 0.05],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const tray = new THREE.Mesh(new THREE.LatheGeometry(dishPts, 64), steel);
  tray.position.y = 0.1;
  rig.add(tray);
  const foot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.6, 0.1, 48),
    new THREE.MeshStandardMaterial({ color: PALETTE.housing, metalness: 0.6, roughness: 0.45 }),
  );
  foot.position.y = 0.05;
  rig.add(foot);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, BASE_Y - 0.15, 24), steel);
  post.position.y = 0.15 + (BASE_Y - 0.15) / 2;
  rig.add(post);
  const shadow = contactShadow(1.7, 1.25, 0.55);
  shadow.position.y = 0.002;
  rig.add(shadow);

  // Burner: a curved dark housing with three glowing ceramic tiles and brass trim.
  const burner = new THREE.Group();
  burner.position.set(-0.62, 0, -1.2);
  burner.rotation.y = 0.42;
  rig.add(burner);
  const housingMat = new THREE.MeshStandardMaterial({ color: PALETTE.housing, metalness: 0.75, roughness: 0.42 });
  const housing = new THREE.Mesh(new THREE.BoxGeometry(1.25, 3.2, 0.3), housingMat);
  housing.position.set(0, 1.7, -0.16);
  burner.add(housing);
  const brass = new THREE.MeshStandardMaterial({ color: PALETTE.brass, metalness: 1, roughness: 0.3 });
  const tileMat = burnerMaterial(THREE);
  for (let i = 0; i < 3; i++) {
    const tile = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.84), tileMat);
    tile.position.set(0, 0.72 + i * 0.98, 0.0);
    burner.add(tile);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.05, 0.06), brass);
    frame.position.set(0, 0.25 + i * 0.98, 0.02);
    burner.add(frame);
  }
  const topTrim = new THREE.Mesh(new THREE.BoxGeometry(1.31, 0.09, 0.36), brass);
  topTrim.position.set(0, 3.33, -0.16);
  burner.add(topTrim);

  // Soft halo behind everything: reads as heat even on a flat page colour.
  const haloTex = radialTexture(256, [[0, 'rgba(255,150,60,0.55)'], [0.35, 'rgba(240,90,20,0.22)'], [1, 'rgba(200,50,0,0)']]);
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(7.4, 7.4),
    new THREE.MeshBasicMaterial({
      map: haloTex, transparent: true, depthWrite: false, toneMapped: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
      blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    }),
  );
  halo.position.set(-0.45, 1.75, -1.7);
  halo.renderOrder = -2;
  rig.add(halo);

  /* Knife: tip at the origin, blade running up +Y in the XY plane, handle on
     top. In the scene the blade lies almost flat against the meat. */
  const knife = new THREE.Group();
  knife.rotation.order = 'YXZ';
  scene.add(knife);
  {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(0, 1.22);
    s.lineTo(0.15, 1.22);
    s.lineTo(0.135, 0.3);
    s.quadraticCurveTo(0.11, 0.06, 0, 0);
    const bladeGeo = new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 1 });
    bladeGeo.translate(0, 0, -0.006);
    const blade = new THREE.Mesh(bladeGeo, new THREE.MeshStandardMaterial({ color: 0xf4f6f7, metalness: 0.72, roughness: 0.26, envMapIntensity: 1.6 }));
    knife.add(blade);
    const handle = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.052, 0.36, 6, 16),
      new THREE.MeshStandardMaterial({ color: PALETTE.wood, roughness: 0.55 }),
    );
    handle.position.set(0.075, 1.48, 0);
    knife.add(handle);
    const bolster = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 16), brass);
    bolster.position.set(0.075, 1.245, 0);
    knife.add(bolster);
  }

  /* Shavings */
  const shaveGeo = new THREE.PlaneGeometry(0.24, 0.07, 10, 2);
  {
    const p = shaveGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      const a = (x / 0.24) * 1.9; // curl along the length
      p.setXYZ(i, Math.sin(a) * 0.1, y + Math.sin(x * 30) * 0.005, (1 - Math.cos(a)) * 0.1 + Math.abs(y) * 0.15);
    }
    shaveGeo.computeVertexNormals();
  }
  const shaveMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.4, side: THREE.DoubleSide });
  const shavings = new THREE.InstancedMesh(shaveGeo, shaveMat, Q.shavings);
  shavings.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(shavings);
  const sr = rng(11);
  const shaveData = Array.from({ length: Q.shavings }, (_, i) => {
    const u = i / (Q.shavings - 1);
    const tone = new THREE.Color(PALETTE.golden).lerp(new THREE.Color(PALETTE.fat), sr() * 0.45).lerp(new THREE.Color(PALETTE.caramel), sr() * 0.55);
    shavings.setColorAt(i, tone);
    return {
      u,
      land: { a: 0.15 + (sr() - 0.5) * 1.3, r: 0.48 + sr() * 0.34, y: 0.165 + sr() * 0.06 },
      spin: [(sr() - 0.5) * 9, (sr() - 0.5) * 7, (sr() - 0.5) * 8],
      rest: [sr() * 6.28, (sr() - 0.5) * 0.5, sr() * 6.28],
      scale: 0.8 + sr() * 0.5,
    };
  });
  shavings.instanceColor.needsUpdate = true;

  const embers = new Embers({
    count: Q.embers, area: [3.2, 4.4, 1.8], origin: [-0.35, 0.25, -0.7], size: 84, speed: 0.2, seed: 3,
  });
  scene.add(embers.points);

  /* Animation */
  const KNIFE_ANGLE = 0.62; // where on the cone the knife works, radians from the camera axis toward the right
  const m4 = new THREE.Matrix4();
  const q4 = new THREE.Quaternion();
  const e3 = new THREE.Euler();
  const v3 = new THREE.Vector3();
  const s3 = new THREE.Vector3();
  let orbit = 0, elev = 0, radius = 1, first = true;

  const surfacePoint = (yv, out) => {
    const r = meatRadius(yv) + 0.045;
    return out.set(Math.sin(KNIFE_ANGLE) * r, BASE_Y + yv * HEIGHT, Math.cos(KNIFE_ANGLE) * r);
  };

  const LETTER = { center: new THREE.Vector3(0, 1.875, 0), width: 1.46, height: 2.93, depth: 1.4 };
  const STAGE = { center, width: 2.9, height: 3.75, depth: 2.2 };
  const boxCenter = new THREE.Vector3();

  function update({ time, dt, progress: p, pointer, spin, params, frame, size: canvas }) {
    const t = reducedMotion ? 0 : time;
    const stage = smooth(sat(params.stage ?? 1));
    spit.rotation.y = t * 0.24 + spin + p * 1.4;

    // Everything around the spit arrives as the letter grows into the scene.
    rig.visible = stage > 0.002;
    rig.scale.setScalar(0.6 + 0.4 * stage);
    rig.position.y = (1 - stage) * -0.9;
    embers.material.uniforms.uIntensity.value = stage;
    embers.points.visible = stage > 0.02;
    // The tomato is the dot of the İ: a little larger while the döner is a letter.
    const dot = lerp(1.35, 1, stage);
    tomato.scale.set(dot, dot * 0.84, dot);

    tileMat.uniforms.uTime.value = t;
    const flick = 0.92 + 0.06 * Math.sin(t * 7.3) + 0.04 * Math.sin(t * 19.1 + 1.7);
    heat.intensity = 34 * flick * stage;
    halo.material.opacity = (0.85 + 0.15 * flick) * stage;
    embers.update(t, renderer);

    // Knife: comes in from the upper right, its edge travels down the cone
    // with a small sawing motion, then lifts away.
    const cut = range(p, 0.28, 0.72);
    const inK = smooth(p, 0.18, 0.3), outK = smooth(p, 0.72, 0.86);
    const yv = lerp(0.86, 0.1, cut);
    surfacePoint(yv, v3);
    const away = (1 - inK) * 1.0 + outK * 1.0;
    const saw = Math.sin(cut * 46) * 0.02 * (1 - away);
    knife.position.set(
      v3.x + Math.sin(KNIFE_ANGLE) * (away * 1.5) + Math.cos(KNIFE_ANGLE) * saw,
      v3.y + away * 0.8,
      v3.z + Math.cos(KNIFE_ANGLE) * (away * 1.5) - Math.sin(KNIFE_ANGLE) * saw,
    );
    knife.rotation.set(0.16 + away * 0.5, KNIFE_ANGLE, 0.3 + away * 0.25);
    knife.visible = away < 0.995;

    // Shavings: each leaves as the knife passes its height, then falls to the tray.
    for (let i = 0; i < shaveData.length; i++) {
      const d = shaveData[i];
      const release = 0.29 + d.u * 0.42;
      const q = range(p, release, release + 0.13);
      if (q <= 0) {
        m4.makeScale(0, 0, 0);
        shavings.setMatrixAt(i, m4);
        continue;
      }
      surfacePoint(lerp(0.86, 0.1, d.u), v3);
      const ang = KNIFE_ANGLE + d.land.a;
      const ex = Math.sin(ang) * d.land.r, ez = Math.cos(ang) * d.land.r;
      const fall = q * q;
      const out = Math.sin(Math.PI * Math.min(1, q * 1.15)) * 0.22;
      const x = lerp(v3.x, ex, q) + Math.sin(KNIFE_ANGLE) * out;
      const z = lerp(v3.z, ez, q) + Math.cos(KNIFE_ANGLE) * out;
      const y = lerp(v3.y, d.land.y, fall);
      const settle = smooth(q, 0.82, 1);
      e3.set(
        lerp(d.spin[0] * q, d.rest[0] * 0.15 + Math.PI / 2, settle),
        lerp(d.spin[1] * q + KNIFE_ANGLE, d.rest[2], settle),
        lerp(d.spin[2] * q, d.rest[1], settle),
      );
      q4.setFromEuler(e3);
      const sc = d.scale * smooth(q, 0, 0.1);
      m4.compose(s3.set(x, y, z), q4, v3.set(sc, sc, sc));
      shavings.setMatrixAt(i, m4);
    }
    shavings.instanceMatrix.needsUpdate = true;

    // Camera: slow orbit and push-in with scroll, a little parallax from the pointer.
    const tOrbit = (lerp(-0.2, 0.42, smooth(p, 0, 1)) + pointer.x * 0.1) * stage;
    const tElev = (lerp(0.1, 0.2, smooth(p, 0.1, 0.8)) - pointer.y * 0.05) * stage + (1 - stage) * 0.02;
    const tRadius = lerp(1.0, 0.9, smooth(p, 0.12, 0.62)) + smooth(p, 0.82, 1) * 0.06; // zoom factor
    if (first || !dt) {
      orbit = tOrbit; elev = tElev; radius = tRadius; first = false;
    } else {
      orbit = damp(orbit, tOrbit, 5, dt);
      elev = damp(elev, tElev, 5, dt);
      radius = damp(radius, tRadius, 5, dt);
    }
    camDir.set(Math.sin(orbit) * Math.cos(elev), Math.sin(elev), Math.cos(orbit) * Math.cos(elev));
    const a = applyFrame(camera, frame, canvas);
    boxCenter.copy(LETTER.center).lerp(STAGE.center, stage);
    fitCameraBox(camera, {
      center: boxCenter,
      width: lerp(LETTER.width, STAGE.width, stage),
      height: lerp(LETTER.height, STAGE.height, stage),
      depth: lerp(LETTER.depth, STAGE.depth, stage),
      aspect: a,
      margin: lerp(1.0, 1.03 * radius, stage),
      dir: camDir,
    });
  }

  return {
    scene,
    camera,
    update,
    resize() {},
    dispose() {
      embers.dispose();
      disposeTree(scene);
      haloTex.dispose();
      bump.dispose();
      env.dispose();
    },
  };
}
