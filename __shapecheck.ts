import * as THREE from 'three'
import { SHAPES } from './src/world/shapes'

type P = { x: number; y: number }

function segInt(a: P, b: P, c: P, d: P): boolean {
  const o = (p: P, q: P, r: P) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x)
  const d1 = o(c, d, a)
  const d2 = o(c, d, b)
  const d3 = o(a, b, c)
  const d4 = o(a, b, d)
  const E = 1e-12
  if (((d1 > E && d2 < -E) || (d1 < -E && d2 > E)) && ((d3 > E && d4 < -E) || (d3 < -E && d4 > E))) return true
  return false
}

function selfIntersections(pts: P[]): string[] {
  const n = pts.length
  const bad: string[] = []
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue
      if (segInt(pts[i], pts[(i + 1) % n], pts[j], pts[(j + 1) % n])) {
        bad.push(`${i}x${j} @(${pts[i].x.toFixed(3)},${pts[i].y.toFixed(3)})`)
      }
    }
  }
  return bad
}

function crossIntersections(a: P[], b: P[]): number {
  let count = 0
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      if (segInt(a[i], a[(i + 1) % a.length], b[j], b[(j + 1) % b.length])) count++
    }
  }
  return count
}

function inside(p: P, poly: P[]): boolean {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const pi = poly[i]
    const pj = poly[j]
    if ((pi.y > p.y) !== (pj.y > p.y) && p.x < ((pj.x - pi.x) * (p.y - pi.y)) / (pj.y - pi.y) + pi.x) c = !c
  }
  return c
}

function area(pts: P[]): number {
  let a = 0
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j].x + pts[i].x) * (pts[j].y - pts[i].y)
  return a / 2
}

function minGap(a: P[], b: P[]): number {
  let m = Infinity
  for (const p of a) for (const q of b) m = Math.min(m, Math.hypot(p.x - q.x, p.y - q.y))
  return m
}

let failures = 0
for (const [name, fn] of Object.entries(SHAPES)) {
  const shape = fn()
  const ex = shape.extractPoints(28)
  const outer = ex.shape as P[]
  const holes = ex.holes as P[][]
  const problems: string[] = []

  if (outer.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y))) problems.push('non-finite outer point')

  const xs = outer.map((p) => p.x)
  const ys = outer.map((p) => p.y)
  const w = Math.max(...xs) - Math.min(...xs)
  const h = Math.max(...ys) - Math.min(...ys)
  const cxo = (Math.max(...xs) + Math.min(...xs)) / 2
  const cyo = (Math.max(...ys) + Math.min(...ys)) / 2
  const big = Math.max(w, h)
  if (big < 0.75 || big > 1.25) problems.push(`size ${big.toFixed(3)} not ~1.0`)
  if (Math.abs(cxo) > 0.12 || Math.abs(cyo) > 0.12) problems.push(`off-centre (${cxo.toFixed(3)},${cyo.toFixed(3)})`)

  const si = selfIntersections(outer)
  if (si.length) problems.push(`outer self-intersects x${si.length}: ${si.slice(0, 4).join(' ')}`)
  if (Math.abs(area(outer)) < 0.02) problems.push(`degenerate area ${area(outer).toFixed(4)}`)

  holes.forEach((hole, hi) => {
    const hsi = selfIntersections(hole)
    if (hsi.length) problems.push(`hole${hi} self-intersects x${hsi.length}: ${hsi.slice(0, 3).join(' ')}`)
    const xi = crossIntersections(hole, outer)
    if (xi) problems.push(`hole${hi} crosses outer x${xi}`)
    const escaped = hole.filter((p) => !inside(p, outer)).length
    if (escaped) problems.push(`hole${hi} has ${escaped}/${hole.length} points OUTSIDE outer`)
    problems.push(`~hole${hi} minGap=${minGap(hole, outer).toFixed(4)}`)
  })

  // does it actually extrude?
  try {
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false, curveSegments: 28 })
    const pos = g.attributes.position.array as ArrayLike<number>
    let nan = 0
    for (let i = 0; i < pos.length; i++) if (!Number.isFinite(pos[i])) nan++
    if (nan) problems.push(`extrude produced ${nan} non-finite floats`)
    if (g.attributes.position.count < 12) problems.push(`extrude produced only ${g.attributes.position.count} verts`)
    problems.push(`~verts=${g.attributes.position.count}`)
  } catch (e) {
    problems.push(`extrude THREW: ${(e as Error).message}`)
  }

  const hard = problems.filter((p) => !p.startsWith('~'))
  const info = problems.filter((p) => p.startsWith('~')).map((p) => p.slice(1))
  if (hard.length) failures++
  console.log(
    `${hard.length ? 'FAIL' : 'ok  '} ${name.padEnd(14)} ${w.toFixed(2)}x${h.toFixed(2)} c=(${cxo.toFixed(2)},${cyo.toFixed(2)}) pts=${outer.length} holes=${holes.length} ${info.join(' ')}`,
  )
  for (const p of hard) console.log(`        !! ${p}`)
}
console.log(failures ? `\n${failures} shape(s) failed` : '\nall shapes pass')
