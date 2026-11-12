// Logo medallion: a heavy brass coin. The front carries the restaurant's logo
// under glossy enamel, the back says 1988 in raised gold on green.
// It sways gently, follows the pointer, and turns over as the page scrolls.
//
// state.progress 0 → 1 = half a turn (logo side → 1988 side).
import { fitCameraBox, makeEnvironment, disposeTree, damp, tier } from '../kit.js';
import { numeralGeometry } from '../numerals.js';

const LOGO_URL = `${import.meta.env.BASE_URL}brand/logo-894.webp`;

export default async function create({ THREE, renderer, quality, size, reducedMotion }) {
  const Q = tier(quality, { high: { seg: 160 }, mid: { seg: 112 }, low: { seg: 72 } });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, size.w / size.h, 0.1, 100);
  const center = new THREE.Vector3(0, 0, 0);
  const camDir = new THREE.Vector3(0, 0, 1);
  let aspect = size.w / size.h;

  const env = makeEnvironment(renderer, {
    top: 0x3a3226,
    bottom: 0x080705,
    panels: [
      { color: 0xfff4e2, intensity: 4.0, position: [-4, 5, 5], size: [4, 5] },
      { color: 0xffd9a0, intensity: 2.6, position: [5, 1, 4], size: [3, 6] },
      { color: 0xff8a3c, intensity: 2.2, position: [0, -4, 3], size: [6, 2] },
      { color: 0x6fd08a, intensity: 1.2, position: [-5, -1, -3], size: [4, 4] },
      { color: 0xffffff, intensity: 1.6, position: [0, 0.5, 7], size: [2, 6] },
    ],
  });
  scene.environment = env.texture;
  const key = new THREE.DirectionalLight(0xfff2de, 1.6);
  key.position.set(-2, 3, 5);
  scene.add(key);

  const coin = new THREE.Group();
  scene.add(coin);
  const T = 0.15; // thickness
  const brass = new THREE.MeshPhysicalMaterial({ color: 0xe0a72c, metalness: 0.92, roughness: 0.3, clearcoat: 0.3, clearcoatRoughness: 0.25 });

  // Body with a reeded edge.
  const bodyGeo = new THREE.CylinderGeometry(1, 1, T, Q.seg * 2, 1, false);
  {
    const p = bodyGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), d = Math.hypot(x, z);
      if (d > 0.99) {
        const a = Math.atan2(z, x);
        const k = 1 + (Math.round(a / (Math.PI * 2) * Q.seg * 2) % 2 === 0 ? 0.012 : -0.004);
        p.setX(i, x * k);
        p.setZ(i, z * k);
      }
    }
    bodyGeo.computeVertexNormals();
  }
  const body = new THREE.Mesh(bodyGeo, brass);
  body.rotation.x = Math.PI / 2;
  coin.add(body);

  // Raised rims on both faces, and a ring of studs on the back.
  for (const s of [1, -1]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.935, 0.05, 14, Q.seg), brass);
    rim.position.z = s * (T / 2);
    coin.add(rim);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(0.855, 0.012, 8, Q.seg), brass);
    inner.position.z = s * (T / 2 + 0.006);
    coin.add(inner);
  }

  // Front: the logo, loaded as a texture and set under glossy enamel.
  const logo = await new THREE.TextureLoader().loadAsync(LOGO_URL);
  logo.colorSpace = THREE.SRGBColorSpace;
  logo.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const front = new THREE.Mesh(
    new THREE.CircleGeometry(0.85, Q.seg),
    new THREE.MeshPhysicalMaterial({ map: logo, roughness: 0.42, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08 }),
  );
  front.position.z = T / 2 + 0.004;
  coin.add(front);

  // Back: green enamel with 1988 in raised gold.
  const back = new THREE.Mesh(
    new THREE.CircleGeometry(0.85, Q.seg),
    new THREE.MeshPhysicalMaterial({ color: 0x1f5a1a, roughness: 0.4, clearcoat: 1, clearcoatRoughness: 0.1 }),
  );
  back.rotation.y = Math.PI;
  back.position.z = -(T / 2 + 0.004);
  coin.add(back);
  const year = new THREE.Mesh(numeralGeometry('1988', { size: 0.5, depth: 0.045, bevel: 0.014, curveSegments: 6, tracking: 0.01 }), brass);
  year.rotation.y = Math.PI;
  year.position.z = -(T / 2 + 0.03);
  coin.add(year);
  const studGeo = new THREE.SphereGeometry(0.022, 10, 8);
  const studs = new THREE.InstancedMesh(studGeo, brass, 28);
  const m = new THREE.Matrix4();
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    m.makeTranslation(Math.cos(a) * 0.72, Math.sin(a) * 0.72, -(T / 2 + 0.008));
    studs.setMatrixAt(i, m);
  }
  coin.add(studs);
  // Two small bars above and below the year, like a struck coin.
  for (const y of [0.36, -0.36]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.022, 0.03), brass);
    bar.position.set(0, y, -(T / 2 + 0.016));
    coin.add(bar);
  }

  let ry = 0, rx = 0, first = true;

  function update({ time, dt, progress: p, pointer, spin }) {
    const t = reducedMotion ? 0 : time;
    const ty = p * Math.PI + Math.sin(t * 0.7) * 0.22 + pointer.x * 0.5 + spin;
    const tx = Math.sin(t * 0.5 + 0.8) * 0.07 - pointer.y * 0.3;
    if (first || !dt) { ry = ty; rx = tx; first = false; }
    else { ry = damp(ry, ty, 6, dt); rx = damp(rx, tx, 6, dt); }
    coin.rotation.set(rx, ry, 0);
    coin.position.y = Math.sin(t * 0.9) * 0.025;
    fitCameraBox(camera, { center, width: 2.35, height: 2.35, depth: 1, aspect, margin: 1.03, dir: camDir });
  }

  return {
    scene,
    camera,
    update,
    resize(w, h) { aspect = w / h; },
    dispose() { disposeTree(scene); env.dispose(); },
  };
}
