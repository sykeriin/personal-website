import { Beats, useBeats } from '../components/Beats'
import { ChapterHead, MarginNote, Panel, Turn } from '../components/chrome'
import { origin, site } from '../data/content'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { entryFor } from '../world/manifest'

const panels = origin.panels

export function Origin() {
  const entry = entryFor('/origin')
  useDocumentMeta(`${entry.title} — Durva Sharma`, entry.description)

  const { index, showAll, setShowAll, go } = useBeats(panels.length)
  // The quote is the spine of the chapter, so it never paginates away.
  const shown = showAll ? panels : [panels[index]]

  return (
    <main className="chapter">
      <ChapterHead eyebrow={entry.label} title={entry.title} page={entry.page} />

      <blockquote className="pull-quote">{origin.pullQuote}</blockquote>

      <div className={showAll ? 'panel-grid' : 'panel-grid panel-grid--single'}>
        {shown.map((panel) => (
          <Panel key={panel.title}>
            <h3>{panel.title}</h3>
            <p>{panel.body}</p>
          </Panel>
        ))}
      </div>

      <Beats
        count={panels.length}
        index={index}
        showAll={showAll}
        onGo={go}
        onShowAll={setShowAll}
      />

      <MarginNote>rn: {site.currentlyBuilding}</MarginNote>

      <Turn path="/origin" />
    </main>
  )
}
