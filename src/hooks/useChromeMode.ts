import { useCallback, useState } from 'react'

/**
 * How the visitor wants to take the site in. Separate from the render tier,
 * which is about capability — this is about intent.
 *
 * `read` is the default and stays the default: the world is scenery behind a
 * page of prose, which is what someone flipping through wants. `explore` hands
 * the page over to the world, so content is revealed by clicking the props
 * rather than laid out in a slab.
 */
export type ChromeMode = 'read' | 'explore'

const STORAGE_KEY = 'inkwell-mode'

export function useChromeMode(): [ChromeMode, (mode: ChromeMode) => void] {
  const [mode, setModeState] = useState<ChromeMode>(() => {
    if (typeof window === 'undefined') return 'read'
    try {
      return localStorage.getItem(STORAGE_KEY) === 'explore' ? 'explore' : 'read'
    } catch {
      return 'read'
    }
  })

  const setMode = useCallback((next: ChromeMode) => {
    setModeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* private mode: the choice just doesn't persist */
    }
  }, [])

  return [mode, setMode]
}
