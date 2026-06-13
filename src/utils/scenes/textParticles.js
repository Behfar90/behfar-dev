import * as THREE from 'three';
import gsap from 'gsap';

export function buildTextParticles(scene) {
  const offscreen = document.createElement('canvas');
  offscreen.width = 1024;
  offscreen.height = 256;
  const ctx = offscreen.getContext('2d');

  ctx.fillStyle = 'white';
  ctx.font = 'bold 75px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Behfar Behzad', offscreen.width / 2, offscreen.height / 2);

  const pixels = ctx.getImageData(0, 0, offscreen.width, offscreen.height).data;
  const sampled = [];
  const stride = 5;

  for (let y = 0; y < offscreen.height; y += stride) {
    for (let x = 0; x < offscreen.width; x += stride) {
      if (pixels[(y * offscreen.width + x) * 4 + 3] > 128) {
        sampled.push(
          (x / offscreen.width - 0.5) * 7,
          -(y / offscreen.height - 0.5) * 1.75,
          0,
        );
      }
    }
  }

  const count = sampled.length / 3;
  const target = new Float32Array(sampled);
  const start = new Float32Array(count * 3);
  const delays = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const r = 15 + Math.random() * 20;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    start[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    start[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    start[i * 3 + 2] = r * Math.cos(phi);
    delays[i] = Math.random() * 0.6;
  }

  const positions = new Float32Array(start);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: 0.05,
    color: 0xffffff,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  const proxy = { t: 0 };

  gsap.to(material, { opacity: 1, duration: 0.8, delay: 1 });

  gsap.to(proxy, {
    t: 1,
    duration: 3,
    delay: 1,
    ease: 'power3.out',
    onUpdate() {
      const pos = geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const d = delays[i];
        // per-particle staggered progress
        const raw = d < 1 ? (proxy.t - d) / (1 - d) : proxy.t;
        const p = Math.min(Math.max(raw, 0), 1);
        const e = p * p * (3 - 2 * p); // smoothstep
        pos[i * 3]     = start[i * 3]     + (target[i * 3]     - start[i * 3])     * e;
        pos[i * 3 + 1] = start[i * 3 + 1] + (target[i * 3 + 1] - start[i * 3 + 1]) * e;
        pos[i * 3 + 2] = start[i * 3 + 2] + (target[i * 3 + 2] - start[i * 3 + 2]) * e;
      }
      geometry.attributes.position.needsUpdate = true;
    },
  });

  return points;
}
