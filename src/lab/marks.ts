import * as brush from 'p5.brush/standalone'

/**
 * Offline mark factory. Runs once in the browser (marks.html), writes PNGs into
 * src/assets/ink/marks, and those get committed as ordinary files. p5.brush is
 * explicitly not built for real-time use, so nothing here ships to the site —
 * the runtime cost is zero and the output is reviewable in a diff.
 *
 * Marks are emitted as grayscale-as-alpha so the ink shader can tint them with
 * --ink or --crimson, and so night mode retints them for free.
 */

type Mark = { name: string; size: [number, number]; draw: () => void }

const INK = '#0b0b0c'

/** Deterministic output: same seed in, same mark out, so a rerun is a no-op diff. */
function seeded(n: number) {
  brush.seed(String(n))
  brush.noiseSeed(n)
}

/** Irregular blob. Real ink pools with an uneven rim, so bleed outward and vary the radius. */
function blob(cx: number, cy: number, r: number, points: number, jitter: number, curve = 0.6) {
  brush.beginShape(curve)
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2
    const rr = r * (1 - jitter + Math.random() * jitter * 2)
    brush.vertex(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr)
  }
  brush.endShape(true)
}

/**
 * A flicked splatter: one main pool plus satellites distributed along a throw
 * vector, sized by a power law. That directional, heavy-tailed distribution is
 * what separates real splatter from a scatter of jittered circles.
 */
function splatter(seedN: number, angleDeg: number, count: number) {
  seeded(seedN)
  brush.noStroke()
  brush.fill(INK, 190)
  brush.fillBleed(0.32, 'out')
  brush.fillTexture(0.7, 0.6)

  const a = (angleDeg * Math.PI) / 180
  blob(256, 256, 62, 11, 0.34)

  for (let i = 0; i < count; i++) {
    const t = (i + 1) / count
    // power law: a few big satellites near the pool, many tiny ones far out
    const dist = 70 + Math.pow(t, 1.7) * 200
    const spread = (Math.random() - 0.5) * 0.85 * t
    const px = 256 + Math.cos(a + spread) * dist
    const py = 256 + Math.sin(a + spread) * dist
    const pr = Math.max(2.5, 26 * Math.pow(1 - t, 2.1) * (0.5 + Math.random()))
    brush.fill(INK, 150 + Math.random() * 80)
    blob(px, py, pr, 7, 0.45, 0.4)
  }
}

const marks: Mark[] = [
  { name: 'splat-01', size: [512, 512], draw: () => splatter(101, -28, 9) },
  { name: 'splat-02', size: [512, 512], draw: () => splatter(102, 14, 12) },
  { name: 'splat-03', size: [512, 512], draw: () => splatter(103, 62, 7) },
  { name: 'splat-04', size: [512, 512], draw: () => splatter(104, 158, 14) },
  { name: 'splat-05', size: [512, 512], draw: () => splatter(105, -104, 6) },
  { name: 'splat-06', size: [512, 512], draw: () => splatter(106, 96, 11) },

  {
    // Fast + dry: pressure falls away so the bristles separate at the tail.
    // This is the mark a taper function can't fake — a taper is a shape, this
    // is a stroke.
    name: 'stroke-01',
    size: [1024, 256],
    draw: () => {
      seeded(201)
      brush.set('HB', INK, 2.0)
      brush.field('seabed')
      brush.spline(
        [
          [70, 150, 1],
          [300, 104, 0.82],
          [560, 148, 0.48],
          [800, 112, 0.2],
          [960, 138, 0.04],
        ],
        0.62,
      )
      brush.noField()
    },
  },
  {
    // Slow + wet: heavy and even, pooling where the brush was lifted.
    name: 'stroke-02',
    size: [1024, 256],
    draw: () => {
      seeded(202)
      brush.set('2B', INK, 2.4)
      brush.spline(
        [
          [80, 120, 0.9],
          [340, 140, 1],
          [620, 116, 1],
          [860, 132, 0.95],
        ],
        0.5,
      )
      brush.noStroke()
      brush.fill(INK, 165)
      brush.fillBleed(0.3, 'out')
      brush.fillTexture(0.7, 0.6)
      blob(884, 130, 24, 9, 0.4)
    },
  },
  {
    name: 'stroke-03',
    size: [1024, 256],
    draw: () => {
      seeded(203)
      brush.set('pen', INK, 1.7)
      brush.field('hand')
      brush.spline(
        [
          [80, 170, 0.55],
          [280, 96, 0.95],
          [520, 176, 0.9],
          [760, 92, 0.6],
          [950, 150, 0.3],
        ],
        0.75,
      )
      brush.noField()
    },
  },
  {
    // Comma stroke — the classic gesture: thick head swelling into a thin tail.
    name: 'stroke-04',
    size: [1024, 256],
    draw: () => {
      seeded(204)
      brush.set('2B', INK, 2.8)
      brush.spline(
        [
          [140, 70, 0.15],
          [300, 60, 0.7],
          [500, 112, 1],
          [700, 176, 0.6],
          [880, 196, 0.08],
        ],
        0.85,
      )
    },
  },

  {
    name: 'hatch-01',
    size: [384, 384],
    draw: () => {
      seeded(301)
      brush.noFill()
      brush.hatchStyle('2H', INK, 0.3)
      brush.hatch(24, 32, { rand: 0.12 })
      brush.rect(192, 192, 348, 348, 'center')
      brush.noHatch()
    },
  },
  {
    name: 'hatch-02',
    size: [384, 384],
    draw: () => {
      seeded(302)
      brush.noFill()
      brush.hatchStyle('HB', INK, 0.45)
      brush.hatch(15, 32, { rand: 0.12 })
      brush.rect(192, 192, 348, 348, 'center')
      brush.hatch(17, -46, { rand: 0.14 })
      brush.rect(192, 192, 348, 348, 'center')
      brush.noHatch()
    },
  },
  {
    name: 'hatch-03',
    size: [384, 384],
    draw: () => {
      seeded(303)
      brush.noFill()
      brush.hatchStyle('HB', INK, 0.6)
      brush.hatch(10, 32, { rand: 0.1 })
      brush.rect(192, 192, 348, 348, 'center')
      brush.hatch(11, -46, { rand: 0.12 })
      brush.rect(192, 192, 348, 348, 'center')
      brush.hatch(16, 88, { rand: 0.18 })
      brush.rect(192, 192, 348, 348, 'center')
      brush.noHatch()
    },
  },

  {
    name: 'blot-01',
    size: [768, 768],
    draw: () => {
      seeded(401)
      brush.noStroke()
      brush.fill(INK, 210)
      brush.fillBleed(0.45, 'out')
      brush.fillTexture(0.85, 0.75)
      blob(384, 384, 226, 15, 0.3, 0.75)
    },
  },
]

/**
 * The brush canvas is transparent with dark ink drawn onto it, so coverage is
 * the source alpha, modulated by how dark the ink landed. Levels are stretched
 * to use the full range, but the mid-tone edge feather is deliberately kept —
 * hard-thresholding is exactly what makes scanned ink look like clip art.
 */
function toAlphaPng(source: HTMLCanvasElement): string {
  const w = source.width
  const h = source.height
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const ctx = out.getContext('2d')!
  ctx.drawImage(source, 0, 0)
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data

  const coverage = new Float32Array(w * h)
  let max = 0
  for (let p = 0; p < coverage.length; p++) {
    const i = p * 4
    const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255
    const c = (d[i + 3] / 255) * (1 - lum)
    coverage[p] = c
    if (c > max) max = c
  }
  const scale = max > 0.001 ? 1 / max : 1

  // Quantise alpha to 32 levels. These are masks, not photographs — the banding
  // is invisible once tinted, and dropping the low bits roughly halves the PNG
  // because the grain from fillTexture is otherwise near-incompressible noise.
  const STEP = 8
  for (let p = 0; p < coverage.length; p++) {
    const i = p * 4
    const a = Math.max(0, Math.min(255, Math.round(coverage[p] * scale * 255)))
    d[i] = 255
    d[i + 1] = 255
    d[i + 2] = 255
    d[i + 3] = Math.min(255, Math.round(a / STEP) * STEP)
  }
  ctx.putImageData(img, 0, 0)
  return out.toDataURL('image/png')
}

/** Tints an alpha-only mark to ink so it can be judged on paper. */
async function tinted(name: string, color: string): Promise<HTMLCanvasElement> {
  // createImageBitmap rather than Image.decode(): decoding is deferred in a tab
  // that never composites, and decode() simply never settles there.
  const res = await fetch(`/src/assets/ink/marks/${name}.png?t=${Date.now()}`)
  const bitmap = await createImageBitmap(await res.blob())
  const c = document.createElement('canvas')
  c.width = bitmap.width
  c.height = bitmap.height
  const ctx = c.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = color
  ctx.fillRect(0, 0, c.width, c.height)
  return c
}

/** Composites every generated mark onto one paper sheet for review. */
export async function renderContactSheet(): Promise<string> {
  const W = 1400
  const H = 980
  const sheet = document.createElement('canvas')
  sheet.width = W
  sheet.height = H
  const ctx = sheet.getContext('2d')!
  ctx.fillStyle = '#f7f6f3'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#0b0b0c'
  ctx.font = '13px ui-monospace, monospace'

  const place = async (name: string, x: number, y: number, w: number, h: number) => {
    const c = await tinted(name, '#0b0b0c')
    ctx.drawImage(c, x, y, w, h)
    ctx.fillText(name, x, y + h + 15)
  }

  for (let i = 0; i < 6; i++) {
    await place(`splat-0${i + 1}`, 24 + i * 222, 30, 200, 200)
  }
  for (let i = 0; i < 4; i++) {
    await place(`stroke-0${i + 1}`, 24, 290 + i * 168, 640, 160)
  }
  for (let i = 0; i < 3; i++) {
    await place(`hatch-0${i + 1}`, 700, 290 + i * 222, 200, 200)
  }
  await place('blot-01', 950, 290, 300, 300)

  // A crimson mark, to show the same asset retints for the accent plate.
  const crimson = await tinted('splat-02', '#b01030')
  ctx.drawImage(crimson, 950, 640, 300, 300)
  ctx.fillText('splat-02 retinted crimson', 950, 955)

  return sheet.toDataURL('image/png')
}

export async function generateMarks(log: (line: string) => void) {
  for (const mark of marks) {
    const canvas = document.createElement('canvas')
    canvas.width = mark.size[0]
    canvas.height = mark.size[1]

    brush.load(canvas)
    // 1.0, not higher: scaling the tips up makes the stamps visible as discrete
    // circles instead of reading as a continuous stroke.
    brush.scaleBrushes(1)
    // Standalone shares p5's WEBGL centre origin, so shift to top-left before
    // drawing. push/pop matters: the transform is global and would otherwise
    // accumulate across marks until they fall off the canvas entirely.
    brush.push()
    brush.translate(-mark.size[0] / 2, -mark.size[1] / 2)
    mark.draw()
    brush.pop()
    brush.render()

    const url = toAlphaPng(canvas)
    const res = await fetch(`/__asset?path=marks/${mark.name}.png`, { method: 'POST', body: url })
    const kb = Math.round((url.length * 0.75) / 1024)
    log(`${res.ok ? 'wrote' : 'FAILED'} marks/${mark.name}.png  ${mark.size.join('x')}  ~${kb}KB`)
  }

  const sheet = await renderContactSheet()
  await fetch('/__snap?name=marks-sheet', { method: 'POST', body: sheet })
  log('contact sheet -> node_modules/.cache/inkwell-snaps/marks-sheet.png')
  log('done')
}
