import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { particlesVertexShader, particlesFragmentShader } from '../utils/shaders/particles.js';
import styles from './PortraitParticles.module.css';

// ==========================================
// 1. UTILITIES
// ==========================================

const easeOutSine = (t, b, c, d) => c * Math.sin((t / d) * (Math.PI / 2)) + b;

// ==========================================
// 2. INTERNAL HOOKS
// ==========================================

const useParticleData = (texture, threshold) => {
  return useMemo(() => {
    if (!texture || !texture.image) return { visiblePoints: 0 };
    const img = texture.image;

    const MAX_WIDTH = 250;
    const ratio = img.height / img.width;
    const w = MAX_WIDTH;
    const h = Math.floor(MAX_WIDTH * ratio);
    const totalPoints = w * h;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    ctx.translate(0, h);
    ctx.scale(1, -1);
    ctx.drawImage(img, 0, 0, w, h);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = Float32Array.from(imgData.data);

    let visible = 0;
    for (let i = 0; i < totalPoints; i++) {
      if (data[i * 4 + 0] > threshold) visible++;
    }

    const offsets = new Float32Array(visible * 3);
    const pindices = new Float32Array(visible);
    const angles = new Float32Array(visible);

    let j = 0;
    for (let i = 0; i < totalPoints; i++) {
      if (data[i * 4 + 0] <= threshold) continue;
      offsets[j * 3 + 0] = i % w;
      offsets[j * 3 + 1] = Math.floor(i / w);
      pindices[j] = i;
      angles[j] = Math.random() * Math.PI;
      j++;
    }

    const fovHeight = 2 * Math.tan((50 * Math.PI) / 180 / 2) * 180;
    const fModifier = window.innerWidth / window.innerHeight < 2.8 ? -0.2 : 0.1;
    const scale = fovHeight / h + fModifier;

    return {
      offsets,
      angles,
      pindices,
      gridW: w,
      gridH: h,
      visiblePoints: visible,
      meshScale: scale,
    };
  }, [texture, threshold]);
};

const useTailInteraction = () => {
  const tailRef = useRef({
    array: [],
    size: 80,
    maxAge: 70,
    radius: 0.08,
    red: 255,
  });

  const { tailCanvas, tailCtx, tailTexture } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = tailRef.current.size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return {
      tailCanvas: canvas,
      tailCtx: ctx,
      tailTexture: new THREE.CanvasTexture(canvas),
    };
  }, []);

  const drawTail = () => {
    tailCtx.fillStyle = 'black';
    tailCtx.fillRect(0, 0, tailCanvas.width, tailCanvas.height);

    tailRef.current.array.forEach((point, i) => {
      point.age++;
      if (point.age > tailRef.current.maxAge) {
        tailRef.current.array.splice(i, 1);
      } else {
        const pos = {
          x: point.x * tailRef.current.size,
          y: (1 - point.y) * tailRef.current.size,
        };
        let intensity =
          point.age < tailRef.current.maxAge * 0.3
            ? easeOutSine(point.age / (tailRef.current.maxAge * 0.3), 0, 1, 1)
            : easeOutSine(
                1 - (point.age - tailRef.current.maxAge * 0.3) / (tailRef.current.maxAge * 0.7),
                0,
                1,
                1,
              );

        intensity *= point.force;
        const radius = tailRef.current.size * tailRef.current.radius * intensity;
        const grd = tailCtx.createRadialGradient(pos.x, pos.y, radius * 0.25, pos.x, pos.y, radius);

        grd.addColorStop(0, `rgba(${tailRef.current.red}, 255, 255, 0.2)`);
        grd.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

        tailCtx.beginPath();
        tailCtx.fillStyle = grd;
        tailCtx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        tailCtx.fill();
      }
    });

    tailTexture.needsUpdate = true;
  };

  const handlePointerMove = (e, meshRef) => {
    const uv = e.uv;
    let force = 0;
    const last = tailRef.current.array[tailRef.current.array.length - 1];
    if (last) {
      const dx = last.x - uv.x;
      const dy = last.y - uv.y;
      force = Math.min((dx * dx + dy * dy) * 10000, 1);
    }
    tailRef.current.array.push({ x: uv.x, y: uv.y, age: 0, force });

    if (meshRef.current) {
      meshRef.current.rotation.y = e.pointer.x / 8;
      meshRef.current.rotation.x = -e.pointer.y / 8;
    }
  };

  return { tailTexture, drawTail, handlePointerMove };
};

// ==========================================
// 3. 3D PARTICLES COMPONENT
// ==========================================

const Particles = () => {
  const texture = useTexture('/MyPic.png');
  const meshRef = useRef();
  const materialRef = useRef();
  const hitPlaneRef = useRef();

  const options = useMemo(
    () => ({
      threshold: 80,
      random: 1.0,
      depth: 4.0,
      maxDepth: 120.0,
      size: 1.5,
      square: 0,
    }),
    [],
  );

  const { offsets, angles, pindices, gridW, gridH, visiblePoints, meshScale } = useParticleData(
    texture,
    options.threshold,
  );
  const { tailTexture, drawTail, handlePointerMove } = useTailInteraction();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRandom: { value: options.random },
      uDepth: { value: options.depth },
      uSize: { value: options.size },
      uTextureSize: { value: new THREE.Vector2(gridW, gridH) },
      uTexture: { value: texture },
      uTouch: { value: tailTexture },
      uAlphaCircle: { value: 0.0 },
      uCircleORsquare: { value: options.square },
    }),
    [texture, tailTexture, gridW, gridH, options],
  );

  useEffect(() => {
    if (!meshRef.current || !materialRef.current) return;

    const meshAnim = gsap.fromTo(
      meshRef.current.position,
      { z: 0.0 },
      {
        z: 15.0,
        duration: 4,
        delay: 8,
        ease: 'elastic.in(1, 0.3)',
        yoyo: true,
        repeat: -1,
        repeatDelay: 5,
      },
    );
    const depthAnim = gsap.fromTo(
      materialRef.current.uniforms.uDepth,
      { value: options.depth },
      {
        value: options.maxDepth,
        duration: 4,
        delay: 8,
        ease: 'elastic.in(1, 0.3)',
        yoyo: true,
        repeat: -1,
        repeatDelay: 5,
      },
    );

    return () => {
      meshAnim.kill();
      depthAnim.kill();
    };
  }, [options.depth, options.maxDepth]);

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
    drawTail();
  });

  if (visiblePoints === 0) return null;

  return (
    <group>
      <mesh
        ref={hitPlaneRef}
        scale={[meshScale, meshScale, 1]}
        onPointerMove={(e) => handlePointerMove(e, meshRef)}
      >
        <planeGeometry args={[gridW, gridH]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>

      <mesh ref={meshRef} scale={[meshScale, meshScale, 1]}>
        <instancedBufferGeometry instanceCount={visiblePoints}>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array([-0.5, 0.5, 0.0, 0.5, 0.5, 0.0, -0.5, -0.5, 0.0, 0.5, -0.5, 0.0]),
              3,
            ]}
          />
          <bufferAttribute
            attach="attributes-uv"
            args={[new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]), 2]}
          />
          <bufferAttribute attach="index" args={[new Uint16Array([0, 2, 1, 2, 3, 1]), 1]} />

          <instancedBufferAttribute attach="attributes-offset" args={[offsets, 3]} />
          <instancedBufferAttribute attach="attributes-angle" args={[angles, 1]} />
          <instancedBufferAttribute attach="attributes-pindex" args={[pindices, 1]} />
        </instancedBufferGeometry>

        <rawShaderMaterial
          ref={materialRef}
          args={[
            {
              uniforms: uniforms,
              vertexShader: particlesVertexShader,
              fragmentShader: particlesFragmentShader,
              depthTest: false,
              transparent: true,
            },
          ]}
        />
      </mesh>
    </group>
  );
};

// ==========================================
// 4. MAIN EXPORTED COMPONENT
// ==========================================

export default function ParticleScene() {
  const quoteRef = useRef();

  useEffect(() => {
    gsap.fromTo(
      quoteRef.current,
      { scale: 1 },
      { scale: 1.15, duration: 1, ease: 'power2.out', yoyo: true, repeat: 1, delay: 0.5 },
    );
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.canvasContainer}>
        <Canvas camera={{ position: [0, 0, 180], fov: 50, near: 0.1, far: 10000 }}>
          <React.Suspense fallback={null}>
            <Particles />
          </React.Suspense>
        </Canvas>
      </div>
    </div>
  );
}
