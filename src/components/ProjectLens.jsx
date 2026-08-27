import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CircleX } from 'lucide-react';
import ConstellationGlyph from './ConstellationGlyph';
import { CONSTELLATIONS } from '../utils/scenes/constellations';
import styles from './ProjectLens.module.css';

const starsViewBox = (stars) => {
  const xs = stars.map((s) => s.x);
  const ys = stars.map((s) => s.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = maxX - minX;
  const height = maxY - minY;
  const padX = width * 0.18;
  const padY = height * 0.18;
  return `${minX - padX} ${minY - padY} ${width + padX * 2} ${height + padY * 2}`;
};

export default function ProjectLens({ project, origin, onClose, returnFocusRef }) {
  const [displayedProject, setDisplayedProject] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const lensRef = useRef(null);

  useEffect(() => {
    if (!project) {
      setIsOpen(false);
      return;
    }
    setDisplayedProject(project);
  }, [project]);

  useLayoutEffect(() => {
    if (isOpen) lensRef.current?.focus();
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!displayedProject || !lensRef.current) return;
    // eslint-disable-next-line no-unused-expressions -- reflow, not a no-op
    lensRef.current.offsetHeight;
    setIsOpen(true);
  }, [displayedProject]);

  useEffect(() => {
    if (!displayedProject) return undefined;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !lensRef.current) return;
      const focusable = lensRef.current.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [displayedProject, onClose]);

  if (!displayedProject) return null;

  const constellation = CONSTELLATIONS.find((c) => c.id === displayedProject.id);

  return (
    <div
      className={`${styles.overlay}${isOpen ? ` ${styles.open}` : ''}`}
      style={origin ? { '--origin-x': `${origin.x}px`, '--origin-y': `${origin.y}px` } : undefined}
      onClick={onClose}
      onTransitionEnd={(event) => {
        if (event.target !== event.currentTarget || isOpen) return;
        setDisplayedProject(null);
        returnFocusRef?.current?.focus();
      }}
    >
      <div
        ref={lensRef}
        className={styles.lens}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-lens-title"
        aria-describedby="project-lens-summary"
        tabIndex={-1}
      >
        <svg className={styles.reticle} viewBox="0 0 100 100" aria-hidden="true">
          <line x1="50" y1="4" x2="50" y2="14" />
          <line x1="50" y1="86" x2="50" y2="96" />
          <line x1="4" y1="50" x2="14" y2="50" />
          <line x1="86" y1="50" x2="96" y2="50" />
          <circle cx="50" cy="50" r="47" />
        </svg>

        {constellation && (
          <svg
            className={styles.constellationBackdrop}
            viewBox={starsViewBox(constellation.stars)}
            aria-hidden="true"
          >
            <ConstellationGlyph constellation={constellation} revealed showLines={false} />
          </svg>
        )}

        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
          <CircleX size={22} strokeWidth={1.5} />
        </button>

        <div className={styles.content}>
          <h2 id="project-lens-title" className={styles.title}>
            {displayedProject.title}
          </h2>
          <p id="project-lens-summary" className={styles.summary}>
            {displayedProject.summary}
          </p>
          <p className={styles.description}>{displayedProject.description}</p>
          {displayedProject.tags.length > 0 && (
            <ul className={styles.tags}>
              {displayedProject.tags.map((tag) => (
                <li key={tag} className={styles.tag}>
                  {tag}
                </li>
              ))}
            </ul>
          )}
          {displayedProject.links.length > 0 && (
            <div className={styles.links}>
              {displayedProject.links.map((link) => (
                <a key={link.url} href={link.url} className={styles.link}>
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
