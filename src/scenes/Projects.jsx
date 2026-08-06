import { useCallback, useEffect, useRef, useState } from 'react';
import BackgroundStars from '../components/BackgroundStars';
import Constellations from '../components/Constellations';
import Hint from '../components/Hint';
import MoonPhase from '../components/MoonPhase';
import ProjectLens from '../components/ProjectLens';
import TerrainLayers from '../components/TerrainLayers';
import useProjectsSceneAnimation from '../hooks/useProjectsSceneAnimation';
import { getProjectById } from '../utils/scenes/projects';
import styles from './Projects.module.css';

// `onHintActiveChange` lets Projects tell App when this scene wants
// ScrollIdleHint suppressed - see ScrollIdleHint's `suppressed` prop.
// Defaulted to a no-op so Projects still works standalone (tests,
// Storybook-style usage) without a parent wiring it up.
export default function Projects({ onHintActiveChange = () => {} }) {
  const wrapperRef = useProjectsSceneAnimation();
  // Forwarded to TerrainLayers/MoonPhase so the effects below can watch the
  // actual figure/moon elements, not a computed scroll-progress stand-in.
  const figureRef = useRef(null);
  const moonRef = useRef(null);
  const [openProjectId, setOpenProjectId] = useState(null);
  // Not cleared on close (only ever overwritten by the next open) - that's
  // what lets the lens shrink back toward the constellation it came from
  // instead of snapping to a default point mid closing-animation.
  const [origin, setOrigin] = useState(null);
  // A ref, not state - ProjectLens only reads this once, when its own close
  // animation finishes, to return focus to whichever constellation opened
  // it. It doesn't need to trigger a re-render on its own.
  const triggerRef = useRef(null);

  // The hint's active window is purely visibility-based, not scroll-percentage
  // based: it needs the figure to actually be on screen (something to look
  // at) and the moon to actually be on screen too - the moon is the pinned
  // reference point for "there's still something up here to interact with,"
  // playing the same role on the way back up (scrolling from ContactMe) as
  // its starting point. Within the scene's own pinned scroll range the moon
  // never leaves the viewport - sticky content stays fully visible for the
  // whole pin - so `moonInViewport` only actually goes false once the user
  // has scrolled past the pin into ContactMe. Not gated on whether the user
  // has ever clicked a constellation either - it's tied purely to what's
  // currently on screen, so it reappears every time this range is re-entered.
  const [figureInViewport, setFigureInViewport] = useState(false);
  const [moonInViewport, setMoonInViewport] = useState(false);

  useEffect(() => {
    const el = figureRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(([entry]) => setFigureInViewport(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = moonRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(([entry]) => setMoonInViewport(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const inHintRange = figureInViewport && moonInViewport;
  // Text hint additionally hides while the lens is open, but ScrollIdleHint
  // stays suppressed for the full range regardless - see onHintActiveChange
  // below, which is keyed on inHintRange alone.
  const showHint = inHintRange && !openProjectId;

  useEffect(() => {
    onHintActiveChange(inHintRange);
  }, [inHintRange, onHintActiveChange]);

  const handleSelect = (id, originPoint, triggerEl) => {
    setOpenProjectId(id);
    setOrigin(originPoint);
    triggerRef.current = triggerEl;
  };
  // Stable reference (not an inline arrow function) - ProjectLens's scroll-
  // lock effect depends on this, and a new function identity on every
  // Projects render would re-trigger that effect for no reason.
  const handleClose = useCallback(() => setOpenProjectId(null), []);

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      {/* inert (not just aria-hidden) while the lens is open - a screen
          reader user tabbing past the dialog shouldn't be able to reach the
          dimmed, inoperable scene behind it at all. */}
      <div className={styles.sticky} inert={openProjectId ? true : undefined}>
        <BackgroundStars />
        <MoonPhase phase={0.6} size={150} className={styles.moon} moonRef={moonRef} />
        <Constellations onSelect={handleSelect} />
        <TerrainLayers figureRef={figureRef} />
      </div>
      <ProjectLens
        project={getProjectById(openProjectId)}
        origin={origin}
        onClose={handleClose}
        returnFocusRef={triggerRef}
      />
      <Hint visible={showHint}>Click a constellation to explore a project</Hint>
    </div>
  );
}
