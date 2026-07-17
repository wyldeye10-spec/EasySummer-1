import { useEffect, useRef } from 'react'
import { useTodoStore } from '../store/todoStore'
import { useSettingsStore } from '../store/settingsStore'

export function useAutoSave() {
  const todos = useTodoStore(s => s.todos)
  const settings = useSettingsStore(s => s.settings)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastSaveRef = useRef<string>('')

  useEffect(() => {
    // Auto-save every 30 seconds if data changed
    const data = JSON.stringify({ todos, settings })
    if (data === lastSaveRef.current) return

    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        const current = JSON.stringify({
          todos: useTodoStore.getState().todos,
          settings: useSettingsStore.getState().settings,
        })
        if (current !== lastSaveRef.current) {
          localStorage.setItem('planner_autosave', current)
          localStorage.setItem('planner_autosave_time', new Date().toISOString())
          lastSaveRef.current = current
        }
      }, 30_000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [todos, settings])

  // Restore on mount
  useEffect(() => {
    const saved = localStorage.getItem('planner_autosave')
    if (saved) {
      try {
        lastSaveRef.current = saved
        const savedTime = localStorage.getItem('planner_autosave_time')
        if (savedTime) {
          console.log('Last auto-save:', new Date(savedTime).toLocaleString())
        }
      } catch {
        // ignore corrupted save
      }
    }
  }, [])
}
