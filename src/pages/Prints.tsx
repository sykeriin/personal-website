import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChapterHead, Turn } from '../components/chrome'
import { Beats, useBeats } from '../components/Beats'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { entryFor } from '../world/manifest'

/**
 * The photo insert, reached from the claims it proves rather than from the
 * fore-edge: "i model" links to /prints/modelling, "i direct shoots" to
 * /prints/shoots, and so on. One viewer, filtered by category.
 *
 * Categories are subfolders: drop JPGs into src/assets/photos/<category>/ and
 * both the category chip and its images exist. No code changes to publish.
 */

const files = import.meta.glob('../assets/photos/**/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

type Print = { url: string; name: string; category: string }

const prints: Print[] = Object.entries(files)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, url]) => {
    const parts = path.split('/')
    return {
      url,
      category: parts[parts.length - 2] ?? 'misc',
      name: (parts.pop() ?? '').replace(/\.[a-z]+$/i, '').replace(/[-_]/g, ' '),
    }
  })

const categories = [...new Set(prints.map((print) => print.category))]

/** What each empty category says while its photos are still at the printers. */
const PENDING: Record<string, string> = {
  modelling: 'the modelling shots go here.',
  shoots: 'stills from shoots i directed go here.',
  video: 'frames from the edits go here.',
  design: 'design work goes here.',
}

export function Prints() {
  const { cat } = useParams()
  const entry = entryFor('/prints')
  useDocumentMeta(
    `${cat ? `${cat} — ` : ''}${entry.title} — Durva Sharma`,
    entry.description,
  )

  const shown = useMemo(
    () => (cat ? prints.filter((print) => print.category === cat) : prints),
    [cat],
  )
  const { index, showAll, setShowAll, go } = useBeats(Math.max(shown.length, 1))
  useEffect(() => {
    go(0)
  }, [cat, go])

  const current = shown[Math.min(index, shown.length - 1)]

  return (
    <main className="chapter">
      <ChapterHead
        eyebrow={entry.label}
        title={cat ? `Prints · ${cat}` : entry.title}
        page={entry.page}
      />
      <p className="lede">the photo insert. flip through, or jump a category.</p>

      <ul className="tags">
        <li className={cat ? '' : 'tags__on'}>
          <Link to="/prints">all</Link>
        </li>
        {['modelling', 'shoots', 'video', 'design'].map((known) => (
          <li key={known} className={cat === known ? 'tags__on' : ''}>
            <Link to={`/prints/${known}`}>{known}</Link>
          </li>
        ))}
        {categories
          .filter((found) => !['modelling', 'shoots', 'video', 'design'].includes(found))
          .map((extra) => (
            <li key={extra} className={cat === extra ? 'tags__on' : ''}>
              <Link to={`/prints/${extra}`}>{extra}</Link>
            </li>
          ))}
      </ul>

      {shown.length === 0 ? (
        <div className="panel panel--tone">
          <h2>this signature is at the printers</h2>
          <p>{PENDING[cat ?? ''] ?? 'photos from real work go here.'}</p>
        </div>
      ) : showAll ? (
        <div className="gallery gallery--sheet">
          {shown.map((print, i) => (
            <button
              key={print.url}
              className="gallery__thumb"
              onClick={() => {
                setShowAll(false)
                go(i)
              }}
            >
              <img src={print.url} alt={print.name} loading="lazy" />
            </button>
          ))}
        </div>
      ) : current ? (
        <figure className="gallery">
          <img src={current.url} alt={current.name} />
          <figcaption>
            <span>
              {current.name} · {current.category}
            </span>
            <span>
              print {index + 1} / {shown.length}
            </span>
          </figcaption>
        </figure>
      ) : null}

      {shown.length > 1 ? (
        <Beats
          count={shown.length}
          index={index}
          showAll={showAll}
          onGo={go}
          onShowAll={setShowAll}
          label="print"
        />
      ) : null}

      <Turn path="/prints" />
    </main>
  )
}
