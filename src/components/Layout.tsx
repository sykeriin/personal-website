import { Suspense, lazy, useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { EdgeTabs } from './EdgeTabs'
import { InkFilters } from './InkFilters'
import { TierSwitch } from './TierSwitch'
import { SoundToggle } from '../audio/SoundToggle'
import { useRenderTier, tierUsesWebGL } from '../hooks/useRenderTier'
import { usePresence } from '../hooks/usePresence'
import { useChromeMode } from '../hooks/useChromeMode'
import { entryFor } from '../world/manifest'
import { hotspots, hotspotsForRoute, worldNav } from '../world/hotspots'
import { PageTurns } from './PageTurns'
import { HotspotList, RevealPanel } from './RevealPanel'
import { ModeSwitch } from './ModeSwitch'

/** three.js lives behind a dynamic import, so the paper tier never downloads it. */
const WorldCanvas = lazy(() => import('../world/WorldCanvas'))

export function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { tier, pinned, reduceMotion, dpr, setTier } = useRenderTier()
  const { late } = usePresence()
  const [mode, setMode] = useChromeMode()
  const rootRef = useRef<HTMLDivElement>(null)

  const world = tierUsesWebGL(tier)
  // The gallery and the blog are DOM-first: their content IS the page, so
  // explore mode (which hides the prose) would leave nothing to look at.
  const domFirst = /^\/(prints|notes)/.test(location.pathname)
  // Explore needs props to click, so it only exists where there is a world.
  const explore = world && mode === 'explore' && !domFirst
  const ids = hotspotsForRoute(location.pathname)

  // The world's meshes navigate through this valve — the canvas renders in a
  // separate reconciler where router hooks don't exist.
  useEffect(() => {
    worldNav.go = (path: string) => navigate(path)
    return () => {
      worldNav.go = () => {}
    }
  }, [navigate])

  // The visitor's local hour swaps the ink plate to indigo. theme.ts reads the
  // CSS variables, so the 3D layer follows on the next frame with no wiring.
  useEffect(() => {
    if (late) document.documentElement.dataset.inkMode = 'night'
    else delete document.documentElement.dataset.inkMode
  }, [late])

  // One plate per screen, but a different one per chapter. Setting the CSS
  // variable drives the DOM and, because theme.ts reads computed styles, the
  // shader's accent uniform follows on the next frame.
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', entryFor(location.pathname).accent)
  }, [location.pathname])

  // Without this, keyboard users land back at the top of the tab order after
  // every page turn and have to walk the whole nav again.
  useEffect(() => {
    const heading = document.getElementById('chapter-title')
    heading?.focus({ preventScroll: true })
    // A reveal belongs to the spread it was opened on…
    hotspots.clear()
    // …except a project you just picked up: arriving on its page in explore
    // mode opens the story itself, so the pick-it-up click visibly lands.
    const detail = /^\/projects\/([a-z0-9-]+)\/?$/i.exec(location.pathname)
    if (detail && explore) hotspots.activate(`story-${detail[1]}`)
    // The last page exists to be answered — the mailbox opens itself.
    if (location.pathname === '/contact' && explore) hotspots.activate('contact-envelope')
  }, [location.pathname, explore])

  return (
    <div
      className="shell"
      data-chrome={world ? 'world' : 'paper'}
      data-mode={explore ? 'explore' : 'read'}
      ref={rootRef}
    >
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
            explore={explore}
            eventSource={rootRef}
          />
        </Suspense>
      ) : null}

      <div className="ink-dom">
        <EdgeTabs />
        <Outlet />
        {explore ? <HotspotList ids={ids} /> : null}
      </div>

      {explore ? <RevealPanel /> : null}
      {world && !domFirst ? <ModeSwitch mode={mode} onChange={setMode} /> : null}

      <PageTurns />
      <TierSwitch tier={tier} pinned={pinned} onChange={setTier} />
      <SoundToggle route={location.pathname} enabled={!reduceMotion} />
    </div>
  )
}
