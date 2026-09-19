import { useMemo } from 'react'
import * as THREE from 'three'
import { InkShape } from './Ink'
import { guitarBody, sealRing } from './shapes'

/**
 * Prop ASSEMBLIES. A single extruded silhouette reads as a sticker with depth —
 * an object reads as an object because it has parts: an envelope has a flap, a
 * letter, a stamp and address lines; a guitar has a neck, strings and a bridge.
 * These compose the drawn silhouettes with structural detail so heroes hold up
 * at hero scale.
 *
 * Materials are passed in rather than created here, so every part stays inside
 * the chapter's plate system and the bloom reveals one consistent family.
 */

type PartMats = {
  paper: THREE.MeshToonMaterial
  dim: THREE.MeshToonMaterial
  tone: THREE.MeshToonMaterial
  accent: THREE.MeshToonMaterial
  hueA: THREE.MeshToonMaterial
  hueB: THREE.MeshToonMaterial
}

/* --------------------------------------------------------------- envelope */

/**
 * An opened letter, facing the camera: body, raised flap, the letter half
 * pulled out, a wax seal, address lines and a stamp. The flap is a triangular
 * prism hinged at the top edge so it visibly stands open.
 */
export function Envelope({ mats }: { mats: PartMats }) {
  const flap = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.85, 0)
    s.lineTo(0.85, 0)
    s.lineTo(0, -0.52)
    s.closePath()
    return s
  }, [])
  const seal = useMemo(() => sealRing(), [])

  return (
    <group>
      {/* body */}
      <mesh material={mats.paper}>
        <boxGeometry args={[1.7, 1.05, 0.12]} />
      </mesh>
      {/* the letter, half pulled out and slightly askew */}
      <group position={[0.1, 0.72, -0.02]} rotation={[0, 0, -0.07]}>
        <mesh material={mats.paper}>
          <boxGeometry args={[1.42, 0.95, 0.03]} />
        </mesh>
        {[0.26, 0.1, -0.06].map((y, i) => (
          <mesh key={y} position={[i === 2 ? -0.2 : 0, y, 0.025]} material={mats.tone}>
            <boxGeometry args={[i === 2 ? 0.8 : 1.15, 0.05, 0.01]} />
          </mesh>
        ))}
      </group>
      {/* flap, hinged open at the top edge */}
      <group position={[0, 0.53, 0.06]} rotation={[0.65, 0, 0]}>
        <InkShape shape={flap} depth={0.05} material={mats.dim} position={[0, -0.26, 0]} />
      </group>
      {/* address lines */}
      {[-0.1, -0.26].map((y, i) => (
        <mesh key={y} position={[-0.28, y, 0.07]} material={mats.tone}>
          <boxGeometry args={[i === 0 ? 0.75 : 0.55, 0.055, 0.01]} />
        </mesh>
      ))}
      {/* stamp, top right, in the companion hue */}
      <mesh position={[0.62, 0.3, 0.07]} rotation={[0, 0, -0.08]} material={mats.hueA}>
        <boxGeometry args={[0.26, 0.3, 0.02]} />
      </mesh>
      {/* the wax seal */}
      <InkShape
        shape={seal}
        depth={0.05}
        material={mats.accent}
        position={[0.02, -0.34, 0.08]}
        scale={0.34}
      />
    </group>
  )
}

/* ----------------------------------------------------------------- guitar */

/**
 * A whole acoustic guitar: drawn body, neck with strings running over the
 * soundhole to the bridge, and a headstock. Meant to lean, nearly face-on —
 * the figure-8 is the read, so never angle the waist away from the camera.
 */
export function Guitar({ mats, body = 'accent' }: { mats: PartMats; body?: keyof PartMats }) {
  const shape = useMemo(() => guitarBody(), [])
  // "dim" turned out to be a pale desaturated tone (not a dark one as its
  // name suggested) — fine for normal toon-shaded geometry, but as a true
  // sticker colour it made the hardware wash out near-white. The neck,
  // bridge and headstock read as guitar hardware only if they're actually
  // dark, so they get a real near-black true colour instead.
  const hardware = useMemo(
    () => new THREE.MeshToonMaterial({ color: '#1c1a17', toneMapped: false }),
    [],
  )
  return (
    <group>
      <InkShape shape={shape} depth={0.34} material={mats[body]} scale={1.6} />
      {/* bridge — InkShape centres its extrusion, so the body's front face
          sits at half its (scaled) depth, not at z=0; the bridge and the
          strings below have to clear that or they render buried inside the
          solid body instead of on top of it. */}
      <mesh position={[0, -0.52, 0.278]} material={hardware} userData={{ inkSticker: true }}>
        <boxGeometry args={[0.34, 0.09, 0.05]} />
      </mesh>
      {/* neck. Every part below is marked as a sticker so it holds its true
          flat colour regardless of light or viewing angle. This group used
          to sit at z -0.02 — a full 0.3 behind the strings at z 0.282 — so
          along the neck's whole length the strings floated way out in
          front of it instead of lying against the fretboard. Pushed the
          neck forward to just behind the strings instead. */}
      <group position={[0, 1.15, 0.235]} rotation={[0, 0, 0]}>
        <mesh material={hardware} userData={{ inkSticker: true }}>
          <boxGeometry args={[0.17, 1.5, 0.09]} />
        </mesh>
        {/* headstock — matched the neck's own hardware black before, so the
            two melted into one undifferentiated black bar with no visible
            break between them. Wood-toned like the body gives it a real
            silhouette of its own, the way a classical guitar's head
            actually reads lighter than its ebony fretboard. */}
        <mesh position={[0, 0.85, 0]} rotation={[0, 0, 0.05]} material={mats[body]} userData={{ inkSticker: true }}>
          <boxGeometry args={[0.24, 0.42, 0.1]} />
        </mesh>
        {/* tuning pegs — widened further past the headstock's own edges and
            enlarged so they read as knobs instead of disappearing into it */}
        {[0.75, 0.94].map((y) =>
          [-1, 1].map((side) => (
            <mesh key={`${y}${side}`} position={[side * 0.19, y, 0]} material={hardware} userData={{ inkSticker: true }}>
              <boxGeometry args={[0.1, 0.06, 0.14]} />
            </mesh>
          )),
        )}
      </group>
      {/* strings: from the tuning pegs (neck root y 1.15 + peg y up to 0.92,
          so ~2.07) down to the bridge (y -0.52) — they were only reaching
          y 1.345, stopping well short of the pegs and leaving the top of
          each string floating loose instead of anchored to the headstock. */}
      {/* Strings sat 0.038 proud of the body surface (z 0.31 vs the body's
          own front face at z 0.272) — visually a real gap between the
          strings and the wood once the sticker's true colour made both
          surfaces sharp and easy to compare. Pulled down to just clear the
          surface instead of floating off it. */}
      {[-0.045, 0, 0.045].map((x) => (
        <mesh key={x} position={[x, 0.76, 0.282]} material={mats.paper} userData={{ inkSticker: true }}>
          <boxGeometry args={[0.016, 2.6, 0.012]} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------------------------------------------------------------- monitor */

/** Code on the screen: short bars in a loose stagger, one in the plate colour
    like a highlighted line. Reads as work-in-progress from across the room. */
export function ScreenLines({ mats }: { mats: PartMats }) {
  const lines: Array<[number, number, number, keyof PartMats]> = [
    [-0.16, 0.3, 0.5, 'tone'],
    [-0.05, 0.2, 0.72, 'tone'],
    [-0.1, 0.1, 0.62, 'accent'],
    [-0.18, 0.0, 0.46, 'tone'],
    [-0.02, -0.1, 0.78, 'tone'],
    [-0.13, -0.2, 0.56, 'tone'],
  ]
  return (
    <group>
      {lines.map(([x, y, w, m]) => (
        <mesh key={y} position={[x, y, 0]} material={mats[m]}>
          <boxGeometry args={[w, 0.055, 0.01]} />
        </mesh>
      ))}
    </group>
  )
}
