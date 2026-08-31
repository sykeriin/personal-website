import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { InkPipeline } from '../three/InkPipeline'
import { readInkTheme } from '../three/theme'
import { tierUsesPostProcessing, type RenderTier } from '../hooks/useRenderTier'
import { entryFor } from './manifest'
import { bloom, trackPointer } from './bloom'
import { useHotspots } from './hotspots'
import { SceneFor } from './scenes'

/**
 * One Canvas for the whole site, mounted in the layout and never unmounted.
 *
 * A canvas per page would destroy and recreate a WebGL context on every
 * navigation — 50–200ms each, browsers cap concurrent contexts, every compiled
 * program rebuilds so each route change hitches on shader compile, and camera
 * motion *between* routes becomes impossible, which is the entire idea.
 */

type Props = {
  pathname: string
  tier: RenderTier
  reduceMotion: boolean
  dpr: [number, number] | number
  /** Explore mode: props become clickable. */
  explore: boolean
  eventSource: React.RefObject<HTMLElement | null>
}

/** Damped camera. Driven purely by pathname, so an in-world click, a tab click,
    browser Back and a pasted URL all produce identical motion.

    Crossing between the volume's two covers rolls the camera through a full
    turn — the tête-bêche gesture: the book is being turned over in your hands.
    The roll target only ever advances by exactly 2π, so it always settles
    upright, and reduced motion skips the roll entirely. */
function CameraRig({ pathname, instant }: { pathname: string; instant: boolean }) {
  const camera = useThree((s) => s.camera)
  const target = useMemo(() => new THREE.Vector3(), [])
  const desired = useMemo(() => new THREE.Vector3(), [])
  const look = useMemo(() => new THREE.Vector3(), [])
  const first = useRef(true)
  const roll = useRef(0)
  const rollTarget = useRef(0)
  const lastSide = useRef<'tech' | 'creative' | null>(null)

  const entry = entryFor(pathname)
  const pose = entry.camera

  useEffect(() => {
    if (entry.side === 'shared') return
    if (lastSide.current !== null && lastSide.current !== entry.side && !instant) {
      rollTarget.current += Math.PI * 2
    }
    lastSide.current = entry.side
  }, [entry.side, instant])

  useEffect(() => {
    desired.set(...pose.position)
    target.set(...pose.target)
    // A deep link arrives at its pose, it does not fly in from the cover.
    // Nobody landing on /projects/chainguard from a link should watch an
    // establishing shot.
    if (first.current || instant) {
      camera.position.copy(desired)
      camera.lookAt(target)
      first.current = false
    }
  }, [pose, camera, desired, target, instant])

  useFrame((_, delta) => {
    if (instant) return
    camera.position.x = THREE.MathUtils.damp(camera.position.x, desired.x, 4, delta)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, desired.y, 4, delta)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, desired.z, 4, delta)

    // The flip. Damped like the dolly so the whole move is one gesture; snapped
    // once it lands so floating point can never leave the horizon tilted.
    roll.current = THREE.MathUtils.damp(roll.current, rollTarget.current, 3.2, delta)
    if (Math.abs(rollTarget.current - roll.current) < 0.002) roll.current = rollTarget.current
    camera.up.set(Math.sin(roll.current), Math.cos(roll.current), 0)

    look.lerp(target, 1 - Math.exp(-4 * delta))
    camera.lookAt(look)
  })

  return null
}

const SLAM_MS = 420

/**
 * Fires the slam on every location change. Read by the pipeline each frame, so
 * the transition costs a uniform rather than a remount.
 *
 * The envelope is computed from elapsed time inside the render loop rather than
 * driven by its own rAF: a separate rAF would stall if the tab were backgrounded
 * mid-navigation and leave the impact frame stuck on at full crimson.
 */
function useSlam(pathname: string, enabled: boolean) {
  const slam = useRef(0)
  const startedAt = useRef<number | null>(null)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (!enabled) return
    startedAt.current = performance.now()
    return () => {
      startedAt.current = null
      slam.current = 0
    }
  }, [pathname, enabled])

  useFrame(() => {
    if (startedAt.current === null) {
      slam.current = 0
      return
    }
    const t = (performance.now() - startedAt.current) / SLAM_MS
    if (t >= 1) {
      startedAt.current = null
      slam.current = 0
      return
    }
    // Fast attack, slower release — commit, land, reset.
    slam.current = t < 0.18 ? t / 0.18 : Math.pow(1 - (t - 0.18) / 0.82, 1.6)
  })

  return slam
}

/** Dev-only: lets a headless pane step the render loop by hand. */
function DevBridge() {
  const advance = useThree((s) => s.advance)
  const size = useThree((s) => s.size)
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>
    w.__inkAdvance = (frames = 8) => {
      const base = performance.now()
      for (let i = 0; i < frames; i++) advance(base + i * 16.7, true)
      return `${size.width}x${size.height}`
    }
    return () => {
      delete w.__inkAdvance
    }
  }, [advance, size])
  return null
}

function Stage({
  pathname,
  tier,
  reduceMotion,
  explore,
}: {
  pathname: string
  tier: RenderTier
  reduceMotion: boolean
  explore: boolean
}) {
  const base = useMemo(() => readInkTheme(), [])
  const slam = useSlam(pathname, !reduceMotion)
  const entry = entryFor(pathname)

  // The accent comes straight from the manifest rather than by re-reading the
  // CSS variable. Layout sets that variable in an effect, which lands AFTER
  // this render, so reading it here would always be one route behind.
  const theme = useMemo(
    () => ({ ...base, palette: { ...base.palette, accent: entry.accent } }),
    [base, entry.accent],
  )

  // The bloom follows the pointer everywhere at a small radius so the visitor
  // discovers the mechanic without being told; hovering something pickable
  // widens it, and picking it up opens it right out.
  const { hovered, active } = useHotspots()
  useEffect(() => {
    window.addEventListener('pointermove', trackPointer)
    return () => window.removeEventListener('pointermove', trackPointer)
  }, [])
  useEffect(() => {
    bloom.boost = active ? 0.55 : hovered ? 0.22 : 0
  }, [hovered, active])

  return (
    <>
      <color attach="background" args={[theme.palette.paper]} />
      {/* Key at roughly 45 degrees, which is the whole ballgame for value
          structure. Too raking and every camera-facing surface falls into the
          mid band, so the frame is flat grey tone; too frontal and everything
          lands in the lit band, so there are no solid blacks to anchor the page.
          Ambient stays very low so faces turned away reach the darkest band and
          fill flat ink. */}
      <ambientLight intensity={0.09} />
      <directionalLight position={[4.5, 5, 3.2]} intensity={1.7} />
      <directionalLight position={[-5, 1.5, -2]} intensity={0.1} />

      <CameraRig pathname={pathname} instant={reduceMotion} />
      {import.meta.env.DEV ? <DevBridge /> : null}

      <Suspense fallback={null}>
        <SceneFor
          sceneKey={entry.scene}
          pathname={pathname}
          palette={theme.palette}
          explore={explore}
        />
      </Suspense>

      {tierUsesPostProcessing(tier) ? (
        <InkPipeline
          params={theme.params}
          palette={theme.palette}
          frozen={reduceMotion}
          slamRef={slam}
          bloomRef={bloom}
        />
      ) : null}
    </>
  )
}

export default function WorldCanvas({
  pathname,
  tier,
  reduceMotion,
  dpr,
  explore,
  eventSource,
}: Props) {
  return (
    <div className="ink-stage" aria-hidden="true">
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 1, 6], fov: 42, near: 0.1, far: 60 }}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: 'high-performance',
          // dev only: lets a headless pane read a frame back for inspection
          preserveDrawingBuffer: import.meta.env.DEV,
        }}
        // Listening at the DOM root means 3D objects stay pickable through the
        // overlay while real links keep receiving their own clicks.
        eventSource={eventSource as unknown as React.MutableRefObject<HTMLElement>}
        eventPrefix="client"
      >
        {/* pathname is prop-drilled, never read from context: R3F renders
            through a separate reconciler, so react-router's context is not
            available inside the canvas. */}
        <Stage
          pathname={pathname}
          tier={tier}
          reduceMotion={reduceMotion}
          explore={explore}
        />
      </Canvas>
    </div>
  )
}
