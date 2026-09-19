import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { hotspots, reveals, useHotspots } from '../world/hotspots'

/**
 * What a clicked prop says.
 *
 * Explore mode hides the prose slab, so this is the only route to that content
 * for a mouse user — which is exactly why the keyboard list below it exists and
 * why `read` remains the default mode. Nothing here is content you cannot reach
 * another way.
 */
export function RevealPanel() {
  const { active } = useHotspots()
  const panel = useRef<HTMLDivElement>(null)
  // Project books now open into their own full-page BookReader, which is
  // the actual answer to "where do I read about this" — this panel would
  // just be a second, smaller copy of the same text underneath it.
  const reveal = active && !active.startsWith('proj-') ? reveals[active] : undefined

  useEffect(() => {
    if (reveal) panel.current?.focus()
  }, [reveal])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hotspots.clear()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!reveal) return null

  return (
    <div
      className="reveal"
      ref={panel}
      tabIndex={-1}
      role="dialog"
      aria-live="polite"
      aria-label={reveal.title}
    >
      <div className="reveal__head">
        <span className="reveal__eyebrow">{reveal.eyebrow}</span>
        <button className="reveal__close" onClick={() => hotspots.clear()} aria-label="close">
          ×
        </button>
      </div>
      <h2 className="reveal__title">{reveal.title}</h2>
      {reveal.body.map((line) => (
        <p key={line.slice(0, 32)}>{line}</p>
      ))}
      {reveal.tags ? (
        <ul className="tags">
          {reveal.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      ) : null}
      {reveal.links ? (
        <p className="reveal__links">
          {reveal.links.map((entry) => (
            <a key={entry.to} className="cta" href={entry.to} target="_blank" rel="noreferrer">
              {entry.label}
            </a>
          ))}
        </p>
      ) : null}
      {reveal.link ? (
        reveal.link.external ? (
          <a className="cta" href={reveal.link.to} target="_blank" rel="noreferrer">
            {reveal.link.label}
          </a>
        ) : (
          <Link className="cta" to={reveal.link.to} onClick={() => hotspots.clear()}>
            {reveal.link.label}
          </Link>
        )
      ) : null}
    </div>
  )
}

/**
 * The keyboard path into the same reveals. Visually quiet but never hidden from
 * assistive tech — a mesh cannot be tabbed to, so every hotspot gets a real
 * button here.
 */
export function HotspotList({ ids }: { ids: string[] }) {
  const { active } = useHotspots()
  if (ids.length === 0) return null

  return (
    <nav className="hotspot-list" aria-label="Things you can pick up">
      {ids.map((id) => {
        const reveal = reveals[id]
        if (!reveal) return null
        return (
          <button
            key={id}
            aria-pressed={active === id}
            onClick={() => hotspots.activate(id)}
          >
            {reveal.title}
          </button>
        )
      })}
    </nav>
  )
}
