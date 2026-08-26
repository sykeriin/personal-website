import { Link, useParams } from 'react-router-dom'
import { Beats, useBeats } from '../components/Beats'
import { ChapterHead, Hanko, Panel, Turn } from '../components/chrome'
import { projects } from '../data/content'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { entryFor } from '../world/manifest'

export function ProjectDetail() {
  const { slug = '' } = useParams()
  const project = projects.find((p) => p.slug === slug)
  const entry = entryFor(`/projects/${slug}`)
  useDocumentMeta(`${entry.title} — Durva Sharma`, entry.description)

  // Hooks run before the miss branch — a bad slug must not change hook order.
  const story = project ? project.story : []
  const { index, showAll, setShowAll, go } = useBeats(story.length)

  if (!project) {
    return (
      <main className="chapter">
        <ChapterHead eyebrow={entry.label} title="p. ??" page={entry.page} />
        <p className="lede">
          no project by that name. i&apos;ve only shipped five things worth writing about.
        </p>
        <Link className="cta" to="/projects">
          see the five
        </Link>
        <Turn path="/projects" />
      </main>
    )
  }

  const shown = showAll ? story : [story[index]]

  return (
    <main className="chapter">
      <ChapterHead eyebrow={entry.label} title={project.title} page={entry.page} />

      {project.award ? (
        <div className="stamp-row">
          <Hanko label={project.award} />
          <p>{project.tagline}</p>
        </div>
      ) : (
        <p className="panel__meta">{project.tagline}</p>
      )}

      <p className="lede">{project.blurb}</p>

      <Panel>
        {shown.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </Panel>

      <Beats
        count={story.length}
        index={index}
        showAll={showAll}
        onGo={go}
        onShowAll={setShowAll}
        label="beat"
      />

      <ul className="tags">
        {project.stack.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      {project.url ? (
        <a className="cta" href={project.url} target="_blank" rel="noreferrer">
          open the live thing
        </a>
      ) : null}

      <Turn path={`/projects/${project.slug}`} />
    </main>
  )
}
