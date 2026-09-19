import { useProgress } from '@react-three/drei'

/**
 * A small always-on-screen tell that the world is still fetching textures,
 * so a slow connection reads as "still drawing" instead of "did this break."
 * useProgress reads THREE.DefaultLoadingManager directly, so this works as a
 * DOM sibling of the Canvas — no prop drilling from inside the R3F tree.
 */
export function LoadIndicator() {
  const { active, progress } = useProgress()
  if (!active) return null

  return (
    <div className="load-indicator" role="status" aria-live="polite">
      <span className="load-indicator__label">inking the page…</span>
      <div className="load-indicator__track">
        <div className="load-indicator__bar" style={{ width: `${Math.round(progress)}%` }} />
      </div>
    </div>
  )
}
