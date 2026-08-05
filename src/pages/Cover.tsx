import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CoverFallback } from '../components/cover/CoverFallback'
import { site } from '../data/content'
import { usePerformanceMode } from '../hooks/usePerformanceMode'

const CoverScene = lazy(() =>
  import('../components/cover/CoverScene').then((m) => ({ default: m.CoverScene })),
)

const chapters = [
  { n: '01', label: 'origin', to: '/origin' },
  { n: '02', label: 'training', to: '/training' },
  { n: '03', label: 'projects', to: '/projects' },
  { n: 'ex', label: 'skills', to: '/skill-tree' },
]

export function Cover() {
  const { useWebGL, dpr, reduceMotion } = usePerformanceMode()

  return (
    <section className="cover chapter--cover">
      {useWebGL ? (
        <Suspense fallback={<CoverFallback />}>
          <CoverScene dpr={dpr} />
        </Suspense>
      ) : (
        <CoverFallback />
      )}

      <div className="cover__wash" aria-hidden="true" />
      <div className="cover__slash" aria-hidden="true" />
      <p className="cover__watermark" aria-hidden="true">
        DURVA
      </p>

      <div className="cover__frame" aria-hidden="true" />
      <div className="cover__spine" aria-hidden="true">
        <span>VOL. 02</span>
        <span>CSE · MAHE</span>
        <span>BENGALURU</span>
      </div>

      <motion.div
        className="cover__stamp"
        aria-hidden="true"
        initial={reduceMotion ? false : { scale: 1.4, opacity: 0, rotate: -24 }}
        animate={{ scale: 1, opacity: 1, rotate: -14 }}
        transition={{ delay: 0.55, type: 'spring', stiffness: 220, damping: 14 }}
      >
        ISSUE
        <br />
        02
      </motion.div>

      <div className="cover__content">
        <motion.div
          className="cover__volume"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 0.8, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          personal site · year two
        </motion.div>

        <motion.h1
          className="cover__brand"
          initial={reduceMotion ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="cover__brand-line">DURVA</span>
          <span className="cover__brand-line cover__brand-line--accent">SHARMA</span>
        </motion.h1>

        <motion.p
          className="cover__hook"
          initial={reduceMotion ? false : { opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.22 }}
        >
          {site.coverHook}
        </motion.p>

        <motion.p
          className="cover__line"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 0.92 }}
          transition={{ delay: 0.32 }}
        >
          {site.coverLine}
        </motion.p>

        <motion.div
          className="btn-row"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
        >
          <Link className="btn" to="/origin">
            enter
          </Link>
          <Link className="btn btn--ghost" to="/projects">
            see projects
          </Link>
        </motion.div>

        <motion.ul
          className="cover__toc"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          {chapters.map((c) => (
            <li key={c.n}>
              <Link to={c.to}>
                <span>{c.n}</span>
                {c.label}
              </Link>
            </li>
          ))}
        </motion.ul>
      </div>

      <div className="cover__side-panels" aria-hidden="true">
        <div className="cover__mini-panel cover__mini-panel--a">
          <span>ch.01</span>
          origin
        </div>
        <div className="cover__mini-panel cover__mini-panel--b">
          <span>ch.03</span>
          projects
        </div>
      </div>
    </section>
  )
}
