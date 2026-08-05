import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { sfxTags } from '../data/content'

type Props = {
  dense?: boolean
}

export function SfxField({ dense = false }: Props) {
  const tags = useMemo(() => {
    const picks = dense ? 3 : 5
    return Array.from({ length: picks }, (_, i) => ({
      id: i,
      text: sfxTags[(i * 2 + 1) % sfxTags.length],
      top: 12 + ((i * 17) % 70),
      left: 6 + ((i * 23) % 80),
      rotate: -18 + i * 9,
      delay: 0.15 * i,
    }))
  }, [dense])

  return (
    <div className="sfx-field" aria-hidden="true">
      {tags.map((tag) => (
        <motion.span
          key={tag.id}
          className="sfx-tag"
          style={{
            top: `${tag.top}%`,
            left: `${tag.left}%`,
            transform: `rotate(${tag.rotate}deg)`,
          }}
          initial={{ opacity: 0, scale: 0.6 }}
          whileInView={{ opacity: 0.45, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: tag.delay, type: 'spring', stiffness: 200, damping: 14 }}
        >
          {tag.text}
        </motion.span>
      ))}
    </div>
  )
}
