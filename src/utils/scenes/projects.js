// Content for the telescope-lens project viewer (see ProjectLens). Keyed by
// the same `id` as CONSTELLATIONS in constellations.js - that's what joins a
// clicked constellation to the project it opens, without coupling the two
// data sets together. Hardcoded/curated by hand, not fetched, so keep
// `description` short enough to read comfortably inside the lens circle
// (it scrolls if it overflows, but that shouldn't be the common case).
export const PROJECTS = [
  {
    id: 'cassiopeia',
    title: 'cassiopeia',
    summary: 'One-line summary of what this project is.',
    description: 'Placeholder description. Replace with real project copy.',
    tags: [],
    links: [],
  },
  {
    id: 'ursa-minor',
    title: 'ursa-minor',
    summary: 'One-line summary of what this project is.',
    description: 'Placeholder description. Replace with real project copy.',
    tags: [],
    links: [],
  },
  {
    id: 'ursa-major',
    title: 'ursa-major',
    summary: 'One-line summary of what this project is.',
    description: 'Placeholder description. Replace with real project copy.',
    tags: [],
    links: [],
  },
  {
    id: 'orion',
    title: 'orion',
    summary: 'One-line summary of what this project is.',
    description: 'Placeholder description. Replace with real project copy.',
    tags: [],
    links: [],
  },
  {
    id: 'scorpius',
    title: 'scorpius',
    summary: 'One-line summary of what this project is.',
    description: 'Placeholder description. Replace with real project copy.',
    tags: [],
    links: [],
  },
];

export const getProjectById = (id) => PROJECTS.find((p) => p.id === id);
