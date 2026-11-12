import { Link } from 'react-router-dom'
import { GithubShelf } from '../components/GithubShelf'
import { ChapterHead, Hanko, Panel, Turn } from '../components/chrome'
import { projectSections } from '../data/projectSections'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { entryFor } from '../world/manifest'

export function Projects() {
  const entry = entryFor('/projects')
  useDocumentMeta(`${entry.title} — Durva Sharma`, entry.description)

  return (
    <main className="chapter">
      <ChapterHead eyebrow={entry.label} title={entry.title} page={entry.page} />

      <p className="lede">ai systems, research experiments, and other things i built. pick one up.</p>

      {projectSections.map((section) => (
        <section key={section.id} className="project-section" aria-labelledby={`section-${section.id}`}>
          <h2 id={`section-${section.id}`} className="project-section__title">{section.title}</h2>
          <div className="panel-grid">
            {section.projects.map((project) => (
              <Panel key={project.slug}>
                <h3><Link to={`/projects/${project.slug}`}>{project.title}</Link></h3>
                <p>{project.tagline}</p>
                {project.award ? <Hanko label={project.award} /> : null}
                <div className="panel__meta">p. {project.page}</div>
              </Panel>
            ))}
          </div>
        </section>
      ))}

      <GithubShelf />

      <Turn path="/projects" />
    </main>
  )
}
