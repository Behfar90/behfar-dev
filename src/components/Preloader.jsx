import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import styles from './Preloader.module.css';

const RING_DURATION_MS = 1700;
const HOLD_MS = 250;
export const REVEAL_MS = 1100;
const REDUCED_HOLD_MS = 250;
const REDUCED_FADE_MS = 400;

const COMET_COUNT = 3;
const EMBER_INTERVAL_MS = 16;
const RING_RADIUS_RATIO = 0.11;
const TAIL_LENGTH_RAD = 0.09;
const TAIL_STEPS = 10;
const EXPLODE_TAIL_LENGTH_PX = 20;
const ROCKET_SIZE_PX = 20;

const GOLD_RGB = '238, 186, 123';
const GOLD_HEX = '#eeba7b';

const ROCKET_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ` +
  `fill="none" stroke="${GOLD_HEX}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
  `<path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>` +
  `<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09"/>` +
  `<path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z"/>` +
  `<path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05"/>` +
  `</svg>`;
const ROCKET_DATA_URI = `data:image/svg+xml,${encodeURIComponent(ROCKET_SVG)}`;

const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const ringRadiusFor = (ratio) => Math.min(window.innerWidth, window.innerHeight) * ratio;

export default function Preloader({ onComplete, onReveal }) {
  const [reducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [phase, setPhase] = useState('active');
  const canvasRef = useRef(null);
  const irisRef = useRef(null);
  const onRevealRef = useRef(onReveal);

  useEffect(() => {
    onRevealRef.current = onReveal;
  }, [onReveal]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (!reducedMotion) return undefined;
    const timer = setTimeout(() => {
      onRevealRef.current?.();
      setPhase('opening');
    }, REDUCED_HOLD_MS);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  useEffect(() => {
    if (!reducedMotion || phase !== 'opening') return undefined;
    const timer = setTimeout(onComplete, REDUCED_FADE_MS);
    return () => clearTimeout(timer);
  }, [reducedMotion, phase, onComplete]);

  useLayoutEffect(() => {
    if (reducedMotion || phase !== 'active') return undefined;
    const iris = irisRef.current;
    if (!iris) return undefined;

    const applyPeepholeSize = () => {
      iris.style.setProperty('--iris-size', `${ringRadiusFor(RING_RADIUS_RATIO) * 2}px`);
    };
    applyPeepholeSize();
    window.addEventListener('resize', applyPeepholeSize);
    return () => window.removeEventListener('resize', applyPeepholeSize);
  }, [reducedMotion, phase]);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const embers = [];
    const lastEmberAt = new Array(COMET_COUNT).fill(-Infinity);
    const startTime = performance.now();
    let ringDoneAt = null;
    let explodeStartAt = null;
    let animFrame;

    const rocketImg = new Image();
    rocketImg.src = ROCKET_DATA_URI;

    const drawRocket = (x, y, dirAngle, alpha) => {
      if (!rocketImg.complete || rocketImg.naturalWidth === 0) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(dirAngle + Math.PI / 4);
      ctx.globalAlpha = alpha;
      ctx.drawImage(rocketImg, -ROCKET_SIZE_PX / 2, -ROCKET_SIZE_PX / 2, ROCKET_SIZE_PX, ROCKET_SIZE_PX);
      ctx.restore();
    };

    const tick = (now) => {
      const t = now - startTime;
      const p = clamp01(t / RING_DURATION_MS);
      const cx = width / 2;
      const cy = height / 2;
      const ringR = Math.min(width, height) * RING_RADIUS_RATIO;

      ctx.clearRect(0, 0, width, height);

      if (explodeStartAt === null) {
        for (let i = 0; i < COMET_COUNT; i++) {
          const offset = (i / COMET_COUNT) * Math.PI * 2;
          const angle = -Math.PI / 2 + p * Math.PI * 2 + offset;

          if (p < 1 && t - lastEmberAt[i] >= EMBER_INTERVAL_MS) {
            embers.push({ angle, bornAt: t });
            lastEmberAt[i] = t;
          }

          for (let s = 0; s < TAIL_STEPS; s++) {
            const a = angle - (s / TAIL_STEPS) * TAIL_LENGTH_RAD;
            const alpha = (1 - s / TAIL_STEPS) * 0.5;
            const x = cx + Math.cos(a) * ringR;
            const y = cy + Math.sin(a) * ringR;
            ctx.beginPath();
            ctx.arc(x, y, 1.6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${GOLD_RGB}, ${alpha})`;
            ctx.fill();
          }

          const hx = cx + Math.cos(angle) * ringR;
          const hy = cy + Math.sin(angle) * ringR;
          drawRocket(hx, hy, angle + Math.PI / 2, 1);
        }

        embers.forEach((ember) => {
          const age = t - ember.bornAt;
          const fadeIn = clamp01(age / 120);
          const twinkle = 0.75 + 0.25 * Math.sin(age * 0.006 + ember.angle * 5);
          const x = cx + Math.cos(ember.angle) * ringR;
          const y = cy + Math.sin(ember.angle) * ringR;
          ctx.beginPath();
          ctx.arc(x, y, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 244, 214, ${fadeIn * twinkle})`;
          ctx.fill();
        });

        if (p >= 1) {
          if (ringDoneAt === null) ringDoneAt = t;
          if (t - ringDoneAt >= HOLD_MS) {
            explodeStartAt = t;
            onRevealRef.current?.();
            setPhase('opening');
          }
        }
      } else {
        const explodeT = clamp01((t - explodeStartAt) / REVEAL_MS);
        const eased = 1 - (1 - explodeT) ** 3;
        const maxR = Math.hypot(width, height) / 2 + 80;
        const radius = ringR + eased * (maxR - ringR);
        const fadeAlpha = explodeT < 0.5 ? 1 : 1 - (explodeT - 0.5) / 0.5;
        const tailLength = EXPLODE_TAIL_LENGTH_PX * (1 + eased * 3);

        for (let i = 0; i < COMET_COUNT; i++) {
          const offset = (i / COMET_COUNT) * Math.PI * 2;
          const angle = -Math.PI / 2 + offset;

          for (let s = 0; s < TAIL_STEPS; s++) {
            const tailR = radius - (s / TAIL_STEPS) * tailLength;
            const alpha = (1 - s / TAIL_STEPS) * 0.5 * fadeAlpha;
            const x = cx + Math.cos(angle) * tailR;
            const y = cy + Math.sin(angle) * tailR;
            ctx.beginPath();
            ctx.arc(x, y, 1.6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${GOLD_RGB}, ${alpha})`;
            ctx.fill();
          }

          const hx = cx + Math.cos(angle) * radius;
          const hy = cy + Math.sin(angle) * radius;
          drawRocket(hx, hy, angle, fadeAlpha);
        }

        embers.forEach((ember) => {
          const twinkle = 0.75 + 0.25 * Math.sin(t * 0.006 + ember.angle * 5);
          const x = cx + Math.cos(ember.angle) * radius;
          const y = cy + Math.sin(ember.angle) * radius;
          ctx.beginPath();
          ctx.arc(x, y, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 244, 214, ${twinkle * fadeAlpha})`;
          ctx.fill();
        });

        if (explodeT >= 1) return;
      }

      animFrame = requestAnimationFrame(tick);
    };
    animFrame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrame);
    };
  }, [reducedMotion]);

  useLayoutEffect(() => {
    if (reducedMotion || phase !== 'opening') return undefined;
    const iris = irisRef.current;
    if (!iris) return undefined;
    // eslint-disable-next-line no-unused-expressions
    iris.offsetHeight;
    iris.classList.add(styles.irisOpen);

    const timer = setTimeout(onComplete, REVEAL_MS);
    return () => clearTimeout(timer);
  }, [reducedMotion, phase, onComplete]);

  if (reducedMotion) {
    return (
      <div
        className={`${styles.wrapper} ${styles.solid} ${phase === 'opening' ? styles.fadeOut : ''}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className={styles.wrapper} aria-hidden="true">
      <div ref={irisRef} className={styles.iris} />
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
