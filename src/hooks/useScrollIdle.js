import { useEffect, useRef, useState } from 'react';

// Small buffer near the top so "scroll up" clears as soon as there's
// genuinely nothing left above, rather than lingering for a few pixels.
const UP_EDGE_BUFFER = 20;
// Larger buffer near the bottom - eases off "scroll down" a little before
// the literal end of the page instead of nudging right up to the last pixel.
const DOWN_EDGE_BUFFER = 200;

const getScrollAvailability = () => {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  return {
    canScrollDown:
      scrollableHeight > DOWN_EDGE_BUFFER && window.scrollY < scrollableHeight - DOWN_EDGE_BUFFER,
    canScrollUp: window.scrollY > UP_EDGE_BUFFER,
  };
};

// True once `delay` ms have passed without a scroll event firing, provided
// there's still room to scroll in at least one direction - starts counting
// from mount too, so it also fires if the user never scrolls at all. Also
// reports which direction(s) that room is in, so a hint can point the right
// way instead of just nudging "scroll" blindly.
export default function useScrollIdle(delay = 3000) {
  const [isIdle, setIsIdle] = useState(false);
  const [availability, setAvailability] = useState({ canScrollUp: false, canScrollDown: false });
  const timeoutRef = useRef(null);

  useEffect(() => {
    const markIdle = () => {
      const next = getScrollAvailability();
      if (next.canScrollUp || next.canScrollDown) {
        setAvailability(next);
        setIsIdle(true);
      }
    };

    const handleScroll = () => {
      setIsIdle(false);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(markIdle, delay);
    };

    timeoutRef.current = setTimeout(markIdle, delay);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutRef.current);
    };
  }, [delay]);

  return { isIdle, ...availability };
}
