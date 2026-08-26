import * as THREE from 'three'

/**
 * The whole look in one fullscreen pass: edge-detected ink over screen-space
 * halftone. Fused rather than chained because the two interact — tone quantises
 * from lit luminance first, and ink must composite on top of it (screentoned
 * lines shimmer).
 *
 * Reads a G-buffer written by gbufferMaterial: rgb = raw view-space normal,
 * a = linear view depth in 0..1.
 */

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = /* glsl */ `
uniform sampler2D tDiffuse;
uniform sampler2D tGBuffer;
uniform vec2  uResolution;
uniform float uPixelRatio;
uniform float uTime;

uniform float uBoilFps;
uniform float uWobbleAmp;
uniform float uWobbleScale;
uniform float uBaseWidth;
uniform float uNearBoost;
uniform float uDepthGain;
uniform float uNormalGain;
uniform float uEdgeBias;
uniform float uEdgeSoft;
uniform float uSlopeComp;
uniform float uBreakLow;
uniform float uBreakHigh;
uniform float uBreakScale;

uniform float uDotPitch;
uniform float uToneAngle;
uniform float uDotMax;
uniform float uBands;
uniform float uSolidStart;
uniform float uToneFar;
uniform float uToneStrength;

uniform vec3 uPaper;
uniform vec3 uInk;
uniform vec3 uInkSoft;
uniform vec3 uCrimson;

varying vec2 vUv;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main() {
  vec2 texel = 1.0 / uResolution;

  // Boil: snap the noise offset to uBoilFps steps and HOLD. A line that slides
  // smoothly reads as a shader effect; one that snaps reads as drawn.
  float tq = floor(uTime * max(uBoilFps, 0.0001));
  vec2 boil = vec2(tq * 91.7, tq * 47.3);

  // Domain-warp the sample position before any taps, so the detected edge
  // physically meanders off the true silhouette. Costs zero extra taps.
  float w1 = vnoise(vUv * uWobbleScale + boil);
  float w2 = vnoise(vUv * uWobbleScale + boil + 19.7);
  vec2 uv = vUv + (vec2(w1, w2) - 0.5) * uWobbleAmp * texel;

  vec4 gc = texture2D(tGBuffer, uv);
  vec3 Nc = gc.rgb;
  float dc = gc.a;

  // Near objects get fatter lines. Vary the tap offset, keep the tap count.
  float widthPx = uBaseWidth * (1.0 + uNearBoost * (1.0 - clamp(dc, 0.0, 1.0)));
  vec2 off = texel * widthPx;

  vec4 g1 = texture2D(tGBuffer, uv + vec2( off.x,  off.y));
  vec4 g2 = texture2D(tGBuffer, uv + vec2(-off.x, -off.y));
  vec4 g3 = texture2D(tGBuffer, uv + vec2( off.x, -off.y));
  vec4 g4 = texture2D(tGBuffer, uv + vec2(-off.x,  off.y));

  // Depth edge, normalised by distance so far silhouettes still register.
  float depthEdge = abs(g1.a - g2.a) + abs(g3.a - g4.a);
  depthEdge /= max(dc, 0.001);

  // Slope compensation. A plane at grazing angle has a huge depth gradient and
  // would otherwise flood solid black. Scaling by |N.z| cancels exactly that.
  float slope = mix(1.0, max(0.15, abs(Nc.z)), uSlopeComp);
  depthEdge *= slope;

  // Normal edge catches creases the depth term is blind to.
  float normalEdge = (1.0 - dot(Nc, g1.rgb)) + (1.0 - dot(Nc, g2.rgb))
                   + (1.0 - dot(Nc, g3.rgb)) + (1.0 - dot(Nc, g4.rgb));
  normalEdge *= 0.25;

  float contour = depthEdge * uDepthGain;
  float crease  = normalEdge * uNormalGain;
  float edge = smoothstep(uEdgeBias, uEdgeBias + uEdgeSoft, max(contour, crease));

  // Dry-brush breakup: strokes occasionally thin or drop out entirely.
  float brk = vnoise(vUv * uBreakScale + boil * 0.3);
  edge *= smoothstep(uBreakLow, uBreakHigh, brk);

  // Heavy outer contour, light interior line. The single biggest tell that
  // separates hand-inked from a CAD outline.
  float contourness = contour / (contour + crease + 0.0001);
  vec3 inkCol = mix(uInkSoft, uInk, smoothstep(0.25, 0.75, contourness));

  vec3 beauty = texture2D(tDiffuse, vUv).rgb;

  // The composer's buffer is linear; band on perceptual luminance or every
  // midtone collapses into the dark band.
  float lum = pow(clamp(dot(beauty, vec3(0.299, 0.587, 0.114)), 0.0, 1.0), 1.0 / 2.2);

  // Quantise to the toon bands BEFORE sizing dots, so tone regions get hard
  // edges like cut-and-pasted film instead of a smooth gradient of dots.
  float q = clamp(floor(lum * uBands) / max(uBands - 1.0, 1.0), 0.0, 1.0);

  // Lattice in CSS pixels, not device pixels: on a 2x display the correct
  // behaviour is the same dot size, drawn sharper.
  vec2 pcss = gl_FragCoord.xy / max(uPixelRatio, 0.0001);
  float sa = sin(uToneAngle);
  float ca = cos(uToneAngle);
  vec2 pr = mat2(ca, -sa, sa, ca) * pcss;
  vec2 cell = fract(pr / uDotPitch) - 0.5;
  float cd = length(cell);

  // Radius from sqrt of darkness: dot AREA should be linear in darkness. A
  // linear radius is why most web halftones go muddy in the midtones.
  float radius = uDotMax * sqrt(clamp(1.0 - q, 0.0, 1.0));

  // The lattice is screen-space with a known pitch, so the per-pixel derivative
  // of cd is exactly 1/pitch. No fwidth needed, and no shimmer.
  float aa = 1.4 / uDotPitch;
  float tone = 1.0 - smoothstep(radius - aa, radius + aa, cd);

  // Solid blacks anchor a page. An all-dots page reads as grey mush, so the
  // darkest band fills flat ink rather than denser tone.
  float solid = smoothstep(uSolidStart, 0.0, q);

  // Fade both with distance: kills far-field grid artefacts and doubles as
  // atmospheric perspective.
  float far = 1.0 - smoothstep(uToneFar * 0.6, uToneFar, dc);
  tone *= far;
  solid *= far;

  // Crimson is an unlit accent plate — it bypasses the light model entirely,
  // exactly how a two-colour manga cover was printed with a second ink.
  // Normalised chroma so the mask is the same in every lit band; a raw channel
  // difference would let the shading bands show through as pink.
  float chroma = (beauty.r - max(beauty.g, beauty.b)) / max(beauty.r, 0.001);
  float crimsonMask = smoothstep(0.35, 0.60, chroma);

  // Dots are drawn in ink, not in a mid-grey: perceived value comes from dot
  // COVERAGE, the way real screentone works. Light dots on light paper is why
  // most web halftones wash out. This also matches the DOM tone layer in
  // tokens.css, which is already ink at low alpha.
  vec3 col = mix(uPaper, uInk, tone * uToneStrength);
  col = mix(col, uInk, solid);
  col = mix(col, uCrimson, crimsonMask);
  col = mix(col, inkCol, edge);

  gl_FragColor = vec4(col, 1.0);
}
`

export function createInkCompositeShader() {
  return {
    uniforms: {
      tDiffuse: { value: null as THREE.Texture | null },
      tGBuffer: { value: null as THREE.Texture | null },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPixelRatio: { value: 1 },
      uTime: { value: 0 },

      uBoilFps: { value: 10 },
      uWobbleAmp: { value: 2.2 },
      uWobbleScale: { value: 9 },
      uBaseWidth: { value: 1.3 },
      uNearBoost: { value: 1.1 },
      uDepthGain: { value: 9 },
      uNormalGain: { value: 1.5 },
      uEdgeBias: { value: 0.18 },
      uEdgeSoft: { value: 0.35 },
      uSlopeComp: { value: 1 },
      uBreakLow: { value: 0.12 },
      uBreakHigh: { value: 0.42 },
      uBreakScale: { value: 42 },

      uDotPitch: { value: 8 },
      uToneAngle: { value: 0.2618 },
      uDotMax: { value: 0.52 },
      uBands: { value: 3 },
      uSolidStart: { value: 0.16 },
      uToneFar: { value: 0.55 },
      uToneStrength: { value: 0.85 },

      uPaper: { value: new THREE.Color('#f7f6f3') },
      uInk: { value: new THREE.Color('#0b0b0c') },
      uInkSoft: { value: new THREE.Color('#2a2a2a') },
      uCrimson: { value: new THREE.Color('#b01030') },
    },
    vertexShader,
    fragmentShader,
  }
}
