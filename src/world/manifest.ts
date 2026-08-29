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

export type CameraPose = {
  position: [number, number, number]
  target: [number, number, number]
}

export type RouteEntry = {
  path: string
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
  | 'void'

const ROUTES: RouteEntry[] = [
  {
    path: '/',
    label: 'Volume 02',
    title: 'Durva Sharma',
    page: 'cover',
    tab: null,
    next: '/origin',
    camera: { position: [1.6, 1.5, 7.8], target: [0.2, 0.55, 0] },
    scene: 'cover',
    sfx: 'THUD',
    accent: '#d3103a',
    description: 'cse at mahe. i build apps, agents, and half-broken pipelines until they behave.',
  },
  {
    path: '/origin',
    label: 'Chapter 01',
    title: 'Origin',
    page: 'p. 03',
    tab: '01 origin',
    prev: '/',
    next: '/training',
    camera: { position: [-1.0, 1.7, 7.2], target: [0.2, 0.5, -0.3] },
    scene: 'desk',
    sfx: 'HELLO',
    accent: '#ef8b1d',
    description: 'second year cse at mahe in bengaluru. what i am into, and what i do outside class.',
  },
  {
    path: '/training',
    label: 'Chapter 02',
    title: 'Training Arc',
    page: 'p. 11',
    tab: '02 training',
    prev: '/origin',
    next: '/projects',
    camera: { position: [0.2, 1.9, 8.0], target: [0, 0.6, 0] },
    scene: 'workshop',
    sfx: 'CLANG',
    accent: '#12a5b8',
    description: 'petally internship, and leading opencv preprocessing on iaf runway debris detection.',
  },
  {
    path: '/projects',
    label: 'Chapter 03',
    title: 'Projects',
    page: 'p. 19',
    tab: '03 projects',
    prev: '/training',
    next: '/skill-tree',
    camera: { position: [0, 1.2, 6.6], target: [0, 0.35, 0] },
    scene: 'case',
    sfx: 'BAM',
    accent: '#d3103a',
    description: 'five things that actually left the laptop — voice-first os, ota crypto, and more.',
  },
  {
    path: '/skill-tree',
    label: 'Extra',
    title: 'Skill Tree',
    page: 'p. 41',
    tab: 'ex skills',
    prev: '/projects',
    next: '/contact',
    camera: { position: [0.3, 2.6, 9.6], target: [0, 1.9, 0] },
    scene: 'tree',
    sfx: 'ZING',
    accent: '#3fae5f',
    description: 'languages, ai/ml, frameworks and infra — plus the stamps and the side quests.',
  },
  {
    path: '/contact',
    label: 'Last Page',
    title: 'To Be Continued…',
    page: 'p. 48',
    tab: 'end say hi',
    prev: '/skill-tree',
    next: '/',
    camera: { position: [0.8, 1.5, 7.0], target: [0.1, 0.55, -0.2] },
    scene: 'desk-closing',
    sfx: 'SNAP',
    accent: '#8d4fc2',
    description: 'wanna build something weird, talk ai stuff, or trade muay thai tips? i am around.',
  },
]

export const routes = ROUTES

/** Fore-edge tabs, in reading order. The cover has no tab; the wordmark links home. */
export const tabs = ROUTES.filter((r) => r.tab !== null)

const byPath = new Map(ROUTES.map((r) => [r.path, r]))

/** Each project carries its own plate, so the colour tells you where you are. */
const PROJECT_ACCENTS: Record<string, string> = {
  alter: '#8d4fc2', // voice, ethereal
  chainguard: '#d3103a', // it won first
  verdant: '#3fae5f', // textiles, circular economy
  cloudsense: '#ef8b1d', // the invoice that hurts
  roadsense: '#12a5b8', // infrastructure
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
    camera: { position: [0.2, 0.8, 4.8], target: [0.2, 0.45, 0] },
    scene: 'artifact',
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
  camera: { position: [0, 0.8, 6.0], target: [0, 0.2, 0] },
  scene: 'void',
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

  return notFound
}
