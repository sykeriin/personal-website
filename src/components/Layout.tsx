import { AnimatePresence, motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import { Nav } from './Nav'
import { usePerformanceMode } from '../hooks/usePerformanceMode'

export function Layout() {
  const location = useLocation()
  const isCover = location.pathname === '/'
  const { reduceMotion } = usePerformanceMode()

  return (
    <div className="app-shell">
      {!isCover && <Nav />}
      <div className="page-outlet">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className="page-turn"
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, rotateY: 14, x: 40 }
            }
            animate={{ opacity: 1, rotateY: 0, x: 0 }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, rotateY: -14, x: -40 }
            }
            transition={{ duration: reduceMotion ? 0.15 : 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
