import {
  useCallback,
  useEffect,
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
} from '../utils/shaders/shootingStar.js';
import styles from './ShootingStarIntro.module.css';

// --- Constants & Shaders ---
const CAMERA_Z = 5000;
const PER_MOUSE = 800;
const COUNT = PER_MOUSE * 200;
const MOUSE_ATTR_COUNT = 4;
const FRONT_ATTR_COUNT = 2;

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
  const { size } = useThree();
  const materialRef = useRef();
  // Starts with the fallback; swaps to the custom face once it's actually
  // loaded, triggering a clean re-draw of the canvas via the memo below
  // instead of mutating an existing texture out from under Three.
  const [fontFamily, setFontFamily] = useState('Georgia, serif');

  useEffect(() => {
    document.fonts
      .load('1em Monoton')
      .then(() => setFontFamily('Monoton, Georgia, serif'))
      .catch(() => {});
  }, []);

  const { texture, planeWidth, planeHeight } = useMemo(() => {
    // Custom name replacement here
    const text = 'Behfar Behzad';
    const isMobile = size.width < 768;
    const isMin = size.width < 360;
    const fontSize = isMin ? 28 : isMobile ? 36 : 50;
    const letterSpacing = isMobile ? 0.1 : 0.18;
    const pixelRatio = window.devicePixelRatio;

    const canvas = document.createElement('canvas');
    const width =
      (fontSize * text.length + fontSize * letterSpacing * (text.length - 1)) * pixelRatio;
    const height = fontSize * 1.2 * pixelRatio;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.font = `${fontSize * pixelRatio}px ${fontFamily}`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;

    return {
      texture: tex,
      planeWidth: width / pixelRatio,
      planeHeight: height / pixelRatio,
    };
  }, [size.width, fontFamily]);

  const uniforms = useMemo(
    () => ({
      map: { value: texture },
      uProgress: { value: -(size.width / 2) },
      uStartX: { value: size.width / 2 - planeWidth / 2 },
      uRatio: { value: planeWidth / planeHeight },
      alpha: { value: 0.8 },
    }),
    [texture, size.width, planeWidth, planeHeight],
  );

  useImperativeHandle(ref, () => ({
    updateProgress: (p) => {
      if (materialRef.current) {
        materialRef.current.uniforms.uProgress.value = p;
      }
    },
  }));

  return (
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
  );
});

// The name is only ever revealed once per session; every later shooting-star
// sweep (triggered by scrolling back to the very top) replays purely as a
// decorative flourish and leaves the already-revealed text untouched.
let hasPlayed = false;

const Scene = ({ orbitProgress = 0 }) => {
  const { size } = useThree();
  const starRef = useRef();
  const textRef = useRef();
  const wasAwayFromTopRef = useRef(false);

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

  return (
    <>
      <ShootingStar ref={starRef} />
      <TextReveal ref={textRef} />
    </>
  );
};

export default function ShootingStarIntro({ orbitProgress }) {
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
        <Scene orbitProgress={orbitProgress} />
      </Canvas>
    </div>
  );
}
