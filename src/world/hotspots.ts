import { useSyncExternalStore } from 'react'
import { achievements, creative, experiences, origin, projects, skills, site, socials, funThings } from '../data/content'

/**
 * Bridges the 3D world and the DOM. R3F renders through its own reconciler, so
 * a click on a mesh cannot reach a DOM panel through React context — this is a
 * tiny external store instead, which both trees can subscribe to.
 *
 * Deliberately not zustand: it is only transitively present via drei, and
 * depending on a transitive dependency is fragile for ~30 lines of code.
 */

type State = { hovered: string | null; active: string | null }

let state: State = { hovered: null, active: null }
const listeners = new Set<() => void>()

function set(next: Partial<State>) {
  const merged = { ...state, ...next }
  if (merged.hovered === state.hovered && merged.active === state.active) return
  state = merged
  listeners.forEach((listener) => listener())
}

/** Installed by Layout; lets meshes navigate. A no-op until the router mounts. */
export const worldNav = { go: (_path: string) => {} }

export const hotspots = {
  hover: (id: string | null) => set({ hovered: id }),
  activate: (id: string | null) => set({ active: id, hovered: null }),
  clear: () => set({ active: null, hovered: null }),
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** getSnapshot must return a stable reference between changes or React loops. */
function snapshot() {
  return state
}

export function useHotspots(): State {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}

/* ---------------------------------------------------------------- reveals */

export type Reveal = {
  id: string
  eyebrow: string
  title: string
  body: string[]
  tags?: string[]
  link?: { to: string; label: string; external?: boolean }
  /** A row of them, for reveals that ARE link collections (say hi). */
  links?: Array<{ to: string; label: string; external?: boolean }>
}

function build(): Record<string, Reveal> {
  const map: Record<string, Reveal> = {}

  map['cover-tech'] = {
    id: 'cover-tech',
    eyebrow: 'Volume 02 · cover a',
    title: 'the tech side',
    body: [site.coverLine],
    link: { to: '/origin', label: 'open cover a' },
  }

  map['cover-creative'] = {
    id: 'cover-creative',
    eyebrow: 'Volume 02 · cover b',
    title: 'the creative side',
    body: ['flip the volume over: modelling, directing shoots and videos, designing the thing.'],
    link: { to: '/studio', label: 'flip to cover b' },
  }

  origin.panels.forEach((panel, i) => {
    map[`origin-${i}`] = {
      id: `origin-${i}`,
      eyebrow: 'Chapter 01',
      title: panel.title,
      body: [panel.body],
    }
  })

  experiences.forEach((job) => {
    map[`exp-${job.id}`] = {
      id: `exp-${job.id}`,
      eyebrow: `${job.period} · ${job.role}`,
      title: job.org,
      body: [job.headline, ...job.story],
      link: job.url ? { to: job.url, label: `visit ${job.org.toLowerCase()}`, external: true } : undefined,
    }
  })

  projects.forEach((project) => {
    // The case card: a teaser that picks the project up off its plinth.
    map[`proj-${project.slug}`] = {
      id: `proj-${project.slug}`,
      eyebrow: project.award ? `Chapter 03 · ${project.award}` : 'Chapter 03',
      title: project.title,
      body: [project.tagline, project.blurb],
      tags: project.stack,
      link: { to: `/projects/${project.slug}`, label: 'pick it up' },
    }
    // The story, once it is in your hands on /projects/:slug. Without this the
    // detail page's reveal was the same teaser, whose link pointed at the page
    // you were already on — a genuine dead end.
    map[`story-${project.slug}`] = {
      id: `story-${project.slug}`,
      eyebrow: project.award ? `p. ${project.page} · ${project.award}` : `p. ${project.page}`,
      title: project.title,
      body: project.story,
      tags: project.stack,
      link: project.url
        ? { to: project.url, label: 'open the live thing', external: true }
        : { to: '/projects', label: 'put it back' },
    }
  })

  const groups: Array<[string, string, string[]]> = [
    ['languages', 'languages', skills.languages],
    ['aiml', 'ai / ml', skills.aiml],
    ['frameworks', 'frameworks', skills.frameworks],
    ['infra', 'infra', skills.infra],
  ]
  groups.forEach(([key, title, items]) => {
    map[`skill-${key}`] = {
      id: `skill-${key}`,
      eyebrow: 'Extra',
      title,
      body: [`${items.length} of them.`],
      tags: items,
    }
  })

  map['skill-stamps'] = {
    id: 'skill-stamps',
    eyebrow: 'Extra',
    title: 'stamps i earned',
    body: achievements.map((a) => `${a.stamp} — ${a.label}`),
  }

  for (const [chapter, data] of Object.entries(creative.chapters)) {
    data.panels.forEach((panel) => {
      map[`${chapter}-${panel.id}`] = {
        id: `${chapter}-${panel.id}`,
        eyebrow: `Cover B · ${data.title}`,
        title: panel.title,
        body: [panel.body],
        link: 'see' in panel ? { ...panel.see } : undefined,
      }
    })
  }

  map['contact-envelope'] = {
    id: 'contact-envelope',
    eyebrow: 'Last Page',
    title: 'say hi',
    body: ["wanna build something weird, talk ai stuff, or trade muay thai tips? i'm around."],
    links: [
      { to: `mailto:${site.email}`, label: 'mail me', external: true },
      { to: socials.linkedin, label: 'linkedin', external: true },
      { to: socials.github, label: 'github', external: true },
      { to: socials.twitter, label: 'x', external: true },
      { to: socials.instagram, label: 'instagram', external: true },
    ].filter((entry) => entry.to && entry.to !== 'mailto:'),
    link: { to: `mailto:${site.email}`, label: 'mail me', external: true },
  }

  map['contact-offpanel'] = {
    id: 'contact-offpanel',
    eyebrow: 'Last Page',
    title: 'off-panel',
    body: [funThings, `rn: ${site.currentlyBuilding}`],
  }

  return map
}

export const reveals = build()

/** Which props are pickable on a given route. Drives the keyboard list too. */
export function hotspotsForRoute(pathname: string): string[] {
  if (pathname === '/') return ['cover-tech', 'cover-creative']
  if (pathname === '/origin') return origin.panels.map((_, i) => `origin-${i}`)
  if (pathname === '/training') return experiences.map((job) => `exp-${job.id}`)
  if (pathname === '/projects') return projects.map((project) => `proj-${project.slug}`)
  const detail = /^\/projects\/([a-z0-9-]+)\/?$/i.exec(pathname)
  if (detail) return [`story-${detail[1]}`]
  if (pathname === '/skill-tree') {
    return ['skill-languages', 'skill-aiml', 'skill-frameworks', 'skill-infra', 'skill-stamps']
  }
  if (pathname === '/contact') return ['contact-envelope', 'contact-offpanel']
  if (pathname === '/studio') return ['studio-modelling', 'studio-shoots']
  if (pathname === '/direction') return ['direction-webdesign', 'direction-video']
  if (pathname === '/session') return ['session-guitar', 'session-collab']
  return []
}
