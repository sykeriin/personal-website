import { useCallback, useState } from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { Layout } from './components/Layout'
import { OpeningIntro, shouldPlayIntro } from './components/OpeningIntro'
import { Cover } from './pages/Cover'
import { Origin } from './pages/Origin'
import { Training } from './pages/Training'
import { Projects } from './pages/Projects'
import { ProjectDetail } from './pages/ProjectDetail'
import { SkillTree } from './pages/SkillTree'
import { Contact } from './pages/Contact'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Cover /> },
      { path: 'origin', element: <Origin /> },
      { path: 'training', element: <Training /> },
      { path: 'projects', element: <Projects /> },
      { path: 'projects/:slug', element: <ProjectDetail /> },
      { path: 'skill-tree', element: <SkillTree /> },
      { path: 'contact', element: <Contact /> },
      { path: 'battles', element: <Navigate to="/projects" replace /> },
      { path: 'battles/:slug', element: <Navigate to="/projects" replace /> },
    ],
  },
])

export default function App() {
  const [introDone, setIntroDone] = useState(() => !shouldPlayIntro())
  const handleIntroDone = useCallback(() => setIntroDone(true), [])

  return (
    <>
      <OpeningIntro onDone={handleIntroDone} />
      <div className={introDone ? 'app-ready' : 'app-waiting'} aria-hidden={!introDone}>
        <RouterProvider router={router} />
      </div>
    </>
  )
}
