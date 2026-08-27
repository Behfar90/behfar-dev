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
import styles from './Universe.module.css';

// orbitProgress (0 to 1, from useScrollJourney) maps directly to camera
// rotation - it's driven by real scroll position, not scroll-jacked, so
// scrolling up naturally winds the camera back to its start.
const ORBIT_EASE = 0.05;
const FULL_SPIN = Math.PI;
const LOOK_RANGE = 1.5;
const LOOK_EASE = 0.03;

// The camera starts pulled well back out into space and panned off its
// resting angle, then eases into place across SUBTITLE_STORY_END (see
// universeTiming.js) - a "swooping in and settling" arrival that pairs
// with the subtitle's own dissolve/gather. Past that point the camera's
// distance/angle-from-rest are both fully settled - it only spins in
// place (see orbitTarget's spinT branch below) until PLUNGE_START, which
// is when captions take over - so the intro reads as one settling-into-
// place beat instead of three unrelated things moving at once - see
// captionProgress below. Past PLUNGE_START, orbitTarget's third branch
// takes over for Act II (see PLUNGE_RADIUS_SCALE below).
const INTRO_RADIUS_SCALE = 1.6;
const INTRO_THETA_OFFSET = -Math.PI / 6;

// Act II, "the plunge": the spin freezes wherever it ended (a straight
// fall reads cleaner than a spinning one, especially once the CSS-level
// canvas scale/blur in PlungeAtmosphere.jsx layers on top) while radius
// collapses hard toward the origin - the same point every star and
// galaxy clusters around (stars.js distributes them 10-80 units out from
// it) - so "falling toward a planet" is literally "flying toward the
// middle of the scene." Kept well above the camera's own near-plane
// (0.1) and away from radius = 0, which would make lookAt's direction
// vector degenerate.
const PLUNGE_RADIUS_SCALE = 0.08;

// Cubic ease-in, not smoothstep's symmetric ease-in-*out* - the plunge
// should keep accelerating all the way to riseEnd, not decelerate
// approaching it. Shared between orbitTarget's own radius collapse below
// and tick()'s separately-computed plungeT (galaxy fade, smoke opacity) so
// the whole Act II sequence - camera, dissolving galaxy, engulfing smoke -
// accelerates in lockstep instead of drifting apart on two different
// curves.
const easeInCubic = (t) => t * t * t;

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
    const { originGalaxy } = createGalaxies(scene);
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

    // Three phases, each agreeing exactly with the next at its boundary (at
    // p = SUBTITLE_STORY_END and p = PLUNGE_START) so there's no snap at
    // either handoff in either scroll direction:
    // 1. Below SUBTITLE_STORY_END - the camera arrives, easing in from a
    //    wider, off-angle intro pose to its resting orbit position.
    // 2. Up to PLUNGE_START - it spins in place at that resting radius,
    //    re-based onto just this range (captions play out here).
    // 3. Past PLUNGE_START - Act II: spin freezes, radius collapses toward
    //    the origin (see PLUNGE_RADIUS_SCALE above).
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
      // Same expression orbitTarget's plunge branch uses internally -
      // recomputed here (0 for the entire pre-plunge scroll, via clamp01)
      // so the galaxy dissolving away can never drift out of sync with the
      // radius collapse driving it.
      const plungeT = easeInCubic(
        clamp01((orbitProgressRef.current - PLUNGE_START) / (1 - PLUNGE_START)),
      );
      updateOriginGalaxyFade(originGalaxy, plungeT);

      // orbitProgress (and so plungeT above) is pinned at exactly 1 for the
      // entire "fall" phase - the fixed one-viewport-height of scroll
      // position: sticky takes to slide this canvas fully away, *after*
      // orbitProgress has already maxed out (see useScrollJourney.js's
      // formula, which only measures against scrollableDistance, never
      // this trailing distance) - so it can't by itself express "we're now
      // partway through the fall." Computed directly here, the same way
      // PlungeAtmosphere.jsx computes its own landmarks from this same
      // wrapperRef, rather than reading a value back from that component
      // (a getComputedStyle call every frame) - a few lines of arithmetic
      // is cheaper than a new kind of cross-component coupling.
      let fallT = 0;
      const wrapperEl = wrapperRef.current;
      if (wrapperEl) {
        const fallEndY = wrapperEl.offsetTop + wrapperEl.offsetHeight;
        const riseEndY = fallEndY - window.innerHeight;
        fallT = clamp01((window.scrollY - riseEndY) / (fallEndY - riseEndY));
      }
      // One continuous expression, no branching at the rise/fall seam:
      // fallT is 0 for the entire rise (reduces to plungeT, the fade-in),
      // and plungeT is pinned at 1 for the entire fall (reduces to the
      // fade-out curve). Resolved by 30% through the fall, matching
      // PlungeAtmosphere.jsx's blackout ramp-up window exactly - a clean
      // handoff from smoke to solid blackout, not a race between the two.
      const smokeOpacity = plungeT * (1 - smoothstep(0, 0.3, fallT));
      updateSmoke(smoke, elapsedTime, smokeOpacity);

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
    // wrapperRef is a ref object (stable identity for the component's
    // lifetime, same contract as the local refs above) - listed for
    // exhaustive-deps, but including it can't cause this effect to re-run.
  }, [wrapperRef]);

  // Captions don't start until the camera's arrival + subtitle story (see
  // SUBTITLE_STORY_END) is done, and finish exactly as the plunge begins
  // (PLUNGE_START) - re-based onto that range, same as orbitTarget's spinT
  // above, so the two hand off at the same instant.
  const captionProgress = clamp01(
    (orbitProgress - SUBTITLE_STORY_END) / (PLUNGE_START - SUBTITLE_STORY_END),
  );

  // The name title and captions otherwise just sit there, unchanged, for
  // the entire plunge - captionProgress clamps at 1 once PLUNGE_START is
  // passed and never fades further. Fully gone by 30% of the way through
  // the plunge (well before the close approach) rather than lingering the
  // whole way, so they don't compete with it.
  const plungeTextOpacity =
    1 - smoothstep(PLUNGE_START, lerp(PLUNGE_START, 1, 0.3), orbitProgress);

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

        {/* Scoped to this box, not the viewport - see the .blackout comment
            in Universe.module.css for why it has to live here rather than
            as a separate fixed overlay. */}
        <div className={styles.blackout} aria-hidden="true" />
      </div>
    </div>
  );
}
