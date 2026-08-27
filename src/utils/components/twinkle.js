export function randomTwinkleTiming({ delayMax = 5, durationMin = 2, durationRange = 4 } = {}) {
  return {
    delay: Math.random() * delayMax,
    duration: durationMin + Math.random() * durationRange,
  };
}
