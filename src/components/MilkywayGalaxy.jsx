import { useEffect, useRef } from 'react';
import styles from './MilkywayGalaxy.module.css';

// Config for the static milky way field. Star/cluster points are drawn with
// additive ('lighter') blending - see drawStaticMilkyWay - so density does
// the work of making the core "brighter": where points and cluster glows
// overlap most (the middle of the band), their alpha stacks up instead of
// just occluding each other like normal alpha compositing would. That's why
// whiteProportion only needs a small boost toward the center rather than
// forcing lightness way up there - forcing lightness up is what was washing
// the color out toward white before.
const mwStarCount = 20000;
const mwRandomStarProp = 0.2;
const mwClusterCount = 150;
const mwClusterStarCount = 400;
const mwClusterSize = 120;
const mwClusterSizeR = 80;
const mwClusterLayers = 5;
const mwAngle = 0.6;
const mwHueMin = 150;
const mwHueMax = 300;
// ~25% lower than the original 50-65: at hsla lightness 50-65% (and higher
// still toward the center), a hue barely reads as color at all - it's
// mostly white. Dropping the floor is what makes the clusters look colored
// rather than pale, while additive blending (not a higher lightness) is what
// makes the dense center look brighter.
const mwWhiteProportionMin = 38;
const mwWhiteProportionMax = 48;

// Config for shooting stars. Spawn timing is scheduled in real time (ms),
// not per-frame odds - see nextShootingStarAt in the effect below - so the
// cadence is exactly "one every N seconds" regardless of display refresh
// rate, instead of a per-frame coin flip whose real-world rate silently
// doubled on a 120Hz screen and could cluster several stars back to back.
const SHOOTING_STAR_MIN_GAP_MS = 5000;
const SHOOTING_STAR_MAX_GAP_MS = 7000;
const SHOOTING_STAR_LIFESPAN_MS = 1000;
// Below are the original per-frame px/frame speeds and tail-length, scaled
// to real-time units (assuming the original tuning targeted ~60fps) so the
// on-screen motion looks the same regardless of the display's refresh rate.
const SHOOTING_STAR_X_SPEED = 1800; // px/sec, symmetric random range
const SHOOTING_STAR_Y_SPEED_RANGE = 900; // px/sec, added to the base below
const SHOOTING_STAR_Y_SPEED_BASE = 120; // px/sec, minimum downward speed
const SHOOTING_STAR_TAIL_MS = 133; // how far back in time the tail gradient reaches
const shootingStarsColors = ['#a1ffba', '#a1d2ff', '#fffaa1', '#ffa1a1'];

// Redraws are ~68k canvas draw calls (20k stars + 150 clusters x ~320 points
// each) - fine once, but `resize` fires continuously while a window edge is
// being dragged, so that work is debounced rather than run on every event.
const RESIZE_DEBOUNCE_MS = 150;

class ShootingStar {
  constructor(x, y, speedX, speedY, color) {
    this.x = x;
    this.y = y;
    this.speedX = speedX; // px/sec
    this.speedY = speedY; // px/sec
    this.msLeft = SHOOTING_STAR_LIFESPAN_MS;
    this.color = color;
  }

  goingOut() {
    return this.msLeft <= 0;
  }

  ageModifier() {
    const half = SHOOTING_STAR_LIFESPAN_MS / 2;
    return (1.0 - Math.abs(this.msLeft - half) / half) ** 2;
  }

  draw(ctx) {
    const am = this.ageModifier();
    const tailSec = SHOOTING_STAR_TAIL_MS / 1000;
    const endX = this.x - this.speedX * tailSec * am;
    const endY = this.y - this.speedY * tailSec * am;
    const gradient = ctx.createLinearGradient(this.x, this.y, endX, endY);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(Math.min(am, 0.7), this.color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.strokeStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  update(ctx, dt) {
    this.msLeft -= dt;
    this.x += this.speedX * (dt / 1000);
    this.y += this.speedY * (dt / 1000);
    this.draw(ctx);
  }
}

// Renders one hazy star cluster: a scatter of tiny points sampled from
// concentric discs (the sqrt trick below fills each disc without a rejection
// loop), topped with a soft radial glow.
class MwStarCluster {
  constructor(x, y, size, hue, baseWhiteProportion, brightnessModifier) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.hue = hue;
    this.baseWhiteProportion = baseWhiteProportion;
    this.brightnessModifier = brightnessModifier;
  }

  draw(ctx) {
    const starsPerLayer = Math.floor(mwClusterStarCount / mwClusterLayers);
    for (let layer = 1; layer < mwClusterLayers; layer++) {
      const layerRadius = (this.size * layer) / mwClusterLayers;
      for (let i = 1; i < starsPerLayer; i++) {
        const posX = this.x + 2 * layerRadius * (Math.random() - 0.5);
        const posY =
          this.y +
          2 * Math.sqrt(layerRadius ** 2 - (this.x - posX) ** 2) * (Math.random() - 0.5);
        const size = 0.05 + Math.random() * 0.15;
        const alpha = 0.3 + Math.random() * 0.4;
        const whitePercentage =
          this.baseWhiteProportion + 8 + 8 * this.brightnessModifier + Math.floor(Math.random() * 10);
        ctx.beginPath();
        ctx.arc(posX, posY, size, 0, Math.PI * 2, false);
        ctx.fillStyle = `hsla(${this.hue},100%,${whitePercentage}%,${alpha})`;
        ctx.fill();
      }
    }

    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
    gradient.addColorStop(0, `hsla(${this.hue},100%,${this.baseWhiteProportion}%,0.0025)`);
    gradient.addColorStop(
      0.25,
      `hsla(${this.hue},100%,${this.baseWhiteProportion + 30}%,${0.0125 + 0.0125 * this.brightnessModifier})`,
    );
    gradient.addColorStop(0.4, `hsla(${this.hue},100%,${this.baseWhiteProportion + 15}%,0.006)`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
}

// Draws the whole milky way as a canvas-space band and canvas-space overlay,
// independent of Projects.jsx's usual sky components. Renders directly into
// the two <canvas> elements (mwCanvas, ssCanvas) so it stays a plain effect,
// not a React-composed tree of elements like the rest of the scene.
export default function MilkywayGalaxy() {
  const containerRef = useRef(null);
  const milkyWayRef = useRef(null);
  const shootingStarsRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const mwCanvas = milkyWayRef.current;
    const ssCanvas = shootingStarsRef.current;
    if (!container || !mwCanvas || !ssCanvas) return undefined;

    const mwCtx = mwCanvas.getContext('2d', { alpha: true });
    const ssCtx = ssCanvas.getContext('2d', { alpha: true });
    const dpr = window.devicePixelRatio || 1;

    let animationFrameId;
    let resizeTimeout;
    let width;
    let height;
    let shootingStars = [];

    const milkyWayX = () => Math.floor(Math.random() * width);
    const milkyWayYFromX = (xPos, mode) => {
      const offset = (width / 2 - xPos) * mwAngle;
      if (mode === 'star') {
        return (
          Math.floor(
            Math.random() ** 1.2 * height * (Math.random() - 0.5) + height / 2 + (Math.random() - 0.5) * 100,
          ) + offset
        );
      }
      return (
        Math.floor(
          Math.random() ** 1.5 * height * 0.6 * (Math.random() - 0.5) +
            height / 2 +
            (Math.random() - 0.5) * 100,
        ) + offset
      );
    };

    const drawStaticMilkyWay = () => {
      mwCtx.clearRect(0, 0, width, height);
      // Additive blending: where points/cluster glows overlap most (the
      // core of the band), their alpha stacks up into real brightness
      // instead of just painting over each other - see the config comment
      // above for why this is what "brighter center" is hung on here.
      mwCtx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < mwStarCount; i++) {
        mwCtx.beginPath();
        const xPos = milkyWayX();
        const yPos = Math.random() < mwRandomStarProp ? Math.floor(Math.random() * height) : milkyWayYFromX(xPos, 'star');
        mwCtx.arc(xPos, yPos, Math.random() * 0.27, 0, Math.PI * 2, false);
        mwCtx.fillStyle = `hsla(0,100%,100%,${0.4 + Math.random() * 0.6})`;
        mwCtx.fill();
      }
      for (let i = 0; i < mwClusterCount; i++) {
        const xPos = milkyWayX();
        const yPos = milkyWayYFromX(xPos, 'cluster');
        const distToCenter =
          (1 - Math.abs(xPos - width / 2) / (width / 2)) * (1 - Math.abs(yPos - height / 2) / (height / 2));
        const size = mwClusterSize + Math.random() * mwClusterSizeR;
        const hue = mwHueMin + Math.floor((Math.random() * 0.5 + distToCenter * 0.5) * (mwHueMax - mwHueMin));
        new MwStarCluster(
          xPos,
          yPos,
          size,
          hue,
          mwWhiteProportionMin + Math.random() * (mwWhiteProportionMax - mwWhiteProportionMin),
          distToCenter,
        ).draw(mwCtx);
      }
      mwCtx.globalCompositeOperation = 'source-over';
    };

    let lastTime = null;
    let nextShootingStarAt = null;
    const randomShootingStarGap = () =>
      SHOOTING_STAR_MIN_GAP_MS + Math.random() * (SHOOTING_STAR_MAX_GAP_MS - SHOOTING_STAR_MIN_GAP_MS);

    const animate = (time) => {
      // Clamped so a tab that was backgrounded (and so missed a stretch of
      // frames) doesn't hand back-catalog stars a huge dt and teleport them
      // across the sky on the first frame after it regains focus.
      const dt = lastTime === null ? 0 : Math.min(time - lastTime, 100);
      lastTime = time;
      if (nextShootingStarAt === null) nextShootingStarAt = time + randomShootingStarGap();

      ssCtx.clearRect(0, 0, width, height);
      if (time >= nextShootingStarAt) {
        shootingStars.push(
          new ShootingStar(
            Math.random() * width,
            Math.random() * (height * 0.3),
            (Math.random() - 0.5) * SHOOTING_STAR_X_SPEED,
            Math.random() * SHOOTING_STAR_Y_SPEED_RANGE + SHOOTING_STAR_Y_SPEED_BASE,
            shootingStarsColors[Math.floor(Math.random() * shootingStarsColors.length)],
          ),
        );
        nextShootingStarAt = time + randomShootingStarGap();
      }
      shootingStars = shootingStars.filter((star) => {
        if (star.goingOut()) return false;
        star.update(ssCtx, dt);
        return true;
      });
      animationFrameId = window.requestAnimationFrame(animate);
    };

    const resizeAndInit = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      [mwCanvas, ssCanvas].forEach((canvas) => {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      });
      mwCtx.scale(dpr, dpr);
      ssCtx.scale(dpr, dpr);
      drawStaticMilkyWay();
      shootingStars = [];
    };

    const handleResize = () => {
      window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(resizeAndInit, RESIZE_DEBOUNCE_MS);
    };

    resizeAndInit();
    animationFrameId = window.requestAnimationFrame(animate);
    window.addEventListener('resize', handleResize);

    return () => {
      window.clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.container} aria-hidden="true">
      <canvas ref={milkyWayRef} className={styles.canvas} />
      <canvas ref={shootingStarsRef} className={styles.canvas} />
    </div>
  );
}
