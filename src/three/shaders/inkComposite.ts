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
uniform float uSlam;
uniform vec3 uBloom; // x, y in screen UV; z = radius in screen heights

uniform vec3 uPaper;
uniform vec3 uInk;
uniform vec3 uInkSoft;
uniform vec3 uAccent;
uniform vec3 uAccentB;

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
  // Reference height the look was tuned at. Offsets scale with resolution so
  // a line is the same fraction of the screen on every display — otherwise
  // high-res screens sample sub-threshold deltas and the ink disappears.
  float rscale = uResolution.y / 950.0;

  // Boil: snap the noise offset to uBoilFps steps and HOLD. A line that slides
  // smoothly reads as a shader effect; one that snaps reads as drawn.
  // The seed CYCLES rather than growing: raw elapsed time drove the offsets
  // to ~1e5 within minutes, where fract() loses float precision, the noise
  // degenerates, and the dry-brush term quietly erased every line on screen
  // ("the lines disappear the longer i keep it open"). The boil re-inks with
  // discrete snaps anyway, so a 1024-step cycle is imperceptible.
  float tq = mod(floor(uTime * max(uBoilFps, 0.0001)), 1024.0);
  vec2 boil = vec2(tq * 91.7, tq * 47.3);

  // Domain-warp the sample position before any taps, so the detected edge
  // physically meanders off the true silhouette. Costs zero extra taps.
  float w1 = vnoise(vUv * uWobbleScale + boil);
  float w2 = vnoise(vUv * uWobbleScale + boil + 19.7);
  vec2 uv = vUv + (vec2(w1, w2) - 0.5) * uWobbleAmp * texel * rscale;

  vec4 gc = texture2D(tGBuffer, uv);
  vec3 Nc = gc.rgb;
  float dc = gc.a;

  // Near objects get fatter lines. Vary the tap offset, keep the tap count.
  float widthPx = uBaseWidth * (1.0 + uNearBoost * (1.0 - clamp(dc, 0.0, 1.0)));
  vec2 off = texel * widthPx * rscale;

  vec4 g1 = texture2D(tGBuffer, uv + vec2( off.x,  off.y));
  vec4 g2 = texture2D(tGBuffer, uv + vec2(-off.x, -off.y));
  vec4 g3 = texture2D(tGBuffer, uv + vec2( off.x, -off.y));
  vec4 g4 = texture2D(tGBuffer, uv + vec2(-off.x,  off.y));

  // Depth edge, normalised by distance so far silhouettes still register.
  float depthEdge = abs(g1.a - g2.a) + abs(g3.a - g4.a);
  depthEdge /= max(dc, 0.001);

  // Slope compensation. A plane at grazing angle has a huge depth gradient and
  // would otherwise flood solid black. Scaling by |N.z| cancels exactly that.
  // Floor raised from 0.15: horizontal surfaces (desks, the ground) sit at
  // grazing angle to a standing camera, and a lower floor suppressed their rim
  // lines entirely — which is how a whole desk once went invisible.
  float slope = mix(1.0, max(0.3, abs(Nc.z)), uSlopeComp);
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

  // The accent is an unlit second plate: it bypasses the light model entirely,
  // exactly how a two-colour manga page was printed with a second ink.
  //
  // Keyed on SATURATION, not on redness. Every other colour in the palette
  // (paper, paper-dim, tone, ink) is near-neutral, so saturation discriminates
  // the accent perfectly — and unlike a red-channel test it works whatever hue
  // the chapter's plate happens to be. Normalising by the max channel keeps the
  // mask identical across all three lit bands, so shading can't bleed through
  // as a washed-out tint.
  float hi = max(max(beauty.r, beauty.g), beauty.b);
  float lo = min(min(beauty.r, beauty.g), beauty.b);
  float accentMask = smoothstep(0.22, 0.45, (hi - lo) / max(hi, 0.001));

  // Dots are drawn in ink, not in a mid-grey: perceived value comes from dot
  // COVERAGE, the way real screentone works. Light dots on light paper is why
  // most web halftones wash out. This also matches the DOM tone layer in
  // tokens.css, which is already ink at low alpha.
  vec3 col = mix(uPaper, uInk, tone * uToneStrength);
  col = mix(col, uInk, solid);
  // The plate prints in tints and shades, the way a real second ink does —
  // a flat single value erases the boundary between a coloured hero and a
  // coloured sky (chainguard vanished into its own backdrop this way). The
  // quantised luminance keeps it banded, so it still reads as printed.
  // The fork is the one screen with TWO plates. A saturated pixel picks its
  // plate by blue fraction — magenta carries far more blue than crimson, and
  // the ratio survives every lighting band because light is multiplicative.
  // Everywhere else uAccentB equals uAccent and this line is inert.
  // 0.2 is calibrated in LINEAR space (the buffer is linear): magenta's blue
  // fraction lands at ~0.29 there, crimson's at ~0.06, the whitened wash at
  // ~0.14 — one threshold separates all three.
  float useB = step(0.2, beauty.b / max(beauty.r, 0.001)) * step(beauty.g, beauty.r);
  vec3 plate = mix(uAccent, uAccentB, useB) * mix(0.52, 1.18, q);
  col = mix(col, plate, accentMask);
  col = mix(col, inkCol, edge);

  // THE BLOOM. The page renders as a two-ink print, but where the visitor
  // touches it, colour spreads like water into paper: inside the bloom the
  // beauty pass's true colours show through, still banded and still inked, so
  // it reads as the print coming alive rather than a spotlight.
  if (uBloom.z > 0.003) {
    vec2 screen = gl_FragCoord.xy / uResolution;
    vec2 bp = screen - uBloom.xy;
    bp.x *= uResolution.x / max(uResolution.y, 1.0);
    float bd = length(bp);
    // A wobbling edge, boiling at the same 10fps as the linework — a smooth
    // circle reads as a flashlight, a creeping irregular one reads as wet ink.
    bd += (vnoise(screen * 9.0 + boil * 0.5) - 0.5) * uBloom.z * 0.55;
    float inside = 1.0 - smoothstep(uBloom.z * 0.45, uBloom.z, bd);

    // Reveal the surface's HUE at print lightness, not its raw lit value —
    // toon shading puts much of any object in dark bands, and blooming those
    // in raw reads as a photograph developing, all murk. Normalising by the
    // max channel recovers the ink's true colour; the quantised luminance adds
    // back a whisper of banding so it still reads as printed.
    vec3 hue = beauty / max(hi, 0.001);
    vec3 colourCol = hue * mix(0.88, 1.0, q);
    colourCol = mix(colourCol, uInk, tone * uToneStrength * 0.35);
    colourCol = mix(colourCol, uInk, solid * 0.8);
    colourCol = mix(colourCol, inkCol, edge);
    // Only reveal where there is colour to reveal — neutral paper stays paper.
    float sat = (hi - lo) / max(hi, 0.001);
    col = mix(col, colourCol, inside * smoothstep(0.10, 0.32, sat));
  }

  // THE SLAM. A route change is one gesture, and it costs a uniform rather than
  // a remount: speed lines burst from centre while a crimson impact frame slams
  // inward from the edges. Runs in the pass that is already executing.
  if (uSlam > 0.001) {
    vec2 screen = gl_FragCoord.xy / uResolution;
    vec2 p = screen - 0.5;
    p.x *= uResolution.x / max(uResolution.y, 1.0);

    float burstR = length(p);
    float burstA = atan(p.y, p.x);

    // Irregular ray spacing, and a hole around the centre — uniform rays from a
    // point read as sunburst clip-art rather than manga speed lines.
    float spokes = burstA * 7.0 / 3.14159265;
    float ray = smoothstep(0.34, 0.52, abs(fract(spokes + hash21(vec2(floor(spokes), 3.0))) - 0.5) * 2.0);
    float reach = smoothstep(0.12, 0.66, burstR);
    float lines = reach * ray;

    // Two-frame impact frame biting in from the border.
    float border = min(min(screen.x, 1.0 - screen.x), min(screen.y, 1.0 - screen.y));
    float frame = 1.0 - smoothstep(0.0, 0.055 * uSlam, border);

    float hit = clamp(max(lines * 0.9, frame), 0.0, 1.0) * uSlam;
    col = mix(col, uAccent, hit * 0.88);
  }

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
      uSlam: { value: 0 },
      uBloom: { value: new THREE.Vector3(0.5, 0.5, 0) },

      uPaper: { value: new THREE.Color('#f7f6f3') },
      uInk: { value: new THREE.Color('#0b0b0c') },
      uInkSoft: { value: new THREE.Color('#2a2a2a') },
      uAccent: { value: new THREE.Color('#b01030') },
      uAccentB: { value: new THREE.Color('#b01030') },
    },
    vertexShader,
    fragmentShader,
  }
}
