import { socials } from '../data/content'

/**
 * The four places he actually is, always one glance away. Entries with no URL
 * yet simply don't render — so twitter and instagram appear the moment their
 * handles land in content.ts, with no further wiring.
 */
const ORDER: Array<{ key: keyof typeof socials; label: string }> = [
  { key: 'github', label: 'gh' },
  { key: 'linkedin', label: 'in' },
  { key: 'twitter', label: 'x' },
  { key: 'instagram', label: 'ig' },
]

export function SocialStrip() {
  const live = ORDER.filter(({ key }) => socials[key])
  if (live.length === 0) return null

  return (
    <nav className="socials" aria-label="Elsewhere">
      {live.map(({ key, label }) => (
        <a key={key} href={socials[key]} target="_blank" rel="noreferrer" title={key}>
          {label}
        </a>
      ))}
    </nav>
  )
}
