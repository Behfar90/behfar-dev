// Shared between Universe.jsx (camera arrival + caption start + plunge
// start) and ShootingStarIntro.jsx (subtitle dissolve/gather story) so
// their timing can't silently drift apart - see Universe.jsx for how these
// are wired together around each boundary. Everything in that first beat
// (camera arrival, text fade, outgoing/incoming dust) is defined as a
// fraction of SUBTITLE_STORY_END, so bumping it slows the whole beat
// uniformly.
//
// Every constant below is expressed as a physical scroll distance (vh),
// then divided by the wrapper's grand total to get the fraction
// orbitProgress actually deals in - so extending the journey with a new
// beat (as PLUNGE_VH does) can dedicate it fresh scroll distance without
// silently stretching any existing beat's own physical length. This is the
// same principle each earlier extension here already followed by hand
// (adding a subtitle used to mean adding 2*BEAT_WIDTH rather than
// narrowing the existing beats to fit) - just made explicit so it no
// longer has to be re-derived by hand each time.
//
// BEAT_VH (60) is one "beat" unit - SUBTITLE_BEAT_COUNT of them make up the
// intro/subtitle beat (1 per subtitle chapter, plus one dissolve-out per
// chapter except the last, plus the very first subtitle's own dissolve -
// see ShootingStarIntro.jsx's Scene for beatCount). CAPTION_VH (30, half a
// beat) is unchanged from when storyEnd's denominator alone spanned the
// rest of the scroll - see git history for why 30 specifically. PLUNGE_VH
// is new: one full beat's worth of scroll dedicated to Act II (the camera
// diving toward the origin - see Universe.jsx's orbitTarget) before
// Projects takes over. Universe.module.css's .orbitWrapper height must be
// kept equal to TOTAL_VH below - CSS can't import this file, so that's a
// hand-kept-in-sync value there, not a coincidence.
const BEAT_VH = 60;
const SUBTITLE_BEAT_COUNT = 4;
const INTRO_VH = BEAT_VH * SUBTITLE_BEAT_COUNT;

const CAPTION_VH = 30;
const CAPTION_COUNT = 4;
const CAPTIONS_VH = CAPTION_VH * CAPTION_COUNT;

// Four beats, not one - two still read as too short. The fixed one-
// viewport-height "fall" after it (Universe.module.css's .sticky
// un-pinning, see PlungeAtmosphere.jsx) isn't part of this budget at all -
// it can't be shortened by changing this constant, since that distance
// comes from `position: sticky` geometry, not from anything measured in
// these *_VH units.
export const PLUNGE_VH = BEAT_VH * 4;

export const TOTAL_VH = INTRO_VH + CAPTIONS_VH + PLUNGE_VH;

export const SUBTITLE_STORY_END = INTRO_VH / TOTAL_VH;
export const PLUNGE_START = (INTRO_VH + CAPTIONS_VH) / TOTAL_VH;
