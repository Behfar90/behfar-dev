import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { particlesVertexShader, particlesFragmentShader } from '../utils/shaders/particles.js';
import usePortraitParticleData from '../hooks/usePortraitParticleData';
import usePortraitTailInteraction from '../hooks/usePortraitTailInteraction';
import styles from './PortraitParticles.module.css';

const Particles = () => {
  const texture = useTexture('/png/MyPic.png');
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

  const { offsets, angles, pindices, gridW, gridH, visiblePoints, meshScale } =
    usePortraitParticleData(texture, options.threshold);
  const { tailTexture, drawTail, handlePointerMove } = usePortraitTailInteraction();

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
      <mesh ref={hitPlaneRef} scale={[meshScale, meshScale, 1]} onPointerMove={handlePointerMove}>
        <planeGeometry args={[gridW, gridH]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>

      <mesh ref={meshRef} rotation={[0, 0.125, 0]} scale={[meshScale, meshScale, 1]}>
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
