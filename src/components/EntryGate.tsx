import { useEffect, useState } from 'react'
import splatUrl from '../assets/ink/marks/blot-01.png'
import type { RenderTier } from '../hooks/useRenderTier'

/**
 * The first-visit entrance: an ink splat blooms, the name slams in, and the
 * visitor picks how much ink they want — heavy (the full world), light, or
 * just the words. The choice pins the render tier, so it doubles as the most
 * honest capability prompt possible.
 *
 * Deliberately NOT the v1 gate reborn: it shows once per visitor ever
 * (localStorage), never on deep links, is interactive within half a second,
 * and Esc or the close corner skips it with auto-detection kept.
 */

const ENTERED_KEY = 'inkwell-entered'

export function hasEntered(): boolean {
  try {
    return localStorage.getItem(ENTERED_KEY) === '1'
  } catch {
    return true
  }
}

export function EntryGate({
  reduceMotion,
  onPick,
}: {
  reduceMotion: boolean
  onPick: (tier: RenderTier | null) => void
}) {
  const [leaving, setLeaving] = useState(false)

  const pick = (tier: RenderTier | null) => {
    try {
      localStorage.setItem(ENTERED_KEY, '1')
    } catch {
      /* private mode: they'll see it again, which is fine */
    }
    setLeaving(true)
    window.setTimeout(() => onPick(tier), reduceMotion ? 0 : 360)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') pick(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className={`entry ${leaving ? 'entry--leaving' : ''} ${reduceMotion ? 'entry--still' : ''}`}
      role="dialog"
      aria-label="Choose how to read this site"
    >
      <div className="entry__splat" style={{ maskImage: `url(${splatUrl})`, WebkitMaskImage: `url(${splatUrl})` }} />
      <div className="entry__stack">
        <p className="entry__eyebrow">vol. 02 · a portfolio with two covers</p>
        <h1 className="entry__title">durva sharma</h1>
        <p className="entry__q">how much ink can your machine take?</p>
        <div className="entry__choices">
          <button onClick={() => pick('inked')}>
            <strong>heavy</strong>
            <span>the full drawn world</span>
          </button>
          <button onClick={() => pick('flat')}>
            <strong>light</strong>
            <span>3d, fewer effects</span>
          </button>
          <button onClick={() => pick('paper')}>
            <strong>just the words</strong>
            <span>flat and fast</span>
          </button>
        </div>
        <button className="entry__skip" onClick={() => pick(null)}>
          you decide (esc)
        </button>
      </div>
    </div>
  )
}
