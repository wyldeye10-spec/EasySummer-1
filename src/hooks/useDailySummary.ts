import { useState, useEffect, useCallback, useRef } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { useTodoStore } from '../store/todoStore'
import type { DailySummary } from '../types'
import * as ops from '../db/storage'
import { nanoid } from 'nanoid'

export function useDailySummary() {
  const [showModal, setShowModal] = useState(false)
  const settingsLoaded = useSettingsStore(s => s.loaded)
  const dailySummaryTime = useSettingsStore(s => s.settings.dailySummaryTime)
  const todos = useTodoStore(s => s.todos)
  const lastCheckDate = useRef<string>('')
  const triggeredToday = useRef(false)

  const checkTime = useCallback(() => {
    if (!settingsLoaded || triggeredToday.current) return

    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Reset trigger at midnight
    if (lastCheckDate.current !== today) {
      lastCheckDate.current = today
      triggeredToday.current = false
    }

    if (triggeredToday.current) return

    const [h, m] = dailySummaryTime.split(':').map(Number)
    if (now.getHours() === h && now.getMinutes() === m) {
      triggeredToday.current = true
      setShowModal(true)
    }
  }, [settingsLoaded, dailySummaryTime])

  // Check every minute
  useEffect(() => {
    const interval = setInterval(checkTime, 60_000)
    return () => clearInterval(interval)
  }, [checkTime])

  const dismiss = useCallback(() => {
    setShowModal(false)
  }, [])

  const openManually = useCallback(() => {
    setShowModal(true)
  }, [])

  const saveSummary = useCallback(async (suggestion: string) => {
    const today = new Date().toISOString().split('T')[0]
    const todayTodos = todos.filter(t => {
      if (t.parentId) return false
      return t.createdAt.startsWith(today) || t.completedAt?.startsWith(today)
    })

    const summary: DailySummary = {
      id: nanoid(),
      date: today,
      completedIds: todayTodos.filter(t => t.status === 'completed').map(t => t.id),
      incompleteIds: todayTodos.filter(t => t.status === 'pending').map(t => t.id),
      suggestion,
      createdAt: new Date().toISOString(),
    }
    await ops.saveDailySummary(summary)
  }, [todos])

  return { showModal, dismiss, openManually, saveSummary, todos }
}
