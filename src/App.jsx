import styles from './App.module.css';
import { useEffect, useState } from 'react';
import Universe from './scenes/Universe';
import Projects from './scenes/Projects';
import ContactMe from './scenes/ContactMe';
import ScrollIdleHint from './components/ScrollIdleHint';
import SceneNav from './components/SceneNav';
import SceneTransitionOverlay from './components/SceneTransitionOverlay';
import PlungeAtmosphere from './components/PlungeAtmosphere';
import Preloader from './components/Preloader';
import useScrollJourney from './hooks/useScrollJourney';
import useSceneTransition from './hooks/useSceneTransition';

const OVERLAY_REVEAL_DELAY_MS = 150;

function App() {
  const [preloaderDone, setPreloaderDone] = useState(false);
  const [introRevealing, setIntroRevealing] = useState(false);
  const [showOverlays, setShowOverlays] = useState(false);
  const [audiowideReady, setAudiowideReady] = useState(!('fonts' in document));
  const {
    universeWrapperRef,
    projectsWrapperRef,
    contactWrapperRef,
    orbitProgress,
    activeSection,
  } = useScrollJourney();
  const [suppressIdleHint, setSuppressIdleHint] = useState(false);
  const [closeLensToken, setCloseLensToken] = useState(0);
  const [lensOpen, setLensOpen] = useState(false);
  const { overlayVisible, navigateTo } = useSceneTransition({
    activeSection,
    universeWrapperRef,
    projectsWrapperRef,
    contactWrapperRef,
    onBeforeJump: () => setCloseLensToken((token) => token + 1),
  });

  useEffect(() => {
    document.fonts.load('1em Monoton').catch(() => {});
    if (!('fonts' in document)) return;
    document.fonts
      .load('1em Audiowide')
      .catch(() => {})
      .finally(() => setAudiowideReady(true));
  }, []);

  useEffect(() => {
    if (!preloaderDone) return undefined;
    const timer = setTimeout(() => setShowOverlays(true), OVERLAY_REVEAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [preloaderDone]);

  return (
    <div className={styles.app}>
      {!preloaderDone && (
        <Preloader
          onReveal={() => setIntroRevealing(true)}
          onComplete={() => setPreloaderDone(true)}
        />
      )}

      <SceneNav
        visible={showOverlays && audiowideReady && !lensOpen}
        activeSection={activeSection}
        onNavigate={navigateTo}
      />

      <Universe
        wrapperRef={universeWrapperRef}
        orbitProgress={orbitProgress}
        rendering
        showOverlays={showOverlays}
        introRevealing={introRevealing}
      />
      <PlungeAtmosphere universeWrapperRef={universeWrapperRef} />
      <div ref={projectsWrapperRef}>
        <Projects
          onHintActiveChange={setSuppressIdleHint}
          onLensOpenChange={setLensOpen}
          closeLensToken={closeLensToken}
        />
      </div>
      <div ref={contactWrapperRef}>
        <ContactMe />
      </div>
      {preloaderDone && (
        <ScrollIdleHint key={String(suppressIdleHint)} suppressed={suppressIdleHint} />
      )}

      <SceneTransitionOverlay visible={overlayVisible} />
    </div>
  );
}

export default App;
