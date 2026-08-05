import { ChapterHeader, MangaPanel } from '../components/ChapterHeader'
import { NextChapter } from '../components/NextChapter'
import { origin, site } from '../data/content'

export function Origin() {
  return (
    <main className="chapter">
      <ChapterHeader title="Chapter 01" subtitle="Origin" />
      <p className="pull-quote">{origin.pullQuote}</p>
      <div className="status-strip">
        <span>
          <strong>rn</strong>
          {site.currentlyBuilding}
        </span>
      </div>
      <div className="panel-grid panel-grid--2">
        {origin.panels.map((panel, i) => (
          <MangaPanel key={panel.title} delay={i * 0.06}>
            <h3>{panel.title}</h3>
            <p>{panel.body}</p>
          </MangaPanel>
        ))}
      </div>
      <NextChapter path="/origin" />
    </main>
  )
}
