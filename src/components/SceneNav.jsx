import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import useScrollIdle from '../hooks/useScrollIdle';
import styles from './SceneNav.module.css';

const SECTIONS = [
  { key: 'universe', label: 'My Universe' },
  { key: 'projects', label: 'Projects' },
  { key: 'contact', label: 'Contact Me' },
];

export default function SceneNav({ activeSection, onNavigate, visible = true }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuButtonRef = useRef(null);
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
