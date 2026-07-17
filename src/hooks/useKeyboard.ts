import { useEffect, useCallback } from 'react'

type KeyHandler = (e: KeyboardEvent) => void

interface Shortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  handler: KeyHandler
}

export function useKeyboard(shortcuts: Shortcut[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      for (const s of shortcuts) {
        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase()
        const ctrlMatch = s.ctrl ? (e.ctrlKey || e.metaKey) : true
        const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey

        if (keyMatch && ctrlMatch && shiftMatch) {
          e.preventDefault()
          s.handler(e)
          return
        }
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
