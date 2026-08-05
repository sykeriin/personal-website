import { usePresenceNote } from '../hooks/usePresenceNote'

type Props = {
  variant?: 'cover' | 'bar' | 'inline'
  className?: string
}

export function PresenceNote({ variant = 'inline', className = '' }: Props) {
  const { line, late } = usePresenceNote()

  return (
    <p
      className={`presence-note presence-note--${variant} ${late ? 'presence-note--late' : ''} ${className}`.trim()}
      aria-live="polite"
    >
      {line}
    </p>
  )
}
