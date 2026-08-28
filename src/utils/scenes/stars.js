import * as THREE from 'three';

function makeGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(255, 255, 255, 1)');
  g.addColorStop(0.2, 'rgba(255, 255, 255, 1)');
  g.addColorStop(0.45, 'rgba(180, 200, 255, 0.5)');
  g.addColorStop(0.75, 'rgba(100, 130, 255, 0.15)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(canvas);
}

const IGNITE_WINDOW = 1.8;
const FLASH_DURATION = 0.35;
const FLASH_PEAK = 1.1;

export function createStars(scene) {
  const COUNT = 2000;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const phases = new Float32Array(COUNT);
  const speeds = new Float32Array(COUNT);
  const igniteDelays = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    const r = 11 + Math.random() * 70;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = 1;

    phases[i] = Math.random() * Math.PI * 2;
    speeds[i] = (Math.PI * 2) / (2 + Math.random() * 3);

    igniteDelays[i] = Math.random() * IGNITE_WINDOW;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.3,
    map: makeGlowTexture(),
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  scene.add(new THREE.Points(geometry, material));

  return { geometry, phases, speeds, igniteDelays, count: COUNT };
}

export function updateStars(
  { geometry, phases, speeds, igniteDelays, count },
  elapsedTime,
  sinceReveal = Infinity,
) {
  const colors = geometry.attributes.color.array;
  for (let i = 0; i < count; i++) {
    const sinceIgnite = sinceReveal - igniteDelays[i];
    if (sinceIgnite < 0) {
      colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = 0;
      continue;
    }

    const twinkle = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(elapsedTime * speeds[i] + phases[i]));
    const flash = Math.max(0, 1 - sinceIgnite / FLASH_DURATION) * FLASH_PEAK;
    const b = twinkle + flash;
    colors[i * 3] = b;
    colors[i * 3 + 1] = b;
    colors[i * 3 + 2] = b;
  }
  geometry.attributes.color.needsUpdate = true;
}
