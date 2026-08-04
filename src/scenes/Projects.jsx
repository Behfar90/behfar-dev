import { useState } from 'react';
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

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <div className={styles.sticky}>
        <BackgroundStars />
        <MoonPhase phase={0.6} size={150} className={styles.moon} />
        <Constellations onSelect={setOpenProjectId} />
        <TerrainLayers />
      </div>
      <ProjectLens project={getProjectById(openProjectId)} onClose={() => setOpenProjectId(null)} />
    </div>
  );
}
