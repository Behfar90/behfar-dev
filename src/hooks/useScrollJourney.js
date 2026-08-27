import { useEffect, useRef, useState } from 'react';

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
