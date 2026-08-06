import styles from './Hint.module.css';

// Single shared visual for every scene-level nudge - same fixed slot, same
// typography, same fade/pulse, whether the content is ScrollIdleHint's icon
// or a scene's own text, so they read as one hint system rather than a
// collection of one-off nudges styled independently.
export default function Hint({ visible, children }) {
  const className = `${styles.hint}${visible ? ` ${styles['hint--visible']}` : ''}`;
  return <div className={className}>{children}</div>;
}
