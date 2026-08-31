import { Link } from 'react-router-dom'
import { GithubShelf } from '../components/GithubShelf'
import { ChapterHead, Hanko, Panel, Turn } from '../components/chrome'
import { projects } from '../data/content'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { entryFor } from '../world/manifest'

export function Projects() {
  const entry = entryFor('/projects')
  useDocumentMeta(`${entry.title} — Durva Sharma`, entry.description)

  return (
    <main className="chapter">
      <ChapterHead eyebrow={entry.label} title={entry.title} page={entry.page} />

      <p className="lede">stuff that actually left my laptop. pick one up.</p>

      <div className="panel-grid">
        {projects.map((project) => (
          <Panel key={project.slug}>
            <h2>
              <Link to={`/projects/${project.slug}`}>{project.title}</Link>
            </h2>
            <p>{project.tagline}</p>
            {project.award ? <Hanko label={project.award} /> : null}
            <div className="panel__meta">p. {project.page}</div>
          </Panel>
        ))}
      </div>

      {/* Always rendered, never behind a click: the whole shelf at one glance. */}
      <nav className="index-strip" aria-label="every project">
        {projects.map((project, i) => (
          <Link key={project.slug} to={`/projects/${project.slug}`}>
            <span className="index-strip__num">{String(i + 1).padStart(2, '0')}</span>
            <span>{project.title}</span>
            <span className="index-strip__tag">{project.tagline}</span>
          </Link>
        ))}
      </nav>

      <GithubShelf />

      <Turn path="/projects" />
    </main>
  )
}
