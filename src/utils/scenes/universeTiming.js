// Shared between Universe.jsx (camera arrival + caption start) and
// ShootingStarIntro.jsx (subtitle dissolve/gather story) so their timing
// can't silently drift apart - see Universe.jsx for how the two are wired
// together around this boundary.
export const SUBTITLE_STORY_END = 0.3;
