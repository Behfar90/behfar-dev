import * as THREE from 'three';

// Soft radial-gradient "puff" sprite, generated once and shared by every
// nebula instance instead of loading an external texture asset.
function createPuffTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.35)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

// Small, sharp-cored sprite for the bright embedded stars scattered through
// a couple of the reference photos.
function createStarTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.9)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.2)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

function addPuff(group, puffs, texture, color, opacity, scale, position) {
  const material = new THREE.SpriteMaterial({
    map: texture,
    color,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.setScalar(scale);
  sprite.position.copy(position);
  group.add(sprite);

  puffs.push({
    sprite,
    basePosition: position.clone(),
    driftPhase: Math.random() * Math.PI * 2,
    driftSpeed: 0.05 + Math.random() * 0.06,
    baseRotation: Math.random() * Math.PI * 2,
    rotSpeed: THREE.MathUtils.randFloatSpread(0.06),
  });
}

function randomInSphere(radius) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = radius * Math.cbrt(Math.random());
  return new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta) * r,
    Math.sin(phi) * Math.sin(theta) * r,
    Math.cos(phi) * r,
  );
}

function addEmbeddedStars(group, puffs, texture, color, count, radius) {
  for (let i = 0; i < count; i++) {
    addPuff(
      group,
      puffs,
      texture,
      color,
      THREE.MathUtils.randFloat(0.6, 0.9),
      THREE.MathUtils.randFloat(0.35, 0.85),
      randomInSphere(radius * 0.7),
    );
  }
}

// Bipolar "wing" cloud with a bright core, echoing the Lagoon Nebula's
// hourglass lobes and white-core-into-magenta palette.
function buildWingNebula(scene, texture, starTexture, center, radius, count) {
  const group = new THREE.Group();
  group.position.set(center.x, center.y, center.z);
  const puffs = [];

  const core = new THREE.Color('#fff3e0');
  const mid = new THREE.Color('#e79bff');
  const edge = new THREE.Color('#7d3fb0');

  for (let i = 0; i < count; i++) {
    const lobeSign = Math.random() < 0.5 ? 1 : -1;
    const t = Math.random(); // 0 at the bright core, 1 at a lobe's tip
    const height = lobeSign * Math.pow(t, 0.6) * radius;
    const spread = Math.sin(t * Math.PI * 0.85) * radius * 0.4;
    const angle = Math.random() * Math.PI * 2;
    const position = new THREE.Vector3(Math.cos(angle) * spread, height, Math.sin(angle) * spread);

    const color =
      t < 0.4 ? core.clone().lerp(mid, t / 0.4) : mid.clone().lerp(edge, (t - 0.4) / 0.6);

    addPuff(
      group,
      puffs,
      texture,
      color,
      THREE.MathUtils.randFloat(0.18, 0.4) * (1 - t * 0.3),
      THREE.MathUtils.randFloat(2, 4.5),
      position,
    );
  }

  addEmbeddedStars(
    group,
    puffs,
    starTexture,
    new THREE.Color('#dff1ff'),
    Math.round(count * 0.08),
    radius,
  );

  scene.add(group);
  return puffs;
}

// Hollow shell with a dark cavity, echoing the Rosette Nebula's green outer
// shell wrapping a red inner wall.
function buildShellNebula(scene, texture, starTexture, center, radius, count) {
  const group = new THREE.Group();
  group.position.set(center.x, center.y, center.z);
  const puffs = [];

  const inner = new THREE.Color('#7a1f1f');
  const outer = new THREE.Color('#4fae6d');
  const innerFrac = 0.45;

  for (let i = 0; i < count; i++) {
    const t = Math.random(); // 0 at the shell's inner edge, 1 at its outer edge
    const r = radius * (innerFrac + t * (1 - innerFrac));
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const position = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta) * r,
      Math.sin(phi) * Math.sin(theta) * r * 0.7,
      Math.cos(phi) * r,
    );

    addPuff(
      group,
      puffs,
      texture,
      inner.clone().lerp(outer, t),
      THREE.MathUtils.randFloat(0.15, 0.32),
      THREE.MathUtils.randFloat(2, 4.5),
      position,
    );
  }

  addEmbeddedStars(
    group,
    puffs,
    starTexture,
    new THREE.Color('#bfe3ff'),
    Math.round(count * 0.06),
    radius,
  );

  scene.add(group);
  return puffs;
}

// Flattened ring with concentric color bands, echoing the Helix Nebula's
// blue eye, gold ring and red halo.
function buildRingNebula(scene, texture, center, radius, count) {
  const group = new THREE.Group();
  group.position.set(center.x, center.y, center.z);
  const puffs = [];

  // A ring only reads as a ring face-on - side-on it collapses into a
  // blob. The orbiting camera in Universe.jsx stays at a fixed height and
  // always looks roughly toward the origin, so orient the ring's plane to
  // face back that way (its normal points from `center` to the origin)
  // instead of lying flat in world XZ, which the camera never looks down.
  const normal = new THREE.Vector3(center.x, center.y, center.z).normalize().negate();
  const arbitrary =
    Math.abs(normal.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const basisU = new THREE.Vector3().crossVectors(arbitrary, normal).normalize();
  const basisV = new THREE.Vector3().crossVectors(normal, basisU).normalize();

  const bandColors = [
    new THREE.Color('#5fd6ff'),
    new THREE.Color('#f2a53c'),
    new THREE.Color('#c23b3b'),
  ];
  const innerFrac = 0.35;

  for (let i = 0; i < count; i++) {
    const t = Math.random(); // 0 at the ring's inner edge, 1 at its outer edge
    const r = radius * (innerFrac + t * (1 - innerFrac));
    const angle = Math.random() * Math.PI * 2;
    const position = basisU
      .clone()
      .multiplyScalar(Math.cos(angle) * r)
      .add(basisV.clone().multiplyScalar(Math.sin(angle) * r))
      .add(normal.clone().multiplyScalar(THREE.MathUtils.randFloatSpread(radius * 0.15)));

    const bandT = t * (bandColors.length - 1);
    const bandIndex = Math.min(bandColors.length - 2, Math.floor(bandT));
    const color = bandColors[bandIndex].clone().lerp(bandColors[bandIndex + 1], bandT - bandIndex);

    addPuff(
      group,
      puffs,
      texture,
      color,
      THREE.MathUtils.randFloat(0.18, 0.38),
      THREE.MathUtils.randFloat(2, 4),
      position,
    );
  }

  scene.add(group);
  return puffs;
}

// Fixed positions, well out past the galaxies (see galaxies.js's
// GALAXY_CENTERS) so nothing overlaps a galaxy's footprint, and spaced well
// apart from one another.
//
// Placement also accounts for the orbiting camera in Universe.jsx: it travels
// along one semicircle (azimuth ~63-243deg, per its baseTheta/FULL_SPIN)
// while always looking back across to the *opposite* semicircle (azimuth
// ~243-360/0-63deg). A nebula sitting in the camera's own travel arc is
// mostly looked away from; one placed in the look-at arc gets swept into
// view as the camera orbits. Each of the three below sits at a different
// point along that look-at arc, so they reveal in turn over the scroll
// instead of all competing for the same moment.
export function createNebulas(scene) {
  const texture = createPuffTexture();
  const starTexture = createStarTexture();

  return [
    // ~48deg azimuth - only comes into view late in the orbit.
    ...buildWingNebula(scene, texture, starTexture, { x: 20, y: -34, z: 28 }, 6, 65),
    // ~333deg azimuth - swept into view around the midpoint of the orbit.
    ...buildShellNebula(scene, texture, starTexture, { x: -80, y: -18, z: 80 }, 7, 70),
    // Sits almost exactly on the camera's initial look-at azimuth (~243deg)
    // - in view right from orbitProgress 0, before any scrolling.
    ...buildRingNebula(scene, texture, { x: -34, y: -2, z: -2 }, 5.5, 60),
  ];
}

export function updateNebulas(puffs, elapsedTime) {
  puffs.forEach(({ sprite, basePosition, driftPhase, driftSpeed, baseRotation, rotSpeed }) => {
    // Sprites auto-billboard toward the camera; only a gentle vertical
    // drift and in-plane spin are needed for the cloud to feel alive.
    sprite.position.y = basePosition.y + Math.sin(elapsedTime * driftSpeed + driftPhase) * 0.3;
    sprite.material.rotation = baseRotation + elapsedTime * rotSpeed;
  });
}
