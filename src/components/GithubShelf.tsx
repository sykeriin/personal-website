import { useEffect, useState } from 'react'
import { socials } from '../data/content'

/**
 * The self-updating shelf: whatever he pushed most recently, straight from the
 * GitHub API at view time, so the projects page never goes stale between
 * rewrites of the curated five.
 *
 * Curation rule: if any repos carry the `showcase` topic, only those appear —
 * tagging a repo on GitHub is the entire publishing flow. With no tagged repos
 * it falls back to the four most recently pushed non-forks.
 *
 * Static host, so this is a client-side unauthenticated call: 60/hr per
 * visitor is plenty, a session cache keeps it to one call per visit, and any
 * failure renders nothing — the curated five above never depend on it.
 */

type Repo = {
  name: string
  html_url: string
  description: string | null
  language: string | null
  stargazers_count: number
  pushed_at: string
  fork: boolean
  topics?: string[]
}

const CACHE_KEY = 'inkwell-gh-shelf'
const CACHE_MS = 60 * 60 * 1000

function username(): string | null {
  const match = /github\.com\/([^/]+)/.exec(socials.github ?? '')
  return match?.[1] ?? null
}

function ago(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export function GithubShelf() {
  const [repos, setRepos] = useState<Repo[] | null>(null)

  useEffect(() => {
    const user = username()
    if (!user) return

    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? 'null') as {
        at: number
        repos: Repo[]
      } | null
      if (cached && Date.now() - cached.at < CACHE_MS) {
        setRepos(cached.repos)
        return
      }
    } catch {
      /* bad cache is the same as no cache */
    }

    const controller = new AbortController()
    fetch(`https://api.github.com/users/${user}/repos?sort=pushed&per_page=30`, {
      signal: controller.signal,
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((res) => (res.ok ? (res.json() as Promise<Repo[]>) : Promise.reject(res.status)))
      .then((all) => {
        const tagged = all.filter((repo) => repo.topics?.includes('showcase'))
        const picked = (tagged.length > 0 ? tagged : all.filter((repo) => !repo.fork)).slice(0, 4)
        setRepos(picked)
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), repos: picked }))
        } catch {
          /* private mode */
        }
      })
      .catch(() => setRepos(null))

    return () => controller.abort()
  }, [])

  if (!repos || repos.length === 0) return null

  return (
    <section className="shelf" aria-label="Fresh from GitHub">
      <div className="shelf__head">
        <h2>fresh off the desk</h2>
        <span>straight from github · updates itself</span>
      </div>
      {repos.map((repo) => (
        <a key={repo.name} className="shelf__row" href={repo.html_url} target="_blank" rel="noreferrer">
          <span className="shelf__name">{repo.name}</span>
          <span className="shelf__desc">{repo.description ?? 'no description yet. classic.'}</span>
          <span className="shelf__meta">
            {repo.language ? `${repo.language.toLowerCase()} · ` : ''}
            {repo.stargazers_count > 0 ? `★ ${repo.stargazers_count} · ` : ''}
            pushed {ago(repo.pushed_at)}
          </span>
        </a>
      ))}
    </section>
  )
}
