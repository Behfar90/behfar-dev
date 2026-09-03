import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PLUNGE_START } from '../utils/scenes/universeTiming';

gsap.registerPlugin(ScrollTrigger);

export default function PlungeAtmosphere({ universeWrapperRef }) {
  useEffect(() => {
    const universeEl = universeWrapperRef.current;
    if (!universeEl) return undefined;

    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const getLandmarks = () => {
      const scrollable = universeEl.offsetHeight - window.innerHeight;
      const riseStart = universeEl.offsetTop + PLUNGE_START * scrollable;
      const riseEnd = universeEl.offsetTop + scrollable;
      const fallEnd = universeEl.offsetTop + universeEl.offsetHeight;
      return { riseStart, riseEnd, fallEnd };
    };

    const { riseStart, riseEnd, fallEnd } = getLandmarks();
    const riseDistance = riseEnd - riseStart;
    const fallDistance = fallEnd - riseEnd;

    gsap.set(root, {
      '--plunge-scale': 1,
      '--plunge-blur': '0px',
      '--plunge-blackout': 0,
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: universeEl,
        start: () => getLandmarks().riseStart,
        end: () => getLandmarks().fallEnd,
        scrub: true,
        invalidateOnRefresh: true,
      },
    });

    if (!reduceMotion) {
      tl.fromTo(
        root,
        { '--plunge-scale': 1, '--plunge-blur': '0px' },
        {
          '--plunge-scale': 1.35,
          '--plunge-blur': '7px',
          ease: 'none',
          duration: riseDistance,
          immediateRender: false,
        },
        0,
      );
    }

    tl.fromTo(
      root,
      { '--plunge-blackout': 0 },
      {
        '--plunge-blackout': 1,
        ease: 'none',
        duration: fallDistance * 0.3,
        immediateRender: false,
      },
      riseDistance,
    );
    tl.fromTo(
      root,
      { '--plunge-blackout': 1 },
      { '--plunge-blackout': 1, ease: 'none', duration: fallDistance * 0.6, immediateRender: false },
      riseDistance + fallDistance * 0.3,
    );
    tl.fromTo(
      root,
      { '--plunge-blackout': 1 },
      {
        '--plunge-blackout': 0,
        ease: 'none',
        duration: fallDistance * 0.08,
        immediateRender: false,
      },
      riseDistance + fallDistance * 0.9,
    );
    if (!reduceMotion) {
      tl.fromTo(
        root,
        { '--plunge-scale': 1.35, '--plunge-blur': '7px' },
        {
          '--plunge-scale': 1,
          '--plunge-blur': '0px',
          ease: 'none',
          duration: fallDistance * 0.3,
          immediateRender: false,
        },
        riseDistance,
      );
    }

    tl.set(root, {}, riseDistance + fallDistance);

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      gsap.set(root, {
        '--plunge-scale': 1,
        '--plunge-blur': '0px',
        '--plunge-blackout': 0,
      });
    };
  }, [universeWrapperRef]);

  return null;
}
