import styles from './App.module.css';
import { useCallback, useEffect, useState } from 'react';
import Universe from './scenes/Universe';
import BigBang from './scenes/BigBang';
import Projects from './scenes/Projects';
import ContactMe from './scenes/ContactMe';
import ScrollIdleHint from './components/ScrollIdleHint';
import useScrollJourney from './hooks/useScrollJourney';

// Universe becomes visible (through the still-dissipating cloud) the
// instant BigBang settles - but firing ShootingStarIntro/CaptionGravity
// that same instant meant they'd already run their course while still
// hidden behind cloud that hadn't thinned enough to see them by. This
// pause gives the stars a beat to actually be seen first.
const OVERLAY_REVEAL_DELAY_MS = 1500;

function App() {
  // Universe resumes rendering the moment BigBang settles (not once the
  // cloud is fully gone), so it reads as being born out of the explosion
  // rather than arriving after it - but its ShootingStarIntro/CaptionGravity
  // reveal waits a beat longer (see OVERLAY_REVEAL_DELAY_MS) once that.
  const [universeSettled, setUniverseSettled] = useState(false);
  const [showOverlays, setShowOverlays] = useState(false);
  const [bigBangDone, setBigBangDone] = useState(false);
  const { universeWrapperRef, orbitProgress } = useScrollJourney();
  // Mirrors Projects' own Hint visibility, so ScrollIdleHint can yield its
  // shared fixed slot for exactly as long as that one occupies it.
  const [suppressIdleHint, setSuppressIdleHint] = useState(false);

  const handleUniverseSettled = useCallback(() => setUniverseSettled(true), []);
  const handleBigBangComplete = useCallback(() => setBigBangDone(true), []);

  useEffect(() => {
    if (!universeSettled) return;
    const timer = setTimeout(() => setShowOverlays(true), OVERLAY_REVEAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [universeSettled]);

  return (
    <div className={styles.app}>
      <Universe
        wrapperRef={universeWrapperRef}
        orbitProgress={orbitProgress}
        rendering={universeSettled}
        showOverlays={showOverlays}
      />
      {!bigBangDone && (
        <BigBang onSettled={handleUniverseSettled} onCloudGone={handleBigBangComplete} />
      )}
      <Projects onHintActiveChange={setSuppressIdleHint} />
      <ContactMe />
      {/* `key` forces a remount (and so a fresh idle countdown) on every
          suppress/unsuppress transition - otherwise leaving Projects'
          hint range could reveal this immediately, using up idle time
          that accrued while it was suppressed and invisible. */}
      {bigBangDone && (
        <ScrollIdleHint key={String(suppressIdleHint)} suppressed={suppressIdleHint} />
      )}
    </div>
  );
}

export default App;
