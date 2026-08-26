import { useCallback, useEffect, useMemo, useState } from 'react'

/**
 * Four capability tiers, replacing v1's single boolean.
 *
 * v1 computed `useWebGL = !reduceMotion && !mobile && !saveData`, which folded
 * three unrelated concerns into one flag and produced two wrong answers:
 * reduced motion means "don't move things", not "show me nothing"; and a
 * viewport under 768px says nothing about whether the GPU can cope.
 */
export type RenderTier =
  /** No WebGL at all. A designed flat volume, not a degraded 3D page. */
  | 'paper'
  /** WebGL, no post-processing. Tone moves to a CSS overlay. */
  | 'flat'
  /** Full ink pipeline. The default. */
  | 'inked'
  /** Full pipeline at higher DPR with more edge taps. */
  | 'inked-plus'

const ORDER: RenderTier[] = ['paper', 'flat', 'inked', 'inked-plus']
const STORAGE_KEY = 'inkwell-tier'

export type RenderTierState = {
  tier: RenderTier
  /** True when the visitor pinned a tier by hand; auto-demotion then stops. */
  pinned: boolean
  reduceMotion: boolean
  dpr: [number, number] | number
  setTier: (tier: RenderTier | null) => void
}

function supportsWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2'))
  } catch {
    return false
  }
}

function readPinned(): RenderTier | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return ORDER.includes(raw as RenderTier) ? (raw as RenderTier) : null
  } catch {
    return null
  }
}

function detectTier(): RenderTier {
  if (typeof window === 'undefined') return 'paper'

  const saveData = Boolean(
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
  )
  // saveData is an explicit request to send less. Honour it absolutely.
  if (saveData) return 'paper'
  if (!supportsWebGL2()) return 'paper'

  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  if (typeof memory === 'number' && memory < 4) return 'paper'

  const cores = navigator.hardwareConcurrency ?? 4
  const coarse = window.matchMedia('(pointer: coarse)').matches

  // A phone can run the pipeline, just not at desktop resolution. Gate on the
  // hardware, never on viewport width.
  if (cores <= 4) return 'flat'
  if (coarse) return 'inked'
  return cores >= 8 ? 'inked-plus' : 'inked'
}

export function useRenderTier(): RenderTierState {
  const [pinnedTier, setPinnedTier] = useState<RenderTier | null>(() =>
    typeof window === 'undefined' ? null : readPinned(),
  )
  const [autoTier, setAutoTier] = useState<RenderTier>(() =>
    typeof window === 'undefined' ? 'paper' : detectTier(),
  )
  const [reduceMotion, setReduceMotion] = useState(() =>
    typeof window === 'undefined'
      ? true
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  const setTier = useCallback((tier: RenderTier | null) => {
    setPinnedTier(tier)
    try {
      if (tier) localStorage.setItem(STORAGE_KEY, tier)
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* private mode: the choice just doesn't persist */
    }
  }, [])

  /** Step down one tier after sustained bad frames. Never steps back up —
      oscillating between tiers looks worse than being stuck on the low one. */
  useEffect(() => {
    if (pinnedTier) return
    let frames = 0
    let slow = 0
    let last = performance.now()
    let raf = 0
    let stop = false

    const sample = (now: number) => {
      const delta = now - last
      last = now
      frames += 1
      if (delta > 28) slow += 1
      // ~2 seconds of evidence before acting
      if (frames >= 120) {
        if (slow / frames > 0.5) {
          setAutoTier((current) => {
            const index = ORDER.indexOf(current)
            return index > 1 ? ORDER[index - 1] : current
          })
          stop = true
        }
        frames = 0
        slow = 0
      }
      if (!stop) raf = requestAnimationFrame(sample)
    }
    raf = requestAnimationFrame(sample)
    return () => cancelAnimationFrame(raf)
  }, [pinnedTier])

  const tier = pinnedTier ?? autoTier

  const dpr = useMemo<[number, number] | number>(() => {
    if (tier === 'inked-plus') return [1, 1.5]
    if (tier === 'inked') return [1, 1.25]
    return 1
  }, [tier])

  return useMemo(
    () => ({ tier, pinned: pinnedTier !== null, reduceMotion, dpr, setTier }),
    [tier, pinnedTier, reduceMotion, dpr, setTier],
  )
}

export function tierUsesWebGL(tier: RenderTier): boolean {
  return tier !== 'paper'
}

export function tierUsesPostProcessing(tier: RenderTier): boolean {
  return tier === 'inked' || tier === 'inked-plus'
}
