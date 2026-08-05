import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export const INTRO_STORAGE_KEY = 'durva-intro-panels-v1'

export function shouldPlayIntro(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  if (new URLSearchParams(window.location.search).has('intro')) return true
  return sessionStorage.getItem(INTRO_STORAGE_KEY) !== '1'
}

type Props = {
  onDone?: () => void
}

const panels = [
  { id: 'tl', label: '01', word: 'build' },
  { id: 'tr', label: '02', word: 'break' },
  { id: 'bl', label: '03', word: 'ship' },
  { id: 'br', label: 'ex', word: 'repeat' },
]

export function OpeningIntro({ onDone }: Props) {
  const [visible, setVisible] = useState(() => shouldPlayIntro())
  const [phase, setPhase] = useState<'slam' | 'hold' | 'split'>('slam')

  useEffect(() => {
    ;['durva-intro-seen', 'durva-pageflip-v2', 'durva-intro-tunnel-v1', 'durva-intro-none'].forEach(
      (k) => sessionStorage.removeItem(k),
    )

    if (!visible) {
      onDone?.()
      return
    }

    const holdTimer = window.setTimeout(() => setPhase('hold'), 700)
    const splitTimer = window.setTimeout(() => setPhase('split'), 1600)
    const doneTimer = window.setTimeout(() => finish(), 2400)

    return () => {
      window.clearTimeout(holdTimer)
      window.clearTimeout(splitTimer)
      window.clearTimeout(doneTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const finish = () => {
    sessionStorage.setItem(INTRO_STORAGE_KEY, '1')
    if (new URLSearchParams(window.location.search).has('intro')) {
      const url = new URL(window.location.href)
      url.searchParams.delete('intro')
      window.history.replaceState({}, '', `${url.pathname}${url.hash}`)
    }
    setVisible(false)
    onDone?.()
  }

  const offsets: Record<string, { x: string; y: string }> = {
    tl: { x: '-110%', y: '-110%' },
    tr: { x: '110%', y: '-110%' },
    bl: { x: '-110%', y: '110%' },
    br: { x: '110%', y: '110%' },
  }

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="opening"
          role="dialog"
          aria-label="Site intro"
          key="opening"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={finish}
        >
          <div className="opening__panel-grid">
            {panels.map((panel, i) => {
              const off = offsets[panel.id]
              return (
                <motion.div
                  key={panel.id}
                  className={`opening__panel opening__panel--${panel.id}`}
                  initial={{ x: off.x, y: off.y, rotate: i % 2 === 0 ? -8 : 8 }}
                  animate={
                    phase === 'split'
                      ? { x: off.x, y: off.y, rotate: i % 2 === 0 ? -12 : 12 }
                      : { x: 0, y: 0, rotate: 0 }
                  }
                  transition={{
                    duration: phase === 'split' ? 0.55 : 0.7,
                    delay: phase === 'slam' ? i * 0.07 : 0,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <span className="opening__panel-num">{panel.label}</span>
                  <span className="opening__panel-word">{panel.word}</span>
                </motion.div>
              )
            })}
          </div>

          <motion.div
            className="opening__center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={
              phase === 'split'
                ? { opacity: 0, scale: 1.08 }
                : { opacity: 1, scale: 1 }
            }
            transition={{ delay: phase === 'slam' ? 0.55 : 0, duration: 0.35 }}
          >
            <p className="opening__meta">volume 02</p>
            <h1 className="opening__name">
              DURVA
              <span>SHARMA</span>
            </h1>
            <p className="opening__skip">tap to skip</p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
