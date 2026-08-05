import { useEffect, useMemo, useState } from 'react'

export type PerformanceMode = {
  useWebGL: boolean
  dpr: [number, number] | number
  reduceMotion: boolean
}

function computeMode(): PerformanceMode {
  if (typeof window === 'undefined') {
    return { useWebGL: false, dpr: 1, reduceMotion: true }
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const mobile = window.matchMedia('(max-width: 768px)').matches
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const saveData =
    'connection' in navigator &&
    Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData)

  const useWebGL = !reduceMotion && !mobile && !saveData

  return {
    useWebGL,
    dpr: mobile || coarse ? 1 : [1, 1.5],
    reduceMotion,
  }
}

export function usePerformanceMode(): PerformanceMode {
  const [mode, setMode] = useState<PerformanceMode>(() => computeMode())

  useEffect(() => {
    const update = () => setMode(computeMode())
    const mqMobile = window.matchMedia('(max-width: 768px)')
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    mqMobile.addEventListener('change', update)
    mqMotion.addEventListener('change', update)
    window.addEventListener('resize', update)
    return () => {
      mqMobile.removeEventListener('change', update)
      mqMotion.removeEventListener('change', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return useMemo(() => mode, [mode])
}

export function useDocumentVisible(): boolean {
  const [visible, setVisible] = useState(
    typeof document === 'undefined' ? true : document.visibilityState === 'visible',
  )

  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  return visible
}
