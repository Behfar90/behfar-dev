import { useEffect, useRef } from 'react';
import { randomTwinkleTiming } from '../utils/components/twinkle';
import styles from './BackgroundStars.module.css';

const COUNT = 250;

// Adapted from a reference implementation that drove this off a Lenis
// smooth-scroll instance's `scroll` event (which hands you {scroll,
// velocity} directly). This project doesn't use Lenis - only Projects.jsx's
// own rAF loop over raw `window.scrollY` - so velocity here is derived by
// hand from consecutive scrollY reads, normalized to "px per ~16.7ms frame"
// to land in the same ballpark Lenis's velocity would report.
export default function BackgroundStars() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const stars = [];
    for (let i = 0; i < COUNT; i++) {
      const el = document.createElement('div');
      el.className = styles.star;

      const x = Math.random() * 100;
      const y = Math.random() * 100;

      // 30% chance to be a completely static, distant star.
      const isStatic = Math.random() < 0.3;
      const depth = isStatic ? 0 : 0.2 + Math.random() * 0.6;
      const size = isStatic ? 1 + Math.random() : 1 + Math.random() * 2;

      const { delay, duration } = randomTwinkleTiming({
        delayMax: 5,
        durationMin: 2,
        durationRange: 4,
      });

      el.style.left = `${x}%`;
      el.style.top = `${y}%`;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.setProperty('--duration', `${duration}s`);
      el.style.animationDelay = `${delay}s`;

      container.appendChild(el);
      stars.push({ el, initialY: y, depth });
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return () => {
        container.innerHTML = '';
      };
    }

    let lastScrollY = window.scrollY;
    let lastTime = performance.now();
    let animFrame;

    const tick = (time) => {
      const scrollY = window.scrollY;
      const dt = Math.max(time - lastTime, 1);
      const velocity = ((scrollY - lastScrollY) / dt) * (1000 / 60);
      lastScrollY = scrollY;
      lastTime = time;

      const stretch = Math.max(1, Math.min(1 + Math.abs(velocity) * 0.15, 4));

      stars.forEach((star) => {
        if (star.depth === 0) return;

        let pos = (star.initialY - scrollY * star.depth * 0.05) % 100;
        if (pos < 0) pos += 100;

        star.el.style.top = `${pos}%`;
        star.el.style.transform = `scaleY(${stretch})`;
      });

      animFrame = window.requestAnimationFrame(tick);
    };
    animFrame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animFrame);
      container.innerHTML = '';
    };
  }, []);

  return <div ref={containerRef} className={styles.container} aria-hidden="true" />;
}
