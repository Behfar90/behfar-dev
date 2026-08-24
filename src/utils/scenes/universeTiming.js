// Shared between Universe.jsx (camera arrival + caption start) and
// ShootingStarIntro.jsx (subtitle dissolve/gather story) so their timing
// can't silently drift apart - see Universe.jsx for how the two are wired
// together around this boundary. Everything in that first beat (camera
// arrival, text fade, outgoing/incoming dust) is defined as a fraction of
// this one value, so bumping it slows the whole beat uniformly.
//
// Its value is chosen so every "beat" of the intro - the subtitle's own
// two (outgoing dust, incoming dust, each storyEnd/2 wide) plus each of
// the 4 captions' (each (1-storyEnd)/4 wide) - ends up the same width,
// i.e. storyEnd/2 = (1-storyEnd)/4, which solves to storyEnd = 1/3. (If
// ORBIT_CAPTIONS in Universe.jsx ever gains/loses an entry, recompute via
// storyEnd = 2 / (captionCount + 2) to keep the pace matched.)
//
// Universe.module.css's .orbitWrapper height was extended alongside this
// so the subtitle's own on-screen pace (physical scroll distance, not
// just its share of orbitProgress) stays exactly what it was before this
// was introduced - only the captions' pace changed, to catch up to it.
export const SUBTITLE_STORY_END = 1 / 3;
