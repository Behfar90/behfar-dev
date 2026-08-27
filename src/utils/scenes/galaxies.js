import * as THREE from 'three';
import { smoothstep } from '../math';

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
    // Off by default (no per-frame cost for the 9 galaxies nothing ever
    // fades) - only the origin one gets its opacity actually driven, by
    // updateOriginGalaxyFade below, but `transparent` has to be set here,
    // at material-creation time, for a later opacity change to do anything.
    transparent: true,
  });

  const points = new THREE.Points(geometry, material);
  points.position.set(x, y, z);
  scene.add(points);
  return points;
}

export function createGalaxies(scene) {
  const points = GALAXY_CENTERS.map((center) => buildGalaxy(scene, center));
  return { originGalaxy: points[0] };
}

// `plungeT` is the same 0-1 progress Universe.jsx's orbitTarget derives for
// the plunge's radius collapse. This galaxy sits at the coordinate origin -
// exactly where that collapse dives toward - and its PointsMaterial has no
// texture map (unlike stars.js/nebulas.js), so individual points render as
// flat squares that balloon into confusing shapes at extreme close range.
// Fully transparent by the *halfway* point of the plunge, not the very end,
// so it's safely gone well before the camera's closest approach rather than
// racing it.
export function updateOriginGalaxyFade(originGalaxy, plungeT) {
  originGalaxy.material.opacity = 1 - smoothstep(0, 0.5, plungeT);
}
