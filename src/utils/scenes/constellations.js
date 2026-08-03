// Simplified, recognizable constellation line-art (not literal star-chart
// accuracy). Each constellation is its own small, independently-positioned
// element (position/size below), not a shared canvas - a single big shared
// viewBox got compressed hard on narrow/short viewports (that's what was
// making constellations shrink to near-invisible sub-pixel dots there), and
// it also couldn't give each shape its own independent scroll-driven
// transform (CSS transforms on elements *inside* an SVG resolve in the
// SVG's own user-coordinate space, not real screen pixels, so the shared
// vh-based scroll math from Projects.jsx didn't translate correctly to
// individual <g> children). A standalone <svg> per constellation - the same
// treatment MoonPhase already gets - sidesteps both problems: its own
// `transform` is a normal CSS box transform (real px, correct), and its own
// tight viewBox+fixed pixel size means it never gets crushed by the overall
// page's aspect ratio.
//
// `position` is top/left % of the Projects sticky container. `size` is the
// rendered CSS px width/height (viewBox scaled to fit, aspect preserved).
export const CONSTELLATIONS = [
  {
    id: 'cassiopeia',
    name: 'Cassiopeia',
    viewBox: '0 0 170 109',
    position: { top: '8%', left: '16%' },
    size: { width: 210, height: 135 },
    // First-pass placement, same approach as orion below: center the
    // (roughly centered-in-its-own-canvas) illustration on the star
    // pattern's centroid, nudged down slightly since the seated queen's
    // body extends below the zigzag more than above it.
    mythIllustration: { url: '/cassiopeia.png', x: -15, y: -30, width: 200, height: 200 },
    stars: [
      { x: 15, y: 15 },
      { x: 50, y: 22 },
      { x: 85, y: 57 },
      { x: 120, y: 15 },
      { x: 155, y: 50 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
    labelAnchor: { x: 85, y: 94 },
  },
  {
    id: 'ursa-minor',
    name: 'Ursa Minor',
    viewBox: '0 0 123 121',
    position: { top: '4%', left: '66%' },
    size: { width: 160, height: 158 },
    mythIllustration: { url: '/ursa-minor.png', x: -23, y: -30, width: 170, height: 170 },
    stars: [
      { x: 15, y: 59 },
      { x: 39, y: 48 },
      { x: 48, y: 68 },
      { x: 24, y: 79 },
      { x: 64, y: 35 },
      { x: 87, y: 17 },
      { x: 108, y: 15 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [1, 4],
      [4, 5],
      [5, 6],
    ],
    labelAnchor: { x: 60, y: 106 },
  },
  {
    id: 'ursa-major',
    name: 'Ursa Major',
    viewBox: '0 0 232 128',
    position: { top: '26%', left: '66%' },
    size: { width: 320, height: 177 },
    mythIllustration: { url: '/ursa-major.png', x: -24, y: -80, width: 280, height: 280 },
    stars: [
      { x: 15, y: 15 },
      { x: 74, y: 28 },
      { x: 86, y: 73 },
      { x: 20, y: 86 },
      { x: 132, y: 15 },
      { x: 178, y: 22 },
      { x: 217, y: 47 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [1, 4],
      [4, 5],
      [5, 6],
    ],
    labelAnchor: { x: 115, y: 113 },
  },
  {
    id: 'orion',
    name: 'Orion',
    viewBox: '0 0 119 190',
    position: { top: '38%', left: '28%' },
    size: { width: 130, height: 208 },
    // Sized/positioned so the hunter figure baked into the image (roughly
    // the middle third of the source PNG, not the full canvas) lines up
    // with the star pattern below. Rendered as-is - this file has real
    // alpha transparency, so no masking is needed.
    mythIllustration: { url: '/orion.png', x: -70, y: 8, width: 249, height: 145 },
    stars: [
      { x: 15, y: 15 },
      { x: 104, y: 23 },
      { x: 44, y: 68 },
      { x: 64, y: 75 },
      { x: 84, y: 63 },
      { x: 12, y: 135 },
      { x: 102, y: 143 },
    ],
    lines: [
      [0, 2],
      [1, 4],
      [2, 3],
      [3, 4],
      [2, 5],
      [4, 6],
    ],
    labelAnchor: { x: 54, y: 175 },
  },
  {
    id: 'scorpius',
    name: 'Scorpius',
    viewBox: '0 0 154 202',
    position: { top: '36%', left: '55%' },
    size: { width: 168, height: 220 },
    mythIllustration: { url: '/scorpius.png', x: -70, y: 8, width: 249, height: 145 },
    stars: [
      { x: 15, y: 28 },
      { x: 35, y: 15 },
      { x: 41, y: 41 },
      { x: 67, y: 48 },
      { x: 100, y: 61 },
      { x: 126, y: 88 },
      { x: 139, y: 119 },
      { x: 126, y: 152 },
      { x: 93, y: 165 },
    ],
    lines: [
      [0, 2],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
    ],
    labelAnchor: { x: 75, y: 187 },
  },
];
