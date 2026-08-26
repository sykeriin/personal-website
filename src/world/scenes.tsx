import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { projects } from '../data/content'
import { readInkTheme } from '../three/theme'
import { makeToonGradient } from '../three/toonGradient'
import type { SceneKey } from './manifest'
import { Figure } from './Figure'

/**
 * One world, seen from different places. Every prop is assembled from code
 * primitives rather than authored in a modeller: a GLB's edges land where a
 * modeller put them, and code-assembled edges land where the ink shader needs
 * them — which matters enormously when edge detection is what draws the picture.
 *
 * Budget: keep each scene well under ~60 objects. Everything renders twice, once
 * for the G-buffer prepass and once for beauty.
 */

function useInk() {
  const theme = useMemo(() => readInkTheme(), [])
  const gradient = useMemo(() => makeToonGradient(3), [])
  return useMemo(() => {
    const make = (color: string) => new THREE.MeshToonMaterial({ color, gradientMap: gradient })
    return {
      paper: make(theme.palette.paper),
      dim: make(theme.palette.paperDim),
      tone: make(theme.palette.tone),
      crimson: make(theme.palette.crimson),
    }
  }, [theme, gradient])
}

type Mats = ReturnType<typeof useInk>

/** Slow idle drift. The world is nearly still between slams — that stillness is
    what makes the slam land. */
function Drift({ children, amount = 0.06, speed = 0.5, phase = 0 }: {
  children: ReactNode
  amount?: number
  speed?: number
  phase?: number
}) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!ref.current) return
    ref.current.position.y = Math.sin(state.clock.elapsedTime * speed + phase) * amount
  })
  return <group ref={ref}>{children}</group>
}

/** Paper-dim, not tone: a mid-grey floor fills most of the frame and leaves no
    white for the subject to sit against. The floor should recede, not compete. */
function Ground({ mats }: { mats: Mats }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 0]} material={mats.dim}>
      <planeGeometry args={[80, 80]} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ cover */

function CoverScene({ mats }: { mats: Mats }) {
  return (
    <>
      <Ground mats={mats} />
      <Drift amount={0.05} speed={0.45}>
        <group rotation={[0.1, -0.72, 0.03]} position={[0, 0.25, 0]}>
          {/* page block first, so the cover overhangs it like a real book */}
          <mesh position={[0.03, 0, 0]} material={mats.paper}>
            <boxGeometry args={[2.5, 3.5, 0.36]} />
          </mesh>
          <mesh position={[0, 0, 0.2]} material={mats.dim}>
            <boxGeometry args={[2.62, 3.62, 0.06]} />
          </mesh>
          <mesh position={[0, 0, -0.2]} material={mats.dim}>
            <boxGeometry args={[2.62, 3.62, 0.06]} />
          </mesh>
          {/* spine */}
          <mesh position={[-1.31, 0, 0]} material={mats.dim}>
            <boxGeometry args={[0.08, 3.62, 0.46]} />
          </mesh>
          {/* the seal, stamped into the cover — rotated to face out, since a
              cylinder's axis is Y and would otherwise lie flat like a coin */}
          <mesh
            position={[0.72, -1.1, 0.25]}
            rotation={[Math.PI / 2, 0, -0.2]}
            material={mats.crimson}
          >
            <cylinderGeometry args={[0.3, 0.3, 0.05, 24]} />
          </mesh>
        </group>
      </Drift>

      {/* him, on the cover */}
      <Figure pose="idle" position={[2.4, -0.3, 1.1]} height={1.7} rotation={[0, -0.35, 0]} />

      {/* panel shards drifting behind */}
      <Drift amount={0.1} speed={0.32} phase={1.4}>
        <mesh position={[-2.9, 1.1, -2.4]} rotation={[0.1, 0.5, -0.1]} material={mats.paper}>
          <boxGeometry args={[1.5, 1.9, 0.05]} />
        </mesh>
      </Drift>
      <Drift amount={0.08} speed={0.4} phase={2.7}>
        <mesh position={[2.8, 0.4, -2.0]} rotation={[-0.08, -0.6, 0.12]} material={mats.dim}>
          <boxGeometry args={[1.3, 1.7, 0.05]} />
        </mesh>
      </Drift>
    </>
  )
}

/* ------------------------------------------------------------------- desk */

function DeskScene({ mats, closing = false }: { mats: Mats; closing?: boolean }) {
  return (
    <>
      <Ground mats={mats} />
      {/* desk */}
      <mesh position={[0, -0.55, 0]} material={mats.dim}>
        <boxGeometry args={[6.4, 0.18, 2.6]} />
      </mesh>
      {/* monitor */}
      <group position={[-0.6, 0.35, -0.5]}>
        <mesh material={mats.dim}>
          <boxGeometry args={[2.3, 1.4, 0.12]} />
        </mesh>
        <mesh position={[0, 0, 0.07]} material={mats.paper}>
          <boxGeometry args={[2.08, 1.2, 0.02]} />
        </mesh>
        <mesh position={[0, -0.86, 0]} material={mats.dim}>
          <boxGeometry args={[0.3, 0.36, 0.24]} />
        </mesh>
      </group>
      {/* mug — the crimson accent, one per screen */}
      <mesh position={[1.15, -0.28, 0.35]} material={mats.crimson}>
        <cylinderGeometry args={[0.19, 0.16, 0.36, 20]} />
      </mesh>
      {/* laptop, lid half down */}
      <group position={[1.0, -0.4, -0.35]} rotation={[0, -0.4, 0]}>
        <mesh material={mats.paper}>
          <boxGeometry args={[1.2, 0.05, 0.85]} />
        </mesh>
        <mesh position={[0, 0.3, -0.4]} rotation={[-0.5, 0, 0]} material={mats.paper}>
          <boxGeometry args={[1.2, 0.75, 0.04]} />
        </mesh>
      </group>
      {/* guitar leaning against the desk edge */}
      <group position={[-2.5, -0.35, 0.5]} rotation={[0, 0.3, 0.22]}>
        <mesh material={mats.dim}>
          <sphereGeometry args={[0.42, 20, 14]} />
        </mesh>
        <mesh position={[0, 0.95, 0]} material={mats.dim}>
          <boxGeometry args={[0.12, 1.5, 0.07]} />
        </mesh>
      </group>
      {/* gloves on a hook — quietly foreshadowing the off-panel spread */}
      {!closing ? (
        <group position={[2.7, 0.5, -1.9]}>
          {/* the peg they hang from, or they read as two balls in mid-air */}
          <mesh position={[0, 0.55, -0.12]} rotation={[Math.PI / 2, 0, 0]} material={mats.dim}>
            <cylinderGeometry args={[0.035, 0.035, 0.5, 8]} />
          </mesh>
          <mesh position={[0, 0.32, 0]} material={mats.dim}>
            <boxGeometry args={[0.05, 0.42, 0.05]} />
          </mesh>
          <mesh material={mats.tone}>
            <sphereGeometry args={[0.24, 18, 12]} />
          </mesh>
          <mesh position={[0.3, 0.06, 0.06]} material={mats.tone}>
            <sphereGeometry args={[0.22, 18, 12]} />
          </mesh>
        </group>
      ) : null}
      {/* envelope, only on the closing spread */}
      {closing ? (
        <Drift amount={0.05} speed={0.6}>
          <group position={[0.1, 0.5, 0.3]} rotation={[0.2, 0.15, -0.05]}>
            <mesh material={mats.paper}>
              <boxGeometry args={[1.7, 1.1, 0.04]} />
            </mesh>
            <mesh position={[0, 0.2, 0.03]} rotation={[0, 0, Math.PI / 4]} material={mats.dim}>
              <boxGeometry args={[0.78, 0.78, 0.02]} />
            </mesh>
          </group>
        </Drift>
      ) : null}
      {closing ? (
        <Figure pose="guitar" position={[-2.9, -0.35, 1.0]} height={1.35} rotation={[0, 0.4, 0]} />
      ) : (
        <Figure pose="sit" position={[1.9, -0.3, 1.2]} height={1.5} rotation={[0, -0.5, 0]} />
      )}

      {/* back wall, so the room has a surface behind it to hold tone */}
      <mesh position={[0, 1.4, -4.2]} material={mats.paper}>
        <boxGeometry args={[14, 6, 0.2]} />
      </mesh>
      {/* window, three layered cut-paper skyline planes */}
      <group position={[-2.2, 1.7, -3.4]}>
        <mesh material={mats.paper}>
          <boxGeometry args={[3.0, 2.0, 0.04]} />
        </mesh>
        <mesh position={[-0.6, -0.5, 0.06]} material={mats.tone}>
          <boxGeometry args={[0.5, 1.0, 0.03]} />
        </mesh>
        <mesh position={[0.1, -0.35, 0.1]} material={mats.dim}>
          <boxGeometry args={[0.42, 1.3, 0.03]} />
        </mesh>
        <mesh position={[0.75, -0.6, 0.14]} material={mats.tone}>
          <boxGeometry args={[0.55, 0.8, 0.03]} />
        </mesh>
      </group>
    </>
  )
}

/* --------------------------------------------------------------- workshop */

function WorkshopScene({ mats }: { mats: Mats }) {
  return (
    <>
      <Ground mats={mats} />
      {/* PetAlly: a paper phone with stacked app cards */}
      <group position={[-2.2, 0.1, 0]} rotation={[0, 0.4, 0]}>
        <mesh material={mats.paper}>
          <boxGeometry args={[1.05, 2.1, 0.1]} />
        </mesh>
        <Drift amount={0.05} speed={0.7}>
          <mesh position={[0.15, 0.35, 0.22]} rotation={[0, 0, -0.06]} material={mats.dim}>
            <boxGeometry args={[0.9, 0.55, 0.03]} />
          </mesh>
        </Drift>
        <Drift amount={0.04} speed={0.55} phase={1.1}>
          <mesh position={[-0.1, -0.4, 0.3]} rotation={[0, 0, 0.05]} material={mats.tone}>
            <boxGeometry args={[0.9, 0.55, 0.03]} />
          </mesh>
        </Drift>
      </group>

      {/* HAWKEYE: runway strip, chase vehicle, and the bolt on the tarmac */}
      <group position={[2.0, -0.7, 0]} rotation={[0, -0.25, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} material={mats.dim}>
          <planeGeometry args={[2.6, 6]} />
        </mesh>
        <mesh position={[0, 0.02, 1.2]} rotation={[-Math.PI / 2, 0, 0]} material={mats.paper}>
          <planeGeometry args={[0.16, 1.1]} />
        </mesh>
        <mesh position={[0, 0.02, -0.4]} rotation={[-Math.PI / 2, 0, 0]} material={mats.paper}>
          <planeGeometry args={[0.16, 1.1]} />
        </mesh>
        {/* the FOD itself, in crimson so the eye finds it */}
        <mesh position={[0.55, 0.08, 0.4]} material={mats.crimson}>
          <cylinderGeometry args={[0.07, 0.07, 0.16, 10]} />
        </mesh>
        {/* jetson box */}
        <mesh position={[-0.9, 0.22, 2.0]} material={mats.paper}>
          <boxGeometry args={[0.5, 0.4, 0.6]} />
        </mesh>
      </group>
    </>
  )
}

/* ------------------------------------------------------------------- case */

/** Each project gets a distinct silhouette, keyed off its slug. Silhouette is
    what the ink shader draws, so the shapes have to differ in outline. */
function Artifact({ slug, mats }: { slug: string; mats: Mats }) {
  switch (slug) {
    case 'alter':
      return (
        <group>
          <mesh material={mats.paper}>
            <boxGeometry args={[0.62, 1.24, 0.08]} />
          </mesh>
          {[0.34, 0.52, 0.7].map((r, i) => (
            <mesh key={r} position={[0, 0.1, 0.1 + i * 0.06]} material={mats.crimson}>
              <torusGeometry args={[r, 0.014, 8, 40]} />
            </mesh>
          ))}
        </group>
      )
    case 'chainguard':
      return (
        <group rotation={[0.3, 0, 0]}>
          {[-0.36, 0, 0.36].map((y, i) => (
            <mesh key={y} position={[0, y, 0]} rotation={[0, i % 2 ? Math.PI / 2 : 0, 0]} material={mats.paper}>
              <torusGeometry args={[0.26, 0.075, 10, 28]} />
            </mesh>
          ))}
          <mesh position={[0, -0.62, 0]} material={mats.crimson}>
            <cylinderGeometry args={[0.2, 0.2, 0.05, 20]} />
          </mesh>
        </group>
      )
    case 'verdant':
      return (
        <group>
          <mesh material={mats.paper}>
            <cylinderGeometry args={[0.34, 0.34, 0.62, 22]} />
          </mesh>
          <mesh position={[0, 0.34, 0]} material={mats.dim}>
            <cylinderGeometry args={[0.42, 0.42, 0.06, 22]} />
          </mesh>
          <mesh position={[0, -0.34, 0]} material={mats.dim}>
            <cylinderGeometry args={[0.42, 0.42, 0.06, 22]} />
          </mesh>
          <mesh position={[0.5, -0.5, 0.2]} rotation={[0, 0, 0.6]} material={mats.crimson}>
            <boxGeometry args={[0.02, 0.9, 0.02]} />
          </mesh>
        </group>
      )
    case 'cloudsense':
      return (
        <group>
          <mesh material={mats.paper}>
            <sphereGeometry args={[0.42, 20, 14]} />
          </mesh>
          <mesh position={[0.38, -0.08, 0.05]} material={mats.paper}>
            <sphereGeometry args={[0.3, 18, 12]} />
          </mesh>
          <mesh position={[-0.36, -0.1, -0.05]} material={mats.paper}>
            <sphereGeometry args={[0.26, 18, 12]} />
          </mesh>
          {/* the spike that makes the invoice hurt */}
          <mesh position={[0.1, -0.72, 0]} rotation={[0, 0, -0.35]} material={mats.crimson}>
            <boxGeometry args={[0.05, 0.8, 0.05]} />
          </mesh>
        </group>
      )
    default:
      return (
        <group>
          <mesh position={[0, -0.35, 0]} material={mats.dim}>
            <cylinderGeometry args={[0.05, 0.05, 0.9, 10]} />
          </mesh>
          <mesh position={[0, 0.3, 0]} rotation={[0, 0.3, 0]} material={mats.paper}>
            <boxGeometry args={[0.9, 0.42, 0.05]} />
          </mesh>
          <mesh position={[0.1, 0.75, 0]} rotation={[0, -0.4, 0]} material={mats.crimson}>
            <boxGeometry args={[0.62, 0.28, 0.05]} />
          </mesh>
        </group>
      )
  }
}

function CaseScene({ mats }: { mats: Mats }) {
  // An arc, not a row: left/right stays unambiguous but it doesn't read as a list.
  const RADIUS = 5.4
  return (
    <>
      <Ground mats={mats} />
      <Figure pose="guard" position={[-3.6, -0.3, 1.6]} height={1.7} rotation={[0, 0.5, 0]} />
      {projects.map((project, i) => {
        const t = (i - (projects.length - 1) / 2) / (projects.length - 1)
        const angle = t * 0.9
        const x = Math.sin(angle) * RADIUS
        const z = -Math.cos(angle) * RADIUS + RADIUS - 1.2
        return (
          <group key={project.slug} position={[x, 0, z]} rotation={[0, -angle, 0]}>
            <mesh position={[0, -0.92, 0]} material={mats.dim}>
              <boxGeometry args={[0.9, 0.36, 0.9]} />
            </mesh>
            <Drift amount={0.045} speed={0.5} phase={i * 1.3}>
              <group position={[0, 0.05, 0]} scale={1.15}>
                <Artifact slug={project.slug} mats={mats} />
              </group>
            </Drift>
          </group>
        )
      })}
    </>
  )
}

function ArtifactScene({ mats, pathname }: { mats: Mats; pathname: string }) {
  const slug = pathname.split('/').filter(Boolean)[1] ?? ''
  const spin = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (spin.current) spin.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.35
  })
  return (
    <>
      <Ground mats={mats} />
      <group ref={spin} position={[0, 0.25, 0]} scale={1.9}>
        <Artifact slug={slug} mats={mats} />
      </group>
    </>
  )
}

/* ------------------------------------------------------------------- tree */

function TreeScene({ mats }: { mats: Mats }) {
  // Four boughs, one per skill group. Foliage is a cluster of small masses
  // rather than one big sphere — a single sphere on a stick reads as a lollipop,
  // and the ink shader only draws the silhouette, so the cluster's ragged
  // outline is what makes it register as leaves at all.
  const boughs = useMemo(
    () => [
      { yaw: -1.15, lean: 0.62, len: 2.5, crimson: false },
      { yaw: -0.38, lean: 0.3, len: 3.1, crimson: true },
      { yaw: 0.42, lean: -0.3, len: 3.0, crimson: false },
      { yaw: 1.2, lean: -0.6, len: 2.4, crimson: false },
    ],
    [],
  )

  const cluster = (crimson: boolean) => (
    <>
      <mesh material={crimson ? mats.crimson : mats.paper}>
        <sphereGeometry args={[0.5, 16, 12]} />
      </mesh>
      <mesh position={[0.42, 0.16, 0.1]} material={crimson ? mats.crimson : mats.paper}>
        <sphereGeometry args={[0.34, 14, 10]} />
      </mesh>
      <mesh position={[-0.36, 0.2, -0.08]} material={crimson ? mats.crimson : mats.tone}>
        <sphereGeometry args={[0.3, 14, 10]} />
      </mesh>
      <mesh position={[0.05, -0.3, 0.22]} material={mats.tone}>
        <sphereGeometry args={[0.26, 14, 10]} />
      </mesh>
    </>
  )

  return (
    <>
      <Ground mats={mats} />
      <Figure pose="point" position={[-2.9, -0.3, 1.4]} height={1.7} rotation={[0, 0.45, 0]} />
      <mesh position={[0, 0.2, 0]} material={mats.dim}>
        <cylinderGeometry args={[0.17, 0.36, 2.8, 14]} />
      </mesh>
      {boughs.map((bough, i) => (
        <group key={bough.yaw} rotation={[0, bough.yaw, 0]}>
          <group rotation={[0, 0, bough.lean]}>
            <mesh position={[0, 2.1, 0]} material={mats.dim}>
              <cylinderGeometry args={[0.055, 0.13, bough.len, 10]} />
            </mesh>
            <Drift amount={0.05} speed={0.38} phase={i * 1.6}>
              <group position={[0, 2.1 + bough.len * 0.55, 0]}>{cluster(bough.crimson)}</group>
            </Drift>
          </group>
        </group>
      ))}
      {/* roots — the side quests */}
      {[-1, 1].map((dir) => (
        <mesh
          key={dir}
          position={[dir * 0.62, -1.02, 0.2]}
          rotation={[0, 0, dir * 1.0]}
          material={mats.dim}
        >
          <cylinderGeometry args={[0.05, 0.11, 1.2, 8]} />
        </mesh>
      ))}
    </>
  )
}

/* ------------------------------------------------------------------- void */

function VoidScene({ mats }: { mats: Mats }) {
  return (
    <>
      <Ground mats={mats} />
      {[
        [-1.7, 0.6, -1.2, 0.4],
        [1.5, 0.1, -0.6, -0.3],
        [0.2, 1.2, -2.0, 0.16],
      ].map(([x, y, z, r], i) => (
        <Drift key={i} amount={0.1} speed={0.35} phase={i * 2}>
          <mesh position={[x, y, z]} rotation={[0.1, r, -0.08]} material={mats.paper}>
            <boxGeometry args={[1.3, 1.7, 0.05]} />
          </mesh>
        </Drift>
      ))}
    </>
  )
}

/* --------------------------------------------------------------- registry */

export function SceneFor({ sceneKey, pathname }: { sceneKey: SceneKey; pathname: string }) {
  const mats = useInk()

  switch (sceneKey) {
    case 'cover':
      return <CoverScene mats={mats} />
    case 'desk':
      return <DeskScene mats={mats} />
    case 'desk-closing':
      return <DeskScene mats={mats} closing />
    case 'workshop':
      return <WorkshopScene mats={mats} />
    case 'case':
      return <CaseScene mats={mats} />
    case 'artifact':
      return <ArtifactScene mats={mats} pathname={pathname} />
    case 'tree':
      return <TreeScene mats={mats} />
    case 'void':
    default:
      return <VoidScene mats={mats} />
  }
}
