import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { InkPipeline } from '../three/InkPipeline'
import { type InkParams } from '../three/inkConfig'
import { readInkTheme, type InkPalette } from '../three/theme'
import { makeToonGradient } from '../three/toonGradient'
import { UniformPanel } from './UniformPanel'

/**
 * Phase 1 probe. Its only job is to answer "does this read as a manga panel or
 * as a filtered 3D render?" — an art question, so it ships with sliders.
 */
/**
 * Drives size from the window rather than the container's ResizeObserver, which
 * never fires in a headless/uncomposited pane. Lab only.
 */
function ViewportSync() {
  const setSize = useThree((s) => s.setSize)
  useEffect(() => {
    const apply = () => setSize(window.innerWidth, window.innerHeight)
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [setSize])
  return null
}

/**
 * Lab instrumentation. Also exposes R3F's manual advance(), because a browser
 * pane that never composites also never fires requestAnimationFrame — so the
 * render loop has to be stepped by hand to capture a frame for inspection.
 */
function FrameProbe() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const size = useThree((s) => s.size)
  const advance = useThree((s) => s.advance)

  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as { target?: THREE.Vector3; update?: () => void } | null

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>
    w.__inkAdvance = (frames = 8, step = 1000 / 60) => {
      const base = performance.now()
      for (let i = 0; i < frames; i++) advance(base + i * step, true)
      return w.__inkInfo
    }
    w.__inkCamera = (x: number, y: number, z: number) => {
      camera.position.set(x, y, z)
      camera.lookAt(controls?.target ?? new THREE.Vector3(0, 0.1, 0))
      controls?.update?.()
      return `${x},${y},${z}`
    }
    return () => {
      delete w.__inkAdvance
      delete w.__inkCamera
    }
  }, [advance, camera, controls])

  useFrame(() => {
    const w = window as unknown as Record<string, unknown>
    w.__inkFrames = ((w.__inkFrames as number) ?? 0) + 1
    w.__inkInfo = {
      size: `${size.width}x${size.height}`,
      drawCalls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      children: scene.children.length,
      lost: gl.getContext().isContextLost(),
    }
  }, 0)
  return null
}

function Subjects({ palette }: { palette: InkPalette }) {
  const gradient = useMemo(() => makeToonGradient(3), [])

  const paper = useMemo(
    () => new THREE.MeshToonMaterial({ color: palette.paper, gradientMap: gradient }),
    [gradient, palette.paper],
  )
  const dim = useMemo(
    () => new THREE.MeshToonMaterial({ color: palette.paperDim, gradientMap: gradient }),
    [gradient, palette.paperDim],
  )
  // Mid-value ground so the floor carries screentone instead of reading as blank paper.
  const ground = useMemo(
    () => new THREE.MeshToonMaterial({ color: palette.tone, gradientMap: gradient }),
    [gradient, palette.tone],
  )
  const crimson = useMemo(
    () => new THREE.MeshToonMaterial({ color: palette.crimson, gradientMap: gradient }),
    [gradient, palette.crimson],
  )

  return (
    <>
      {/* The torus is the real test: boxes flatter this technique, smooth
          curvature is where crease detection and dot-size-vs-luminance fail. */}
      <mesh position={[-1.7, 0.15, 0]} material={paper}>
        <torusGeometry args={[0.95, 0.38, 48, 96]} />
      </mesh>

      <mesh position={[1.0, 0, 0.2]} rotation={[0.3, 0.6, 0.1]} material={dim}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
      </mesh>

      <mesh position={[2.9, 0.1, -1.2]} material={paper}>
        <sphereGeometry args={[0.85, 48, 32]} />
      </mesh>

      {/* One crimson element per screen — the unlit accent plate. */}
      <mesh position={[0.0, 1.5, -1.6]} rotation={[0.4, 0.2, 0]} material={crimson}>
        <torusKnotGeometry args={[0.42, 0.15, 128, 24]} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.0, 0]} material={ground}>
        <planeGeometry args={[60, 60]} />
      </mesh>
    </>
  )
}

export function InkLab() {
  const [night, setNight] = useState(false)
  const [theme, setTheme] = useState(() => readInkTheme())
  const [params, setParams] = useState<InkParams>(() => readInkTheme().params)
  const [frozen, setFrozen] = useState(false)

  // Flipping the attribute swaps the ink plate in CSS; re-reading pushes it
  // straight into the shader uniforms. Proves DOM and WebGL share one source.
  useEffect(() => {
    if (night) document.documentElement.dataset.inkMode = 'night'
    else delete document.documentElement.dataset.inkMode
    setTheme(readInkTheme())
  }, [night])

  return (
    <>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0.5, 2.2, 6.4], fov: 42, near: 0.1, far: 40 }}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: 'high-performance',
          // lab only, so a frame can be read back for inspection
          preserveDrawingBuffer: true,
        }}
      >
        <ViewportSync />
        <FrameProbe />
        <color attach="background" args={[theme.palette.paper]} />
        {/* Low ambient on purpose: surfaces have to fall across all three cel
            bands or the page has no value structure and reads as a white render. */}
        <ambientLight intensity={0.10} />
        <directionalLight position={[4, 6, 3]} intensity={1.5} />
        <directionalLight position={[-5, 1.5, -2]} intensity={0.12} />
        <Subjects palette={theme.palette} />
        <OrbitControls makeDefault target={[0, 0.1, 0]} />
        <InkPipeline params={params} palette={theme.palette} frozen={frozen} />
      </Canvas>

      <UniformPanel
        params={params}
        onChange={setParams}
        onReset={() => setParams(theme.params)}
        frozen={frozen}
        onFrozenChange={setFrozen}
        night={night}
        onNightChange={setNight}
      />
    </>
  )
}
