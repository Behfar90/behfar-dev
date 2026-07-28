import { useEffect, useRef } from 'react';
import styles from './Projects.module.css';

// Back-to-front stagger: each layer's assembly window starts at the midpoint
// of the previous layer's (50% overlap), so motion is continuous rather than
// sequential. Figure shares mid's window exactly so it arrives seated on it.
const ASSEMBLY_WINDOW = {
  ridge: [0, 0.4],
  trees: [0.2, 0.6],
  mid: [0.4, 0.8],
  figure: [0.4, 0.8],
  fore: [0.6, 1],
};

// How far below its resting position each layer starts, in vh - back layers
// travel least, foreground travels furthest.
const START_OFFSET_VH = {
  ridge: 40,
  trees: 60,
  mid: 85,
  figure: 85,
  fore: 110,
};

// Parallax drift (px) once assembly completes - slowest to fastest,
// figure matched to mid so it stays planted on it. Upward (negative).
const DRIFT_PX = {
  ridge: 30,
  trees: 70,
  mid: 130,
  figure: 130,
  fore: 190,
};

// Shifts the whole assembled scene down by this many vh once settled,
// leaving more black sky at the top of the viewport for the starfield/
// constellations planned for later. Applied uniformly to every layer
// (figure included) so their relative alignment to each other is
// untouched - only the entire scene's position on screen changes.
const RESTING_SHIFT_VH = 14;

const LAYER_NAMES = ['ridge', 'trees', 'mid', 'figure', 'fore'];

const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const cubicOut = (t) => 1 - (1 - t) ** 3;

export default function Projects() {
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

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      applyLayerPositions({ ridge: 0, trees: 0, mid: 0, figure: 0, fore: 0 });
      return undefined;
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
        scrollableHeight > 0
          ? clamp01((scrollState.y - wrapper.offsetTop) / scrollableHeight)
          : 0;

      const assemblyProgress = clamp01(overallProgress / 0.4);
      const parallaxProgress = clamp01((overallProgress - 0.4) / 0.6);
      const vh = window.innerHeight / 100;

      const values = {};
      LAYER_NAMES.forEach((name) => {
        const [start, end] = ASSEMBLY_WINDOW[name];
        const localProgress = cubicOut(clamp01((assemblyProgress - start) / (end - start)));
        const assemblyY = START_OFFSET_VH[name] * vh * (1 - localProgress);
        const drift = -DRIFT_PX[name] * parallaxProgress;
        const restingShift = RESTING_SHIFT_VH * vh * localProgress;
        values[name] = assemblyY + drift + restingShift;
      });

      applyLayerPositions(values);
      animFrame = window.requestAnimationFrame(tick);
    };
    animFrame = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <div className={styles.sticky}>
        <h2 className={styles.heading}>More to come</h2>

        <img
          src="/terrain-1-ridge.svg"
          alt=""
          className={`${styles.layer} ${styles.ridge}`}
        />
        <img
          src="/terrain-2-trees.svg"
          alt=""
          className={`${styles.layer} ${styles.trees}`}
        />
        <img
          src="/terrain-3-mid.svg"
          alt=""
          className={`${styles.layer} ${styles.mid}`}
        />
        <img
          src="/man_with_telescope.png"
          alt="Silhouette of a person looking through a telescope at the night sky"
          className={styles.figure}
        />
        <img
          src="/terrain-4-fore.svg"
          alt=""
          className={`${styles.layer} ${styles.foreground}`}
        />
      </div>
    </div>
  );
}
