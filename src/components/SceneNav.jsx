import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import useScrollIdle from '../hooks/useScrollIdle';
import styles from './SceneNav.module.css';

const SECTIONS = [
  { key: 'universe', label: 'Universe' },
  { key: 'projects', label: 'Projects' },
  { key: 'contact', label: 'Contact Me' },
];

// Renders both the desktop button row and the mobile hamburger/dropdown at
// once - a CSS media query decides which is visible, so there's a single
// source of truth for the click handlers rather than duplicating them per
// breakpoint. `activeSection` drives the "you are here" styling in both.
// `visible` (default true, so the nav still works standalone without a
// parent wiring it up) fades the whole thing in rather than having it
// mounted, fully opaque, from the very first frame - App passes its
// `showOverlays` flag so the nav appears alongside the rest of Universe's
// reveal, once the stars/galaxies have actually had a moment to ignite.
export default function SceneNav({ activeSection, onNavigate, visible = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuButtonRef = useRef(null);
  // Desktop row only dims mid-scroll (not the mobile hamburger - see
  // .navContent's CSS) so it competes less with whatever's animating
  // underneath while the user is actively looking at scene content rather
  // than the nav.
  const { isIdle } = useScrollIdle(150);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (key) => {
    onNavigate(key);
    setIsOpen(false);
  };

  const items = (className) =>
    SECTIONS.map(({ key, label }) => (
      <button
        key={key}
        type="button"
        className={`${className}${key === activeSection ? ` ${styles['navItem--active']}` : ''}`}
        aria-current={key === activeSection ? 'page' : undefined}
        onClick={() => handleSelect(key)}
      >
        {label}
      </button>
    ));

  return (
    <nav
      className={`${styles.nav}${visible ? ` ${styles['nav--visible']}` : ''}`}
      aria-label="Scene navigation"
    >
      <div
        className={`${styles.navContent}${!isIdle ? ` ${styles['navContent--dimmed']}` : ''}`}
      >
        <div className={styles.row}>{items(styles.navItem)}</div>
      </div>

      <button
        ref={menuButtonRef}
        type="button"
        className={styles.menuButton}
        aria-expanded={isOpen}
        aria-controls="scene-nav-dropdown"
        aria-label={isOpen ? 'Close scene navigation' : 'Open scene navigation'}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? <X size={20} strokeWidth={1.75} /> : <Menu size={20} strokeWidth={1.75} />}
      </button>

      <div
        id="scene-nav-dropdown"
        className={`${styles.dropdown}${isOpen ? ` ${styles['dropdown--open']}` : ''}`}
      >
        {items(styles.dropdownItem)}
      </div>
    </nav>
  );
}
