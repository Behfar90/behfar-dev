import { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { createBigBang, updateBigBang } from '../utils/scenes/bigBang';
import styles from './BigBang.module.css';

function Scene({ onSettled, onCloudGone }) {
  const { scene } = useThree();
  const bigBangRef = useRef(null);

  useFrame((state) => {
    if (!bigBangRef.current) {
      bigBangRef.current = createBigBang(scene);
    }
    const { justSettled, justCloudGone } = updateBigBang(
      bigBangRef.current,
      state.clock.elapsedTime,
    );
    if (justSettled) onSettled();
    if (justCloudGone) onCloudGone();
  });

  return null;
}

// A one-shot, self-contained explosion sequence: its own static camera (no
// scroll/orbit/mouse-look - that's Universe's job, once this hands off) and
// its own renderer. Sits above everything else in App.jsx, transparent
// background - Universe (paused and hidden until now) resumes rendering
// and shows through immediately once `onSettled` fires, wherever the cloud
// isn't covering it, rather than being held back by a separate fade on top.
// `onCloudGone` fires once the cloud's own opacity has faded to nothing
// (see bigBang.js), the cue to unmount this overlay entirely.
export default function BigBang({ onSettled, onCloudGone }) {
  return (
    <div className={styles.overlay}>
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }} gl={{ alpha: true }}>
        <EffectComposer>
          <Bloom luminanceThreshold={0.05} luminanceSmoothing={0.8} height={300} intensity={2.5} />
        </EffectComposer>
        <Scene onSettled={onSettled} onCloudGone={onCloudGone} />
      </Canvas>
    </div>
  );
}
