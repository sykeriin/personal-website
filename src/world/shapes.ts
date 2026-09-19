import * as THREE from 'three'

/**
 * Drawn silhouettes for the world's props.
 *
 * The ink renderer finds each object's OUTLINE by running edge detection over a
 * depth + normal buffer. Interior detail is almost entirely thrown away, so the
 * silhouette carries the whole read. Every shape here is designed to survive the
 * "fill it solid black" test: if you cannot name the object from its filled
 * outline, the shape is wrong.
 *
 * Coordinate convention
 * ---------------------
 * Every shape is centred near the origin in the XY plane, sized so that its
 * LARGEST dimension is roughly 1.0 unit. Callers scale to taste (and extrude
 * along +Z). Nothing here assumes a particular extrusion depth.
 *
 * Style: curves over straight lines almost everywhere. Straight runs are
 * reserved for things that genuinely are straight — a book spine, the sides of
 * a waveform bar — so the rest reads as hand-drawn rather than CAD.
 */

const D = Math.PI / 180

/**
 * Point at `along` units down the axis at `deg`, offset `side` units to the
 * axis's left. Used by the radial shapes (leaves, bursts) so their spokes can be
 * described in local "length / width" terms instead of raw coordinates.
 */
function axial(deg: number, along: number, side: number): [number, number] {
  const a = deg * D
  const c = Math.cos(a)
  const s = Math.sin(a)
  return [c * along - s * side, s * along + c * side]
}

/**
 * Trace a closed, smoothly wobbling loop whose radius is a function of angle.
 * Samples the radius function and joins the samples with a quadratic B-spline
 * (each sample becomes a control point, each midpoint an on-curve point), which
 * keeps the result inside the sample hull — important when an inner loop has to
 * stay strictly inside an outer one.
 */
function traceLoop(
  path: THREE.Path,
  radiusAt: (angle: number) => number,
  steps: number,
  clockwise: boolean,
): void {
  const pts: THREE.Vector2[] = []
  for (let i = 0; i < steps; i += 1) {
    const a = ((clockwise ? -i : i) / steps) * Math.PI * 2
    const r = radiusAt(a)
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r))
  }
  const midX = (i: number, j: number): number => (pts[i].x + pts[j].x) / 2
  const midY = (i: number, j: number): number => (pts[i].y + pts[j].y) / 2
  path.moveTo(midX(steps - 1, 0), midY(steps - 1, 0))
  for (let i = 0; i < steps; i += 1) {
    const n = (i + 1) % steps
    path.quadraticCurveTo(pts[i].x, pts[i].y, midX(i, n), midY(i, n))
  }
  path.closePath()
}

/* ------------------------------------------------------------ desk objects */

/**
 * Acoustic guitar body — the classic figure-8, pinched hard at the waist, with
 * the soundhole punched out. The double curve alone names it: no other prop in
 * the world has two bouts of different sizes stacked around a narrow middle.
 */
export function guitarBody(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(0, 0.5)
  s.bezierCurveTo(0.2, 0.5, 0.31, 0.4, 0.31, 0.26) // upper bout, right
  s.bezierCurveTo(0.27, 0.2, 0.185, 0.12, 0.2, 0.01) // pinch into the waist
  s.bezierCurveTo(0.22, -0.06, 0.41, -0.14, 0.4, -0.26) // flare into the lower bout
  s.bezierCurveTo(0.4, -0.42, 0.23, -0.52, 0, -0.52) // bottom
  s.bezierCurveTo(-0.23, -0.52, -0.4, -0.42, -0.4, -0.26)
  s.bezierCurveTo(-0.41, -0.14, -0.22, -0.06, -0.2, 0.01)
  s.bezierCurveTo(-0.185, 0.12, -0.27, 0.2, -0.31, 0.26)
  s.bezierCurveTo(-0.31, 0.4, -0.2, 0.5, 0, 0.5)
  s.closePath()

  const hole = new THREE.Path()
  hole.absarc(0, -0.12, 0.1, 0, Math.PI * 2, true)
  s.holes.push(hole)
  return s
}

/**
 * Mug in side profile. The body is a barely-tapered cup; the handle is a loop
 * hanging off the right wall with its opening punched through. Without that
 * hole this is a cylinder — the loop is the entire read.
 */
export function mug(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(-0.48, 0.41)
  s.bezierCurveTo(-0.47, 0.15, -0.46, -0.12, -0.44, -0.34) // left wall, slight taper
  s.quadraticCurveTo(-0.16, -0.44, 0.12, -0.34) // base
  s.bezierCurveTo(0.14, -0.24, 0.15, -0.16, 0.15, -0.08) // right wall up to the handle
  s.bezierCurveTo(0.38, -0.1, 0.48, 0.0, 0.48, 0.14) // handle, outer sweep out
  s.bezierCurveTo(0.48, 0.27, 0.34, 0.35, 0.15, 0.32) // handle, outer sweep back in
  s.quadraticCurveTo(0.16, 0.37, 0.16, 0.41) // right wall up to the rim
  s.quadraticCurveTo(-0.16, 0.47, -0.48, 0.41) // rim
  s.closePath()

  const grip = new THREE.Path()
  grip.moveTo(0.295, 0.235)
  grip.bezierCurveTo(0.35, 0.225, 0.38, 0.18, 0.38, 0.12)
  grip.bezierCurveTo(0.38, 0.06, 0.35, 0.015, 0.295, 0.005)
  grip.bezierCurveTo(0.24, 0.015, 0.21, 0.06, 0.21, 0.12)
  grip.bezierCurveTo(0.21, 0.18, 0.24, 0.225, 0.295, 0.235)
  grip.closePath()
  s.holes.push(grip)
  return s
}

/**
 * Monitor — one continuous outline: rounded slab, narrow neck, flared foot. The
 * abrupt width change (wide, then very narrow, then wide again) is what reads;
 * a plain rounded rectangle would just be a card.
 */
export function monitor(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(-0.3, -0.5)
  s.quadraticCurveTo(0, -0.545, 0.3, -0.5) // foot, underside
  s.quadraticCurveTo(0.22, -0.44, 0.1, -0.4) // foot flares up into the neck
  s.bezierCurveTo(0.075, -0.3, 0.075, -0.12, 0.085, 0.02) // neck, right side
  s.lineTo(0.39, 0.02)
  s.quadraticCurveTo(0.44, 0.02, 0.44, 0.07)
  s.lineTo(0.44, 0.45)
  s.quadraticCurveTo(0.44, 0.5, 0.39, 0.5)
  s.quadraticCurveTo(0, 0.515, -0.39, 0.5) // top edge, drawn with a slight bow
  s.quadraticCurveTo(-0.44, 0.5, -0.44, 0.45)
  s.lineTo(-0.44, 0.07)
  s.quadraticCurveTo(-0.44, 0.02, -0.39, 0.02)
  s.lineTo(-0.085, 0.02)
  s.bezierCurveTo(-0.075, -0.12, -0.075, -0.3, -0.1, -0.4)
  s.quadraticCurveTo(-0.22, -0.44, -0.3, -0.5)
  s.closePath()
  return s
}

/**
 * Laptop in side profile, lid open a little past square (~100 degrees) so it
 * leans back. The wedge base — thin at the front, thick at the hinge — plus the
 * lid's backward tilt is the whole read; a right angle would look like a sign.
 */
export function laptop(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(-0.46, -0.34)
  s.quadraticCurveTo(-0.08, -0.365, 0.34, -0.34) // underside of the base
  s.lineTo(0.36, -0.24) // back of the base, at the hinge
  s.bezierCurveTo(0.4, -0.05, 0.43, 0.22, 0.452, 0.462) // lid, back face
  s.quadraticCurveTo(0.428, 0.482, 0.401, 0.47) // lid, top edge
  s.bezierCurveTo(0.36, 0.22, 0.31, -0.02, 0.282, -0.218) // lid, screen face
  s.quadraticCurveTo(-0.08, -0.27, -0.46, -0.295) // top of the base, wedging thinner
  s.closePath()
  return s
}

/**
 * A wisp of steam: three wavy tendrils of different heights sharing one root, so
 * it reads as a single rising curl rather than three unrelated ribbons. The
 * asymmetric heights and the sideways lean are what stop it looking like grass.
 */
export function mugSteam(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(-0.16, -0.5)
  s.bezierCurveTo(-0.24, -0.34, -0.2, -0.1, -0.3, 0.06) // left tendril, rising
  s.bezierCurveTo(-0.35, 0.15, -0.35, 0.22, -0.31, 0.27)
  s.bezierCurveTo(-0.28, 0.19, -0.24, 0.12, -0.22, 0.02)
  s.bezierCurveTo(-0.19, -0.1, -0.13, -0.14, -0.1, -0.22) // down into the first valley
  s.bezierCurveTo(-0.09, -0.06, -0.1, 0.1, -0.05, 0.24) // centre tendril, tallest
  s.bezierCurveTo(-0.02, 0.36, 0.0, 0.44, 0.01, 0.52)
  s.bezierCurveTo(0.06, 0.42, 0.08, 0.3, 0.07, 0.18)
  s.bezierCurveTo(0.06, 0.04, 0.1, -0.08, 0.13, -0.2) // down into the second valley
  s.bezierCurveTo(0.16, -0.08, 0.18, 0.02, 0.22, 0.12) // right tendril, shortest
  s.bezierCurveTo(0.25, 0.19, 0.31, 0.23, 0.325, 0.2)
  s.bezierCurveTo(0.315, 0.12, 0.3, 0.05, 0.27, -0.03)
  s.bezierCurveTo(0.235, -0.16, 0.185, -0.34, 0.16, -0.5)
  s.quadraticCurveTo(0, -0.46, -0.16, -0.5) // shared root
  s.closePath()
  return s
}

/* ------------------------------------------------------- training / hawkeye */

/**
 * Phone: a tall rounded slab with a shallow notch bitten out of the top edge.
 * The notch is the only thing separating this from a plain card, so it sits
 * proud of the corner radii where the outline is otherwise dead straight.
 */
export function phoneSlab(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(-0.25, -0.43)
  s.quadraticCurveTo(-0.25, -0.5, -0.18, -0.5)
  s.lineTo(0.18, -0.5)
  s.quadraticCurveTo(0.25, -0.5, 0.25, -0.43)
  s.lineTo(0.25, 0.43)
  s.quadraticCurveTo(0.25, 0.5, 0.18, 0.5)
  s.lineTo(0.1, 0.5)
  s.quadraticCurveTo(0.085, 0.5, 0.082, 0.478) // notch, right shoulder
  s.quadraticCurveTo(0.075, 0.455, 0.055, 0.455)
  s.lineTo(-0.055, 0.455) // notch floor
  s.quadraticCurveTo(-0.075, 0.455, -0.082, 0.478)
  s.quadraticCurveTo(-0.085, 0.5, -0.1, 0.5)
  s.lineTo(-0.18, 0.5)
  s.quadraticCurveTo(-0.25, 0.5, -0.25, 0.43)
  s.closePath()
  return s
}

/**
 * Paw print: a broad central pad with four toes fanned above it. The toes are
 * near-full circles joined by deep clefts that cut most of the way back to the
 * pad, so the filled silhouette keeps four distinct lobes instead of collapsing
 * into a scalloped blob.
 */
export function pawPrint(): THREE.Shape {
  // Right to left, the way the outline is walked. The join points are derived
  // from the same trig absarc uses, so the webbing lands exactly on each arc —
  // a rounding mismatch here leaves a hair-thin spur that fouls triangulation.
  const toes = [
    { x: 0.4, y: 0.2, r: 0.13, from: -65, to: 195 },
    { x: 0.14, y: 0.33, r: 0.135, from: -55, to: 235 },
    { x: -0.14, y: 0.33, r: 0.135, from: -55, to: 235 },
    { x: -0.4, y: 0.2, r: 0.13, from: -15, to: 245 },
  ]
  const clefts = [0.062, 0.115, 0.062] // the centre cleft cuts deepest
  const at = (i: number, deg: number): [number, number] => {
    const t = toes[i]
    return [t.x + t.r * Math.cos(deg * D), t.y + t.r * Math.sin(deg * D)]
  }

  const s = new THREE.Shape()
  const first = at(0, toes[0].from)
  s.moveTo(0, -0.52)
  s.bezierCurveTo(0.12, -0.52, 0.25, -0.44, 0.31, -0.3) // pad, bottom right
  s.bezierCurveTo(0.36, -0.2, 0.33, -0.08, 0.355, -0.01) // pad, right flank
  s.bezierCurveTo(0.395, 0.02, 0.435, 0.03, first[0], first[1]) // web up to the outer toe
  for (let i = 0; i < toes.length; i += 1) {
    const t = toes[i]
    s.absarc(t.x, t.y, t.r, t.from * D, t.to * D, false)
    if (i === toes.length - 1) break
    const exit = at(i, t.to)
    const enter = at(i + 1, toes[i + 1].from)
    s.quadraticCurveTo(
      (exit[0] + enter[0]) / 2,
      Math.min(exit[1], enter[1]) - clefts[i],
      enter[0],
      enter[1],
    )
  }
  s.bezierCurveTo(-0.435, 0.03, -0.395, 0.02, -0.355, -0.01) // web back down to the pad
  s.bezierCurveTo(-0.33, -0.08, -0.36, -0.2, -0.31, -0.3)
  s.bezierCurveTo(-0.25, -0.44, -0.12, -0.52, 0, -0.52)
  s.closePath()
  return s
}

/**
 * Hex nut on a threaded shank, seen three-quarters on. The hex is squashed
 * vertically for the perspective, and the shank's edges are scalloped — thread
 * crests survive as bumps on the silhouette, which is what says "bolt" rather
 * than "peg".
 */
export function boltNut(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(0.11, 0.16) // hex, starting at the right vertex
  s.quadraticCurveTo(0.0526, 0.2705, -0.025, 0.368)
  s.quadraticCurveTo(-0.16, 0.38, -0.295, 0.368)
  s.quadraticCurveTo(-0.3726, 0.2705, -0.43, 0.16)
  s.quadraticCurveTo(-0.3726, 0.0495, -0.295, -0.048)
  s.quadraticCurveTo(-0.16, -0.06, -0.025, -0.048)
  s.quadraticCurveTo(-0.0083, -0.0369, -0.005, -0.017) // onto the lower-right flat
  s.quadraticCurveTo(0.0211, -0.0837, 0.0889, -0.107) // shank, lower edge: thread crests
  s.quadraticCurveTo(0.115, -0.1737, 0.1827, -0.197)
  s.quadraticCurveTo(0.2088, -0.2637, 0.2765, -0.287)
  s.quadraticCurveTo(0.3026, -0.3537, 0.3703, -0.377)
  s.bezierCurveTo(0.4353, -0.4393, 0.5234, -0.3041, 0.4584, -0.2418) // rounded tip
  s.quadraticCurveTo(0.4323, -0.1752, 0.3646, -0.1519) // shank, upper edge
  s.quadraticCurveTo(0.3385, -0.0852, 0.2707, -0.062)
  s.quadraticCurveTo(0.2446, 0.0047, 0.1769, 0.0281)
  s.quadraticCurveTo(0.1507, 0.0947, 0.083, 0.118)
  s.quadraticCurveTo(0.1032, 0.1434, 0.11, 0.16) // back to the hex vertex
  s.closePath()
  return s
}

/**
 * Camera framing bracket. Four corner marks cannot be one contour, so this is a
 * ring whose sides thin almost to nothing at their midpoints: the corners stay
 * heavy and the runs between them fall away, which reads as four L marks once
 * the edge pass draws it.
 */
export function viewfinder(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(-0.5, -0.36)
  s.quadraticCurveTo(0, -0.368, 0.5, -0.36)
  s.quadraticCurveTo(0.508, 0, 0.5, 0.36)
  s.quadraticCurveTo(0, 0.368, -0.5, 0.36)
  s.quadraticCurveTo(-0.508, 0, -0.5, -0.36)
  s.closePath()

  const inner = new THREE.Path()
  inner.moveTo(-0.44, 0.3)
  inner.lineTo(-0.32, 0.3)
  inner.bezierCurveTo(-0.26, 0.3, -0.25, 0.345, -0.18, 0.345) // top side swells outward
  inner.lineTo(0.18, 0.345)
  inner.bezierCurveTo(0.25, 0.345, 0.26, 0.3, 0.32, 0.3)
  inner.lineTo(0.44, 0.3)
  inner.lineTo(0.44, 0.2)
  inner.bezierCurveTo(0.44, 0.16, 0.485, 0.16, 0.485, 0.12) // right side swells outward
  inner.lineTo(0.485, -0.12)
  inner.bezierCurveTo(0.485, -0.16, 0.44, -0.16, 0.44, -0.2)
  inner.lineTo(0.44, -0.3)
  inner.lineTo(0.32, -0.3)
  inner.bezierCurveTo(0.26, -0.3, 0.25, -0.345, 0.18, -0.345)
  inner.lineTo(-0.18, -0.345)
  inner.bezierCurveTo(-0.25, -0.345, -0.26, -0.3, -0.32, -0.3)
  inner.lineTo(-0.44, -0.3)
  inner.lineTo(-0.44, -0.2)
  inner.bezierCurveTo(-0.44, -0.16, -0.485, -0.16, -0.485, -0.12)
  inner.lineTo(-0.485, 0.12)
  inner.bezierCurveTo(-0.485, 0.16, -0.44, 0.16, -0.44, 0.2)
  inner.closePath()
  s.holes.push(inner)
  return s
}

/* ----------------------------------------------------------------- projects */

/**
 * Audio waveform — nine capsule bars, tallest in the middle and mirrored
 * outward, welded together by a thin spine so it extrudes as one solid. The
 * up-and-down rhythm of the bar tops is the read; nothing else here is a comb.
 */
export function waveform(): THREE.Shape {
  const heights = [0.1, 0.2, 0.34, 0.24, 0.48, 0.24, 0.34, 0.2, 0.1]
  const last = heights.length - 1
  const halfW = 0.0375
  const pitch = 0.111
  const spine = 0.035 // the web that joins the bars into one contour
  const cap = 0.026 // rounding on each bar end
  const cx = (i: number): number => (i - last / 2) * pitch

  const s = new THREE.Shape()
  s.moveTo(cx(0) - halfW, -heights[0] + cap)
  for (let i = 0; i <= last; i += 1) {
    const x = cx(i)
    const h = heights[i]
    s.quadraticCurveTo(x - halfW, -h, x - halfW + cap, -h)
    s.lineTo(x + halfW - cap, -h)
    s.quadraticCurveTo(x + halfW, -h, x + halfW, -h + cap)
    if (i < last) {
      s.lineTo(x + halfW, -spine)
      s.lineTo(cx(i + 1) - halfW, -spine)
      s.lineTo(cx(i + 1) - halfW, -heights[i + 1] + cap)
    }
  }
  s.lineTo(cx(last) + halfW, heights[last] - cap) // up the outer right edge
  for (let i = last; i >= 0; i -= 1) {
    const x = cx(i)
    const h = heights[i]
    s.quadraticCurveTo(x + halfW, h, x + halfW - cap, h)
    s.lineTo(x - halfW + cap, h)
    s.quadraticCurveTo(x - halfW, h, x - halfW, h - cap)
    if (i > 0) {
      s.lineTo(x - halfW, spine)
      s.lineTo(cx(i - 1) + halfW, spine)
      s.lineTo(cx(i - 1) + halfW, heights[i - 1] - cap)
    }
  }
  s.closePath() // down the outer left edge
  return s
}

/**
 * One chain link: an elongated stadium with a matching elongated void punched
 * through it. The constant stock thickness around a long slot is what reads as
 * forged metal — a plain ring would read as a washer.
 */
export function chainLink(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(0, 0.5)
  s.bezierCurveTo(0.16, 0.5, 0.26, 0.41, 0.26, 0.3)
  s.bezierCurveTo(0.26, 0.2, 0.24, 0.1, 0.24, 0) // slight waist at the midpoint
  s.bezierCurveTo(0.24, -0.1, 0.26, -0.2, 0.26, -0.3)
  s.bezierCurveTo(0.26, -0.41, 0.16, -0.5, 0, -0.5)
  s.bezierCurveTo(-0.16, -0.5, -0.26, -0.41, -0.26, -0.3)
  s.bezierCurveTo(-0.26, -0.2, -0.24, -0.1, -0.24, 0)
  s.bezierCurveTo(-0.24, 0.1, -0.26, 0.2, -0.26, 0.3)
  s.bezierCurveTo(-0.26, 0.41, -0.16, 0.5, 0, 0.5)
  s.closePath()

  const slot = new THREE.Path()
  slot.moveTo(0, 0.395)
  slot.bezierCurveTo(-0.08, 0.395, -0.14, 0.33, -0.14, 0.23)
  slot.bezierCurveTo(-0.14, 0.14, -0.125, 0.07, -0.125, 0)
  slot.bezierCurveTo(-0.125, -0.07, -0.14, -0.14, -0.14, -0.23)
  slot.bezierCurveTo(-0.14, -0.33, -0.08, -0.395, 0, -0.395)
  slot.bezierCurveTo(0.08, -0.395, 0.14, -0.33, 0.14, -0.23)
  slot.bezierCurveTo(0.14, -0.14, 0.125, -0.07, 0.125, 0)
  slot.bezierCurveTo(0.125, 0.07, 0.14, 0.14, 0.14, 0.23)
  slot.bezierCurveTo(0.14, 0.33, 0.08, 0.395, 0, 0.395)
  slot.closePath()
  s.holes.push(slot)
  return s
}

/**
 * Thread spool: two flared flanges pinched around a narrow barrel, with a loose
 * thread end hooking off the top rim. The hourglass pinch reads instantly, and
 * the stray thread is what stops it being a capstan or a bobbin-shaped weight.
 */
export function spool(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(0, -0.44)
  s.quadraticCurveTo(0.22, -0.455, 0.41, -0.42) // lower flange, underside
  s.bezierCurveTo(0.425, -0.39, 0.42, -0.35, 0.4, -0.33) // lower flange, rim
  s.bezierCurveTo(0.3, -0.3, 0.19, -0.3, 0.145, -0.26) // flare in to the barrel
  s.bezierCurveTo(0.125, -0.16, 0.125, 0.16, 0.145, 0.26) // barrel, right side
  s.bezierCurveTo(0.19, 0.3, 0.3, 0.3, 0.4, 0.33) // flare out again
  s.bezierCurveTo(0.42, 0.35, 0.425, 0.39, 0.41, 0.42) // upper flange, rim
  s.quadraticCurveTo(0.22, 0.455, 0, 0.44) // upper flange, top face
  s.quadraticCurveTo(-0.22, 0.455, -0.41, 0.42)
  s.bezierCurveTo(-0.49, 0.44, -0.55, 0.38, -0.565, 0.28) // thread tail, outer curl
  s.bezierCurveTo(-0.58, 0.18, -0.53, 0.1, -0.455, 0.095) // loose end
  s.bezierCurveTo(-0.515, 0.135, -0.525, 0.2, -0.512, 0.27) // thread tail, inner curl
  s.bezierCurveTo(-0.5, 0.34, -0.462, 0.373, -0.41, 0.365)
  s.bezierCurveTo(-0.422, 0.352, -0.418, 0.342, -0.4, 0.33)
  s.bezierCurveTo(-0.3, 0.3, -0.19, 0.3, -0.145, 0.26)
  s.bezierCurveTo(-0.125, 0.16, -0.125, -0.16, -0.145, -0.26)
  s.bezierCurveTo(-0.19, -0.3, -0.3, -0.3, -0.4, -0.33)
  s.bezierCurveTo(-0.42, -0.35, -0.425, -0.39, -0.41, -0.42)
  s.quadraticCurveTo(-0.22, -0.455, 0, -0.44)
  s.closePath()
  return s
}

/**
 * Manga cloud: seven overlapping bumps along the top with deep scallops between
 * them, sitting on a slow, nearly flat underside. The contrast between the busy
 * top and the calm bottom is what makes it a cloud and not foliage.
 */
export function cloudPuff(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(-0.48, -0.22)
  s.bezierCurveTo(-0.53, -0.16, -0.52, -0.04, -0.45, 0.02) // left end lobe
  s.bezierCurveTo(-0.44, 0.12, -0.36, 0.17, -0.29, 0.06)
  s.quadraticCurveTo(-0.272, 0.03, -0.255, 0.07) // scallop
  s.bezierCurveTo(-0.25, 0.24, -0.13, 0.3, -0.075, 0.16)
  s.quadraticCurveTo(-0.06, 0.12, -0.045, 0.16)
  s.bezierCurveTo(-0.015, 0.34, 0.1, 0.35, 0.145, 0.19) // tallest bump
  s.quadraticCurveTo(0.16, 0.15, 0.18, 0.19)
  s.bezierCurveTo(0.225, 0.31, 0.325, 0.28, 0.335, 0.12)
  s.quadraticCurveTo(0.35, 0.09, 0.372, 0.12)
  s.bezierCurveTo(0.43, 0.19, 0.5, 0.13, 0.47, 0.04)
  s.bezierCurveTo(0.55, -0.01, 0.53, -0.17, 0.46, -0.22) // right end lobe
  s.bezierCurveTo(0.24, -0.27, 0.02, -0.19, -0.2, -0.25) // underside, one slow wave
  s.quadraticCurveTo(-0.36, -0.28, -0.48, -0.22)
  s.closePath()
  return s
}

/**
 * Signpost: a highway shield on a thin post with a ground plate. The shield's
 * notched top edge and its taper down into the post give a profile no other
 * prop shares — deliberately not a rectangle, so it never reads as the monitor.
 */
export function roadSign(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(-0.11, -0.5)
  s.quadraticCurveTo(0, -0.525, 0.11, -0.5) // ground plate
  s.bezierCurveTo(0.075, -0.475, 0.048, -0.46, 0.042, -0.42)
  s.bezierCurveTo(0.038, -0.3, 0.04, -0.14, 0.048, -0.03) // post, right side
  s.bezierCurveTo(0.1, 0.0, 0.16, 0.03, 0.2, 0.09) // shield tapers out of the post
  s.bezierCurveTo(0.245, 0.16, 0.272, 0.24, 0.278, 0.31)
  s.bezierCurveTo(0.286, 0.37, 0.292, 0.42, 0.288, 0.465) // shoulder
  s.quadraticCurveTo(0.215, 0.44, 0.155, 0.475) // notch in the top edge
  s.quadraticCurveTo(0.08, 0.502, 0, 0.503)
  s.quadraticCurveTo(-0.08, 0.502, -0.155, 0.475)
  s.quadraticCurveTo(-0.215, 0.44, -0.288, 0.465)
  s.bezierCurveTo(-0.292, 0.42, -0.286, 0.37, -0.278, 0.31)
  s.bezierCurveTo(-0.272, 0.24, -0.245, 0.16, -0.2, 0.09)
  s.bezierCurveTo(-0.16, 0.03, -0.1, 0.0, -0.048, -0.03)
  s.bezierCurveTo(-0.04, -0.14, -0.038, -0.3, -0.042, -0.42)
  s.bezierCurveTo(-0.048, -0.46, -0.075, -0.475, -0.11, -0.5)
  s.closePath()
  return s
}

/* --------------------------------------------------------------- skill tree */

/**
 * Rosette of five pointed leaves. Each leaf is a lens that swells past halfway
 * and comes to a point, and the outline dips back to a small hub between them —
 * those deep notches are what keep it foliage instead of a lumpy star.
 */
export function leafCluster(): THREE.Shape {
  const leaves = [
    { a: 20, l: 0.52 },
    { a: 88, l: 0.58 },
    { a: 158, l: 0.51 },
    { a: 232, l: 0.54 },
    { a: 304, l: 0.46 },
  ]
  const hub = 0.08
  const spread = 28 // degrees of hub each leaf base occupies, per side

  const s = new THREE.Shape()
  const first = axial(leaves[0].a - spread, hub, 0)
  s.moveTo(first[0], first[1])
  for (let i = 0; i < leaves.length; i += 1) {
    const { a, l } = leaves[i]
    const c1 = axial(a, l * 0.28, -0.1)
    const c2 = axial(a, l * 0.7, -0.055)
    const tip = axial(a, l, 0)
    const c3 = axial(a, l * 0.7, 0.055)
    const c4 = axial(a, l * 0.28, 0.1)
    const out = axial(a + spread, hub, 0)
    s.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], tip[0], tip[1])
    s.bezierCurveTo(c3[0], c3[1], c4[0], c4[1], out[0], out[1])

    const wrapped = i === leaves.length - 1
    const nextA = (wrapped ? leaves[0].a + 360 : leaves[i + 1].a) - spread
    const notch = axial((a + spread + nextA) / 2, hub * 0.72, 0)
    const enter = axial(nextA, hub, 0)
    s.quadraticCurveTo(notch[0], notch[1], enter[0], enter[1])
  }
  s.closePath()
  return s
}

/**
 * Tree trunk in profile: root flare at the base, a leaning taper, and a fork
 * into two unequal boughs near the top. The asymmetric fork plus the splayed
 * roots read as a tree even without a single leaf attached.
 */
export function trunkProfile(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(-0.22, -0.5)
  s.quadraticCurveTo(-0.04, -0.535, 0.2, -0.5) // root flare, underside
  s.bezierCurveTo(0.17, -0.42, 0.145, -0.38, 0.14, -0.3)
  s.bezierCurveTo(0.135, -0.14, 0.145, 0.0, 0.135, 0.12) // trunk, right side
  s.bezierCurveTo(0.19, 0.22, 0.25, 0.32, 0.285, 0.46) // right bough, outer edge
  s.quadraticCurveTo(0.29, 0.51, 0.255, 0.485)
  s.bezierCurveTo(0.225, 0.36, 0.17, 0.27, 0.085, 0.185)
  s.quadraticCurveTo(0.068, 0.165, 0.048, 0.19) // the crotch
  s.bezierCurveTo(0.01, 0.28, -0.05, 0.37, -0.105, 0.455) // left bough, inner edge
  s.quadraticCurveTo(-0.135, 0.495, -0.145, 0.455)
  s.bezierCurveTo(-0.115, 0.36, -0.06, 0.27, -0.015, 0.16)
  s.bezierCurveTo(-0.005, 0.1, -0.01, 0.0, -0.005, -0.12) // trunk, left side
  s.bezierCurveTo(0.0, -0.24, -0.02, -0.34, -0.05, -0.4)
  s.bezierCurveTo(-0.09, -0.45, -0.16, -0.47, -0.22, -0.5)
  s.closePath()
  return s
}

/* ------------------------------------------------------------ contact/cover */

/**
 * Envelope with the flap thrown open. The flap is a leaning triangle whose apex
 * sits off-centre above the body, so it breaks the rectangle's top edge and
 * leaves a sliver of it visible on the left — that break is the whole idea.
 */
export function envelope(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(-0.4, -0.32)
  s.quadraticCurveTo(0, -0.348, 0.4, -0.32) // bottom edge, slight paper sag
  s.bezierCurveTo(0.416, -0.16, 0.414, -0.02, 0.402, 0.14) // right edge
  s.lineTo(0.372, 0.145)
  s.bezierCurveTo(0.36, 0.26, 0.28, 0.4, 0.115, 0.49) // flap, leading edge
  s.quadraticCurveTo(0.075, 0.508, 0.055, 0.478) // flap apex
  s.bezierCurveTo(-0.05, 0.38, -0.2, 0.26, -0.335, 0.152) // flap, trailing edge
  s.lineTo(-0.402, 0.14) // the sliver of top edge the flap does not cover
  s.bezierCurveTo(-0.414, -0.02, -0.416, -0.16, -0.4, -0.32)
  s.closePath()
  return s
}

/**
 * Paperback cover: a dead-straight, square-cornered spine on the left against a
 * softly bowed fore-edge on the right. That one asymmetry is the read — a
 * symmetric rectangle would just be a card or a screen.
 */
export function bookCover(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(-0.34, 0.5)
  s.lineTo(-0.34, -0.5) // spine: straight and square, on purpose
  s.quadraticCurveTo(-0.05, -0.512, 0.28, -0.498)
  s.quadraticCurveTo(0.335, -0.494, 0.342, -0.46)
  s.bezierCurveTo(0.372, -0.18, 0.372, 0.18, 0.342, 0.46) // convex fore-edge
  s.quadraticCurveTo(0.335, 0.494, 0.28, 0.498)
  s.quadraticCurveTo(-0.05, 0.512, -0.34, 0.5)
  s.closePath()
  return s
}

/**
 * Hanko seal: a hand-carved ring, uneven all the way round and pinched almost
 * to nothing at three points so the band appears broken. A perfect annulus
 * reads as machined; the wobble and the near-breaks read as cut stone.
 */
export function sealRing(): THREE.Shape {
  const steps = 144
  const breaks = [0.55, 2.65, 4.55]
  const innerAt = (a: number): number =>
    0.372 + 0.014 * Math.sin(4 * a + 1.3) + 0.009 * Math.sin(9 * a + 0.4)
  const outerAt = (a: number): number => {
    let r = 0.5 + 0.016 * Math.sin(3 * a + 0.7) + 0.011 * Math.sin(7 * a + 2.1)
    for (const b of breaks) {
      let d = a - b
      while (d > Math.PI) d -= Math.PI * 2
      while (d < -Math.PI) d += Math.PI * 2
      r -= 0.15 * Math.exp(-((d / 0.2) ** 2))
    }
    // never let a break bite through the interior: the hole must stay inside
    return Math.max(r, innerAt(a) + 0.018)
  }

  const s = new THREE.Shape()
  traceLoop(s, outerAt, steps, false)
  const interior = new THREE.Path()
  traceLoop(interior, innerAt, steps, true)
  s.holes.push(interior)
  return s
}

/* -------------------------------------------------------------- atmosphere */

/**
 * Impact burst: eleven concave-sided spikes at irregular angles and wildly
 * different lengths. The irregularity is load-bearing — evenly spaced spikes of
 * equal length read as a gear or a sun, not as a hit.
 */
export function speedBurst(): THREE.Shape {
  const spikes = [
    { a: 8, l: 0.5 },
    { a: 40, l: 0.3 },
    { a: 68, l: 0.44 },
    { a: 103, l: 0.26 },
    { a: 131, l: 0.52 },
    { a: 162, l: 0.33 },
    { a: 196, l: 0.47 },
    { a: 228, l: 0.28 },
    { a: 254, l: 0.41 },
    { a: 288, l: 0.31 },
    { a: 322, l: 0.45 },
  ]
  const hub = 0.11
  const spread = 10

  const s = new THREE.Shape()
  const first = axial(spikes[0].a - spread, hub, 0)
  s.moveTo(first[0], first[1])
  for (let i = 0; i < spikes.length; i += 1) {
    const { a, l } = spikes[i]
    const c1 = axial(a, l * 0.55, -0.005) // pulled to the axis, so the side is concave
    const tip = axial(a, l, 0)
    const c2 = axial(a, l * 0.55, 0.005)
    const out = axial(a + spread, hub, 0)
    s.quadraticCurveTo(c1[0], c1[1], tip[0], tip[1])
    s.quadraticCurveTo(c2[0], c2[1], out[0], out[1])

    const wrapped = i === spikes.length - 1
    const nextA = (wrapped ? spikes[0].a + 360 : spikes[i + 1].a) - spread
    const notch = axial((a + spread + nextA) / 2, hub * 0.72, 0)
    const enter = axial(nextA, hub, 0)
    s.quadraticCurveTo(notch[0], notch[1], enter[0], enter[1])
  }
  s.closePath()
  return s
}

/**
 * Ink drop: a teardrop drawn out to a point at the top with a fat, slightly
 * lopsided bulb below. The wobble on the flanks keeps it wet rather than
 * geometric, and the single sharp point fixes which way is up.
 */
export function inkDrop(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(0, 0.5)
  s.bezierCurveTo(0.055, 0.3, 0.1, 0.16, 0.175, 0.02)
  s.bezierCurveTo(0.255, -0.11, 0.315, -0.16, 0.305, -0.26) // right flank, wobbling
  s.bezierCurveTo(0.295, -0.4, 0.175, -0.5, 0.02, -0.495)
  s.bezierCurveTo(-0.14, -0.49, -0.27, -0.395, -0.285, -0.26)
  s.bezierCurveTo(-0.3, -0.15, -0.235, -0.1, -0.165, 0.015)
  s.bezierCurveTo(-0.1, 0.13, -0.05, 0.31, 0, 0.5)
  s.closePath()
  return s
}

/* ------------------------------------------------------------------ registry */

export const SHAPES = {
  fighterJet,
  guitarBody,
  mug,
  monitor,
  laptop,
  mugSteam,
  phoneSlab,
  pawPrint,
  boltNut,
  viewfinder,
  waveform,
  chainLink,
  spool,
  cloudPuff,
  roadSign,
  leafCluster,
  trunkProfile,
  envelope,
  bookCover,
  sealRing,
  speedBurst,
  inkDrop,
} as const

export type ShapeName = keyof typeof SHAPES

/** Fighter jet, side profile: nose cone, canopy bump, swept fin, engine tail.
    Reads at small size — it exists to be glimpsed through a window. */
export function fighterJet(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(-1.0, 0.02)
  s.lineTo(-0.55, 0.09)
  s.bezierCurveTo(-0.45, 0.1, -0.38, 0.24, -0.18, 0.13)
  s.lineTo(0.5, 0.12)
  s.lineTo(0.72, 0.52)
  s.lineTo(0.86, 0.52)
  s.lineTo(0.84, 0.1)
  s.lineTo(1.0, 0.08)
  s.lineTo(1.0, -0.07)
  s.lineTo(-0.5, -0.1)
  s.closePath()
  return s
}

/* -------------------------------------------------------------- off-panel */

/**
 * A skateboard deck, side profile: tail and nose both kick up off a flat
 * midsection. That kicktail curve at both ends is the entire silhouette a
 * skateboard needs — a plain plank reads as a shelf, not a board.
 */
export function skateboardDeck(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(-0.5, 0.02) // tail tip
  s.quadraticCurveTo(-0.46, 0.13, -0.38, 0.14) // kick up
  s.quadraticCurveTo(-0.28, 0.07, -0.18, 0.045) // ease into the flat
  s.lineTo(0.18, 0.045) // the flat midsection, top edge
  s.quadraticCurveTo(0.28, 0.07, 0.38, 0.14) // ease up into the nose kick
  s.quadraticCurveTo(0.46, 0.13, 0.5, 0.02) // nose tip
  s.quadraticCurveTo(0.47, -0.015, 0.4, -0.018) // underside, nose
  s.lineTo(-0.4, -0.018) // underside, flat
  s.quadraticCurveTo(-0.47, -0.015, -0.5, 0.02) // back to the tail tip
  s.closePath()
  return s
}

/**
 * The same deck seen face-on — the popsicle outline. Rounded nose and tail,
 * sides that pinch in very slightly at the waist. This is the view a board
 * leaning on a wall actually shows you, and with the trucks and wheels on
 * it, it is unmistakable from across a room.
 */
export function skateboardTop(): THREE.Shape {
  const s = new THREE.Shape()
  s.moveTo(-0.13, 0.34)
  s.bezierCurveTo(-0.13, 0.47, -0.06, 0.5, 0, 0.5) // nose, left half
  s.bezierCurveTo(0.06, 0.5, 0.13, 0.47, 0.13, 0.34) // nose, right half
  s.bezierCurveTo(0.135, 0.15, 0.125, -0.15, 0.13, -0.34) // right side, faint waist
  s.bezierCurveTo(0.13, -0.47, 0.06, -0.5, 0, -0.5) // tail, right half
  s.bezierCurveTo(-0.06, -0.5, -0.13, -0.47, -0.13, -0.34) // tail, left half
  s.bezierCurveTo(-0.125, -0.15, -0.135, 0.15, -0.13, 0.34) // left side
  s.closePath()
  return s
}
