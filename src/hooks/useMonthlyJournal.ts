import { useState, useEffect, useCallback } from 'react'
import { nanoid } from 'nanoid'
import type { MonthlyJournal, MonthlyHighlight, MonthlyGoal } from '../types'
import * as ops from '../db/storage'

function emptyJournal(year: number, month: number): MonthlyJournal {
  return {
    id: `${year}-${String(month).padStart(2, '0')}`,
    year,
    month,
    highlights: [],
    nextGoals: [],
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Load + persist the per-month journal (highlights & next goals).
 * `year`/`month` come from the /journal/:year/:month route params.
 */
export function useMonthlyJournal(year: number, month: number) {
  const [journal, setJournal] = useState<MonthlyJournal>(() => emptyJournal(year, month))
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoaded(false)
    // Reset synchronously so navigating between months never flashes the
    // previous month's data while the new month loads.
    setJournal(emptyJournal(year, month))
    ops.getMonthlyJournal(year, month).then(j => {
      if (cancelled) return
      setJournal(j ?? emptyJournal(year, month))
      setLoaded(true)
    })
    return () => { cancelled = true }
  }, [year, month])

  // Each mutation writes through to storage immediately (upsert by month id).
  const addHighlight = useCallback((emoji: string, text: string) => {
    const item: MonthlyHighlight = { id: nanoid(), emoji, text }
    setJournal(prev => {
      const next: MonthlyJournal = { ...prev, highlights: [...prev.highlights, item], updatedAt: new Date().toISOString() }
      ops.saveMonthlyJournal(next)
      return next
    })
  }, [])

  const removeHighlight = useCallback((id: string) => {
    setJournal(prev => {
      const next: MonthlyJournal = { ...prev, highlights: prev.highlights.filter(h => h.id !== id), updatedAt: new Date().toISOString() }
      ops.saveMonthlyJournal(next)
      return next
    })
  }, [])

  const addGoal = useCallback((text: string) => {
    const item: MonthlyGoal = { id: nanoid(), text, done: false }
    setJournal(prev => {
      const next: MonthlyJournal = { ...prev, nextGoals: [...prev.nextGoals, item], updatedAt: new Date().toISOString() }
      ops.saveMonthlyJournal(next)
      return next
    })
  }, [])

  const toggleGoal = useCallback((id: string) => {
    setJournal(prev => {
      const next: MonthlyJournal = {
        ...prev,
        nextGoals: prev.nextGoals.map(g => (g.id === id ? { ...g, done: !g.done } : g)),
        updatedAt: new Date().toISOString(),
      }
      ops.saveMonthlyJournal(next)
      return next
    })
  }, [])

  const removeGoal = useCallback((id: string) => {
    setJournal(prev => {
      const next: MonthlyJournal = { ...prev, nextGoals: prev.nextGoals.filter(g => g.id !== id), updatedAt: new Date().toISOString() }
      ops.saveMonthlyJournal(next)
      return next
    })
  }, [])

  return {
    journal,
    loaded,
    highlights: journal.highlights,
    nextGoals: journal.nextGoals,
    addHighlight,
    removeHighlight,
    addGoal,
    toggleGoal,
    removeGoal,
  }
}
