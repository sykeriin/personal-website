/**
 * The blog's entire backend: markdown files in src/content/notes, named
 * YYYY-MM-DD-slug.md with a title/date frontmatter block. Writing a post is
 * adding a file; there is no CMS to log into and nothing to deploy separately.
 */

const raw = import.meta.glob('./notes/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

export type Note = {
  slug: string
  title: string
  date: string
  body: string
}

function parse(path: string, text: string): Note {
  const file = path.split('/').pop() ?? path
  const slug = file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '')

  let title = slug.replace(/-/g, ' ')
  let date = /^(\d{4}-\d{2}-\d{2})/.exec(file)?.[1] ?? ''
  let body = text

  const fm = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text)
  if (fm) {
    body = text.slice(fm[0].length)
    for (const line of fm[1].split(/\r?\n/)) {
      const [key, ...rest] = line.split(':')
      const value = rest.join(':').trim()
      if (key.trim() === 'title' && value) title = value
      if (key.trim() === 'date' && value) date = value
    }
  }
  return { slug, title, date, body }
}

export const notes: Note[] = Object.entries(raw)
  .map(([path, text]) => parse(path, text))
  .sort((a, b) => b.date.localeCompare(a.date))

export function noteBySlug(slug: string): Note | undefined {
  return notes.find((note) => note.slug === slug)
}
