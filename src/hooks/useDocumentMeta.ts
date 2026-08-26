import { useEffect } from 'react'

/**
 * Per-route title and social metadata.
 *
 * v1 shipped one static <title> for every route, so a shared link to a project
 * showed "Durva Sharma — Volume 02" instead of naming the project. On a site
 * whose whole point is being shared, that is a real cost for ~30 lines.
 */

function setMeta(selector: string, attr: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    const [, key, val] = /\[([a-z]+)="([^"]+)"\]/.exec(selector) ?? []
    if (key && val) el.setAttribute(key, val)
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

export function useDocumentMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title
    setMeta('meta[name="description"]', 'content', description)
    setMeta('meta[property="og:title"]', 'content', title)
    setMeta('meta[property="og:description"]', 'content', description)
    setMeta('meta[property="og:type"]', 'content', 'website')
    setMeta('meta[name="twitter:card"]', 'content', 'summary')
  }, [title, description])
}
