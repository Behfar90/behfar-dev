import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createStars, updateStars } from '../utils/scenes/stars';
import { createGalaxies } from '../utils/scenes/galaxies';
import { createNebulas, updateNebulas } from '../utils/scenes/nebulas';
import { SUBTITLE_STORY_END } from '../utils/scenes/universeTiming';
import { lerp, smoothstep, clamp01 } from '../utils/math';
import ShootingStarIntro from '../components/ShootingStarIntro';
import CaptionGravity from '../components/CaptionGravity';
import styles from './Universe.module.css';

// orbitProgress (0 to 1, from useScrollJourney) maps directly to camera
// rotation - it's driven by real scroll position, not scroll-jacked, so
// scrolling up naturally winds the camera back to its start.
const ORBIT_EASE = 0.05;
const FULL_SPIN = Math.PI;
const LOOK_RANGE = 1.5;
const LOOK_EASE = 0.03;

// The camera starts pulled back and panned off its resting angle, then
// eases into place across SUBTITLE_STORY_END (see universeTiming.js) - a
// "swooping in and settling" arrival that pairs with the subtitle's own
// dissolve/gather, and hands off to captions/orbit spin only once it's
// done, so the intro reads as one settling-into-place beat instead of
// three unrelated things moving at once - see captionProgress below.
const INTRO_RADIUS_SCALE = 1.35;
const INTRO_THETA_OFFSET = -Math.PI / 9;

// Placeholder copy - just trying out the crossfade-on-orbit-progress idea for
// now, wording isn't final.
const ORBIT_CAPTIONS = [
  'Keep scrolling…',
  'Detail-obsessed. Motion-driven.',
  '5+ years building for the web',
  "Here's what I've built ↓",
];

export default function Universe({ wrapperRef, rendering, showOverlays, orbitProgress = 0 }) {
  const canvasRef = useRef(null);

  // Read via refs (rather than effect dependencies) so a new prop value on
  // every parent render can't retrigger the whole scene setup below - doing
  // that used to reset the camera's eased angle back to its start mid-orbit,
  // causing a visible snap any time the app re-rendered.
  const orbitProgressRef = useRef(orbitProgress);
  useEffect(() => {
    orbitProgressRef.current = orbitProgress;
  }, [orbitProgress]);

  // `rendering` gates the actual render call (not the whole loop, so
  // camera/orbit state keeps advancing regardless) - lets a caller hold off
  // showing this canvas without pausing its state.
  const renderingRef = useRef(rendering);
  useEffect(() => {
    renderingRef.current = rendering;
  }, [rendering]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const scene = new THREE.Scene();

    const stars = createStars(scene);
    createGalaxies(scene);
    const nebulas = createNebulas(scene);

    const sizes = { width: window.innerWidth, height: window.innerHeight };

    const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 10000);
    camera.position.set(0, 0, 8);
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const radius = Math.hypot(camera.position.x, camera.position.z);
    const height = camera.position.y;
    const baseTheta = Math.atan2(camera.position.x, camera.position.z);

    // Below SUBTITLE_STORY_END, the camera arrives - easing in from a wider,
    // off-angle intro pose to its resting orbit position. Past it, it does
    // its original spin, just re-based onto the remaining scroll range. The
    // two branches agree exactly at p = SUBTITLE_STORY_END, so there's no
    // snap at the handoff in either scroll direction.
    const orbitTarget = (p) => {
      if (p <= SUBTITLE_STORY_END) {
        const arriveT = smoothstep(0, 1, p / SUBTITLE_STORY_END);
        return {
          radius: lerp(radius * INTRO_RADIUS_SCALE, radius, arriveT),
          theta: lerp(baseTheta + INTRO_THETA_OFFSET, baseTheta, arriveT),
        };
      }
      const spinT = (p - SUBTITLE_STORY_END) / (1 - SUBTITLE_STORY_END);
      return { radius, theta: baseTheta + spinT * FULL_SPIN };
    };

    // Seeded from the initial orbitProgress (rather than the intro pose
    // outright) so a mid-scroll mount doesn't pop in from off-angle.
    const initialTarget = orbitTarget(orbitProgressRef.current);
    let currentRadius = initialTarget.radius;
    let currentTheta = initialTarget.theta;

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
    // Stars' staggered ignition flash (see stars.js) counts from when
    // rendering actually starts rather than from mount, in case a caller
    // ever holds `rendering` false for a while first - so they always get
    // to play out on-screen instead of finishing unseen beforehand.
    let renderStartTime = null;

    const tick = (timestamp) => {
      timer.update(timestamp);
      const elapsedTime = timer.getElapsed();
      if (renderingRef.current && renderStartTime === null) {
        renderStartTime = elapsedTime;
      }
      const sinceReveal = renderStartTime === null ? 0 : elapsedTime - renderStartTime;
      updateStars(stars, elapsedTime, sinceReveal);
      updateNebulas(nebulas, elapsedTime);

      const target = orbitTarget(orbitProgressRef.current);
      currentRadius += (target.radius - currentRadius) * ORBIT_EASE;
      currentTheta += (target.theta - currentTheta) * ORBIT_EASE;
      camera.position.x = Math.sin(currentTheta) * currentRadius;
      camera.position.z = Math.cos(currentTheta) * currentRadius;
      camera.position.y = height;

      lookTarget.x += (mouse.x * LOOK_RANGE - lookTarget.x) * LOOK_EASE;
      lookTarget.y += (mouse.y * LOOK_RANGE - lookTarget.y) * LOOK_EASE;
      camera.lookAt(lookTarget);

      if (renderingRef.current) {
        renderer.render(scene, camera);
      }
      animFrame = window.requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrame);
      renderer.dispose();
    };
  }, []);

  // Captions don't start until the camera's arrival + subtitle story (see
  // SUBTITLE_STORY_END) is done - re-based onto the remaining scroll range,
  // same as orbitTarget's spinT above, so the two hand off at the same
  // instant.
  const captionProgress = clamp01((orbitProgress - SUBTITLE_STORY_END) / (1 - SUBTITLE_STORY_END));

  return (
    <div ref={wrapperRef} className={styles.orbitWrapper}>
      <div className={styles.sticky}>
        <canvas ref={canvasRef} className={styles.webgl} />

        {showOverlays && (
          <ShootingStarIntro orbitProgress={orbitProgress} storyEnd={SUBTITLE_STORY_END} />
        )}

        {showOverlays && <CaptionGravity orbitProgress={captionProgress} captions={ORBIT_CAPTIONS} />}
      </div>
    </div>
  );
}
