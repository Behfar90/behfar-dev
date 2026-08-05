import styles from './TerrainLayers.module.css';

// Purely presentational - each layer's position comes from a --ns-{name}-y
// custom property written by useProjectsSceneAnimation, so this component
// has no logic of its own beyond applying the right class per <img>.
export default function TerrainLayers() {
  return (
    <>
      <img src="/svg/terrain-1-ridge.svg" alt="" className={`${styles.layer} ${styles.ridge}`} />
      <img src="/svg/terrain-2-trees.svg" alt="" className={`${styles.layer} ${styles.trees}`} />
      <img src="/svg/terrain-3-mid.svg" alt="" className={`${styles.layer} ${styles.mid}`} />
      <img
        src="/png/man_with_telescope_light.png"
        alt="Silhouette of a person looking through a telescope at the night sky"
        className={styles.figure}
      />
      <img
        src="/svg/terrain-4-fore.svg"
        alt=""
        className={`${styles.layer} ${styles.foreground}`}
      />
    </>
  );
}
