import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import styles from './ShootingStarIntro.module.css';

export default function ShootingStarIntro() {
  const hStarRef = useRef(null);
  const vStarRef = useRef(null);
  const nameRef = useRef(null);

  useEffect(() => {
    const hStar = hStarRef.current;
    const vStar = vStarRef.current;
    const name = nameRef.current;

    gsap.set(hStar, { x: -220 });
    gsap.set(vStar, { y: -220 });

    const tl = gsap.timeline({ delay: 0.3 });

    // Horizontal star sweeps fully across the screen (left edge → right edge)
    tl.to(hStar, {
      x: () => window.innerWidth + 220,
      duration: 1.6,
      ease: 'power2.inOut',
    });

    // Vertical star sweeps top → bottom, starting 0.1s after horizontal
    tl.to(
      vStar,
      {
        y: () => window.innerHeight + 220,
        duration: 1.4,
        ease: 'power2.inOut',
      },
      '<0.1',
    );

    // Name appears as the stars cross the centre (~half their travel time)
    tl.to(
      name,
      {
        opacity: 1,
        duration: 1,
        ease: 'power2.out',
      },
      '<-0.6',
    );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div className={styles.overlay}>
      <div ref={hStarRef} className={styles.hStar} />
      <div ref={vStarRef} className={styles.vStar} />
      <h1 ref={nameRef} className={styles.name}>
        Behfar Behzad
      </h1>
    </div>
  );
}
