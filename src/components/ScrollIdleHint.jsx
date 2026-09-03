import { Mouse } from 'lucide-react';
import useScrollIdle from '../hooks/useScrollIdle';
import Hint from './Hint';
import styles from './ScrollIdleHint.module.css';

export default function ScrollIdleHint({ suppressed = false }) {
  const { isIdle, canScrollUp, canScrollDown } = useScrollIdle(3000);
  const bothDirections = canScrollUp && canScrollDown;
  const lineClass = `${styles.line}${bothDirections ? ` ${styles['line--short']}` : ''}`;

  return (
    <Hint visible={isIdle && !suppressed}>
      <span className={styles.cue}>
        <span className={`${lineClass}${canScrollUp ? ` ${styles['line--visible']}` : ''}`} />
        <Mouse size={26} strokeWidth={1.5} />
        <span className={`${lineClass}${canScrollDown ? ` ${styles['line--visible']}` : ''}`} />
      </span>
    </Hint>
  );
}
