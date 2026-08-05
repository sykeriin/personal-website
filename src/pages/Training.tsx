import { ChapterHeader, MangaPanel } from '../components/ChapterHeader'
import { NextChapter } from '../components/NextChapter'
import { experiences } from '../data/content'

export function Training() {
  return (
    <main className="chapter">
      <ChapterHeader title="Chapter 02" subtitle="Training Arc" />
      <div className="panel-grid">
        {experiences.map((job, i) => (
          <MangaPanel key={job.id} delay={i * 0.08}>
            <div className="manga-panel__meta">
              {job.period} · {job.role}
            </div>
            <h2>{job.org}</h2>
            <p>
              <strong>{job.headline}</strong>
            </p>
            {job.story.map((para) => (
              <p key={para.slice(0, 24)}>{para}</p>
            ))}
            {job.url ? (
              <a className="live-link" href={job.url} target="_blank" rel="noreferrer">
                Visit {job.org}
              </a>
            ) : null}
          </MangaPanel>
        ))}
      </div>
      <NextChapter path="/training" />
    </main>
  )
}
