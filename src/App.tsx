import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { Dashboard } from './components/dashboard/Dashboard'
import { QuadrantView } from './components/quadrant/quadrantView'
import { MonthlyJournal } from './components/journal/MonthlyJournal'
import { Settings } from './components/settings/Settings'
import { Trash } from './components/settings/Trash'
import { DailySummaryModal } from './components/dashboard/DailySummaryModal'
import { useDailySummary } from './hooks/useDailySummary'

// Use HashRouter for static file deployment (file:// or no server SPA fallback),
// BrowserRouter for dev (Vite dev server handles fallback).
const Router = import.meta.env.PROD ? HashRouter : BrowserRouter

function DailySummaryHandler() {
  const { showModal, dismiss, saveSummary, todos } = useDailySummary()

  if (!showModal) return null

  return (
    <DailySummaryModal
      todos={todos}
      onSave={saveSummary}
      onDismiss={dismiss}
    />
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <DailySummaryHandler />
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/quadrant" element={<QuadrantView />} />
            <Route path="/journal" element={<MonthlyJournal />} />
            <Route path="/journal/:year/:month" element={<MonthlyJournal />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/trash" element={<Trash />} />
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}
