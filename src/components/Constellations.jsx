import ConstellationGlyph from './ConstellationGlyph';
import { CONSTELLATIONS } from '../utils/scenes/constellations';
import styles from './Constellations.module.css';

// Desktop reveal (line/star glow + label) is pure CSS (:hover /
// :focus-visible), so this component carries no state of its own - a click
// or Enter/Space doesn't toggle anything here, it opens that constellation's
// project in ProjectLens, whose open/closed state lives in Projects.jsx
// (which needs to know regardless of which constellation triggered it, to
// dim the whole scene, not just this one).
export default function Constellations({ onSelect }) {
  // Origin point (viewport coords, from the focused/clicked <g> itself -
  // works the same for a mouse click and a keyboard Enter/Space) for
  // ProjectLens's iris animation: it grows from wherever this constellation
  // actually is on screen, not a fixed/centered point. The <g> itself is
  // also passed through so ProjectLens can return focus to it on close -
  // relying on document.activeElement there instead would be unreliable,
  // since not every browser focuses a non-form element on click by default.
  const select = (event, id) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onSelect(id, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }, event.currentTarget);
  };

  const handleKeyDown = (event, id) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      select(event, id);
    }
  };

  return (
    <>
      {CONSTELLATIONS.map((c) => {
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
              '--c-width': `${c.size.width}px`,
              '--c-height': `${c.size.height}px`,
              transform: `translateY(var(--ns-${c.id}-y, 0px))`,
            }}
          >
            <g
              className={styles.constellation}
              role="button"
              tabIndex={0}
              aria-label={c.name}
              onClick={(event) => select(event, c.id)}
              onKeyDown={(event) => handleKeyDown(event, c.id)}
            >
              {/* Tilt (Orion's `rotation`) is a CSS class, not a computed
                  SVG transform attribute - scoped to this inner group so
                  the hover label stays upright while everything else
                  tilts. See .tilt's `transform-box: view-box` in the CSS
                  module for how it rotates around the viewBox center
                  despite the mythIllustration image extending well beyond
                  the viewBox's own bounds. ConstellationGlyph applies this
                  same tilt to its own lines/stars independently, since it
                  isn't nested inside this group. */}
              <g className={c.rotation ? styles.tilt : undefined}>
                <rect
                  x={hitBox.x}
                  y={hitBox.y}
                  width={hitBox.width}
                  height={hitBox.height}
                  className={styles.hitArea}
                />
                {c.mythIllustration && (
                  <image
                    href={c.mythIllustration.url}
                    x={c.mythIllustration.x}
                    y={c.mythIllustration.y}
                    width={c.mythIllustration.width}
                    height={c.mythIllustration.height}
                    className={styles.mythImage}
                  />
                )}
              </g>
              <ConstellationGlyph constellation={c} />
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
