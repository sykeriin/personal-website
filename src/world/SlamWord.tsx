import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
// troika renders woff (not woff2); fontsource ships both.
import rampartWoff from '@fontsource/rampart-one/files/rampart-one-latin-400-normal.woff?url'
import { entryFor } from './manifest'

/**
 * The onomatopoeia. Every page turn plants its sound-word IN THE WORLD — big
 * Rampart One letterforms standing in space near the subject, arriving with
 * the slam's overshoot and staying planted for the visit, so you can look back
 * at the word the way you can look back at anything else in a place.
 *
 * This is the signature the whole design was named for: the transition is not
 * a wipe over the page, it is an event that happened in the world.
 */
export function SlamWord({
  pathname,
  ink,
  reduceMotion,
}: {
  pathname: string
  ink: string
  reduceMotion: boolean
}) {
  const entry = entryFor(pathname)
  const group = useRef<THREE.Group>(null)
  const bornAt = useRef(performance.now())
  const [word, setWord] = useState(entry.sfx)

  useEffect(() => {
    bornAt.current = performance.now()
    setWord(entry.sfx)
  }, [entry.sfx, pathname])

  // Planted near the camera target, up and off-axis so it never sits on the
  // subject's face. Slight yaw so it reads as standing in the space.
  const anchor = useMemo(() => {
    const [tx, ty, tz] = entry.camera.target
    // Upper-left of the frame: the slab is bottom, the tabs are right, and the
    // subjects centre — that corner is reliably open on every spread.
    return new THREE.Vector3(tx - 2.6, ty + 2.5, tz - 1.6)
  }, [entry.camera.target])

  useFrame(() => {
    if (!group.current) return
    if (reduceMotion) {
      group.current.scale.setScalar(1)
      return
    }
    const t = (performance.now() - bornAt.current) / 1000
    // Hard arrival with one overshoot, then settled. Matches the slam window.
    const k = t < 0.09 ? t / 0.09 : 1 + Math.sin(Math.min(t, 0.6) * 18) * 0.09 * Math.exp(-t * 7)
    group.current.scale.setScalar(Math.max(0.0001, k))
  })

  return (
    <group ref={group} position={anchor} rotation={[0, -0.28, -0.08]}>
      <Text
        font={rampartWoff}
        fontSize={1.05}
        letterSpacing={0.04}
        color={ink}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.045}
        outlineColor={ink}
        outlineOpacity={0.18}
      >
        {word}
      </Text>
    </group>
  )
}
