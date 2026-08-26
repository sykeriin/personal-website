import { Link } from 'react-router-dom'
import { MarginNote, Panel, Turn } from '../components/chrome'
import { site } from '../data/content'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { usePresence } from '../hooks/usePresence'
import { entryFor } from '../world/manifest'

/**
 * The cover. No ChapterHead — the volume label and the wordmark ARE the head,
 * so the h1 is the name rather than a chapter title.
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
        <div className="chapter-head__eyebrow">{entry.label}</div>
        <h1 className="chapter-head__title" tabIndex={-1} id="chapter-title">
          {site.name}
        </h1>
      </header>

      <p className="lede">{site.coverHook}</p>
      <p>{site.coverLine}</p>

      <Link className="cta" to="/projects">
        see the projects
      </Link>

      <Panel tone>
        <div className="panel__meta">currently building</div>
        <p>{site.currentlyBuilding}</p>
      </Panel>

      <MarginNote>{note}</MarginNote>

      <Turn path="/" />
    </main>
  )
}
