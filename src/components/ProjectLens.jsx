import { useEffect, useState } from 'react';
import { CircleX } from 'lucide-react';
import styles from './ProjectLens.module.css';

// `project` is the source of truth for *which* project is open (or null for
// closed), owned by Projects.jsx. `displayedProject` mirrors it but doesn't
// clear immediately on close - it holds the last project's content through
// the fade-out transition (see onTransitionEnd below) so the lens doesn't
// just vanish mid-fade with blank content. Plain opacity fade for now (step
// 3 of the build) - the iris-from-click-point animation replaces this in
// the next step.
export default function ProjectLens({ project, onClose }) {
  const [displayedProject, setDisplayedProject] = useState(project);
  const isOpen = Boolean(project);

  useEffect(() => {
    if (project) setDisplayedProject(project);
  }, [project]);

  // Scroll lock + Esc-to-close are active for the lens's full visible
  // lifetime, including the closing fade (tied to displayedProject, not
  // isOpen) - otherwise the background could start scrolling out from under
  // a still-fading-out lens.
  useEffect(() => {
    if (!displayedProject) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [displayedProject, onClose]);

  if (!displayedProject) return null;

  return (
    <div
      className={`${styles.overlay}${isOpen ? ` ${styles.open}` : ''}`}
      onClick={onClose}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && !isOpen) setDisplayedProject(null);
      }}
    >
      <div className={styles.lens} onClick={(event) => event.stopPropagation()}>
        <svg className={styles.reticle} viewBox="0 0 100 100" aria-hidden="true">
          <line x1="50" y1="4" x2="50" y2="14" />
          <line x1="50" y1="86" x2="50" y2="96" />
          <line x1="4" y1="50" x2="14" y2="50" />
          <line x1="86" y1="50" x2="96" y2="50" />
          <circle cx="50" cy="50" r="47" />
        </svg>

        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
          <CircleX size={22} strokeWidth={1.5} />
        </button>

        <div className={styles.content}>
          <h2 className={styles.title}>{displayedProject.title}</h2>
          <p className={styles.summary}>{displayedProject.summary}</p>
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
