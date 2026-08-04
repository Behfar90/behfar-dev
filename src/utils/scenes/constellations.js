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
    mythIllustration: { url: '/png/cassiopeia.png', x: -15, y: -30, width: 200, height: 200 },
    // Star positions are real landmarks on cassiopeia.png itself (crown
    // tip, both throne finials, both hands on the armrests), read off a
    // pixel grid overlaid on the source PNG and converted through the
    // mythIllustration's own offset/scale - not arbitrary points floating
    // near the figure. Traces a W across her full upper body instead of a
    // cramped zigzag that only lived above the shoulders.
    stars: [
      { x: 51, y: 12 }, // left throne finial
      { x: 44, y: 69 }, // left hand
      { x: 85, y: -9 }, // crown tip
      { x: 130, y: 69 }, // right hand
      { x: 118, y: 12 }, // right throne finial
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
    labelAnchor: { x: 85, y: 106 },
  },
  {
    id: 'ursa-minor',
    name: 'Ursa Minor',
    viewBox: '0 0 135 195',
    position: { top: '6%', left: '70%' },
    size: { width: 162, height: 234 },
    // ursa-minor.png is a tall/narrow standing bear. Same Little Dipper
    // form as before (Polaris at the handle tip near the head/ear, the
    // handle descending through the neck/shoulder, the bowl in the
    // torso), scaled up ~22% around its own centroid to cover more of the
    // illustration, with the illustration's own offset shifted to match -
    // every star's new position was searched against the actual alpha
    // channel (not a bounding-box guess) to land it back on solid bear
    // silhouette at the larger size.
    mythIllustration: { url: '/png/ursa-minor.png', x: -26.9, y: -17.9, width: 221, height: 221 },
    stars: [
      { x: 104.5, y: 24.1 }, // Polaris (handle tip), near the ear
      { x: 89.4, y: 45.7 }, // Yildun, neck
      { x: 73.2, y: 72.6 }, // epsilon UMi, shoulder
      { x: 59.7, y: 99.6 }, // zeta UMi (bowl/handle junction)
      { x: 92, y: 105 }, // eta UMi
      { x: 86.7, y: 137.3 }, // Pherkad
      { x: 59.7, y: 131.9 }, // Kochab
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 3],
    ],
    labelAnchor: { x: 82, y: 157 },
  },
  {
    id: 'ursa-major',
    name: 'Ursa Major',
    viewBox: '0 0 220 175',
    position: { top: '49%', left: '63%' },
    size: { width: 275, height: 219 },
    // Same Big Dipper schematic form as before (Dubhe/Merak/Phecda/Megrez
    // bowl, Alioth/Mizar/Alkaid handle - the ones actually used in most
    // illustrations, since the stars' real RA/Dec proportions are almost
    // perfectly flat/collinear and read as a straight line of dots), now
    // scaled up ~66% around its own centroid to cover much more of the
    // illustration, with the illustration's own offset shifted to match -
    // every star's new position was searched against the actual alpha
    // channel (not a bounding-box guess) to land it back on solid bear
    // silhouette at the larger size.
    mythIllustration: { url: '/png/ursa-major.png', x: -37, y: -89.6, width: 273.3, height: 273.3 },
    stars: [
      { x: 27.1, y: 18 }, // Dubhe
      { x: 15.2, y: 50.5 }, // Merak
      { x: 48.7, y: 72 }, // Phecda
      { x: 66.2, y: 36.8 }, // Megrez (bowl/handle junction)
      { x: 100, y: 44.6 }, // Alioth
      { x: 134, y: 52.4 }, // Mizar
      { x: 171.2, y: 38.4 }, // Alkaid
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [3, 4],
      [4, 5],
      [5, 6],
    ],
    labelAnchor: { x: 93, y: 92 },
  },
  {
    id: 'orion',
    name: 'Orion',
    viewBox: '0 0 130 210',
    position: { top: '38%', left: '24%' },
    size: { width: 150, height: 242 },
    // A bit of tilt for dynamism, matching the lunging pose already baked
    // into the artwork - just a flag; the actual rotation is a CSS class
    // (Constellations.module.css's `.tilt`) applied in Constellations.jsx,
    // scoped to exclude the label so hover text stays upright.
    rotation: 12,
    mythIllustration: { url: '/png/orion.png', x: -155, y: 1, width: 393, height: 229 },
    // Expanded to a fuller figure: head, both shoulders, the raised club
    // and shield/pelt he's holding, the belt, a hanging sword, and both
    // feet - all real landmarks read off orion.png. Bigger/wider than the
    // previous 7-star version per request.
    stars: [
      { x: 18, y: 15 }, // club tip
      { x: 16, y: 76 }, // left shoulder
      { x: 38, y: 47 }, // head
      { x: 58, y: 79 }, // right shoulder
      { x: 114, y: 77 }, // shield tip
      { x: 31, y: 117 }, // belt left
      { x: 41, y: 117 }, // belt mid
      { x: 52, y: 117 }, // belt right
      { x: 41, y: 139 }, // sword
      { x: 41, y: 160 }, // sword tip
      { x: 15, y: 194 }, // front foot
      { x: 78, y: 186 }, // back foot
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [1, 5],
      [3, 7],
      [5, 6],
      [6, 7],
      [6, 8],
      [8, 9],
      [5, 10],
      [7, 11],
    ],
    // Static (not rotated) - placed below where the tilted figure's lowest
    // point (the back foot, post-rotation) actually lands, since the label
    // sits outside the rotated group now.
    labelAnchor: { x: 58, y: 210 },
  },
  {
    id: 'scorpius',
    name: 'Scorpius',
    viewBox: '0 0 160 165',
    position: { top: '36%', left: '46%' },
    size: { width: 184, height: 190 },
    // scorpius.png (500x500, real alpha) shows the pincers at bottom-left
    // and the tail curling up and over to a hooked stinger at top-right.
    mythIllustration: { url: '/png/scorpius.png', x: -20, y: -10, width: 200, height: 200 },
    // Double-jointed claws (tip + elbow, each side) and a smoother
    // multi-segment tail curl - real landmarks read off the PNG.
    stars: [
      { x: 17, y: 94 }, // upper pincer tip
      { x: 36, y: 86 }, // upper pincer elbow
      { x: 32, y: 96 }, // lower pincer elbow
      { x: 12, y: 105 }, // lower pincer tip
      { x: 60, y: 82 }, // claw base
      { x: 78, y: 70 }, // head
      { x: 96, y: 72 }, // thorax
      { x: 116, y: 62 }, // tail
      { x: 124, y: 52 }, // tail
      { x: 130, y: 38 }, // tail
      { x: 128, y: 16 }, // tail curling over
      { x: 101, y: 31 }, // stinger barb
      { x: 106, y: 28 }, // stinger tip
    ],
    lines: [
      [0, 1],
      [1, 4],
      [3, 2],
      [2, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 9],
      [9, 10],
      [10, 11],
      [11, 12],
    ],
    labelAnchor: { x: 70, y: 130 },
  },
];
