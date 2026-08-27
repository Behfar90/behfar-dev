export const starVertexShader = `
precision highp float;
attribute vec3 position;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
attribute vec4 mouse;
attribute vec2 aFront;
attribute float random;
uniform vec2 resolution;
uniform float pixelRatio;
uniform float timestamp;
uniform float size;
uniform float minSize;
uniform float speed;
uniform float far;
uniform float spread;
uniform float maxSpread;
uniform float maxZ;
uniform float maxDiff;
uniform float diffPow;
varying float vProgress;
varying float vRandom;
varying float vDiff;
varying float vSpreadLength;
varying float vPositionZ;

float cubicOut(float t) {
  float f = t - 1.0;
  return f * f * f + 1.0;
}
const float PI = 3.1415926;
const float PI2 = PI * 2.;

void main () {
  float progress = clamp((timestamp - mouse.z) * speed, 0., 1.);
  progress *= step(0., mouse.x);
  float startX = mouse.x - resolution.x / 2.;
  float startY = mouse.y - resolution.y / 2.;
  vec3 startPosition = vec3(startX, startY, random);
  float diff = clamp(mouse.w / maxDiff, 0., 1.);
  diff = pow(diff, diffPow);
  vec3 cPosition = position * 2. - 1.;
  float radian = cPosition.x * PI2 - PI;
  vec2 xySpread = vec2(cos(radian), sin(radian)) * spread * mix(1., maxSpread, diff) * cPosition.y;
  vec3 endPosition = startPosition;
  endPosition.xy += xySpread;
  endPosition.xy -= aFront * far * random;
  endPosition.z += cPosition.z * maxZ * (pixelRatio > 1. ? 1.2 : 1.);
  float positionProgress = cubicOut(progress * random);
  vec3 currentPosition = mix(startPosition, endPosition, positionProgress);
  vProgress = progress;
  vRandom = random;
  vDiff = diff;
  vSpreadLength = cPosition.y;
  vPositionZ = position.z;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(currentPosition, 1.);
  gl_PointSize = max(currentPosition.z * size * diff * pixelRatio, minSize * (pixelRatio > 1. ? 1.3 : 1.));
}
`;

export const starFragmentShader = `
precision highp float;
uniform float fadeSpeed;
uniform float shortRangeFadeSpeed;
uniform float minFlashingSpeed;
uniform float blur;
varying float vProgress;
varying float vRandom;
varying float vDiff;
varying float vSpreadLength;
varying float vPositionZ;

highp float random(vec2 co) {
    highp float a = 12.9898;
    highp float b = 78.233;
    highp float c = 43758.5453;
    highp float dt= dot(co.xy ,vec2(a,b));
    highp float sn= mod(dt,3.14);
    return fract(sin(sn) * c);
}
float quadraticIn(float t) {
  return t * t;
}
#ifndef HALF_PI
#define HALF_PI 1.5707963267948966
#endif
float sineOut(float t) {
  return sin(t * HALF_PI);
}
const vec3 baseColor = vec3(170., 133., 88.) / 255.;

void main(){
  vec2 p = gl_PointCoord * 2. - 1.;
  float len = length(p);
  float cRandom = random(vec2(vProgress * mix(minFlashingSpeed, 1., vRandom)));
  cRandom = mix(0.3, 2., cRandom);
  float cBlur = blur * mix(1., 0.3, vPositionZ);
  float shape = smoothstep(1. - cBlur, 1. + cBlur, (1. - cBlur) / len);
  shape *= mix(0.5, 1., vRandom);
  if (shape == 0.) discard;
  float darkness = mix(0.1, 1., vPositionZ);
  float alphaProgress = vProgress * fadeSpeed * mix(2.5, 1., pow(vDiff, 0.6));
  alphaProgress *= mix(shortRangeFadeSpeed, 1., sineOut(vSpreadLength) * quadraticIn(vDiff));
  float alpha = 1. - min(alphaProgress, 1.);
  alpha *= cRandom * vDiff;
  gl_FragColor = vec4(baseColor * darkness * cRandom, shape * alpha);
}
`;

export const textVertexShader = `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying vec2 vUv;
void main () {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}
`;

export const textFragmentShader = `
precision highp float;
uniform sampler2D map;
uniform float uProgress;
uniform float uStartX;
uniform float uRatio;
uniform float alpha;
uniform float uSubtitleVMax;
uniform float uSubtitleFade;
varying vec2 vUv;
void main(){
  vec4 textureColor = texture2D(map, vUv);
  float angle = uRatio / 3.;
  float isShow = step(1., 1. - vUv.x + (uProgress / uStartX * 0.5 + 0.5) - abs(vUv.y - 0.5) / angle);
  float inSubtitle = step(vUv.y, uSubtitleVMax);
  float dissolveMask = 1. - inSubtitle * uSubtitleFade;
  gl_FragColor = vec4(textureColor.rgb, textureColor.a * alpha * isShow * dissolveMask);
}
`;

export const plainTextFragmentShader = `
precision highp float;
uniform sampler2D map;
uniform float alpha;
uniform float uReveal;
varying vec2 vUv;
void main(){
  vec4 textureColor = texture2D(map, vUv);
  gl_FragColor = vec4(textureColor.rgb, textureColor.a * alpha * uReveal);
}
`;

export const puffVertexShader = `
precision highp float;
attribute vec3 position;
attribute vec2 aDir;
attribute float aRandom;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uProgress;
uniform float uDistance;
uniform float uPixelRatio;
uniform float uSize;
uniform float uMinSize;
varying float vAlpha;
varying float vRandom;

float easeInCubic(float t) {
  return t * t * t;
}

void main () {
  float t = clamp(uProgress, 0.0, 1.0);
  float start = aRandom * 0.3;
  float local = clamp((t - start) / (1.0 - start), 0.0, 1.0);
  float travel = easeInCubic(local);

  vec3 pos = position;
  pos.xy += aDir * uDistance * travel * mix(0.7, 1.3, aRandom);

  vAlpha = smoothstep(0.0, 0.08, local) * (1.0 - smoothstep(0.45, 1.0, local));
  vRandom = aRandom;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = (uSize * mix(0.7, 1.3, aRandom) * (1.0 - 0.3 * travel) + uMinSize) * uPixelRatio;
}
`;

export const puffFragmentShader = `
precision highp float;
varying float vAlpha;
varying float vRandom;
const vec3 baseColor = vec3(170., 133., 88.) / 255.;
void main(){
  vec2 p = gl_PointCoord * 2. - 1.;
  float len = length(p);
  float shape = smoothstep(1., 0., len);
  if (shape <= 0.) discard;
  float flicker = mix(0.6, 1., vRandom);
  gl_FragColor = vec4(baseColor * flicker, shape * vAlpha);
}
`;

export const gatherVertexShader = `
precision highp float;
attribute vec3 position;
attribute vec2 aDir;
attribute float aRandom;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uProgress;
uniform float uDistance;
uniform float uPixelRatio;
uniform float uSize;
uniform float uMinSize;
varying float vAlpha;
varying float vRandom;

float easeOutCubic(float t) {
  float f = t - 1.0;
  return f * f * f + 1.0;
}

void main () {
  float t = clamp(uProgress, 0.0, 1.0);
  float start = aRandom * 0.3;
  float local = clamp((t - start) / (1.0 - start), 0.0, 1.0);
  float settle = easeOutCubic(local);

  vec3 pos = position;
  pos.xy += aDir * uDistance * (1.0 - settle) * mix(0.7, 1.3, aRandom);

  vAlpha = smoothstep(0.0, 0.35, local) - smoothstep(0.75, 1.0, local);
  vRandom = aRandom;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = (uSize * mix(0.7, 1.3, aRandom) * (0.7 + 0.3 * settle) + uMinSize) * uPixelRatio;
}
`;
