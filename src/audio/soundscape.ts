import { Howl, Howler } from 'howler'
import { entryFor } from '../world/manifest'

/**
 * The soundscape: an ambient bed per chapter, crossfaded on the slam, plus a
 * handful of interaction sounds.
 *
 * Three rules it will not break:
 *  - It never autoplays. It starts muted behind a visible toggle, and browser
 *    autoplay policy needs a gesture anyway, so this is designed for rather
 *    than fought.
 *  - It never blocks. Files load lazily, after first paint, and only once the
 *    visitor has actually turned sound on — so most people never download it.
 *  - It degrades to silence. The audio assets are still to be recorded, so a
 *    missing file is an expected state, not an error. Nothing throws and
 *    nothing logs noise at the visitor.
 */

type Cue = 'slam' | 'turn' | 'hover' | 'stamp'

/** Vite resolves these at build time; a missing file simply yields undefined. */
const files = import.meta.glob('../assets/sound/*.{mp3,m4a,ogg,webm}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

function urlFor(name: string): string | undefined {
  const hit = Object.entries(files).find(([path]) => path.includes(`/${name}.`))
  return hit?.[1]
}

const STORAGE_KEY = 'inkwell-sound'

let unlocked = false
let currentBed: Howl | null = null
let currentBedName: string | null = null
const cues = new Map<string, Howl>()

function load(name: string, options: { loop?: boolean; volume?: number }): Howl | null {
  const src = urlFor(name)
  if (!src) return null
  const existing = cues.get(name)
  if (existing) return existing
  const howl = new Howl({
    src: [src],
    loop: options.loop ?? false,
    volume: options.volume ?? 0.5,
    preload: true,
    html5: false,
  })
  cues.set(name, howl)
  return howl
}

export function isSoundOn(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on'
  } catch {
    return false
  }
}

export function setSoundOn(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    /* private mode: the choice just doesn't persist */
  }
  unlocked = on
  Howler.mute(!on)
  if (!on) {
    currentBed?.fade(currentBed.volume(), 0, 300)
    window.setTimeout(() => currentBed?.pause(), 320)
  } else if (currentBedName) {
    playBed(currentBedName, true)
  }
}

/** Ambient bed for a route. Crossfades over the slam so the two land together. */
export function playBed(name: string, force = false) {
  if (!unlocked) {
    currentBedName = name
    return
  }
  if (!force && currentBedName === name && currentBed?.playing()) return

  const next = load(`bed-${name}`, { loop: true, volume: 0 })
  const previous = currentBed

  currentBedName = name
  currentBed = next

  if (previous && previous !== next) {
    previous.fade(previous.volume(), 0, 600)
    window.setTimeout(() => previous.pause(), 620)
  }
  if (next) {
    if (!next.playing()) next.play()
    next.fade(next.volume(), 0.32, 600)
  }
}

export function playCue(cue: Cue) {
  if (!unlocked) return
  const howl = load(cue, { volume: cue === 'slam' ? 0.5 : 0.28 })
  howl?.play()
}

/** Bed name per route, derived from the scene rather than a second list. */
export function bedForRoute(pathname: string): string {
  return entryFor(pathname).scene
}

export function initSoundscape() {
  const on = isSoundOn()
  unlocked = on
  Howler.mute(!on)
}
