import { useMemo } from 'react';
import { randomTwinkleTiming } from '../utils/components/twinkle';
import styles from './Constellations.module.css';

// The star pattern only - lines + twinkling stars, no mythIllustration, no
// hit area, no label - shared between Constellations.jsx (interactive,
// hover-revealed, positioned in the sky) and ProjectLens (static, always
// revealed, as a background inside the lens). Renders a bare <g>, not its
// own <svg>/viewBox, so the caller controls the surrounding coordinate
// space - Constellations.jsx embeds it directly inside its existing
// per-constellation <svg viewBox>, ProjectLens wraps it in its own.
//
// Imports Constellations.module.css directly (not its own CSS module) so
// .line/.star/.tilt/.revealed here are the exact same classes/animations
// Constellations.jsx's hover states already target - a separate module
// would hash to different class names and silently stop matching those
// selectors.
export default function ConstellationGlyph({ constellation, revealed = false, showLines = true }) {
  // Computed fresh per mount (not shared with Constellations.jsx's own sky
  // instance) - purely cosmetic per-star animation offset, doesn't need to
  // match between the two views.
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
