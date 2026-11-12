// "Lezzetler" scene: four dishes on a slow carousel. The page tells the scene
// which dish is selected (state.params.index, 0..3) and the carousel turns it
// to the front; the selected dish keeps turning gently on its plate.
//
// Order: 0 döner dürüm, 1 ızgara (şiş), 2 pide, 3 lahmacun.
import {
  fitCameraBox, makeEnvironment, contactShadow, disposeTree, damp, lerp, smooth, sat,
} from '../kit.js';
import { buildPlate, buildBoard, buildDurum, buildSis, buildPide, buildLahmacun } from '../food.js';

const RING = 1.95; // carousel radius
const COUNT = 4;

export default function create({ THREE, renderer, size, reducedMotion }) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, size.w / size.h, 0.1, 100);
  const camDir = new THREE.Vector3();
  const center = new THREE.Vector3(0, 0.2, RING);
  let aspect = size.w / size.h;

  const env = makeEnvironment(renderer, {
    top: 0x2c2a22,
    bottom: 0x060605,
    panels: [
      { color: 0xfff6e6, intensity: 4.2, position: [0, 7, 3], size: [7, 5] }, // big soft top light
      { color: 0xffd9a0, intensity: 2.6, position: [-6, 3, 4], size: [3, 5] },
      { color: 0xfff0dc, intensity: 2.2, position: [6, 2.5, 5], size: [3, 5] },
      { color: 0xff9a4a, intensity: 2.0, position: [0, 1.2, -7], size: [8, 3] }, // warm rim from behind
      { color: 0x58b860, intensity: 0.9, position: [-5, 0.4, -4], size: [4, 2] },
    ],
  });
  scene.environment = env.texture;

  const key = new THREE.DirectionalLight(0xfff2de, 2.3);
  key.position.set(2.5, 6, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffa860, 1.3);
  rim.position.set(-3, 2.5, -5);
  scene.add(rim);

  const ring = new THREE.Group();
  scene.add(ring);

  const makers = [
    () => { const base = buildPlate(0.84); const food = buildDurum(); food.position.y = base.userData.top; return [base, food]; },
    () => { const base = buildPlate(0.88); const food = buildSis(); food.position.y = base.userData.top; return [base, food]; },
    () => { const base = buildBoard(1.5, 0.66); const food = buildPide(); food.scale.multiplyScalar(1.22); food.position.y = base.userData.top; return [base, food]; },
    () => { const base = buildPlate(0.86); const food = buildLahmacun(); food.position.y = base.userData.top + 0.004; return [base, food]; },
  ];
  const dishes = makers.map((make, i) => {
    const slot = new THREE.Group(); // fixed place on the ring
    const turn = new THREE.Group(); // spins on the spot
    const [base, food] = make();
    turn.add(base, food);
    const shadow = contactShadow(1.15, 1.15, 0.5);
    shadow.position.y = 0.002;
    slot.add(turn, shadow);
    const a = (i / COUNT) * Math.PI * 2;
    slot.position.set(Math.sin(a) * RING, 0, Math.cos(a) * RING);
    ring.add(slot);
    return { slot, turn, a };
  });

  let angle = 0, first = true, focus = 0;

  function update({ time, dt, pointer, params, spin }) {
    const t = reducedMotion ? 0 : time;
    const index = sat((params.index ?? 0) / (COUNT - 1)) * (COUNT - 1);
    // Shortest way round to bring the selected dish to the front, plus drag.
    const target = -(index / COUNT) * Math.PI * 2 + spin * 0.6;
    if (first || !dt) { angle = target; focus = index; first = false; }
    else { angle = damp(angle, target, 4.2, dt); focus = damp(focus, index, 4.2, dt); }
    ring.rotation.y = angle;

    dishes.forEach((d, i) => {
      const near = 1 - sat(Math.abs(i - focus)); // 1 for the dish in front
      const s = lerp(0.78, 1, smooth(near));
      d.slot.scale.setScalar(s);
      // The dish opposite the camera would only poke in at the top edge: hide it.
      let off = Math.abs(i - focus);
      off = Math.min(off, COUNT - off);
      d.slot.visible = off < 1.5;
      d.turn.rotation.y = -angle - d.a + 0.5 + t * 0.22 * near + Math.sin(t * 0.5 + i) * 0.04;
      d.slot.position.y = lerp(-0.04, 0.02, smooth(near)) + Math.sin(t * 0.9 + i * 1.7) * 0.012 * near;
    });

    const orbit = pointer.x * 0.1;
    const elev = 0.66 - pointer.y * 0.05;
    camDir.set(Math.sin(orbit) * Math.cos(elev), Math.sin(elev), Math.cos(orbit) * Math.cos(elev));
    // Portrait canvases frame only the front dish; wide ones let the neighbours peek in.
    const width = aspect < 0.9 ? 1.95 : lerp(1.95, 3.6, smooth(aspect, 0.9, 1.7));
    fitCameraBox(camera, { center, width, height: 1.55, depth: 1.7, aspect, margin: 1.04, dir: camDir });
  }

  return {
    scene,
    camera,
    update,
    resize(w, h) { aspect = w / h; },
    dispose() { disposeTree(scene); env.dispose(); },
  };
}
