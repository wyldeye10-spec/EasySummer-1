import { useEffect } from 'react'
import { useUIStore } from '../../store/uiStore'
import { useSettingsStore } from '../../store/settingsStore'
import { getGreeting } from '../../utils/date'

export function TopBar() {
  const mode = useUIStore(s => s.mode)
  const toggleMode = useUIStore(s => s.toggleMode)
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

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('summer-planner-dark-mode')
      if (saved === 'true' && !darkMode) {
        toggleDarkMode()
      }
    } catch { /* ignore */ }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const today = new Date()
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][today.getDay()]
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]

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
              className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-lg transition-all duration-300 ease-out ${
                mode === 'study'
                  ? 'left-0.5 bg-gradient-to-br from-study-400 to-study-500 shadow-md'
                  : 'left-[calc(50%+1.5px)] bg-gradient-to-br from-work-400 to-work-500 shadow-md'
              }`}
            />
            <button
              onClick={() => toggleMode()}
              className={`relative px-3 py-1.5 text-sm rounded-lg transition-colors duration-300 z-10 ${
                mode === 'study' ? 'text-white font-medium' : 'text-warm-500'
              }`}
            >
              📚 学习
            </button>
            <button
              onClick={() => toggleMode()}
              className={`relative px-3 py-1.5 text-sm rounded-lg transition-colors duration-300 z-10 ${
                mode === 'work' ? 'text-white font-medium' : 'text-warm-500'
              }`}
            >
              💼 工作
            </button>
          </div>

          {/* Dark Mode */}
          <button
            onClick={toggleDarkMode}
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
