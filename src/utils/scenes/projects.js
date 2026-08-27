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
