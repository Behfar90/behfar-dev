import { useEffect, useRef } from 'react';

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

const SCENE_SCALE_REFERENCE_WIDTH = 1512;
const SCENE_SCALE_REFERENCE_HEIGHT = 900;
const MIN_SCENE_SCALE = 0.55;
const PORTRAIT_SCENE_SCALE_REFERENCE_WIDTH = 950;

const computeSceneScale = () => {
  if (window.innerWidth < window.innerHeight) {
    return Math.min(1, Math.max(MIN_SCENE_SCALE, window.innerWidth / PORTRAIT_SCENE_SCALE_REFERENCE_WIDTH));
  }
  return Math.max(
    MIN_SCENE_SCALE,
    Math.min(
      window.innerWidth / SCENE_SCALE_REFERENCE_WIDTH,
      window.innerHeight / SCENE_SCALE_REFERENCE_HEIGHT,
    ),
  );
};

const computeGroundScale = () =>
  Math.max(
    window.innerWidth / SCENE_SCALE_REFERENCE_WIDTH,
    window.innerHeight / SCENE_SCALE_REFERENCE_HEIGHT,
  );

export default function useProjectsSceneAnimation() {
  const wrapperRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return undefined;

    const applyLayerPositions = (values) => {
      LAYER_NAMES.forEach((name) => {
        wrapper.style.setProperty(`--ns-${name}-y`, `${values[name]}px`);
      });
    };

    const applySceneScale = () => {
      wrapper.style.setProperty('--scene-scale', computeSceneScale());
      wrapper.style.setProperty('--ground-scale', computeGroundScale());
    };
    applySceneScale();
    window.addEventListener('resize', applySceneScale, { passive: true });

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
      return () => window.removeEventListener('resize', applySceneScale);
    }

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
      window.removeEventListener('resize', applySceneScale);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  return wrapperRef;
}
