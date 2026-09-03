import styles from './Hint.module.css';

export default function Hint({ visible, children }) {
  const className = `${styles.hint}${visible ? ` ${styles['hint--visible']}` : ''}`;
  return <div className={className}>{children}</div>;
}
