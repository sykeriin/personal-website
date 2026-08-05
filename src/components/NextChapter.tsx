import { Link } from 'react-router-dom'
import { chapterMeta } from '../data/content'

type Props = {
  path: string
}

export function NextChapter({ path }: Props) {
  const meta = chapterMeta[path]
  if (!meta) return null

  return (
    <footer className="next-chapter">
      <div>
        {meta.prev ? (
          <Link to={meta.prev}>{meta.prev === '/' ? '← Cover' : '← Prev chapter'}</Link>
        ) : (
          <span />
        )}
      </div>
      <span className="next-chapter__page">{meta.page}</span>
      <div>
        {meta.next ? (
          <Link to={meta.next}>{meta.next === '/' ? 'Back to cover →' : 'Next chapter →'}</Link>
        ) : null}
      </div>
    </footer>
  )
}
