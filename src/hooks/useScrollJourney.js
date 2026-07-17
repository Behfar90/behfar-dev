import { useEffect, useRef, useState } from 'react';

// Owns every piece of scroll-derived state for the app - both which section
// is in view and, within the Intro section, exactly how far through its
// camera orbit the user has scrolled.
//
// There's no scroll-jacking at all: the page scrolls completely natively.
// `introWrapperRef` should be attached to Intro's tall (multi-viewport)
// wrapper element; its inner content is pinned via plain CSS
// `position: sticky` for as long as that wrapper is scrolling through view,
// then unpins itself and scrolls away exactly like any other element - the
// browser handles that transition, not this hook.
//
// `orbitProgress` (0 to 1) is just "how far scrolled through that wrapper
// are we", recomputed on every scroll/resize. Intro turns that directly into
// camera rotation, so scrolling up naturally winds the camera back the way
// it came, all the way to its start.
export default function useScrollJourney() {
  const introWrapperRef = useRef(null);
  const [orbitProgress, setOrbitProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const wrapper = introWrapperRef.current;
      if (!wrapper) return;

      const scrollableDistance = wrapper.offsetHeight - window.innerHeight;
      const progress =
        scrollableDistance > 0 ? (window.scrollY - wrapper.offsetTop) / scrollableDistance : 0;

      setOrbitProgress(Math.min(Math.max(progress, 0), 1));
    };

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  return { introWrapperRef, orbitProgress };
}
