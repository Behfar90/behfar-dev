import * as THREE from 'three';
import { smoothstep } from '../math';
import { createPuffTexture, addPuff, randomInSphere } from './nebulas';

const GALAXY_PARAMS = {
  count: 10000,
  size: 0.01,
  radius: 5,
  branches: 5,
  spin: 1,
  randomnessPower: 3,
};

const DEFAULT_INSIDE_COLOR = '#ff6030';
const DEFAULT_OUTSIDE_COLOR = '#1b3984';

const GAS_RADIUS = GALAXY_PARAMS.radius * 1.3;
const GAS_COUNT = 40;

const GALAXY_CENTERS = [
  { x: 0, y: 0, z: 0 },
  {
    x: 29,
    y: 9,
    z: -4,
    insideColor: '#ffb08a',
    outsideColor: '#7a3a8f',
  },
  { x: 16, y: -9, z: 0 },
  { x: 18, y: 10, z: 20 },
  { x: -18, y: -8, z: -22 },
  {
    x: -50,
    y: 25,
    z: -3,
    insideColor: '#fff0d2',
    outsideColor: '#3a4a9c',
    gas: { core: '#ffd9a0', edge: '#1a2258' },
  },
  {
    x: 28,
    y: -15,
    z: 16,
    insideColor: '#ffc98a',
    outsideColor: '#2f5f9e',
    gas: { core: '#f2b978', edge: '#16324f' },
  },
  {
    x: -10,
    y: -20,
    z: 28,
    insideColor: '#ffb08a',
    outsideColor: '#7a3a8f',
    gas: { core: '#ff8f6b', edge: '#3d1a4d' },
  },
  {
    x: 6,
    y: 22,
    z: 30,
    insideColor: '#fff4e0',
    outsideColor: '#7d5236',
    gas: { core: '#e8c9a0', edge: '#3b2418' },
  },
  {
    x: 16,
    y: -15,
    z: -30,
    insideColor: '#ffc98a',
    outsideColor: '#2f5f9e',
    gas: { core: '#f2b978', edge: '#16324f' },
  },
];

function buildGalaxy(scene, center) {
  const { count, size, radius, branches, spin, randomnessPower } = GALAXY_PARAMS;
  const { x, y, z } = center;
  const insideColor = center.insideColor || DEFAULT_INSIDE_COLOR;
  const outsideColor = center.outsideColor || DEFAULT_OUTSIDE_COLOR;

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
    transparent: true,
  });

  const points = new THREE.Points(geometry, material);
  points.position.set(x, y, z);
  scene.add(points);
  return points;
}

function addGalaxyGas(scene, texture, center, coreColor, edgeColor) {
  const group = new THREE.Group();
  group.position.set(center.x, center.y, center.z);
  const puffs = [];
  const core = new THREE.Color(coreColor);
  const edge = new THREE.Color(edgeColor);

  for (let i = 0; i < GAS_COUNT; i++) {
    const position = randomInSphere(GAS_RADIUS);
    const t = position.length() / GAS_RADIUS;

    addPuff(
      group,
      puffs,
      texture,
      core.clone().lerp(edge, t),
      THREE.MathUtils.randFloat(0.12, 0.28),
      THREE.MathUtils.randFloat(2.5, 5),
      position,
    );
  }

  scene.add(group);
  return puffs;
}

export function createGalaxies(scene) {
  const gasTexture = createPuffTexture();
  const points = GALAXY_CENTERS.map((center) => buildGalaxy(scene, center));
  const gasPuffs = GALAXY_CENTERS.flatMap((center) =>
    center.gas ? addGalaxyGas(scene, gasTexture, center, center.gas.core, center.gas.edge) : [],
  );
  return { originGalaxy: points[0], gasPuffs };
}

export function updateOriginGalaxyFade(originGalaxy, plungeT) {
  originGalaxy.material.opacity = 1 - smoothstep(0, 0.5, plungeT);
}
