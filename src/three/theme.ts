import { inkDefaults, type InkParams } from './inkConfig'

/**
 * Reads the design tokens out of CSS so the DOM and the WebGL layer can never
 * disagree about a colour. src/styles/ink-tokens.css is the single source; no
 * hex value is written twice.
 *
 * Re-readable rather than read-once, because flipping [data-ink-mode="night"]
 * swaps the ink plate and the 3D layer needs to pick that up.
 */

export type InkPalette = {
  paper: string
  paperDim: string
  tone: string
  ink: string
  inkSoft: string
  crimson: string
  /** The chapter's second ink. Rotates per route; crimson is only its default. */
  accent: string
  /** A second plate for the one screen that needs two (the cover fork). */
  accentB: string
  indigo: string
}

export type InkTheme = {
  palette: InkPalette
  params: InkParams
}

const FALLBACK: InkPalette = {
  paper: '#f7f6f3',
  paperDim: '#ebe8e2',
  tone: '#c4c0b8',
  ink: '#0b0b0c',
  inkSoft: '#2a2a2a',
  crimson: '#b01030',
  accent: '#b01030',
  accentB: '#b01030',
  indigo: '#16233d',
}

function text(style: CSSStyleDeclaration, name: string, fallback: string): string {
  const raw = style.getPropertyValue(name).trim()
  return raw.length > 0 ? raw : fallback
}

function num(style: CSSStyleDeclaration, name: string, fallback: number): number {
  const parsed = Number.parseFloat(style.getPropertyValue(name))
  return Number.isFinite(parsed) ? parsed : fallback
}

/** CSS angles are authored in degrees; shaders want radians. */
function radians(style: CSSStyleDeclaration, name: string, fallback: number): number {
  const raw = style.getPropertyValue(name).trim()
  const parsed = Number.parseFloat(raw)
  if (!Number.isFinite(parsed)) return fallback
  return raw.endsWith('rad') ? parsed : (parsed * Math.PI) / 180
}

export function readInkTheme(root?: HTMLElement): InkTheme {
  if (typeof window === 'undefined') {
    return { palette: FALLBACK, params: inkDefaults }
  }
  const style = getComputedStyle(root ?? document.documentElement)

  return Object.freeze({
    palette: Object.freeze({
      paper: text(style, '--paper', FALLBACK.paper),
      paperDim: text(style, '--paper-dim', FALLBACK.paperDim),
      tone: text(style, '--tone', FALLBACK.tone),
      ink: text(style, '--ink', FALLBACK.ink),
      inkSoft: text(style, '--ink-soft', FALLBACK.inkSoft),
      crimson: text(style, '--crimson', FALLBACK.crimson),
      accent: text(style, '--accent', FALLBACK.accent),
      accentB: text(style, '--accent', FALLBACK.accent),
      indigo: text(style, '--indigo', FALLBACK.indigo),
    }),
    params: Object.freeze({
      ...inkDefaults,
      baseWidth: num(style, '--line-contour', inkDefaults.baseWidth * 2) / 2,
      dotPitch: num(style, '--tone-freq', inkDefaults.dotPitch),
      toneAngle: radians(style, '--tone-angle', inkDefaults.toneAngle),
      boilFps: num(style, '--ink-boil-hz', inkDefaults.boilFps),
    }),
  })
}

/** Watches for a night-mode flip on the root element. */
export function observeInkTheme(onChange: (theme: InkTheme) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const observer = new MutationObserver(() => onChange(readInkTheme()))
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-ink-mode', 'class', 'style'],
  })
  return () => observer.disconnect()
}
