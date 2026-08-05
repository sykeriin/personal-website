import { Link } from 'react-router-dom'
import { ChapterHeader } from '../components/ChapterHeader'
import { Hanko } from '../components/Hanko'
import { NextChapter } from '../components/NextChapter'
import { projects } from '../data/content'
import { motion } from 'framer-motion'

export function Projects() {
  return (
    <main className="chapter">
      <ChapterHeader title="Chapter 03" subtitle="Projects" />
      <p style={{ marginTop: '-0.5rem', marginBottom: '1.5rem', maxWidth: '40rem' }}>
        Stuff that actually left my laptop. Tap one for the longer version.
      </p>
      <div className="volume-list">
        {projects.map((project, i) => (
          <motion.div
            key={project.slug}
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
          >
            <Link className="volume-row" to={`/projects/${project.slug}`}>
              <span className="volume-row__num">0{i + 1}</span>
              <div>
                <h2 className="volume-row__title">{project.title}</h2>
                <p className="volume-row__tag">{project.tagline}</p>
                {project.url ? <p className="volume-row__live">live demo</p> : null}
              </div>
              <div className="volume-row__right">
                {project.award ? <Hanko label={project.award} delay={0.1 + i * 0.05} /> : null}
                <span className="volume-row__page">p. {project.page}</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      <NextChapter path="/projects" />
    </main>
  )
}
