import { Link } from 'react-router-dom'
import { hotspots, useHotspots } from '../world/hotspots'
import { projects } from '../data/content'

/**
 * The full-page reading view for a project book: click a spine on the shelf
 * and the story opens across two real pages instead of a small card fighting
 * the 3D animation for attention. Only proj- hotspots use this — everything
 * else still goes through RevealPanel.
 */
export function BookReader() {
  const { active } = useHotspots()
  const slug = active?.startsWith('proj-') ? active.slice('proj-'.length) : null
  const project = slug ? projects.find((p) => p.slug === slug) : undefined

  if (!project) return null

  return (
    <div className="book-reader" role="dialog" aria-label={project.title} onClick={() => hotspots.clear()}>
      <div className="book-reader__spread" onClick={(event) => event.stopPropagation()}>
        <button className="book-reader__close" onClick={() => hotspots.clear()} aria-label="close">
          ×
        </button>
        <div className="book-reader__page book-reader__page--left">
          <span className="book-reader__eyebrow">
            {project.award ? `Chapter 03 · ${project.award}` : `Chapter 03 · p. ${project.page}`}
          </span>
          <h2 className="book-reader__title">{project.title}</h2>
          <p className="book-reader__tagline">{project.tagline}</p>
          <ul className="book-reader__tags">
            {project.stack.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </div>
        <div className="book-reader__page book-reader__page--right">
          <p>{project.blurb}</p>
          {project.story.map((line) => (
            <p key={line.slice(0, 32)}>{line}</p>
          ))}
          {project.url ? (
            <a className="cta" href={project.url} target="_blank" rel="noreferrer">
              open the live thing
            </a>
          ) : (
            <Link className="cta" to="/projects" onClick={() => hotspots.clear()}>
              back to the shelf
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
