import styles from './SceneTransitionOverlay.module.css';

export default function SceneTransitionOverlay({ visible }) {
  return (
    <div
      className={`${styles.overlay}${visible ? ` ${styles['overlay--visible']}` : ''}`}
      aria-hidden="true"
    />
  );
}
