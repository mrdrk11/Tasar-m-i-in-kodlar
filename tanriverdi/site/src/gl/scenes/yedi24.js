// "7/24" scene: heavy golden numerals under a sky where the sun and the moon
// take turns. Scrolling moves the sky from day to night and back, so the
// light on the numerals goes from warm to cool: open every hour of the day.
//
// state.progress 0 → 1 = one full day (sun overhead → moon overhead → sun).
import { numeralGeometry } from '../numerals.js';
import {
  fitCameraBox, makeEnvironment, radialTexture, disposeTree, rng, damp, smooth, sat, tier,
} from '../kit.js';

export default function create({ THREE, renderer, quality, size, reducedMotion }) {
  const Q = tier(quality, { high: { stars: 160, curve: 10 }, mid: { stars: 110, curve: 7 }, low: { stars: 70, curve: 5 } });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, size.w / size.h, 0.1, 100);
  const center = new THREE.Vector3(0, 0, 0);
  const camDir = new THREE.Vector3();
  let aspect = size.w / size.h;

  const env = makeEnvironment(renderer, {
    top: 0x2a2018,
    bottom: 0x070605,
    panels: [
      { color: 0xfff2dc, intensity: 3.0, position: [0, 6, 4], size: [7, 4] },
      { color: 0xffc98a, intensity: 2.2, position: [-6, 1, 3], size: [3, 6] },
      { color: 0xbcd4ff, intensity: 1.6, position: [6, 1.5, 2], size: [3, 6] },
      { color: 0xff8a3c, intensity: 1.5, position: [0, -3, 5], size: [6, 2] },
    ],
  });
  scene.environment = env.texture;
  scene.environmentIntensity = 0.85;

  /* Numerals */
  const geo = numeralGeometry('7/24', { size: 2.0, depth: 0.52, bevel: 0.055, curveSegments: Q.curve, tracking: 0.02 });
  const bb = geo.boundingBox;
  const width = bb.max.x - bb.min.x, height = bb.max.y - bb.min.y;
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xf5b21a, metalness: 0.78, roughness: 0.28, clearcoat: 0.5, clearcoatRoughness: 0.18 });
  const side = new THREE.MeshPhysicalMaterial({ color: 0xd9861a, metalness: 0.7, roughness: 0.4 });
  const numerals = new THREE.Mesh(geo, [gold, side]);
  const rig = new THREE.Group();
  rig.add(numerals);
  scene.add(rig);

  // Front light whose colour follows the time of day keeps the numerals readable.
  const front = new THREE.DirectionalLight(0xffe2b8, 2.4);
  front.position.set(0.6, 1.2, 6);
  scene.add(front);
  const warm = new THREE.Color(0xffdcae), cool = new THREE.Color(0xb9ccff);

  /* Sun and moon travel a tall arc behind the numerals */
  const orbit = new THREE.Group();
  orbit.position.z = -0.75;
  scene.add(orbit);
  const RX = width * 0.5 + 0.75, RY = height * 0.5 + 0.95;

  const sunGlow = radialTexture(128, [[0, 'rgba(255,214,120,1)'], [0.25, 'rgba(255,150,40,0.55)'], [1, 'rgba(255,90,0,0)']]);
  const sun = new THREE.Group();
  sun.add(new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 20), new THREE.MeshBasicMaterial({ color: 0xffc24a, toneMapped: false })));
  const sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunGlow, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }));
  sunHalo.scale.setScalar(2.4);
  sun.add(sunHalo);
  const sunLight = new THREE.PointLight(0xffb060, 50, 12, 1.6);
  sun.add(sunLight);
  orbit.add(sun);

  const moonGlow = radialTexture(128, [[0, 'rgba(200,220,255,0.7)'], [0.3, 'rgba(140,170,255,0.25)'], [1, 'rgba(90,120,255,0)']]);
  const moon = new THREE.Group();
  const moonBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 32, 20),
    new THREE.MeshStandardMaterial({ color: 0xe8eeff, roughness: 0.9, emissive: 0x9fb4e8, emissiveIntensity: 0.55 }),
  );
  moon.add(moonBall);
  const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonGlow, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }));
  moonHalo.scale.setScalar(1.7);
  moon.add(moonHalo);
  const moonLight = new THREE.PointLight(0x9db8ff, 30, 12, 1.6);
  moon.add(moonLight);
  orbit.add(moon);

  /* Stars: only visible at night */
  const r = rng(77);
  const starPos = new Float32Array(Q.stars * 3), starRnd = new Float32Array(Q.stars);
  for (let i = 0; i < Q.stars; i++) {
    starPos[i * 3] = (r() - 0.5) * (width + 3.4);
    starPos[i * 3 + 1] = (r() - 0.5) * (height + 2.6);
    starPos[i * 3 + 2] = -1.4 - r() * 1.6;
    starRnd[i] = r();
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('aRnd', new THREE.BufferAttribute(starRnd, 1));
  const starMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    uniforms: { uTime: { value: 0 }, uNight: { value: 0 }, uScale: { value: 1 } },
    vertexShader: `attribute float aRnd; uniform float uTime, uScale; varying float vTw;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
        vTw = 0.55 + 0.45 * sin(uTime * (1.2 + aRnd * 2.4) + aRnd * 40.0);
        gl_PointSize = (60.0 + aRnd * 150.0) * uScale / max(0.001, -mv.z); }`,
    fragmentShader: `uniform float uNight; varying float vTw;
      void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c);
        float core = smoothstep(0.5, 0.0, d); float ray = max(0.0, 1.0 - abs(c.x) * 14.0) * max(0.0, 1.0 - abs(c.y) * 3.0) + max(0.0, 1.0 - abs(c.y) * 14.0) * max(0.0, 1.0 - abs(c.x) * 3.0);
        gl_FragColor = vec4(vec3(0.82, 0.88, 1.0) * (core * core + ray * 0.5) * vTw * uNight, 1.0); }`,
  });
  const stars = new THREE.Points(starGeo, starMat);
  stars.frustumCulled = false;
  scene.add(stars);

  let phase = 0, first = true;

  function update({ time, dt, progress: p, pointer, spin }) {
    const t = reducedMotion ? 0 : time;
    const target = p * Math.PI * 2 + t * 0.1;
    if (first || !dt) { phase = target; first = false; } else phase = damp(phase, target, 6, dt);
    // phase 0: sun at the top of its arc; phase π: moon at the top.
    const sx = Math.sin(phase), sy = Math.cos(phase);
    sun.position.set(sx * RX, sy * RY, 0);
    moon.position.set(-sx * RX, -sy * RY, 0);
    const day = smooth(sy, -0.35, 0.45); // 1 while the sun is up
    const night = 1 - day;
    // Whoever is below the horizon sinks out of sight instead of crossing under the numerals.
    const sunUp = smooth(sy, -0.5, -0.05), moonUp = smooth(-sy, -0.5, -0.05);
    sun.scale.setScalar(0.001 + sunUp);
    moon.scale.setScalar(0.001 + moonUp);
    sunLight.intensity = 50 * sunUp;
    moonLight.intensity = 30 * moonUp;
    front.color.copy(cool).lerp(warm, day);
    front.intensity = 1.5 + 0.9 * day;
    starMat.uniforms.uTime.value = t;
    starMat.uniforms.uNight.value = smooth(night, 0.25, 0.85);
    starMat.uniforms.uScale.value = renderer.domElement.height / 800;
    scene.environmentIntensity = 0.7 + 0.5 * day;

    rig.rotation.y = Math.sin(t * 0.35) * 0.1 + pointer.x * 0.22 + spin;
    rig.rotation.x = Math.sin(t * 0.27 + 1) * 0.04 - pointer.y * 0.1;
    rig.position.y = Math.sin(t * 0.6) * 0.04;

    camDir.set(0, 0.04, 1);
    fitCameraBox(camera, { center, width: width + 2.2, height: height + 2.5, depth: 2.4, aspect, margin: 1.02, dir: camDir });
  }

  return {
    scene,
    camera,
    update,
    resize(w, h) { aspect = w / h; },
    dispose() { disposeTree(scene); sunGlow.dispose(); moonGlow.dispose(); env.dispose(); },
  };
}
