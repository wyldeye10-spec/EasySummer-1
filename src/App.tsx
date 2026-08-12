import {
  RouterProvider,
  createBrowserRouter,
  createHashRouter,
} from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { Dashboard } from './components/dashboard/Dashboard'
import { QuadrantView } from './components/quadrant/quadrantView'
import { MonthlyJournal } from './components/journal/MonthlyJournal'
import { Settings } from './components/settings/Settings'
import { Trash } from './components/settings/Trash'
import { Overview } from './components/overview/Overview'

// Use hash history for static file deployment (file:// or no server SPA fallback),
// browser history for dev (Vite dev server handles fallback).
//
// We use the data-router variants (create*Router + <RouterProvider>) rather than
// the legacy <BrowserRouter>/<HashRouter> components. The legacy components
// silently ignore the `viewTransition` prop on <NavLink>; the data router honors
// it, which is what drives the smooth page cross-fade.
const createRouter = import.meta.env.PROD ? createHashRouter : createBrowserRouter

const routes = [
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/quadrant', element: <QuadrantView /> },
      { path: '/journal', element: <MonthlyJournal /> },
      { path: '/journal/:year/:month', element: <MonthlyJournal /> },
      { path: '/overview', element: <Overview /> },
      { path: '/settings', element: <Settings /> },
      { path: '/trash', element: <Trash /> },
    ],
  },
]

const router = createRouter(routes)

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}
