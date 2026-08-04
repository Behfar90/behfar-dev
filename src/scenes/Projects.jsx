import { useCallback, useState } from 'react';
import BackgroundStars from '../components/BackgroundStars';
import Constellations from '../components/Constellations';
import MoonPhase from '../components/MoonPhase';
import ProjectLens from '../components/ProjectLens';
import TerrainLayers from '../components/TerrainLayers';
import useProjectsSceneAnimation from '../hooks/useProjectsSceneAnimation';
import { getProjectById } from '../utils/scenes/projects';
import styles from './Projects.module.css';

export default function Projects() {
  const wrapperRef = useProjectsSceneAnimation();
  const [openProjectId, setOpenProjectId] = useState(null);
  // Not cleared on close (only ever overwritten by the next open) - that's
  // what lets the lens shrink back toward the constellation it came from
  // instead of snapping to a default point mid closing-animation.
  const [origin, setOrigin] = useState(null);

  const handleSelect = (id, originPoint) => {
    setOpenProjectId(id);
    setOrigin(originPoint);
  };
  // Stable reference (not an inline arrow function) - ProjectLens's scroll-
  // lock effect depends on this, and a new function identity on every
  // Projects render would re-trigger that effect for no reason.
  const handleClose = useCallback(() => setOpenProjectId(null), []);

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <div className={styles.sticky}>
        <BackgroundStars />
        <MoonPhase phase={0.6} size={150} className={styles.moon} />
        <Constellations onSelect={handleSelect} />
        <TerrainLayers />
      </div>
      <ProjectLens project={getProjectById(openProjectId)} origin={origin} onClose={handleClose} />
    </div>
  );
}
