// Minimal scene used to test the host and the lab; not shipped.
export default function create({ THREE, size }) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, size.w / size.h, 0.1, 50);
  camera.position.set(0, 0.6, 6);
  scene.add(new THREE.HemisphereLight(0xfff2d6, 0x12301a, 1.1));
  const key = new THREE.DirectionalLight(0xffb060, 3);
  key.position.set(3, 4, 2);
  scene.add(key);
  const mesh = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1, 0.34, 160, 24),
    new THREE.MeshStandardMaterial({ color: 0xf2ab00, roughness: 0.35, metalness: 0.2 }),
  );
  scene.add(mesh);
  return {
    scene,
    camera,
    update({ time, progress, pointer, spin }) {
      mesh.rotation.y = time * 0.5 + progress * Math.PI * 2 + spin;
      mesh.rotation.x = pointer.y * 0.3;
      mesh.position.x = pointer.x * 0.4;
    },
    resize(w, h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
    dispose() {
      mesh.geometry.dispose();
      mesh.material.dispose();
    },
  };
}
