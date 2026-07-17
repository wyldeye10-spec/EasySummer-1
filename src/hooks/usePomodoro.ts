import { useState, useRef, useCallback, useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore'

type PomodoroState = 'idle' | 'running' | 'paused' | 'finished'

export function usePomodoro() {
  const minutes = useSettingsStore(s => s.settings.pomodoroMinutes)
  const [state, setState] = useState<PomodoroState>('idle')
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    setState('running')
    setSecondsLeft(minutes * 60)
  }, [minutes])

  const pause = useCallback(() => {
    setState('paused')
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  const resume = useCallback(() => {
    setState('running')
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setSecondsLeft(minutes * 60)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [minutes])

  const tick = useCallback(() => {
    setSecondsLeft(prev => {
      if (prev <= 1) {
        setState('finished')
        if (intervalRef.current) clearInterval(intervalRef.current)
        return 0
      }
      return prev - 1
    })
  }, [])

  useEffect(() => {
    if (state === 'running') {
      intervalRef.current = setInterval(tick, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [state, tick])

  const displayMinutes = Math.floor(secondsLeft / 60)
  const displaySeconds = secondsLeft % 60

  return {
    state,
    secondsLeft,
    displayMinutes,
    displaySeconds,
    progress: 1 - secondsLeft / (minutes * 60),
    start,
    pause,
    resume,
    reset,
  }
}
