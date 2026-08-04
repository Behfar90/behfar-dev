import { useEffect, useRef } from 'react';

// Back-to-front stagger: each layer's assembly window starts at the midpoint
// of the previous layer's (50% overlap), so motion is continuous rather than
// sequential. Figure shares mid's window exactly so it arrives seated on it.
//
// The sky elements (constellations + moon) all descend from above rather
// than rising from below, and arrive one by one rather than as a single
// block: cassiopeia/ursa-minor form an early pair, the moon has its own
// distinct window overlapping neither pair, then orion/scorpius/ursa-major
// form a later group - staggered the same way the terrain layers are,
// just on their own earlier schedule so the sky is mostly in place before
// the terrain finishes assembling.
const ASSEMBLY_WINDOW = {
  cassiopeia: [0, 0.35],
  'ursa-minor': [0.08, 0.43],
  moon: [0.3, 0.65],
  orion: [0.55, 0.9],
  scorpius: [0.63, 0.98],
  'ursa-major': [0.7, 1],
  ridge: [0, 0.4],
  trees: [0.2, 0.6],
  mid: [0.4, 0.8],
  figure: [0.4, 0.8],
  fore: [0.6, 1],
};

// How far below its resting position each layer starts, in vh - back layers
// travel least, foreground travels furthest. The sky elements are negative:
// they start *above* the viewport and ease down, the mirror image of every
// other layer here, using this same formula (see assemblyY in tick() below).
const START_OFFSET_VH = {
  cassiopeia: -50,
  'ursa-minor': -55,
  moon: -60,
  orion: -60,
  scorpius: -65,
  'ursa-major': -70,
  ridge: 40,
  trees: 60,
  mid: 85,
  figure: 85,
  fore: 110,
};

// Parallax drift (vh) once assembly completes - slowest to fastest,
// figure matched to mid so it stays planted on it. Upward (negative).
// In vh (not fixed px) so it scales with viewport height the same way
// START_OFFSET_VH/RESTING_SHIFT_VH do - a fixed-px drift gets dwarfed by
// RESTING_SHIFT_VH on tall viewports (e.g. ultrawide monitors), leaving
// the figure shifted far enough down to be clipped by .sticky's
// overflow:hidden.
const DRIFT_VH = {
  cassiopeia: 1.5,
  'ursa-minor': 1.8,
  moon: 2.5,
  orion: 2,
  scorpius: 2.2,
  'ursa-major': 1.7,
  ridge: 3.3,
  trees: 7.8,
  mid: 14.4,
  figure: 14.4,
  fore: 21.1,
};

// Shifts the terrain down by this many vh once settled, leaving more black
// sky at the top of the viewport - originally shared by every layer
// (figure included) so the whole terrain moves as one block, but the sky
// elements need 0 here: they're not part of that block, they're what the
// shift is making room *for*. Giving them the same 14vh pushed each one
// down by ~12vh net (14 minus their own small DRIFT_VH) for the entire
// stretch of scroll between finishing assembly and parallax drift kicking
// in past overall progress 0.4 - long enough to land Orion/Cassiopeia
// behind the terrain's horizon on real scroll positions, not just a
// theoretical edge case.
const RESTING_SHIFT_VH = {
  cassiopeia: 0,
  'ursa-minor': 0,
  moon: 0,
  orion: 0,
  scorpius: 0,
  'ursa-major': 0,
  ridge: 14,
  trees: 14,
  mid: 14,
  figure: 14,
  fore: 14,
};

const LAYER_NAMES = [
  'cassiopeia',
  'ursa-minor',
  'moon',
  'orion',
  'scorpius',
  'ursa-major',
  'ridge',
  'trees',
  'mid',
  'figure',
  'fore',
];

const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const cubicOut = (t) => 1 - (1 - t) ** 3;

// Constellation/moon sizes (Constellations.jsx's `size`, MoonPhase's `size`
// prop) are fixed CSS px, chosen against a ~1512x900 reference viewport.
// On a shorter or narrower one (a 13" laptop's shallower height, a phone's
// narrow width) those fixed sizes eat a bigger share of the sky and start
// crowding/overlapping/clipping. `--sky-scale` shrinks them continuously
// with whichever dimension is more constrained, rather than relying on
// enumerated breakpoints that can miss viewport combinations in between.
const SKY_SCALE_REFERENCE_WIDTH = 1512;
const SKY_SCALE_REFERENCE_HEIGHT = 900;
const MIN_SKY_SCALE = 0.55;

const computeSkyScale = () =>
  Math.min(
    1,
    Math.max(
      MIN_SKY_SCALE,
      Math.min(
        window.innerWidth / SKY_SCALE_REFERENCE_WIDTH,
        window.innerHeight / SKY_SCALE_REFERENCE_HEIGHT,
      ),
    ),
  );

// Drives the Projects scene's scroll-triggered layer assembly: every layer
// (terrain, figure, moon, constellations) eases in from off-screen, settles,
// then drifts at its own parallax speed, all from a single rAF loop writing
// --ns-{name}-y custom properties - not React state, so none of this causes
// a re-render on scroll. Returns the ref the caller attaches to the
// scrollable wrapper element the progress math is measured against.
export default function useProjectsSceneAnimation() {
  const wrapperRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return undefined;

    const root = document.documentElement;

    const applyLayerPositions = (values) => {
      LAYER_NAMES.forEach((name) => {
        root.style.setProperty(`--ns-${name}-y`, `${values[name]}px`);
      });
    };

    // Independent of the scroll-driven rAF loop below (and of the
    // prefers-reduced-motion branch, which returns before ever reaching
    // that loop) since it only needs to react to resize, not scroll.
    const applySkyScale = () => {
      root.style.setProperty('--sky-scale', computeSkyScale());
    };
    applySkyScale();
    window.addEventListener('resize', applySkyScale, { passive: true });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      applyLayerPositions({
        cassiopeia: 0,
        'ursa-minor': 0,
        moon: 0,
        orion: 0,
        scorpius: 0,
        'ursa-major': 0,
        ridge: 0,
        trees: 0,
        mid: 0,
        figure: 0,
        fore: 0,
      });
      return () => window.removeEventListener('resize', applySkyScale);
    }

    // Scroll listener only stores the raw value - every read (bounding
    // rect, viewport height) and every write (CSS custom properties)
    // happens inside the single rAF loop below.
    const scrollState = { y: window.scrollY };
    const handleScroll = () => {
      scrollState.y = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    let animFrame;
    const tick = () => {
      const scrollableHeight = wrapper.offsetHeight - window.innerHeight;
      const overallProgress =
        scrollableHeight > 0 ? clamp01((scrollState.y - wrapper.offsetTop) / scrollableHeight) : 0;

      const assemblyProgress = clamp01(overallProgress / 0.4);
      const parallaxProgress = clamp01((overallProgress - 0.4) / 0.6);
      const vh = window.innerHeight / 100;

      const values = {};
      LAYER_NAMES.forEach((name) => {
        const [start, end] = ASSEMBLY_WINDOW[name];
        const localProgress = cubicOut(clamp01((assemblyProgress - start) / (end - start)));
        const assemblyY = START_OFFSET_VH[name] * vh * (1 - localProgress);
        const drift = -DRIFT_VH[name] * vh * parallaxProgress;
        const restingShift = RESTING_SHIFT_VH[name] * vh * localProgress;
        values[name] = assemblyY + drift + restingShift;
      });

      applyLayerPositions(values);
      animFrame = window.requestAnimationFrame(tick);
    };
    animFrame = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', applySkyScale);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  return wrapperRef;
}
