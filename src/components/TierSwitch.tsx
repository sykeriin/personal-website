import type { RenderTier } from '../hooks/useRenderTier'

/**
 * The visitor's override, respected above all auto-detection. Labelled in
 * Durva's voice rather than in engineering terms — nobody should have to know
 * what a render tier is to turn one off.
 */
const OPTIONS: Array<{ tier: RenderTier; label: string; hint: string }> = [
  { tier: 'inked', label: 'heavy', hint: 'the full inked world' },
  { tier: 'flat', label: 'light', hint: 'less fancy, still 3d' },
  { tier: 'paper', label: 'just the words', hint: 'flat, no 3d at all' },
]

export function TierSwitch({
  tier,
  pinned,
  onChange,
}: {
  tier: RenderTier
  pinned: boolean
  onChange: (tier: RenderTier | null) => void
}) {
  const active: RenderTier = tier === 'inked-plus' ? 'inked' : tier

  return (
    <div className="tier-switch">
      <span aria-hidden="true">too much?</span>
      {OPTIONS.map((option) => (
        <button
          key={option.tier}
          aria-pressed={active === option.tier}
          title={option.hint}
          onClick={() => onChange(option.tier)}
        >
          {option.label}
        </button>
      ))}
      {pinned ? (
        <button title="go back to picking automatically" onClick={() => onChange(null)}>
          auto
        </button>
      ) : null}
    </div>
  )
}
