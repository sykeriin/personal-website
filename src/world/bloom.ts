/**
 * The colour bloom: where the visitor touches the world, colour spreads like
 * water into paper. The world renders as a two-ink print everywhere else.
 *
 * A plain mutable object rather than React state on purpose — the pointer
 * writes to it at event rate and the render loop reads it at frame rate, and
 * neither should ever cause a React render.
 */
export const bloom = {
  /** Pointer position in screen UV (0..1, y up to match gl_FragCoord). */
  x: 0.5,
  y: 0.5,
  /**
   * How far the colour reaches, in screen heights.
   * base — a small halo that follows the pointer everywhere, so the visitor
   * discovers the mechanic without being told. boost — added while hovering a
   * hotspot; more when one is picked up.
   */
  boost: 0,
}

export function trackPointer(event: PointerEvent) {
  bloom.x = event.clientX / window.innerWidth
  bloom.y = 1 - event.clientY / window.innerHeight
}
