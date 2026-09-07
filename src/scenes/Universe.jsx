import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createStars, updateStars } from '../utils/scenes/stars';
import { createGalaxies, updateOriginGalaxyFade } from '../utils/scenes/galaxies';
import { createNebulas, updateNebulas } from '../utils/scenes/nebulas';
import { createSmoke, updateSmoke } from '../utils/scenes/smoke';
import { SUBTITLE_STORY_END, PLUNGE_START } from '../utils/scenes/universeTiming';
import { lerp, smoothstep, clamp01 } from '../utils/math';
import ShootingStarIntro from '../components/ShootingStarIntro';
import CaptionGravity from '../components/CaptionGravity';
import { REVEAL_MS as PRELOADER_REVEAL_MS } from '../components/Preloader';
import styles from './Universe.module.css';

const ORBIT_EASE = 0.05;
const FULL_SPIN = Math.PI;
const LOOK_RANGE = 1.5;
const LOOK_EASE = 0.03;

const INTRO_RADIUS_SCALE = 1.6;
const INTRO_THETA_OFFSET = -Math.PI / 6;

const PLUNGE_RADIUS_SCALE = 0.08;

const FACE_ON_RADIUS = 6;
const FACE_ON_HEIGHT = 16;
const FACE_ON_THETA_OFFSET = -Math.PI / 3;
const FACE_ON_DRIFT_RAD_PER_S = 0.15;

const easeInCubic = (t) => t * t * t;

const ORBIT_CAPTIONS = [
  'I count milliseconds recreationally',
  'Design systems to shaders',
  'Performance is a feature, not a fix',
  'Scroll for some of my highlighted works ↓',
];

export default function Universe({
  wrapperRef,
  rendering,
  showOverlays,
  orbitProgress = 0,
  introRevealing = false,
}) {
  const canvasRef = useRef(null);

  const orbitProgressRef = useRef(orbitProgress);
  useEffect(() => {
    orbitProgressRef.current = orbitProgress;
  }, [orbitProgress]);

  const renderingRef = useRef(rendering);
  useEffect(() => {
    renderingRef.current = rendering;
  }, [rendering]);

  const introRevealingRef = useRef(introRevealing);
  useEffect(() => {
    introRevealingRef.current = introRevealing;
  }, [introRevealing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const scene = new THREE.Scene();

    const isMobile = window.innerWidth < window.innerHeight;

    const stars = createStars(scene);
    const { originGalaxy, gasPuffs } = createGalaxies(scene, { isMobile });
    const nebulas = createNebulas(scene);
    const smoke = createSmoke(scene);

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

    const orbitTarget = (p) => {
      if (p <= SUBTITLE_STORY_END) {
        const arriveT = smoothstep(0, 1, p / SUBTITLE_STORY_END);
        return {
          radius: lerp(radius * INTRO_RADIUS_SCALE, radius, arriveT),
          theta: lerp(baseTheta + INTRO_THETA_OFFSET, baseTheta, arriveT),
        };
      }
      if (p <= PLUNGE_START) {
        const spinT = (p - SUBTITLE_STORY_END) / (PLUNGE_START - SUBTITLE_STORY_END);
        return { radius, theta: baseTheta + spinT * FULL_SPIN };
      }
      const plungeT = easeInCubic(clamp01((p - PLUNGE_START) / (1 - PLUNGE_START)));
      return {
        radius: lerp(radius, radius * PLUNGE_RADIUS_SCALE, plungeT),
        theta: baseTheta + FULL_SPIN,
      };
    };

    const initialTarget = orbitTarget(orbitProgressRef.current);
    let currentRadius = initialTarget.radius;
    let currentTheta = initialTarget.theta;

    let introActive = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let swoopStartMs = null;
    let swoopStartTheta = null;
    const faceOnTheta = initialTarget.theta + FACE_ON_THETA_OFFSET;
    let holdTheta = faceOnTheta;

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
    let animFrame = null;
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
      updateNebulas(gasPuffs, elapsedTime);
      const plungeT = easeInCubic(
        clamp01((orbitProgressRef.current - PLUNGE_START) / (1 - PLUNGE_START)),
      );
      updateOriginGalaxyFade(originGalaxy, plungeT);

      let fallT = 0;
      const wrapperEl = wrapperRef.current;
      if (wrapperEl) {
        const fallEndY = wrapperEl.offsetTop + wrapperEl.offsetHeight;
        const riseEndY = fallEndY - window.innerHeight;
        fallT = clamp01((window.scrollY - riseEndY) / (fallEndY - riseEndY));
      }
      const smokeOpacity = plungeT * (1 - smoothstep(0, 0.3, fallT));
      updateSmoke(smoke, elapsedTime, smokeOpacity);

      if (introActive && !introRevealingRef.current) {
        holdTheta = faceOnTheta + elapsedTime * FACE_ON_DRIFT_RAD_PER_S;
        camera.position.x = Math.sin(holdTheta) * FACE_ON_RADIUS;
        camera.position.z = Math.cos(holdTheta) * FACE_ON_RADIUS;
        camera.position.y = FACE_ON_HEIGHT;
      } else if (introActive) {
        if (swoopStartMs === null) {
          swoopStartMs = elapsedTime * 1000;
          swoopStartTheta = holdTheta;
        }
        const swoopT = clamp01((elapsedTime * 1000 - swoopStartMs) / PRELOADER_REVEAL_MS);
        const eased = 1 - (1 - swoopT) ** 3;
        const swoopRadius = lerp(FACE_ON_RADIUS, initialTarget.radius, eased);
        const swoopTheta = lerp(swoopStartTheta, initialTarget.theta, eased);
        const swoopHeight = lerp(FACE_ON_HEIGHT, height, eased);
        camera.position.x = Math.sin(swoopTheta) * swoopRadius;
        camera.position.z = Math.cos(swoopTheta) * swoopRadius;
        camera.position.y = swoopHeight;
        if (swoopT >= 1) introActive = false;
      } else {
        const target = orbitTarget(orbitProgressRef.current);
        currentRadius += (target.radius - currentRadius) * ORBIT_EASE;
        currentTheta += (target.theta - currentTheta) * ORBIT_EASE;
        camera.position.x = Math.sin(currentTheta) * currentRadius;
        camera.position.z = Math.cos(currentTheta) * currentRadius;
        camera.position.y = height;
      }

      lookTarget.x += (mouse.x * LOOK_RANGE - lookTarget.x) * LOOK_EASE;
      lookTarget.y += (mouse.y * LOOK_RANGE - lookTarget.y) * LOOK_EASE;
      camera.lookAt(lookTarget);

      if (renderingRef.current) {
        renderer.render(scene, camera);
      }
      animFrame = window.requestAnimationFrame(tick);
    };
    tick();

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (animFrame === null) {
            timer.reset();
            animFrame = window.requestAnimationFrame(tick);
          }
        } else if (animFrame !== null) {
          cancelAnimationFrame(animFrame);
          animFrame = null;
        }
      },
      { rootMargin: '200px' },
    );
    if (wrapperRef.current) visibilityObserver.observe(wrapperRef.current);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      visibilityObserver.disconnect();
      cancelAnimationFrame(animFrame);
      renderer.dispose();
    };
  }, [wrapperRef]);

  const captionProgress = clamp01(
    (orbitProgress - SUBTITLE_STORY_END) / (PLUNGE_START - SUBTITLE_STORY_END),
  );

  const plungeTextOpacity = 1 - smoothstep(PLUNGE_START, lerp(PLUNGE_START, 1, 0.3), orbitProgress);

  return (
    <div ref={wrapperRef} className={styles.orbitWrapper}>
      <div className={styles.sticky}>
        <canvas ref={canvasRef} className={styles.webgl} />

        <div style={{ opacity: plungeTextOpacity }}>
          {showOverlays && (
            <ShootingStarIntro orbitProgress={orbitProgress} storyEnd={SUBTITLE_STORY_END} />
          )}

          {showOverlays && (
            <CaptionGravity orbitProgress={captionProgress} captions={ORBIT_CAPTIONS} />
          )}
        </div>

        <div className={styles.blackout} aria-hidden="true" />
      </div>
    </div>
  );
}
