import styles from './SceneTransitionOverlay.module.css';

// Purely visual - the actual interaction lock during a transition is
// useSceneTransition's document.body.overflow toggle, not this element
// intercepting clicks (it's pointer-events: none at all times). Stays
// mounted at opacity 0 rather than conditionally rendering, so its opacity
// transition can actually play both directions.
export default function SceneTransitionOverlay({ visible }) {
  return (
    <div
      className={`${styles.overlay}${visible ? ` ${styles['overlay--visible']}` : ''}`}
      aria-hidden="true"
    />
  );
}
