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
import { Prints } from './pages/Prints'
import { Notes, NotePost } from './pages/Notes'
import { Contact } from './pages/Contact'
import { NotFound } from './pages/NotFound'

/**
 * The entrance (EntryGate) is once-per-visitor, front door only, and
 * interactive in half a second — deliberately unlike v1's gate, which held
 * the whole router behind a 2.4s modal on every session, deep links included.
 * Deep links never see it; Esc skips it; the choice it asks doubles as the
 * render-tier prompt.
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
      { path: 'prints', element: <Prints /> },
      { path: 'prints/:cat', element: <Prints /> },
      { path: 'notes', element: <Notes /> },
      { path: 'notes/:slug', element: <NotePost /> },
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
