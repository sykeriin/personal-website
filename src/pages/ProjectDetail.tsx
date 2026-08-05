import { Link, Navigate, useParams } from 'react-router-dom'
import { Hanko } from '../components/Hanko'
import { MangaPanel } from '../components/ChapterHeader'
import { projects } from '../data/content'

export function ProjectDetail() {
  const { slug } = useParams()
  const project = projects.find((p) => p.slug === slug)

  if (!project) {
    return <Navigate to="/projects" replace />
  }

  return (
    <main className="chapter">
      <p className="manga-panel__meta" style={{ marginBottom: '0.75rem' }}>
        <Link to="/projects" style={{ textDecoration: 'none' }}>
          ← back to projects
        </Link>
        {' · '}
        p. {project.page}
      </p>

      <div className="battle-hero">
        <div>
          <div className="chapter-header__meta">project notes</div>
          <h1>{project.title}</h1>
          <p className="battle-hero__tag">{project.tagline}</p>
          {project.url ? (
            <a className="live-link" href={project.url} target="_blank" rel="noreferrer">
              open live build
            </a>
          ) : null}
        </div>
        {project.award ? <Hanko label={project.award} /> : null}
      </div>

      <MangaPanel tilt={false}>
        <p>
          <strong>{project.blurb}</strong>
        </p>
        {project.story.map((para) => (
          <p key={para.slice(0, 28)}>{para}</p>
        ))}
        <div className="stack-stamps">
          {project.stack.map((tech) => (
            <span key={tech}>{tech}</span>
          ))}
        </div>
      </MangaPanel>

      <footer className="next-chapter">
        <Link to="/projects">← all projects</Link>
        <span className="next-chapter__page">p. {project.page}</span>
        <Link to="/skill-tree">skill tree →</Link>
      </footer>
    </main>
  )
}
