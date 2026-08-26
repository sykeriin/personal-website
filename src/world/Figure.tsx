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
    <mesh scale={[flip ? -1 : 1, 1, 1]} castShadow>
      <planeGeometry args={[height * ASPECT, height]} />
      <meshToonMaterial map={texture} alphaTest={0.5} side={THREE.DoubleSide} />
    </mesh>
  )
}

/**
 * Deliberately crude stand-in. It must look like a placeholder rather than a
 * failed drawing, so nobody mistakes it for the finished character.
 */
function PlaceholderFigure({ height }: { height: number }) {
  const u = height / 8
  return (
    <group>
      <mesh position={[0, u * 3.2, 0]}>
        <sphereGeometry args={[u * 0.8, 14, 10]} />
        <meshToonMaterial color="#c4c0b8" />
      </mesh>
      <mesh position={[0, u * 1.2, 0]}>
        <capsuleGeometry args={[u * 0.62, u * 2.2, 4, 12]} />
        <meshToonMaterial color="#c4c0b8" />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={`arm${side}`} position={[side * u * 0.95, u * 1.3, 0]} rotation={[0, 0, side * 0.25]}>
          <capsuleGeometry args={[u * 0.2, u * 1.7, 4, 8]} />
          <meshToonMaterial color="#c4c0b8" />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={`leg${side}`} position={[side * u * 0.4, u * -1.6, 0]}>
          <capsuleGeometry args={[u * 0.26, u * 2.2, 4, 8]} />
          <meshToonMaterial color="#c4c0b8" />
        </mesh>
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
