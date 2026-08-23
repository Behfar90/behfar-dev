import styles from './App.module.css';
import { useEffect, useState } from 'react';
import Universe from './scenes/Universe';
import Projects from './scenes/Projects';
import ContactMe from './scenes/ContactMe';
import ScrollIdleHint from './components/ScrollIdleHint';
import useScrollJourney from './hooks/useScrollJourney';

// Small deliberate pause before Universe's reveal flourish
// (ShootingStarIntro/CaptionGravity) fires, so the stars actually get a
// moment to be seen - and finish their own staggered ignition (see
// stars.js) - before it.
const OVERLAY_REVEAL_DELAY_MS = 1500;

function App() {
  const [showOverlays, setShowOverlays] = useState(false);
  const { universeWrapperRef, orbitProgress } = useScrollJourney();
  // Mirrors Projects' own Hint visibility, so ScrollIdleHint can yield its
  // shared fixed slot for exactly as long as that one occupies it.
  const [suppressIdleHint, setSuppressIdleHint] = useState(false);

  // ShootingStarIntro's TextReveal only requests these fonts once it
  // mounts - firing the request here instead, as early as page load, gives
  // them more time to be ready before that text actually needs them.
  useEffect(() => {
    document.fonts.load('1em Monoton').catch(() => {});
    document.fonts.load('1em Audiowide').catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowOverlays(true), OVERLAY_REVEAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.app}>
      <Universe
        wrapperRef={universeWrapperRef}
        orbitProgress={orbitProgress}
        rendering
        showOverlays={showOverlays}
      />
      <Projects onHintActiveChange={setSuppressIdleHint} />
      <ContactMe />
      {/* `key` forces a remount (and so a fresh idle countdown) on every
          suppress/unsuppress transition - otherwise leaving Projects'
          hint range could reveal this immediately, using up idle time
          that accrued while it was suppressed and invisible. */}
      <ScrollIdleHint key={String(suppressIdleHint)} suppressed={suppressIdleHint} />
    </div>
  );
}

export default App;
