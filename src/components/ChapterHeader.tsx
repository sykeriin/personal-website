import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle: string
}

export function ChapterHeader({ title, subtitle }: Props) {
  return (
    <motion.header
      className="chapter-header"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="chapter-header__meta">{title}</div>
      <h1 className="chapter-header__title">{subtitle}</h1>
    </motion.header>
  )
}

type PanelProps = {
  children: ReactNode
  className?: string
  delay?: number
  tilt?: boolean
}

export function MangaPanel({ children, className = '', delay = 0, tilt = true }: PanelProps) {
  return (
    <motion.article
      className={`manga-panel ${tilt ? 'manga-panel--tilt' : ''} ${className}`.trim()}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.article>
  )
}
