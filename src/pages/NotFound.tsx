import { Link } from 'react-router-dom'
import { ChapterHead } from '../components/chrome'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { notFound } from '../world/manifest'

export function NotFound() {
  useDocumentMeta(`${notFound.title} — Durva Sharma`, notFound.description)

  return (
    <main className="chapter">
      <ChapterHead eyebrow={notFound.label} title={notFound.title} page={notFound.page} />

      <p className="lede">
        this page isn&apos;t in the volume. either i haven&apos;t drawn it yet or you typed
        something weird.
      </p>

      <Link className="cta" to="/">
        back to the cover
      </Link>
    </main>
  )
}
