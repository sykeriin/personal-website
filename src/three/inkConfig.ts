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
  // 0: the linework holds still. The boil was cel-animation charm on paper and
  // "buzzing" in practice — Durva asked for lines that stay constant.
  boilFps: 0,
  wobbleAmp: 2.2,
  wobbleScale: 9,
  baseWidth: 1.6,
  nearBoost: 1.1,
  depthGain: 11,
  normalGain: 2.3,
  edgeBias: 0.14,
  edgeSoft: 0.16,
  slopeComp: 1,
  breakLow: 0.08,
  breakHigh: 0.3,
  breakScale: 42,

  dotPitch: 8,
  toneAngle: 0.2618, // 15deg, the classic screentone rotation
  dotMax: 0.52,
  bands: 3,
  solidStart: 0.16,
  toneFar: 0.55,
  toneStrength: 0.92,
}
