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

const CAMERA_Z = 5000;
const PER_MOUSE = 800;
const COUNT = PER_MOUSE * 200;
const MOUSE_ATTR_COUNT = 4;
const FRONT_ATTR_COUNT = 2;
const SUBTITLE_SCAN_STRIDE = 2;
const SUBTITLE_TARGET_PARTICLES = 220;
const SUBTITLE_PUFF_ANGLE = Math.PI / 5;
const SUBTITLE_PUFF_ANGLE_SPREAD = Math.PI / 6;
const SUBTITLE_GATHER_ANGLE = Math.PI - SUBTITLE_PUFF_ANGLE;

const SUBTITLE_CHAPTERS = [
  'Happiest when writing code and solving puzzles',
  'Frontend first, Everything else when gravity calls',
];

function fitSubtitleFont(measureCtx, text, family, maxCssSize, maxDeviceWidth, pixelRatio) {
  measureCtx.font = `${maxCssSize * pixelRatio}px ${family}`;
  const widthAtMax = measureCtx.measureText(text).width;
  const fontSize = Math.min(maxCssSize, (maxDeviceWidth / widthAtMax) * maxCssSize);
  measureCtx.font = `${fontSize * pixelRatio}px ${family}`;
  const width = measureCtx.measureText(text).width;
  return { fontSize, width };
}

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

const SubtitleChapter = forwardRef(({ text, fontFamily, size, gl, y, hasOutgoing }, ref) => {
  const materialRef = useRef();
  const gatherMaterialRef = useRef();
  const puffMaterialRef = useRef();

  const {
    texture,
    planeWidth,
    planeHeight,
    gatherSeeds,
    gatherDirs,
    gatherRandoms,
    puffSeeds,
    puffDirs,
    puffRandoms,
  } = useMemo(() => {
    const pixelRatio = gl.getPixelRatio();
    const subtitleColor = '#eeba7b';
    const maxContentWidth = size.width * 0.9 * pixelRatio;
    const maxSubtitleFontSize = 27;

    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    const { fontSize, width: widthPx } = fitSubtitleFont(
      measureCtx,
      text,
      fontFamily,
      maxSubtitleFontSize,
      maxContentWidth,
      pixelRatio,
    );
    const heightPx = fontSize * 1.6 * pixelRatio;

    const canvas = document.createElement('canvas');
    canvas.width = widthPx;
    canvas.height = heightPx;
    const ctx = canvas.getContext('2d');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${fontSize * pixelRatio}px ${fontFamily}`;
    ctx.fillStyle = subtitleColor;
    ctx.fillText(text, widthPx / 2, heightPx / 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;

    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const points = scanGlyphPixels(image, SUBTITLE_TARGET_PARTICLES);

    const gSeeds = [];
    const gDirs = [];
    const gRandoms = [];
    const pSeeds = [];
    const pDirs = [];
    const pRandoms = [];
    for (let i = 0; i < points.length / 2; i++) {
      const px = points[i * 2];
      const py = points[i * 2 + 1];
      const localX = (px - canvas.width / 2) / pixelRatio;
      const localY = (canvas.height / 2 - py) / pixelRatio;

      const gAngle = SUBTITLE_GATHER_ANGLE + (Math.random() - 0.5) * SUBTITLE_PUFF_ANGLE_SPREAD;
      gSeeds.push(localX, localY, 0);
      gDirs.push(Math.cos(gAngle), Math.sin(gAngle));
      gRandoms.push(Math.random());

      if (hasOutgoing) {
        const pAngle = SUBTITLE_PUFF_ANGLE + (Math.random() - 0.5) * SUBTITLE_PUFF_ANGLE_SPREAD;
        pSeeds.push(localX, localY, 0);
        pDirs.push(Math.cos(pAngle), Math.sin(pAngle));
        pRandoms.push(Math.random());
      }
    }

    return {
      texture: tex,
      planeWidth: canvas.width / pixelRatio,
      planeHeight: canvas.height / pixelRatio,
      gatherSeeds: new Float32Array(gSeeds),
      gatherDirs: new Float32Array(gDirs),
      gatherRandoms: new Float32Array(gRandoms),
      puffSeeds: new Float32Array(pSeeds),
      puffDirs: new Float32Array(pDirs),
      puffRandoms: new Float32Array(pRandoms),
    };
  }, [text, fontFamily, size.width, hasOutgoing, gl]);

  const textUniforms = useMemo(
    () => ({
      map: { value: texture },
      alpha: { value: 0.8 },
      uReveal: { value: 0 },
    }),
    [texture],
  );

  const dustDistance = Math.hypot(size.width, size.height);
  const gatherUniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uDistance: { value: dustDistance },
      uPixelRatio: { value: gl.getPixelRatio() },
      uSize: { value: 6.5 },
      uMinSize: { value: 2.2 },
    }),
    [gl, dustDistance],
  );
  const puffUniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uDistance: { value: dustDistance },
      uPixelRatio: { value: gl.getPixelRatio() },
      uSize: { value: 6.5 },
      uMinSize: { value: 2.2 },
    }),
    [gl, dustDistance],
  );

  useImperativeHandle(ref, () => ({
    update: (gatherT, textT, travelT) => {
      if (gatherMaterialRef.current) {
        gatherMaterialRef.current.uniforms.uProgress.value = gatherT;
      }
      if (puffMaterialRef.current) {
        puffMaterialRef.current.uniforms.uProgress.value = travelT;
      }
      if (materialRef.current) {
        materialRef.current.uniforms.uReveal.value = smoothstep(0.6, 1, gatherT) * (1 - textT);
      }
    },
  }));

  return (
    <>
      <mesh position={[0, y, 0.1]} frustumCulled={false}>
        <planeGeometry args={[planeWidth, planeHeight]} />
        <rawShaderMaterial
          ref={materialRef}
          uniforms={textUniforms}
          vertexShader={textVertexShader}
          fragmentShader={plainTextFragmentShader}
          transparent
        />
      </mesh>

      {gatherSeeds.length > 0 && (
        <points position={[0, y, 0.15]} frustumCulled={false}>
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

      {hasOutgoing && puffSeeds.length > 0 && (
        <points position={[0, y, 0.15]} frustumCulled={false}>
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
    </>
  );
});

const TextReveal = forwardRef((_, ref) => {
  const { size, gl } = useThree();
  const materialRef = useRef();
  const puffMaterialRef = useRef();
  const chapterRefs = useRef([]);
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
    secondSubtitleY,
  } = useMemo(() => {
    const text = 'Behfar Behzad';
    const subtitle = 'A software developer who loves to build';
    const subtitleColor = '#eeba7b';
    const isMobile = size.width < 768;
    const letterSpacing = isMobile ? 0.1 : 0.18;
    const pixelRatio = gl.getPixelRatio();

    const maxContentWidth = size.width * 0.9 * pixelRatio;
    const maxFontSize = 50;
    const maxSubtitleFontSize = 27;

    const nameCharFactor = text.length + letterSpacing * (text.length - 1);
    const fontSize = Math.min(maxFontSize, maxContentWidth / pixelRatio / nameCharFactor);
    const nameWidth = fontSize * nameCharFactor * pixelRatio;
    const nameHeight = fontSize * 1.2 * pixelRatio;

    const canvas = document.createElement('canvas');
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

    return {
      texture: tex,
      planeWidth: width / pixelRatio,
      planeHeight: height / pixelRatio,
      subtitleVMax: 1 - nameHeight / height,
      puffSeeds: new Float32Array(seeds),
      puffDirs: new Float32Array(dirs),
      puffRandoms: new Float32Array(randoms),
      secondSubtitleY: -(nameHeight / pixelRatio) / 2,
    };
  }, [size.width, fontFamily, subtitleFontFamily, gl]);

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

  const puffUniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
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
    updateDissolve: (textT, travelT) => {
      if (materialRef.current) {
        materialRef.current.uniforms.uSubtitleFade.value = textT;
      }
      if (puffMaterialRef.current) {
        puffMaterialRef.current.uniforms.uProgress.value = travelT;
      }
    },
    updateChapter: (index, gatherT, textT, travelT) => {
      chapterRefs.current[index]?.update(gatherT, textT, travelT);
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

      {SUBTITLE_CHAPTERS.map((chapterText, i) => (
        <SubtitleChapter
          key={chapterText}
          ref={(el) => {
            chapterRefs.current[i] = el;
          }}
          text={chapterText}
          fontFamily={subtitleFontFamily}
          size={size}
          gl={gl}
          y={secondSubtitleY}
          hasOutgoing={i < SUBTITLE_CHAPTERS.length - 1}
        />
      ))}
    </>
  );
});

const TEXT_FADE_RATIO = 1 / 4;
const HOLD_RATIO = 0.35;

function withHold(raw, holdRatio, holdFirst) {
  return holdFirst ? clamp01((raw - holdRatio) / (1 - holdRatio)) : clamp01(raw / (1 - holdRatio));
}

const Scene = ({ orbitProgress = 0, storyEnd = SUBTITLE_STORY_END }) => {
  const { size, camera } = useThree();
  const starRef = useRef();
  const textRef = useRef();
  const wasAwayFromTopRef = useRef(false);
  const sizeRef = useRef(size);
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  useLayoutEffect(() => {
    camera.fov = Math.atan(size.height / 2 / CAMERA_Z) * (180 / Math.PI) * 2;
    camera.updateProjectionMatrix();
  }, [camera, size.height]);

  const playSweep = useCallback((revealText) => {
    const { width, height } = sizeRef.current;
    const clientHalfWidth = width / 2;
    const clientHalfHeight = height / 2;
    const period = Math.PI * 3;
    const amplitude = Math.min(Math.max(width * 0.1, 100), 180);

    const tl = gsap.timeline();

    const waveTarget = { progress: 0 };
    tl.to(waveTarget, {
      progress: 1,
      duration: 1.08,
      ease: 'power2.inOut',
      onUpdate: () => {
        const p = waveTarget.progress;
        starRef.current?.draw(Math.cos(p * period) * amplitude, (p * height - clientHalfHeight) * 1.3);
      },
      onComplete: () => {
        starRef.current?.draw(-clientHalfWidth, height - clientHalfHeight);
        starRef.current?.draw(-clientHalfWidth * 1.1, 0);
        starRef.current?.resetPosition();
      },
    });

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
          textRef.current?.updateProgress(p - width * 0.08);
        }
      },
      onComplete: () => {
        starRef.current?.resetPosition();
        if (revealText) {
          setHasPlayed(true);
        }
      },
    });

    return tl;
  }, []);

  useEffect(() => {
    const tl = playSweep(true);
    return () => tl.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playSweep]);

  useEffect(() => {
    if (orbitProgress > 0) {
      wasAwayFromTopRef.current = true;
      return undefined;
    }

    if (!hasPlayed || !wasAwayFromTopRef.current) return undefined;
    wasAwayFromTopRef.current = false;

    const tl = playSweep(false);
    return () => tl.kill();
  }, [orbitProgress, playSweep, hasPlayed]);

  useEffect(() => {
    const effectiveProgress = hasPlayed ? orbitProgress : 0;
    const beatCount = 2 * SUBTITLE_CHAPTERS.length;
    const beatWidth = storyEnd / beatCount;
    const beatT = (k) => clamp01((effectiveProgress - k * beatWidth) / beatWidth);
    const textFadeT = (motionT) => clamp01(motionT / TEXT_FADE_RATIO);

    const dissolveMotionT = withHold(beatT(0), HOLD_RATIO, true);
    textRef.current?.updateDissolve(textFadeT(dissolveMotionT), dissolveMotionT);

    SUBTITLE_CHAPTERS.forEach((_, i) => {
      const inBeat = 1 + 2 * i;
      const hasOutgoing = i < SUBTITLE_CHAPTERS.length - 1;
      const outBeat = inBeat + 1;
      const gatherT = withHold(beatT(inBeat), HOLD_RATIO, false);
      const outMotionT = hasOutgoing ? beatT(outBeat) : 0;
      const textT = hasOutgoing ? textFadeT(outMotionT) : 0;
      textRef.current?.updateChapter(i, gatherT, textT, outMotionT);
    });
  }, [orbitProgress, storyEnd, hasPlayed]);

  return (
    <>
      <ShootingStar ref={starRef} />
      <TextReveal ref={textRef} />
    </>
  );
};

export default function ShootingStarIntro({ orbitProgress, storyEnd = SUBTITLE_STORY_END }) {
  const overlayRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      rootMargin: '200px',
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const calculateFov = () => {
    const height = window.innerHeight;
    return Math.atan(height / 2 / CAMERA_Z) * (180 / Math.PI) * 2;
  };

  const isMobile = window.innerWidth < 768;
  const canvasDpr = isMobile
    ? Math.min(window.devicePixelRatio, 2)
    : Math.max(window.devicePixelRatio, 2);

  return (
    <div ref={overlayRef} className={styles.overlay}>
      <Canvas
        frameloop={isVisible ? 'always' : 'never'}
        camera={{
          position: [0, 0, CAMERA_Z],
          far: CAMERA_Z,
          fov: calculateFov(),
        }}
        dpr={canvasDpr}
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
