import { useEffect, useRef, useState } from 'react'
import { bedForRoute, initSoundscape, isSoundOn, playBed, playCue, setSoundOn } from './soundscape'

/**
 * The only way sound ever starts. Muted until this is clicked, and the choice
 * persists — so a returning visitor who wanted it keeps it, and one who didn't
 * is never asked twice.
 */
export function SoundToggle({ route, enabled }: { route: string; enabled: boolean }) {
  const [on, setOn] = useState(false)
  const first = useRef(true)

  useEffect(() => {
    initSoundscape()
    setOn(isSoundOn())
  }, [])

  useEffect(() => {
    if (!on) return
    // Reduced motion also means reduced noise unless explicitly asked for.
    if (!enabled) return
    playBed(bedForRoute(route))
    if (first.current) {
      first.current = false
      return
    }
    playCue('slam')
  }, [route, on, enabled])

  return (
    <button
      className="tier-switch"
      style={{ left: 'auto', right: '4rem' }}
      aria-pressed={on}
      onClick={() => {
        const next = !on
        setOn(next)
        setSoundOn(next)
        if (next) playBed(bedForRoute(route), true)
      }}
    >
      {on ? 'sfx: on (quiet, promise)' : 'sfx: off'}
    </button>
  )
}
