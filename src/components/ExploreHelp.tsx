import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { projects } from '../data/content'
import { projectSections } from '../data/projectSections'
import { hotspots, useHotspots } from '../world/hotspots'
import '../styles/explore-help.css'

const KEY = 'inkwell-explore-hints-v1'
function readSeen(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  } catch { return [] }
}

export function ExploreHelp({ pathname, explore }: { pathname: string; explore: boolean }) {
  const { active } = useHotspots()
  const [seen, setSeen] = useState(readSeen)
  const [showHelp, setShowHelp] = useState(false)
  const [browse, setBrowse] = useState(false)
  const kind = pathname === '/' ? 'entrance' : !explore ? 'paper' : pathname === '/projects' ? 'books' : 'room'

  function remember(id: string) {
    setSeen((previous) => previous.includes(id) ? previous : [...previous, id])
  }
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(seen)) } catch { /* Hints still work without storage. */ }
  }, [seen])
  useEffect(() => {
    setShowHelp(false)
    setBrowse(false)
    if (pathname !== '/') remember('entrance')
  }, [pathname])
  useEffect(() => {
    if (!active) return
    remember(active.startsWith('proj-') ? 'books' : 'room')
    setBrowse(false)
    setShowHelp(false)
  }, [active])

  if (active) return null
  const visible = showHelp || !seen.includes(kind)
  return (
    <aside className="explore-help" aria-label="Help exploring">
      {explore && pathname === '/projects' && (
        <>
          <button className="explore-help__browse" aria-expanded={browse} aria-controls="book-picker" onClick={() => setBrowse(!browse)}>
            {browse ? 'close book list' : `browse all ${projects.length} books`} {browse ? '−' : '+'}
          </button>
          {browse && <div id="book-picker" className="explore-help__books" aria-label="Choose a project book">
            {projectSections.map((section) => <section key={section.id} className="explore-help__section" aria-label={section.title}>
              <h3>{section.title}</h3>
              <div>{section.projects.map((project) => <button key={project.slug} onClick={() => hotspots.activate(`proj-${project.slug}`)}>{project.title}</button>)}</div>
            </section>)}
          </div>}
        </>
      )}
      {visible && !browse && <div className="explore-help__note">
        <span className="explore-help__label">a little pointer</span>
        {kind === 'entrance' && <p>Choose either cover to start: <Link to="/origin">the tech side</Link> or <Link to="/session">the creative side</Link>. You can switch sides anytime.</p>}
        {kind === 'books' && <p>Click a named book to open its story. Or choose one from the book list above. Close the story with × or Escape.</p>}
        {kind === 'room' && <p>Click objects to discover their stories. The arrows move between rooms; chapter tabs take you straight to a destination.</p>}
        {kind === 'paper' && <p>Follow a project title to read its story. Chapter tabs jump between sections; the arrows take you forward or back.</p>}
        <button onClick={() => { remember(kind); setShowHelp(false) }}>got it</button>
      </div>}
      {!visible && !browse && <button className="explore-help__restore" onClick={() => setShowHelp(true)}>help exploring ?</button>}
    </aside>
  )
}
