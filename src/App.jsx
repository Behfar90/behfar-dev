import styles from "./App.module.css";
import { useEffect, useState } from "react";
import Intro from "./scenes/Intro";

function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasMinDurationPassed, setHasMinDurationPassed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHasMinDurationPassed(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const showLoader = !isLoaded || !hasMinDurationPassed;

  return (
    <div className={styles.app}>
      {showLoader && <div className={styles.loadingBar} />}
      <Intro blurred={showLoader} onReady={() => setIsLoaded(true)} />
    </div>
  );
}

export default App;
