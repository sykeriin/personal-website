import { ChapterHead, MarginNote, Panel, Turn } from '../components/chrome'
import { creative } from '../data/content'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { usePresence } from '../hooks/usePresence'
import { entryFor } from '../world/manifest'

/** Cover B closes on the guitar — the other 2am machine — and an open invite. */
export function Session() {
  const entry = entryFor('/session')
  const { note } = usePresence()
  useDocumentMeta(`${entry.title} — Durva Sharma`, entry.description)

  const chapter = creative.chapters.session

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

      <MarginNote>{note}</MarginNote>

      <Turn path="/session" />
    </main>
  )
}
