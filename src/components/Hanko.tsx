import { motion } from 'framer-motion'

type Props = {
  label: string
  delay?: number
}

export function Hanko({ label, delay = 0 }: Props) {
  return (
    <motion.span
      className="hanko"
      aria-label={label}
      initial={{ scale: 1.6, opacity: 0, rotate: -28 }}
      whileInView={{ scale: 1, opacity: 1, rotate: -12 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 260, damping: 16, delay }}
    >
      {label}
    </motion.span>
  )
}
