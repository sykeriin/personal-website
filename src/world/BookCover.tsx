import { Text } from '@react-three/drei'
import * as THREE from 'three'
import delaWoff from '@fontsource/dela-gothic-one/files/dela-gothic-one-latin-400-normal.woff?url'
import monoWoff from '@fontsource/share-tech-mono/files/share-tech-mono-latin-400-normal.woff?url'

/**
 * A designed cover, not a blank slab: title block with the name, the side's
 * word printed big in the plate, a spine title, and an obi — the paper belt
 * band Japanese volumes actually wear, carrying the pitch line.
 *
 * The parent flips cover B upside down; the type flips with it, exactly as a
 * printed tête-bêche second front does. Legible enough to read tilted-headed,
 * strange enough to make you flip the book — which is the point.
 */

type Mats = {
  paper: THREE.MeshToonMaterial
  dim: THREE.MeshToonMaterial
  tone: THREE.MeshToonMaterial
}

const INK = '#0b0b0c'
const PAPER = '#f7f6f3'

export function Book({
  mats,
  cover,
  word,
  volume,
  obi,
  children,
}: {
  mats: Mats
  /** The cover plate material — the side's colour. */
  cover: THREE.MeshToonMaterial
  /** The side's word, printed huge. */
  word: string
  /** Small label on the title block, e.g. "vol. 02 · cover a". */
  volume: string
  /** The obi pitch line. */
  obi: string
  /** Extra dressing (the seal on cover A). */
  children?: React.ReactNode
}) {
  return (
    <group>
      {/* page block, covers, spine */}
      <mesh position={[0.03, 0, 0]} material={mats.paper}>
        <boxGeometry args={[2.5, 3.5, 0.36]} />
      </mesh>
      <mesh position={[0, 0, 0.21]} material={cover}>
        <boxGeometry args={[2.62, 3.62, 0.07]} />
      </mesh>
      <mesh position={[0, 0, -0.2]} material={mats.dim}>
        <boxGeometry args={[2.62, 3.62, 0.06]} />
      </mesh>
      <mesh position={[-1.31, 0, 0]} material={mats.dim}>
        <boxGeometry args={[0.08, 3.62, 0.48]} />
      </mesh>

      {/* title block, tipped-in label */}
      <mesh position={[-0.1, 1.05, 0.26]} material={mats.paper}>
        <boxGeometry args={[2.05, 0.95, 0.05]} />
      </mesh>
      <Text
        font={delaWoff}
        fontSize={0.235}
        color={INK}
        anchorX="center"
        anchorY="middle"
        position={[-0.1, 1.17, 0.3]}
        maxWidth={1.9}
        textAlign="center"
        lineHeight={1.0}
      >
        durva sharma
      </Text>
      <Text
        font={monoWoff}
        fontSize={0.115}
        color={INK}
        anchorX="center"
        anchorY="middle"
        position={[-0.1, 0.87, 0.3]}
        letterSpacing={0.12}
      >
        {volume}
      </Text>

      {/* the side's word, printed big straight on the plate */}
      <Text
        font={delaWoff}
        fontSize={0.62}
        color={PAPER}
        anchorX="center"
        anchorY="middle"
        position={[-0.06, 0.02, 0.26]}
        letterSpacing={0.01}
      >
        {word}
      </Text>

      {/* the obi: paper belt around the lower third, like a real volume */}
      <mesh position={[0.02, -1.05, 0.235]} material={mats.paper}>
        <boxGeometry args={[2.66, 0.72, 0.045]} />
      </mesh>
      <mesh position={[0.02, -1.05, -0.19]} material={mats.paper}>
        <boxGeometry args={[2.66, 0.72, 0.045]} />
      </mesh>
      <Text
        font={monoWoff}
        fontSize={0.125}
        color={INK}
        anchorX="center"
        anchorY="middle"
        position={[-0.05, -0.98, 0.28]}
        letterSpacing={0.08}
        maxWidth={2.3}
        textAlign="center"
      >
        {obi}
      </Text>
      <Text
        font={monoWoff}
        fontSize={0.1}
        color={INK}
        anchorX="center"
        anchorY="middle"
        position={[-0.05, -1.24, 0.28]}
        letterSpacing={0.14}
      >
        {'click to open →'}
      </Text>

      {children}
    </group>
  )
}
