import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { entryFor } from '../world/manifest'

/**
 * The small presentational pieces shared by every route. All of them are plain
 * DOM: the world is chrome, the words are markup.
 */

export function ChapterHead({
  eyebrow,
  title,
  page,
}: {
  eyebrow: string
  title: string
  page: string
}) {
  return (
    <header className="chapter-head">
      <div className="chapter-head__eyebrow">{eyebrow}</div>
      {/* Focus lands here on navigation, so keyboard users are not stranded at
          the top of the tab order after every page turn. */}
      <h1 className="chapter-head__title" tabIndex={-1} id="chapter-title">
        {title}
      </h1>
      <div className="chapter-head__page">{page}</div>
    </header>
  )
}

export function Panel({
  children,
  tone = false,
  className = '',
}: {
  children: ReactNode
  tone?: boolean
  className?: string
}) {
  return (
    <article className={`panel ${tone ? 'panel--tone' : ''} ${className}`.trim()}>{children}</article>
  )
}

/** Placeholder seal. Swaps for the carved-eraser scan when that asset lands. */
export function Hanko({ label }: { label: string }) {
  return (
    <span className="hanko" role="img" aria-label={`${label} award stamp`}>
      {label}
    </span>
  )
}

/** Placeholder for a handwritten margin note. */
export function MarginNote({ children }: { children: ReactNode }) {
  return <p className="margin-note">{children}</p>
}

/** Page turn. Reads prev/next from the total manifest, so it can never render
    an empty shell the way v1's NextChapter did on an unmapped route. */
export function Turn({ path }: { path: string }) {
  const entry = entryFor(path)
  const prev = entry.prev ? entryFor(entry.prev) : null
  const next = entry.next ? entryFor(entry.next) : null

  return (
    <nav className="turn" aria-label="Page turn">
      {prev ? (
        <Link to={prev.path}>← flip back · {prev.title.toLowerCase()}</Link>
      ) : (
        <span />
      )}
      {next ? <Link to={next.path}>{next.title.toLowerCase()} · flip on →</Link> : <span />}
    </nav>
  )
}
