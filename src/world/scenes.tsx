import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { projects } from '../data/content'
import type { InkPalette } from '../three/theme'
import { makeToonGradient } from '../three/toonGradient'
import type { SceneKey } from './manifest'
import { Figure } from './Figure'
import { Hotspot, InkShape } from './Ink'
import {
  bookCover,
  boltNut,
  chainLink,
  cloudPuff,
  envelope,
  guitarBody,
  inkDrop,
  laptop,
  leafCluster,
  monitor,
  mug,
  mugSteam,
  pawPrint,
  phoneSlab,
  roadSign,
  sealRing,
  speedBurst,
  spool,
  trunkProfile,
  viewfinder,
  waveform,
} from './shapes'

/**
 * One hero object per page, splash-page logic. The scenes that came before
 * this were many small props scattered with no focal point, and they read as
 * random shapes; a page is now ONE staged thing (or one gallery of things on
 * /projects), composed for the camera, with everything else as backdrop.
 *
 * Props are drawn 2D silhouettes extruded into solids, because the ink shader
 * draws each object's outline — identity lives in the silhouette, and a
 * silhouette authored as a drawing reads as one.
 *
 * Colour: heroes carry real colour in the beauty pass. Outside the visitor's
 * bloom the shader flattens any saturated surface to the chapter's single
 * plate, so the page reads as a two-ink print; inside the bloom the true hues
 * show through. Touching the world is what brings its colour to life.
 */

function useInk(palette: InkPalette) {
  const gradient = useMemo(() => makeToonGradient(3), [])
  return useMemo(() => {
    const make = (color: string | THREE.Color) =>
      new THREE.MeshToonMaterial({ color, gradientMap: gradient })

    // Companion hues for the chapter plate, derived rather than configured:
    // rotate the accent's hue either way and let the bloom reveal the family.
    const accent = new THREE.Color(palette.accent)
    const hsl = { h: 0, s: 0, l: 0 }
    accent.getHSL(hsl)
    const hueA = new THREE.Color().setHSL(
      (hsl.h + 0.09) % 1,
      Math.min(1, hsl.s * 0.95),
      Math.min(0.62, hsl.l + 0.12),
    )
    const hueB = new THREE.Color().setHSL(
      (hsl.h + 0.91) % 1,
      Math.min(1, hsl.s * 0.9),
      Math.min(0.58, hsl.l + 0.06),
    )

    return {
      paper: make(palette.paper),
      dim: make(palette.paperDim),
      tone: make(palette.tone),
      accent: make(accent),
      hueA: make(hueA),
      hueB: make(hueB),
    }
  }, [palette, gradient])
}

type Mats = ReturnType<typeof useInk>

/** Slow idle drift. The world is nearly still between slams — that stillness is
    what makes both the slam and the bloom land. */
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

function Ground({ mats }: { mats: Mats }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 0]} material={mats.dim}>
      <planeGeometry args={[80, 80]} />
    </mesh>
  )
}

const PLATES = import.meta.glob('../assets/ink/bg/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

function plateUrl(name: string): string | undefined {
  const key = Object.keys(PLATES).find((path) => path.includes(`/${name}.`))
  return key ? PLATES[key] : undefined
}

function Backdrop({ name, tint }: { name: string; tint?: THREE.Color }) {
  const url = plateUrl(name)
  if (!url) return null
  return <BackdropPlane url={url} tint={tint} />
}

function BackdropPlane({ url, tint }: { url: string; tint?: THREE.Color }) {
  const texture = useTexture(url)
  // The tinted wash is saturated where it is dark, so outside the bloom the
  // shader flattens it to the chapter plate — a soft-edged colour field — and
  // inside the bloom its true watercolour tint shows.
  const color = useMemo(() => {
    if (!tint) return new THREE.Color('#ffffff')
    const c = tint.clone()
    c.lerp(new THREE.Color('#ffffff'), 0.3)
    return c
  }, [tint])
  return (
    <mesh position={[0, 5.5, -22]}>
      <planeGeometry args={[74, 42]} />
      <meshBasicMaterial map={texture} color={color} toneMapped={false} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ cover */

function CoverScene({ mats, explore }: { mats: Mats; explore: boolean }) {
  const seal = useMemo(() => sealRing(), [])
  return (
    <>
      <Backdrop name="bg-wash-01" tint={mats.accent.color} />
      <Ground mats={mats} />

      <Hotspot id="cover-book" enabled={explore}>
        <Drift amount={0.05} speed={0.45}>
          <group rotation={[0.08, -0.5, 0.02]} position={[0.6, 0.35, 0]} scale={1.15}>
            <mesh position={[0.03, 0, 0]} material={mats.paper}>
              <boxGeometry args={[2.5, 3.5, 0.36]} />
            </mesh>
            {/* the front cover carries the chapter colour — flat plate outside
                the bloom, true hue inside it */}
            <mesh position={[0, 0, 0.21]} material={mats.accent}>
              <boxGeometry args={[2.62, 3.62, 0.07]} />
            </mesh>
            <mesh position={[0, 0, -0.2]} material={mats.dim}>
              <boxGeometry args={[2.62, 3.62, 0.06]} />
            </mesh>
            <mesh position={[-1.31, 0, 0]} material={mats.dim}>
              <boxGeometry args={[0.08, 3.62, 0.48]} />
            </mesh>
            {/* paper title block, like a tipped-in label */}
            <mesh position={[-0.1, 0.75, 0.27]} material={mats.paper}>
              <boxGeometry args={[1.9, 1.05, 0.05]} />
            </mesh>
            <InkShape
              shape={seal}
              depth={0.05}
              material={mats.hueA}
              position={[0.72, -1.15, 0.29]}
              rotation={[0, 0, -0.22]}
              scale={0.62}
            />
          </group>
        </Drift>
      </Hotspot>

      <Figure pose="idle" position={[-2.5, -0.3, 1.2]} height={1.7} rotation={[0, 0.35, 0]} />
    </>
  )
}

/* ------------------------------------------------------------------- desk */

/** The 2am desk, compact — one vignette, not a furniture catalogue. Each of
    the four origin panels lives on the prop that suits it. */
function DeskScene({ mats, explore }: { mats: Mats; explore: boolean }) {
  const shapes = useMemo(
    () => ({
      monitor: monitor(),
      laptop: laptop(),
      mug: mug(),
      steam: mugSteam(),
      guitar: guitarBody(),
      book: bookCover(),
    }),
    [],
  )
  return (
    <>
      <Backdrop name="bg-mist-01" tint={mats.accent.color} />
      <Ground mats={mats} />

      <group position={[0.4, -0.2, 0]} rotation={[0, -0.12, 0]}>
        {/* the desk island */}
        <mesh position={[0, -0.5, 0]} material={mats.dim}>
          <boxGeometry args={[5.2, 0.16, 2.3]} />
        </mesh>
        <mesh position={[-2.1, -1.0, 0]} material={mats.dim}>
          <boxGeometry args={[0.14, 0.9, 2.0]} />
        </mesh>
        <mesh position={[2.1, -1.0, 0]} material={mats.dim}>
          <boxGeometry args={[0.14, 0.9, 2.0]} />
        </mesh>

        {/* hi, i'm durva — the monitor, mid-build */}
        <Hotspot id="origin-0" enabled={explore}>
          <InkShape
            shape={shapes.monitor}
            depth={0.14}
            material={mats.paper}
            position={[-0.7, 0.45, -0.5]}
            scale={1.9}
          />
        </Hotspot>

        {/* what i'm into — the laptop beside it */}
        <Hotspot id="origin-1" enabled={explore}>
          <InkShape
            shape={shapes.laptop}
            depth={0.5}
            material={mats.hueA}
            position={[1.2, -0.18, 0.1]}
            rotation={[0, -0.5, 0]}
            scale={0.95}
          />
        </Hotspot>

        {/* school — the pile of books */}
        <Hotspot id="origin-2" enabled={explore}>
          <group position={[-2.0, -0.28, 0.55]}>
            <InkShape
              shape={shapes.book}
              depth={0.16}
              material={mats.hueB}
              rotation={[Math.PI / 2, 0, 0.15]}
              scale={0.85}
            />
            <InkShape
              shape={shapes.book}
              depth={0.16}
              material={mats.paper}
              position={[0.05, 0.17, 0]}
              rotation={[Math.PI / 2, 0, -0.1]}
              scale={0.85}
            />
          </group>
        </Hotspot>

        {/* outside class — the guitar against the desk */}
        <Hotspot id="origin-3" enabled={explore}>
          <InkShape
            shape={shapes.guitar}
            depth={0.22}
            material={mats.accent}
            position={[2.9, -0.6, 0.6]}
            rotation={[0, 0.35, 0.16]}
            scale={1.5}
          />
        </Hotspot>

        {/* the mug, set dressing — its steam rises on a slow drift */}
        <InkShape
          shape={shapes.mug}
          depth={0.3}
          material={mats.accent}
          position={[0.35, -0.22, 0.55]}
          scale={0.42}
        />
        <Drift amount={0.05} speed={0.7}>
          <InkShape
            shape={shapes.steam}
            depth={0.02}
            material={mats.tone}
            position={[0.35, 0.35, 0.55]}
            scale={0.5}
          />
        </Drift>
      </group>

      <Figure pose="sit" position={[-3.1, -0.32, 1.1]} height={1.5} rotation={[0, 0.5, 0]} />
    </>
  )
}

/* --------------------------------------------------------------- workshop */

function WorkshopScene({ mats, explore }: { mats: Mats; explore: boolean }) {
  const shapes = useMemo(
    () => ({ phone: phoneSlab(), paw: pawPrint(), bolt: boltNut(), finder: viewfinder() }),
    [],
  )
  return (
    <>
      <Backdrop name="bg-clouds-01" tint={mats.accent.color} />
      <Ground mats={mats} />

      {/* PetAlly: the phone held up big, a paw stamped on its screen */}
      <Hotspot id="exp-petally" enabled={explore}>
        <Drift amount={0.06} speed={0.5}>
          <group position={[-2.1, 0.5, 0]} rotation={[0, 0.35, -0.06]}>
            <InkShape shape={shapes.phone} depth={0.16} material={mats.paper} scale={2.6} />
            <InkShape
              shape={shapes.paw}
              depth={0.06}
              material={mats.accent}
              position={[0, 0.1, 0.16]}
              scale={1.1}
            />
          </group>
        </Drift>
      </Hotspot>

      {/* HAWKEYE: the runway wedge, the bolt that shouldn't be there, and the
          viewfinder that finds it */}
      <Hotspot id="exp-hawkeye" enabled={explore}>
        <group position={[2.2, -0.4, 0.2]} rotation={[0, -0.3, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0.06]} position={[0, -0.7, 0]} material={mats.tone}>
            <planeGeometry args={[3.4, 5.5]} />
          </mesh>
          <mesh
            position={[0, -0.68, 0.6]}
            rotation={[-Math.PI / 2, 0, 0.06]}
            material={mats.paper}
          >
            <planeGeometry args={[0.18, 1.2]} />
          </mesh>
          <InkShape
            shape={shapes.bolt}
            depth={0.18}
            material={mats.hueA}
            position={[0.6, -0.5, 0.9]}
            rotation={[0.4, 0.3, 0.2]}
            scale={0.55}
          />
          <Drift amount={0.07} speed={0.6} phase={1}>
            <InkShape
              shape={shapes.finder}
              depth={0.05}
              material={mats.accent}
              position={[0.6, 0.75, 0.9]}
              scale={1.35}
            />
          </Drift>
        </group>
      </Hotspot>

      <Figure pose="idle" position={[-4.2, -0.3, 1.4]} height={1.65} rotation={[0, 0.5, 0]} />
    </>
  )
}

/* ------------------------------------------------------------------- case */

const ARTIFACT_SHAPES: Record<string, () => THREE.Shape> = {
  alter: waveform,
  chainguard: chainLink,
  verdant: spool,
  cloudsense: cloudPuff,
  roadsense: roadSign,
}

function CaseArtifact({ slug, mats }: { slug: string; mats: Mats }) {
  const shape = useMemo(() => (ARTIFACT_SHAPES[slug] ?? inkDrop)(), [slug])
  const material =
    slug === 'chainguard'
      ? mats.accent
      : slug === 'verdant'
        ? mats.hueA
        : slug === 'alter'
          ? mats.hueB
          : mats.paper
  return <InkShape shape={shape} depth={0.2} material={material} scale={1.25} />
}

function CaseScene({ mats, explore }: { mats: Mats; explore: boolean }) {
  // An arc, not a row: left/right stays unambiguous but it doesn't read as a list.
  const RADIUS = 5.6
  return (
    <>
      <Backdrop name="bg-wash-02" tint={mats.accent.color} />
      <Ground mats={mats} />
      {projects.map((project, i) => {
        const t = (i - (projects.length - 1) / 2) / (projects.length - 1)
        const angle = t * 0.85
        const x = Math.sin(angle) * RADIUS
        const z = -Math.cos(angle) * RADIUS + RADIUS - 1.4
        return (
          <Hotspot key={project.slug} id={`proj-${project.slug}`} enabled={explore}>
            <group position={[x, 0, z]} rotation={[0, -angle, 0]}>
              <mesh position={[0, -0.95, 0]} material={mats.dim}>
                <boxGeometry args={[1.0, 0.34, 1.0]} />
              </mesh>
              <Drift amount={0.05} speed={0.5} phase={i * 1.3}>
                <group position={[0, 0.12, 0]}>
                  <CaseArtifact slug={project.slug} mats={mats} />
                </group>
              </Drift>
            </group>
          </Hotspot>
        )
      })}
      <Figure pose="guard" position={[-4.4, -0.3, 1.8]} height={1.7} rotation={[0, 0.5, 0]} />
    </>
  )
}

function ArtifactScene({
  mats,
  pathname,
  explore,
}: {
  mats: Mats
  pathname: string
  explore: boolean
}) {
  const slug = pathname.split('/').filter(Boolean)[1] ?? ''
  const shape = useMemo(() => (ARTIFACT_SHAPES[slug] ?? inkDrop)(), [slug])
  const spin = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (spin.current) spin.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.35
  })
  return (
    <>
      <Backdrop name="bg-wash-02" tint={mats.accent.color} />
      <Ground mats={mats} />
      <Hotspot id={`proj-${slug}`} enabled={explore}>
        <group ref={spin} position={[0.4, 0.35, 0]}>
          <InkShape shape={shape} depth={0.24} material={mats.accent} scale={2.6} />
        </group>
      </Hotspot>
    </>
  )
}

/* ------------------------------------------------------------------- tree */

function TreeScene({ mats, explore }: { mats: Mats; explore: boolean }) {
  const trunk = useMemo(() => trunkProfile(), [])
  const cluster = useMemo(() => leafCluster(), [])
  const seal = useMemo(() => sealRing(), [])

  const canopies: Array<{
    id: string
    pos: [number, number, number]
    scale: number
    mat: keyof Mats
  }> = [
    { id: 'skill-languages', pos: [-1.9, 2.5, 0.2], scale: 1.5, mat: 'paper' },
    { id: 'skill-aiml', pos: [-0.4, 3.4, -0.2], scale: 1.9, mat: 'accent' },
    { id: 'skill-frameworks', pos: [1.2, 3.0, 0.15], scale: 1.55, mat: 'hueA' },
    { id: 'skill-infra', pos: [2.3, 2.2, -0.1], scale: 1.3, mat: 'hueB' },
  ]

  return (
    <>
      <Backdrop name="bg-clouds-01" tint={mats.accent.color} />
      <Ground mats={mats} />

      <InkShape shape={trunk} depth={0.34} material={mats.dim} position={[0, 0.9, 0]} scale={4.2} />

      {canopies.map((canopy, i) => (
        <Hotspot key={canopy.id} id={canopy.id} enabled={explore}>
          <Drift amount={0.05} speed={0.38} phase={i * 1.6}>
            <InkShape
              shape={cluster}
              depth={0.16}
              material={mats[canopy.mat]}
              position={canopy.pos}
              scale={canopy.scale}
            />
          </Drift>
        </Hotspot>
      ))}

      {/* the ema plaque of stamps, hanging off the low bough */}
      <Hotspot id="skill-stamps" enabled={explore}>
        <group position={[3.1, 0.6, 0.4]}>
          <mesh position={[0, 0.55, 0]} material={mats.dim}>
            <boxGeometry args={[0.04, 1.0, 0.04]} />
          </mesh>
          <mesh material={mats.paper}>
            <boxGeometry args={[1.05, 0.75, 0.07]} />
          </mesh>
          <InkShape
            shape={seal}
            depth={0.04}
            material={mats.accent}
            position={[0, 0, 0.07]}
            scale={0.4}
          />
        </group>
      </Hotspot>

      <Figure pose="point" position={[-3.6, -0.3, 1.6]} height={1.7} rotation={[0, 0.45, 0]} />
    </>
  )
}

/* ---------------------------------------------------------------- closing */

function ClosingScene({ mats, explore }: { mats: Mats; explore: boolean }) {
  const shapes = useMemo(
    () => ({ env: envelope(), seal: sealRing(), guitar: guitarBody() }),
    [],
  )
  return (
    <>
      <Backdrop name="bg-mist-01" tint={mats.accent.color} />
      <Ground mats={mats} />

      {/* the letter, flap open, sealed in the chapter's ink */}
      <Hotspot id="contact-envelope" enabled={explore}>
        <Drift amount={0.06} speed={0.5}>
          <group position={[0.7, 0.5, 0]} rotation={[0.12, -0.25, -0.03]}>
            <InkShape shape={shapes.env} depth={0.12} material={mats.paper} scale={2.5} />
            <InkShape
              shape={shapes.seal}
              depth={0.05}
              material={mats.accent}
              position={[0, -0.25, 0.16]}
              scale={0.5}
            />
          </group>
        </Drift>
      </Hotspot>

      {/* off-panel: the guitar, leaning where the gloves used to hang */}
      <Hotspot id="contact-offpanel" enabled={explore}>
        <InkShape
          shape={shapes.guitar}
          depth={0.24}
          material={mats.hueA}
          position={[-2.6, -0.45, 0.7]}
          rotation={[0, 0.4, 0.18]}
          scale={1.7}
        />
      </Hotspot>

      <Figure pose="guitar" position={[-4.0, -0.35, 1.3]} height={1.4} rotation={[0, 0.5, 0]} />
    </>
  )
}

/* ------------------------------------------------------------------- void */

function VoidScene({ mats }: { mats: Mats }) {
  const drop = useMemo(() => inkDrop(), [])
  const burst = useMemo(() => speedBurst(), [])
  return (
    <>
      <Ground mats={mats} />
      <Drift amount={0.1} speed={0.35}>
        <InkShape
          shape={drop}
          depth={0.16}
          material={mats.accent}
          position={[0.4, 0.6, 0]}
          scale={1.6}
        />
      </Drift>
      <Drift amount={0.06} speed={0.45} phase={2}>
        <InkShape
          shape={burst}
          depth={0.04}
          material={mats.tone}
          position={[-2.2, 1.2, -2]}
          scale={2.2}
        />
      </Drift>
    </>
  )
}

/* --------------------------------------------------------------- registry */

export function SceneFor({
  sceneKey,
  pathname,
  palette,
  explore,
}: {
  sceneKey: SceneKey
  pathname: string
  palette: InkPalette
  explore: boolean
}) {
  const mats = useInk(palette)

  switch (sceneKey) {
    case 'cover':
      return <CoverScene mats={mats} explore={explore} />
    case 'desk':
      return <DeskScene mats={mats} explore={explore} />
    case 'desk-closing':
      return <ClosingScene mats={mats} explore={explore} />
    case 'workshop':
      return <WorkshopScene mats={mats} explore={explore} />
    case 'case':
      return <CaseScene mats={mats} explore={explore} />
    case 'artifact':
      return <ArtifactScene mats={mats} pathname={pathname} explore={explore} />
    case 'tree':
      return <TreeScene mats={mats} explore={explore} />
    case 'void':
    default:
      return <VoidScene mats={mats} />
  }
}
