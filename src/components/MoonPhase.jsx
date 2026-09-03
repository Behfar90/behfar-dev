import React, { useId } from 'react';
import styles from './MoonPhase.module.css';

export default function MoonPhase({ phase = 0.5, size = 150, className, moonRef }) {
  const id = useId();
  const noiseId = `${id}-noise`;
  const shadowId = `${id}-shadow`;
  const blurId = `${id}-blur`;
  const maskId = `${id}-mask`;

  let maskContent = null;
  let scaleX = 1;

  if (phase === 0.5) {
    maskContent = <rect x="-6" y="-6" width="12" height="12" fill="white" />;
  } else if (phase <= 0.25 || phase >= 0.75) {
    const phasex = phase <= 0.25 ? phase : 1 - phase;
    const cx = (18 * phasex) / (1.01 - 4 * phasex);
    const r = cx + 6 / (Math.pow(cx, 1.25) / 6 + 1.2);
    scaleX = phase <= 0.25 ? -1 : 1;

    maskContent = (
      <>
        <rect x="-6" y="-6" width="12" height="12" fill="white" />
        <circle cx={cx} cy="0" r={r} fill="black" filter={`url(#${blurId})`} />
      </>
    );
  } else {
    const phasex = phase <= 0.5 ? 0.5 - phase : phase - 0.5;
    const cx = (18 * phasex) / (1.01 - 4 * phasex);
    const r = cx + 6 / (Math.pow(cx, 1.25) / 6 + 1);
    scaleX = phase > 0.5 ? -1 : 1;

    maskContent = (
      <>
        <circle cx="0" cy="0" r="5" fill="black" />
        <circle cx={cx} cy="0" r={r} fill="white" filter={`url(#${blurId})`} />
      </>
    );
  }

  return (
    <svg
      ref={moonRef}
      viewBox="-6 -6 12 12"
      className={`${styles.moon}${className ? ` ${className}` : ''}`}
      style={{ '--moon-size': typeof size === 'number' ? `${size}px` : size }}
    >
      <defs>
        <filter id={blurId}>
          <feGaussianBlur stdDeviation="0.3" />
        </filter>

        <filter id={shadowId}>
          <feOffset dx="0" dy="0" />
          <feGaussianBlur stdDeviation="1" result="offset-blur" />
          <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
          <feFlood floodColor="#4b617d" floodOpacity="1" result="color" />
          <feComposite operator="in" in="color" in2="inverse" result="shadow" />
          <feComposite operator="over" in="shadow" in2="SourceGraphic" />
        </filter>

        <filter id={noiseId} x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="5" result="noise" />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0 0 0 0 1   0 0 0 0 1   0 0 0 0 1   0.1 0.1 0.1 1 0"
            result="coloredNoise"
          />
          <feComposite in="SourceGraphic" in2="coloredNoise" operator="in" result="maskedNoise" />
          <feBlend in="maskedNoise" in2="SourceGraphic" mode="multiply" />
        </filter>

        <mask id={maskId}>{maskContent}</mask>
      </defs>

      <g mask={`url(#${maskId})`} filter={`url(#${shadowId})`} transform={`scale(${scaleX}, 1)`}>
        <circle r="5" fill="currentColor" filter={`url(#${noiseId})`} />
      </g>
    </svg>
  );
}
