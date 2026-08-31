import { ChapterHead, Panel, Turn } from '../components/chrome'
import { creative } from '../data/content'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { entryFor } from '../world/manifest'

/** Cover B opens here: the half of the volume shot in frames, not functions. */
export function Studio() {
  const entry = entryFor('/studio')
  useDocumentMeta(`${entry.title} — Durva Sharma`, entry.description)

  const chapter = creative.chapters.studio

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

      <Turn path="/studio" />
    </main>
  )
}
