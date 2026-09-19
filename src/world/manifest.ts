import { projects } from '../data/content'

/**
 * One manifest for every route: nav order, pagination flavour, camera pose,
 * which prop cluster to mount, and per-route page metadata.
 *
 * Deliberately TOTAL. The v1 chapterMeta covered only five of the routes and
 * NextChapter silently rendered nothing for the rest — a whole bug class born
 * from a partial map. Every reachable path has an entry here, including the
 * cover, project details and the 404.
 */

/**
 * Poses are framed for a 32° lens (see WorldCanvas). A long lens flattens the
 * rooms the way a manga background does — parallel walls stay nearly parallel,
 * and a sofa at the edge of frame is not smeared into a trapezoid.
 */
export type CameraPose = {
  position: [number, number, number]
  target: [number, number, number]
}

export type VolumeSide = 'tech' | 'creative' | 'shared'

export type RouteEntry = {
  path: string
  /** Which cover of the tête-bêche volume this page belongs to. The book has
      two fronts; flipping it swaps the fore-edge tabs and the plate family. */
  side: VolumeSide
  /** Chapter eyebrow, e.g. "Chapter 01". */
  label: string
  /** Chapter name, e.g. "Origin". */
  title: string
  /** Manga pagination flavour, inked into the page corner. */
  page: string
  /** Fore-edge tab text. Lowercase, in voice. */
  tab: string | null
  prev?: string
  next?: string
  camera: CameraPose
  /** Which scene module the world mounts for this route. */
  scene: SceneKey
  /** Onomatopoeia planted in world space by the slam. */
  sfx: string
  /** This chapter's second ink. One plate per screen, rotating per chapter. */
  accent: string
  description: string
}

export type SceneKey =
  | 'cover'
  | 'desk'
  | 'workshop'
  | 'case'
  | 'artifact'
  | 'tree'
  | 'desk-closing'
  | 'studio'
  | 'direction'
  | 'session'
  | 'prints'
  | 'board'
  | 'void'

const ROUTES: RouteEntry[] = [
  {
    path: '/',
    side: 'shared',
    label: 'Volume 02',
    title: 'Durva Sharma',
    page: 'cover',
    tab: null,
    next: '/origin',
    camera: { position: [1.09, 1.56, 9.38], target: [0.15, 0.55, 0] },
    scene: 'cover',
    sfx: 'THUD',
    accent: '#d3103a',
    description: 'cse at mahe blr. i build apps, agents, and half-broken pipelines until they behave.',
  },
  {
    path: '/origin',
    side: 'tech',
    label: 'Chapter 01',
    title: 'Origin',
    page: 'p. 03',
    tab: '01 origin',
    prev: '/',
    next: '/training',
    camera: { position: [-2.4, 2.0, 9.7], target: [0.4, 0.45, -0.3] },
    scene: 'desk',
    sfx: 'HELLO',
    accent: '#ef8b1d',
    description: 'second year cse at mahe blr. what i am into, and what i do outside class.',
  },
  {
    path: '/training',
    side: 'tech',
    label: 'Chapter 02',
    title: 'Training Arc',
    page: 'p. 11',
    tab: '02 training',
    prev: '/origin',
    next: '/projects',
    camera: { position: [0.27, 2.34, 10.72], target: [0, 0.6, 0] },
    scene: 'workshop',
    sfx: 'CLANG',
    accent: '#12a5b8',
    description: 'petally internship, and leading opencv preprocessing on iaf runway debris detection.',
  },
  {
    path: '/projects',
    side: 'tech',
    label: 'Chapter 03',
    title: 'Projects',
    page: 'p. 19',
    tab: '03 projects',
    prev: '/training',
    next: '/skill-tree',
    camera: { position: [0, 1.49, 8.84], target: [0, 0.35, 0] },
    scene: 'case',
    sfx: 'BAM',
    accent: '#d3103a',
    description: 'five things that actually left the laptop — voice-first os, ota crypto, and more.',
  },
  {
    path: '/skill-tree',
    side: 'tech',
    label: 'Extra',
    title: 'Skill Tree',
    page: 'p. 41',
    tab: '04 skills',
    prev: '/projects',
    next: '/contact',
    camera: { position: [0.4, 2.84, 12.86], target: [0, 1.9, 0] },
    scene: 'tree',
    sfx: 'ZING',
    accent: '#3fae5f',
    description: 'languages, ai/ml, frameworks and infra — plus the stamps and the side quests.',
  },
  // ------------------------------------------------------------ creative side
  {
    path: '/session',
    side: 'creative',
    label: 'Cover B · 01',
    title: 'Session',
    page: 'p. B03',
    tab: 'b1 session',
    prev: '/',
    next: '/studio',
    camera: { position: [0, 1.7, 9.6], target: [0.2, 0.55, -0.3] },
    scene: 'session',
    sfx: 'STRUM',
    accent: '#5a48d6',
    description: 'the creative side opens here: guitar, sofas, and doors to the rest.',
  },
  {
    path: '/studio',
    side: 'creative',
    label: 'Cover B · 02',
    title: 'Studio',
    page: 'p. B11',
    tab: 'b2 studio',
    prev: '/session',
    next: '/direction',
    camera: { position: [-1.17, 1.77, 10.35], target: [0.3, 0.7, -0.5] },
    scene: 'studio',
    sfx: 'FLASH',
    accent: '#d81b7a',
    description: 'modelling, and directing photoshoots and videos.',
  },
  {
    path: '/direction',
    side: 'creative',
    label: 'Cover B · 03',
    title: 'Direction',
    page: 'p. B19',
    tab: 'b3 direction',
    prev: '/studio',
    next: '/contact',
    camera: { position: [0.87, 1.87, 10.12], target: [-0.2, 0.8, -0.6] },
    scene: 'direction',
    sfx: 'CUT',
    accent: '#e39b16',
    description: 'art direction for websites and video — ui/ux, storyboards, the whole vision.',
  },
  {
    path: '/prints',
    side: 'creative',
    label: 'Cover B · Insert',
    title: 'Prints',
    page: 'p. B27',
    tab: null,
    prev: '/direction',
    next: '/contact',
    camera: { position: [0.54, 1.57, 9.82], target: [0, 0.9, -0.5] },
    scene: 'prints',
    sfx: 'FLIP',
    accent: '#c2366b',
    description: 'the photo insert — shoots he modelled in or directed.',
  },
  {
    path: '/notes',
    side: 'shared',
    label: 'Margins',
    title: 'Blog',
    page: 'p. ‡',
    tab: 'nb blog',
    prev: '/skill-tree',
    next: '/contact',
    camera: { position: [0, 1.1, 8.59], target: [0, 1.1, -3.2] },
    scene: 'board',
    sfx: 'SCRIBBLE',
    accent: '#4a6d8c',
    description: 'longer things: build logs, shoot write-ups, 2am thoughts.',
  },
  {
    path: '/contact',
    side: 'shared',
    label: 'Last Page',
    title: 'To Be Continued…',
    page: 'p. 48',
    tab: 'say hi',
    prev: '/skill-tree',
    next: '/',
    camera: { position: [0.6, 0.05, 11.2], target: [0.6, 0.05, -0.2] },
    scene: 'desk-closing',
    sfx: 'SNAP',
    accent: '#8d4fc2',
    description: 'wanna build something weird, talk ai stuff, or trade muay thai tips? i am around.',
  },
]

export const routes = ROUTES

/**
 * Fore-edge tabs for the side of the volume currently being read. A tête-bêche
 * book shows a different fore-edge depending on which cover is up; shared pages
 * (the middle, where the two stories meet) appear on both.
 */
export function tabsFor(side: VolumeSide) {
  const visible = side === 'shared' ? 'tech' : side
  return ROUTES.filter((r) => r.tab !== null && (r.side === visible || r.side === 'shared'))
}

/** The identity colour of each cover, for the entry fork. */
export const sideAccent = { tech: '#d3103a', creative: '#d81b7a' } as const

const byPath = new Map(ROUTES.map((r) => [r.path, r]))

/** Each project carries its own plate, so the colour tells you where you are. */
export const PROJECT_ACCENTS: Record<string, string> = {
  alter: '#8d4fc2', // voice, ethereal
  chainguard: '#d3103a', // it won first
  verdant: '#3fae5f', // textiles, circular economy
  cloudsense: '#ef8b1d', // the invoice that hurts
  roadsense: '#12a5b8', // infrastructure
  shadowbox: '#1a1a1e', // mechs, broadcast dark
  arena: '#e8b13a', // scanned junk, arcade gold
}

/**
 * The /projects bookcase's own transform, and each volume's local position
 * on it — shared with CameraRig so a book-open hotspot can dolly the camera
 * to that exact spine instead of just cutting closer on the whole shelf.
 */
export const CASE_GROUP = { position: [0.2, -0.27, -1.7] as [number, number, number], scale: 0.8 }
export const PROJECT_BOOK_LOCAL: Record<string, { x: number; y: number }> = {
  alter: { x: -2.0, y: 0.68 },
  chainguard: { x: -1.62, y: 0.68 },
  verdant: { x: -1.28, y: 0.68 },
  cloudsense: { x: -0.6, y: -1.04 },
  roadsense: { x: -0.22, y: -1.04 },
  shadowbox: { x: 1.6, y: -1.04 },
  arena: { x: 2.3, y: -1.04 },
}

/** Template for /projects/:slug — the camera dives inside the chosen artifact. */
function projectEntry(slug: string): RouteEntry {
  const project = projects.find((p) => p.slug === slug)
  return {
    path: `/projects/${slug}`,
    label: 'Chapter 03',
    title: project?.title ?? 'Project',
    page: project ? `p. ${project.page}` : 'p. ??',
    tab: '03 projects',
    prev: '/projects',
    next: '/skill-tree',
    camera: { position: [0.2, 0.92, 6.43], target: [0.2, 0.45, 0] },
    scene: 'artifact',
    side: 'tech',
    sfx: 'FWSH',
    accent: PROJECT_ACCENTS[slug] ?? '#d3103a',
    description: project ? `${project.tagline}. ${project.blurb}` : 'A project from Volume 02.',
  }
}

export const notFound: RouteEntry = {
  path: '*',
  label: 'Missing Page',
  title: 'p. ??',
  page: 'p. ??',
  tab: null,
  prev: '/',
  camera: { position: [0, 1, 8.04], target: [0, 0.2, 0] },
  scene: 'void',
  side: 'shared',
  sfx: 'HUH',
  accent: '#b01030',
  description: "this page isn't in the volume.",
}

/** Never returns undefined — that is the whole point of a total manifest. */
export function entryFor(pathname: string): RouteEntry {
  const direct = byPath.get(pathname)
  if (direct) return direct

  const match = /^\/projects\/([a-z0-9-]+)\/?$/i.exec(pathname)
  if (match) return projectEntry(match[1])

  if (/^\/prints\/[a-z0-9-]+\/?$/i.test(pathname)) return byPath.get('/prints')!
  if (/^\/notes\/[a-z0-9-]+\/?$/i.test(pathname)) return byPath.get('/notes')!

  return notFound
}
