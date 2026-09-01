import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChapterHead, Turn } from '../components/chrome'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { noteBySlug, notes } from '../content/notes'
import { entryFor } from '../world/manifest'

/** The blog index. Deliberately the plainest room in the building. */
export function Notes() {
  const entry = entryFor('/notes')
  useDocumentMeta(`${entry.title} — Durva Sharma`, entry.description)

  return (
    <main className="chapter">
      <ChapterHead eyebrow={entry.label} title={entry.title} page={entry.page} />
      <p className="lede">longer things. build logs, shoot write-ups, 2am thoughts.</p>

      {notes.length === 0 ? (
        <p>nothing yet. the first one is probably being written right now.</p>
      ) : (
        <div className="index-strip">
          {notes.map((note) => (
            <Link key={note.slug} to={`/notes/${note.slug}`}>
              <span className="index-strip__num">{note.date}</span>
              <span>{note.title}</span>
              <span className="index-strip__tag">read →</span>
            </Link>
          ))}
        </div>
      )}

      <Turn path="/notes" />
    </main>
  )
}

/** One note, markdown rendered to the page. */
export function NotePost() {
  const { slug } = useParams()
  const note = slug ? noteBySlug(slug) : undefined
  const entry = entryFor('/notes')

  useDocumentMeta(
    note ? `${note.title} — Durva Sharma` : 'post not found — Durva Sharma',
    note ? `a note from ${note.date}` : entry.description,
  )

  const html = useMemo(
    () => (note ? DOMPurify.sanitize(marked.parse(note.body) as string) : ''),
    [note],
  )

  if (!note) {
    return (
      <main className="chapter">
        <ChapterHead eyebrow="Blog" title="p. ??" page="p. ??" />
        <p>no note by that name.</p>
        <Link className="cta" to="/notes">
          back to the notes
        </Link>
      </main>
    )
  }

  return (
    <main className="chapter">
      <ChapterHead eyebrow={`Blog · ${note.date}`} title={note.title} page="" />
      {/* Repo-authored markdown, sanitized anyway — belt and braces. */}
      <article className="note" dangerouslySetInnerHTML={{ __html: html }} />
      <Link className="cta" to="/notes">
        ← all notes
      </Link>
    </main>
  )
}
