// Kit self-test: reflections, embers, flame, contact shadow. Not shipped.
import { fitCamera, makeEnvironment, Embers, flameMaterial, contactShadow, disposeTree } from '../kit.js';

export default function create({ THREE, renderer, size }) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, size.w / size.h, 0.1, 100);
  const env = makeEnvironment(renderer, {
    top: 0x3a2a1a, bottom: 0x060504,
    panels: [
      { color: 0xffb060, intensity: 6, position: [4, 3, 2], size: [4, 5] },
      { color: 0xfff1d8, intensity: 3, position: [-5, 4, 3], size: [3, 6] },
      { color: 0x2e7d32, intensity: 1.5, position: [0, -1, -6], size: [8, 3] },
    ],
  });
  scene.environment = env.texture;
  const key = new THREE.DirectionalLight(0xffc48a, 2.2);
  key.position.set(3, 5, 4);
  scene.add(key);

  const metal = new THREE.Mesh(new THREE.SphereGeometry(0.8, 48, 32), new THREE.MeshStandardMaterial({ color: 0xd9d9d9, metalness: 1, roughness: 0.18 }));
  metal.position.set(-1.1, 0.8, 0);
  const clay = new THREE.Mesh(new THREE.SphereGeometry(0.8, 48, 32), new THREE.MeshPhysicalMaterial({ color: 0x8a3d16, roughness: 0.55, clearcoat: 0.6, clearcoatRoughness: 0.35 }));
  clay.position.set(1.1, 0.8, 0);
  const s1 = contactShadow(1.1, 1.1, 0.7); s1.position.set(-1.1, 0.01, 0);
  const s2 = contactShadow(1.1, 1.1, 0.7); s2.position.set(1.1, 0.01, 0);
  const flame = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.8), flameMaterial());
  flame.position.set(0, 0.9, -1.2);
  const embers = new Embers({ count: 140, area: [4, 4, 2], origin: [0, 0, -0.5] });
  scene.add(metal, clay, s1, s2, flame, embers.points);

  return {
    scene, camera,
    update({ time }) {
      flame.material.uniforms.uTime.value = time;
      embers.update(time, renderer);
    },
    resize(w, h) {
      fitCamera(camera, { center: new THREE.Vector3(0, 1.1, 0), radius: 2.3, aspect: w / h });
    },
    dispose() { embers.dispose(); disposeTree(scene); env.dispose(); },
  };
}
