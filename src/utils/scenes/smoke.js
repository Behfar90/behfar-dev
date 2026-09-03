import * as THREE from 'three';

const LAYER_COUNT = 40;
const MIN_RADIUS = 0.4;
const MAX_RADIUS = 3.2;

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

export function updateSmoke(smoke, elapsedTime, opacity) {
  smoke.layers.forEach(({ sprite, initialRotation, rotationSpeed }) => {
    if (!sprite) return;
    sprite.material.rotation = initialRotation + elapsedTime * rotationSpeed;
    sprite.material.opacity = opacity;
  });
}
