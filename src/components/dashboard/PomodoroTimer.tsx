import { useEffect, useState, useMemo, useRef } from 'react'
import { usePomodoro } from '../../hooks/usePomodoro'
import { useUIStore } from '../../store/uiStore'
import { useTodoStore } from '../../store/todoStore'
import { useSettingsStore } from '../../store/settingsStore'
import { notifyTimerComplete } from '../../utils/notification'

export function PomodoroTimer() {
  const mode = useUIStore(s => s.mode)
  const minutes = useSettingsStore(s => s.settings.pomodoroMinutes)
  const todos = useTodoStore(s => s.todos)
  const updateTodo = useTodoStore(s => s.updateTodo)
  const addToast = useUIStore(s => s.addToast)
  const darkMode = useUIStore(s => s.darkMode)
  const { state, displayMinutes, displaySeconds, progress, start, pause, resume, reset, finishEarly } =
    usePomodoro()
  const [pulse, setPulse] = useState(false)
  const [showLogTime, setShowLogTime] = useState(false)
  const [selectedTodoId, setSelectedTodoId] = useState('')
  const [logMinutes, setLogMinutes] = useState(minutes)
  const [confettiActive, setConfettiActive] = useState(false)
  const confettiPieces = useRef<Array<{ angle: number; dist: number; delay: number; color: string; size: number }>>([])
  const isEarlySettlement = useRef(false)
  const titleFlashRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const pendingTodos = useMemo(
    () => todos.filter(t => t.status === 'pending' && !t.parentId),
    [todos]
  )

  // Stop title flash
  const stopTitleFlash = () => {
    if (titleFlashRef.current) {
      clearInterval(titleFlashRef.current)
      titleFlashRef.current = null
      document.title = '暑期规划'
    }
  }

  useEffect(() => {
    if (state === 'finished') {
      setPulse(true)
      if (!isEarlySettlement.current) {
        setLogMinutes(minutes)
      }
      isEarlySettlement.current = false
      setShowLogTime(true)
      const t = setTimeout(() => setPulse(false), 2000)

      // Sound + browser notification
      notifyTimerComplete(logMinutes || minutes)

      // Title flash: alternate "🔔 时间到！" every 1s
      const originalTitle = document.title
      let flash = true
      titleFlashRef.current = setInterval(() => {
        document.title = flash ? '🔔 时间到！' : originalTitle
        flash = !flash
      }, 1000)
      // Auto-stop after 30s
      const tFlash = setTimeout(() => stopTitleFlash(), 30000)

      // Generate confetti particles
      const colors = darkMode
        ? ['#8ab4f8', '#81c995', '#c58af9', '#f28b82', '#fbbc04', '#669df6']
        : ['#4285f4', '#34a853', '#a142f4', '#ea4335', '#fbbc04', '#8ab4f8']
      confettiPieces.current = Array.from({ length: 16 }, (_, i) => ({
        angle: (i / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.3,
        dist: 40 + Math.random() * 50,
        delay: Math.random() * 0.4,
        color: colors[i % colors.length],
        size: 3 + Math.random() * 4,
      }))
      setConfettiActive(true)
      const t2 = setTimeout(() => setConfettiActive(false), 1500)
      return () => {
        clearTimeout(t)
        clearTimeout(t2)
        clearTimeout(tFlash)
        stopTitleFlash()
      }
    }
  }, [state, minutes, darkMode, logMinutes])

  const handleLogTime = () => {
    if (selectedTodoId) {
      const todo = todos.find(t => t.id === selectedTodoId)
      if (todo) {
        const current = todo.actualMinutes || 0
        const currentCount = todo.pomodoroCount || 0
        updateTodo(selectedTodoId, {
          actualMinutes: current + logMinutes,
          pomodoroCount: currentCount + 1,
        })
        addToast(`✓ 已为「${todo.title.slice(0, 15)}...」记录 ${logMinutes} 分钟（🍅×${currentCount + 1}）`)
      }
    }
    setShowLogTime(false)
    setSelectedTodoId('')
    stopTitleFlash()
  }

  const handleSkip = () => {
    setShowLogTime(false)
    setSelectedTodoId('')
    stopTitleFlash()
  }

  const handleReset = () => {
    stopTitleFlash()
    reset()
  }

  const handleFinishEarly = () => {
    const totalSeconds = minutes * 60
    const elapsed = totalSeconds - (displayMinutes * 60 + displaySeconds)
    const elapsedMinutes = Math.max(1, Math.ceil(elapsed / 60))
    setLogMinutes(elapsedMinutes)
    isEarlySettlement.current = true
    finishEarly()
  }

  if (mode === 'other') return null

  const display = `${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`
  const circumference = 2 * Math.PI * 42

  return (
    <div className={`glass rounded-2xl border p-5 hover-lift transition-all duration-500 ${
      state === 'running'
        ? 'border-study-300/60 dark:border-study-600/40 shadow-lg shadow-study-200/30 dark:shadow-study-900/20'
        : state === 'finished'
          ? pulse
            ? 'border-life-300/60 dark:border-life-600/40 ring-2 ring-life-300/50 dark:ring-life-600/30 shadow-xl shadow-life-200/40 dark:shadow-life-900/20'
            : 'border-life-200/40 dark:border-life-700/30'
          : 'border-warm-200/60 dark:border-warm-700/40'
    }`}>
      <h3 className="text-sm font-medium text-warm-600 mb-4 flex items-center gap-2">
        <span className={state === 'running' ? 'animate-bounce-gentle inline-block' : ''}>🍅</span>
        番茄钟
        {state === 'running' && (
          <span className="text-xs text-study-500 font-normal animate-pulse-soft">专注中...</span>
        )}
        {state === 'finished' && (
          <span className="text-xs text-life-500 font-normal">完成！</span>
        )}
      </h3>

      {/* Circular Timer */}
      <div className="flex flex-col items-center">
        <div className={`relative w-32 h-32 mb-4 transition-transform duration-500 ${
          state === 'running' ? 'animate-breathe' : ''
        } ${state === 'finished' ? 'animate-bounce-gentle' : ''}`}>
          {/* Glow layers behind the ring */}
          {/* Layer 1: dynamic intensity glow — intensifies with progress */}
          <div
            className={`absolute inset-0 rounded-full blur-xl transition-all duration-1000 ${
              state === 'running'
                ? 'bg-study-200/60 dark:bg-study-800/40'
                : state === 'finished'
                  ? 'bg-life-200/60 dark:bg-life-800/40 animate-glow-burst'
                  : 'bg-transparent'
            }`}
            style={state === 'running' ? { opacity: 0.3 + progress * 0.5 } : undefined}
          />

          {/* Layer 2: breathing pulse ring (running only) */}
          {state === 'running' && (
            <div className="absolute inset-0 rounded-full blur-md bg-study-300/30 dark:bg-study-600/20 animate-breathe" />
          )}

          {/* Ripple rings (running only) */}
          {state === 'running' && (
            <>
              <div
                className="absolute inset-0 rounded-full border-2 border-study-300/40 dark:border-study-500/30 pointer-events-none"
                style={{ animation: 'ripple-expand 3s ease-out infinite' }}
              />
              <div
                className="absolute inset-0 rounded-full border-2 border-study-300/30 dark:border-study-500/20 pointer-events-none"
                style={{ animation: 'ripple-expand 3s ease-out 1s infinite' }}
              />
              <div
                className="absolute inset-0 rounded-full border-2 border-study-300/20 dark:border-study-500/15 pointer-events-none"
                style={{ animation: 'ripple-expand 3s ease-out 2s infinite' }}
              />
            </>
          )}

          {/* Confetti burst on completion */}
          {confettiActive && confettiPieces.current.map((piece, i) => (
            <div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: `${piece.size}px`,
                height: `${piece.size}px`,
                backgroundColor: piece.color,
                left: '50%',
                top: '50%',
                marginLeft: `-${piece.size / 2}px`,
                marginTop: `-${piece.size / 2}px`,
                '--tx': `${Math.cos(piece.angle) * piece.dist}px`,
                '--ty': `${Math.sin(piece.angle) * piece.dist}px`,
                animation: `celebrate-particle 0.8s ease-out ${piece.delay}s forwards`,
                opacity: 0,
              } as React.CSSProperties}
            />
          ))}

          <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={darkMode ? '#669df6' : '#4285f4'} />
                <stop offset="100%" stopColor={darkMode ? '#8ab4f8' : '#669df6'} />
              </linearGradient>
              <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={darkMode ? '#4fb56a' : '#34a853'} />
                <stop offset="100%" stopColor={darkMode ? '#7bc58e' : '#4fb56a'} />
              </linearGradient>
            </defs>
            {/* Background ring */}
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="currentColor"
              className="text-warm-200/60 dark:text-warm-700/40"
              strokeWidth="5"
            />
            {/* Progress ring — gradient when running/finished */}
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke={
                state === 'running' ? 'url(#progressGradient)' :
                state === 'finished' ? 'url(#emeraldGradient)' :
                'currentColor'
              }
              className={`progress-ring-circle ${
                state === 'running' || state === 'finished' ? '' : 'text-warm-400'
              }`}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
            />
          </svg>
          {/* Center display */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            {state === 'finished' ? (
              <span className="text-2xl animate-bounce-gentle">🎉</span>
            ) : (
              <span className={`text-2xl font-mono font-bold transition-colors duration-300 ${
                state === 'running' ? 'text-study-600 dark:text-study-400' : 'text-warm-700 dark:text-warm-200'
              }`}>
                {display}
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {state === 'idle' && (
            <button
              onClick={start}
              className="ripple-container relative px-5 py-2 bg-study-600 text-white rounded-xl text-sm font-medium hover:bg-study-700 transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              开始 {minutes} 分钟
            </button>
          )}
          {state === 'running' && (
            <button
              onClick={pause}
              className="px-4 py-2 bg-warm-200/80 dark:bg-warm-800/60 text-warm-700 dark:text-warm-400 rounded-xl text-sm font-medium hover:bg-warm-300 dark:hover:bg-warm-700 transition-all active:scale-95"
            >
              暂停
            </button>
          )}
          {state === 'paused' && (
            <>
              <button
                onClick={resume}
                className="px-4 py-2 bg-study-600 text-white rounded-xl text-sm font-medium hover:bg-study-700 transition-all shadow-md active:scale-95"
              >
                继续
              </button>
              <button
                onClick={reset}
                className="px-4 py-2 bg-warm-200/80 dark:bg-warm-800/60 text-warm-700 dark:text-warm-400 rounded-xl text-sm font-medium hover:bg-warm-300 dark:hover:bg-warm-700 transition-all active:scale-95"
              >
                重置
              </button>
              <button
                onClick={handleFinishEarly}
                className="px-3 py-1.5 bg-warm-100/80 dark:bg-warm-800/40 text-warm-500 dark:text-warm-500 rounded-lg text-xs font-medium hover:bg-warm-200 dark:hover:bg-warm-700 hover:text-warm-600 dark:hover:text-warm-400 transition-all active:scale-95 border border-warm-200/40 dark:border-warm-700/30"
                title="提前结算，记录已用时间"
              >
                ☕ 小憩
              </button>
            </>
          )}
          {state === 'finished' && (
            <button
              onClick={handleReset}
              className="px-5 py-2 bg-life-500 text-white rounded-xl text-sm font-medium hover:bg-life-600 transition-all shadow-md hover:shadow-lg active:scale-95 animate-bounce-gentle"
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
              本次学习 <span className="font-bold text-warm-700 dark:text-warm-200">{logMinutes}</span> 分钟，要关联到哪个事项？
            </p>

            {/* Link to todo */}
            <label className="block text-xs font-medium text-warm-600 dark:text-warm-400 mb-1">
              关联事项（可选）
            </label>
            <select
              value={selectedTodoId}
              onChange={e => setSelectedTodoId(e.target.value)}
              className="w-full px-3 py-2 mb-4 bg-warm-50/50 dark:bg-warm-800/50 border border-warm-200/60 dark:border-warm-700/40 rounded-xl text-sm text-warm-700 dark:text-warm-200 focus:outline-none focus:ring-2 focus:ring-study-500/30"
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
                className="flex-1 px-4 py-2 bg-life-500 text-white rounded-xl text-sm font-medium hover:bg-life-600 transition-all shadow-md active:scale-95"
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
