import { useState } from 'react'
import type { InkParams } from '../three/inkConfig'

type Spec = { key: keyof InkParams; label: string; min: number; max: number; step: number }

const LINE: Spec[] = [
  { key: 'boilFps', label: 'boil fps', min: 0, max: 24, step: 1 },
  { key: 'wobbleAmp', label: 'wobble amount', min: 0, max: 6, step: 0.1 },
  { key: 'wobbleScale', label: 'wobble scale', min: 1, max: 30, step: 0.5 },
  { key: 'baseWidth', label: 'line width', min: 0.4, max: 4, step: 0.1 },
  { key: 'nearBoost', label: 'near boost', min: 0, max: 3, step: 0.1 },
  { key: 'depthGain', label: 'contour gain', min: 1, max: 30, step: 0.5 },
  { key: 'normalGain', label: 'crease gain', min: 0, max: 6, step: 0.1 },
  { key: 'edgeBias', label: 'edge threshold', min: 0, max: 1, step: 0.01 },
  { key: 'edgeSoft', label: 'edge softness', min: 0.01, max: 1, step: 0.01 },
  { key: 'slopeComp', label: 'slope compensation', min: 0, max: 1, step: 0.05 },
  { key: 'breakLow', label: 'dry-brush low', min: 0, max: 1, step: 0.01 },
  { key: 'breakHigh', label: 'dry-brush high', min: 0, max: 1, step: 0.01 },
  { key: 'breakScale', label: 'dry-brush scale', min: 5, max: 100, step: 1 },
]

const TONE: Spec[] = [
  { key: 'dotPitch', label: 'dot pitch (css px)', min: 3, max: 20, step: 0.5 },
  { key: 'toneAngle', label: 'tone angle', min: 0, max: 1.57, step: 0.01 },
  { key: 'dotMax', label: 'dot max radius', min: 0.1, max: 0.7, step: 0.01 },
  { key: 'bands', label: 'cel bands', min: 2, max: 6, step: 1 },
  { key: 'solidStart', label: 'solid black start', min: 0, max: 0.5, step: 0.01 },
  { key: 'toneFar', label: 'tone distance fade', min: 0.1, max: 1, step: 0.01 },
  { key: 'toneStrength', label: 'dot darkness', min: 0, max: 1, step: 0.01 },
]

type Props = {
  params: InkParams
  onChange: (next: InkParams) => void
  onReset: () => void
  frozen: boolean
  onFrozenChange: (v: boolean) => void
}

export function UniformPanel({ params, onChange, onReset, frozen, onFrozenChange }: Props) {
  const [open, setOpen] = useState(true)

  const row = (s: Spec) => (
    <label key={s.key} style={styles.row}>
      <span style={styles.label}>{s.label}</span>
      <input
        type="range"
        min={s.min}
        max={s.max}
        step={s.step}
        value={params[s.key]}
        onChange={(e) => onChange({ ...params, [s.key]: Number(e.target.value) })}
        style={styles.range}
      />
      <span style={styles.value}>{params[s.key].toFixed(2)}</span>
    </label>
  )

  return (
    <div style={{ ...styles.panel, width: open ? 300 : 'auto' }}>
      <div style={styles.header}>
        <strong style={styles.title}>ink lab</strong>
        <button style={styles.btn} onClick={() => setOpen((v) => !v)}>
          {open ? 'hide' : 'show'}
        </button>
      </div>

      {open && (
        <div style={styles.body}>
          <label style={styles.check}>
            <input
              type="checkbox"
              checked={frozen}
              onChange={(e) => onFrozenChange(e.target.checked)}
            />
            freeze boil (reduced-motion state)
          </label>

          <div style={styles.group}>line</div>
          {LINE.map(row)}

          <div style={styles.group}>tone</div>
          {TONE.map(row)}

          <div style={styles.actions}>
            <button style={styles.btn} onClick={onReset}>
              reset
            </button>
            <button
              style={styles.btn}
              onClick={() => {
                // eslint-disable-next-line no-console
                console.log(JSON.stringify(params, null, 2))
              }}
            >
              log values
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const mono = "'Share Tech Mono', ui-monospace, monospace"

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'fixed',
    top: 12,
    right: 12,
    zIndex: 20,
    background: 'rgba(247,246,243,0.94)',
    border: '2px solid #0b0b0c',
    fontFamily: mono,
    fontSize: 11,
    color: '#0b0b0c',
    maxHeight: 'calc(100vh - 24px)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: '6px 8px',
    borderBottom: '2px solid #0b0b0c',
  },
  title: { letterSpacing: '0.08em', textTransform: 'uppercase' },
  body: { overflowY: 'auto', padding: '8px' },
  group: {
    margin: '10px 0 4px',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#b01030',
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 96px 38px', alignItems: 'center', gap: 6 },
  label: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  range: { width: '100%' },
  value: { textAlign: 'right' },
  check: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 },
  actions: { display: 'flex', gap: 6, marginTop: 12 },
  btn: {
    font: `inherit`,
    fontFamily: mono,
    cursor: 'pointer',
    background: '#0b0b0c',
    color: '#f7f6f3',
    border: 'none',
    padding: '4px 8px',
  },
}
