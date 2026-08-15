import * as THREE from 'three';

const GALAXY_PARAMS = {
  count: 10000,
  size: 0.01,
  radius: 5,
  branches: 5,
  spin: 1,
  randomnessPower: 3,
  insideColor: '#ff6030',
  outsideColor: '#1b3984',
};

const GALAXY_CENTERS = [
  { x: 0, y: 0, z: 0 },
  { x: 8, y: 2, z: -5 },
  { x: -6, y: -3, z: 4 },
  { x: 18, y: 10, z: 20 },
  { x: -18, y: -8, z: -22 },
  { x: -30, y: 15, z: -18 },
  { x: 28, y: -15, z: 16 },
  { x: -10, y: -20, z: 28 },
  { x: 6, y: 22, z: 30 },
  { x: 20, y: 8, z: -12 },
];

function buildGalaxy(scene, { x, y, z }) {
  const { count, size, radius, branches, spin, randomnessPower, insideColor, outsideColor } =
    GALAXY_PARAMS;

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const colorIn = new THREE.Color(insideColor);
  const colorOut = new THREE.Color(outsideColor);
  const rand = (pow) => Math.pow(Math.random(), pow) * (Math.random() < 0.5 ? 1 : -1);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const r = Math.random() * radius;
    const spinAngle = r * spin;
    const branchAngle = ((i % branches) / branches) * Math.PI * 2;

    positions[i3] = Math.cos(branchAngle + spinAngle) * r + rand(randomnessPower);
    positions[i3 + 1] = rand(randomnessPower);
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + rand(randomnessPower);

    const mixed = colorIn.clone().lerp(colorOut, r / radius);
    colors[i3] = mixed.r;
    colors[i3 + 1] = mixed.g;
    colors[i3 + 2] = mixed.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });

  const points = new THREE.Points(geometry, material);
  points.position.set(x, y, z);
  scene.add(points);
}

export function createGalaxies(scene) {
  GALAXY_CENTERS.forEach((center) => buildGalaxy(scene, center));
}
