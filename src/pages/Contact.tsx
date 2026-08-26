import { ChapterHead, MarginNote, Panel, Turn } from '../components/chrome'
import { contactBits, funThings, site } from '../data/content'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { usePresence } from '../hooks/usePresence'
import { entryFor } from '../world/manifest'

export function Contact() {
  const entry = entryFor('/contact')
  useDocumentMeta(`${entry.title} — Durva Sharma`, entry.description)
  const { note } = usePresence()

  return (
    <main className="chapter">
      <ChapterHead eyebrow={entry.label} title={entry.title} page={entry.page} />

      <p className="lede">
        wanna build something weird, talk ai stuff, or trade muay thai tips? i&apos;m around.
      </p>

      <Panel>
        <h2>where to find me</h2>
        <ul>
          {contactBits.map((bit) => {
            // The address is plain visible text with a real mailto — nobody
            // should have to click anything to read an email address.
            const external = bit.href.startsWith('http')
            return (
              <li key={bit.label}>
                <span className="panel__meta">{bit.label}</span>{' '}
                <a
                  href={bit.href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noreferrer' : undefined}
                >
                  {bit.text}
                </a>
              </li>
            )
          })}
        </ul>
      </Panel>

      <Panel tone>
        <h2>off-panel</h2>
        <p>{funThings}</p>
        <p>rn: {site.currentlyBuilding}</p>
      </Panel>

      <MarginNote>{note}</MarginNote>

      <Turn path="/contact" />
    </main>
  )
}
