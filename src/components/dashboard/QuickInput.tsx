import { useState, useRef, useCallback } from 'react'
import type { Priority } from '../../types'
import { parseInput } from '../../utils/parser'
import { useTodos } from '../../hooks/useTodos'
import { useUIStore } from '../../store/uiStore'
import { useSettingsStore } from '../../store/settingsStore'
import { QUADRANT_PRIORITY_MAP, PRIORITY_CONFIG } from '../../constants'
import { formatDate, getRelativeDateDescription } from '../../utils/date'

export function QuickInput() {
  const [value, setValue] = useState('')
  const [shake, setShake] = useState(false)
  const [focused, setFocused] = useState(false)
  const [successBurst, setSuccessBurst] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedPriority, setSelectedPriority] = useState<Priority | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const { addTodo, checkDuplicate } = useTodos()
  const mode = useUIStore(s => s.mode)
  const addToast = useUIStore(s => s.addToast)
  const storageMode = useUIStore(s => s.storageMode)
  const quickTemplates = useSettingsStore(s => s.settings.customTags)
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

    const finalPriority = selectedPriority || parsed.priority || 'P4'
    await addTodo({
      title: parsed.title,
      category: mode,  // Auto-set from current mode toggle
      tags: parsed.tags,
      priority: finalPriority,
      quadrant: QUADRANT_PRIORITY_MAP[finalPriority],
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
    setSelectedPriority(null)
    inputRef.current?.focus()
  }, [value, selectedDate, selectedPriority, checkDuplicate, addTodo, mode, addToast])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    // Sync parsed /pN syntax with visual priority chips
    const parsed = parseInput(newValue)
    if (parsed.priority !== selectedPriority) {
      setSelectedPriority(parsed.priority)
    }
  }, [selectedPriority])

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

      {/* Priority selector chips */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {(Object.entries(PRIORITY_CONFIG) as [Priority, { emoji: string; label: string }][]).map(([p, cfg]) => {
          const isActive = selectedPriority === p
          const activeClasses: Record<string, string> = {
            P1: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700',
            P2: 'bg-study-100 dark:bg-study-900/30 text-study-700 dark:text-study-400 border-study-300 dark:border-study-700',
            P3: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700',
            P4: 'bg-warm-100 dark:bg-warm-800/60 text-warm-600 dark:text-warm-300 border-warm-300 dark:border-warm-600',
          }
          return (
            <button
              key={p}
              onClick={() => {
                setSelectedPriority(isActive ? null : p)
                inputRef.current?.focus()
              }}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer hover:-translate-y-0.5 ${
                isActive
                  ? activeClasses[p] + ' font-medium shadow-sm'
                  : 'bg-warm-100/80 dark:bg-warm-800/60 text-warm-500 dark:text-warm-400 border-warm-200/50 dark:border-warm-700/50 hover:bg-warm-200 dark:hover:bg-warm-700 hover:text-warm-600 dark:hover:text-warm-300 hover:border-warm-300 dark:hover:border-warm-600'
              }`}
              title={isActive ? '取消选择' : cfg.label}
            >
              {cfg.emoji} {cfg.label}
            </button>
          )
        })}
      </div>

      {/* Main input card */}
      <div className={`relative rounded-full transition-all duration-300 ${
        focused
          ? 'ring-2 ring-study-500/50 shadow-lg shadow-study-300/20'
          : 'ring-1 ring-warm-200/60 shadow-md hover:shadow-lg hover:ring-warm-300/50'
      } ${successBurst ? 'animate-bounce-gentle' : ''}`}>
        <div className={`absolute inset-0 rounded-full transition-opacity duration-500 pointer-events-none ${
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
            placeholder={storageDisabled ? '无法存储数据，请检查浏览器设置' : '输入新事项，Enter 保存…  (支持日期短语、预计时间)'}
            disabled={storageDisabled}
            className={`flex-1 py-2 glass rounded-full text-warm-800 dark:text-warm-200 placeholder-warm-400/60 dark:placeholder-warm-500/50 focus:outline-none transition-all text-sm bg-transparent ${
              storageDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            maxLength={200}
            autoFocus
          />

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className={`flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full text-sm transition-all duration-300 ${
              value.trim()
                ? 'bg-study-600 dark:bg-study-500 text-white shadow-sm hover:bg-study-700 dark:hover:bg-study-400 active:scale-95 cursor-pointer'
                : 'bg-warm-200/80 dark:bg-warm-700/60 text-warm-400 dark:text-warm-500 cursor-default'
            }`}
            title="提交 (Enter)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 10 4 15 9 20" />
              <path d="M20 4v7a4 4 0 0 1-4 4H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick input templates */}
      {quickTemplates.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {quickTemplates.map((tpl) => (
            <button
              key={tpl}
              onClick={() => {
                setValue(v => v ? `${v} ${tpl}` : tpl)
                inputRef.current?.focus()
              }}
              className="text-xs px-2.5 py-1 rounded-full bg-study-50 dark:bg-study-900/20 text-study-600 dark:text-study-400 border border-dashed border-study-200/60 dark:border-study-700/40 hover:bg-study-100 dark:hover:bg-study-800/30 hover:text-study-700 dark:hover:text-study-300 hover:border-study-300 dark:hover:border-study-600 transition-all hover:-translate-y-0.5 cursor-pointer"
              title="点击添加到输入框"
            >
              {tpl}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
