import { Telescope } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import BackgroundStars from '../components/BackgroundStars';
import Constellations from '../components/Constellations';
import Hint from '../components/Hint';
import MilkywayGalaxy from '../components/MilkywayGalaxy';
import MoonPhase from '../components/MoonPhase';
import ProjectLens from '../components/ProjectLens';
import TerrainLayers from '../components/TerrainLayers';
import useProjectsSceneAnimation from '../hooks/useProjectsSceneAnimation';
import { getProjectById } from '../utils/scenes/projects';
import styles from './Projects.module.css';

export default function Projects({ onHintActiveChange = () => {}, closeLensToken = 0 }) {
  const wrapperRef = useProjectsSceneAnimation();
  const figureRef = useRef(null);
  const moonRef = useRef(null);
  const [openProjectId, setOpenProjectId] = useState(null);
  const [origin, setOrigin] = useState(null);
  const triggerRef = useRef(null);

  const [figureInViewport, setFigureInViewport] = useState(false);
  const [moonInViewport, setMoonInViewport] = useState(false);

  useEffect(() => {
    const el = figureRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(([entry]) =>
      setFigureInViewport(entry.isIntersecting),
    );
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
  const showHint = inHintRange && !openProjectId;

  useEffect(() => {
    onHintActiveChange(inHintRange);
  }, [inHintRange, onHintActiveChange]);

  useEffect(() => {
    setOpenProjectId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeLensToken]);

  const handleSelect = (id, originPoint, triggerEl) => {
    setOpenProjectId(id);
    setOrigin(originPoint);
    triggerRef.current = triggerEl;
  };
  const handleClose = useCallback(() => setOpenProjectId(null), []);

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <div className={styles.sticky} inert={openProjectId ? true : undefined}>
        <MilkywayGalaxy />
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
      <Hint visible={showHint}>
        <Telescope size={26} strokeWidth={1.5} />
        Explore the projects in the sky
      </Hint>
    </div>
  );
}
