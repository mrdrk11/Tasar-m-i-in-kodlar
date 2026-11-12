// Shared building blocks for every 3D scene: camera fitting, a procedural
// studio environment for reflections, noise, canvas textures, embers, flame
// and contact-shadow helpers. Scenes import from here so they look like one
// family and share one copy of this code.
import * as THREE from 'three';

/* ----------------------------------------------------------------------- */
/* Maths                                                                    */
/* ----------------------------------------------------------------------- */

export const sat = (x) => Math.min(1, Math.max(0, x));
export const lerp = (a, b, t) => a + (b - a) * t;
/** 0 before `a`, 1 after `b`, linear between. */
export const range = (x, a, b) => sat((x - a) / (b - a));
/** Like `range` but eased in and out. */
export const smooth = (x, a = 0, b = 1) => {
  const t = range(x, a, b);
  return t * t * (3 - 2 * t);
};
export const easeOutCubic = (t) => 1 - Math.pow(1 - sat(t), 3);
export const easeInOutCubic = (t) => {
  const x = sat(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** Frame-rate independent approach of `current` toward `target`. */
export const damp = (current, target, lambda, dt) => lerp(current, target, 1 - Math.exp(-lambda * dt));

/** Deterministic pseudo-random generator (mulberry32). */
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Value noise in 3D with smooth interpolation; cheap and good enough for
// displacing geometry on the CPU at build time.
function hash3(x, y, z) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const c = (dx, dy, dz) => hash3(xi + dx, yi + dy, zi + dz);
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), u), x10 = lerp(c(0, 1, 0), c(1, 1, 0), u);
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), u), x11 = lerp(c(0, 1, 1), c(1, 1, 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w) * 2 - 1;
}
export function fbm3(x, y, z, octaves = 4) {
  let sum = 0, amp = 0.5, f = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise3(x * f, y * f, z * f);
    f *= 2.02;
    amp *= 0.5;
  }
  return sum;
}

/* ----------------------------------------------------------------------- */
/* GLSL                                                                     */
/* ----------------------------------------------------------------------- */

export const GLSL_NOISE = /* glsl */ `
float kHash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float kNoise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(kHash(i + vec3(0,0,0)), kHash(i + vec3(1,0,0)), f.x),
                 mix(kHash(i + vec3(0,1,0)), kHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(kHash(i + vec3(0,0,1)), kHash(i + vec3(1,0,1)), f.x),
                 mix(kHash(i + vec3(0,1,1)), kHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float kFbm(vec3 p){ float s = 0.0; float a = 0.5; for (int i = 0; i < 4; i++){ s += a * kNoise(p); p *= 2.02; a *= 0.5; } return s; }
`;

/* ----------------------------------------------------------------------- */
/* Camera                                                                   */
/* ----------------------------------------------------------------------- */

/**
 * Place a perspective camera so a sphere (the subject) fits the canvas with a
 * margin at any aspect ratio. `dir` is the direction from the subject toward
 * the camera. Returns the distance used.
 */
export function fitCamera(camera, { center, radius, aspect, margin = 1.12, dir }) {
  camera.aspect = aspect;
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  const fit = Math.min(vFov, hFov);
  const dist = (radius * margin) / Math.sin(fit / 2);
  const d = (dir || new THREE.Vector3(0, 0.12, 1)).clone().normalize();
  camera.position.copy(center).addScaledVector(d, dist);
  camera.near = Math.max(0.05, dist - radius * 3);
  camera.far = dist + radius * 6;
  camera.lookAt(center);
  camera.updateProjectionMatrix();
  return dist;
}

/**
 * Like fitCamera, but for a subject described by a box (width x height x
 * depth): tall or wide subjects fill the canvas better than with a sphere.
 */
export function fitCameraBox(camera, { center, width, height, depth = 0, aspect, margin = 1.08, dir }) {
  camera.aspect = aspect;
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  const dist = Math.max((height / 2) / Math.tan(vFov / 2), (width / 2) / Math.tan(hFov / 2)) * margin + depth / 2;
  const d = (dir || new THREE.Vector3(0, 0.12, 1)).clone().normalize();
  camera.position.copy(center).addScaledVector(d, dist);
  const reach = Math.max(width, height, depth);
  camera.near = Math.max(0.05, dist - reach * 1.5);
  camera.far = dist + reach * 4;
  camera.lookAt(center);
  camera.updateProjectionMatrix();
  return dist;
}

/**
 * Draw the subject inside a part of the canvas. `frame` is { x, y, w, h } as
 * fractions of the canvas (origin top left) or null for the whole canvas;
 * `size` is the canvas size in CSS pixels. Call it before fitCamera /
 * fitCameraBox and pass the returned aspect ratio to them.
 */
export function applyFrame(camera, frame, size) {
  if (!frame) {
    if (camera.view) camera.clearViewOffset();
    return size.w / size.h;
  }
  const fw = Math.max(1, frame.w * size.w), fh = Math.max(1, frame.h * size.h);
  camera.setViewOffset(fw, fh, -frame.x * size.w, -frame.y * size.h, size.w, size.h);
  return fw / fh;
}

/* ----------------------------------------------------------------------- */
/* Environment (reflections without any downloaded HDRI)                    */
/* ----------------------------------------------------------------------- */

/**
 * Build a small "studio" out of glowing panels and bake it into an
 * environment map. Give panels as { color, intensity, position:[x,y,z],
 * size:[w,h] }; each faces the origin.
 */
export function makeEnvironment(renderer, {
  top = 0x2a2018,
  bottom = 0x050403,
  panels = [],
  blur = 0.04,
} = {}) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(20, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { uTop: { value: new THREE.Color(top) }, uBottom: { value: new THREE.Color(bottom) } },
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying vec3 vP; uniform vec3 uTop; uniform vec3 uBottom; void main(){ float h = normalize(vP).y * 0.5 + 0.5; gl_FragColor = vec4(mix(uBottom, uTop, smoothstep(0.0, 1.0, h)), 1.0); }',
    }),
  );
  env.add(sky);
  const disposables = [sky.geometry, sky.material];
  for (const p of panels) {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(p.color).multiplyScalar(p.intensity ?? 1), side: THREE.DoubleSide });
    const geo = new THREE.PlaneGeometry(p.size?.[0] ?? 4, p.size?.[1] ?? 4);
    const m = new THREE.Mesh(geo, mat);
    m.position.fromArray(p.position);
    m.lookAt(0, 0, 0);
    env.add(m);
    disposables.push(geo, mat);
  }
  const target = pmrem.fromScene(env, blur);
  disposables.forEach((d) => d.dispose());
  pmrem.dispose();
  return target; // use target.texture; call target.dispose() on teardown
}

/* ----------------------------------------------------------------------- */
/* Textures                                                                 */
/* ----------------------------------------------------------------------- */

/** Draw into a 2D canvas and get a texture back. */
export function canvasTexture(width, height, draw, { srgb = true, repeat, anisotropy = 4, mipmaps = true } = {}) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  draw(c.getContext('2d'), width, height);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  t.anisotropy = anisotropy;
  t.generateMipmaps = mipmaps;
  if (!mipmaps) t.minFilter = THREE.LinearFilter;
  return t;
}

/** Soft round blob, used for contact shadows and glows. */
export function radialTexture(size = 128, stops = [[0, 'rgba(0,0,0,0.75)'], [0.55, 'rgba(0,0,0,0.28)'], [1, 'rgba(0,0,0,0)']]) {
  return canvasTexture(size, size, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    for (const [o, c] of stops) grad.addColorStop(o, c);
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }, { srgb: true, mipmaps: false });
}

/** A dark soft ellipse to ground an object; lay it flat just above the floor. */
export function contactShadow(radiusX = 1, radiusZ = radiusX, opacity = 0.6) {
  const tex = radialTexture(128);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false, toneMapped: false }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.scale.set(radiusX, radiusZ, 1);
  mesh.renderOrder = -1;
  mesh.userData.dispose = () => { tex.dispose(); mesh.geometry.dispose(); mesh.material.dispose(); };
  return mesh;
}

/* ----------------------------------------------------------------------- */
/* Embers                                                                   */
/* ----------------------------------------------------------------------- */

/**
 * Glowing sparks that rise, drift and flicker inside a box.
 * `area` = [width, height, depth] centred on `origin` (sparks start at the
 * bottom). Entirely in the vertex shader, so it costs one draw call.
 */
export class Embers {
  constructor({ count = 120, area = [3, 4, 2], origin = [0, 0, 0], size = 26, colorA = 0xffd27a, colorB = 0xff5a14, speed = 0.35, seed = 7 } = {}) {
    const r = rng(seed);
    const pos = new Float32Array(count * 3);
    const rnd = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (r() - 0.5) * area[0];
      pos[i * 3 + 1] = r();
      pos[i * 3 + 2] = (r() - 0.5) * area[2];
      rnd[i * 4] = r(); rnd[i * 4 + 1] = r(); rnd[i * 4 + 2] = r(); rnd[i * 4 + 3] = r();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 4));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(...origin), Math.max(...area) * 1.2);
    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      // Add light to RGB and leave the canvas alpha untouched, so the sparks
      // also glow over the page behind a transparent canvas.
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: size },
        uHeight: { value: area[1] },
        uSpeed: { value: speed },
        uOrigin: { value: new THREE.Vector3(...origin) },
        uA: { value: new THREE.Color(colorA) },
        uB: { value: new THREE.Color(colorB) },
        uPixelRatio: { value: 1 },
        uIntensity: { value: 1 },
      },
      vertexShader: /* glsl */ `
        attribute vec4 aRnd;
        uniform float uTime, uSize, uHeight, uSpeed, uPixelRatio;
        uniform vec3 uOrigin;
        varying float vLife; varying float vMix; varying float vFlick;
        void main(){
          float life = fract(position.y + uTime * uSpeed * (0.45 + aRnd.x * 0.9));
          vec3 p = vec3(position.x, life * uHeight, position.z);
          float sway = 0.18 + aRnd.y * 0.35;
          p.x += sin(uTime * (0.6 + aRnd.z) + aRnd.w * 6.283 + life * 5.0) * sway * life;
          p.z += cos(uTime * (0.5 + aRnd.y) + aRnd.x * 6.283 + life * 4.0) * sway * 0.6 * life;
          p += uOrigin;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          vLife = life; vMix = aRnd.z;
          vFlick = 0.65 + 0.35 * sin(uTime * (6.0 + aRnd.w * 9.0) + aRnd.x * 40.0);
          float s = uSize * (0.35 + aRnd.w * 0.9) * (1.0 - life * 0.6);
          gl_PointSize = s * uPixelRatio / max(0.001, -mv.z);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uA, uB; uniform float uIntensity;
        varying float vLife; varying float vMix; varying float vFlick;
        void main(){
          vec2 c = gl_PointCoord - 0.5; float d = length(c);
          float core = smoothstep(0.5, 0.0, d);
          float fade = smoothstep(0.0, 0.08, vLife) * (1.0 - smoothstep(0.55, 1.0, vLife));
          vec3 col = mix(uA, uB, clamp(vLife * 1.3 + vMix * 0.4, 0.0, 1.0));
          gl_FragColor = vec4(col * core * core * fade * vFlick * uIntensity, 1.0);
        }`,
    });
    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
  }

  /** Pass the renderer so spark size stays proportional to the canvas height. */
  update(time, renderer) {
    this.material.uniforms.uTime.value = time;
    // Point sizes are in device pixels; scale with the drawing buffer height.
    if (renderer) this.material.uniforms.uPixelRatio.value = renderer.domElement.height / 800;
  }

  dispose() {
    this.points.geometry.dispose();
    this.material.dispose();
  }
}

/* ----------------------------------------------------------------------- */
/* Flame                                                                    */
/* ----------------------------------------------------------------------- */

/**
 * Stylised fire for a flat or curved surface (UV v = 0 at the base, 1 at the
 * tip; hide the base behind logs or a ledge). `occlusion` 0 = pure glow that
 * adds light to whatever is behind, 1 = opaque flame body.
 */
export function flameMaterial({ core = 0xfff0b8, mid = 0xffa01c, edge = 0xc7330a, speed = 1, tongues = 3.2, intensity = 1.15, occlusion = 0.55 } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    // Premultiplied "over": rgb is already multiplied by coverage.
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    uniforms: {
      uTime: { value: 0 },
      uCore: { value: new THREE.Color(core) },
      uMid: { value: new THREE.Color(mid) },
      uEdge: { value: new THREE.Color(edge) },
      uSpeed: { value: speed },
      uTongues: { value: tongues },
      uIntensity: { value: intensity },
      uOcclusion: { value: occlusion },
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      uniform float uTime, uSpeed, uTongues, uIntensity, uOcclusion;
      uniform vec3 uCore, uMid, uEdge;
      ${GLSL_NOISE}
      void main(){
        vec2 uv = vUv;
        float t = uTime * uSpeed;
        // Tongues lean and wobble more toward the tip.
        uv.x += (kNoise(vec3(uv.y * 2.4 - t * 1.3, t * 0.4, 3.0)) - 0.5) * 0.22 * uv.y;
        float n = kFbm(vec3(uv.x * uTongues, uv.y * 2.2 - t * 1.6, t * 0.35));
        float n2 = kFbm(vec3(uv.x * uTongues * 2.3 + 4.0, uv.y * 4.0 - t * 2.6, t * 0.5));
        float side = 1.0 - abs(uv.x - 0.5) * 2.0;
        float shape = side * (1.0 - uv.y) * 1.9 + (n - 0.5) * 0.9 + (n2 - 0.5) * 0.35 - uv.y * 0.55;
        float body = smoothstep(0.2, 0.7, shape);
        float hot = smoothstep(0.75, 1.25, shape);
        vec3 col = mix(uEdge, uMid, smoothstep(0.2, 0.75, shape));
        col = mix(col, uCore, hot * 0.85);
        // Fade the very base and the side edges so no straight edge shows.
        float fade = smoothstep(0.0, 0.16, uv.y) * smoothstep(0.0, 0.12, side);
        float a = body * fade;
        gl_FragColor = vec4(col * a * uIntensity, a * uOcclusion);
      }`,
  });
}

/* ----------------------------------------------------------------------- */
/* Housekeeping                                                             */
/* ----------------------------------------------------------------------- */

/** Dispose every geometry, material and texture under `root`. */
export function disposeTree(root) {
  const seen = new Set();
  root.traverse((o) => {
    o.userData?.dispose?.();
    if (o.geometry && !seen.has(o.geometry)) { seen.add(o.geometry); o.geometry.dispose(); }
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats) {
      if (seen.has(m)) continue;
      seen.add(m);
      for (const v of Object.values(m)) if (v && v.isTexture && !seen.has(v)) { seen.add(v); v.dispose(); }
      if (m.uniforms) for (const u of Object.values(m.uniforms)) if (u.value?.isTexture && !seen.has(u.value)) { seen.add(u.value); u.value.dispose(); }
      m.dispose();
    }
  });
}

/** Quality tier → numbers scenes can use for segment counts and particle counts. */
export function tier(quality, { high, mid, low }) {
  return quality === 'high' ? high : quality === 'mid' ? mid : low;
}
