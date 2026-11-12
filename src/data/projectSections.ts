import { projects } from './content'

// A project may span domains; its shelf is its main focus.
const sections = [
  { id: 'agents', title: 'agents & security', slugs: ['skillfuzz', 'taintmem', 'vdrift', 'swapcert', 'intentcheck'] },
  { id: 'research', title: 'ai & brain research', slugs: ['mondecay', 'beliefscreen', 'bci-steadyvoice', 'earsim', 'fly-drums'] },
  { id: 'systems', title: 'systems & infrastructure', slugs: ['tread', 'dpdp-guard', 'chainguard', 'cloudsense', 'roadsense', 'nidan-tdt', 'verdant'] },
  { id: 'creative', title: 'apps & creative', slugs: ['alter', 'commons', 'scenario', 'hike-m', 'shadowbox', 'arena'] },
] as const

const assigned = new Set<string>(sections.flatMap((section) => [...section.slugs]))
export const projectSections = sections.map((section, index) => ({
  ...section,
  projects: [
    ...section.slugs.map((slug) => projects.find((project) => project.slug === slug)).filter((project) => project !== undefined),
    ...(index === sections.length - 1 ? projects.filter((project) => !assigned.has(project.slug)) : []),
  ],
}))

