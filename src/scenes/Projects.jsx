import BackgroundStars from '../components/BackgroundStars';
import Constellations from '../components/Constellations';
import MoonPhase from '../components/MoonPhase';
import TerrainLayers from '../components/TerrainLayers';
import useProjectsSceneAnimation from '../hooks/useProjectsSceneAnimation';
import styles from './Projects.module.css';

export default function Projects() {
  const wrapperRef = useProjectsSceneAnimation();

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <div className={styles.sticky}>
        <BackgroundStars />
        <MoonPhase phase={0.6} size={150} className={styles.moon} />
        <Constellations />
        <TerrainLayers />
      </div>
    </div>
  );
}
