import { Mouse } from 'lucide-react';
import useScrollIdle from '../hooks/useScrollIdle';
import Hint from './Hint';

// App-wide nudge: appears anywhere in the page, regardless of which scene is
// in view, once the user hasn't scrolled for a while. `suppressed` lets a
// scene override that - Projects sets it while its own Hint occupies this
// same fixed slot, so the two never show at once.
export default function ScrollIdleHint({ suppressed = false }) {
  const isIdle = useScrollIdle(3000);

  return (
    <Hint visible={isIdle && !suppressed}>
      <Mouse size={26} strokeWidth={1.5} />
    </Hint>
  );
}
