import styles from './App.module.css';
import { useEffect, useState } from 'react';
import Universe from './scenes/Universe';
import Projects from './scenes/Projects';
import ContactMe from './scenes/ContactMe';
import ScrollIdleHint from './components/ScrollIdleHint';
import SceneNav from './components/SceneNav';
import SceneTransitionOverlay from './components/SceneTransitionOverlay';
import useScrollJourney from './hooks/useScrollJourney';
import useSceneTransition from './hooks/useSceneTransition';

// Small deliberate pause before Universe's reveal flourish
// (ShootingStarIntro/CaptionGravity) fires, so the stars actually get a
// moment to be seen - and finish their own staggered ignition (see
// stars.js) - before it.
const OVERLAY_REVEAL_DELAY_MS = 1500;

function App() {
  const [showOverlays, setShowOverlays] = useState(false);
  // Gates SceneNav's own reveal alongside showOverlays below - preload +
  // font-display: swap (see public/index.html) makes a wrong-font flash on
  // SceneNav very unlikely, but isn't a hard guarantee (preload is a
  // priority hint, not a promise - a slow enough connection can still lose
  // the race against first paint). This is the actual guarantee: SceneNav
  // simply doesn't render until Audiowide is confirmed loaded, so there's
  // no fallback-font frame for it to ever paint in the first place. Starts
  // `true` if the browser doesn't support the Font Loading API at all
  // (missing document.fonts) - degrades to the old CSS-only swap behavior
  // rather than never showing the nav.
  const [audiowideReady, setAudiowideReady] = useState(!('fonts' in document));
  const {
    universeWrapperRef,
    projectsWrapperRef,
    contactWrapperRef,
    orbitProgress,
    activeSection,
  } = useScrollJourney();
  // Mirrors Projects' own Hint visibility, so ScrollIdleHint can yield its
  // shared fixed slot for exactly as long as that one occupies it.
  const [suppressIdleHint, setSuppressIdleHint] = useState(false);
  // Bumped right as a nav-driven scene jump starts, so ProjectLens (whose
  // own overlay isn't scoped to Projects' scroll range) doesn't get left
  // floating, stale, over whichever scene the user jumps to - see
  // Projects.jsx's closeLensToken prop.
  const [closeLensToken, setCloseLensToken] = useState(0);
  const { overlayVisible, navigateTo } = useSceneTransition({
    activeSection,
    universeWrapperRef,
    projectsWrapperRef,
    contactWrapperRef,
    onBeforeJump: () => setCloseLensToken((token) => token + 1),
  });

  // ShootingStarIntro's TextReveal only requests these fonts once it
  // mounts - firing the request here instead, as early as page load, gives
  // them more time to be ready before that text actually needs them.
  useEffect(() => {
    document.fonts.load('1em Monoton').catch(() => {});
    if (!('fonts' in document)) return;
    document.fonts
      .load('1em Audiowide')
      .catch(() => {})
      // Reveal SceneNav either way - a font that failed to load isn't
      // going to start loading by waiting longer, so there's nothing left
      // to gate on; the CSS fallback stack takes over as normal.
      .finally(() => setAudiowideReady(true));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowOverlays(true), OVERLAY_REVEAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.app}>
      <SceneNav
        visible={showOverlays && audiowideReady}
        activeSection={activeSection}
        onNavigate={navigateTo}
      />

      <Universe
        wrapperRef={universeWrapperRef}
        orbitProgress={orbitProgress}
        rendering
        showOverlays={showOverlays}
      />
      <div ref={projectsWrapperRef}>
        <Projects onHintActiveChange={setSuppressIdleHint} closeLensToken={closeLensToken} />
      </div>
      <div ref={contactWrapperRef}>
        <ContactMe />
      </div>
      {/* `key` forces a remount (and so a fresh idle countdown) on every
          suppress/unsuppress transition - otherwise leaving Projects'
          hint range could reveal this immediately, using up idle time
          that accrued while it was suppressed and invisible. */}
      <ScrollIdleHint key={String(suppressIdleHint)} suppressed={suppressIdleHint} />

      <SceneTransitionOverlay visible={overlayVisible} />
    </div>
  );
}

export default App;
