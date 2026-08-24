export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function clamp01(t) {
  return Math.min(1, Math.max(0, t));
}

export function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}
