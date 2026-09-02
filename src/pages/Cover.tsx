import { Link } from 'react-router-dom'
import { MarginNote } from '../components/chrome'
import { creative, site } from '../data/content'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { usePresence } from '../hooks/usePresence'
import { entryFor, sideAccent } from '../world/manifest'

/**
 * The cover, whose one job is the choice. This is a tête-bêche volume — two
 * front covers, two stories meeting in the middle — so entering the site IS
 * picking which cover to open. Everything else that used to live here moved
 * to the chapters it belonged to; a landing page with one purpose needs one
 * hero, and the fork is it.
 *
 * Deliberately not a modal or a gate: deep links skip it entirely, the edge
 * tabs still work, and a returning visitor just clicks straight through.
 */
export function Cover() {
  const entry = entryFor('/')
  const { note } = usePresence()

  // entry.title is the name here, so the shared `title — Durva Sharma` shape
  // would read as a stutter. The volume is the honest second half.
  useDocumentMeta(`${site.name} — ${entry.label}`, entry.description)

  return (
    <main className="chapter">
      <header className="chapter-head">
        <div className="chapter-head__eyebrow">{entry.label} · two covers, one spine</div>
        <h1 className="chapter-head__title" tabIndex={-1} id="chapter-title">
          {site.name}
        </h1>
      </header>

      <p className="lede">{site.coverHook}</p>

      {/* The fork. Each half is a front cover: side A builds, side B shoots. */}
      <nav className="fork" aria-label="Pick a side">
        <Link
          className="fork__side"
          to="/origin"
          style={{ '--fork': sideAccent.tech } as React.CSSProperties}
        >
          <span className="fork__label">cover a</span>
          <span className="fork__title">the tech side</span>
          <span className="fork__blurb">apps, agents, pipelines that eventually behave</span>
          <span className="fork__go">open it →</span>
        </Link>
        <Link
          className="fork__side"
          to="/session"
          style={{ '--fork': sideAccent.creative } as React.CSSProperties}
        >
          <span className="fork__label">cover b</span>
          <span className="fork__title">the creative side</span>
          <span className="fork__blurb">modelling, directing shoots, designing the thing</span>
          <span className="fork__go">flip it →</span>
        </Link>
      </nav>

      <p className="fork__hint">{creative.hook}</p>

      <MarginNote>{note}</MarginNote>
    </main>
  )
}
