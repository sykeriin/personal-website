import { Text, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import type { InkPalette } from '../three/theme'
import { makeToonGradient } from '../three/toonGradient'
import { notes } from '../content/notes'
import { PROJECT_ACCENTS, sideAccent, type SceneKey } from './manifest'
import { Figure } from './Figure'
import { FractalPlane } from './Fractal'
import { Book } from './BookCover'
import monoWoff from '@fontsource/space-mono/files/space-mono-latin-400-normal.woff?url'
import delaWoff from '@fontsource/anton/files/anton-latin-400-normal.woff?url'
import { Door, Hotspot, InkShape } from './Ink'
import { useHotspots } from './hotspots'
import { Envelope, Guitar, ScreenLines } from './props'
import {
  Amp,
  BackdropSweep,
  Clapperboard,
  DirectorChair,
  MicStand,
  Softbox,
  Storyboard,
  TripodCamera,
  WallFrame,
} from './setDressing'
import {
  bookCover,
  chainLink,
  cloudPuff,
  inkDrop,
  laptop,
  leafCluster,
  monitor,
  mug,
  mugSteam,
  fighterJet,
  pawPrint,
  roadSign,
  sealRing,
  speedBurst,
  spool,
  trunkProfile,
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
    // toneMapped false: the composite pass IS the look; ACES in the beauty
    // pass only skews channel ratios, and the two-plate selector reads ratios.
    const make = (color: string | THREE.Color) =>
      new THREE.MeshToonMaterial({ color, gradientMap: gradient, toneMapped: false })

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
      // Full-saturation magenta: the shader's second plate (fork-only) picks
      // it up by blue fraction, so cover B prints in its own ink.
      coverB: make(sideAccent.creative),
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
    // Brighten by SCALING, never by lerping to white: a lerp raises the blue
    // fraction and the crimson sky kept crossing the plate-B selector and
    // printing magenta. Scaling preserves channel ratios exactly.
    c.multiplyScalar(1.35)
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

function CoverScene({ mats }: { mats: Mats }) {
  const seal = useMemo(() => sealRing(), [])
  // Whichever side you were last reading stands upright; the other lies the
  // tête-bêche way, upside down, waiting for the flip. Fresh visitors get tech.
  const upSide = useMemo<'tech' | 'creative'>(() => {
    try {
      return localStorage.getItem('inkwell-side') === 'creative' ? 'creative' : 'tech'
    } catch {
      return 'tech'
    }
  }, [])
  return (
    <>
      <Backdrop name="bg-wash-01" tint={mats.accent.color} />
      <Ground mats={mats} />

      {/* Cover A: the tech story, right side up. */}
      <Door to="/origin">
        <Drift amount={0.05} speed={0.45}>
          <group
            rotation={[0.08, -0.42, upSide === 'tech' ? 0.02 : Math.PI]}
            position={[-1.55, 0.42, 0.2]}
            scale={0.9}
          >
            <Book
              mats={mats}
              cover={mats.accent}
              word="tech"
              volume="vol. 02 · cover a"
              obi="apps · agents · pipelines"
            >
              <InkShape
                shape={seal}
                depth={0.05}
                material={mats.hueA}
                position={[0.85, -1.5, 0.29]}
                rotation={[0, 0, -0.22]}
                scale={0.5}
              />
            </Book>
          </group>
        </Drift>
      </Door>

      {/* Cover B: the creative story — upside down, exactly as a tête-bêche
          volume prints the second front. The visitor's first "wait, what?" */}
      <Door to="/studio">
        <Drift amount={0.05} speed={0.4} phase={1.9}>
          <group
            rotation={[0.08, 0.38, upSide === 'creative' ? 0.0 : Math.PI]}
            position={[1.95, 0.47, 0.1]}
            scale={0.9}
          >
            <Book
              mats={mats}
              cover={mats.coverB}
              word="creative"
              volume="vol. 02 · cover b"
              obi="modelling · shoots · design"
            />
          </group>
        </Drift>
      </Door>

      <Figure pose="idle" position={[-3.05, -0.3, 1.4]} height={1.7} rotation={[0, 0.4, 0]} />
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
        <mesh position={[0, -0.5, 0]} material={mats.paper}>
          <boxGeometry args={[5.2, 0.22, 2.3]} />
        </mesh>
        <mesh position={[-2.1, -1.0, 0]} material={mats.dim}>
          <boxGeometry args={[0.14, 0.9, 2.0]} />
        </mesh>
        <mesh position={[2.1, -1.0, 0]} material={mats.dim}>
          <boxGeometry args={[0.14, 0.9, 2.0]} />
        </mesh>

        {/* hi, i'm durva — the monitor, mid-build, code on screen */}
        <Hotspot id="origin-0" enabled={explore}>
          <group position={[-0.7, 0.45, -0.5]} rotation={[0, 0.16, 0]}>
            <InkShape shape={shapes.monitor} depth={0.3} material={mats.paper} scale={1.9} />
            <group position={[0, 0.28, 0.18]} scale={1.35}>
              <ScreenLines mats={mats} />
            </group>
          </group>
        </Hotspot>

        {/* what i'm into — the laptop beside it */}
        <Hotspot id="origin-1" enabled={explore}>
          <InkShape
            shape={shapes.laptop}
            depth={0.5}
            material={mats.hueA}
            position={[1.25, -0.18, 0.15]}
            rotation={[0, -1.05, 0]}
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

        {/* outside class — the guitar leaning on the desk's end */}
        <Hotspot id="origin-3" enabled={explore}>
          <group position={[3.5, -0.35, 0.7]} rotation={[0.02, 0.3, 0.2]} scale={0.95}>
            <Guitar mats={mats} body="accent" />
          </group>
        </Hotspot>

        {/* the mug, set dressing — its steam rises on a slow drift */}
        <InkShape
          shape={shapes.mug}
          depth={0.55}
          material={mats.accent}
          position={[0.35, -0.22, 0.55]}
          scale={0.42}
        />
        <Drift amount={0.05} speed={0.7}>
          <InkShape
            shape={shapes.steam}
            depth={0.04}
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

/**
 * The Training Arc is a muay thai gym. Each experience hangs as a heavy bag:
 * hit one (click) and it opens — and swings, because a bag that doesn't move
 * when struck is a wall. His figure stands in guard, mid-session.
 */
function HeavyBag({
  mats,
  active,
  sticker,
}: {
  mats: Mats
  active: boolean
  sticker?: ReactNode
}) {
  const swing = useRef<THREE.Group>(null)
  const hitAt = useRef<number | null>(null)
  const wasActive = useRef(false)

  useFrame((state) => {
    if (active && !wasActive.current) hitAt.current = state.clock.elapsedTime
    wasActive.current = active
    if (!swing.current) return
    if (hitAt.current === null) return
    const t = state.clock.elapsedTime - hitAt.current
    // A damped pendulum, hit hard: one big swing, settling in ~3 seconds.
    swing.current.rotation.z = Math.sin(t * 6.4) * 0.42 * Math.exp(-t * 1.5)
    swing.current.rotation.x = Math.sin(t * 4.9 + 0.7) * 0.14 * Math.exp(-t * 1.7)
  })

  return (
    <group ref={swing}>
      <mesh position={[0, -0.3, 0]} material={mats.dim}>
        <cylinderGeometry args={[0.035, 0.035, 0.6, 8]} />
      </mesh>
      <mesh position={[0, -1.35, 0]} material={mats.tone}>
        <capsuleGeometry args={[0.42, 1.15, 6, 18]} />
      </mesh>
      <mesh position={[0, -0.72, 0]} material={mats.dim}>
        <cylinderGeometry args={[0.43, 0.4, 0.22, 18]} />
      </mesh>
      <mesh position={[0, -1.98, 0]} material={mats.dim}>
        <cylinderGeometry args={[0.4, 0.43, 0.22, 18]} />
      </mesh>
      <mesh position={[0, -1.2, 0]} material={mats.accent}>
        <cylinderGeometry args={[0.435, 0.435, 0.3, 18]} />
      </mesh>
      {sticker}
    </group>
  )
}

function WorkshopScene({ mats, explore }: { mats: Mats; explore: boolean }) {
  const paw = useMemo(() => pawPrint(), [])
  const jet = useMemo(() => fighterJet(), [])
  const { active } = useHotspots()

  return (
    <>
      <Ground mats={mats} />

      {/* the gym: back wall, wall pads, floor mat */}
      <mesh position={[0, 1.8, -3.8]} material={mats.paper}>
        <boxGeometry args={[13, 7.5, 0.2]} />
      </mesh>
      {[-4.4, -3.1, -1.8].map((x) => (
        <mesh key={x} position={[x, 1.15, -3.65]} material={mats.accent}>
          <boxGeometry args={[1.1, 2.4, 0.12]} />
        </mesh>
      ))}
      <mesh position={[0.6, -1.09, 0.2]} rotation={[0, 0.06, 0]} material={mats.accent}>
        <boxGeometry args={[7.2, 0.08, 4.6]} />
      </mesh>
      <mesh position={[0.6, -1.05, 0.2]} rotation={[0, 0.06, 0]} material={mats.tone}>
        <boxGeometry args={[6.4, 0.08, 3.9]} />
      </mesh>

      {/* the rig the bags hang from */}
      <mesh position={[0.8, 2.62, -0.4]} material={mats.dim}>
        <boxGeometry args={[5.6, 0.2, 0.26]} />
      </mesh>
      {[-1.9, 3.5].map((x) => (
        <mesh key={x} position={[x, 0.75, -0.4]} material={mats.dim}>
          <boxGeometry args={[0.18, 3.95, 0.18]} />
        </mesh>
      ))}

      {/* one bag per experience: hit it to open it */}
      <Hotspot id="exp-petally" enabled={explore}>
        <group position={[-0.4, 2.5, -0.4]}>
          <HeavyBag
            mats={mats}
            active={active === 'exp-petally'}
            sticker={
              <InkShape
                shape={paw}
                depth={0.03}
                material={mats.hueA}
                position={[0, -1.55, 0.42]}
                scale={0.42}
              />
            }
          />
        </group>
      </Hotspot>
      <Hotspot id="exp-hawkeye" enabled={explore}>
        <group position={[2.0, 2.5, -0.4]}>
          <HeavyBag
            mats={mats}
            active={active === 'exp-hawkeye'}
            sticker={
              <InkShape
                shape={jet}
                depth={0.04}
                material={mats.hueB}
                position={[0, -1.55, 0.46]}
                rotation={[0, 0, 0.18]}
                scale={0.34}
              />
            }
          />
        </group>
      </Hotspot>

      {/* the window onto the airfield: the IAF runway this chapter is about,
          with a jet climbing past mid-takeoff */}
      <group position={[3.9, 2.4, -3.68]}>
        <mesh material={mats.dim}>
          <boxGeometry args={[2.7, 1.75, 0.1]} />
        </mesh>
        <mesh position={[0, 0, 0.04]} material={mats.paper}>
          <boxGeometry args={[2.45, 1.5, 0.04]} />
        </mesh>
        <mesh position={[0.1, -0.52, 0.08]} rotation={[0, 0, -0.04]} material={mats.tone}>
          <boxGeometry args={[2.3, 0.3, 0.02]} />
        </mesh>
        {[-0.7, 0, 0.7].map((x) => (
          <mesh key={x} position={[x + 0.1, -0.52, 0.1]} material={mats.paper}>
            <boxGeometry args={[0.3, 0.05, 0.01]} />
          </mesh>
        ))}
        <Drift amount={0.05} speed={0.7}>
          <group position={[-0.25, 0.22, 0.12]} rotation={[0, 0, 0.34]} scale={0.62}>
            <InkShape shape={jet} depth={0.05} material={mats.dim} />
            <mesh position={[-0.28, 0.12, 0.04]} material={mats.accent}>
              <boxGeometry args={[0.16, 0.07, 0.02]} />
            </mesh>
            <mesh position={[0.15, -0.02, 0.05]} rotation={[0, 0, -0.06]} material={mats.tone}>
              <boxGeometry args={[0.62, 0.05, 0.02]} />
            </mesh>
            {[0.75, 1.05, 1.3].map((x, i) => (
              <mesh key={x} position={[x, -0.14 - i * 0.05, 0.02]} material={mats.paper}>
                <boxGeometry args={[0.22 - i * 0.05, 0.05, 0.01]} />
              </mesh>
            ))}
          </group>
        </Drift>
      </group>

      {/* him, in guard, mid-session */}
      <Figure pose="guard" position={[-2.6, -0.28, 1.3]} height={1.7} rotation={[0, 0.55, 0]} />

      {/* corner clutter: water bottle and a kick pad against the post */}
      <mesh position={[-2.15, -0.88, -0.1]} material={mats.hueA}>
        <cylinderGeometry args={[0.09, 0.09, 0.42, 12]} />
      </mesh>
      <mesh position={[3.75, -0.62, 0.3]} rotation={[0.15, 0.3, -0.35]} material={mats.hueB}>
        <boxGeometry args={[0.5, 1.05, 0.22]} />
      </mesh>
    </>
  )
}

/* ------------------------------------------------------------------ shelf */

/** A filler book on the shelf: spine out, plate-family colours. */
function Spine({
  mats,
  material,
  h,
  lean = 0,
}: {
  mats: Mats
  material: THREE.MeshToonMaterial
  h: number
  lean?: number
}) {
  return (
    <group rotation={[0, 0, lean]}>
      <mesh position={[0, h / 2, 0]} material={material}>
        <boxGeometry args={[0.16, h, 0.62]} />
      </mesh>
      <mesh position={[0, h - 0.09, 0]} material={mats.paper}>
        <boxGeometry args={[0.17, 0.05, 0.63]} />
      </mesh>
      <mesh position={[0, 0.12, 0]} material={mats.paper}>
        <boxGeometry args={[0.17, 0.05, 0.63]} />
      </mesh>
    </group>
  )
}

/** A project as a volume: its plate colour, its name down the spine. */
function ProjectBook({
  mats,
  material,
  title,
  h,
  lean = 0,
}: {
  mats: Mats
  material: THREE.MeshToonMaterial
  title: string
  h: number
  lean?: number
}) {
  return (
    <group rotation={[0, 0, lean]}>
      <mesh position={[0, h / 2, 0]} material={material}>
        <boxGeometry args={[0.3, h, 0.7]} />
      </mesh>
      {/* head and tail bands */}
      <mesh position={[0, h - 0.07, 0]} material={mats.paper}>
        <boxGeometry args={[0.31, 0.06, 0.71]} />
      </mesh>
      <mesh position={[0, 0.1, 0]} material={mats.paper}>
        <boxGeometry args={[0.31, 0.06, 0.71]} />
      </mesh>
      {/* the name, reading down the spine */}
      <Text
        font={monoWoff}
        fontSize={0.11}
        color="#f7f6f3"
        anchorX="center"
        anchorY="middle"
        position={[0, h / 2, 0.36]}
        rotation={[0, 0, -Math.PI / 2]}
        letterSpacing={0.08}
        maxWidth={h - 0.3}
      >
        {title}
      </Text>
    </group>
  )
}

/** The first-place cup — tap it for the podium list. */
function Trophy({ mats }: { mats: Mats }) {
  return (
    <group>
      <mesh position={[0, 0.09, 0]} material={mats.dim}>
        <boxGeometry args={[0.5, 0.18, 0.5]} />
      </mesh>
      <mesh position={[0, 0.28, 0]} material={mats.accent}>
        <cylinderGeometry args={[0.06, 0.09, 0.22, 12]} />
      </mesh>
      <mesh position={[0, 0.62, 0]} material={mats.accent}>
        <cylinderGeometry args={[0.3, 0.14, 0.52, 16]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.36, 0.68, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          material={mats.accent}
        >
          <torusGeometry args={[0.12, 0.035, 8, 16]} />
        </mesh>
      ))}
      <mesh position={[0, 0.2, 0.26]} material={mats.paper}>
        <boxGeometry args={[0.3, 0.1, 0.02]} />
      </mesh>
    </group>
  )
}

/**
 * The projects live on a bookshelf — every project is a BOOK in its own plate
 * colour with its name down the spine; tap one to take it off the shelf. The
 * trophy is the mantle: podium finishes only.
 */
function CaseScene({ mats, explore }: { mats: Mats; explore: boolean }) {
  const bookMats = useMemo(() => {
    const gradient = makeToonGradient(3)
    return Object.fromEntries(
      Object.entries(PROJECT_ACCENTS).map(([slug, hex]) => [
        slug,
        new THREE.MeshToonMaterial({ color: hex, gradientMap: gradient }),
      ]),
    ) as Record<string, THREE.MeshToonMaterial>
  }, [])

  const shelfBooks: Array<{ slug: string; title: string; h: number; x: number; lean?: number }> = [
    { slug: 'alter', title: 'alter', h: 1.3, x: -2.0 },
    { slug: 'chainguard', title: 'chainguard', h: 1.45, x: -1.62, lean: 0.0 },
    { slug: 'verdant', title: 'verdant', h: 1.2, x: -1.28, lean: -0.12 },
  ]
  const lowerBooks: Array<{ slug: string; title: string; h: number; x: number; lean?: number }> = [
    { slug: 'cloudsense', title: 'cloudsense', h: 1.35, x: -0.6 },
    { slug: 'roadsense', title: 'roadsense', h: 1.25, x: -0.22, lean: 0.1 },
  ]

  return (
    <>
      <Ground mats={mats} />

      {/* the room the shelf lives in */}
      <mesh position={[0, 1.8, -2.6]} material={mats.paper}>
        <boxGeometry args={[13, 7.5, 0.2]} />
      </mesh>

      <group position={[0.2, -0.27, -1.7]} scale={0.8}>
        {/* the bookcase */}
        <mesh position={[0, 1.05, -0.35]} material={mats.dim}>
          <boxGeometry args={[5.4, 4.5, 0.1]} />
        </mesh>
        {[-2.7, 2.7].map((x) => (
          <mesh key={x} position={[x, 1.05, 0]} material={mats.dim}>
            <boxGeometry args={[0.14, 4.5, 0.85]} />
          </mesh>
        ))}
        {[-1.1, 0.62, 2.34].map((y) => (
          <mesh key={y} position={[0, y, 0]} material={mats.dim}>
            <boxGeometry args={[5.4, 0.12, 0.85]} />
          </mesh>
        ))}

        {/* top shelf: three volumes and some company */}
        {shelfBooks.map((book) => (
          <Hotspot key={book.slug} id={`proj-${book.slug}`} enabled={explore}>
            <group position={[book.x, 0.68, 0]}>
              <ProjectBook
                mats={mats}
                material={bookMats[book.slug]}
                title={book.title}
                h={book.h}
                lean={book.lean}
              />
            </group>
          </Hotspot>
        ))}
        <group position={[-0.85, 0.68, 0]}>
          <Spine mats={mats} material={mats.tone} h={1.0} lean={-0.16} />
        </group>
        <group position={[-0.55, 0.68, 0]}>
          <Spine mats={mats} material={mats.dim} h={1.1} />
        </group>

        {/* the mantle: the cup, podium finishes only */}
        <Hotspot id="shelf-trophy" enabled={explore}>
          <group position={[1.5, 0.68, 0]} scale={1.2}>
            <Trophy mats={mats} />
          </group>
        </Hotspot>

        {/* bottom shelf: two volumes leaning into fillers */}
        {lowerBooks.map((book) => (
          <Hotspot key={book.slug} id={`proj-${book.slug}`} enabled={explore}>
            <group position={[book.x, -1.04, 0]}>
              <ProjectBook
                mats={mats}
                material={bookMats[book.slug]}
                title={book.title}
                h={book.h}
                lean={book.lean}
              />
            </group>
          </Hotspot>
        ))}
        {[
          [-2.3, 1.2, 0],
          [-2.05, 1.35, 0],
          [0.55, 1.05, -0.14],
          [0.85, 0.9, 0],
          [1.6, 1.15, 0.12],
          [2.3, 1.0, 0],
        ].map(([x, h, lean]) => (
          <group key={x} position={[x, -1.04, 0]}>
            <Spine
              mats={mats}
              material={[mats.tone, mats.dim, mats.hueA, mats.hueB][Math.abs(Math.round(x * 7)) % 4]}
              h={h}
              lean={lean}
            />
          </group>
        ))}
      </group>

      {/* him, browsing */}
      <Figure pose="point" position={[-3.6, -0.3, 0.9]} height={1.7} rotation={[0, 0.5, 0]} />
    </>
  )
}

/** Which drawn silhouette each project holds up on its own page. */
const ARTIFACT_SHAPES: Record<string, () => THREE.Shape> = {
  alter: waveform,
  chainguard: chainLink,
  verdant: spool,
  cloudsense: cloudPuff,
  roadsense: roadSign,
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
      <Hotspot id={`story-${slug}`} enabled={explore}>
        <group ref={spin} position={[0.4, 0.35, 0]}>
          <InkShape shape={shape} depth={0.4} material={mats.accent} scale={2.6} />
        </group>
      </Hotspot>
    </>
  )
}

/* ------------------------------------------------------------------- tree */

function TreeScene({ mats, explore, frozen }: { mats: Mats; explore: boolean; frozen: boolean }) {
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
      <FractalPlane frozen={frozen} />
      <Ground mats={mats} />

      <InkShape shape={trunk} depth={0.55} material={mats.dim} position={[0, 0.9, 0]} scale={4.2} />

      {canopies.map((canopy, i) => (
        <Hotspot key={canopy.id} id={canopy.id} enabled={explore}>
          <Drift amount={0.05} speed={0.38} phase={i * 1.6}>
            <InkShape
              shape={cluster}
              depth={0.34}
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
  return (
    <>
      <Backdrop name="bg-mist-01" tint={mats.accent.color} />
      <Ground mats={mats} />

      {/* the letter, flap open, half out of its envelope, facing the reader */}
      <Hotspot id="contact-envelope" enabled={explore}>
        <Drift amount={0.06} speed={0.5}>
          <group position={[0.9, 0.55, 0]} rotation={[0.08, -0.14, -0.02]} scale={1.55}>
            <Envelope mats={mats} />
          </group>
        </Drift>
      </Hotspot>

      {/* off-panel: the whole guitar, leaning into frame */}
      <Hotspot id="contact-offpanel" enabled={explore}>
        <group position={[-2.7, -0.15, 0.6]} rotation={[0.02, 0.18, 0.16]}>
          <Guitar mats={mats} body="hueA" />
        </group>
      </Hotspot>

      <Figure pose="guitar" position={[-4.0, -0.35, 1.3]} height={1.4} rotation={[0, 0.5, 0]} />
    </>
  )
}

/* ------------------------------------------------------------------- void */

function VoidScene({ mats, frozen }: { mats: Mats; frozen: boolean }) {
  const drop = useMemo(() => inkDrop(), [])
  const burst = useMemo(() => speedBurst(), [])
  return (
    <>
      <FractalPlane frozen={frozen} position={[0, 3, -14]} width={38} height={22} />
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


/* ---------------------------------------------------------- creative side */

/**
 * Cover B. These three are SCENES in the staging sense: a room, layered depth
 * (a flanking foreground prop, a midground subject, a wall with a life on it),
 * and the figure doing the thing — not objects arranged on a floor.
 */

function StudioScene({ mats, explore }: { mats: Mats; explore: boolean }) {
  return (
    <>
      <Ground mats={mats} />

      {/* the seamless — the largest colour surface on the site, on purpose */}
      <Hotspot id="studio-modelling" enabled={explore}>
        <group position={[0.4, 0, -0.6]}>
          <BackdropSweep mats={mats} />
          {/* him, on it. the model half. */}
          <Figure pose="idle" position={[0.3, -0.22, -0.7]} height={1.75} />
        </group>
      </Hotspot>

      {/* the working side of the room */}
      <group position={[-2.9, 0, 1.5]} rotation={[0, 0.5, 0]}>
        <Softbox mats={mats} />
      </group>
      <Hotspot id="studio-shoots" enabled={explore}>
        <group position={[2.5, 0, 2.0]} rotation={[0, -2.55, 0]}>
          <TripodCamera mats={mats} />
        </group>
      </Hotspot>

      {/* contact-sheet wall, camera left */}
      <group position={[-4.7, 1.3, -1.0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0.2, -0.1]} material={mats.paper}>
          <boxGeometry args={[7, 6, 0.2]} />
        </mesh>
        {[-1.3, 0, 1.3].map((z, i) => (
          <group key={z} position={[z, 0.35, 0.08]} rotation={[0, 0, i === 1 ? 0.03 : -0.02]}>
            <WallFrame mats={mats} picture={i === 1 ? 'hueA' : 'tone'} w={0.85} h={1.15} />
          </group>
        ))}
      </group>

      {/* set clutter: apple box and a taped-down cable run */}
      <mesh position={[1.5, -0.98, 0.7]} material={mats.paper}>
        <boxGeometry args={[0.55, 0.34, 0.4]} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[2.4 - i * 0.55, -1.12, 2.5 - i * 0.28]}
          rotation={[-Math.PI / 2, 0, 0.5 + i * 0.35]}
          material={mats.dim}
        >
          <boxGeometry args={[0.6, 0.05, 0.02]} />
        </mesh>
      ))}
    </>
  )
}

function DirectionScene({ mats, explore }: { mats: Mats; explore: boolean }) {
  const laptopShape = useMemo(() => laptop(), [])
  return (
    <>
      <Ground mats={mats} />

      {/* the wall the plan lives on, with a plate-coloured feature panel */}
      <mesh position={[0, 1.6, -3.6]} material={mats.paper}>
        <boxGeometry args={[12, 7, 0.2]} />
      </mesh>
      <mesh position={[-0.2, 1.5, -3.45]} material={mats.accent}>
        <boxGeometry args={[5.6, 3.6, 0.06]} />
      </mesh>
      <Hotspot id="direction-video" enabled={explore}>
        <group position={[-0.2, 1.5, -3.3]}>
          <Storyboard mats={mats} />
        </group>
      </Hotspot>

      {/* the director's corner */}
      <group position={[-2.6, -0.4, 0.6]} rotation={[0, 0.45, 0]}>
        <DirectorChair mats={mats} />
      </group>
      <group position={[-1.55, -0.75, 1.3]} rotation={[0.1, 0.7, 0.55]}>
        <Clapperboard mats={mats} />
      </group>

      {/* the design desk: laptop showing work-in-progress */}
      <Hotspot id="direction-webdesign" enabled={explore}>
        <group position={[2.5, -0.3, 0.4]} rotation={[0, -0.35, 0]}>
          <mesh position={[0, -0.32, 0]} material={mats.dim}>
            <boxGeometry args={[1.7, 0.08, 1.0]} />
          </mesh>
          {[-0.7, 0.7].map((x) => (
            <mesh key={x} position={[x, -0.85, 0]} material={mats.dim}>
              <boxGeometry args={[0.08, 1.0, 0.08]} />
            </mesh>
          ))}
          <InkShape
            shape={laptopShape}
            depth={0.5}
            material={mats.hueB}
            position={[0, 0.05, 0]}
            rotation={[0, -1.05, 0]}
            scale={0.8}
          />
        </group>
      </Hotspot>

      {/* him, pitching the board */}
      <Figure pose="point" position={[1.0, -0.3, -1.6]} height={1.7} rotation={[0, -0.4, 0]} />

      <mesh position={[-1.8, -1.12, 0.8]} material={mats.tone}>
        <cylinderGeometry args={[1.5, 1.5, 0.04, 24]} />
      </mesh>
    </>
  )
}

function SessionScene({ mats, explore }: { mats: Mats; explore: boolean }) {
  return (
    <>
      <Ground mats={mats} />

      {/* the corner of the room where the amp lives */}
      <mesh position={[0, 1.6, -3.8]} material={mats.paper}>
        <boxGeometry args={[12, 7, 0.2]} />
      </mesh>
      <mesh position={[-4.9, 1.6, -0.4]} rotation={[0, Math.PI / 2, 0]} material={mats.dim}>
        <boxGeometry args={[7, 7, 0.2]} />
      </mesh>

      {/* posters over the amp — gig-print colour, not framed politeness */}
      <group position={[-1.7, 2.0, -3.65]} rotation={[0, 0, 0.03]}>
        <WallFrame mats={mats} picture="accent" w={1.1} h={1.5} />
      </group>
      <group position={[0.4, 1.7, -3.65]} rotation={[0, 0, -0.04]}>
        <WallFrame mats={mats} picture="hueA" w={0.9} h={1.2} />
      </group>
      <group position={[2.0, 2.1, -3.65]} rotation={[0, 0, 0.05]}>
        <WallFrame mats={mats} picture="hueB" w={0.8} h={1.05} />
      </group>

      {/* the rug that holds the session together */}
      <mesh position={[0.3, -1.11, 0.4]} material={mats.accent}>
        <cylinderGeometry args={[2.3, 2.3, 0.04, 28]} />
      </mesh>

      <Hotspot id="session-guitar" enabled={explore}>
        <group>
          <group position={[-1.9, -0.62, -0.4]} rotation={[0, 0.35, 0]}>
            <Amp mats={mats} />
          </group>
          {/* guitar resting on its stand, human-sized */}
          <group position={[1.5, -0.55, 0.15]} rotation={[0.06, -0.3, 0.12]} scale={0.75}>
            <Guitar mats={mats} body="accent" />
            {[-1, 1].map((side) => (
              <mesh
                key={side}
                position={[side * 0.3, -0.55, 0.25]}
                rotation={[0.5, 0, side * 0.5]}
                material={mats.dim}
              >
                <boxGeometry args={[0.05, 1.0, 0.05]} />
              </mesh>
            ))}
          </group>
          {/* the cable, lazily coiled amp-to-guitar */}
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh
              key={i}
              position={[-1.4 + i * 0.5, -1.06, 0.35 + Math.sin(i * 1.8) * 0.3]}
              rotation={[-Math.PI / 2, 0, i * 0.9]}
              material={mats.dim}
            >
              <boxGeometry args={[0.55, 0.04, 0.02]} />
            </mesh>
          ))}
        </group>
      </Hotspot>

      {/* the open mic — the "make something with me" invitation */}
      <Hotspot id="session-collab" enabled={explore}>
        <group position={[2.6, 0, 1.2]} rotation={[0, -0.4, 0]}>
          <MicStand mats={mats} />
        </group>
      </Hotspot>

      {/* him, mid-session */}
      <Figure pose="guitar" position={[-0.35, -0.32, 1.15]} height={1.5} rotation={[0, -0.2, 0]} />
    </>
  )
}


/** The photo insert's room: a gallery wall of hung prints. The frames hold
    tone until real photographs land in src/assets/photos/shoots. */
function PrintsScene({ mats }: { mats: Mats }) {
  const frames: Array<[number, number, number, number, 'tone' | 'accent' | 'hueA' | 'hueB']> = [
    [-2.6, 1.9, 0.02, 1.05, 'tone'],
    [-0.9, 1.6, -0.03, 1.35, 'accent'],
    [0.9, 2.0, 0.04, 0.95, 'hueA'],
    [2.5, 1.5, -0.02, 1.2, 'tone'],
    [-1.8, 0.1, 0.03, 0.85, 'hueB'],
    [1.7, 0.2, -0.04, 1.0, 'tone'],
  ]
  return (
    <>
      <Ground mats={mats} />
      <mesh position={[0, 1.8, -3.4]} material={mats.paper}>
        <boxGeometry args={[13, 7.5, 0.2]} />
      </mesh>
      {frames.map(([x, y, r, sc, pic]) => (
        <group key={`${x},${y}`} position={[x, y, -3.25]} rotation={[0, 0, r]} scale={sc}>
          <WallFrame mats={mats} picture={pic} w={1.15} h={1.5} />
        </group>
      ))}
      {/* the bench you sit on to look */}
      <mesh position={[0.2, -0.85, 1.6]} material={mats.dim}>
        <boxGeometry args={[2.6, 0.14, 0.7]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0.2 + side * 1.1, -1.0, 1.6]} material={mats.dim}>
          <boxGeometry args={[0.1, 0.34, 0.6]} />
        </mesh>
      ))}
      <Figure pose="idle" position={[3.4, -0.3, 0.9]} height={1.7} rotation={[0, -0.4, 0]} />
    </>
  )
}


/* ------------------------------------------------------------------ board */

/**
 * The blog as a bulletin board: every post is a card pinned to the cork,
 * clickable straight through to the post. New markdown file = new card, no
 * scene changes — the board reads the same source as the page.
 */
function BoardScene({ mats }: { mats: Mats }) {
  const pinned = notes.slice(0, 8)
  return (
    <>
      <Ground mats={mats} />

      {/* wall and the board on it */}
      <mesh position={[0, 1.8, -3.4]} material={mats.paper}>
        <boxGeometry args={[13, 7.5, 0.2]} />
      </mesh>
      <group position={[0.1, 1.35, -3.2]}>
        <mesh position={[0, 0, -0.05]} material={mats.dim}>
          <boxGeometry args={[6.9, 4.0, 0.1]} />
        </mesh>
        <mesh material={mats.tone}>
          <boxGeometry args={[6.6, 3.7, 0.08]} />
        </mesh>

        {/* the header plaque, screwed onto the cork's top rail */}
        <group position={[0, 1.5, 0.1]}>
          <mesh material={mats.dim}>
            <boxGeometry args={[2.3, 0.62, 0.12]} />
          </mesh>
          <Text
            font={delaWoff}
            fontSize={0.4}
            color="#0b0b0c"
            anchorX="center"
            anchorY="middle"
            position={[0, -0.02, 0.08]}
            letterSpacing={0.04}
          >
            blog
          </Text>
        </group>

        {pinned.map((note, i) => {
          const col = i % 3
          const row = Math.floor(i / 3)
          const x = (col - 1) * 2.05 + (row % 2 ? 0.35 : -0.2)
          const y = 0.95 - row * 1.35
          const tilt = [0.05, -0.04, 0.03, -0.06][i % 4]
          return (
            <Door key={note.slug} to={`/notes/${note.slug}`}>
              <group position={[x, y, 0.09]} rotation={[0, 0, tilt]}>
                <mesh material={mats.paper}>
                  <boxGeometry args={[1.8, 1.05, 0.03]} />
                </mesh>
                <mesh position={[0, 0.5, 0.05]} material={mats.accent}>
                  <sphereGeometry args={[0.05, 10, 8]} />
                </mesh>
                <Text
                  font={monoWoff}
                  fontSize={0.135}
                  color="#0b0b0c"
                  anchorX="center"
                  anchorY="middle"
                  position={[0, 0.08, 0.03]}
                  maxWidth={1.55}
                  textAlign="center"
                  lineHeight={1.25}
                >
                  {note.title}
                </Text>
                <Text
                  font={monoWoff}
                  fontSize={0.09}
                  color="#6b6862"
                  anchorX="center"
                  anchorY="middle"
                  position={[0, -0.36, 0.03]}
                  letterSpacing={0.08}
                >
                  {note.date}
                </Text>
              </group>
            </Door>
          )
        })}

      </group>

      {/* him, deciding what to pin next */}
      <Figure pose="idle" position={[-3.4, -0.3, 0.8]} height={1.7} rotation={[0, 0.45, 0]} />
    </>
  )
}

/* --------------------------------------------------------------- registry */

export function SceneFor({
  sceneKey,
  pathname,
  palette,
  explore,
  frozen,
}: {
  sceneKey: SceneKey
  pathname: string
  palette: InkPalette
  explore: boolean
  frozen: boolean
}) {
  const mats = useInk(palette)

  switch (sceneKey) {
    case 'cover':
      return <CoverScene mats={mats} />
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
      return <TreeScene mats={mats} explore={explore} frozen={frozen} />
    case 'studio':
      return <StudioScene mats={mats} explore={explore} />
    case 'direction':
      return <DirectionScene mats={mats} explore={explore} />
    case 'session':
      return <SessionScene mats={mats} explore={explore} />
    case 'prints':
      return <PrintsScene mats={mats} />
    case 'board':
      return <BoardScene mats={mats} />
    case 'void':
    default:
      return <VoidScene mats={mats} frozen={frozen} />
  }
}
