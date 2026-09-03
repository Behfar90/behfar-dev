export const PROJECTS = [
  {
    id: 'cassiopeia',
    title: 'Design System',
    company: 'Lyse',
    logo: '/logo/logo-lyse.svg',
    website: 'https://www.lyse.no',
    summary: "A component library used by 20+ teams across Lyse's brands.",
    description:
      'Frontend developer for a Web-Components-in-core design system unifying multiple brands under one accessible UI layer — versioned packages, WCAG 2.1 governance, built with designers in Figma.',
    tags: ['React', 'Web Components', 'Stencil', 'Figma', 'WCAG 2.1'],
    links: [
      { url: 'https://form.lyse.com/1871d97fb/p/85d5d2-form-design-system', label: 'Learn more' },
    ],
  },
  {
    id: 'ursa-minor',
    title: 'Pit Stop',
    company: 'Equinor',
    logo: '/logo/logo-equinor.png',
    website: 'https://www.equinor.com',
    summary: 'A decision-management tool that replaced SharePoint, PowerPoint, and email chaos.',
    description:
      'Helped a large enterprise turn a fragmented approval workflow into one secure tool. React/TypeScript frontends, extending into C#/.NET when needed, on an Azure-based PaaS.',
    tags: ['React', 'TypeScript', 'C#/.NET', 'Azure'],
    links: [],
  },
  {
    id: 'ursa-major',
    title: 'Sports Analytics',
    company: 'Sportradar',
    logo: '/logo/logo-sportradar.svg',
    website: 'https://sportradar.com',
    summary: 'Real-time analytics for betting operators.',
    description:
      'Modernized a legacy React codebase — class components to hooks — then hunted performance bottlenecks with profiling and memoization, cutting re-renders by roughly 40%.',
    tags: ['React', 'Performance', 'Profiling'],
    links: [
      { url: 'https://sportradar.com/media-tech/data-content/radar-360/', label: 'Learn more' },
    ],
  },
  {
    id: 'orion',
    title: 'Calendar',
    company: 'Time and Date',
    logo: '/logo/logo-timeanddate.png',
    noLogoFilter: true,
    website: 'https://www.timeanddate.com',
    summary: 'A calendar platform serving 400k–500k people a day.',
    description:
      'Primary frontend engineer building interactive Vue 2 components wired to Rust REST APIs and a localization backend. Cut average page load time by 20%.',
    tags: ['Vue', 'Sass', 'Rust', 'Performance'],
    links: [],
  },
  {
    id: 'scorpius',
    title: 'This Website',
    summary: "The universe you're standing in right now.",
    description:
      'Built with React, Three.js, and WebGL — custom GLSL shaders, hand-rolled scroll and mouse-driven camera work, tuned to hold 60fps in the browser.',
    tags: ['React', 'Three.js', 'WebGL', 'GLSL', 'GSAP'],
    links: [],
  },
];

export const getProjectById = (id) => PROJECTS.find((p) => p.id === id);
