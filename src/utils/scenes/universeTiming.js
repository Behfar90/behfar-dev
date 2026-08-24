// Shared between Universe.jsx (camera arrival + caption start) and
// ShootingStarIntro.jsx (subtitle dissolve/gather story) so their timing
// can't silently drift apart - see Universe.jsx for how the two are wired
// together around this boundary. Everything in that first beat (camera
// arrival, text fade, outgoing/incoming dust) is defined as a fraction of
// this one value, so bumping it slows the whole beat uniformly.
//
// Its value is BEAT_WIDTH (1/6) times however many beats
// ShootingStarIntro.jsx's SUBTITLE_CHAPTERS currently needs (one gather-in
// per chapter, plus one dissolve-out per chapter except the last, plus the
// very first subtitle's own dissolve - see Scene's beatCount there). 1/6
// was where storyEnd/2 landed back when there were only 2 such beats (the
// original subtitle's dissolve and the second subtitle's gather-in) - so
// adding a subtitle extends storyEnd by 2*BEAT_WIDTH rather than narrowing
// the existing beats to fit; every individual transition keeps the exact
// pace it always had, at the cost of the whole story (and so the camera's
// own pull-back-and-pan, which eases across this same window) taking
// longer.
//
// This no longer keeps pace 1-for-1 with captions the way storyEnd = 1/3
// briefly did (see git history) - each caption's window is now
// (1-storyEnd)/4 = 1/12, half a subtitle beat's 1/6. Re-derive via
// Universe.module.css's wrapper height (as was done for that) if captions
// should catch back up to this pace too.
const BEAT_WIDTH = 1 / 6;
const SUBTITLE_BEAT_COUNT = 4; // 1 (first subtitle) + 2 per later chapter, minus the last chapter's dissolve-out
export const SUBTITLE_STORY_END = BEAT_WIDTH * SUBTITLE_BEAT_COUNT;
