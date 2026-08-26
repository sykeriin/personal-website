import { Link, NavLink } from 'react-router-dom'
import { site } from '../data/content'
import { tabs } from '../world/manifest'

/**
 * The book's fore-edge: real links shaped like page edges, down the right on
 * desktop and along the bottom on touch.
 *
 * Present on every route including the cover. v1 hid its nav on `/`, which was
 * the single worst thing on the site for anyone who just wanted to find the
 * projects.
 */
export function EdgeTabs() {
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
    </nav>
  )
}
