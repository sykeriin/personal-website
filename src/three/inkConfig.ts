/**
 * Every tunable in the ink look lives here, in one place, so routes art-direct
 * by overriding a handful of values rather than by remembering per-mesh props.
 */
export type InkParams = {
  // line
  boilFps: number
  wobbleAmp: number
  wobbleScale: number
  baseWidth: number
  nearBoost: number
  depthGain: number
  normalGain: number
  edgeBias: number
  edgeSoft: number
  slopeComp: number
  breakLow: number
  breakHigh: number
  breakScale: number
  // tone
  dotPitch: number
  toneAngle: number
  dotMax: number
  bands: number
  solidStart: number
  toneFar: number
  toneStrength: number
}

export const inkDefaults: InkParams = {
  boilFps: 10,
  wobbleAmp: 2.2,
  wobbleScale: 9,
  baseWidth: 1.3,
  nearBoost: 1.1,
  depthGain: 9,
  normalGain: 1.5,
  edgeBias: 0.18,
  edgeSoft: 0.35,
  slopeComp: 1,
  breakLow: 0.12,
  breakHigh: 0.42,
  breakScale: 42,

  dotPitch: 8,
  toneAngle: 0.2618, // 15deg, the classic screentone rotation
  dotMax: 0.52,
  bands: 3,
  solidStart: 0.16,
  toneFar: 0.55,
  toneStrength: 0.85,
}

/** Palette, mirroring src/styles/tokens.css. Read from CSS at runtime by theme.ts. */
export const inkPalette = {
  paper: '#f7f6f3',
  paperDim: '#ebe8e2',
  tone: '#c4c0b8',
  ink: '#0b0b0c',
  inkSoft: '#2a2a2a',
  crimson: '#b01030',
  indigo: '#16233d',
}

export type InkPalette = typeof inkPalette
