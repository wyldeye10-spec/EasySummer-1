import { useEffect, useState, useMemo } from 'react'
import { usePomodoro } from '../../hooks/usePomodoro'
import { useUIStore } from '../../store/uiStore'
import { useTodoStore } from '../../store/todoStore'
import { useSettingsStore } from '../../store/settingsStore'

export function PomodoroTimer() {
  const mode = useUIStore(s => s.mode)
  const minutes = useSettingsStore(s => s.settings.pomodoroMinutes)
  const todos = useTodoStore(s => s.todos)
  const updateTodo = useTodoStore(s => s.updateTodo)
  const addToast = useUIStore(s => s.addToast)
  const { state, displayMinutes, displaySeconds, progress, start, pause, resume, reset } =
    usePomodoro()
  const [pulse, setPulse] = useState(false)
  const [showLogTime, setShowLogTime] = useState(false)
  const [selectedTodoId, setSelectedTodoId] = useState('')
  const [logMinutes, setLogMinutes] = useState(minutes)

  const pendingTodos = useMemo(
    () => todos.filter(t => t.status === 'pending' && !t.parentId),
    [todos]
  )

  useEffect(() => {
    if (state === 'finished') {
      setPulse(true)
      setLogMinutes(minutes)
      setShowLogTime(true)
      const t = setTimeout(() => setPulse(false), 2000)
      return () => clearTimeout(t)
    }
  }, [state, minutes])

  const handleLogTime = () => {
    if (selectedTodoId) {
      const todo = todos.find(t => t.id === selectedTodoId)
      if (todo) {
        const current = todo.actualMinutes || 0
        updateTodo(selectedTodoId, { actualMinutes: current + logMinutes })
        addToast(`✓ 已为「${todo.title.slice(0, 15)}...」记录 ${logMinutes} 分钟`)
      }
    }
    setShowLogTime(false)
    setSelectedTodoId('')
  }

  const handleSkip = () => {
    setShowLogTime(false)
    setSelectedTodoId('')
  }

  if (mode !== 'study') return null

  const display = `${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`
  const circumference = 2 * Math.PI * 42

  return (
    <div className={`glass rounded-2xl border border-warm-200/60 p-5 hover-lift transition-all duration-500 ${
      pulse ? 'ring-2 ring-emerald-300/50 shadow-lg shadow-emerald-200/30' : ''
    } ${state === 'running' ? 'ring-1 ring-study-300/50 shadow-lg shadow-study-200/20' : ''}`}>
      <h3 className="text-sm font-medium text-warm-600 mb-4 flex items-center gap-2">
        <span className={state === 'running' ? 'animate-bounce-gentle inline-block' : ''}>🍅</span>
        番茄钟
        {state === 'running' && (
          <span className="text-xs text-study-500 font-normal animate-pulse-soft">专注中...</span>
        )}
        {state === 'finished' && (
          <span className="text-xs text-emerald-500 font-normal">完成！</span>
        )}
      </h3>

      {/* Circular Timer */}
      <div className="flex flex-col items-center">
        <div className={`relative w-32 h-32 mb-4 transition-transform duration-500 ${
          state === 'running' ? 'scale-105' : ''
        }`}>
          {/* Glow behind the circle */}
          <div className={`absolute inset-0 rounded-full blur-md transition-all duration-500 ${
            state === 'running' ? 'bg-study-200/40 scale-110' :
            state === 'finished' ? 'bg-emerald-200/40 scale-110' :
            'bg-transparent scale-100'
          }`} />

          <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="currentColor"
              className="text-warm-200/60"
              strokeWidth="5"
            />
            {/* Progress ring */}
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="currentColor"
              className={`progress-ring-circle ${
                state === 'finished'
                  ? 'text-emerald-400'
                  : state === 'running'
                    ? 'text-study-500'
                    : 'text-warm-400'
              }`}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
            />
          </svg>
          {/* Center display */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <span className={`text-2xl font-mono font-bold transition-all duration-300 ${
              state === 'finished'
                ? 'text-emerald-500 animate-bounce-gentle'
                : state === 'running'
                  ? 'text-study-600'
                  : 'text-warm-700'
            }`}>
              {state === 'finished' ? '🎉' : display}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {state === 'idle' && (
            <button
              onClick={start}
              className="ripple-container relative px-5 py-2 bg-gradient-to-br from-study-400 to-study-500 text-white rounded-xl text-sm font-medium hover:from-study-500 hover:to-study-600 transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              开始 {minutes} 分钟
            </button>
          )}
          {state === 'running' && (
            <button
              onClick={pause}
              className="px-4 py-2 bg-warm-200/80 text-warm-700 rounded-xl text-sm font-medium hover:bg-warm-300 transition-all active:scale-95"
            >
              暂停
            </button>
          )}
          {state === 'paused' && (
            <>
              <button
                onClick={resume}
                className="px-4 py-2 bg-gradient-to-br from-study-400 to-study-500 text-white rounded-xl text-sm font-medium hover:from-study-500 hover:to-study-600 transition-all shadow-md active:scale-95"
              >
                继续
              </button>
              <button
                onClick={reset}
                className="px-4 py-2 bg-warm-200/80 text-warm-700 rounded-xl text-sm font-medium hover:bg-warm-300 transition-all active:scale-95"
              >
                重置
              </button>
            </>
          )}
          {state === 'finished' && (
            <button
              onClick={reset}
              className="px-5 py-2 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white rounded-xl text-sm font-medium hover:from-emerald-500 hover:to-emerald-600 transition-all shadow-md hover:shadow-lg active:scale-95 animate-bounce-gentle"
            >
              再来一个 🎉
            </button>
          )}
        </div>

        {/* Paused indicator */}
        {state === 'paused' && (
          <p className="text-xs text-warm-400 mt-2 animate-pulse-soft">已暂停</p>
        )}
      </div>

      {/* Post-session time logging modal */}
      {showLogTime && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in">
          <div className="glass-strong rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-scale-in">
            <h3 className="font-bold text-lg text-warm-800 dark:text-warm-200 mb-1">
              🍅 番茄钟完成！
            </h3>
            <p className="text-sm text-warm-500 dark:text-warm-400 mb-4">
              太棒了！要记录这次学习时间吗？
            </p>

            {/* Minutes input */}
            <label className="block text-xs font-medium text-warm-600 dark:text-warm-400 mb-1">
              时长（分钟）
            </label>
            <input
              type="number"
              value={logMinutes}
              onChange={e => setLogMinutes(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 mb-3 bg-warm-50/50 dark:bg-warm-800/50 border border-warm-200/60 dark:border-warm-700/40 rounded-xl text-sm text-warm-700 dark:text-warm-200 focus:outline-none focus:ring-2 focus:ring-warm-300/30"
              min={1}
              max={240}
            />

            {/* Link to todo */}
            <label className="block text-xs font-medium text-warm-600 dark:text-warm-400 mb-1">
              关联事项（可选）
            </label>
            <select
              value={selectedTodoId}
              onChange={e => setSelectedTodoId(e.target.value)}
              className="w-full px-3 py-2 mb-4 bg-warm-50/50 dark:bg-warm-800/50 border border-warm-200/60 dark:border-warm-700/40 rounded-xl text-sm text-warm-700 dark:text-warm-200 focus:outline-none focus:ring-2 focus:ring-warm-300/30"
            >
              <option value="">不关联</option>
              {pendingTodos.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title.slice(0, 30)}{t.title.length > 30 ? '...' : ''}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={handleLogTime}
                className="flex-1 px-4 py-2 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white rounded-xl text-sm font-medium hover:from-emerald-500 hover:to-emerald-600 transition-all shadow-md active:scale-95"
              >
                记录
              </button>
              <button
                onClick={handleSkip}
                className="px-4 py-2 bg-warm-100/80 dark:bg-warm-800/60 text-warm-600 dark:text-warm-400 rounded-xl text-sm font-medium hover:bg-warm-200 dark:hover:bg-warm-700 transition-all active:scale-95"
              >
                跳过
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
