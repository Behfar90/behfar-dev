import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import {
  starVertexShader,
  starFragmentShader,
  textVertexShader,
  textFragmentShader,
  plainTextFragmentShader,
  puffVertexShader,
  puffFragmentShader,
  gatherVertexShader,
} from '../utils/shaders/shootingStar.js';
import { clamp01, smoothstep } from '../utils/math';
import { SUBTITLE_STORY_END } from '../utils/scenes/universeTiming';
import styles from './ShootingStarIntro.module.css';

// --- Constants & Shaders ---
const CAMERA_Z = 5000;
const PER_MOUSE = 800;
const COUNT = PER_MOUSE * 200;
const MOUSE_ATTR_COUNT = 4;
const FRONT_ATTR_COUNT = 2;
// How far through the subtitle's glyphs to scan when seeding puff particles
// (every Nth pixel) and roughly how many of those hits to keep, so the dust
// cloud reads as the subtitle's shape without one particle per pixel.
const SUBTITLE_SCAN_STRIDE = 2;
const SUBTITLE_TARGET_PARTICLES = 220;
// Puff particles drift up-and-to-the-right (matching the camera's own
// anti-clockwise orbit) rather than scattering isotropically - this is the
// center angle, in radians measured counter-clockwise from +x (screen
// right), with a per-particle spread either side of it. The replacement
// subtitle's gather particles use the mirror image of this angle (up-left),
// sharing the same spread, so the two read as one coherent sweep.
const SUBTITLE_PUFF_ANGLE = Math.PI / 5;
const SUBTITLE_PUFF_ANGLE_SPREAD = Math.PI / 6;
const SUBTITLE_GATHER_ANGLE = Math.PI - SUBTITLE_PUFF_ANGLE;

// Fits `text` under `maxCssSize` (CSS px) so it's no wider than
// `maxDeviceWidth` (device px) - shared by the subtitle and its
// replacement, which are sized independently since they're different
// lengths. Returns the chosen CSS-px font size plus the resulting
// device-px width, both needed to lay the text out on a canvas.
function fitSubtitleFont(measureCtx, text, family, maxCssSize, maxDeviceWidth, pixelRatio) {
  measureCtx.font = `${maxCssSize * pixelRatio}px ${family}`;
  const widthAtMax = measureCtx.measureText(text).width;
  const fontSize = Math.min(maxCssSize, (maxDeviceWidth / widthAtMax) * maxCssSize);
  measureCtx.font = `${fontSize * pixelRatio}px ${family}`;
  const width = measureCtx.measureText(text).width;
  return { fontSize, width };
}

// Scans an ImageData's alpha channel for drawn glyph pixels and thins them
// down to roughly `targetCount` points, so a whole word becomes a
// manageable handful of particle seeds instead of one per pixel. Returns
// flat [x0, y0, x1, y1, ...] pairs in that ImageData's own pixel space
// (row 0 = its own top) - shared by the subtitle's outgoing dust and its
// replacement's incoming dust, which scan different canvases/regions.
function scanGlyphPixels(imageData, targetCount) {
  const candidates = [];
  for (let y = 0; y < imageData.height; y += SUBTITLE_SCAN_STRIDE) {
    for (let x = 0; x < imageData.width; x += SUBTITLE_SCAN_STRIDE) {
      const alphaIndex = (y * imageData.width + x) * 4 + 3;
      if (imageData.data[alphaIndex] > 128) candidates.push(x, y);
    }
  }
  const pairCount = candidates.length / 2;
  const keepStride = Math.max(1, Math.floor(pairCount / targetCount));
  const points = [];
  for (let i = 0; i < pairCount; i += keepStride) {
    points.push(candidates[i * 2], candidates[i * 2 + 1]);
  }
  return points;
}

// --- Components ---
const ShootingStar = forwardRef((_, ref) => {
  const { size, gl } = useThree();
  const materialRef = useRef();
  const geometryRef = useRef();

  const state = useRef({
    mouseI: 0,
    oldPosition: null,
  });

  const { positions, mouseArr, aFront, randomArr } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const mouseArr = new Float32Array(COUNT * MOUSE_ATTR_COUNT);
    const aFront = new Float32Array(COUNT * FRONT_ATTR_COUNT);
    const randomArr = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = Math.random();
      positions[i * 3 + 1] = Math.random();
      positions[i * 3 + 2] = Math.random();

      mouseArr[i * 4] = -1;
      mouseArr[i * 4 + 1] = -1;
      mouseArr[i * 4 + 2] = 0;
      mouseArr[i * 4 + 3] = 0;

      aFront[i * 2] = 0;
      aFront[i * 2 + 1] = 0;

      randomArr[i] = Math.random();
    }
    return { positions, mouseArr, aFront, randomArr };
  }, []);

  const uniforms = useMemo(
    () => ({
      resolution: { value: new THREE.Vector2(size.width, size.height) },
      pixelRatio: { value: gl.getPixelRatio() },
      timestamp: { value: 0 },
      size: { value: 0.15 },
      minSize: { value: 2.0 },
      speed: { value: 0.012 },
      fadeSpeed: { value: 1.1 },
      shortRangeFadeSpeed: { value: 1.3 },
      minFlashingSpeed: { value: 0.1 },
      spread: { value: 13 },
      maxSpread: { value: 8 },
      maxZ: { value: 100 },
      blur: { value: 1.4 },
      far: { value: 18 },
      maxDiff: { value: 100 },
      diffPow: { value: 0.24 },
    }),
    [size.width, size.height, gl],
  );

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.timestamp.value = clock.getElapsedTime() * 60;
      materialRef.current.uniforms.resolution.value.set(size.width, size.height);
    }
  });

  useImperativeHandle(ref, () => ({
    draw: (clientX, clientY) => {
      if (!geometryRef.current || !materialRef.current) return;

      const s = state.current;
      const clientHalfWidth = size.width / 2;
      const clientHalfHeight = size.height / 2;

      const x = clientX + clientHalfWidth;
      const y = size.height - (clientY + clientHalfHeight);

      const newPosition = new THREE.Vector2(x, y);
      const diff = s.oldPosition ? newPosition.clone().sub(s.oldPosition) : new THREE.Vector2();

      const length = diff.length();
      const front = diff.clone().normalize();
      const time = materialRef.current.uniforms.timestamp.value;

      const mouseAttr = geometryRef.current.attributes.mouse;
      const frontAttr = geometryRef.current.attributes.aFront;

      for (let i = 0; i < PER_MOUSE; i++) {
        const ci = (s.mouseI % (COUNT * MOUSE_ATTR_COUNT)) + i * MOUSE_ATTR_COUNT;
        const position = s.oldPosition
          ? s.oldPosition.clone().add(diff.clone().multiplyScalar(i / PER_MOUSE))
          : newPosition;

        mouseAttr.array[ci] = position.x;
        mouseAttr.array[ci + 1] = position.y;
        mouseAttr.array[ci + 2] = time;
        mouseAttr.array[ci + 3] = length;

        const fi =
          (((s.mouseI / MOUSE_ATTR_COUNT) * FRONT_ATTR_COUNT) % (COUNT * FRONT_ATTR_COUNT)) +
          i * FRONT_ATTR_COUNT;
        frontAttr.array[fi] = front.x;
        frontAttr.array[fi + 1] = front.y;
      }

      s.oldPosition = newPosition;
      mouseAttr.needsUpdate = true;
      frontAttr.needsUpdate = true;
      s.mouseI += MOUSE_ATTR_COUNT * PER_MOUSE;
    },
    resetPosition: () => {
      state.current.oldPosition = null;
    },
  }));

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-mouse" args={[mouseArr, MOUSE_ATTR_COUNT]} />
        <bufferAttribute attach="attributes-aFront" args={[aFront, FRONT_ATTR_COUNT]} />
        <bufferAttribute attach="attributes-random" args={[randomArr, 1]} />
      </bufferGeometry>
      <rawShaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        transparent
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
});

const TextReveal = forwardRef((_, ref) => {
  const { size, gl } = useThree();
  const materialRef = useRef();
  // Starts with the fallback; swaps to the custom face once it's actually
  // loaded, triggering a clean re-draw of the canvas via the memo below
  // instead of mutating an existing texture out from under Three.
  const [fontFamily, setFontFamily] = useState('Georgia, serif');
  const [subtitleFontFamily, setSubtitleFontFamily] = useState('Georgia, serif');

  useEffect(() => {
    document.fonts
      .load('1em Monoton')
      .then(() => setFontFamily('Monoton, Georgia, serif'))
      .catch(() => {});
    document.fonts
      .load('1em Audiowide')
      .then(() => setSubtitleFontFamily('Audiowide, Georgia, serif'))
      .catch(() => {});
  }, []);

  const {
    texture,
    planeWidth,
    planeHeight,
    subtitleVMax,
    puffSeeds,
    puffDirs,
    puffRandoms,
    secondTexture,
    secondPlaneWidth,
    secondPlaneHeight,
    secondSubtitleY,
    gatherSeeds,
    gatherDirs,
    gatherRandoms,
  } = useMemo(() => {
    // Custom name replacement here
    const text = 'Behfar Behzad';
    const subtitle = 'A Passionate Software Developer';
    // What the subtitle puffs away into and is replaced by, once scrolled
    // well past it - see SUBTITLE_GATHER_ANGLE and the OUTGOING_FRACTION-
    // based timing below.
    const secondSubtitle = 'Who thinks FrontEnd First';
    // Brightened version of the shooting-star particles' gold (shaders/particles.js)
    const subtitleColor = '#eeba7b';
    const isMobile = size.width < 768;
    const letterSpacing = isMobile ? 0.1 : 0.18;
    const pixelRatio = window.devicePixelRatio;

    // Cap both strings' rendered width to a share of the viewport so the
    // wipe-reveal shader's uStartX (size.width/2 - planeWidth/2, see
    // ShootingStarIntro below) never goes negative - a negative uStartX
    // flips the sign of the reveal progress term and the text never shows.
    const maxContentWidth = size.width * 0.9 * pixelRatio;
    const maxFontSize = 50;
    const maxSubtitleFontSize = 27;

    const nameCharFactor = text.length + letterSpacing * (text.length - 1);
    const fontSize = Math.min(maxFontSize, maxContentWidth / pixelRatio / nameCharFactor);
    const nameWidth = fontSize * nameCharFactor * pixelRatio;
    const nameHeight = fontSize * 1.2 * pixelRatio;

    const canvas = document.createElement('canvas');
    // measureText only needs a context, not the final canvas size - resizing
    // the canvas below would otherwise wipe out any font set before it.
    const measureCtx = canvas.getContext('2d');
    const { fontSize: subtitleFontSize, width: subtitleWidth } = fitSubtitleFont(
      measureCtx,
      subtitle,
      subtitleFontFamily,
      maxSubtitleFontSize,
      maxContentWidth,
      pixelRatio,
    );
    const subtitleHeight = subtitleFontSize * 1.6 * pixelRatio;

    const width = Math.max(nameWidth, subtitleWidth);
    const height = nameHeight + subtitleHeight;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = `${fontSize * pixelRatio}px ${fontFamily}`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, width / 2, nameHeight / 2);

    ctx.font = `${subtitleFontSize * pixelRatio}px ${subtitleFontFamily}`;
    ctx.fillStyle = subtitleColor;
    ctx.fillText(subtitle, width / 2, nameHeight + subtitleHeight / 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;

    // Seed the puff particles from the subtitle's own drawn pixels, so the
    // dust cloud that scatters on scroll roughly traces the glyphs it came
    // from rather than a generic rectangle. Scanned in canvas pixel space,
    // then converted below to the same local plane coordinates the mesh
    // itself uses (it's centered at the origin, so canvas center = world 0).
    const subtitleRow = Math.round(nameHeight);
    const subtitleImage = ctx.getImageData(0, subtitleRow, width, height - subtitleRow);
    const subtitlePoints = scanGlyphPixels(subtitleImage, SUBTITLE_TARGET_PARTICLES);
    const seeds = [];
    const dirs = [];
    const randoms = [];
    for (let i = 0; i < subtitlePoints.length / 2; i++) {
      const px = subtitlePoints[i * 2];
      const py = subtitleRow + subtitlePoints[i * 2 + 1];
      seeds.push((px - width / 2) / pixelRatio, (height / 2 - py) / pixelRatio, 0);
      const angle = SUBTITLE_PUFF_ANGLE + (Math.random() - 0.5) * SUBTITLE_PUFF_ANGLE_SPREAD;
      dirs.push(Math.cos(angle), Math.sin(angle));
      randoms.push(Math.random());
    }

    // The replacement subtitle gets its own small canvas/texture/mesh - it
    // doesn't need to share the combined one above, just to sit in the same
    // slot (nameCssHeight below the title - see secondSubtitleY, which
    // matches how the original subtitle sits within the combined canvas).
    const { fontSize: secondSubtitleFontSize, width: secondSubtitleWidthPx } = fitSubtitleFont(
      measureCtx,
      secondSubtitle,
      subtitleFontFamily,
      maxSubtitleFontSize,
      maxContentWidth,
      pixelRatio,
    );
    const secondSubtitleHeightPx = secondSubtitleFontSize * 1.6 * pixelRatio;

    const secondCanvas = document.createElement('canvas');
    secondCanvas.width = secondSubtitleWidthPx;
    secondCanvas.height = secondSubtitleHeightPx;
    const secondCtx = secondCanvas.getContext('2d');
    secondCtx.textAlign = 'center';
    secondCtx.textBaseline = 'middle';
    secondCtx.font = `${secondSubtitleFontSize * pixelRatio}px ${subtitleFontFamily}`;
    secondCtx.fillStyle = subtitleColor;
    secondCtx.fillText(secondSubtitle, secondSubtitleWidthPx / 2, secondSubtitleHeightPx / 2);

    const secondTex = new THREE.CanvasTexture(secondCanvas);
    secondTex.minFilter = THREE.LinearFilter;

    // Seed the gather particles from the replacement text's own drawn
    // pixels too - this time as the targets they converge onto, arriving
    // from the mirror-image (up-left) direction of the original subtitle's
    // departure.
    const secondImage = secondCtx.getImageData(0, 0, secondCanvas.width, secondCanvas.height);
    const secondPoints = scanGlyphPixels(secondImage, SUBTITLE_TARGET_PARTICLES);
    const gSeeds = [];
    const gDirs = [];
    const gRandoms = [];
    for (let i = 0; i < secondPoints.length / 2; i++) {
      const px = secondPoints[i * 2];
      const py = secondPoints[i * 2 + 1];
      gSeeds.push(
        (px - secondCanvas.width / 2) / pixelRatio,
        (secondCanvas.height / 2 - py) / pixelRatio,
        0,
      );
      const angle = SUBTITLE_GATHER_ANGLE + (Math.random() - 0.5) * SUBTITLE_PUFF_ANGLE_SPREAD;
      gDirs.push(Math.cos(angle), Math.sin(angle));
      gRandoms.push(Math.random());
    }

    return {
      texture: tex,
      planeWidth: width / pixelRatio,
      planeHeight: height / pixelRatio,
      subtitleVMax: 1 - nameHeight / height,
      puffSeeds: new Float32Array(seeds),
      puffDirs: new Float32Array(dirs),
      puffRandoms: new Float32Array(randoms),
      secondTexture: secondTex,
      secondPlaneWidth: secondCanvas.width / pixelRatio,
      secondPlaneHeight: secondCanvas.height / pixelRatio,
      secondSubtitleY: -(nameHeight / pixelRatio) / 2,
      gatherSeeds: new Float32Array(gSeeds),
      gatherDirs: new Float32Array(gDirs),
      gatherRandoms: new Float32Array(gRandoms),
    };
  }, [size.width, fontFamily, subtitleFontFamily]);

  const uniforms = useMemo(
    () => ({
      map: { value: texture },
      uProgress: { value: -(size.width / 2) },
      uStartX: { value: size.width / 2 - planeWidth / 2 },
      uRatio: { value: planeWidth / planeHeight },
      alpha: { value: 0.8 },
      uSubtitleVMax: { value: subtitleVMax },
      uSubtitleFade: { value: 0 },
    }),
    [texture, size.width, planeWidth, planeHeight, subtitleVMax],
  );

  const puffMaterialRef = useRef();
  const puffUniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      // Long enough that particles launched from near screen-center fully
      // exit the frame along their up-right direction rather than fading
      // while still on-screen.
      uDistance: { value: Math.hypot(size.width, size.height) },
      uPixelRatio: { value: gl.getPixelRatio() },
      uSize: { value: 6.5 },
      uMinSize: { value: 2.2 },
    }),
    [gl, size.width, size.height],
  );

  const secondMaterialRef = useRef();
  const secondUniforms = useMemo(
    () => ({
      map: { value: secondTexture },
      alpha: { value: 0.8 },
      uReveal: { value: 0 },
    }),
    [secondTexture],
  );

  const gatherMaterialRef = useRef();
  const gatherUniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      // Same reasoning as puffUniforms.uDistance, mirrored: far enough that
      // particles start off-frame to the upper-left.
      uDistance: { value: Math.hypot(size.width, size.height) },
      uPixelRatio: { value: gl.getPixelRatio() },
      uSize: { value: 6.5 },
      uMinSize: { value: 2.2 },
    }),
    [gl, size.width, size.height],
  );

  useImperativeHandle(ref, () => ({
    updateProgress: (p) => {
      if (materialRef.current) {
        materialRef.current.uniforms.uProgress.value = p;
      }
    },
    // Drives the subtitle's scroll-triggered dissolve: `textT` fades the
    // subtitle glyphs out (quick - see TEXT_DISSOLVE_FRACTION), `travelT`
    // separately drives the puff particles' flight and fade over the full
    // outgoing half (see OUTGOING_FRACTION), so the dust keeps drifting
    // off screen well after the text itself is gone.
    updateDissolve: (textT, travelT) => {
      if (materialRef.current) {
        materialRef.current.uniforms.uSubtitleFade.value = textT;
      }
      if (puffMaterialRef.current) {
        puffMaterialRef.current.uniforms.uProgress.value = travelT;
      }
    },
    // Drives the replacement subtitle's arrival, once the original has
    // fully dissolved (see the gatherStart/gatherEnd window below, the
    // incoming half): `t` is 0 (still scattered off-frame) to 1 (fully
    // gathered and handed off to the crisp text). The gather particles
    // fade in early then back out late as the crisp text takes over, so
    // `t` alone drives both.
    updateGather: (t) => {
      if (gatherMaterialRef.current) {
        gatherMaterialRef.current.uniforms.uProgress.value = t;
      }
      if (secondMaterialRef.current) {
        secondMaterialRef.current.uniforms.uReveal.value = smoothstep(0.6, 1, t);
      }
    },
  }));

  return (
    <>
      <mesh position={[0, 0, 0.1]} frustumCulled={false}>
        <planeGeometry args={[planeWidth, planeHeight]} />
        <rawShaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={textVertexShader}
          fragmentShader={textFragmentShader}
          transparent
        />
      </mesh>

      {puffSeeds.length > 0 && (
        <points position={[0, 0, 0.15]} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[puffSeeds, 3]} />
            <bufferAttribute attach="attributes-aDir" args={[puffDirs, 2]} />
            <bufferAttribute attach="attributes-aRandom" args={[puffRandoms, 1]} />
          </bufferGeometry>
          <rawShaderMaterial
            ref={puffMaterialRef}
            uniforms={puffUniforms}
            vertexShader={puffVertexShader}
            fragmentShader={puffFragmentShader}
            transparent
            depthTest={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}

      <mesh position={[0, secondSubtitleY, 0.1]} frustumCulled={false}>
        <planeGeometry args={[secondPlaneWidth, secondPlaneHeight]} />
        <rawShaderMaterial
          ref={secondMaterialRef}
          uniforms={secondUniforms}
          vertexShader={textVertexShader}
          fragmentShader={plainTextFragmentShader}
          transparent
        />
      </mesh>

      {gatherSeeds.length > 0 && (
        <points position={[0, secondSubtitleY, 0.15]} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[gatherSeeds, 3]} />
            <bufferAttribute attach="attributes-aDir" args={[gatherDirs, 2]} />
            <bufferAttribute attach="attributes-aRandom" args={[gatherRandoms, 1]} />
          </bufferGeometry>
          <rawShaderMaterial
            ref={gatherMaterialRef}
            uniforms={gatherUniforms}
            vertexShader={gatherVertexShader}
            fragmentShader={puffFragmentShader}
            transparent
            depthTest={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}
    </>
  );
});

// The name is only ever revealed once per session; every later shooting-star
// sweep (triggered by scrolling back to the very top) replays purely as a
// decorative flourish and leaves the already-revealed text untouched.
let hasPlayed = false;

// The whole subtitle story (fade -> outgoing dust -> incoming dust -> crisp
// replacement) is scaled to fit within the `storyEnd` prop - a fraction of
// Universe's orbit scroll range, imported from universeTiming.js so this
// can't drift out of lockstep with the camera's own arrival and the
// captions' start, which both hand off at the same boundary. These
// fractions are of `storyEnd` itself, not of the full 0-1 orbitProgress
// range. The outgoing and incoming dust each get an equal half of
// storyEnd, so the subtitle takes exactly as long to fall apart as its
// replacement takes to arrive; the text fade is a quick sub-phase nested
// inside the outgoing half, not a separate top-level one.
const OUTGOING_FRACTION = 1 / 2;
const TEXT_DISSOLVE_FRACTION = OUTGOING_FRACTION / 4;

const Scene = ({ orbitProgress = 0, storyEnd = SUBTITLE_STORY_END }) => {
  const { size, camera } = useThree();
  const starRef = useRef();
  const textRef = useRef();
  const wasAwayFromTopRef = useRef(false);

  // The fov passed to <Canvas> is only applied once, at mount - it doesn't
  // get recalculated by R3F on resize (only aspect does). Re-derive it from
  // the live, resize-reactive `size` so the 1-world-unit = 1-css-pixel
  // calibration this scene relies on survives window resizes and orientation
  // changes, not just re-renders triggered by scroll.
  useLayoutEffect(() => {
    camera.fov = Math.atan(size.height / 2 / CAMERA_Z) * (180 / Math.PI) * 2;
    camera.updateProjectionMatrix();
  }, [camera, size.height]);

  const playSweep = useCallback(
    (revealText) => {
      const clientHalfWidth = size.width / 2;
      const clientHalfHeight = size.height / 2;
      const period = Math.PI * 3;
      const amplitude = Math.min(Math.max(size.width * 0.1, 100), 180);

      const tl = gsap.timeline();

      // 1. Initial Sine Wave Animation
      const waveTarget = { progress: 0 };
      tl.to(waveTarget, {
        progress: 1,
        duration: 1.08,
        ease: 'power2.inOut',
        onUpdate: () => {
          const p = waveTarget.progress;
          starRef.current?.draw(
            Math.cos(p * period) * amplitude,
            (p * size.height - clientHalfHeight) * 1.3,
          );
        },
        onComplete: () => {
          starRef.current?.draw(-clientHalfWidth, size.height - clientHalfHeight);
          starRef.current?.draw(-clientHalfWidth * 1.1, 0);
          starRef.current?.resetPosition();
        },
      });

      // 2. Star sweeps across; only reveals the text the first time ever
      const revealTarget = { progress: -clientHalfWidth * 1.1 };
      tl.to(revealTarget, {
        progress: clientHalfWidth * 1.1,
        duration: 1.08,
        ease: 'power3.out',
        delay: 0.3,
        onUpdate: () => {
          const p = revealTarget.progress;
          starRef.current?.draw(p, 0);
          if (revealText) {
            textRef.current?.updateProgress(p - size.width * 0.08);
          }
        },
        onComplete: () => {
          starRef.current?.resetPosition();
          if (revealText) {
            // The name stays revealed permanently from here on
            hasPlayed = true;
          }
        },
      });

      return tl;
    },
    [size],
  );

  // Plays once, the very first time this ever mounts.
  useEffect(() => {
    if (hasPlayed) {
      const clientHalfWidth = size.width / 2;
      textRef.current?.updateProgress(clientHalfWidth * 1.1 - size.width * 0.08);
      return undefined;
    }

    const tl = playSweep(true);
    return () => tl.kill();
  }, [size, playSweep]);

  // Replays just the shooting star whenever orbitProgress returns to 0 after
  // having scrolled away from the top - the text is untouched by this.
  useEffect(() => {
    if (orbitProgress > 0) {
      wasAwayFromTopRef.current = true;
      return undefined;
    }

    if (!hasPlayed || !wasAwayFromTopRef.current) return undefined;
    wasAwayFromTopRef.current = false;

    const tl = playSweep(false);
    return () => tl.kill();
  }, [orbitProgress, playSweep]);

  // Scatters the subtitle into puff particles as the user scrolls, and
  // pulls it back together if they scroll back up - driven directly by
  // orbitProgress rather than a one-shot animation, matching how the rest
  // of Universe maps scroll position straight to visual state. Also
  // re-applied on `size` changes, since TextReveal's material (and so its
  // uSubtitleFade uniform) is rebuilt on resize - same reason the sweep
  // reveal effect above re-applies `updateProgress` on `size` too.
  useEffect(() => {
    const textDissolveRange = storyEnd * TEXT_DISSOLVE_FRACTION;
    const particleRange = storyEnd * OUTGOING_FRACTION;
    const gatherStart = particleRange;
    const gatherEnd = storyEnd;

    const textT = clamp01(orbitProgress / textDissolveRange);
    const travelT = clamp01(orbitProgress / particleRange);
    const gatherT = clamp01((orbitProgress - gatherStart) / (gatherEnd - gatherStart));
    textRef.current?.updateDissolve(textT, travelT);
    textRef.current?.updateGather(gatherT);
  }, [orbitProgress, size, storyEnd]);

  return (
    <>
      <ShootingStar ref={starRef} />
      <TextReveal ref={textRef} />
    </>
  );
};

export default function ShootingStarIntro({ orbitProgress, storyEnd = SUBTITLE_STORY_END }) {
  const calculateFov = () => {
    const height = window.innerHeight;
    return Math.atan(height / 2 / CAMERA_Z) * (180 / Math.PI) * 2;
  };

  return (
    <div className={styles.overlay}>
      <Canvas
        camera={{
          position: [0, 0, CAMERA_Z],
          far: CAMERA_Z,
          fov: calculateFov(),
        }}
        dpr={Math.max(window.devicePixelRatio, 2)}
        gl={{
          antialias: window.devicePixelRatio === 1,
          alpha: true,
          premultipliedAlpha: false,
        }}
      >
        <Scene orbitProgress={orbitProgress} storyEnd={storyEnd} />
      </Canvas>
    </div>
  );
}
