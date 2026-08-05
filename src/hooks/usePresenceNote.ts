import { useEffect, useState } from 'react'

export type Presence = {
  line: string
  late: boolean
}

function buildPresence(now = new Date()): Presence {
  const hour = now.getHours()
  const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const time = now
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase()

  // past 12am into early morning
  if (hour >= 0 && hour < 5) {
    return {
      late: true,
      line: `it's ${time} on a ${day}... why are you awake?`,
    }
  }

  if (hour >= 5 && hour < 8) {
    return {
      late: false,
      line: `up early on a ${day} at ${time}? respect (or caffeine).`,
    }
  }

  return {
    late: false,
    line: `ik you're looking at this on a ${day} at ${time} hehe`,
  }
}

export function usePresenceNote() {
  const [presence, setPresence] = useState<Presence>(() => buildPresence())

  useEffect(() => {
    const tick = () => setPresence(buildPresence())
    tick()
    const id = window.setInterval(tick, 30_000)
    return () => window.clearInterval(id)
  }, [])

  return presence
}
