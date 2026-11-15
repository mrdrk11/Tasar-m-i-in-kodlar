// One dish on its own: used to render the menu page's still images and as
// the turning dish behind a menu category. params.dish picks the dish,
// params.rot turns it.
import { fitCameraBox, makeEnvironment, contactShadow, disposeTree } from '../kit.js';
import { buildPlate, buildBoard, buildDurum, buildSis, buildPide, buildLahmacun, buildKase, buildAyran, buildPorsiyon } from '../food.js';

const onPlate = (THREE, food, r = 0.86) => { const g = new THREE.Group(); const p = buildPlate(r); food.position.y = p.userData.top; g.add(p, food); return g; };

const big = (g) => { g.scale.setScalar(1.42); return g; };

const DISHES = {
  durum: (T) => onPlate(T, buildDurum(), 0.84),
  sis: (T) => onPlate(T, buildSis(), 0.88),
  pide: (T) => { const g = new T.Group(); const b = buildBoard(1.5, 0.66); const f = buildPide(); f.scale.multiplyScalar(1.22); f.position.y = b.userData.top; f.userData.bake?.(1); g.add(b, f); return g; },
  lahmacun: (T) => onPlate(T, buildLahmacun(), 0.86),
  corba: () => big(buildKase('corba')),
  ezme: () => big(buildKase('ezme')),
  salata: () => big(buildKase('salata')),
  kemalpasa: () => big(buildKase('kemalpasa')),
  guvec: () => big(buildKase('guvec')),
  ayran: () => { const a = buildAyran(); a.scale.setScalar(1.5); return a; },
  iskender: () => buildPorsiyon('iskender'),
  pilav: () => buildPorsiyon('pilav'),
  adana: () => buildPorsiyon('adana'),
  menu: (T) => {
    const g = new T.Group();
    const d = onPlate(T, buildDurum(), 0.8);
    d.position.x = -0.28;
    const a = buildAyran();
    a.scale.setScalar(1.25);
    a.position.set(0.82, 0, -0.1);
    g.add(d, a);
    g.scale.setScalar(0.82);
    return g;
  },
};

export default function create({ THREE, renderer, size, reducedMotion }) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, size.w / size.h, 0.1, 100);
  const dir = new THREE.Vector3();
  const center = new THREE.Vector3(0, 0.16, 0);
  let aspect = size.w / size.h;

  const env = makeEnvironment(renderer, {
    top: 0x2c2a22,
    bottom: 0x060605,
    panels: [
      { color: 0xfff6e6, intensity: 4.2, position: [0, 7, 3], size: [7, 5] },
      { color: 0xffd9a0, intensity: 2.6, position: [-6, 3, 4], size: [3, 5] },
      { color: 0xfff0dc, intensity: 2.2, position: [6, 2.5, 5], size: [3, 5] },
      { color: 0xff9a4a, intensity: 2.0, position: [0, 1.2, -7], size: [8, 3] },
    ],
  });
  scene.environment = env.texture;
  const key = new THREE.DirectionalLight(0xfff2de, 2.3);
  key.position.set(2.5, 6, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffa860, 1.3);
  rim.position.set(-3, 2.5, -5);
  scene.add(rim);

  const turn = new THREE.Group();
  scene.add(turn);
  const shadow = contactShadow(1.2, 1.2, 0.5);
  shadow.position.y = 0.002;
  scene.add(shadow);
  let current = null, dish = null;

  function update({ time, params, pointer, spin }) {
    const name = DISHES[params.dish] ? params.dish : 'durum';
    if (name !== current) {
      if (dish) { turn.remove(dish); disposeTree(dish); }
      dish = DISHES[name](THREE);
      turn.add(dish);
      current = name;
    }
    turn.rotation.y = (params.rot ?? 0.5) + spin + (reducedMotion ? 0 : time * 0.25);
    const elev = (params.elev ?? 0.72) - pointer.y * 0.05;
    const orbit = pointer.x * 0.12;
    dir.set(Math.sin(orbit) * Math.cos(elev), Math.sin(elev), Math.cos(orbit) * Math.cos(elev));
    fitCameraBox(camera, { center, width: 1.9, height: 1.25, depth: 1.8, aspect, margin: 1.03, dir });
  }

  return {
    scene,
    camera,
    update,
    resize(w, h) { aspect = w / h; },
    dispose() { disposeTree(scene); env.dispose(); },
  };
}
