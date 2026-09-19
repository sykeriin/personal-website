import { Text, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import type { InkPalette } from '../three/theme'
import { makeToonGradient } from '../three/toonGradient'
import { notes } from '../content/notes'
import { achievements, projects, socials } from '../data/content'
import { usePresence } from '../hooks/usePresence'
import { PROJECT_ACCENTS, sideAccent, type SceneKey } from './manifest'
import { Figure } from './Figure'
import { FractalPlane } from './Fractal'
import { Book } from './BookCover'
import monoWoff from '@fontsource/space-mono/files/space-mono-latin-400-normal.woff?url'
import monoBoldWoff from '@fontsource/space-mono/files/space-mono-latin-700-normal.woff?url'
import delaWoff from '@fontsource/anton/files/anton-latin-400-normal.woff?url'
import signRockUrl from '../assets/ink/marks/sign-rock.png'
import { Door, Hotspot, InkShape } from './Ink'
import { useHotspots } from './hotspots'
import { Guitar, ScreenLines } from './props'
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
  skateboardTop,
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
      // Shades of the plate: darker and lighter saturated variants land in
      // different value bands, so walls get tonal depth in the same ink.
      accentDeep: make(accent.clone().multiplyScalar(0.45)),
      accentSoft: make(accent.clone().lerp(new THREE.Color('#ffffff'), 0.38)),
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
      <Door to="/session">
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

/**
 * An office chair, drawn in full: five-star base on castors, gas lift, seat
 * with a cushion, a tilted back and armrests. Local floor is y -1.2 (the desk
 * group sits 0.05 above the world floor), and the chair faces +z.
 */
function DeskChair({ mats }: { mats: Mats }) {
  return (
    <group>
      {/* five-star base with castors */}
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <group key={i} rotation={[0, a, 0]}>
            <mesh position={[0, -1.13, 0.17]} rotation={[0.08, 0, 0]} material={mats.dim}>
              <boxGeometry args={[0.06, 0.05, 0.36]} />
            </mesh>
            <mesh position={[0, -1.17, 0.33]} rotation={[0, 0, Math.PI / 2]} material={mats.dim}>
              <cylinderGeometry args={[0.035, 0.035, 0.05, 10]} />
            </mesh>
          </group>
        )
      })}
      {/* gas lift */}
      <mesh position={[0, -0.9, 0]} material={mats.dim}>
        <cylinderGeometry args={[0.035, 0.045, 0.5, 10]} />
      </mesh>
      {/* seat and cushion */}
      <mesh position={[0, -0.64, 0]} material={mats.dim}>
        <boxGeometry args={[0.58, 0.08, 0.56]} />
      </mesh>
      <mesh position={[0, -0.575, 0.01]} material={mats.accentDeep}>
        <boxGeometry args={[0.54, 0.06, 0.5]} />
      </mesh>
      {/* back: a tilted panel on two uprights, with a headrest */}
      {[-0.18, 0.18].map((x) => (
        <mesh key={x} position={[x, -0.4, -0.26]} rotation={[-0.12, 0, 0]} material={mats.dim}>
          <boxGeometry args={[0.04, 0.4, 0.04]} />
        </mesh>
      ))}
      <mesh position={[0, -0.08, -0.3]} rotation={[-0.12, 0, 0]} material={mats.accentDeep}>
        <boxGeometry args={[0.52, 0.62, 0.07]} />
      </mesh>
      <mesh position={[0, 0.34, -0.35]} rotation={[-0.12, 0, 0]} material={mats.dim}>
        <boxGeometry args={[0.3, 0.14, 0.07]} />
      </mesh>
      {/* armrests */}
      {[-0.33, 0.33].map((x) => (
        <group key={x}>
          <mesh position={[x, -0.5, 0.02]} material={mats.dim}>
            <boxGeometry args={[0.05, 0.22, 0.05]} />
          </mesh>
          <mesh position={[x, -0.38, 0.0]} material={mats.dim}>
            <boxGeometry args={[0.08, 0.04, 0.34]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/**
 * The origin room — and the world's own nav. Everything you can go to exists
 * here as a thing in the room: the bookshelf goes to projects, the gym door to
 * training, the cork board to the blog, and the tree outside the side window
 * to the skill tree. The desk is his: name on the laptop, tower underneath,
 * keyboard, mouse, the mug still steaming. Proportions are human — he stands
 * taller than the monitor, and the desk comes up to his hip.
 */
function DeskScene({ mats, explore }: { mats: Mats; explore: boolean }) {
  const shapes = useMemo(
    () => ({ monitor: monitor(), laptop: laptop(), mug: mug(), steam: mugSteam() }),
    [],
  )
  const spineMats = [mats.accent, mats.hueA, mats.hueB, mats.tone]

  // True-colour materials (sticker channel): cork stays cork, leaves stay
  // green, instead of flattening into the chapter plate.
  const cork = useMemo(
    () => new THREE.MeshToonMaterial({ color: '#c99a5f', gradientMap: makeToonGradient(3), toneMapped: false }),
    [],
  )
  const leaf = useMemo(
    () => new THREE.MeshToonMaterial({ color: '#5f9e5a', gradientMap: makeToonGradient(3), toneMapped: false }),
    [],
  )
  const berry = useMemo(
    () => new THREE.MeshToonMaterial({ color: '#e84c7d', gradientMap: makeToonGradient(3), toneMapped: false }),
    [],
  )
  // True-colour ink for the pinned notes' scribbled lines — outside the
  // sticker channel these were the same flattened tone as the paper they
  // sat on, so the "writing" read as a blank card from any distance.
  const noteInk = useMemo(
    () => new THREE.MeshToonMaterial({ color: '#2a2420', gradientMap: makeToonGradient(3), toneMapped: false }),
    [],
  )

  // Book rows: [board y, [x, height, spine material]...]. Books stand ON the
  // board — bottoms flush with its top face — instead of floating between them.
  const rows: Array<[number, Array<[number, number, number]>]> = [
    [-1.25, [[-0.78, 0.58, 0], [-0.58, 0.64, 1], [-0.36, 0.52, 2], [-0.1, 0.6, 3], [0.14, 0.66, 0], [0.42, 0.54, 2], [0.7, 0.6, 1]]],
    [-0.45, [[-0.74, 0.62, 2], [-0.5, 0.56, 3], [-0.22, 0.66, 1], [0.08, 0.58, 0], [0.34, 0.64, 2], [0.66, 0.5, 3]]],
    [0.4, [[-0.7, 0.6, 1], [-0.46, 0.66, 0], [-0.2, 0.54, 3], [0.3, 0.62, 2], [0.56, 0.58, 1]]],
  ]

  // What's pinned to the cork: [x, y, tilt, w, h, kind].
  const pins: Array<[number, number, number, number, number, 'paper' | 'hueA']> = [
    [-0.82, 0.38, 0.05, 0.7, 0.5, 'paper'],
    [0.05, 0.45, -0.04, 0.6, 0.42, 'paper'],
    [0.9, 0.3, 0.07, 0.62, 0.62, 'hueA'],
    [-0.6, -0.42, -0.06, 0.85, 0.44, 'paper'],
    [0.5, -0.38, 0.04, 0.5, 0.36, 'paper'],
  ]

  return (
    <>
      <Backdrop name="bg-mist-01" tint={mats.accent.color} />
      <Ground mats={mats} />

      {/* the room shell: the back wall carries the chapter colour, in shades */}
      <mesh position={[0, 1.8, -3.8]} material={mats.accent}>
        <boxGeometry args={[13.5, 7.5, 0.2]} />
      </mesh>
      <mesh position={[0, 3.6, -3.76]} material={mats.accentSoft}>
        <boxGeometry args={[13.5, 1.9, 0.06]} />
      </mesh>
      <mesh position={[0, -0.72, -3.74]} material={mats.accentDeep}>
        <boxGeometry args={[13.5, 0.95, 0.08]} />
      </mesh>
      <mesh position={[5.9, 1.8, -0.2]} rotation={[0, -Math.PI / 2, 0]} material={mats.dim}>
        <boxGeometry args={[7.4, 7.5, 0.2]} />
      </mesh>
      {/* the side wall faces away from the key light; without this it falls
          into the solid-black band */}
      <directionalLight position={[-4, 2.2, 2.5]} intensity={0.5} />

      {/* the bookshelf — projects live on it */}
      <Door to="/projects">
        <group position={[-3.7, 0.35, -3.6]}>
          <mesh position={[0, 0, -0.25]} material={mats.accentDeep}>
            <boxGeometry args={[2.1, 2.7, 0.04]} />
          </mesh>
          {[-1.05, 1.05].map((x) => (
            <mesh key={x} position={[x, 0, 0]} material={mats.dim}>
              <boxGeometry args={[0.12, 2.7, 0.55]} />
            </mesh>
          ))}
          {[-1.25, -0.45, 0.4, 1.25].map((y) => (
            <mesh key={y} position={[0, y, 0]} material={mats.dim}>
              <boxGeometry args={[2.1, 0.1, 0.55]} />
            </mesh>
          ))}
          {rows.map(([board, books]) =>
            books.map(([x, h, m]) => (
              <mesh key={`${board},${x}`} position={[x, board + 0.05 + h / 2, 0.02]} material={spineMats[m]}>
                <boxGeometry args={[0.16, h, 0.42]} />
              </mesh>
            )),
          )}
          {/* a plant on top, and the sign */}
          <mesh position={[-0.7, 1.42, 0.05]} material={mats.accent}>
            <cylinderGeometry args={[0.1, 0.08, 0.24, 12]} />
          </mesh>
          <mesh position={[-0.7, 1.66, 0.05]} scale={[1, 0.8, 1]} material={leaf} userData={{ inkSticker: true }}>
            <sphereGeometry args={[0.18, 12, 10]} />
          </mesh>
          <mesh position={[0.25, 1.62, 0.02]} material={mats.paper}>
            <boxGeometry args={[1.55, 0.36, 0.06]} />
          </mesh>
          <Text
            font={monoBoldWoff}
            sdfGlyphSize={128}
            fontSize={0.17}
            color="#0b0b0c"
            anchorX="center"
            anchorY="middle"
            position={[0.25, 1.62, 0.06]}
            letterSpacing={0.06}
          >
            {'projects →'}
          </Text>
        </group>
      </Door>

      {/* the cork board on the back wall — the blog, pinned up */}
      <Door to="/notes">
        <group position={[1.0, 1.75, -3.66]} rotation={[0, 0, 0.006]}>
          <mesh position={[0, 0, -0.03]} material={mats.dim}>
            <boxGeometry args={[2.75, 1.95, 0.08]} />
          </mesh>
          <mesh material={cork} userData={{ inkSticker: true }}>
            <boxGeometry args={[2.55, 1.75, 0.06]} />
          </mesh>
          {pins.map(([x, y, tilt, w, h, kind], i) => (
            <group key={i} position={[x, y, 0.05]} rotation={[0, 0, tilt]}>
              <mesh material={mats[kind]} userData={{ inkSticker: true }}>
                <boxGeometry args={[w, h, 0.02]} />
              </mesh>
              {kind === 'paper'
                ? [0.22, 0.0, -0.22].map((ly) => (
                    <mesh key={ly} position={[-w * 0.04, ly * h, 0.015]} material={noteInk} userData={{ inkSticker: true }}>
                      <boxGeometry args={[w * 0.62, 0.045, 0.01]} />
                    </mesh>
                  ))
                : null}
              <mesh position={[0, h / 2 - 0.05, 0.03]} material={mats.accent}>
                <sphereGeometry args={[0.035, 10, 8]} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, -1.1, 0.02]} material={mats.paper}>
            <boxGeometry args={[1.2, 0.36, 0.06]} />
          </mesh>
          <Text
            font={monoBoldWoff}
            sdfGlyphSize={128}
            fontSize={0.18}
            color="#0b0b0c"
            anchorX="center"
            anchorY="middle"
            position={[0, -1.1, 0.06]}
            letterSpacing={0.06}
          >
            {'blog →'}
          </Text>
        </group>
      </Door>

      {/* the gym door — training is through here */}
      <Door to="/training">
        <group position={[3.9, 0.2, -3.66]}>
          <mesh material={mats.dim}>
            <boxGeometry args={[1.56, 2.7, 0.14]} />
          </mesh>
          <mesh position={[0, -0.02, 0.05]} material={mats.accent}>
            <boxGeometry args={[1.3, 2.46, 0.08]} />
          </mesh>
          <mesh position={[0.48, -0.2, 0.12]} material={mats.paper}>
            <sphereGeometry args={[0.07, 10, 8]} />
          </mesh>
          <mesh position={[0, 1.62, 0.02]} material={mats.paper}>
            <boxGeometry args={[1.2, 0.4, 0.06]} />
          </mesh>
          <Text
            font={monoBoldWoff}
            sdfGlyphSize={128}
            fontSize={0.19}
            color="#0b0b0c"
            anchorX="center"
            anchorY="middle"
            position={[0, 1.62, 0.06]}
            letterSpacing={0.06}
          >
            {'gym →'}
          </Text>
        </group>
      </Door>

      {/* the side window — the skill tree grows out back */}
      <Door to="/skill-tree">
        <group position={[5.78, 1.55, -1.3]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh material={mats.dim}>
            <boxGeometry args={[2.3, 1.8, 0.12]} />
          </mesh>
          <mesh position={[0, 0, 0.03]} material={mats.paper}>
            <boxGeometry args={[2.06, 1.56, 0.05]} />
          </mesh>
          {/* the hill and the tree beyond the glass */}
          <mesh position={[0, -0.5, 0.07]} material={mats.tone}>
            <boxGeometry args={[2.0, 0.5, 0.02]} />
          </mesh>
          <mesh position={[0.3, -0.12, 0.08]} material={mats.dim}>
            <cylinderGeometry args={[0.04, 0.07, 0.7, 8]} />
          </mesh>
          <CanopySprite variant={0} tint={mats.accent.color} position={[0.3, 0.3, 0.1]} scale={0.7} />
          <mesh position={[0.55, 0.05, 0.11]} scale={[1, 1.25, 1]} material={berry} userData={{ inkSticker: true }}>
            <sphereGeometry args={[0.06, 10, 8]} />
          </mesh>
          {/* mullions */}
          <mesh position={[0, 0, 0.09]} material={mats.dim}>
            <boxGeometry args={[0.06, 1.56, 0.02]} />
          </mesh>
          <mesh position={[0, 0.1, 0.09]} material={mats.dim}>
            <boxGeometry args={[2.06, 0.05, 0.02]} />
          </mesh>
          <mesh position={[0, 1.1, 0.02]} material={mats.paper}>
            <boxGeometry args={[2.15, 0.36, 0.06]} />
          </mesh>
          <Text
            font={monoBoldWoff}
            sdfGlyphSize={128}
            fontSize={0.155}
            color="#0b0b0c"
            anchorX="center"
            anchorY="middle"
            position={[0, 1.1, 0.06]}
            letterSpacing={0.05}
          >
            {'skills, out back →'}
          </Text>
        </group>
      </Door>

      {/* his desk, hip height, fully equipped. The desk top sits at y -0.32 here. */}
      <group position={[0.5, 0.05, 0]} rotation={[0, -0.12, 0]}>
        <mesh position={[0, -0.39, 0]} material={mats.paper}>
          <boxGeometry args={[4.0, 0.14, 1.6]} />
        </mesh>
        {[-1.75, 1.75].map((x) => (
          <mesh key={x} position={[x, -0.83, 0]} material={mats.dim}>
            <boxGeometry args={[0.12, 0.74, 1.4]} />
          </mesh>
        ))}

        {/* the chair, pulled out and turned, the way it's left mid-session —
            in front of the desk where it can actually be seen, not tucked
            behind it where the desk hid the whole thing */}
        <group position={[0.15, 0, 1.15]} rotation={[0, 2.75, 0]}>
          <DeskChair mats={mats} />
        </group>

        {/* hi, i'm durva — the monitor, mid-build. Big: it is the thing on
            the desk, and the whole chapter's opening line lives on it. */}
        <Hotspot id="origin-0" enabled={explore}>
          <group position={[-0.55, 0.24, -0.35]} rotation={[0, 0.16, 0]}>
            <InkShape shape={shapes.monitor} depth={0.3} material={mats.paper} scale={1.05} />
            <group position={[0, 0.16, 0.09]} scale={0.76}>
              <ScreenLines mats={mats} />
            </group>
          </group>
        </Hotspot>

        {/* keyboard, mousepad, mouse */}
        <mesh position={[-0.55, -0.295, 0.28]} rotation={[0, 0.04, 0]} material={mats.paper}>
          <boxGeometry args={[1.1, 0.05, 0.34]} />
        </mesh>
        {[0.08, 0, -0.08].map((z) => (
          <mesh key={z} position={[-0.55, -0.265, 0.28 + z]} material={mats.tone}>
            <boxGeometry args={[0.98, 0.014, 0.05]} />
          </mesh>
        ))}
        <mesh position={[0.45, -0.31, 0.28]} material={mats.tone}>
          <boxGeometry args={[0.48, 0.02, 0.38]} />
        </mesh>
        <mesh position={[0.45, -0.265, 0.27]} material={mats.paper}>
          <boxGeometry args={[0.13, 0.07, 0.2]} />
        </mesh>
        <mesh position={[0.45, -0.228, 0.22]} material={mats.accent}>
          <boxGeometry args={[0.025, 0.015, 0.05]} />
        </mesh>

        {/* what i'm into — the mug, still going */}
        <Hotspot id="origin-2" enabled={explore}>
          <group>
            <mesh position={[1.0, -0.19, 0.3]} material={mats.accent}>
              <cylinderGeometry args={[0.11, 0.095, 0.26, 20]} />
            </mesh>
            <InkShape
              shape={shapes.steam}
              depth={0.04}
              material={mats.tone}
              position={[1.0, 0.1, 0.3]}
              scale={0.3}
            />
          </group>
        </Hotspot>

        {/* school — the laptop, with his name on the lid */}
        <Hotspot id="origin-1" enabled={explore}>
          <group position={[1.45, -0.124, -0.3]} scale={0.7}>
            <InkShape
              shape={shapes.laptop}
              depth={0.5}
              material={mats.hueA}
              rotation={[0, -1.05, 0]}
              scale={0.85}
            />
            <Text
              font={monoWoff}
              sdfGlyphSize={128}
              fontSize={0.085}
              color="#0b0b0c"
              anchorX="center"
              anchorY="middle"
              position={[0.14, 0.22, 0.13]}
              rotation={[-0.32, 0.52, 0.12]}
              letterSpacing={0.06}
            >
              durva sharma
            </Text>
          </group>
        </Hotspot>

        {/* the tower, humming under the desk */}
        <group position={[-1.2, -0.76, -0.05]}>
          <mesh material={mats.dim}>
            <boxGeometry args={[0.42, 0.86, 0.7]} />
          </mesh>
          <mesh position={[0, 0, 0.36]} material={mats.paper}>
            <boxGeometry args={[0.36, 0.78, 0.03]} />
          </mesh>
          {[0.24, 0.14].map((y) => (
            <mesh key={y} position={[0, y, 0.375]} material={mats.tone}>
              <boxGeometry args={[0.26, 0.035, 0.01]} />
            </mesh>
          ))}
          <mesh position={[0.1, 0.33, 0.375]} material={mats.accent}>
            <cylinderGeometry args={[0.02, 0.02, 0.02, 10]} />
          </mesh>
        </group>
      </group>

      {/* outside class — the guitar against the desk's end */}
      <Hotspot id="origin-3" enabled={explore}>
        <group position={[2.75, -0.3, 0.75]} rotation={[0.02, 0.3, 0.18]} scale={0.8}>
          <Guitar mats={mats} body="accent" />
        </group>
      </Hotspot>

      {/* him, standing by the shelf, taller than anything on the desk */}
      <Figure pose="idle" position={[-2.0, -0.13, 0.9]} height={2.05} rotation={[0, 0.5, 0]} />
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
  const skateDeck = useMemo(() => skateboardTop(), [])
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

      {/* the door home */}
      <Door to="/origin">
        <group position={[-4.05, 0.1, 0.6]} rotation={[0, 0.55, 0]}>
          <mesh material={mats.dim}>
            <boxGeometry args={[1.4, 2.5, 0.14]} />
          </mesh>
          <mesh position={[0, -0.02, 0.05]} material={mats.accent}>
            <boxGeometry args={[1.16, 2.28, 0.08]} />
          </mesh>
          <mesh position={[0.42, -0.2, 0.11]} material={mats.paper}>
            <sphereGeometry args={[0.06, 10, 8]} />
          </mesh>
          <mesh position={[0, 1.48, 0.05]} material={mats.paper}>
            <boxGeometry args={[1.5, 0.36, 0.06]} />
          </mesh>
          <Text
            font={monoBoldWoff}
            sdfGlyphSize={128}
            fontSize={0.17}
            color="#0b0b0c"
            anchorX="center"
            anchorY="middle"
            position={[0, 1.48, 0.09]}
            letterSpacing={0.05}
          >
            {'back home →'}
          </Text>
        </group>
      </Door>

      {/* him, in guard, mid-session */}
      <Figure pose="guard" position={[-2.6, -0.28, 1.3]} height={1.7} rotation={[0, 0.55, 0]} />

      {/* corner clutter: water bottle and a kick pad against the post */}
      <mesh position={[-2.15, -0.88, -0.1]} material={mats.hueA}>
        <cylinderGeometry args={[0.09, 0.09, 0.42, 12]} />
      </mesh>
      <mesh position={[3.75, -0.62, 0.3]} rotation={[0.15, 0.3, -0.35]} material={mats.hueB}>
        <boxGeometry args={[0.5, 1.05, 0.22]} />
      </mesh>

      {/* a couple of dumbbells, dropped on the mat where they landed */}
      {[
        [1.7, -1.02, 1.3, 0.3],
        [2.0, -1.02, 1.55, -0.5],
      ].map(([x, y, z, rot], i) => (
        <group key={i} position={[x, y, z]} rotation={[0, rot, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={mats.dim}>
            <cylinderGeometry args={[0.02, 0.02, 0.42, 8]} />
          </mesh>
          {[-0.19, 0.19].map((dx) => (
            <mesh key={dx} position={[dx, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.tone}>
              <cylinderGeometry args={[0.11, 0.11, 0.07, 16]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* his skateboard, leaned against the post */}
      <group position={[-1.9, -0.68, -0.35]} rotation={[-0.18, 0.5, 0.1]}>
        <InkShape shape={skateDeck} depth={0.04} material={mats.paper} scale={0.85} />
        <mesh position={[0, 0, 0.02]} material={mats.tone}>
          <boxGeometry args={[0.05, 0.65, 0.006]} />
        </mesh>
      </group>

      {/* a basketball, resting in the far corner */}
      <mesh position={[3.6, -1.0, -1.1]} material={mats.hueB} userData={{ inkSticker: true }}>
        <sphereGeometry args={[0.22, 16, 12]} />
      </mesh>
      {[0, Math.PI / 2].map((r) => (
        <mesh
          key={r}
          position={[3.6, -1.0, -1.1]}
          rotation={[0, r, 0]}
          material={mats.dim}
          userData={{ inkSticker: true }}
        >
          <torusGeometry args={[0.22, 0.012, 6, 20]} />
        </mesh>
      ))}
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

/**
 * A project as a volume: its plate colour, its name down the spine. Pick it up
 * (the hotspot goes active) and it pops off the shelf and falls open — a page
 * fans up out of the spine carrying the tagline, the way the reveal card
 * carries the rest. The card still holds the full story; this is the book
 * actually answering the click.
 */
function ProjectBook({
  mats,
  material,
  title,
  tagline,
  h,
  lean = 0,
  active = false,
}: {
  mats: Mats
  material: THREE.MeshToonMaterial
  title: string
  tagline?: string
  h: number
  lean?: number
  active?: boolean
}) {
  const book = useRef<THREE.Group>(null)
  const leftPage = useRef<THREE.Group>(null)
  const rightPage = useRef<THREE.Group>(null)
  const open = useRef(0)
  // The hinge sits at the spine's own mid-height, in front of its face —
  // the book itself opening, not a separate flap popping up above it.
  const spread = h * 0.55

  useFrame((_, delta) => {
    open.current = THREE.MathUtils.damp(open.current, active ? 1 : 0, 5, delta)
    if (book.current) {
      // A small forward pop — picked off the shelf toward the visitor.
      book.current.position.z = open.current * 0.4
      // Cancel the shelf lean as it opens: a leaning book (roadsense,
      // verdant, ...) was fanning its pages out on top of that same tilt,
      // so the open spread swung diagonally across the neighbouring spines
      // instead of sitting flat and level in front of the visitor.
      book.current.rotation.z = -lean * open.current
    }
    const scale = Math.min(1, open.current * 1.6)
    // Both leaves hinge at the same vertical line down the spine's front
    // face and fan open sideways — a real open book, not a single flap.
    if (leftPage.current) {
      leftPage.current.visible = open.current > 0.01
      leftPage.current.rotation.y = -open.current * 0.85
      leftPage.current.scale.setScalar(scale)
    }
    if (rightPage.current) {
      rightPage.current.visible = open.current > 0.01
      rightPage.current.rotation.y = open.current * 0.85
      rightPage.current.scale.setScalar(scale)
    }
  })

  return (
    <group rotation={[0, 0, lean]}>
      <group ref={book}>
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
          sdfGlyphSize={128}
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

        {/* an open book, two leaves hinged on the same vertical line at the
            spine's front face — title on the left page, the pitch on the
            right, the way an actual open book reads */}
        <group ref={leftPage} position={[0, spread, 0.36]} visible={false}>
          <mesh position={[-0.42, 0, 0]} material={mats.paper}>
            <boxGeometry args={[0.84, 1.0, 0.02]} />
          </mesh>
          <Text
            font={delaWoff}
            sdfGlyphSize={128}
            fontSize={0.11}
            color="#0b0b0c"
            anchorX="center"
            anchorY="middle"
            position={[-0.42, 0.15, 0.02]}
            maxWidth={0.7}
            textAlign="center"
            lineHeight={1.05}
          >
            {title}
          </Text>
        </group>
        <group ref={rightPage} position={[0, spread, 0.36]} visible={false}>
          <mesh position={[0.42, 0, 0]} material={mats.paper}>
            <boxGeometry args={[0.84, 1.0, 0.02]} />
          </mesh>
          {tagline ? (
            <Text
              font={monoWoff}
              sdfGlyphSize={128}
              fontSize={0.062}
              color="#3a3a3d"
              anchorX="center"
              anchorY="middle"
              position={[0.42, 0.05, 0.02]}
              maxWidth={0.7}
              textAlign="center"
              lineHeight={1.35}
            >
              {tagline}
            </Text>
          ) : null}
        </group>
      </group>
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

/** A framed gig-poster-style sign carrying real katakana ("rock"), baked
    into a texture at build time so it doesn't need a CJK web font. */
function RockSign({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  const texture = useTexture(signRockUrl)
  const material = useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true
    return new THREE.MeshBasicMaterial({ map: texture, toneMapped: false })
  }, [texture])
  const w = 0.85
  const h = w * (480 / 640)
  return (
    <group position={position} rotation={[0, 0, rotation]}>
      <mesh material={material} userData={{ inkSticker: true }}>
        <planeGeometry args={[w, h]} />
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
  const { active } = useHotspots()
  const leafClusterShape = useMemo(() => leafCluster(), [])
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
    { slug: 'shadowbox', title: 'shadowbox', h: 1.15, x: 1.6, lean: 0.12 },
    { slug: 'arena', title: 'arena', h: 1.0, x: 2.3 },
  ]

  // Spread genuinely across the wall this time — the room is 13 units wide
  // (edges at ±6.5), and the case only occupies the middle third of that
  // (-1.96 to 2.36), so the last attempt's ±3-4 range still left most of
  // the actual wall bare on both sides.
  const wallPosters: Array<[number, number, 'accent' | 'hueA' | 'hueB']> = [
    [-4.65, -0.05, 'hueB'],
    [-3.55, 0.04, 'accent'],
    [3.55, 0.06, 'hueA'],
    [4.65, -0.04, 'hueB'],
  ]

  return (
    <>
      <Ground mats={mats} />

      {/* the room the shelf lives in */}
      <mesh position={[0, 1.8, -2.6]} material={mats.paper}>
        <boxGeometry args={[13, 7.5, 0.2]} />
      </mesh>

      {/* a photo, out past the left-hand records */}
      <group position={[-5.8, 2.4, -2.48]} rotation={[0, 0, -0.03]}>
        <WallFrame mats={mats} picture="hueA" w={0.7} h={0.78} />
      </group>

      {/* a rock sign, out past the right-hand records — real katakana baked
          into a texture rather than set in a bundled face, since the site's
          webfonts are deliberately Latin-only for weight */}
      <RockSign position={[5.8, 2.55, -2.48]} rotation={0.03} />

      {/* vinyls flanking the case on the back wall — mounted, not sitting
          on the furniture, so the music reads as part of the room itself.
          Spread wider apart this time instead of a tight overlapping pair. */}
      {wallPosters.map(([x, tilt, pic], i) => {
        const w = 0.85, h = 1.1
        return (
          <group key={x} position={[x, 1.75, -2.46 + (i % 2) * 0.06]} rotation={[0, 0, tilt]}>
            <mesh material={mats[pic]}>
              <boxGeometry args={[w, h, 0.03]} />
            </mesh>
            <mesh position={[0, h * 0.16, 0.02]} rotation={[Math.PI / 2, 0, 0]} material={mats.paper}>
              <cylinderGeometry args={[w * 0.27, w * 0.27, 0.02, 24]} />
            </mesh>
            <mesh position={[0, h * 0.16, 0.035]} rotation={[Math.PI / 2, 0, 0]} material={mats[pic]}>
              <cylinderGeometry args={[w * 0.06, w * 0.06, 0.02, 12]} />
            </mesh>
            <mesh position={[0, -h * 0.34, 0.02]} material={mats.paper}>
              <boxGeometry args={[w * 0.8, h * 0.2, 0.02]} />
            </mesh>
            {[0.04, -0.04].map((ly) => (
              <mesh key={ly} position={[0, -h * 0.34 + ly * h, 0.035]} material={mats.tone}>
                <boxGeometry args={[w * 0.55, 0.02, 0.01]} />
              </mesh>
            ))}
          </group>
        )
      })}

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

        {/* the crown: an art piece leaning on the very top, saying what
            this case holds — display letters on a framed canvas */}
        <group position={[0.1, 2.98, -0.12]} rotation={[-0.12, 0, 0.015]}>
          <mesh material={mats.dim}>
            <boxGeometry args={[2.9, 1.15, 0.07]} />
          </mesh>
          <mesh position={[0, 0, 0.045]} material={mats.accent}>
            <boxGeometry args={[2.68, 0.95, 0.03]} />
          </mesh>
          <Text
            font={delaWoff}
            sdfGlyphSize={128}
            fontSize={0.52}
            color="#f7f6f3"
            anchorX="center"
            anchorY="middle"
            position={[0, -0.02, 0.08]}
            letterSpacing={0.03}
          >
            projects
          </Text>
        </group>

        {/* top-of-case company: a potted sprout and a wedge bookend */}
        <group position={[-2.1, 2.4, 0]}>
          <mesh position={[0, 0.14, 0]} material={mats.dim}>
            <cylinderGeometry args={[0.16, 0.12, 0.28, 12]} />
          </mesh>
          <InkShape
            shape={leafClusterShape}
            depth={0.05}
            material={mats.hueA}
            position={[0, 0.5, 0]}
            scale={0.34}
          />
        </group>
        <group position={[2.15, 2.4, 0]} rotation={[0, 0.2, 0]}>
          <mesh position={[0, 0.18, 0]} rotation={[0, 0, 0.5]} material={mats.tone}>
            <boxGeometry args={[0.42, 0.42, 0.3]} />
          </mesh>
        </group>

        {/* top shelf: three volumes and some company */}
        {shelfBooks.map((book) => (
          <Hotspot key={book.slug} id={`proj-${book.slug}`} enabled={explore}>
            <group position={[book.x, 0.68, 0]}>
              <ProjectBook
                mats={mats}
                material={bookMats[book.slug]}
                title={book.title}
                tagline={projects.find((p) => p.slug === book.slug)?.tagline}
                h={book.h}
                lean={book.lean}
                active={active === `proj-${book.slug}`}
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
                tagline={projects.find((p) => p.slug === book.slug)?.tagline}
                h={book.h}
                lean={book.lean}
                active={active === `proj-${book.slug}`}
              />
            </group>
          </Hotspot>
        ))}
        {[
          [-2.3, 1.2, 0],
          [-2.05, 1.35, 0],
          [0.55, 1.05, -0.14],
          [0.85, 0.9, 0],
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

      {/* a couple of moving boxes at the foot of the case — the floor
          around the shelf was bare all the way out to the walls */}
      <group position={[1.5, -0.94, 1.2]} rotation={[0, -0.3, 0]}>
        <mesh material={mats.paper}>
          <boxGeometry args={[0.62, 0.5, 0.62]} />
        </mesh>
        <mesh position={[0, 0.251, 0]} material={mats.tone}>
          <boxGeometry args={[0.64, 0.02, 0.1]} />
        </mesh>
        <mesh position={[0, 0.251, 0]} rotation={[0, Math.PI / 2, 0]} material={mats.tone}>
          <boxGeometry args={[0.64, 0.02, 0.1]} />
        </mesh>
      </group>
      <group position={[1.95, -1.08, 0.75]} rotation={[0, 0.4, 0]}>
        <mesh material={mats.tone}>
          <boxGeometry args={[0.42, 0.36, 0.42]} />
        </mesh>
        <mesh position={[0, 0.181, 0]} material={mats.dim}>
          <boxGeometry args={[0.44, 0.02, 0.08]} />
        </mesh>
      </group>

      {/* a small rug, grounding the case where it meets the floor */}
      <mesh position={[0.2, -1.13, 0.9]} material={mats.accentDeep}>
        <cylinderGeometry args={[1.9, 1.9, 0.03, 32]} />
      </mesh>
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
      <Figure pose="point" position={[-2.6, -0.3, 1.3]} height={1.7} rotation={[0, 0.5, 0]} />
    </>
  )
}


const FOLIAGE = Object.entries(
  import.meta.glob('../assets/ink/marks/foliage-*.png', {
    eager: true,
    query: '?url',
    import: 'default',
  }) as Record<string, string>,
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, url]) => url)

/**
 * A mass of brush-painted leaves (from the p5.brush mark factory), tinted to
 * the plate family and alpha-TESTED so the ink pass outlines its ragged,
 * painterly silhouette — foliage that reads as drawn, not extruded.
 */
function CanopySprite({
  variant,
  tint,
  position,
  scale = 1,
  flip = false,
  rotation = 0,
}: {
  variant: number
  tint: THREE.Color
  position: [number, number, number]
  scale?: number
  flip?: boolean
  rotation?: number
}) {
  const url = FOLIAGE[variant % FOLIAGE.length]
  const texture = useTexture(url)
  const gradient = useMemo(() => makeToonGradient(3), [])
  const material = useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
    return new THREE.MeshToonMaterial({
      map: texture,
      color: tint,
      gradientMap: gradient,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      toneMapped: false,
    })
  }, [texture, tint, gradient])
  return (
    <mesh
      position={position}
      rotation={[0, 0, rotation]}
      scale={[flip ? -scale : scale, scale, 1]}
      material={material}
      userData={{ inkCutout: true }}
    >
      <planeGeometry args={[2, 2]} />
    </mesh>
  )
}


/**
 * A dragon fruit: plump ovoid body with flame scales curling off it and a
 * tuft on top. Dragon fruit famously grows on a cactus, not a tree — but this
 * tree is fictional and fruits whatever it likes.
 *
 * Bodies are DUSTY pastels on purpose: their saturation sits under the
 * two-ink flatten's threshold, so each fruit keeps its own colour instead of
 * being remapped to the chapter plate — five fruits, five real colours, and
 * the print system reads them as tinted paper.
 */
function DragonFruit({
  body,
  flame,
  r = 0.26,
  elong = 1.28,
  spikes = 6,
}: {
  body: string
  flame: string
  r?: number
  /** Body stretch: 1 is round, 1.5 is a long one. No two fruit share it. */
  elong?: number
  /** How many scale-flames wrap the body. */
  spikes?: number
}) {
  const bodyMat = useMemo(
    () => new THREE.MeshToonMaterial({ color: body, gradientMap: makeToonGradient(3), toneMapped: false }),
    [body],
  )
  const flameMat = useMemo(
    () => new THREE.MeshToonMaterial({ color: flame, gradientMap: makeToonGradient(3), toneMapped: false }),
    [flame],
  )
  const all: Array<[number, number, number]> = [
    [0.6, 0.4, 0.2],
    [2.2, 0.15, -0.3],
    [3.6, 0.5, 0.4],
    [5.0, 0.2, -0.2],
    [1.4, -0.35, 0.5],
    [4.3, -0.3, -0.45],
    [2.9, -0.05, 0.1],
  ]
  const scales = all.slice(0, spikes)
  return (
    <group>
      <mesh material={bodyMat} scale={[1, elong, 1]} userData={{ inkSticker: true }}>
        <sphereGeometry args={[r, 18, 14]} />
      </mesh>
      {scales.map(([a, v, tilt]) => (
        <mesh
          key={a}
          material={flameMat}
          position={[Math.cos(a) * r * 0.92, v * r * elong, Math.sin(a) * r * 0.92]}
          rotation={[Math.sin(a) * 0.9 + tilt, 0, -Math.cos(a) * 0.9 + tilt]}
          userData={{ inkSticker: true }}
        >
          <coneGeometry args={[r * 0.24, r * 0.85, 7]} />
        </mesh>
      ))}
      {/* the tuft */}
      <mesh
        material={flameMat}
        position={[0.04, r * elong + 0.04, 0]}
        rotation={[0.2, 0, -0.25]}
        userData={{ inkSticker: true }}
      >
        <coneGeometry args={[r * 0.22, r * 0.7, 7]} />
      </mesh>
    </group>
  )
}

/** Something heavy on a twig: the pivot is the bough, the fruit hangs `drop`
    below it, and the whole thing wobbles — slowly, and never in sync. */
function Hanging({
  drop,
  phase,
  stem,
  children,
}: {
  drop: number
  phase: number
  stem: THREE.Material
  children: ReactNode
}) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.rotation.z = Math.sin(t * 1.15 + phase) * 0.07 + Math.sin(t * 2.3 + phase * 1.7) * 0.02
    ref.current.rotation.x = Math.sin(t * 0.9 + phase * 0.6) * 0.035
  })
  return (
    <group ref={ref}>
      <mesh position={[0, -drop / 2, 0]} material={stem}>
        <cylinderGeometry args={[0.014, 0.02, drop, 6]} />
      </mesh>
      <group position={[0, -drop, 0]}>{children}</group>
    </group>
  )
}

/** Badge colours by finish; the stamps board keeps them true (sticker). */
const BADGE: Record<string, string> = {
  '1ST': '#e8b13a',
  '2ND': '#b9c4d2',
  '3RD': '#c98a4b',
  'TOP 10': '#e84c7d',
  'TOP 32': '#4a90d9',
}

/**
 * The skill tree, fruiting. Foliage is a dense crown of leaf clusters; the
 * CLICKABLE things are dragon fruit on short stems — four skill groups, each
 * a different shape and colour, swinging on their own time. The stamps he has
 * collected hang on a board planted beside the trunk, badges pinned in rows.
 */
function TreeScene({ mats, explore, frozen }: { mats: Mats; explore: boolean; frozen: boolean }) {
  const trunk = useMemo(() => trunkProfile(), [])
  const badgeMats = useMemo(
    () =>
      achievements.map(
        (a) =>
          new THREE.MeshToonMaterial({
            color: BADGE[a.stamp] ?? '#9d5cd6',
            gradientMap: makeToonGradient(3),
            toneMapped: false,
          }),
      ),
    [],
  )

  const foliage: Array<[number, number, number, number, number, keyof Mats]> = [
    [-2.5, 3.0, 0.2, 0.75, 0.3, 'accent'],
    [-1.6, 3.7, -0.3, 0.95, -0.2, 'hueA'],
    [-0.7, 4.15, 0.15, 0.8, 0.5, 'accent'],
    [0.3, 4.3, -0.2, 1.0, -0.4, 'hueB'],
    [1.3, 4.0, 0.25, 0.85, 0.15, 'accent'],
    [2.2, 3.4, -0.15, 0.9, -0.5, 'hueA'],
    [2.8, 2.7, 0.1, 0.7, 0.35, 'tone'],
    [-3.0, 2.4, -0.1, 0.65, -0.3, 'tone'],
    [0.0, 3.6, 0.4, 0.7, 0.8, 'hueB'],
    [-1.0, 3.1, -0.4, 0.6, -0.7, 'accent'],
    [1.9, 4.35, 0.0, 0.6, 0.6, 'accent'],
    [-3.2, 2.5, 0.1, 0.8, 0.2, 'accent'],
    [-2.0, 2.6, -0.2, 0.95, -0.3, 'hueB'],
    [-0.6, 2.9, 0.3, 1.05, 0.4, 'hueA'],
    [0.8, 3.0, -0.3, 1.0, -0.2, 'accent'],
    [2.0, 2.7, 0.2, 0.9, 0.5, 'tone'],
    [3.1, 2.35, -0.1, 0.75, -0.4, 'accent'],
    [0.1, 2.55, 0.5, 0.85, 0.7, 'hueB'],
    [-1.4, 2.35, 0.45, 0.7, -0.6, 'accent'],
    [1.5, 2.3, 0.5, 0.75, 0.3, 'hueA'],
  ]

  // Each fruit: where its stem meets the bough, how far it drops, its shape.
  const fruit: Array<{
    id: string
    pivot: [number, number, number]
    drop: number
    r: number
    elong: number
    spikes: number
    body: string
    flame: string
  }> = [
    { id: 'skill-languages', pivot: [-3.0, 2.85, 0.75], drop: 0.55, r: 0.2, elong: 1.35, spikes: 6, body: '#e84c7d', flame: '#a8d8a0' },
    { id: 'skill-aiml', pivot: [-1.3, 2.55, 0.9], drop: 0.85, r: 0.23, elong: 1.05, spikes: 5, body: '#f0863a', flame: '#a8d8a0' },
    { id: 'skill-frameworks', pivot: [1.75, 2.8, 0.85], drop: 0.5, r: 0.2, elong: 1.5, spikes: 7, body: '#9d5cd6', flame: '#b8e0b0' },
    { id: 'skill-infra', pivot: [2.75, 2.75, 0.7], drop: 0.7, r: 0.21, elong: 1.2, spikes: 4, body: '#4a90d9', flame: '#a8d8a0' },
  ]

  return (
    <>
      <FractalPlane frozen={frozen} />
      <Ground mats={mats} />
      <mesh position={[0, -1.15, -12]} scale={[16, 3.5, 4]} material={mats.dim}>
        <sphereGeometry args={[1, 32, 20]} />
      </mesh>

      {/* trunk and boughs */}
      <InkShape shape={trunk} depth={0.55} material={mats.dim} position={[0, 0.9, 0]} scale={4.2} />

      {/* the crown, painted with the brush marks */}
      {foliage.map(([x, y, z, sc, rot, mat], i) => (
        <Drift key={`${x},${y}`} amount={0.05} speed={0.35} phase={x * 2.1}>
          <CanopySprite
            variant={i}
            tint={mats[mat].color}
            position={[x, y, z]}
            scale={sc * 1.6}
            flip={i % 2 === 1}
            rotation={rot * 0.4}
          />
        </Drift>
      ))}

      {/* the fruit: pick one. dragon fruit, because this tree can. */}
      {fruit.map((f, i) => (
        <Hotspot key={f.id} id={f.id} enabled={explore}>
          <group position={f.pivot}>
            <Hanging drop={f.drop} phase={i * 1.9} stem={mats.dim}>
              <group position={[0, -f.r * f.elong, 0]}>
                <DragonFruit body={f.body} flame={f.flame} r={f.r} elong={f.elong} spikes={f.spikes} />
              </group>
            </Hanging>
          </group>
        </Hotspot>
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

      {/* the stamps board, planted beside the tree */}
      <Hotspot id="skill-stamps" enabled={explore}>
        <group position={[-4.1, 0.05, 0.6]} rotation={[0, 0.4, 0]}>
          <mesh position={[0, -0.8, -0.06]} material={mats.dim}>
            <boxGeometry args={[0.12, 0.8, 0.12]} />
          </mesh>
          <mesh position={[0, 0.55, 0]} material={mats.dim}>
            <boxGeometry args={[2.15, 1.95, 0.08]} />
          </mesh>
          <mesh position={[0, 0.55, 0.03]} material={mats.paper}>
            <boxGeometry args={[1.99, 1.79, 0.04]} />
          </mesh>
          <Text
            font={delaWoff}
            sdfGlyphSize={128}
            fontSize={0.24}
            color="#0b0b0c"
            anchorX="center"
            anchorY="middle"
            position={[0, 1.3, 0.07]}
            letterSpacing={0.03}
          >
            stamps
          </Text>
          {achievements.map((a, i) => {
            const row = Math.floor(i / 3)
            const inRow = Math.min(3, achievements.length - row * 3)
            const col = i - row * 3
            const x = (col - (inRow - 1) / 2) * 0.62
            const y = 0.78 - row * 0.62
            return (
              <group key={`${a.stamp}-${i}`} position={[x, y, 0.07]}>
                <mesh rotation={[Math.PI / 2, 0, 0]} material={badgeMats[i]} userData={{ inkSticker: true }}>
                  <cylinderGeometry args={[0.24, 0.24, 0.04, 24]} />
                </mesh>
                {[-1, 1].map((side) => (
                  <mesh
                    key={side}
                    position={[side * 0.06, -0.3, -0.01]}
                    rotation={[0, 0, side * 0.25]}
                    material={mats.tone}
                  >
                    <boxGeometry args={[0.09, 0.16, 0.02]} />
                  </mesh>
                ))}
                <Text
                  font={monoWoff}
                  sdfGlyphSize={128}
                  fontSize={0.085}
                  color="#0b0b0c"
                  anchorX="center"
                  anchorY="middle"
                  position={[0, 0, 0.03]}
                  letterSpacing={0.04}
                >
                  {a.stamp}
                </Text>
              </group>
            )
          })}
        </group>
      </Hotspot>

      {/* his desk, waiting back inside */}
      <Door to="/origin">
        <group position={[4.6, -0.55, 0.2]} rotation={[0, -0.5, 0]} scale={0.8}>
          <mesh position={[0, 0.05, 0]} material={mats.paper}>
            <boxGeometry args={[1.7, 0.12, 0.9]} />
          </mesh>
          {[-0.7, 0.7].map((x) => (
            <mesh key={x} position={[x, -0.35, 0]} material={mats.dim}>
              <boxGeometry args={[0.1, 0.7, 0.8]} />
            </mesh>
          ))}
          <mesh position={[-0.1, 0.55, -0.15]} material={mats.paper}>
            <boxGeometry args={[0.85, 0.6, 0.06]} />
          </mesh>
          <mesh position={[0.55, 0.58, -0.15]} material={mats.dim}>
            <cylinderGeometry args={[0.02, 0.02, 0.94, 8]} />
          </mesh>
          <mesh position={[0.35, 1.05, -0.15]} material={mats.paper}>
            <boxGeometry args={[1.75, 0.3, 0.06]} />
          </mesh>
          <Text
            font={monoWoff}
            sdfGlyphSize={128}
            fontSize={0.12}
            color="#0b0b0c"
            anchorX="center"
            anchorY="middle"
            position={[0.35, 1.05, -0.11]}
            letterSpacing={0.06}
          >
            {'back to the desk →'}
          </Text>
        </group>
      </Door>

      <Figure pose="point" position={[2.9, -0.2, 1.4]} height={1.9} rotation={[0, -0.5, 0]} flip />
    </>
  )
}

/* ---------------------------------------------------------------- closing */

/**
 * The last page as a front stoop: a real entrance, built the way one is
 * actually built — a dark stone surround with pilasters and a lintel, a
 * lighter recess set into it, the door centred in that recess, sconces
 * flanking at chest height, planters at the base, a step underfoot. Every
 * prop reads as ARCHITECTURE around the door, not as objects floating on a
 * flat wall — that's what makes a threshold read as a threshold.
 *
 * Click the door: home. Click the peephole: X, in a new tab. The mailbox
 * mounts to the right pilaster like real mail slots do; a hand-written note
 * points at it, because nobody has ever once clicked a mailbox unprompted.
 * The skateboard leans against the left pilaster, resting on the step —
 * everything that doesn't fit on any other page lives here.
 */
function ClosingScene({ mats, explore }: { mats: Mats; explore: boolean }) {
  const board = useMemo(() => skateboardTop(), [])
  const leafShape = useMemo(() => leafCluster(), [])
  const { note } = usePresence()
  const openTwitter = (event: { stopPropagation: () => void }) => {
    event.stopPropagation()
    if (socials.twitter) window.open(socials.twitter, '_blank', 'noreferrer')
  }

  // True-colour materials: the foliage stays green and the pot stays terracotta
  // instead of flattening into the chapter's purple plate.
  const leaf = useMemo(
    () => new THREE.MeshToonMaterial({ color: '#4f9d5c', gradientMap: makeToonGradient(3), toneMapped: false }),
    [],
  )
  const pot = useMemo(
    () => new THREE.MeshToonMaterial({ color: '#b5673a', gradientMap: makeToonGradient(3), toneMapped: false }),
    [],
  )
  const noteCard = useMemo(
    () => new THREE.MeshToonMaterial({ color: '#1a1712', gradientMap: makeToonGradient(3), toneMapped: false }),
    [],
  )

  const Planter = ({ x }: { x: number }) => (
    <group position={[x, -2.25, 0.5]}>
      <mesh position={[0, 0.18, 0]} material={pot}>
        <cylinderGeometry args={[0.24, 0.18, 0.36, 14]} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <InkShape
          key={i}
          shape={leafShape}
          depth={0.04}
          material={leaf}
          position={[Math.cos(i * 1.3) * 0.08, 0.5 + i * 0.03, Math.sin(i * 1.3) * 0.08]}
          rotation={[0.3, i, 0]}
          scale={0.42}
        />
      ))}
    </group>
  )

  return (
    <>
      <Backdrop name="bg-wash-02" tint={mats.accent.color} />

      {/* the wall, filling the frame edge to edge at any viewport width */}
      <mesh position={[0, 1, -2.6]} material={mats.accent}>
        <boxGeometry args={[26, 14, 0.2]} />
      </mesh>
      <Ground mats={mats} />
      <mesh position={[0.6, -2.35, -1.5]} material={mats.accentDeep}>
        <boxGeometry args={[4.6, 0.5, 1.3]} />
      </mesh>
      {/* the path, leading up to the step from wherever you're standing */}
      <mesh position={[0.6, -1.14, 3.5]} material={mats.dim}>
        <boxGeometry args={[1.5, 0.02, 10]} />
      </mesh>
      {[-0.55, 0.55].map((dx) => (
        <mesh key={dx} position={[0.6 + dx, -1.13, 3.5]} material={mats.paper}>
          <boxGeometry args={[0.08, 0.02, 10]} />
        </mesh>
      ))}

      {/* the entrance, as one built assembly: surround, lintel, pilasters,
          recess, then the door inset into all of it */}
      <group position={[0.6, 0.2, -2.0]}>
        {/* the stone surround — dark, proud of the wall, the whole entrance's
            frame — with a lintel capping it */}
        <mesh position={[0, 0, -0.1]} material={mats.accentDeep}>
          <boxGeometry args={[3.7, 5.4, 0.3]} />
        </mesh>
        <mesh position={[0, 2.85, 0.05]} material={mats.accentDeep}>
          <boxGeometry args={[4.1, 0.55, 0.5]} />
        </mesh>
        {/* the plaque on the lintel */}
        <mesh position={[0, 2.85, 0.32]} material={mats.accentDeep}>
          <boxGeometry args={[1.7, 0.3, 0.05]} />
        </mesh>
        <Text
          font={delaWoff}
          sdfGlyphSize={128}
          fontSize={0.2}
          color="#f7f6f3"
          anchorX="center"
          anchorY="middle"
          position={[0, 2.85, 0.36]}
          letterSpacing={0.08}
        >
          1006
        </Text>

        {/* the recess: a lighter field set into the surround, the way stucco
            or cream stone sits inside a dark stone case */}
        <mesh position={[0, -0.1, 0.02]} material={mats.paper}>
          <boxGeometry args={[3.1, 4.9, 0.14]} />
        </mesh>

        {/* pilasters flanking the door, each with a capital at the top */}
        {[-1.1, 1.1].map((x) => (
          <group key={x} position={[x, 0, 0.16]}>
            <mesh material={mats.accentDeep}>
              <boxGeometry args={[0.36, 4.6, 0.14]} />
            </mesh>
            <mesh position={[0, 2.28, 0]} material={mats.accentDeep}>
              <boxGeometry args={[0.52, 0.22, 0.18]} />
            </mesh>
            <mesh position={[0, -2.28, 0]} material={mats.accentDeep}>
              <boxGeometry args={[0.5, 0.16, 0.16]} />
            </mesh>
          </group>
        ))}

        {/* the sconces, symmetric, chest height, each throwing a warm disc
            of light onto the surround behind it */}
        {[-1.1, 1.1].map((x) => (
          <group key={x} position={[x, 0.55, 0.28]}>
            <mesh position={[0, 0.16, 0]} material={mats.dim}>
              <boxGeometry args={[0.14, 0.1, 0.06]} />
            </mesh>
            <mesh position={[0, 0, 0.05]} rotation={[Math.PI, 0, 0]} material={mats.paper}>
              <sphereGeometry args={[0.13, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            <mesh position={[0, 0, -0.03]} material={mats.hueA} userData={{ inkSticker: true }}>
              <circleGeometry args={[0.14, 20]} />
            </mesh>
          </group>
        ))}

        {/* the door itself, inset into the recess */}
        <Door to="/">
          <group position={[0, -0.15, 0.2]}>
            <mesh material={mats.accentDeep}>
              <boxGeometry args={[1.7, 4.2, 0.14]} />
            </mesh>
            <mesh position={[0, 0, 0.08]} material={mats.dim}>
              <boxGeometry args={[1.5, 4.0, 0.06]} />
            </mesh>

            {/* the glazed upper panel — a tinted pane behind a mullion grid,
                the way a real front door carries glass up top */}
            <mesh position={[0, 1.1, 0.12]} material={mats.hueA} userData={{ inkSticker: true }}>
              <boxGeometry args={[1.1, 1.3, 0.03]} />
            </mesh>
            <mesh position={[0, 1.1, 0.14]} material={mats.dim}>
              <boxGeometry args={[0.05, 1.3, 0.02]} />
            </mesh>
            <mesh position={[0, 1.1, 0.14]} material={mats.dim}>
              <boxGeometry args={[1.1, 0.05, 0.02]} />
            </mesh>

            {/* two lower panels, moulded */}
            {[0.05, -1.35].map((y) => (
              <group key={y} position={[0, y, 0.12]}>
                {[
                  [0, 0.42, 0.98, 0.06],
                  [0, -0.42, 0.98, 0.06],
                  [-0.46, 0, 0.06, 0.9],
                  [0.46, 0, 0.06, 0.9],
                ].map(([x, py, w, h], i) => (
                  <mesh key={i} position={[x, py, 0]} material={mats.dim}>
                    <boxGeometry args={[w, h, 0.03]} />
                  </mesh>
                ))}
              </group>
            ))}

            {/* the peephole — its own door, elsewhere */}
            <mesh position={[0, 1.95, 0.12]} material={mats.dim}>
              <torusGeometry args={[0.06, 0.015, 8, 16]} />
            </mesh>
            <mesh
              position={[0, 1.95, 0.13]}
              rotation={[Math.PI / 2, 0, 0]}
              material={mats.dim}
              onPointerOver={(event) => {
                event.stopPropagation()
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={(event) => {
                event.stopPropagation()
                document.body.style.cursor = ''
              }}
              onClick={openTwitter}
            >
              <cylinderGeometry args={[0.04, 0.04, 0.04, 14]} />
            </mesh>

            {/* handle */}
            <mesh position={[0.62, -0.3, 0.12]} material={mats.dim}>
              <boxGeometry args={[0.08, 0.32, 0.015]} />
            </mesh>
            <mesh position={[0.62, -0.3, 0.15]} material={mats.dim}>
              <sphereGeometry args={[0.05, 10, 8]} />
            </mesh>

            {/* kick plate */}
            <mesh position={[0, -1.98, 0.1]} material={mats.dim}>
              <boxGeometry args={[1.4, 0.24, 0.02]} />
            </mesh>
          </group>
        </Door>

        {/* the mailbox, mounted flush to the right pilaster's face — not
            floating out on the wall on its own. z is pushed proud of the
            pilaster's own front face (z 0.16, depth 0.14 -> front at 0.23);
            0.26 left only 0.03 of clearance, which z-fought into a ghost. */}
        <Hotspot id="contact-envelope" enabled={explore}>
          <group position={[1.1, -1.0, 0.34]}>
            <mesh material={noteCard} userData={{ inkSticker: true }}>
              <boxGeometry args={[0.5, 0.36, 0.2]} />
            </mesh>
            <mesh position={[0, 0.16, 0.08]} rotation={[0.3, 0, 0]} material={mats.accentDeep}>
              <boxGeometry args={[0.54, 0.04, 0.24]} />
            </mesh>
            <mesh position={[0, 0.02, 0.11]} material={mats.accentDeep}>
              <boxGeometry args={[0.32, 0.035, 0.01]} />
            </mesh>
            <Text
              font={delaWoff}
              sdfGlyphSize={128}
              fontSize={0.09}
              color="#f7f6f3"
              anchorX="center"
              anchorY="middle"
              position={[0, -0.08, 0.11]}
              letterSpacing={0.02}
            >
              {'say hi'}
            </Text>
          </group>
        </Hotspot>

        {/* the note, pinned to the recess above the mailbox, arrow pointing
            straight down at it. z matched the pilaster's own centre before,
            burying the note inside the solid pilaster — moved level with
            the mailbox instead. */}
        <group position={[1.1, -0.35, 0.34]} rotation={[0, 0, -0.05]}>
          {/* "dim" reads as near-white once anything sits flat-lit against
              this recess — white text on it (the previous #f7f6f3) was
              genuinely invisible. Forcing this card to a true dark card
              guarantees the text always has something to contrast against. */}
          <mesh material={noteCard} userData={{ inkSticker: true }}>
            <boxGeometry args={[0.62, 0.34, 0.02]} />
          </mesh>
          <mesh position={[-0.24, 0.12, 0.02]} material={mats.hueA} userData={{ inkSticker: true }}>
            <sphereGeometry args={[0.03, 8, 6]} />
          </mesh>
          <Text
            font={delaWoff}
            sdfGlyphSize={128}
            fontSize={0.075}
            color="#f7f6f3"
            anchorX="center"
            anchorY="middle"
            position={[0.02, 0.04, 0.03]}
            letterSpacing={0.01}
          >
            click here
          </Text>
          <mesh position={[0, -0.14, 0.02]} rotation={[0, 0, -Math.PI / 2]} material={mats.hueA} userData={{ inkSticker: true }}>
            <coneGeometry args={[0.05, 0.14, 3]} />
          </mesh>
        </group>

        {/* the skateboard, leaned against the left pilaster where it meets
            the step. Raising the group's own y wasn't enough on its own —
            the board is 1.35 units tall (skateboardTop scaled), so even
            with its centre above the Ground plane (y -1.15), its bottom
            edge (centre - half-height) was still dipping below it. */}
        <Hotspot id="contact-offpanel" enabled={explore}>
          <group position={[-1.55, -0.6, 0.5]} rotation={[-0.22, 0, 0.14]}>
            <InkShape shape={board} depth={0.04} material={mats.paper} scale={1.35} />
            <mesh position={[0, 0, 0.022]} material={mats.tone}>
              <boxGeometry args={[0.06, 1.0, 0.006]} />
            </mesh>
            {[0.37, -0.37].map((y) => (
              <group key={y} position={[0, y, 0.05]}>
                <mesh material={mats.dim}>
                  <boxGeometry args={[0.33, 0.045, 0.05]} />
                </mesh>
                {[-0.18, 0.18].map((x) => (
                  <mesh key={x} position={[x, 0, 0.05]} rotation={[0, 0, Math.PI / 2]} material={mats.dim}>
                    <cylinderGeometry args={[0.065, 0.065, 0.05, 12]} />
                  </mesh>
                ))}
              </group>
            ))}
          </group>
        </Hotspot>

        {/* the planters, one each side of the step */}
        <Planter x={-1.9} />
        <Planter x={1.9} />
      </group>

      {/* a little sandwich-board sign, propped against the step, carrying
          the one line of the site that knows what time it is where you are */}
      <group position={[2.5, -1.75, -1.1]} rotation={[0.18, -0.3, 0]}>
        <mesh material={mats.dim} userData={{ inkSticker: true }}>
          <boxGeometry args={[1.3, 0.85, 0.04]} />
        </mesh>
        {/* true colour, not flattened tone: the halftone dot screen this
            board would otherwise wear outside the bloom is exactly what made
            this text unreadable at a glance */}
        <mesh position={[0, 0, 0.03]} material={mats.paper} userData={{ inkSticker: true }}>
          <boxGeometry args={[1.16, 0.71, 0.02]} />
        </mesh>
        <Text
          font={delaWoff}
          sdfGlyphSize={128}
          fontSize={0.08}
          color="#0b0b0c"
          anchorX="center"
          anchorY="middle"
          position={[0, 0, 0.045]}
          maxWidth={1.0}
          textAlign="center"
          lineHeight={1.25}
          letterSpacing={0.01}
        >
          {note}
        </Text>
      </group>
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
      {/* Clapperboard's own body sits 0.65 below its group origin — this
          local y was landing its bottom edge at world y -1.4, well below
          the Ground plane at -1.15 (the same drowning bug the skateboard
          and mailbox had in the closing scene). */}
      <group position={[-1.55, -0.45, 1.3]} rotation={[0.1, 0.7, 0.55]}>
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

/**
 * Cover B opens here: the room where sessions happen. The walls do the
 * navigation — every door says where it goes — and the standing invitation
 * hangs as a board, not paint. Sofas face each other across the rug, the amp
 * has its own corner with the mic, and the guitar waits on its stand.
 */
function SessionScene({ mats, explore }: { mats: Mats; explore: boolean }) {
  const doors: Array<{ to: string; x: number; slab: keyof Mats; label: string; w: number }> = [
    { to: '/direction', x: -4.6, slab: 'hueB', label: 'direction →', w: 1.35 },
    { to: '/prints', x: -2.85, slab: 'accent', label: 'the prints →', w: 1.45 },
    { to: '/studio', x: 3.35, slab: 'hueA', label: 'studio →', w: 1.1 },
    { to: '/origin', x: 5.1, slab: 'tone', label: 'the tech side →', w: 1.7 },
  ]
  const posters: Array<[number, number, number, number, 'accent' | 'hueA' | 'hueB']> = [
    [-1.0, 0.75, 1.0, 0.03, 'accent'],
    [0.3, 0.7, 0.95, -0.04, 'hueA'],
    [1.6, 0.75, 1.0, 0.05, 'hueB'],
  ]

  return (
    <>
      <Ground mats={mats} />

      {/* the room: paper back wall, dim side walls just catching the frame */}
      <mesh position={[0, 1.6, -3.8]} material={mats.paper}>
        <boxGeometry args={[13, 7, 0.2]} />
      </mesh>
      {[-6.4, 6.4].map((x) => (
        <mesh key={x} position={[x, 1.6, -0.4]} rotation={[0, Math.PI / 2, 0]} material={mats.dim}>
          <boxGeometry args={[7, 7, 0.2]} />
        </mesh>
      ))}
      <mesh position={[0, -1.0, -3.68]} material={mats.dim}>
        <boxGeometry args={[13, 0.3, 0.06]} />
      </mesh>
      <directionalLight position={[-4, 2.2, 2.5]} intensity={0.5} />

      {/* doors, each saying where it goes */}
      {doors.map((d) => (
        <Door key={d.to} to={d.to}>
          <group position={[d.x, 0.1, -3.66]}>
            <mesh material={mats.dim}>
              <boxGeometry args={[1.5, 2.5, 0.14]} />
            </mesh>
            <mesh position={[0, -0.02, 0.05]} material={mats[d.slab]}>
              <boxGeometry args={[1.26, 2.28, 0.08]} />
            </mesh>
            <mesh position={[0.44, -0.2, 0.11]} material={mats.paper}>
              <sphereGeometry args={[0.06, 10, 8]} />
            </mesh>
            <mesh position={[0, 1.48, 0.05]} material={mats.paper}>
              <boxGeometry args={[d.w * 1.15, 0.36, 0.06]} />
            </mesh>
            <Text
              font={monoBoldWoff}
              sdfGlyphSize={128}
              fontSize={0.17}
              color="#0b0b0c"
              anchorX="center"
              anchorY="middle"
              position={[0, 1.48, 0.09]}
              letterSpacing={0.05}
            >
              {d.label}
            </Text>
          </group>
        </Door>
      ))}

      {/* the standing invitation — a board hung from a nail, not paint */}
      <group position={[0.3, 2.7, -3.64]} rotation={[0, 0, 0.012]}>
        <mesh material={mats.accent}>
          <boxGeometry args={[4.14, 0.92, 0.06]} />
        </mesh>
        <mesh position={[0, 0.36, 0.035]} material={mats.paper}>
          <boxGeometry args={[4.14, 0.06, 0.02]} />
        </mesh>
        <Text
          font={delaWoff}
          sdfGlyphSize={128}
          fontSize={0.32}
          color="#f7f6f3"
          anchorX="center"
          anchorY="middle"
          position={[0, -0.07, 0.05]}
          letterSpacing={0.01}
          maxWidth={3.9}
        >
          colour outside the lines
        </Text>
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * 0.8, 0.745, 0]}
            rotation={[0, 0, side * 1.32]}
            material={mats.dim}
          >
            <boxGeometry args={[0.02, 1.65, 0.02]} />
          </mesh>
        ))}
        <mesh position={[0, 0.95, 0.02]} material={mats.dim}>
          <sphereGeometry args={[0.045, 8, 6]} />
        </mesh>
      </group>

      {/* gig posters under it: a colour field, a record, the line-up */}
      {posters.map(([x, w, h, tilt, pic]) => (
        <group key={x} position={[x, 1.35, -3.65]} rotation={[0, 0, tilt]}>
          <mesh material={mats[pic]}>
            <boxGeometry args={[w, h, 0.03]} />
          </mesh>
          <mesh position={[0, h * 0.16, 0.02]} rotation={[Math.PI / 2, 0, 0]} material={mats.paper}>
            <cylinderGeometry args={[w * 0.27, w * 0.27, 0.02, 24]} />
          </mesh>
          <mesh position={[0, h * 0.16, 0.035]} rotation={[Math.PI / 2, 0, 0]} material={mats[pic]}>
            <cylinderGeometry args={[w * 0.06, w * 0.06, 0.02, 12]} />
          </mesh>
          <mesh position={[0, -h * 0.34, 0.02]} material={mats.paper}>
            <boxGeometry args={[w * 0.8, h * 0.2, 0.02]} />
          </mesh>
          {[0.04, -0.04].map((ly) => (
            <mesh key={ly} position={[0, -h * 0.34 + ly * h, 0.035]} material={mats.tone}>
              <boxGeometry args={[w * 0.55, 0.02, 0.01]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* the rug that holds the session together */}
      <mesh position={[0.3, -1.11, 0.4]} material={mats.accent}>
        <cylinderGeometry args={[2.1, 2.1, 0.04, 28]} />
      </mesh>

      <Hotspot id="session-guitar" enabled={explore}>
        <group>
          <group position={[-1.6, -0.62, -1.9]} rotation={[0, 0.3, 0]}>
            <Amp mats={mats} />
          </group>
          {/* guitar on its stand, under the posters */}
          <group position={[0.9, -0.55, -1.6]} rotation={[0.06, -0.15, 0.1]} scale={0.66}>
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
              position={[-1.3 + i * 0.5, -1.06, -1.75 + Math.sin(i * 1.8) * 0.15]}
              rotation={[-Math.PI / 2, 0, i * 0.9]}
              material={mats.dim}
            >
              <boxGeometry args={[0.55, 0.04, 0.02]} />
            </mesh>
          ))}
        </group>
      </Hotspot>

      {/* the open mic — off to the side by the amp, boom aimed at him */}
      <Hotspot id="session-collab" enabled={explore}>
        <group position={[-2.7, 0, -0.2]} rotation={[0, 0.6, 0]}>
          <MicStand mats={mats} />
        </group>
      </Hotspot>

      {/* sofas facing each other across the rug, because sessions have listeners */}
      {[
        [3.9, 1.4, -0.95],
        [-3.9, 1.4, 0.95],
      ].map(([x, z, ry], i) => (
        <group key={`${x},${z}`} position={[x, -1.0, z]} rotation={[0, ry, 0]}>
          <mesh position={[0, 0.1, 0]} material={i === 0 ? mats.accent : mats.hueA}>
            <boxGeometry args={[1.95, 0.5, 0.9]} />
          </mesh>
          <mesh position={[0, 0.55, -0.32]} material={i === 0 ? mats.accent : mats.hueA}>
            <boxGeometry args={[1.95, 0.65, 0.26]} />
          </mesh>
          {[-0.85, 0.85].map((ax) => (
            <mesh key={ax} position={[ax, 0.32, 0]} material={mats.dim}>
              <boxGeometry args={[0.25, 0.62, 0.9]} />
            </mesh>
          ))}
          {[-0.42, 0.42].map((cx) => (
            <mesh key={cx} position={[cx, 0.42, 0.05]} material={mats.paper}>
              <boxGeometry args={[0.75, 0.16, 0.7]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* the stool he's sitting on, mid-session */}
      <group position={[-0.2, -0.72, 0.75]}>
        <mesh position={[0, 0.28, 0]} material={mats.dim}>
          <cylinderGeometry args={[0.26, 0.22, 0.06, 16]} />
        </mesh>
        {[
          [-0.18, -0.18],
          [0.18, -0.18],
          [-0.18, 0.18],
          [0.18, 0.18],
        ].map(([lx, lz]) => (
          <mesh key={`${lx},${lz}`} position={[lx, 0, lz]} material={mats.dim}>
            <cylinderGeometry args={[0.025, 0.025, 0.56, 8]} />
          </mesh>
        ))}
      </group>

      {/* him, sitting, mid-session — lowered onto the stool, legs tucked
          out of sight behind the seat the way a flat cutout has to fake it */}
      <Figure pose="guitar" position={[-0.2, -0.62, 0.85]} height={1.55} rotation={[0, -0.15, 0]} />
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
 * The blog IS the board: cork edge to edge, no room around it. Every post is
 * a card pinned straight to the viewport, clickable through to the post. A
 * new markdown file is a new card — the board reads the same source as the
 * page.
 */
function BoardScene({ mats }: { mats: Mats }) {
  const pinned = notes.slice(0, 9)
  // Cork in its own colour (sticker channel), so the board reads as a board.
  const cork = useMemo(
    () => new THREE.MeshToonMaterial({ color: '#c99a5f', gradientMap: makeToonGradient(3), toneMapped: false }),
    [],
  )
  return (
    <>
      {/* cork past every edge of the frame */}
      <mesh position={[0, 1.1, -3.4]} material={cork} userData={{ inkSticker: true }}>
        <boxGeometry args={[17, 10, 0.15]} />
      </mesh>

      {/* the nameplate, pinned top centre */}
      <group position={[0, 3.85, -3.28]} rotation={[0, 0, -0.008]}>
        <mesh material={mats.paper}>
          <boxGeometry args={[2.6, 0.78, 0.06]} />
        </mesh>
        <Text
          font={delaWoff}
          sdfGlyphSize={128}
          fontSize={0.5}
          color="#0b0b0c"
          anchorX="center"
          anchorY="middle"
          position={[0, -0.02, 0.05]}
          letterSpacing={0.04}
        >
          blog
        </Text>
        {[-1.15, 1.15].map((x) => (
          <mesh key={x} position={[x, 0.28, 0.05]} material={mats.accent}>
            <sphereGeometry args={[0.05, 10, 8]} />
          </mesh>
        ))}
      </group>

      {pinned.map((note, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        const x = (col - 1) * 3.5 + (row % 2 ? 0.5 : -0.3)
        const y = 1.55 - row * 2.0
        const tilt = [0.045, -0.035, 0.025, -0.05][i % 4]
        return (
          <Door key={note.slug} to={`/notes/${note.slug}`}>
            <group position={[x, y, -3.22]} rotation={[0, 0, tilt]}>
              <mesh material={mats.paper}>
                <boxGeometry args={[2.9, 1.7, 0.04]} />
              </mesh>
              <mesh position={[0, 0.8, 0.07]} material={mats.accent}>
                <sphereGeometry args={[0.075, 10, 8]} />
              </mesh>
              <Text
                font={monoWoff}
                sdfGlyphSize={128}
                fontSize={0.21}
                color="#0b0b0c"
                anchorX="center"
                anchorY="middle"
                position={[0, 0.14, 0.04]}
                maxWidth={2.5}
                textAlign="center"
                lineHeight={1.3}
              >
                {note.title}
              </Text>
              <Text
                font={monoWoff}
                sdfGlyphSize={128}
                fontSize={0.14}
                color="#6b6862"
                anchorX="center"
                anchorY="middle"
                position={[0, -0.58, 0.04]}
                letterSpacing={0.08}
              >
                {`${note.date} · read →`}
              </Text>
            </group>
          </Door>
        )
      })}
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
