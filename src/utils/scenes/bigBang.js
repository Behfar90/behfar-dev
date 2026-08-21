import * as THREE from 'three';
import {
  coreVertexShader,
  coreFragmentShader,
  flareVertexShader,
  flareFragmentShader,
} from '../shaders/bigBang';

const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);

// Core forms and destabilizes (0-1.5s), a flare bursts and burns off
// (1.5-3.5s), and a cloud of smoke layers explodes outward and dissipates to
// nothing (1.5s onward). `settled` flips once, at 3.0s - BigBang.jsx's cue
// to resume Universe rendering underneath - Universe then shows through
// immediately wherever the cloud isn't covering it, no separate fade gating
// that.
const SETTLE_TIME = 3.0;
// Past this (6.0s), the cloud has fully faded to opacity 0 - BigBang.jsx's
// cue to unmount, driven by the actual animation state rather than an
// arbitrary timer.
const CLOUD_GONE_TIME = 6.0;
// Retiming individual phases (flare fade, cloud settle curve) independently
// broke their relationship to each other - each was tuned relative to the
// others, so editing one alone desynced it from the rest (e.g. the flare
// still burning after the cloud had already dissolved). Scaling elapsed
// time uniformly instead shortens the whole sequence (was 6.0s end-to-end)
// while every phase keeps exactly the same proportions relative to every
// other - nothing can fall out of sync with anything else.
const TIME_SCALE = 2.0;
// The core phase (sandbox-time 0-1.5) is self-contained - flare and cloud
// only ever reference elapsed time from 1.5 onward, so it's the one phase
// that can safely get its own pacing without touching how flare and cloud
// relate to each other. At TIME_SCALE alone it took 0.75s real time, too
// rushed to read as forming/shaking/exploding - stretched to 1.75s (1s
// more) here, then flare/cloud pick up at TIME_SCALE exactly as before.
const CORE_SANDBOX_END = 1.5;
const CORE_REAL_DURATION = CORE_SANDBOX_END / TIME_SCALE + 1.0;

// Maps real elapsed time to the sandbox-time `t` every phase below is
// written against - slower through the core phase (see CORE_REAL_DURATION),
// then continuous into the TIME_SCALE-compressed flare/cloud phases with no
// jump at the seam.
function toSandboxTime(elapsedTime) {
  if (elapsedTime <= CORE_REAL_DURATION) {
    return (elapsedTime / CORE_REAL_DURATION) * CORE_SANDBOX_END;
  }
  return CORE_SANDBOX_END + (elapsedTime - CORE_REAL_DURATION) * TIME_SCALE;
}
const CLOUD_LAYER_COUNT = 15;

// The exact smoke texture the sandbox itself uses (mirrored locally from
// https://raw.githubusercontent.com/navin-navi/codepen-assets/master/images/smoke.png),
// applied identically to every cloud layer via THREE.TextureLoader, same as
// the sandbox's useTexture() - no cropping, no RGB processing, variety
// comes only from each layer's own rotation/scale/wobble.
const CLOUD_TEXTURE_URL = '/png/smoke.png';
const textureLoader = new THREE.TextureLoader();

export function createBigBang(scene) {
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 64),
    new THREE.ShaderMaterial({
      vertexShader: coreVertexShader,
      fragmentShader: coreFragmentShader,
      uniforms: { opacity: { value: 0 } },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  scene.add(core);

  const flare = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShaderMaterial({
      vertexShader: flareVertexShader,
      fragmentShader: flareFragmentShader,
      uniforms: { opacity: { value: 0 } },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  flare.position.set(0, 0, -1);
  scene.add(flare);

  // Each layer is its own mesh sharing one texture (rather than one
  // InstancedMesh) so each can still fade/tint independently via its own
  // material instance, same as the sandbox's per-instance opacity/color.
  const cloudGroup = new THREE.Group();
  scene.add(cloudGroup);
  const cloudGeometry = new THREE.PlaneGeometry(1, 1);

  const cloudLayers = Array.from({ length: CLOUD_LAYER_COUNT }).map((_, i) => ({
    zOffset: -i * 1.5,
    scaleMulti: Math.random() * 2.0 + 0.5,
    initRot: Math.random() * Math.PI * 2,
    offsetX: (Math.random() - 0.5) * 4.0,
    offsetY: (Math.random() - 0.5) * 4.0,
    mesh: null, // filled in once the texture finishes loading, below
  }));

  textureLoader.load(CLOUD_TEXTURE_URL, (texture) => {
    cloudLayers.forEach((layer) => {
      const mesh = new THREE.Mesh(
        cloudGeometry,
        new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          depthWrite: false,
          color: new THREE.Color('#aaddff'),
          blending: THREE.AdditiveBlending,
          opacity: 0,
        }),
      );
      cloudGroup.add(mesh);
      layer.mesh = mesh;
    });
  });

  return {
    core,
    flare,
    cloudLayers,
    colorHot: new THREE.Color('#aaddff'),
    // The sandbox's #4411aa was tuned to dissolve into its own dummy scene's
    // purple backdrop - this site's actual Universe backdrop is solid black
    // (see Universe.jsx - no scene.background/clearColor set), so settling
    // into a bright indigo there left a visible veil instead of vanishing.
    // Near-black with a faint cool cast blends into that black void instead.
    colorCool: new THREE.Color('#0a0714'),
    settled: false,
    cloudGone: false,
  };
}

// Returns `{ justSettled, justCloudGone }` - each true for exactly one call:
// justSettled the first frame at or past SETTLE_TIME (reveal Universe),
// justCloudGone the first frame the cloud has fully faded (safe to unmount).
// Assumes a static camera looking straight down -z (see BigBang.jsx) - the
// flare and cloud planes are left in their default world-space orientation,
// not billboarded, same as the original sandbox.
export function updateBigBang(bigBang, elapsedTime) {
  const t = toSandboxTime(elapsedTime);
  const { core, flare, cloudLayers, colorHot, colorCool } = bigBang;

  let justSettled = false;
  if (t >= SETTLE_TIME && !bigBang.settled) {
    bigBang.settled = true;
    justSettled = true;
  }

  let justCloudGone = false;
  if (t >= CLOUD_GONE_TIME && !bigBang.cloudGone) {
    bigBang.cloudGone = true;
    justCloudGone = true;
  }

  // --- Core (0.0s to 1.5s) ---
  const coreTime = Math.min(t, 1.5);
  const coreProgress = coreTime / 1.5;
  const coreFadeIn = Math.min(t / 0.5, 1.0);
  const coreFadeOut = Math.max(0, Math.min((t - 1.5) / 0.1, 1.0));
  const destabilize = Math.pow(coreProgress, 6);

  core.position.set(
    (Math.random() - 0.5) * 0.15 * destabilize,
    (Math.random() - 0.5) * 0.15 * destabilize,
    0,
  );
  const corePulse = Math.sin(coreTime * 80.0) * 0.04 * destabilize;
  core.scale.setScalar(Math.max(0, coreTime * 0.05 + corePulse));
  core.material.uniforms.opacity.value = coreFadeIn * (1 - coreFadeOut);

  // --- Anamorphic flare (1.5s to 3.5s) ---
  const flareRawTime = Math.max(0, Math.min((t - 1.5) / 1.5, 1.0));
  const horizontalProgress = easeOutQuart(flareRawTime);
  const isFlareActive = t >= 1.5 ? 1.0 : 0.0;
  const flareFadeIn = Math.min((t - 1.5) / 0.1, 1.0);
  const flareFadeOut = Math.max(0, 1.0 - Math.max(0, t - 2.5) / 1.0);

  flare.scale.set(horizontalProgress * 150, horizontalProgress * 0.4 + 0.05, 1);
  flare.material.uniforms.opacity.value = flareFadeIn * flareFadeOut * isFlareActive * 1.5;

  // --- Stardust cloud (1.5s onward - dissipates to nothing by
  // CLOUD_GONE_TIME) ---
  const expandProgress = easeOutQuart(Math.max(0, Math.min((t - 1.5) / 1.5, 1.0)));
  // Linear (not eased) so the cloud thins at a steady, predictable rate
  // across the whole window, giving Universe the full window to visibly
  // emerge through the smoke as it disperses.
  const settleProgress = Math.max(0, Math.min((t - 3.0) / 3.0, 1.0));
  const isCloudActive = t >= 1.5 ? 1.0 : 0.0;
  const baseScale = 0.1 + expandProgress * 45 - settleProgress * 15;
  const baseZ = expandProgress * 3.0;

  // Fades all the way to 0 (not a permanent floor) - so it's actually
  // watchable dissipating, and BigBang can cleanly unmount once it's gone
  // instead of leaving a residual tint over Universe forever.
  const opacityTarget = THREE.MathUtils.lerp(1.2, 0, settleProgress);
  const cloudFadeIn = Math.min((t - 1.5) / 0.1, 1.0);
  const opacity = cloudFadeIn * opacityTarget * isCloudActive;

  cloudLayers.forEach((layer, i) => {
    if (!layer.mesh) return; // texture not loaded yet

    const activeWobble = (1.0 - settleProgress) * 2.0 + 0.2;
    const wobbleX = layer.offsetX + Math.sin(t * activeWobble + i) * expandProgress * 2.0;
    const wobbleY = layer.offsetY + Math.cos(t * activeWobble + i) * expandProgress * 2.0;
    const currentRot = layer.initRot + expandProgress * 2.0 + t * 0.05;

    layer.mesh.position.set(wobbleX, wobbleY, baseZ + layer.zOffset);
    layer.mesh.rotation.set(0, 0, currentRot);
    layer.mesh.scale.setScalar(baseScale * layer.scaleMulti);
    layer.mesh.material.opacity = opacity;
    layer.mesh.material.color.lerpColors(colorHot, colorCool, settleProgress);
  });

  return { justSettled, justCloudGone };
}
