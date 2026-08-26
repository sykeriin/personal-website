/**
 * The DOM half of the ink look. Panel borders are displaced by fractal noise so
 * they wobble like a drawn line rather than sitting perfectly straight.
 *
 * The seed steps through three discrete values every 0.3s — 10fps, the same
 * rate as the shader's boil, so the flat tier and the world tier breathe
 * together. Discrete, not smooth: a line that slides reads as an effect, a line
 * that snaps reads as drawn.
 *
 * SMIL is not covered by prefers-reduced-motion, so the animation element is
 * simply not rendered when motion is reduced. The wobble stays — a frozen
 * hand-drawn line is still hand-drawn; a straight line is a different design.
 */
export function InkFilters({ animate }: { animate: boolean }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        <filter id="ink-wobble" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.024"
            numOctaves="2"
            seed="3"
            result="noise"
          >
            {animate ? (
              <animate
                attributeName="seed"
                values="3;11;19"
                dur="0.3s"
                calcMode="discrete"
                repeatCount="indefinite"
              />
            ) : null}
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="3.4"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  )
}
