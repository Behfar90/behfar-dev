import { useMemo, useState } from 'react';
import { randomTwinkleTiming } from '../utils/components/twinkle';
import { CONSTELLATIONS } from '../utils/scenes/constellations';
import styles from './Constellations.module.css';

// Desktop reveal is pure CSS (:hover), so only the tap/click "pin" needs
// React state - that's what makes the label stick open on touch devices,
// which have no hover state to fall back on. Clicking a different
// constellation swaps which one is pinned; clicking the same one closes it.
export default function Constellations() {
  const [activeId, setActiveId] = useState(null);

  // Per-star twinkle timing, same idea as BackgroundStars' randomized
  // delay/duration - computed once (not inline per render) so hovering one
  // constellation doesn't re-roll and visibly reset every star's animation.
  const twinkleTimings = useMemo(
    () =>
      CONSTELLATIONS.map((c) =>
        c.stars.map(() => randomTwinkleTiming({ delayMax: 5, durationMin: 3, durationRange: 3 })),
      ),
    [],
  );

  const toggle = (id) => {
    setActiveId((current) => (current === id ? null : id));
  };

  const handleKeyDown = (event, id) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle(id);
    }
  };

  return (
    <>
      {CONSTELLATIONS.map((c, ci) => {
        const isActive = activeId === c.id;
        // Padded bounding box around the stars, rendered as an invisible hit
        // area - without it, hover/click only fires directly over a 3px-radius
        // star or a hairline-thin connecting line, which is unusably fiddly.
        const xs = c.stars.map((s) => s.x);
        const ys = c.stars.map((s) => s.y);
        const pad = 12;
        const hitBox = {
          x: Math.min(...xs) - pad,
          y: Math.min(...ys) - pad,
          width: Math.max(...xs) - Math.min(...xs) + pad * 2,
          height: Math.max(...ys) - Math.min(...ys) + pad * 2,
        };

        return (
          <svg
            key={c.id}
            className={styles.constellationRoot}
            viewBox={c.viewBox}
            style={{
              top: c.position.top,
              left: c.position.left,
              width: c.size.width,
              height: c.size.height,
              '--c-width': `${c.size.width}px`,
              '--c-height': `${c.size.height}px`,
              transform: `translateY(var(--ns-${c.id}-y, 0px))`,
            }}
          >
            <g
              className={`${styles.constellation}${isActive ? ` ${styles.active}` : ''}`}
              role="button"
              tabIndex={0}
              aria-label={c.name}
              aria-pressed={isActive}
              onClick={() => toggle(c.id)}
              onKeyDown={(event) => handleKeyDown(event, c.id)}
            >
              <rect
                x={hitBox.x}
                y={hitBox.y}
                width={hitBox.width}
                height={hitBox.height}
                className={styles.hitArea}
              />
              {c.lines.map(([a, b], i) => (
                <line
                  key={i}
                  x1={c.stars[a].x}
                  y1={c.stars[a].y}
                  x2={c.stars[b].x}
                  y2={c.stars[b].y}
                  className={styles.line}
                />
              ))}
              {c.stars.map((star, i) => {
                const { delay, duration } = twinkleTimings[ci][i];
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
              <text
                x={c.labelAnchor.x}
                y={c.labelAnchor.y}
                textAnchor="middle"
                className={styles.label}
              >
                {c.name}
              </text>
            </g>
          </svg>
        );
      })}
    </>
  );
}
