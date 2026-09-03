import { useEffect, useRef, useState } from 'react';

const FADE_OUT_MS = 300;
const FADE_HOLD_MS = 300;
const FADE_IN_MS = 450;

const SECTION_REFS = {
  universe: 'universeWrapperRef',
  projects: 'projectsWrapperRef',
  contact: 'contactWrapperRef',
};

function getTargetScrollY(section, wrapperRefs) {
  if (section === 'projects') {
    const contactTop = wrapperRefs.contactWrapperRef.current?.offsetTop;
    if (contactTop != null) return contactTop - window.innerHeight;
  }
  if (section === 'contact') {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }
  const refName = SECTION_REFS[section];
  return wrapperRefs[refName]?.current?.offsetTop;
}

export default function useSceneTransition({
  activeSection,
  universeWrapperRef,
  projectsWrapperRef,
  contactWrapperRef,
  onBeforeJump,
}) {
  const [phase, setPhase] = useState('idle');
  const targetSectionRef = useRef(null);
  const wrapperRefs = { universeWrapperRef, projectsWrapperRef, contactWrapperRef };

  useEffect(() => {
    if (phase === 'idle') return undefined;

    if (phase === 'out') {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        const top = getTargetScrollY(targetSectionRef.current, wrapperRefs);
        if (top != null) {
          window.scrollTo({ top, behavior: 'auto' });
        }
        setPhase('in');
      }, FADE_OUT_MS + FADE_HOLD_MS);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      document.body.style.overflow = '';
      setPhase('idle');
      targetSectionRef.current = null;
    }, FADE_IN_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const navigateTo = (section) => {
    if (phase !== 'idle' || section === activeSection) return;
    onBeforeJump?.();
    targetSectionRef.current = section;
    setPhase('out');
  };

  return { overlayVisible: phase === 'out', navigateTo };
}
