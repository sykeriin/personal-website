import { ChapterHead, Panel, Turn } from '../components/chrome'
import { creative } from '../data/content'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { entryFor } from '../world/manifest'

/** Cover B, chapter two: deciding what the thing is before anyone builds it. */
export function Direction() {
  const entry = entryFor('/direction')
  useDocumentMeta(`${entry.title} — Durva Sharma`, entry.description)

  const chapter = creative.chapters.direction

  return (
    <main className="chapter">
      <ChapterHead eyebrow={entry.label} title={entry.title} page={entry.page} />

      <p className="lede">{chapter.lede}</p>

      <div className="panel-grid">
        {chapter.panels.map((panel) => (
          <Panel key={panel.id}>
            <h2>{panel.title}</h2>
            <p>{panel.body}</p>
          </Panel>
        ))}
      </div>

      <Turn path="/direction" />
    </main>
  )
}
