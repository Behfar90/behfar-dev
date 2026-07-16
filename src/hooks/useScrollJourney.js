import { useEffect, useRef, useState } from 'react';

// Drives the whole app's scroll-jacked journey through an ordered list of
// steps (e.g. intro orbit, wormhole flight, ...more to come), followed by
// normal document scroll for whatever comes after the last step.
//
// Only the active step is mounted at a time - each step component must
// expose `applyDelta(deltaY)` via ref, returning `{ completed, atStart }`,
// and accept an `initialProgress` prop telling it where to resume (0 when
// entered moving forward, Infinity - which each step clamps to its own max -
// when entered moving backward). This is what makes the journey reversible
// without keeping every step mounted forever.
export default function useScrollJourney(stepCount) {
  const [stepIndex, setStepIndex] = useState(0);
  const [entryProgress, setEntryProgress] = useState(0);
  const activeRef = useRef(null);

  const inStep = stepIndex < stepCount;

  useEffect(() => {
    // Steps scroll-jack the wheel themselves; normal page scroll only takes
    // over once we're past the last step.
    document.body.style.overflow = inStep ? 'hidden' : 'auto';
  }, [inStep]);

  useEffect(() => {
    const handleWheel = (event) => {
      if (!inStep) {
        // Only reclaim the wheel for an upward scroll once the page is
        // already scrolled to the very top.
        if (window.scrollY <= 0 && event.deltaY < 0) {
          event.preventDefault();
          setEntryProgress(Infinity);
          setStepIndex(stepCount - 1);
        }
        return;
      }

      event.preventDefault();
      const result = activeRef.current?.applyDelta(event.deltaY);

      if (result?.completed) {
        setEntryProgress(0);
        setStepIndex((index) => index + 1);
      } else if (result?.atStart && stepIndex > 0) {
        setEntryProgress(Infinity);
        setStepIndex((index) => index - 1);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [stepIndex, inStep, stepCount]);

  return { stepIndex, entryProgress, activeRef };
}
