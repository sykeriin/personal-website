import { useMemo } from 'react'
import { ChapterHead, Turn } from '../components/chrome'
import { Beats, useBeats } from '../components/Beats'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { entryFor } from '../world/manifest'

/**
 * The photo insert. Manga volumes bind a glossy signature of photographs into
 * the middle of the book — this is that, for his shoots. Flip through one
 * print at a time; arrow keys work via useBeats.
 *
 * Images are discovered by filename: drop JPGs into src/assets/photos/shoots
 * and they're in the book, newest name last. No code changes to publish.
 */

const prints = Object.entries(
  import.meta.glob('../assets/photos/shoots/*.{jpg,jpeg,png,webp}', {
    eager: true,
    query: '?url',
    import: 'default',
  }) as Record<string, string>,
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, url]) => ({
    url,
    name: (path.split('/').pop() ?? '').replace(/\.[a-z]+$/i, '').replace(/[-_]/g, ' '),
  }))

export function Prints() {
  const entry = entryFor('/prints')
  useDocumentMeta(`${entry.title} — Durva Sharma`, entry.description)
  const { index, showAll, setShowAll, go } = useBeats(Math.max(prints.length, 1))

  const current = useMemo(() => prints[index], [index])

  return (
    <main className="chapter">
      <ChapterHead eyebrow={entry.label} title={entry.title} page={entry.page} />
      <p className="lede">the photo insert — shoots i modelled in or directed. flip through.</p>

      {prints.length === 0 ? (
        <div className="panel panel--tone">
          <h2>the insert is at the printers</h2>
          <p>
            photos from real shoots go here. (durva: drop jpgs into{' '}
            <code>src/assets/photos/shoots/</code> and they appear — no code, no rebuild
            of anything else.)
          </p>
        </div>
      ) : showAll ? (
        <div className="gallery gallery--sheet">
          {prints.map((print, i) => (
            <button key={print.url} className="gallery__thumb" onClick={() => { setShowAll(false); go(i) }}>
              <img src={print.url} alt={print.name} loading="lazy" />
            </button>
          ))}
        </div>
      ) : (
        <figure className="gallery">
          <img src={current.url} alt={current.name} />
          <figcaption>
            <span>{current.name}</span>
            <span>
              print {index + 1} / {prints.length}
            </span>
          </figcaption>
        </figure>
      )}

      {prints.length > 1 ? (
        <Beats
          count={prints.length}
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
