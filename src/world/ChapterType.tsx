import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
// troika renders woff (not woff2); fontsource ships both.
import delaWoff from '@fontsource/anton/files/anton-latin-400-normal.woff?url'
import { entryFor } from './manifest'

/**
 * The chapter title as environmental typography: giant Dela Gothic letterforms
 * standing in the world behind the subject, printed in tone so the composite
 * pass renders them as screentone — type you could walk behind.
 *
 * This replaced the onomatopoeia sound-words (ZING, BAM…), which were tried and
 * rejected. Signage over sound effects: the same landed-in-a-place feeling,
 * none of the cartoon.
 */
export function ChapterType({
  pathname,
  reduceMotion,
}: {
  pathname: string
  reduceMotion: boolean
}) {
  const entry = entryFor(pathname)
  const group = useRef<THREE.Group>(null)
  const settled = useRef(0)
  // The cover carries no chapter type: the two books are the title, and the
  // giant name was fighting them for the same space.
  const skip = pathname === '/'

  const anchor = useMemo(() => {
    const [tx, ty, tz] = entry.camera.target
    return new THREE.Vector3(tx - 3.2, ty + 1.9, tz - 7.5)
  }, [entry.camera.target])

  // A quiet settle rather than a slam: the title eases up into place while the
  // camera dollies, like signage coming level as you walk into a room.
  useFrame((_, delta) => {
    if (!group.current) return
    if (reduceMotion) {
      group.current.position.y = anchor.y
      return
    }
    settled.current = THREE.MathUtils.damp(settled.current, 1, 3.5, delta)
    group.current.position.y = anchor.y - (1 - settled.current) * 0.7
  })

  // Key by pathname so the settle re-runs on every turn.
  if (skip) return null
  return (
    <group
      key={pathname}
      ref={group}
      position={[anchor.x, anchor.y - 0.7, anchor.z]}
      rotation={[0, -0.06, 0]}
    >
      <Text
        font={delaWoff}
        fontSize={1.55}
        letterSpacing={-0.015}
        color="#c4c0b8"
        anchorX="left"
        anchorY="middle"
        maxWidth={11}
        lineHeight={0.94}
        textAlign="left"
      >
        {entry.title.toLowerCase()}
      </Text>
    </group>
  )
}
