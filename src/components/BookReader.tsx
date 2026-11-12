import { useEffect, useRef } from 'react'
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
  const spread = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!project) return
    const previous = document.activeElement as HTMLElement | null
    spread.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hotspots.clear()
      if (event.key !== 'Tab') return
      const controls = spread.current?.querySelectorAll<HTMLElement>('button, a[href]')
      if (!controls?.length) return
      const first = controls[0], last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (previous?.isConnected) previous.focus()
      else requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('.explore-help__browse')?.focus())
    }
  }, [project])

  if (!project) return null

  return (
    <div className="book-reader" role="dialog" aria-modal="true" aria-label={project.title} onClick={() => hotspots.clear()}>
      <div ref={spread} className="book-reader__spread" onClick={(event) => event.stopPropagation()}>
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
              {project.url.includes('github.com/') ? 'see the code on github' : 'open the live thing'}
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
