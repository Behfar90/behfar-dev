import * as THREE from 'three';

// Adapted from a since-reverted "Big Bang" intro effect (see git history -
// `feat(scenes): add Big Bang core/flare/cloud simulation`, later reverted)
// that used this same /png/smoke.png texture across ~15 independently
// transformed planes for a dissipating cloud look. Only the texture and
// the "many randomized layers" idea are reused here, not the effect's own
// Mesh+PlaneGeometry technique - that only worked there because its camera
// was static, looking straight down one fixed axis for the whole sequence
// (its own comment says so explicitly). This plunge's camera orbits and
// dives from constantly-changing angles, so a plane with a fixed
// world-space orientation would be edge-on (near-invisible) from most of
// them. THREE.Sprite (same as nebulas.js's own puffs) auto-billboards to
// the camera regardless of viewing angle, which a plain Mesh never does.
// Dense/wide enough that the climax genuinely reads as "engulfed" - some
// sprites sit close enough to the camera's final approach to loom large in
// the foreground, others further out for depth/parallax as the camera
// passes through, rather than a handful of separate, individually-visible
// puffs with gaps between them.
const LAYER_COUNT = 40;
const MIN_RADIUS = 0.4;
const MAX_RADIUS = 3.2;

// This site's own twilight-violet identity, not the old effect's
// blue-white/near-black - so this reads as belonging to the plunge it's
// part of, not a leftover palette from the effect it replaced.
const COLOR_WARM = new THREE.Color('#c48cd6');
const COLOR_DARK = new THREE.Color('#0c0616');

function randomInShell(minRadius, maxRadius) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = minRadius + Math.random() * (maxRadius - minRadius);
  return new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta) * r,
    Math.sin(phi) * Math.sin(theta) * r,
    Math.cos(phi) * r,
  );
}

// Sits at the coordinate origin - exactly where Universe.jsx's plunge
// collapses the camera's orbit radius toward (see PLUNGE_RADIUS_SCALE
// there), the same zone galaxies.js's updateOriginGalaxyFade dissolves its
// galaxy out of. Texture loads asynchronously (THREE.TextureLoader, same
// as the old effect) - layers are created up front with `sprite: null` and
// filled in once it resolves, same guard the old code used.
export function createSmoke(scene) {
  const layers = Array.from({ length: LAYER_COUNT }, () => ({
    basePosition: randomInShell(MIN_RADIUS, MAX_RADIUS),
    scale: THREE.MathUtils.randFloat(2.7, 7.4),
    initialRotation: Math.random() * Math.PI * 2,
    rotationSpeed: THREE.MathUtils.randFloatSpread(0.15),
    colorMix: Math.random(),
    sprite: null,
  }));

  new THREE.TextureLoader().load('/png/smoke.png', (texture) => {
    layers.forEach((layer) => {
      // NormalBlending, not AdditiveBlending - with this many overlapping
      // sprites at close range, additive brightness sums without limit and
      // blows out to solid white at the climax instead of reading as
      // smoke (found during verification: the whole screen went white at
      // peak). Normal alpha compositing caps out at fully opaque instead,
      // so dense overlap reads as a thick, dark-violet wall of smoke -
      // genuinely "engulfing" without losing all color/texture.
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
        color: COLOR_WARM.clone().lerp(COLOR_DARK, layer.colorMix),
        opacity: 0,
        rotation: layer.initialRotation,
      });
      const sprite = new THREE.Sprite(material);
      sprite.position.copy(layer.basePosition);
      sprite.scale.setScalar(layer.scale);
      scene.add(sprite);
      layer.sprite = sprite;
    });
  });

  return { layers };
}

// `opacity` is the caller's own envelope (see Universe.jsx - a function of
// both the rise's plungeT and a separate fall progress, since orbitProgress
// is pinned at 1 for the entire fall phase and can't express it alone) -
// this function only handles how the smoke looks while visible, not when.
// Rotation is a function of absolute elapsedTime (not an accumulated
// per-frame delta), same pattern as nebulas.js's own puff drift.
export function updateSmoke(smoke, elapsedTime, opacity) {
  smoke.layers.forEach(({ sprite, initialRotation, rotationSpeed }) => {
    if (!sprite) return; // texture not loaded yet
    sprite.material.rotation = initialRotation + elapsedTime * rotationSpeed;
    sprite.material.opacity = opacity;
  });
}
