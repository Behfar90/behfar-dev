import { useEffect, useRef, useState } from 'react';

const UP_EDGE_BUFFER = 20;
const DOWN_EDGE_BUFFER = 200;

const getScrollAvailability = () => {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  return {
    canScrollDown:
      scrollableHeight > DOWN_EDGE_BUFFER && window.scrollY < scrollableHeight - DOWN_EDGE_BUFFER,
    canScrollUp: window.scrollY > UP_EDGE_BUFFER,
  };
};

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
