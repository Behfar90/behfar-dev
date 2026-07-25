import { Mouse } from 'lucide-react';
import useScrollIdle from '../hooks/useScrollIdle';
import styles from './ScrollIdleHint.module.css';

// App-wide nudge: appears anywhere in the page, regardless of which scene is
// in view, once the user hasn't scrolled for a while.
export default function ScrollIdleHint() {
  const isIdle = useScrollIdle(3000);
  const className = `${styles.hint}${isIdle ? ` ${styles['hint--visible']}` : ''}`;

  return <Mouse className={className} size={26} strokeWidth={1.5} />;
}
