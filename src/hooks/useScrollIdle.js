import { useEffect, useRef, useState } from 'react';

// True once `delay` ms have passed without a scroll event firing - starts
// counting from mount too, so it also fires if the user never scrolls at all.
export default function useScrollIdle(delay = 3000) {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const markIdle = () => setIsIdle(true);

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

  return isIdle;
}
