import { useEffect, useRef, useState } from 'react';

// Owns every piece of scroll-derived state for the app - both which section
// is in view and, within the Universe section, exactly how far through its
// camera orbit the user has scrolled.
//
// There's no scroll-jacking at all: the page scrolls completely natively.
// `universeWrapperRef`/`projectsWrapperRef`/`contactWrapperRef` should each
// be attached to that scene's tall (multi-viewport) wrapper element; each
// one's inner content is pinned via plain CSS `position: sticky` for as long
// as its own wrapper is scrolling through view, then unpins itself and
// scrolls away exactly like any other element - the browser handles that
// transition, not this hook.
//
// `orbitProgress` (0 to 1) is just "how far scrolled through Universe's
// wrapper are we", recomputed on every scroll/resize. Universe turns that
// directly into camera rotation, so scrolling up naturally winds the camera
// back the way it came, all the way to its start.
//
// `activeSection` ('universe' | 'projects' | 'contact') is which scene
// currently contains the viewport's vertical center - used for both the nav
// menu's "you are here" indicator and as the target of nav-driven scroll
// jumps (see useSceneTransition). Keyed off the viewport's center rather
// than its top edge so the nav doesn't flip the instant a sliver of the
// next section peeks into view at the very bottom of the screen.
export default function useScrollJourney() {
  const universeWrapperRef = useRef(null);
  const projectsWrapperRef = useRef(null);
  const contactWrapperRef = useRef(null);
  const [orbitProgress, setOrbitProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('universe');

  useEffect(() => {
    const updateProgress = () => {
      const wrapper = universeWrapperRef.current;
      if (wrapper) {
        const scrollableDistance = wrapper.offsetHeight - window.innerHeight;
        const progress =
          scrollableDistance > 0 ? (window.scrollY - wrapper.offsetTop) / scrollableDistance : 0;
        setOrbitProgress(Math.min(Math.max(progress, 0), 1));
      }

      const projectsTop = projectsWrapperRef.current?.offsetTop ?? Infinity;
      const contactTop = contactWrapperRef.current?.offsetTop ?? Infinity;
      const viewportCenter = window.scrollY + window.innerHeight / 2;
      setActiveSection(
        viewportCenter < projectsTop ? 'universe' : viewportCenter < contactTop ? 'projects' : 'contact',
      );
    };

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  return {
    universeWrapperRef,
    projectsWrapperRef,
    contactWrapperRef,
    orbitProgress,
    activeSection,
  };
}
