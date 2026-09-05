import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import styles from './CaptionGravity.module.css';

const CAMERA_Z = 2000;
const BOTTOM_FRACTION = 0.12;
const COLOR = '#eeba7b';

const HOLD_START = 0.325;
const HOLD_END = 0.675;
const PER_LETTER_SPAN = 0.5;
const SPIN_TURNS = 3;

function easeInQuad(t) {
  return t * t;
}

function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t);
}

function letterOwnT(p, stagger) {
  const start = stagger * (1 - PER_LETTER_SPAN);
  return Math.min(1, Math.max(0, (p - start) / PER_LETTER_SPAN));
}

function CaptionLetters({ text, localT, fontFamily, size }) {
  const groupRef = useRef();
  const pixelRatio = window.devicePixelRatio || 1;
  const fontSize = Math.min(18.4, Math.max(14.4, size.width * 0.02));
  const letterSpacing = fontSize * 0.05;
  const homeY = -(size.height * (0.5 - BOTTOM_FRACTION));

  const { glyphs, totalWidth } = useMemo(() => {
    const measureCanvas = document.createElement('canvas');
    const ctx = measureCanvas.getContext('2d');
    ctx.font = `${fontSize * pixelRatio}px ${fontFamily}`;

    let cursor = 0;
    const glyphs = [];
    Array.from(text).forEach((ch) => {
      const width = ch === ' ' ? fontSize * 0.35 : ctx.measureText(ch).width / pixelRatio;
      if (ch !== ' ') glyphs.push({ ch, x: cursor + width / 2, width, stagger: Math.random() });
      cursor += width + letterSpacing;
    });
    return { glyphs, totalWidth: cursor - letterSpacing };
  }, [text, fontFamily, fontSize, pixelRatio, letterSpacing]);

  const textures = useMemo(
    () =>
      glyphs.map(({ ch, width }) => {
        const canvas = document.createElement('canvas');
        const h = fontSize * 1.4 * pixelRatio;
        canvas.width = Math.ceil(width * pixelRatio) + 4;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.font = `${fontSize * pixelRatio}px ${fontFamily}`;
        ctx.fillStyle = COLOR;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ch, canvas.width / 2, h / 2);
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        return { texture: tex, planeWidth: canvas.width / pixelRatio, planeHeight: h / pixelRatio };
      }),
    [glyphs, fontFamily, fontSize, pixelRatio],
  );

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    glyphs.forEach((glyph, i) => {
      const mesh = group.children[i];
      if (!mesh) return;

      const homeX = glyph.x - totalWidth / 2;

      let collapse = 0;
      if (localT < HOLD_START) {
        const p = HOLD_START > 0 ? localT / HOLD_START : 1;
        collapse = 1 - easeOutQuad(letterOwnT(p, glyph.stagger));
      } else if (localT > HOLD_END) {
        const p = (localT - HOLD_END) / (1 - HOLD_END);
        collapse = easeInQuad(letterOwnT(p, glyph.stagger));
      }

      const spinDir = homeX >= 0 ? 1 : -1;
      mesh.position.x = homeX * (1 - collapse);
      mesh.position.y = homeY * (1 - collapse);
      mesh.rotation.z = collapse * SPIN_TURNS * Math.PI * 2 * spinDir;
      const scale = 1 - collapse;
      mesh.scale.setScalar(scale);
      mesh.visible = scale > 0.01;
    });
  });

  return (
    <group ref={groupRef}>
      {glyphs.map((glyph, i) => (
        <mesh key={i} position={[glyph.x - totalWidth / 2, homeY, 0]} renderOrder={i}>
          <planeGeometry args={[textures[i].planeWidth, textures[i].planeHeight]} />
          <meshBasicMaterial map={textures[i].texture} transparent depthTest={false} />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ orbitProgress, captions, fontFamily }) {
  const { size, camera } = useThree();

  useLayoutEffect(() => {
    camera.fov = Math.atan(size.height / 2 / CAMERA_Z) * (180 / Math.PI) * 2;
    camera.updateProjectionMatrix();
  }, [camera, size.height]);

  const count = captions.length;
  const clamped = Math.min(1, Math.max(0, orbitProgress));
  const scaled = clamped * count;
  const index = Math.min(count - 1, Math.floor(scaled));
  const localT = scaled - index;

  return (
    <CaptionLetters
      key={index}
      text={captions[index]}
      localT={localT}
      fontFamily={fontFamily}
      size={size}
    />
  );
}

export default function CaptionGravity({ orbitProgress, captions }) {
  const [fontFamily, setFontFamily] = useState('Georgia, serif');
  const overlayRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    document.fonts
      .load('1em Audiowide')
      .then(() => setFontFamily('Audiowide, Georgia, serif'))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      rootMargin: '200px',
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const calculateFov = () => Math.atan(window.innerHeight / 2 / CAMERA_Z) * (180 / Math.PI) * 2;

  return (
    <div ref={overlayRef} className={styles.overlay}>
      <Canvas
        frameloop={isVisible ? 'always' : 'never'}
        camera={{ position: [0, 0, CAMERA_Z], far: CAMERA_Z + 100, fov: calculateFov() }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        gl={{ alpha: true }}
      >
        <Scene orbitProgress={orbitProgress} captions={captions} fontFamily={fontFamily} />
      </Canvas>
    </div>
  );
}
