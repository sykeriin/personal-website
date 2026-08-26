import { useCallback, useEffect, useState } from 'react'

/**
 * Paginated content, so long prose can be read without the page scrolling.
 * Advancing is a beat: on a project detail it steps the model forward too.
 *
 * Arrow keys work, the dots are real buttons, and the whole set can be dumped
 * flat — because someone evaluating Durva for a role should not have to click
 * three times to read three paragraphs.
 */
export function useBeats(count: number) {
  const [index, setIndex] = useState(0)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    setIndex(0)
    setShowAll(false)
  }, [count])

  const go = useCallback(
    (next: number) => setIndex(Math.max(0, Math.min(count - 1, next))),
    [count],
  )

  useEffect(() => {
    if (showAll) return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      if (event.key === 'ArrowRight') go(index + 1)
      if (event.key === 'ArrowLeft') go(index - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, index, showAll])

  return { index, showAll, setShowAll, go }
}

export function Beats({
  count,
  index,
  showAll,
  onGo,
  onShowAll,
  label = 'panel',
}: {
  count: number
  index: number
  showAll: boolean
  onGo: (next: number) => void
  onShowAll: (value: boolean) => void
  label?: string
}) {
  if (count <= 1) return null

  return (
    <div className="beats">
      <button
        className="beats__btn"
        onClick={() => onGo(index - 1)}
        disabled={showAll || index === 0}
      >
        ←
      </button>
      <div className="beats__dots" role="tablist" aria-label={`${label} pagination`}>
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            className="beats__dot"
            role="tab"
            aria-current={!showAll && i === index}
            aria-label={`${label} ${i + 1} of ${count}`}
            onClick={() => {
              onShowAll(false)
              onGo(i)
            }}
          />
        ))}
      </div>
      <button
        className="beats__btn"
        onClick={() => onGo(index + 1)}
        disabled={showAll || index === count - 1}
      >
        →
      </button>
      <button className="beats__btn" onClick={() => onShowAll(!showAll)}>
        {showAll ? 'one at a time' : 'just show me all of it'}
      </button>
    </div>
  )
}
