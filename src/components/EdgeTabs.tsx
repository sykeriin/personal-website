import { Link, NavLink, useLocation } from 'react-router-dom'
import { site } from '../data/content'
import { entryFor, tabsFor } from '../world/manifest'

/**
 * The book's fore-edge: real links shaped like page edges, down the right on
 * desktop and along the bottom on touch.
 *
 * The volume is tête-bêche — two front covers, two stories meeting in the
 * middle — so the fore-edge shows the tabs of whichever side is being read.
 * Shared pages (cover, contact) appear on both edges, and each side carries a
 * tab that flips the book over to the other cover.
 */
export function EdgeTabs() {
  const location = useLocation()
  const side = entryFor(location.pathname).side
  // A shared page (blog, contact, ...) has no side of its own — it used to
  // default to 'tech' outright, which snapped the fore-edge (and the flip
  // link) back to tech even mid-way through reading the creative cover.
  // Falling back to whichever side was last actually being read keeps the
  // tabs where the visitor left them.
  const reading =
    side === 'shared'
      ? (() => {
          try {
            return localStorage.getItem('inkwell-side') === 'creative' ? 'creative' : 'tech'
          } catch {
            return 'tech'
          }
        })()
      : side
  const tabs = tabsFor(reading)
  const flip =
    reading === 'tech'
      ? { to: '/session', label: '↻ the creative side' }
      : { to: '/origin', label: '↻ the tech side' }

  return (
    <nav className="edge-tabs" aria-label="Chapters">
      <Link to="/" className="edge-tabs__brand">
        {site.name}
      </Link>
      {tabs.map((entry) => (
        <NavLink key={entry.path} to={entry.path}>
          {entry.tab}
        </NavLink>
      ))}
      <Link to={flip.to} className="edge-tabs__flip">
        {flip.label}
      </Link>
    </nav>
  )
}
