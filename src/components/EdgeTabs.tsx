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
  const reading = side === 'shared' ? 'tech' : side
  const tabs = tabsFor(reading)
  const flip =
    reading === 'tech'
      ? { to: '/studio', label: '↻ the creative side' }
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
