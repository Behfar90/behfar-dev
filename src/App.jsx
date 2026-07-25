import styles from "./App.module.css";
import { useCallback, useEffect, useState } from "react";
import Intro from "./scenes/Intro";
import NextSection from "./scenes/NextSection";
import ContactMe from "./scenes/ContactMe";
import ScrollIdleHint from "./components/ScrollIdleHint";
import useScrollJourney from "./hooks/useScrollJourney";

function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasMinDurationPassed, setHasMinDurationPassed] = useState(false);
  const { introWrapperRef, orbitProgress } = useScrollJourney();

  useEffect(() => {
    const timer = setTimeout(() => setHasMinDurationPassed(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleIntroReady = useCallback(() => setIsLoaded(true), []);
  const showLoader = !isLoaded || !hasMinDurationPassed;

  return (
    <div className={styles.app}>
      {showLoader && <div className={styles.loadingBar} />}
      <Intro
        wrapperRef={introWrapperRef}
        orbitProgress={orbitProgress}
        blurred={showLoader}
        onReady={handleIntroReady}
      />
      <NextSection />
      <ContactMe />
      {!showLoader && <ScrollIdleHint />}
    </div>
  );
}

export default App;
