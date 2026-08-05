import { ChapterHeader, MangaPanel } from '../components/ChapterHeader'
import { NextChapter } from '../components/NextChapter'
import { PresenceNote } from '../components/PresenceNote'
import { contactBits, funThings, site } from '../data/content'

export function Contact() {
  return (
    <main className="chapter chapter--contact">
      <ChapterHeader title="Last Page" subtitle="To Be Continued…" />

      <div className="contact-grid">
        <MangaPanel>
          <p>wanna build something weird, talk ai stuff, or trade muay thai tips? i'm around.</p>
          <div className="contact-links">
            {contactBits.map((bit) => (
              <a
                key={bit.label}
                href={bit.href}
                target={bit.href.startsWith('http') ? '_blank' : undefined}
                rel="noreferrer"
              >
                <span>{bit.label}</span>
                {bit.text}
              </a>
            ))}
          </div>
          <PresenceNote variant="inline" className="contact-day" />
        </MangaPanel>

        <MangaPanel className="fun-panel" delay={0.08}>
          <h3>off-panel</h3>
          <p>{funThings}</p>
          <p style={{ marginTop: '0.75rem', fontStyle: 'normal', opacity: 0.75 }}>
            rn: {site.currentlyBuilding}
          </p>
        </MangaPanel>
      </div>

      <NextChapter path="/contact" />
    </main>
  )
}
