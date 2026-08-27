import { useMemo } from 'react';
import { randomTwinkleTiming } from '../utils/components/twinkle';
import styles from './Constellations.module.css';

export default function ConstellationGlyph({ constellation, revealed = false, showLines = true }) {
  const twinkleTimings = useMemo(
    () =>
      constellation.stars.map(() =>
        randomTwinkleTiming({ delayMax: 5, durationMin: 3, durationRange: 3 }),
      ),
    [constellation],
  );

  const groupClassName =
    `${constellation.rotation ? styles.tilt : ''}${revealed ? ` ${styles.revealed}` : ''}`.trim() ||
    undefined;

  return (
    <g className={groupClassName}>
      {showLines &&
        constellation.lines.map(([a, b], i) => (
          <line
            key={i}
            x1={constellation.stars[a].x}
            y1={constellation.stars[a].y}
            x2={constellation.stars[b].x}
            y2={constellation.stars[b].y}
            className={styles.line}
          />
        ))}
      {constellation.stars.map((star, i) => {
        const { delay, duration } = twinkleTimings[i];
        return (
          <circle
            key={i}
            cx={star.x}
            cy={star.y}
            r={2}
            className={styles.star}
            style={{ animationDelay: `${delay}s`, animationDuration: `${duration}s` }}
          />
        );
      })}
    </g>
  );
}
