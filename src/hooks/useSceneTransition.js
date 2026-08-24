import { useEffect, useRef, useState } from 'react';

// Overlay opacity 0 -> 1.
const FADE_OUT_MS = 300;
// Extra fully-opaque dwell after the scroll jump. Universe's camera position
// eases toward its target every frame (see Universe.jsx's ORBIT_EASE) and
// never pauses, so it's already mid-ease toward wherever the *current*
// scroll position points before any nav click fires - jumping straight to
// orbitProgress 0 re-triggers a chunk of the intro's arrival swoop after
// reveal. A full hide-until-fully-settled hold would take ~1s (that ease is
// exponential decay), which would make every nav click feel sluggish; this
// eats just the fastest, most visually dominant early portion of it instead.
const FADE_HOLD_MS = 300;
// Overlay opacity 1 -> 0.
const FADE_IN_MS = 450;

const SECTION_REFS = {
  universe: 'universeWrapperRef',
  projects: 'projectsWrapperRef',
  contact: 'contactWrapperRef',
};

// Where a nav jump to `section` should land, in scrollY terms. Universe and
// Contact each land at their own wrapper's offsetTop - the very start of
// their pinned range is already their intended entry point. Projects is
// different: its layers/constellations are a scroll-driven build-up (see
// useProjectsSceneAnimation), so landing at *its* offsetTop drops the user
// into the scene before anything has assembled. Landing instead at the
// furthest scrollY still inside Projects' pin - contactWrapperRef's own
// offsetTop minus one viewport height, i.e. the last frame before Contact's
// sticky panel takes over - guarantees the fully-settled view instead.
function getTargetScrollY(section, wrapperRefs) {
  if (section === 'projects') {
    const contactTop = wrapperRefs.contactWrapperRef.current?.offsetTop;
    if (contactTop != null) return contactTop - window.innerHeight;
  }
  const refName = SECTION_REFS[section];
  return wrapperRefs[refName]?.current?.offsetTop;
}

// Drives the nav's fade-to-a-scene transition. None of the three scenes
// have (or need) a pause/resume mechanism - each is purely a function of
// scroll position, and the existing position: sticky layout already means
// only the scrolled-to scene is visible regardless of what's running
// underneath. So "fade transition" here just means: show an opaque overlay,
// jump window.scrollTo instantly to the target scene while hidden behind
// it, fade the overlay back out. The scroll jump is real - it's just hidden
// by the fade rather than being a visible animated scroll.
export default function useSceneTransition({
  activeSection,
  universeWrapperRef,
  projectsWrapperRef,
  contactWrapperRef,
  onBeforeJump,
}) {
  const [phase, setPhase] = useState('idle'); // 'idle' | 'out' | 'in'
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

    // phase === 'in'
    const timer = setTimeout(() => {
      document.body.style.overflow = '';
      setPhase('idle');
      targetSectionRef.current = null;
    }, FADE_IN_MS);
    return () => clearTimeout(timer);
    // wrapperRefs is a fresh object every render, but only its current
    // .current values matter at the moment the timeout fires, not its
    // identity - so it's deliberately left out of the dependency list.
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
