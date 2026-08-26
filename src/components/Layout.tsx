import { Suspense, lazy, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { EdgeTabs } from './EdgeTabs'
import { InkFilters } from './InkFilters'
import { TierSwitch } from './TierSwitch'
import { SoundToggle } from '../audio/SoundToggle'
import { useRenderTier, tierUsesWebGL } from '../hooks/useRenderTier'
import { usePresence } from '../hooks/usePresence'

/** three.js lives behind a dynamic import, so the paper tier never downloads it. */
const WorldCanvas = lazy(() => import('../world/WorldCanvas'))

export function Layout() {
  const location = useLocation()
  const { tier, pinned, reduceMotion, dpr, setTier } = useRenderTier()
  const { late } = usePresence()
  const rootRef = useRef<HTMLDivElement>(null)

  const world = tierUsesWebGL(tier)

  // The visitor's local hour swaps the ink plate to indigo. theme.ts reads the
  // CSS variables, so the 3D layer follows on the next frame with no wiring.
  useEffect(() => {
    if (late) document.documentElement.dataset.inkMode = 'night'
    else delete document.documentElement.dataset.inkMode
  }, [late])

  // Without this, keyboard users land back at the top of the tab order after
  // every page turn and have to walk the whole nav again.
  useEffect(() => {
    const heading = document.getElementById('chapter-title')
    heading?.focus({ preventScroll: true })
  }, [location.pathname])

  return (
    <div className="shell" data-chrome={world ? 'world' : 'paper'} ref={rootRef}>
      <a className="skip-link" href="#chapter-title">
        skip to the words
      </a>

      <InkFilters animate={!reduceMotion} />

      {world ? (
        <Suspense fallback={null}>
          <WorldCanvas
            pathname={location.pathname}
            tier={tier}
            reduceMotion={reduceMotion}
            dpr={dpr}
            eventSource={rootRef}
          />
        </Suspense>
      ) : null}

      <div className="ink-dom">
        <EdgeTabs />
        <Outlet />
      </div>

      <TierSwitch tier={tier} pinned={pinned} onChange={setTier} />
      <SoundToggle route={location.pathname} enabled={!reduceMotion} />
    </div>
  )
}
