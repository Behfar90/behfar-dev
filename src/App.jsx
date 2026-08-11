import styles from "./App.module.css";
import { useCallback, useEffect, useState } from "react";
import Intro from "./scenes/Intro";
import Projects from "./scenes/Projects";
import ContactMe from "./scenes/ContactMe";
import ScrollIdleHint from "./components/ScrollIdleHint";
import useScrollJourney from "./hooks/useScrollJourney";

// Small deliberate pause before the intro reveals itself, so it doesn't feel
// like it's firing the instant the JS parses - short enough that it needs no
// loading UI of its own.
const MIN_INTRO_DELAY_MS = 250;

function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasMinDurationPassed, setHasMinDurationPassed] = useState(false);
  const { introWrapperRef, orbitProgress } = useScrollJourney();
  // Mirrors Projects' own Hint visibility, so ScrollIdleHint can yield its
  // shared fixed slot for exactly as long as that one occupies it.
  const [suppressIdleHint, setSuppressIdleHint] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHasMinDurationPassed(true), MIN_INTRO_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleIntroReady = useCallback(() => setIsLoaded(true), []);
  const showLoader = !isLoaded || !hasMinDurationPassed;

  return (
    <div className={styles.app}>
      <Intro
        wrapperRef={introWrapperRef}
        orbitProgress={orbitProgress}
        blurred={showLoader}
        onReady={handleIntroReady}
      />
      <Projects onHintActiveChange={setSuppressIdleHint} />
      <ContactMe />
      {/* `key` forces a remount (and so a fresh idle countdown) on every
          suppress/unsuppress transition - otherwise leaving Projects'
          hint range could reveal this immediately, using up idle time
          that accrued while it was suppressed and invisible. */}
      {!showLoader && (
        <ScrollIdleHint key={String(suppressIdleHint)} suppressed={suppressIdleHint} />
      )}
    </div>
  );
}

export default App;
