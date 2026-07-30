// Shared by BackgroundStars and Constellations - both independently need a
// randomized delay/duration per star so a CSS twinkle animation staggers
// instead of every star pulsing in lockstep. Ranges differ per caller (the
// two effects are tuned to feel different - see each component's own
// comments), so they're parameters, not hardcoded here.
export function randomTwinkleTiming({ delayMax = 5, durationMin = 2, durationRange = 4 } = {}) {
  return {
    delay: Math.random() * delayMax,
    duration: durationMin + Math.random() * durationRange,
  };
}
