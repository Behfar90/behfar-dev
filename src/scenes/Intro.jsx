import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createStars, updateStars } from '../utils/scenes/stars';
import { createGalaxies } from '../utils/scenes/galaxies';
import ShootingStarIntro from '../components/ShootingStarIntro';
import styles from './Intro.module.css';

// orbitProgress (0 to 1, from useScrollJourney) maps directly to camera
// rotation - it's driven by real scroll position, not scroll-jacked, so
// scrolling up naturally winds the camera back to its start.
const ORBIT_EASE = 0.05;
const FULL_SPIN = Math.PI;
const LOOK_RANGE = 1.5;
const LOOK_EASE = 0.03;

// Placeholder copy - just trying out the crossfade-on-orbit-progress idea for
// now, wording isn't final.
const ORBIT_CAPTIONS = [
  'Keep scrolling…',
  'Detail-obsessed. Motion-driven.',
  '5+ years building for the web',
  "Here's what I've built ↓",
];

export default function Intro({ wrapperRef, blurred, orbitProgress = 0, onReady }) {
  const canvasRef = useRef(null);

  // Read via refs (rather than effect dependencies) so a new prop value on
  // every parent render can't retrigger the whole scene setup below - doing
  // that used to reset the camera's eased angle back to its start mid-orbit,
  // causing a visible snap any time the app re-rendered.
  const orbitProgressRef = useRef(orbitProgress);
  useEffect(() => {
    orbitProgressRef.current = orbitProgress;
  }, [orbitProgress]);

  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const scene = new THREE.Scene();

    const stars = createStars(scene);
    createGalaxies(scene);

    const sizes = { width: window.innerWidth, height: window.innerHeight };

    const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 10000);
    camera.position.set(4, 4, 2);
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const radius = Math.hypot(camera.position.x, camera.position.z);
    const height = camera.position.y;
    const baseTheta = Math.atan2(camera.position.x, camera.position.z);
    let theta = baseTheta + orbitProgressRef.current * FULL_SPIN;

    // Camera stays put but turns to face wherever the pointer is
    const mouse = { x: 0, y: 0 };
    const lookTarget = new THREE.Vector3(0, 0, 0);

    const handleMouseMove = (event) => {
      mouse.x = (event.clientX / sizes.width) * 2 - 1;
      mouse.y = -(event.clientY / sizes.height) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      sizes.width = window.innerWidth;
      sizes.height = window.innerHeight;
      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();
      renderer.setSize(sizes.width, sizes.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', handleResize);

    const timer = new THREE.Timer();
    let animFrame;

    const tick = (timestamp) => {
      timer.update(timestamp);
      const elapsedTime = timer.getElapsed();
      updateStars(stars, elapsedTime);

      const targetTheta = baseTheta + orbitProgressRef.current * FULL_SPIN;
      theta += (targetTheta - theta) * ORBIT_EASE;
      camera.position.x = Math.sin(theta) * radius;
      camera.position.z = Math.cos(theta) * radius;
      camera.position.y = height;

      lookTarget.x += (mouse.x * LOOK_RANGE - lookTarget.x) * LOOK_EASE;
      lookTarget.y += (mouse.y * LOOK_RANGE - lookTarget.y) * LOOK_EASE;
      camera.lookAt(lookTarget);

      renderer.render(scene, camera);
      animFrame = window.requestAnimationFrame(tick);
    };
    tick();
    onReadyRef.current?.();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrame);
      renderer.dispose();
    };
  }, []);

  const stickyClass = `${styles.sticky}${blurred ? ` ${styles['sticky--blurred']}` : ''}`;
  const captionIndex = Math.min(
    ORBIT_CAPTIONS.length - 1,
    Math.floor(orbitProgress * ORBIT_CAPTIONS.length),
  );

  return (
    <div ref={wrapperRef} className={styles.orbitWrapper}>
      <div className={stickyClass}>
        <canvas ref={canvasRef} className={styles.webgl} />

        {!blurred && <ShootingStarIntro orbitProgress={orbitProgress} />}

        {!blurred && (
          <div className={styles.caption}>
            {ORBIT_CAPTIONS.map((text, i) => (
              <span
                key={text}
                className={`${styles.captionText}${orbitProgress > 0 && i === captionIndex ? ` ${styles['captionText--visible']}` : ''}`}
              >
                {text}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
