import { useEffect } from 'react'
import { flushSync } from 'react-dom'
import { useUIStore } from '../../store/uiStore'
import { useSettingsStore } from '../../store/settingsStore'
import { getGreeting } from '../../utils/date'
import { useAutoDarkMode } from '../../hooks/useAutoDarkMode'
import { CATEGORY_SWITCH_OPTIONS } from '../../constants'
import type { AppMode } from '../../types'

const MODE_GRADIENTS: Record<AppMode, string> = {
  study: 'bg-gradient-to-br from-study-400 to-study-500',
  work: 'bg-gradient-to-br from-work-400 to-work-500',
  life: 'bg-gradient-to-br from-life-400 to-life-500',
  other: 'bg-gradient-to-br from-other-400 to-other-500',
}

export function TopBar() {
  const mode = useUIStore(s => s.mode)
  const setMode = useUIStore(s => s.setMode)
  const darkMode = useUIStore(s => s.darkMode)
  const toggleDarkMode = useUIStore(s => s.toggleDarkMode)
  const quotes = useSettingsStore(s => s.settings.motivationalQuotes)

  // Sync dark mode class to <html> and persist to localStorage
  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    try {
      localStorage.setItem('summer-planner-dark-mode', String(darkMode))
    } catch { /* ignore */ }
  }, [darkMode])

  const today = new Date()
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][today.getDay()]
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]

  // Auto dark mode
  const { markUserOverride } = useAutoDarkMode()

  // Toggle dark mode with a GPU-accelerated cross-fade (View Transitions API).
  // Fallback: instant flip when the browser doesn't support View Transitions.
  const handleToggleDarkMode = () => {
    markUserOverride()
    const root = document.documentElement
    const nextDark = !darkMode

    const applyChange = () => {
      root.classList.toggle('dark', nextDark)
      // flushSync so the 🌙/☀️ icon and any `darkMode`-driven UI re-render
      // synchronously — otherwise they'd be captured in the "new" snapshot in
      // their old state and pop in after the cross-fade finishes.
      flushSync(() => {
        toggleDarkMode()
      })
      try { localStorage.setItem('summer-planner-dark-mode', String(nextDark)) } catch { /* ignore */ }
    }

    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> }
    }
    if (typeof doc.startViewTransition === 'function') {
      // Freeze per-element transitions for the duration of the cross-fade so
      // the active nav pill / inputs don't flash (see .theme-changing in CSS).
      root.classList.add('theme-changing')
      const vt = doc.startViewTransition(() => applyChange())
      vt.finished.finally(() => root.classList.remove('theme-changing'))
    } else {
      applyChange()
    }
  }

  const modeIndex = CATEGORY_SWITCH_OPTIONS.findIndex(o => o.key === mode)

  return (
    <header className="sticky top-0 z-30 glass-strong border-b border-warm-200/60 dark:bg-warm-900/85 dark:border-warm-700/40">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold gradient-text">暑期规划</h1>
            <p className="text-xs text-warm-500">{getGreeting()}</p>
          </div>
          <span className="text-sm text-warm-500 hidden sm:inline px-3 py-1 bg-warm-100/80 rounded-full">
            {dateStr} {weekday}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Toggle with animated slider */}
          <div className="flex bg-warm-200/60 rounded-xl p-0.5 relative">
            <div
              className={`absolute top-0.5 bottom-0.5 rounded-lg transition-all duration-300 ease-out shadow-md ${MODE_GRADIENTS[mode]}`}
              style={{
                width: `calc(${100 / CATEGORY_SWITCH_OPTIONS.length}% - 3px)`,
                left: `calc(${modeIndex * (100 / CATEGORY_SWITCH_OPTIONS.length)}% + 2px)`,
              }}
            />
            {CATEGORY_SWITCH_OPTIONS.map(({ key, label, emoji }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`relative flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors duration-300 z-10 whitespace-nowrap ${
                  mode === key ? 'text-white font-medium' : 'text-warm-500'
                }`}
              >
                {emoji} {label}
              </button>
            ))}
          </div>

          {/* Dark Mode */}
          <button
            onClick={handleToggleDarkMode}
            className="p-2 text-lg hover-lift rounded-xl transition-all"
            title={darkMode ? '切换日间模式' : '切换夜间模式'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
      {/* Motivational Quote Bar */}
      <div className="text-center pb-2.5 text-sm text-warm-400 italic animate-fade-in">
        「{randomQuote}」
      </div>
    </header>
  )
}
