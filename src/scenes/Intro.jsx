import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createStars, updateStars } from '../utils/scenes/stars';
import { createGalaxies } from '../utils/scenes/galaxies';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandPointer } from '@fortawesome/free-solid-svg-icons';
import ShootingStarIntro from './ShootingStarIntro';
import styles from './Intro.module.css';

export default function Intro({ blurred, onReady }) {
  const canvasRef = useRef(null);
  const [holding, setHolding] = useState(false);

  // Track whether the intro animation is still running
  const [showIntroOverlay, setShowIntroOverlay] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const scene = new THREE.Scene();

    const stars = createStars(scene);
    createGalaxies(scene);

    const sizes = { width: window.innerWidth, height: window.innerHeight };

    const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 10000);
    camera.position.set(4, 4, 2);
    scene.add(camera);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;

    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const handleResize = () => {
      sizes.width = window.innerWidth;
      sizes.height = window.innerHeight;
      camera.aspect = sizes.width / sizes.height;
      camera.updateProjectionMatrix();
      renderer.setSize(sizes.width, sizes.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();
    let animFrame;

    const tick = () => {
      const elapsedTime = clock.getElapsedTime();
      updateStars(stars, elapsedTime);
      controls.update();
      renderer.render(scene, camera);
      animFrame = window.requestAnimationFrame(tick);
    };
    tick();
    onReady?.();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrame);
      renderer.dispose();
    };
  }, [onReady]);

  const canvasClass = `${styles.webgl}${blurred ? ` ${styles['webgl--blurred']}` : ''}`;
  const hintClass = `${styles.instruction}${holding ? ` ${styles['instruction--holding']}` : ''}`;

  return (
    <>
      <canvas ref={canvasRef} className={canvasClass} />

      {/* Render the intro overlay if not blurred AND the animation hasn't finished. 
        Once onComplete fires, this unmounts the R3F canvas completely.
      */}
      {!blurred && showIntroOverlay && (
        <ShootingStarIntro onComplete={() => setShowIntroOverlay(false)} />
      )}

      <span
        className={hintClass}
        onMouseDown={() => setHolding(true)}
        onMouseUp={() => setHolding(false)}
        onPointerDown={() => setHolding(true)}
        onPointerUp={() => setHolding(false)}
      >
        <FontAwesomeIcon className={styles.instruction__icon} icon={faHandPointer} size="4x" />
        <span className={styles.instruction__text}>{holding ? 'Explore' : 'Click & Hold'}</span>
      </span>
    </>
  );
}
