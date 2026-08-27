import { useRef, useMemo } from 'react';
import * as THREE from 'three';

const easeOutSine = (t, b, c, d) => c * Math.sin((t / d) * (Math.PI / 2)) + b;

export default function usePortraitTailInteraction() {
  const tailRef = useRef({
    array: [],
    size: 80,
    maxAge: 70,
    radius: 0.08,
    red: 255,
  });

  const { tailCanvas, tailCtx, tailTexture } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = tailRef.current.size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return {
      tailCanvas: canvas,
      tailCtx: ctx,
      tailTexture: new THREE.CanvasTexture(canvas),
    };
  }, []);

  const drawTail = () => {
    tailCtx.fillStyle = 'black';
    tailCtx.fillRect(0, 0, tailCanvas.width, tailCanvas.height);

    tailRef.current.array.forEach((point, i) => {
      point.age++;
      if (point.age > tailRef.current.maxAge) {
        tailRef.current.array.splice(i, 1);
      } else {
        const pos = {
          x: point.x * tailRef.current.size,
          y: (1 - point.y) * tailRef.current.size,
        };
        let intensity =
          point.age < tailRef.current.maxAge * 0.3
            ? easeOutSine(point.age / (tailRef.current.maxAge * 0.3), 0, 1, 1)
            : easeOutSine(
                1 - (point.age - tailRef.current.maxAge * 0.3) / (tailRef.current.maxAge * 0.7),
                0,
                1,
                1,
              );

        intensity *= point.force;
        const radius = tailRef.current.size * tailRef.current.radius * intensity;
        const grd = tailCtx.createRadialGradient(pos.x, pos.y, radius * 0.25, pos.x, pos.y, radius);

        grd.addColorStop(0, `rgba(${tailRef.current.red}, 255, 255, 0.2)`);
        grd.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

        tailCtx.beginPath();
        tailCtx.fillStyle = grd;
        tailCtx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        tailCtx.fill();
      }
    });

    tailTexture.needsUpdate = true;
  };

  const handlePointerMove = (e, meshRef) => {
    const uv = e.uv;
    let force = 0;
    const last = tailRef.current.array[tailRef.current.array.length - 1];
    if (last) {
      const dx = last.x - uv.x;
      const dy = last.y - uv.y;
      force = Math.min((dx * dx + dy * dy) * 10000, 1);
    }
    tailRef.current.array.push({ x: uv.x, y: uv.y, age: 0, force });

    if (meshRef.current) {
      meshRef.current.rotation.y = e.pointer.x / 8;
      meshRef.current.rotation.x = -e.pointer.y / 8;
    }
  };

  return { tailTexture, drawTail, handlePointerMove };
}
