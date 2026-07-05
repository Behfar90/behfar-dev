import React, { useEffect, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import {
  starVertexShader,
  starFragmentShader,
  textVertexShader,
  textFragmentShader,
} from '../utils/scenes/shootingStarShaders.js';
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
  const redrawRef = useRef();

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
    const drawText = (fontFamily) => {
      ctx.clearRect(0, 0, width, height);
      ctx.font = `${fontSize * pixelRatio}px ${fontFamily}`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, width / 2, height / 2);
    };
    // Draw with the fallback first; the custom face swaps in once loaded (see useEffect below)
    drawText('Georgia, serif');
    redrawRef.current = drawText;

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;

    return {
      texture: tex,
      planeWidth: width / pixelRatio,
      planeHeight: height / pixelRatio,
    };
  }, [size.width]);

  useEffect(() => {
    document.fonts
      .load('1em Monoton')
      .then(() => {
        redrawRef.current?.('Monoton, Georgia, serif');
        texture.needsUpdate = true;
      })
      .catch(() => {});
  }, [texture]);

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
    fadeOut: () => {
      if (materialRef.current) {
        // Optional smooth fade out before unmount
        gsap.to(materialRef.current.uniforms.alpha, {
          value: 0,
          duration: 1,
          ease: 'power2.out',
        });
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

const Scene = ({ onComplete }) => {
  const { size } = useThree();
  const starRef = useRef();
  const textRef = useRef();

  useEffect(() => {
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

    // 2. Text Reveal (Straight Line)
    const revealTarget = { progress: -clientHalfWidth * 1.1 };
    tl.to(revealTarget, {
      progress: clientHalfWidth * 1.1,
      duration: 1.08,
      ease: 'power3.out',
      delay: 0.3,
      onUpdate: () => {
        const p = revealTarget.progress;
        starRef.current?.draw(p, 0);
        textRef.current?.updateProgress(p - size.width * 0.08);
      },
      onComplete: () => {
        starRef.current?.resetPosition();

        // Wait for the user to read the name, fade it out, then call onComplete
        setTimeout(() => {
          textRef.current?.fadeOut();
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 1000); // 1s buffer for the fade out
        }, 2000); // 2s reading time
      },
    });

    return () => tl.kill();
  }, [size, onComplete]);

  return (
    <>
      <ShootingStar ref={starRef} />
      <TextReveal ref={textRef} />
    </>
  );
};

export default function ShootingStarIntro({ onComplete }) {
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
        <Scene onComplete={onComplete} />
      </Canvas>
    </div>
  );
}
