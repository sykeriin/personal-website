import { useTexture } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { assets, type Pose } from '../assets/manifest'

/**
 * Durva, as a paper cutout standing in the world.
 *
 * A drawn cutout rather than a rigged 3D character: a model that must read as
 * hand-drawn is a months-long problem (rigging, toon shading, line stability
 * across poses), while a cutout is manga-native and is the trick Laika sold to
 * cinema audiences.
 *
 * The material uses ALPHA TEST, never alpha blending. A blended plane writes no
 * usable depth or normal, so the G-buffer would see a rectangle and the ink
 * shader would dutifully draw an outline around a rectangle instead of around
 * the character. This is also why the brief asks for a crisp silhouette edge.
 */

type Props = {
  pose: Pose
  position?: [number, number, number]
  /** World height in metres. Poses share a baseline so they don't jump. */
  height?: number
  rotation?: [number, number, number]
  /** Mirror horizontally, so a pose is drawn once and reused facing either way. */
  flip?: boolean
}

const ASPECT = 1024 / 1536

function DrawnFigure({ url, height, flip }: { url: string; height: number; flip: boolean }) {
  const texture = useTexture(url)

  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
    texture.needsUpdate = true
  }, [texture])

  return (
    <mesh
      scale={[flip ? -1 : 1, 1, 1]}
      castShadow
      // Both flags: cutout for the alpha-tested silhouette edge, sticker so
      // the drawn art keeps its own colours everywhere rather than
      // flattening to the chapter plate outside the visitor's bloom — the
      // whole point of a drawn character is that they don't disappear.
      userData={{ inkCutout: true, inkSticker: true }}
    >
      <planeGeometry args={[height * ASPECT, height]} />
      <meshToonMaterial map={texture} alphaTest={0.5} side={THREE.DoubleSide} />
    </mesh>
  )
}

/**
 * Deliberately crude stand-in. It must look like a placeholder rather than a
 * failed drawing, so nobody mistakes it for the finished character.
 */

/**
 * A "true colour" toon material — the same escape hatch the desk's potted
 * leaves and the tree's fruit use to stay their own colour everywhere, not
 * just inside the visitor's cursor bloom. Without this, every saturated
 * clothing colour here would flatten to one shared chapter plate the moment
 * the cursor moved away, and a red tank top and blue jeans would become
 * indistinguishable.
 */
function useTrueColor(hex: string) {
  return useMemo(() => new THREE.MeshToonMaterial({ color: hex, toneMapped: false }), [hex])
}

/** A big, voluminous mop of curls — mostly dark, with a few lighter
    bleached-tip curls scattered through, the way the reference does it. */
function CurlyHair({ u }: { u: number }) {
  const dark = useTrueColor('#241d17')
  const light = useTrueColor('#8a6a35')
  const curls: Array<[number, number, number, boolean]> = [
    [-0.55, 0.5, 0.1, false], [-0.32, 0.68, 0.28, false], [-0.05, 0.75, 0.35, true],
    [0.22, 0.7, 0.3, false], [0.5, 0.52, 0.12, false], [-0.42, 0.58, -0.28, false],
    [0.42, 0.58, -0.28, true], [0, 0.58, -0.48, false], [-0.6, 0.28, -0.05, false],
    [0.6, 0.28, -0.05, false], [-0.5, 0.2, 0.35, true], [0.5, 0.2, 0.35, false],
    [0, 0.85, 0, false],
  ]
  return (
    <group position={[0, u * 3.2, 0]}>
      {curls.map(([x, y, z, lit], i) => (
        <mesh
          key={i}
          position={[x * u * 0.95, y * u * 1.05, z * u * 0.95]}
          material={lit ? light : dark}
          userData={{ inkSticker: true }}
        >
          <sphereGeometry args={[u * (lit ? 0.24 : 0.32), 10, 8]} />
        </mesh>
      ))}
      {/* a couple of longer curls dropping past the jaw, side-framing */}
      {[-0.62, 0.62].map((x, i) => (
        <mesh
          key={`drop${i}`}
          position={[x * u, -u * 0.25, u * 0.15]}
          rotation={[0.15, 0, x > 0 ? -0.25 : 0.25]}
          material={dark}
          userData={{ inkSticker: true }}
        >
          <capsuleGeometry args={[u * 0.13, u * 0.5, 4, 8]} />
        </mesh>
      ))}
    </group>
  )
}

/** A thin chain necklace with a pendant — reads as an accessory without the
    bulk of a headphone band sitting where a collar should be. */
function Necklace({ u }: { u: number }) {
  const chain = useTrueColor('#c9a13a')
  return (
    <group position={[0, u * 2.15, u * 0.55]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={chain} userData={{ inkSticker: true }}>
        <torusGeometry args={[u * 0.32, u * 0.025, 6, 14, Math.PI]} />
      </mesh>
      <mesh position={[0, -u * 0.34, u * 0.03]} rotation={[0, 0, Math.PI / 4]} material={chain} userData={{ inkSticker: true }}>
        <boxGeometry args={[u * 0.09, u * 0.09, u * 0.02]} />
      </mesh>
    </group>
  )
}

/** Two dots and a downturned-to-upturned arc — the whole face budget. */
function SmileyFace({ u }: { u: number }) {
  const mat = useTrueColor('#1a1410')
  return (
    <group position={[0, u * 3.2, u * 0.72]}>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * u * 0.28, u * 0.12, 0]}
          material={mat}
          userData={{ inkSticker: true }}
        >
          <sphereGeometry args={[u * 0.07, 8, 8]} />
        </mesh>
      ))}
      <mesh
        position={[0, -u * 0.18, -u * 0.02]}
        rotation={[0, 0, Math.PI]}
        material={mat}
        userData={{ inkSticker: true }}
      >
        <torusGeometry args={[u * 0.26, u * 0.045, 8, 12, Math.PI]} />
      </mesh>
    </group>
  )
}

const TANK = '#f2ede4'
const BELT = '#1a1a1c'
const CARGO = '#26262a'
const CARGO_STITCH = '#3d3d42'
const SHOE = '#f2ede4'
const SHOE_SOLE = '#e8542f'
const SKIN = '#c4a179'

function PlaceholderFigure({ height }: { height: number }) {
  const u = height / 8
  const skin = useTrueColor(SKIN)
  const tank = useTrueColor(TANK)
  const belt = useTrueColor(BELT)
  const cargo = useTrueColor(CARGO)
  const stitch = useTrueColor(CARGO_STITCH)
  const shoe = useTrueColor(SHOE)
  const sole = useTrueColor(SHOE_SOLE)

  return (
    <group>
      <mesh position={[0, u * 3.2, 0]} material={skin} userData={{ inkSticker: true }}>
        <sphereGeometry args={[u * 0.8, 14, 10]} />
      </mesh>
      <CurlyHair u={u} />
      <SmileyFace u={u} />
      <Necklace u={u} />

      {/* torso (skin) with a plain, loose tank layered over it */}
      <mesh position={[0, u * 1.2, 0]} material={skin} userData={{ inkSticker: true }}>
        <capsuleGeometry args={[u * 0.62, u * 2.2, 4, 12]} />
      </mesh>
      <mesh position={[0, u * 1.1, 0]} material={tank} userData={{ inkSticker: true }}>
        <capsuleGeometry args={[u * 0.66, u * 1.5, 4, 12]} />
      </mesh>

      {[-1, 1].map((side) => (
        <mesh
          key={`arm${side}`}
          position={[side * u * 0.95, u * 1.3, 0]}
          rotation={[0, 0, side * 0.25]}
          material={skin}
          userData={{ inkSticker: true }}
        >
          <capsuleGeometry args={[u * 0.2, u * 1.7, 4, 8]} />
        </mesh>
      ))}

      {/* the belt, sitting where the tank meets the cargos */}
      <mesh position={[0, u * 0.15, 0]} material={belt} userData={{ inkSticker: true }}>
        <cylinderGeometry args={[u * 0.66, u * 0.66, u * 0.14, 16]} />
      </mesh>

      {/* baggy black cargo pants: wide capsule legs plus a cargo pocket flap
          on each thigh, the way the reference's pants read from a distance */}
      {[-1, 1].map((side) => (
        <group key={`leg${side}`}>
          <mesh
            position={[side * u * 0.44, u * -1.65, 0]}
            material={cargo}
            userData={{ inkSticker: true }}
          >
            <capsuleGeometry args={[u * 0.38, u * 2.1, 4, 8]} />
          </mesh>
          <mesh
            position={[side * u * 0.62, u * -1.3, u * 0.28]}
            material={stitch}
            userData={{ inkSticker: true }}
          >
            <boxGeometry args={[u * 0.28, u * 0.36, u * 0.06]} />
          </mesh>
        </group>
      ))}

      {/* white sneakers, planted at the end of each baggy leg, with a bright
          sole so they don't disappear into the pants above them */}
      {[-1, 1].map((side) => (
        <group key={`shoe${side}`} position={[side * u * 0.44, u * -2.82, u * 0.14]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={shoe} userData={{ inkSticker: true }}>
            <capsuleGeometry args={[u * 0.25, u * 0.4, 4, 8]} />
          </mesh>
          <mesh position={[0, -u * 0.24, 0]} material={sole} userData={{ inkSticker: true }}>
            <boxGeometry args={[u * 0.34, u * 0.08, u * 0.62]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function Figure({ pose, position = [0, 0, 0], height = 1.7, rotation, flip = false }: Props) {
  const url = assets.character[pose]
  return (
    <group position={position} rotation={rotation}>
      {url ? (
        <DrawnFigure url={url} height={height} flip={flip} />
      ) : (
        <PlaceholderFigure height={height} />
      )}
    </group>
  )
}
