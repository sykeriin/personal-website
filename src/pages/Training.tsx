import { ChapterHead, Panel, Turn } from '../components/chrome'
import { experiences } from '../data/content'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { entryFor } from '../world/manifest'

export function Training() {
  const entry = entryFor('/training')
  useDocumentMeta(`${entry.title} — Durva Sharma`, entry.description)

  return (
    <main className="chapter">
      <ChapterHead eyebrow={entry.label} title={entry.title} page={entry.page} />

      <p className="lede">where i actually learned things. mostly by breaking them first.</p>

      <div className="panel-grid">
        {experiences.map((job) => (
          <Panel key={job.id}>
            <div className="panel__meta">
              {job.period} · {job.role}
            </div>
            <h2>{job.org}</h2>
            <p>
              <strong>{job.headline}</strong>
            </p>
            {job.story.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {job.url ? (
              <a className="cta" href={job.url} target="_blank" rel="noreferrer">
                visit {job.org.toLowerCase()}
              </a>
            ) : null}
          </Panel>
        ))}
      </div>

      <Turn path="/training" />
    </main>
  )
}
