/**
 * Lab only. When the browser pane never composites, ResizeObserver callbacks
 * are never delivered, so react-three-fiber measures its container as 0x0 and
 * refuses to create a root — nothing renders at all.
 *
 * This wraps ResizeObserver so observed elements also get their real
 * getBoundingClientRect pushed through the callback on a few timers and on
 * window resize. The native observer is still attached, so real environments
 * behave exactly as before.
 */
export function installResizeObserverShim() {
  if (typeof window === 'undefined') return
  const Native = window.ResizeObserver
  if (!Native || (Native as unknown as { __inkShim?: boolean }).__inkShim) return

  class ShimResizeObserver implements ResizeObserver {
    #callback: ResizeObserverCallback
    #native: ResizeObserver
    #targets = new Set<Element>()

    constructor(callback: ResizeObserverCallback) {
      this.#callback = callback
      this.#native = new Native(callback)
      window.addEventListener('resize', this.#flush)
    }

    #flush = () => {
      if (this.#targets.size === 0) return
      const entries: ResizeObserverEntry[] = []
      for (const target of this.#targets) {
        const rect = target.getBoundingClientRect()
        if (rect.width === 0 && rect.height === 0) continue
        const box = [{ inlineSize: rect.width, blockSize: rect.height }]
        entries.push({
          target,
          contentRect: rect,
          borderBoxSize: box,
          contentBoxSize: box,
          devicePixelContentBoxSize: box,
        } as unknown as ResizeObserverEntry)
      }
      if (entries.length > 0) this.#callback(entries, this)
    }

    observe(target: Element, options?: ResizeObserverOptions) {
      this.#targets.add(target)
      this.#native.observe(target, options)
      for (const delay of [0, 50, 250, 800]) window.setTimeout(this.#flush, delay)
    }

    unobserve(target: Element) {
      this.#targets.delete(target)
      this.#native.unobserve(target)
    }

    disconnect() {
      this.#targets.clear()
      this.#native.disconnect()
      window.removeEventListener('resize', this.#flush)
    }
  }

  ;(ShimResizeObserver as unknown as { __inkShim: boolean }).__inkShim = true
  window.ResizeObserver = ShimResizeObserver as unknown as typeof ResizeObserver
}
