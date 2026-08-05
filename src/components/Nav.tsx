import { Link, NavLink } from 'react-router-dom'
import { nav, site } from '../data/content'
import { PresenceNote } from './PresenceNote'

export function Nav() {
  return (
    <header className="site-nav">
      <div className="site-nav__top">
        <Link to="/" className="site-nav__brand">
          {site.name}
        </Link>
        <nav aria-label="Chapters">
          <ul className="site-nav__links">
            {nav.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to}>
                  <span className="site-nav__chapter">{item.chapter}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <PresenceNote variant="bar" />
    </header>
  )
}
