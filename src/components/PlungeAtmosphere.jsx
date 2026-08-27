import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PLUNGE_START } from '../utils/scenes/universeTiming';

gsap.registerPlugin(ScrollTrigger);

// The one place in the app that reaches for GSAP's ScrollTrigger rather
// than the hand-rolled scroll-listener pattern used everywhere else (see
// useScrollJourney.js, BackgroundStars.jsx, useProjectsSceneAnimation.js) -
// deliberately, not by drift: this is choreographing several CSS custom
// properties together across one scroll range (see the timeline below),
// which is exactly what ScrollTrigger's scrub is for, and would otherwise
// mean hand-writing and re-tuning several more lerp/smoothstep calls by
// hand. The actual 3D camera motion for the plunge, and the real 3D smoke
// that now carries the "haze washing in" role a flat CSS gradient used to
// (see smoke.js, driven from Universe.jsx's own tick loop), both stay in
// Universe.jsx, untouched by GSAP - this component renders nothing itself;
// it only sets CSS custom properties on the document root, which
// Universe.module.css's .webgl and .blackout read independently. Both
// live scoped inside Universe's own .sticky box (not here, and not as a
// viewport-fixed overlay) so the blackout wash can only ever darken
// Universe's own box, never bleed onto Projects' entrance sliding in
// underneath during the same scroll range.
//
// Deliberately computes plain pixel scrollY targets by hand rather than
// ScrollTrigger's own "trigger-relative vh/px offset" string syntax (e.g.
// `bottom-=60vh`) - that syntax's "vh" means real *viewport* height, not
// universeTiming.js's proportional *_VH units (which are shares of the
// wrapper's own total height), and the two don't convert 1:1. Computing
// scrollY directly the same way useScrollJourney.js already does keeps
// this in exact lockstep with orbitProgress/PLUNGE_START, no unit mismatch
// possible.
export default function PlungeAtmosphere({ universeWrapperRef }) {
  useEffect(() => {
    const universeEl = universeWrapperRef.current;
    if (!universeEl) return undefined;

    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Three scrollY landmarks, all derived from .orbitWrapper's own live
    // dimensions (recomputed on every ScrollTrigger refresh, so a resize
    // can't leave these stale):
    //  - riseStart: where Universe.jsx's orbitTarget switches into its
    //    plunge branch (orbitProgress === PLUNGE_START) - the canvas
    //    starts zooming/blurring exactly as the camera starts diving.
    //  - riseEnd: orbitProgress === 1, where the camera's dive is fully
    //    settled AND - because of how CSS `position: sticky` works -
    //    exactly where Universe's canvas starts its final slide out of
    //    view (it doesn't just vanish here; that takes one more full
    //    viewport-height of scroll, which is riseEnd..fallEnd below).
    //  - fallEnd: .orbitWrapper's true bottom edge - the scrollY at which
    //    the canvas has fully slid off-screen and Projects' own sticky
    //    pin has fully engaged. Universe's canvas is visibly sliding away
    //    for the *entire* riseEnd..fallEnd stretch, not just the start of
    //    it - so the blackout below has to stay opaque for (almost) the
    //    whole thing, only clearing right at the end, or the tail of that
    //    slide is left exposed with nothing covering it (a real bug this
    //    replaced - Universe's own content was still visible while
    //    scrolling into Projects). It also can't stay opaque exactly up
    //    to fallEnd itself, or it's left sitting over Projects' own
    //    entrance animation (useProjectsSceneAnimation.js's constellations
    //    descending / terrain layers rising, driven purely by scrollY
    //    against Projects' own wrapper - it plays out correctly
    //    regardless, but a lingering overlay hides it).
    const getLandmarks = () => {
      const scrollable = universeEl.offsetHeight - window.innerHeight;
      const riseStart = universeEl.offsetTop + PLUNGE_START * scrollable;
      const riseEnd = universeEl.offsetTop + scrollable;
      const fallEnd = universeEl.offsetTop + universeEl.offsetHeight;
      return { riseStart, riseEnd, fallEnd };
    };

    // Tween "durations" below are real pixel distances, not seconds - scrub
    // only cares about their proportions to one another, and authoring them
    // this way guarantees the peak (fully zoomed/blurred) lands exactly at
    // riseEnd regardless of viewport height, without hand-tuned fractional
    // timeline positions that could drift out of sync with the real
    // rise/fall pixel distances.
    const { riseStart, riseEnd, fallEnd } = getLandmarks();
    const riseDistance = riseEnd - riseStart;
    const fallDistance = fallEnd - riseEnd;

    // A real baseline, not an unset property - an unset custom property
    // reads back as an empty string, which GSAP coerces to 0 rather than
    // any of these tweens' own intended resting values, which caused a
    // visible collapse-toward-invisible glitch when reversing scroll back
    // past a tween that hadn't started yet. Combined with immediateRender:
    // false below (so the tweens themselves don't immediately stomp this
    // on creation), ScrollTrigger's own setup-time refresh is left to
    // render whatever the real, current scroll position actually dictates.
    gsap.set(root, {
      '--plunge-scale': 1,
      '--plunge-blur': '0px',
      '--plunge-blackout': 0,
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: universeEl,
        start: () => getLandmarks().riseStart,
        end: () => getLandmarks().fallEnd,
        scrub: true,
        invalidateOnRefresh: true,
      },
    });

    // Rise: the canvas zooms/blurs as the camera dives (Act II) - every
    // tween below spans its full phase with no gap (all start at 0, or all
    // start at riseDistance) and spells out both `from` and `to` explicitly
    // (fromTo, not to) with immediateRender: false - see the gsap.set()
    // call above for why. A property with no tween covering a given point
    // in the timeline renders as 0, not its nearest neighbor's value - an
    // earlier version staggered a tween to start a beat after another one,
    // which left exactly such a gap and made a property snap to 0 (not its
    // resting value) anywhere reverse-scrolled back into that gap.
    if (!reduceMotion) {
      tl.fromTo(
        root,
        { '--plunge-scale': 1, '--plunge-blur': '0px' },
        {
          '--plunge-scale': 1.35,
          '--plunge-blur': '7px',
          ease: 'none',
          duration: riseDistance,
          immediateRender: false,
        },
        0,
      );
    }

    // Fall: three explicit phases spanning the *entire* fallDistance, so
    // the screen is never left uncovered while Universe's canvas is still
    // mid-slide-away (see the fallEnd comment above):
    //  - Ramp (0-30%): the blackout fades in as smoke (see Universe.jsx's
    //    smokeOpacity, resolved on the exact same 0-30% window) fades out
    //    - a clean crossfade handoff from one cover to the other, not a
    //    race between them.
    //  - Hold (30-90%): stays fully opaque. This needs an explicit
    //    from/to-identical tween, not just leaving a gap here - a
    //    property with no tween covering a given point in the timeline
    //    renders as 0, not its neighbor's value (the exact bug already
    //    hit twice this session for other properties on this same
    //    timeline, applied here preemptively).
    //  - Clear (90-98%): fades back to 0, finishing with a safety margin
    //    *before* fallEnd (98%, not 100%) so ordinary scroll
    //    jitter/momentum can never leave a sliver of residual black over
    //    Projects' first frame.
    tl.fromTo(
      root,
      { '--plunge-blackout': 0 },
      {
        '--plunge-blackout': 1,
        ease: 'none',
        duration: fallDistance * 0.3,
        immediateRender: false,
      },
      riseDistance,
    );
    tl.fromTo(
      root,
      { '--plunge-blackout': 1 },
      { '--plunge-blackout': 1, ease: 'none', duration: fallDistance * 0.6, immediateRender: false },
      riseDistance + fallDistance * 0.3,
    );
    tl.fromTo(
      root,
      { '--plunge-blackout': 1 },
      {
        '--plunge-blackout': 0,
        ease: 'none',
        duration: fallDistance * 0.08,
        immediateRender: false,
      },
      riseDistance + fallDistance * 0.9,
    );
    if (!reduceMotion) {
      tl.fromTo(
        root,
        { '--plunge-scale': 1.35, '--plunge-blur': '7px' },
        {
          '--plunge-scale': 1,
          '--plunge-blur': '0px',
          ease: 'none',
          duration: fallDistance * 0.3,
          immediateRender: false,
        },
        riseDistance,
      );
    }

    // Anchor - a zero-effect placeholder at the timeline's true end
    // (riseDistance + fallDistance, i.e. fallEnd). Without this, no tween
    // above reaches that point (they all resolve early on purpose, see the
    // fall-phase comment), so GSAP's own tl.duration() would shrink to
    // whichever tween finishes last - and scrub maps scroll *fraction*
    // (0-1 across riseStart..fallEnd) onto that duration, not literal
    // pixels. A shorter tl.duration() than the real scroll range silently
    // rescales every tween's timing, breaking the "duration in pixels"
    // trick every tween above relies on. This keeps tl.duration() locked
    // to the real range regardless of how early everything else resolves.
    tl.set(root, {}, riseDistance + fallDistance);

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
      gsap.set(root, {
        '--plunge-scale': 1,
        '--plunge-blur': '0px',
        '--plunge-blackout': 0,
      });
    };
  }, [universeWrapperRef]);

  return null;
}
