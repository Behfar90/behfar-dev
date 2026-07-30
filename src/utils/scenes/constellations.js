// Simplified, recognizable constellation line-art (not literal star-chart
// accuracy) sharing one 1000x500 viewBox with Constellations.jsx. Placement
// keeps every shape clear of the top-center band where Projects.jsx's
// "More to come" heading sits, and clear of each other.
export const CONSTELLATIONS = [
  {
    id: 'cassiopeia',
    name: 'Cassiopeia',
    stars: [
      { x: 60, y: 53 },
      { x: 95, y: 60 },
      { x: 130, y: 95 },
      { x: 165, y: 53 },
      { x: 200, y: 88 },
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
    label: 'Cassiopeia',
    labelAnchor: { x: 130, y: 132 },
  },
  {
    id: 'ursa-minor',
    name: 'Ursa Minor',
    stars: [
      { x: 680, y: 61 },
      { x: 704, y: 50 },
      { x: 713, y: 70 },
      { x: 689, y: 81 },
      { x: 729, y: 37 },
      { x: 752, y: 19 },
      { x: 773, y: 17 },
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
    label: 'Ursa Minor',
    labelAnchor: { x: 725, y: 108 },
  },
  {
    id: 'ursa-major',
    name: 'Ursa Major',
    stars: [
      { x: 760, y: 167 },
      { x: 819, y: 180 },
      { x: 831, y: 225 },
      { x: 765, y: 238 },
      { x: 877, y: 167 },
      { x: 923, y: 174 },
      { x: 962, y: 199 },
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
    label: 'Ursa Major',
    labelAnchor: { x: 860, y: 265 },
  },
  {
    id: 'orion',
    name: 'Orion',
    // Shifted up from an earlier revision that put its legs right at the
    // terrain's horizon line - the sky layer's "meet" scaling and the
    // terrain's "slice" scaling don't share a scale factor, so keeping a
    // healthy vertical margin above the horizon matters more than exact
    // placement. Confirmed clear at phone/laptop/ultrawide sizes.
    stars: [
      { x: 296, y: 180 },
      { x: 385, y: 188 },
      { x: 325, y: 233 },
      { x: 345, y: 240 },
      { x: 365, y: 228 },
      { x: 293, y: 300 },
      { x: 383, y: 308 },
    ],
    lines: [
      [0, 2],
      [1, 4],
      [2, 3],
      [3, 4],
      [2, 5],
      [4, 6],
    ],
    label: 'Orion',
    labelAnchor: { x: 335, y: 340 },
  },
  {
    id: 'scorpius',
    name: 'Scorpius',
    // Shifted up for the same horizon-clearance reason as Orion above.
    stars: [
      { x: 560, y: 183 },
      { x: 580, y: 170 },
      { x: 586, y: 196 },
      { x: 612, y: 203 },
      { x: 645, y: 216 },
      { x: 671, y: 243 },
      { x: 684, y: 274 },
      { x: 671, y: 307 },
      { x: 638, y: 320 },
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
    label: 'Scorpius',
    labelAnchor: { x: 620, y: 342 },
  },
];
