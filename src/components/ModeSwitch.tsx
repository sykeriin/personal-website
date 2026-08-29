import type { ChromeMode } from '../hooks/useChromeMode'

/**
 * Two ways through the same volume. Read is the default: the world is scenery
 * behind a page of prose, which is what someone flipping through wants. Explore
 * hands the page over to the world and you pick things up instead.
 */
export function ModeSwitch({
  mode,
  onChange,
}: {
  mode: ChromeMode
  onChange: (mode: ChromeMode) => void
}) {
  return (
    <div className="mode-switch">
      <span aria-hidden="true">how you read it</span>
      <button
        aria-pressed={mode === 'read'}
        title="the world is scenery, the words are on the page"
        onClick={() => onChange('read')}
      >
        flip through
      </button>
      <button
        aria-pressed={mode === 'explore'}
        title="click things in the world to pick them up"
        onClick={() => onChange('explore')}
      >
        pick things up
      </button>
    </div>
  )
}
