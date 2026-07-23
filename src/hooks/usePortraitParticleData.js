import { useMemo } from 'react';

// Samples a loaded texture's image onto a small offscreen canvas and turns
// each pixel above `threshold` into a particle offset, for PortraitParticles.
export default function usePortraitParticleData(texture, threshold) {
  return useMemo(() => {
    if (!texture || !texture.image) return { visiblePoints: 0 };
    const img = texture.image;

    const MAX_WIDTH = 250;
    const ratio = img.height / img.width;
    const w = MAX_WIDTH;
    const h = Math.floor(MAX_WIDTH * ratio);
    const totalPoints = w * h;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    ctx.translate(0, h);
    ctx.scale(1, -1);
    ctx.drawImage(img, 0, 0, w, h);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = Float32Array.from(imgData.data);

    let visible = 0;
    for (let i = 0; i < totalPoints; i++) {
      if (data[i * 4 + 0] > threshold) visible++;
    }

    const offsets = new Float32Array(visible * 3);
    const pindices = new Float32Array(visible);
    const angles = new Float32Array(visible);

    let j = 0;
    for (let i = 0; i < totalPoints; i++) {
      if (data[i * 4 + 0] <= threshold) continue;
      offsets[j * 3 + 0] = i % w;
      offsets[j * 3 + 1] = Math.floor(i / w);
      pindices[j] = i;
      angles[j] = Math.random() * Math.PI;
      j++;
    }

    const fovHeight = 2 * Math.tan((50 * Math.PI) / 180 / 2) * 180;
    const fModifier = window.innerWidth / window.innerHeight < 2.8 ? -0.2 : 0.1;
    const scale = fovHeight / h + fModifier;

    return {
      offsets,
      angles,
      pindices,
      gridW: w,
      gridH: h,
      visiblePoints: visible,
      meshScale: scale,
    };
  }, [texture, threshold]);
}
