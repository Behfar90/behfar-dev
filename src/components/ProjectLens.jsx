import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CircleX } from 'lucide-react';
import styles from './ProjectLens.module.css';

// `project` is the source of truth for *which* project is open (or null for
// closed), owned by Projects.jsx. `displayedProject` mirrors it but doesn't
// clear immediately on close - it holds the last project's content through
// the fade-out transition (see onTransitionEnd below) so the lens doesn't
// just vanish mid-fade with blank content. `origin` (viewport coords of the
// clicked/focused constellation) drives the iris animation - see .lens's
// transform in the CSS module - growing the lens from that point and
// shrinking back to it on close, rather than a flat crossfade.
export default function ProjectLens({ project, origin, onClose, returnFocusRef }) {
  const [displayedProject, setDisplayedProject] = useState(null);
  // Separate from `Boolean(project)` on purpose: the overlay <div> fully
  // unmounts on close (see the early return below), so every open re-inserts
  // a brand new DOM node. If `.open` were applied in the very same render
  // that inserts it, the browser would never register a "before" state for
  // the transition to animate from, and it'd just snap straight to open.
  const [isOpen, setIsOpen] = useState(false);
  const lensRef = useRef(null);

  useEffect(() => {
    if (!project) {
      setIsOpen(false);
      return;
    }
    setDisplayedProject(project);
  }, [project]);

  // Moves focus into the dialog as soon as it opens (WAI-ARIA modal
  // practice - a keyboard/screen-reader user shouldn't be left focused on
  // the now-inert constellation behind it), and back to whichever
  // constellation triggered it once the closing animation actually
  // finishes (see onTransitionEnd below) - not at click-time, since that's
  // also what keeps that constellation's own hover/focus-visible label from
  // flashing back on mid-shrink, while the lens still visually covers it.
  useLayoutEffect(() => {
    if (isOpen) lensRef.current?.focus();
  }, [isOpen]);

  // Flips isOpen right after the closed-state DOM actually commits, forcing
  // a synchronous reflow first (reading offsetHeight) so the browser has to
  // resolve styles for that closed state before the very next line changes
  // them - the standard way to guarantee a transition actually plays on a
  // freshly-inserted element. Deliberately NOT requestAnimationFrame-based:
  // this page keeps several other animations running continuously (the
  // twinkling stars, the moon), and under load a couple of rAF callbacks can
  // land 100ms+ apart, making the "grow" visibly stall before it starts.
  // useLayoutEffect + forced reflow is synchronous, so it doesn't depend on
  // frame timing at all.
  useLayoutEffect(() => {
    if (!displayedProject || !lensRef.current) return;
    // eslint-disable-next-line no-unused-expressions -- reflow, not a no-op
    lensRef.current.offsetHeight;
    setIsOpen(true);
  }, [displayedProject]);

  // Scroll lock + Esc-to-close + Tab focus-trap are active for the lens's
  // full visible lifetime, including the closing fade (tied to
  // displayedProject, not isOpen) - otherwise the background could start
  // scrolling out (or receive focus) from under a still-fading-out lens.
  // Overflow restores to '' rather than a captured "previous value" -
  // nothing else in this app sets body.style.overflow inline, and
  // capturing/restoring a snapshot is fragile here: onClose (or any other
  // dependency) getting a new reference between renders would re-run this
  // effect and re-capture 'hidden' as the "previous" value mid-lock,
  // permanently stomping the real original value.
  useEffect(() => {
    if (!displayedProject) return undefined;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !lensRef.current) return;
      // Manual focus trap: the lens is the only "island" of focusable
      // content while open (everything behind it is inert - see
      // Projects.jsx), so Tab/Shift+Tab should cycle within it rather than
      // running off into the browser chrome once past the last/first
      // focusable descendant.
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
