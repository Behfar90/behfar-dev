import ConstellationGlyph from './ConstellationGlyph';
import { CONSTELLATIONS } from '../utils/scenes/constellations';
import styles from './Constellations.module.css';

export default function Constellations({ onSelect }) {
  const select = (event, id) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onSelect(
      id,
      { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
      event.currentTarget,
    );
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
