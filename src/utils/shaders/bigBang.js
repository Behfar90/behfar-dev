export const coreVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    vNormal = normalMatrix * normal;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const coreFragmentShader = `
  uniform float opacity;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    float dotProduct = max(dot(normal, viewDir), 0.0);
    float rim = 1.0 - dotProduct;

    vec3 centerColor = vec3(1.0, 1.0, 1.0);
    vec3 edgeColor = vec3(0.0, 0.6, 1.0);

    vec3 finalColor = mix(centerColor, edgeColor, pow(rim, 1.5));
    float alpha = opacity * pow(dotProduct, 0.2);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export const flareVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const flareFragmentShader = `
  uniform float opacity;
  varying vec2 vUv;
  void main() {
    float distY = abs(vUv.y - 0.5) * 2.0;
    float distX = abs(vUv.x - 0.5) * 2.0;

    float alpha = max(0.0, 1.0 - pow(distY, 0.6)) * max(0.0, 1.0 - pow(distX, 3.0));

    vec3 color = mix(vec3(1.0, 1.0, 1.0), vec3(0.2, 0.8, 1.0), distY);
    gl_FragColor = vec4(color, alpha * opacity);
  }
`;
