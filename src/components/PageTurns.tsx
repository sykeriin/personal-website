import { Link, useLocation } from 'react-router-dom'
import { entryFor } from '../world/manifest'

/**
 * The easy way to turn pages: two big chevrons at the screen edges, driven by
 * the same manifest chain as everything else. The fore-edge tabs remain the
 * map; these are the "just keep reading" affordance — vertical tab text is a
 * destination picker, not a page turner.
 */
export function PageTurns() {
  const location = useLocation()
  const entry = entryFor(location.pathname)
  const prev = entry.prev ? entryFor(entry.prev) : null
  const next = entry.next ? entryFor(entry.next) : null

  return (
    <>
      {prev ? (
        <Link
          className="page-turn page-turn--prev"
          to={prev.path}
          aria-label={`flip back to ${prev.title}`}
          title={`← ${prev.title.toLowerCase()}`}
        >
          ‹
        </Link>
      ) : null}
      {next ? (
        <Link
          className="page-turn page-turn--next"
          to={next.path}
          aria-label={`flip on to ${next.title}`}
          title={`${next.title.toLowerCase()} →`}
        >
          ›
        </Link>
      ) : null}
    </>
  )
}
