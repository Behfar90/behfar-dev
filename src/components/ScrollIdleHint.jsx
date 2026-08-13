import { Mouse } from 'lucide-react';
import useScrollIdle from '../hooks/useScrollIdle';
import Hint from './Hint';
import styles from './ScrollIdleHint.module.css';

// App-wide nudge: appears anywhere in the page, regardless of which scene is
// in view, once the user hasn't scrolled for a while. `suppressed` lets a
// scene override that - Projects sets it while its own Hint occupies this
// same fixed slot, so the two never show at once.
//
// A short line above and/or below the mouse icon shows which direction(s)
// still have room to scroll: one (longer) line when only one direction is
// open, two (shorter, so the pair doesn't read as one long bar) when both
// are. Both lines pulse along with the icon for free, since that animation
// lives on the shared .hint wrapper in Hint.module.css.
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
