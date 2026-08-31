import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Cover } from './pages/Cover'
import { Origin } from './pages/Origin'
import { Training } from './pages/Training'
import { Projects } from './pages/Projects'
import { ProjectDetail } from './pages/ProjectDetail'
import { SkillTree } from './pages/SkillTree'
import { Studio } from './pages/Studio'
import { Direction } from './pages/Direction'
import { Session } from './pages/Session'
import { Contact } from './pages/Contact'
import { NotFound } from './pages/NotFound'

/**
 * No intro gate. v1 held the entire router behind a 2.4s modal on every
 * session, deep links included — and layering a 3D warm-up behind that would
 * have stacked two loading gates in front of every visitor. The opening now
 * happens in-world on the cover instead, so the animation builds the interface
 * rather than covering it.
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <Layout />,
    children: [
      { index: true, element: <Cover /> },
      { path: 'origin', element: <Origin /> },
      { path: 'training', element: <Training /> },
      { path: 'projects', element: <Projects /> },
      { path: 'projects/:slug', element: <ProjectDetail /> },
      { path: 'skill-tree', element: <SkillTree /> },
      { path: 'studio', element: <Studio /> },
      { path: 'direction', element: <Direction /> },
      { path: 'session', element: <Session /> },
      { path: 'contact', element: <Contact /> },
      // v1 shipped these paths publicly; keep them resolving.
      { path: 'battles', element: <Navigate to="/projects" replace /> },
      { path: 'battles/:slug', element: <Navigate to="/projects" replace /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
