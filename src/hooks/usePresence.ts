import { useEffect, useState } from 'react'

/**
 * The clock-aware line. Carried over in spirit from v1, where it was the site's
 * most personality-forward touch, and promoted: `late` now also drives the
 * lighting on /origin and the tiredness of the slam onomatopoeia, so the
 * visitor's local hour becomes part of the world rather than a line of text.
 */

export type Presence = {
  note: string
  /** Local hour, 0–23. */
  hour: number
  /** Small hours. Drives the night ink plate and the desk lamp. */
  late: boolean
  day: string
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function build(now: Date): Presence {
  const hour = now.getHours()
  const day = DAYS[now.getDay()]
  const clock = now
    .toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase()
    .replace(/\s/g, ' ')

  const late = hour >= 0 && hour < 5

  let note: string
  if (late) note = `it's ${clock} on a ${day}. why are you awake?`
  else if (hour < 9) note = `up early on a ${day}. respect.`
  else if (hour < 12) note = `${day} morning. good a time as any.`
  else if (hour < 17) note = `ik you're looking at this on a ${day} afternoon. hehe`
  else if (hour < 22) note = `${day} evening. i'm probably still debugging something.`
  else note = `${clock} on a ${day}. i'm definitely still up too.`

  return { note, hour, late, day }
}

export function usePresence(): Presence {
  const [presence, setPresence] = useState(() => build(new Date()))

  useEffect(() => {
    const id = window.setInterval(() => setPresence(build(new Date())), 30_000)
    return () => window.clearInterval(id)
  }, [])

  return presence
}

/**
 * Onomatopoeia for the slam. Late at night the words get tireder, which ties
 * the transition back to "i stay up because one more fix feels closer than
 * sleep."
 */
export function slamWord(base: string, late: boolean): string {
  if (!late) return base
  const tired = ['still up', 'one more', 'mm', 'sure', 'ok']
  return tired[base.length % tired.length]
}
