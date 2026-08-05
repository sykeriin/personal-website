import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { useDocumentVisible } from '../../hooks/usePerformanceMode'

type Props = {
  dpr: number | [number, number]
}

function ScreentoneMaterial({ color = '#e8e8e8' }: { color?: string }) {
  const texture = useMemo(() => {
    const size = 64
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = color
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = 'rgba(11,11,12,0.55)'
    for (let y = 0; y < size; y += 4) {
      for (let x = 0; x < size; x += 4) {
        ctx.beginPath()
        ctx.arc(x + 1, y + 1, 0.9, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(6, 8)
    return tex
  }, [color])

  return <meshStandardMaterial map={texture} roughness={0.85} metalness={0.05} />
}

function FloatingPanels({ pointer }: { pointer: MutableRefObject<{ x: number; y: number }> }) {
  const group = useRef<THREE.Group>(null)
  const panels = useMemo(
    () => [
      { pos: [-2.2, 0.6, -0.4] as const, rot: [0.15, 0.55, -0.08] as const, scale: [1.6, 2.1, 0.06] as const },
      { pos: [2.1, 0.1, -0.8] as const, rot: [-0.1, -0.65, 0.1] as const, scale: [1.35, 1.8, 0.06] as const },
      { pos: [0.2, -1.1, 0.2] as const, rot: [0.25, 0.2, 0.05] as const, scale: [1.1, 1.4, 0.06] as const },
      { pos: [-0.8, 1.4, -1.2] as const, rot: [0.05, 0.35, -0.15] as const, scale: [0.9, 1.1, 0.05] as const },
    ],
    [],
  )

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      pointer.current.x * 0.35,
      0.05,
    )
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      -pointer.current.y * 0.2,
      0.05,
    )
    group.current.children.forEach((child, i) => {
      child.position.y = panels[i].pos[1] + Math.sin(t * 0.7 + i) * 0.12
    })
  })

  return (
    <group ref={group}>
      {panels.map((p, i) => (
        <mesh key={i} position={[...p.pos]} rotation={[...p.rot]} scale={[...p.scale]}>
          <boxGeometry args={[1, 1, 1]} />
          <ScreentoneMaterial color={i % 2 === 0 ? '#f2f2f2' : '#dcdcdc'} />
        </mesh>
      ))}
    </group>
  )
}

function SpeedLineField() {
  const ref = useRef<THREE.Mesh>(null)
  const mat = useMemo(() => {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, size, size)
    ctx.strokeStyle = 'rgba(250,250,250,0.35)'
    ctx.lineWidth = 1
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(size / 2, size / 2)
      ctx.lineTo(size / 2 + Math.cos(a) * size, size / 2 + Math.sin(a) * size)
      ctx.stroke()
    }
    const tex = new THREE.CanvasTexture(canvas)
    return new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    const t = Math.min(1, state.clock.elapsedTime / 1.2)
    ref.current.scale.setScalar(0.8 + t * 1.4)
    mat.opacity = 0.45 * (1 - t * 0.55)
    ref.current.rotation.z = state.clock.elapsedTime * 0.08
  })

  return (
    <mesh ref={ref} position={[0, 0, -1.5]} material={mat}>
      <planeGeometry args={[8, 8]} />
    </mesh>
  )
}

function Scene({ pointer }: { pointer: MutableRefObject<{ x: number; y: number }> }) {
  return (
    <>
      <color attach="background" args={['#0b0b0c']} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 6, 3]} intensity={1.1} />
      <directionalLight position={[-3, -2, 4]} intensity={0.35} color="#b01030" />
      <SpeedLineField />
      <FloatingPanels pointer={pointer} />
    </>
  )
}

export function CoverScene({ dpr }: Props) {
  const visible = useDocumentVisible()
  const pointer = useRef({ x: 0, y: 0 })

  return (
    <div
      className="cover__canvas"
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        pointer.current.y = ((e.clientY - rect.top) / rect.height) * 2 - 1
      }}
    >
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 0, 5.2], fov: 42 }}
        frameloop={visible ? 'always' : 'never'}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <Scene pointer={pointer} />
      </Canvas>
    </div>
  )
}
