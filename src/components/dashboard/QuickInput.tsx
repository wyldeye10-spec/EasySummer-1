import { useState, useRef, useCallback } from 'react'
import { parseInput } from '../../utils/parser'
import { useTodos } from '../../hooks/useTodos'
import { useUIStore } from '../../store/uiStore'
import { QUADRANT_PRIORITY_MAP } from '../../constants'
import { formatDate, getRelativeDateDescription } from '../../utils/date'

export function QuickInput() {
  const [value, setValue] = useState('')
  const [shake, setShake] = useState(false)
  const [focused, setFocused] = useState(false)
  const [successBurst, setSuccessBurst] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const { addTodo, checkDuplicate } = useTodos()
  const mode = useUIStore(s => s.mode)
  const addToast = useUIStore(s => s.addToast)
  const storageMode = useUIStore(s => s.storageMode)
  const storageDisabled = storageMode === 'none'

  const handleSubmit = useCallback(async () => {
    const trimmed = value.trim()
    if (!trimmed) {
      setShake(true)
      setTimeout(() => setShake(false), 400)
      return
    }

    const dup = checkDuplicate(trimmed)
    if (dup) {
      addToast('已存在类似事项，请检查列表', 'info')
      setValue('')
      return
    }

    const parsed = parseInput(trimmed)

    await addTodo({
      title: parsed.title,
      category: mode,  // Auto-set from current mode toggle
      tags: parsed.tags,
      priority: parsed.priority || 'P3',
      quadrant: QUADRANT_PRIORITY_MAP[parsed.priority || 'P3'],
      dueDate: selectedDate || parsed.dueDate || undefined,
      estimatedMinutes: parsed.estimatedMinutes || undefined,
      status: 'pending',
      mode,
    })

    // Success animation
    setSuccessBurst(true)
    setTimeout(() => setSuccessBurst(false), 600)
    addToast('✓ 已添加事项')
    setValue('')
    setSelectedDate(null)
    inputRef.current?.focus()
  }, [value, selectedDate, checkDuplicate, addTodo, mode, addToast])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  const handleBlur = useCallback(() => {
    setFocused(false)
  }, [])

  // Calendar date picker handler
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value
    if (date) {
      setSelectedDate(date)
      inputRef.current?.focus()
    }
  }

  const handleClearDate = () => {
    setSelectedDate(null)
    inputRef.current?.focus()
  }

  return (
    <div className={`relative ${shake ? 'animate-shake' : ''}`}>
      {/* Floating decorative icon */}
      <div className={`absolute -top-3 -left-1 text-2xl transition-all duration-500 ${focused || value ? 'opacity-100 -translate-y-1' : 'opacity-0 translate-y-2'}`}>
        ✨
      </div>

      {/* Selected date chip */}
      {selectedDate && (
        <div className="mb-2 animate-scale-in">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-warm-100/80 dark:bg-warm-800/60 text-warm-700 dark:text-warm-300 border border-warm-200/50 dark:border-warm-700/50">
            <span className="text-xs">📅</span>
            {getRelativeDateDescription(selectedDate)}
            <span className="text-warm-400 text-xs opacity-70">
              ({formatDate(selectedDate)})
            </span>
            <button
              onClick={handleClearDate}
              className="text-warm-400 hover:text-red-500 text-xs ml-0.5 transition-colors"
            >
              ✕
            </button>
          </span>
        </div>
      )}

      {/* Main input card */}
      <div className={`relative rounded-2xl transition-all duration-300 ${
        focused
          ? 'ring-2 ring-warm-400/50 shadow-lg shadow-warm-300/20'
          : 'ring-1 ring-warm-200/60 shadow-md hover:shadow-lg hover:ring-warm-300/50'
      } ${successBurst ? 'animate-bounce-gentle' : ''}`}>
        <div className={`absolute inset-0 rounded-2xl transition-opacity duration-500 pointer-events-none ${
          focused ? 'opacity-100' : 'opacity-0'
        } bg-gradient-to-r from-warm-100/50 via-transparent to-warm-100/50`} />

        <div className="flex items-center gap-2 px-4 py-2 relative z-10">
          {/* Calendar button */}
          <button
            onClick={() => dateInputRef.current?.showPicker()}
            className={`flex-shrink-0 p-1.5 rounded-lg text-sm transition-all ${
              selectedDate
                ? 'text-study-500 bg-study-100/50 dark:text-study-400 dark:bg-study-800/30'
                : 'text-warm-400 hover:text-warm-600 hover:bg-warm-100 dark:hover:bg-warm-800'
            }`}
            title={selectedDate ? '修改截止日期' : '添加截止日期'}
          >
            📅
          </button>

          {/* Hidden date input — triggered by the calendar button */}
          <input
            ref={dateInputRef}
            type="date"
            className="absolute opacity-0 w-0 h-0 pointer-events-none"
            onChange={handleDateChange}
            value={selectedDate || ''}
          />

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={handleBlur}
            placeholder={storageDisabled ? '无法存储数据，请检查浏览器设置' : '输入新事项，Enter 保存...  (支持 /p1 周三前 预计2h)'}
            disabled={storageDisabled}
            className={`flex-1 py-2 glass rounded-xl text-warm-800 dark:text-warm-200 placeholder-warm-400/60 dark:placeholder-warm-500/50 focus:outline-none transition-all text-sm bg-transparent ${
              storageDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            maxLength={200}
            autoFocus
          />

          {/* Submit button hint */}
          <div className="flex-shrink-0 pointer-events-none">
            <kbd className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all duration-300 ${
              value
                ? 'bg-warm-500 dark:bg-warm-400 text-white dark:text-warm-900 shadow-sm'
                : 'bg-warm-200/80 dark:bg-warm-700/60 text-warm-500 dark:text-warm-400'
            }`}>
              Enter ↵
            </kbd>
          </div>
        </div>
      </div>

      {/* Hint chips */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {['/p1 优先级', '周三前', '预计2h'].map((hint) => (
          <button
            key={hint}
            onClick={() => {
              setValue(v => v ? `${v} ${hint}` : hint)
              inputRef.current?.focus()
            }}
            className="text-xs px-2.5 py-1 rounded-full bg-warm-100/80 dark:bg-warm-800/60 text-warm-500 dark:text-warm-400 border border-warm-200/50 dark:border-warm-700/50 hover:bg-warm-200 dark:hover:bg-warm-700 hover:text-warm-600 dark:hover:text-warm-300 hover:border-warm-300 dark:hover:border-warm-600 transition-all hover:-translate-y-0.5 cursor-pointer"
            title="点击添加到输入框"
          >
            {hint}
          </button>
        ))}
      </div>
    </div>
  )
}
