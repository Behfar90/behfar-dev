import { CircleX } from 'lucide-react';
import styles from './ProjectLens.module.css';

// Static shell only for now (step 2 of the build) - no open/close state, no
// animation, no click wiring yet. Renders whenever a `project` is passed in,
// purely so the visual design (frame, reticle, porthole content, sizing
// across viewport shapes) can be checked and tuned before any interactivity
// exists. `onClose` is wired to the close button/backdrop/Esc already since
// those are cheap now and won't need touching again once real open/close
// state lands in a later step.
export default function ProjectLens({ project, onClose }) {
  if (!project) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
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
          <h2 className={styles.title}>{project.title}</h2>
          <p className={styles.summary}>{project.summary}</p>
          <p className={styles.description}>{project.description}</p>
          {project.tags.length > 0 && (
            <ul className={styles.tags}>
              {project.tags.map((tag) => (
                <li key={tag} className={styles.tag}>
                  {tag}
                </li>
              ))}
            </ul>
          )}
          {project.links.length > 0 && (
            <div className={styles.links}>
              {project.links.map((link) => (
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
