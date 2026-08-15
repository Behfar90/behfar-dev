import * as THREE from 'three';

function makeGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(255, 255, 255, 1)'); // solid white core
  g.addColorStop(0.2, 'rgba(255, 255, 255, 1)'); // keep white before glow starts
  g.addColorStop(0.45, 'rgba(180, 200, 255, 0.5)'); // blue-white halo
  g.addColorStop(0.75, 'rgba(100, 130, 255, 0.15)'); // soft blue outer glow
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(canvas);
}

export function createStars(scene) {
  const COUNT = 2000;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const phases = new Float32Array(COUNT);
  const speeds = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    // Uniform sphere distribution, 10–80 units from origin
    const r = 10 + Math.random() * 70;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = 1;

    // Random twinkle phase and speed matching CSS (2–5 s cycle)
    phases[i] = Math.random() * Math.PI * 2;
    speeds[i] = (Math.PI * 2) / (2 + Math.random() * 3); // rad/s
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

  return { geometry, phases, speeds, count: COUNT };
}

export function updateStars({ geometry, phases, speeds, count }, elapsedTime) {
  const colors = geometry.attributes.color.array;
  for (let i = 0; i < count; i++) {
    // opacity oscillates 0.2 → 1.0, matching CSS parpadeo keyframes
    const b = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(elapsedTime * speeds[i] + phases[i]));
    colors[i * 3] = b;
    colors[i * 3 + 1] = b;
    colors[i * 3 + 2] = b; // pure white; texture gradient handles the blue glow
  }
  geometry.attributes.color.needsUpdate = true;
}
