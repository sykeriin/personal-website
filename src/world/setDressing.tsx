import * as THREE from 'three'

/**
 * The creative side's furniture, same assembly philosophy as props.tsx: parts
 * with jobs, materials passed in so the plate system stays intact.
 */

type PartMats = {
  paper: THREE.MeshToonMaterial
  dim: THREE.MeshToonMaterial
  tone: THREE.MeshToonMaterial
  accent: THREE.MeshToonMaterial
  hueA: THREE.MeshToonMaterial
  hueB: THREE.MeshToonMaterial
}

/** A photo-studio seamless: floor apron sweeping up into a wall of colour.
    Deliberately the biggest accent surface on the whole site. */
export function BackdropSweep({ mats }: { mats: PartMats }) {
  return (
    <group>
      <mesh position={[0, 3.2, -3.4]} material={mats.accent}>
        <boxGeometry args={[9, 9, 0.2]} />
      </mesh>
      {/* the curve of the sweep, faked with an angled apron */}
      <mesh position={[0, -0.9, -2.4]} rotation={[-1.22, 0, 0]} material={mats.accent}>
        <boxGeometry args={[9, 2.4, 0.16]} />
      </mesh>
      <mesh position={[0, -1.13, -0.6]} rotation={[-Math.PI / 2, 0, 0]} material={mats.accent}>
        <boxGeometry args={[9, 3.4, 0.1]} />
      </mesh>
    </group>
  )
}

/** Softbox on a stand, head tilted at the subject. The front face is paper —
    in this world a light IS a rectangle of blank page. */
export function Softbox({ mats }: { mats: PartMats }) {
  return (
    <group>
      {[0, 2.1, 4.2].map((a) => (
        <mesh
          key={a}
          position={[Math.sin(a) * 0.3, -0.85, Math.cos(a) * 0.3]}
          rotation={[0.28 * Math.cos(a), 0, -0.28 * Math.sin(a)]}
          material={mats.dim}
        >
          <cylinderGeometry args={[0.025, 0.025, 0.7, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 0.1, 0]} material={mats.dim}>
        <cylinderGeometry args={[0.035, 0.035, 2.2, 8]} />
      </mesh>
      <group position={[0, 1.25, 0.12]} rotation={[0.42, 0, 0]}>
        <mesh material={mats.dim}>
          <boxGeometry args={[1.15, 0.85, 0.4]} />
        </mesh>
        <mesh position={[0, 0, 0.21]} material={mats.paper}>
          <boxGeometry args={[1.0, 0.72, 0.02]} />
        </mesh>
      </group>
    </group>
  )
}

/** A cine camera on a tripod, lens on the subject. */
export function TripodCamera({ mats }: { mats: PartMats }) {
  return (
    <group>
      {[0.5, 2.6, 4.7].map((a) => (
        <mesh
          key={a}
          position={[Math.sin(a) * 0.42, -0.55, Math.cos(a) * 0.42]}
          rotation={[0.4 * Math.cos(a), 0, -0.4 * Math.sin(a)]}
          material={mats.dim}
        >
          <cylinderGeometry args={[0.03, 0.03, 1.15, 8]} />
        </mesh>
      ))}
      <group position={[0, 0.25, 0]}>
        <mesh material={mats.tone}>
          <boxGeometry args={[0.55, 0.42, 0.66]} />
        </mesh>
        <mesh position={[0, 0.02, 0.46]} rotation={[Math.PI / 2, 0, 0]} material={mats.dim}>
          <cylinderGeometry args={[0.13, 0.16, 0.34, 16]} />
        </mesh>
        <mesh position={[0, 0.08, -0.42]} rotation={[Math.PI / 2, 0, 0]} material={mats.dim}>
          <cylinderGeometry args={[0.06, 0.06, 0.2, 10]} />
        </mesh>
        <mesh position={[0, 0.32, 0]} material={mats.dim}>
          <boxGeometry args={[0.12, 0.12, 0.5]} />
        </mesh>
        {/* the tally light — one hot pixel of accent */}
        <mesh position={[0.2, 0.26, 0.34]} material={mats.accent}>
          <boxGeometry args={[0.06, 0.06, 0.06]} />
        </mesh>
      </group>
    </group>
  )
}

/** Clapperboard, jaws open mid-snap. Stripes on both sticks. */
export function Clapperboard({ mats }: { mats: PartMats }) {
  const stripes = (y: number, rot: number) => (
    <group position={[0, y, 0]} rotation={[0, 0, rot]}>
      <mesh material={mats.dim}>
        <boxGeometry args={[1.0, 0.14, 0.05]} />
      </mesh>
      {[-0.36, -0.12, 0.12, 0.36].map((x) => (
        <mesh key={x} position={[x, 0, 0.028]} rotation={[0, 0, 0.6]} material={mats.paper}>
          <boxGeometry args={[0.09, 0.15, 0.01]} />
        </mesh>
      ))}
    </group>
  )
  return (
    <group>
      <mesh position={[0, -0.34, 0]} material={mats.dim}>
        <boxGeometry args={[1.0, 0.62, 0.05]} />
      </mesh>
      {[0.1, -0.08, -0.26].map((y, i) => (
        <mesh key={y} position={[i === 2 ? -0.12 : -0.06, y - 0.2, 0.03]} material={mats.tone}>
          <boxGeometry args={[i === 2 ? 0.5 : 0.7, 0.05, 0.01]} />
        </mesh>
      ))}
      {stripes(0.04, 0)}
      {stripes(0.22, 0.28)}
    </group>
  )
}

/** Director's chair with the seat and back in the chapter's plate. */
export function DirectorChair({ mats }: { mats: PartMats }) {
  return (
    <group>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.42, 0, 0]}>
          <mesh rotation={[0.35, 0, 0]} material={mats.dim} position={[0, 0, 0.18]}>
            <boxGeometry args={[0.05, 1.45, 0.05]} />
          </mesh>
          <mesh rotation={[-0.35, 0, 0]} material={mats.dim} position={[0, 0, -0.18]}>
            <boxGeometry args={[0.05, 1.45, 0.05]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.42, 0]} material={mats.accent}>
        <boxGeometry args={[0.92, 0.06, 0.5]} />
      </mesh>
      <mesh position={[0, 1.05, -0.24]} material={mats.accent}>
        <boxGeometry args={[0.98, 0.3, 0.05]} />
      </mesh>
    </group>
  )
}

/** Corkboard of pinned storyboard frames, with the thread between pins. */
export function Storyboard({ mats }: { mats: PartMats }) {
  const cards: Array<[number, number, number]> = [
    [-1.25, 0.55, 0.04],
    [0, 0.6, -0.03],
    [1.25, 0.5, 0.05],
    [-1.2, -0.45, -0.05],
    [0.05, -0.5, 0.03],
    [1.3, -0.42, -0.04],
  ]
  return (
    <group>
      <mesh position={[0, 0, -0.06]} material={mats.dim}>
        <boxGeometry args={[4.44, 2.84, 0.08]} />
      </mesh>
      <mesh material={mats.tone}>
        <boxGeometry args={[4.2, 2.6, 0.1]} />
      </mesh>
      {cards.map(([x, y, r], i) => (
        <group key={`${x},${y}`} position={[x, y, 0.08]} rotation={[0, 0, r]}>
          <mesh material={mats.paper}>
            <boxGeometry args={[1.0, 0.72, 0.03]} />
          </mesh>
          {/* a sketch inside: horizon plus subject, varied per card */}
          <mesh position={[0, -0.12, 0.02]} material={mats.tone}>
            <boxGeometry args={[0.8, 0.035, 0.01]} />
          </mesh>
          <mesh
            position={[((i % 3) - 1) * 0.2, 0.08, 0.02]}
            material={i === 2 ? mats.accent : mats.tone}
          >
            <boxGeometry args={[0.16 + (i % 2) * 0.1, 0.2, 0.01]} />
          </mesh>
          <mesh position={[0, 0.3, 0.04]} material={mats.accent}>
            <sphereGeometry args={[0.035, 10, 8]} />
          </mesh>
        </group>
      ))}
      {/* the thread of the plan, pin to pin */}
      {cards.slice(0, -1).map(([x, y], i) => {
        const [nx, ny] = cards[i + 1]
        const dx = nx - x
        const dy = ny - y + 0.0001
        const len = Math.hypot(dx, dy)
        return (
          <mesh
            key={`thread-${x},${y}`}
            position={[(x + nx) / 2, (y + ny) / 2 + 0.3, 0.11]}
            rotation={[0, 0, Math.atan2(dy, dx)]}
            material={mats.accent}
          >
            <boxGeometry args={[len, 0.016, 0.01]} />
          </mesh>
        )
      })}
    </group>
  )
}

/** Guitar amp: cab, grille, knobs, and one accent pipe. */
export function Amp({ mats }: { mats: PartMats }) {
  return (
    <group>
      <mesh material={mats.dim}>
        <boxGeometry args={[1.15, 0.95, 0.6]} />
      </mesh>
      <mesh position={[0, -0.08, 0.31]} material={mats.tone}>
        <boxGeometry args={[0.95, 0.6, 0.02]} />
      </mesh>
      <mesh position={[0, 0.36, 0.31]} material={mats.paper}>
        <boxGeometry args={[0.95, 0.14, 0.02]} />
      </mesh>
      {[-0.3, -0.1, 0.1, 0.3].map((x) => (
        <mesh key={x} position={[x, 0.36, 0.34]} rotation={[Math.PI / 2, 0, 0]} material={mats.dim}>
          <cylinderGeometry args={[0.035, 0.035, 0.04, 10]} />
        </mesh>
      ))}
      <mesh position={[0, -0.42, 0.31]} material={mats.accent}>
        <boxGeometry args={[1.15, 0.06, 0.02]} />
      </mesh>
    </group>
  )
}

/** Mic on a boom, aimed where the player sits. */
export function MicStand({ mats }: { mats: PartMats }) {
  return (
    <group>
      <mesh position={[0, -1.02, 0]} material={mats.dim}>
        <cylinderGeometry args={[0.3, 0.34, 0.06, 16]} />
      </mesh>
      <mesh position={[0, -0.2, 0]} material={mats.dim}>
        <cylinderGeometry args={[0.028, 0.028, 1.6, 8]} />
      </mesh>
      <group position={[0, 0.6, 0]} rotation={[0, 0, -0.9]}>
        <mesh position={[0, 0.4, 0]} material={mats.dim}>
          <cylinderGeometry args={[0.022, 0.022, 0.9, 8]} />
        </mesh>
        <mesh position={[0, 0.9, 0]} material={mats.accent}>
          <capsuleGeometry args={[0.07, 0.16, 4, 10]} />
        </mesh>
      </group>
    </group>
  )
}

/** A framed print for the walls; the picture is tone unless given a hue. */
export function WallFrame({
  mats,
  picture = 'tone',
  w = 0.9,
  h = 1.2,
}: {
  mats: PartMats
  picture?: keyof PartMats
  w?: number
  h?: number
}) {
  return (
    <group>
      <mesh material={mats.dim}>
        <boxGeometry args={[w + 0.12, h + 0.12, 0.05]} />
      </mesh>
      <mesh position={[0, 0, 0.03]} material={mats[picture]}>
        <boxGeometry args={[w, h, 0.02]} />
      </mesh>
      {/* a bust silhouette so it reads as a portrait, not an abstract */}
      <mesh position={[0, -h * 0.18, 0.05]} material={mats.dim}>
        <sphereGeometry args={[w * 0.16, 12, 10]} />
      </mesh>
      <mesh position={[0, -h * 0.38, 0.05]} material={mats.dim}>
        <boxGeometry args={[w * 0.44, h * 0.24, 0.02]} />
      </mesh>
    </group>
  )
}
