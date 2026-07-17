import { useState, useRef, useCallback } from 'react'
import { parseInput } from '../../utils/parser'
import { useTodos } from '../../hooks/useTodos'
import { useUIStore } from '../../store/uiStore'
import { useSettingsStore } from '../../store/settingsStore'
import { QUADRANT_PRIORITY_MAP } from '../../constants'

export function QuickInput() {
  const [value, setValue] = useState('')
  const [shake, setShake] = useState(false)
  const [focused, setFocused] = useState(false)
  const [successBurst, setSuccessBurst] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { addTodo, checkDuplicate } = useTodos()
  const mode = useUIStore(s => s.mode)
  const addToast = useUIStore(s => s.addToast)
  const storageMode = useUIStore(s => s.storageMode)
  const storageDisabled = storageMode === 'none'
  const customCategories = useSettingsStore(s => s.settings.customCategories)

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

    const parsed = parseInput(trimmed, customCategories)

    await addTodo({
      title: parsed.title,
      category: parsed.category || 'other',
      tags: parsed.tags,
      priority: parsed.priority || 'P3',
      quadrant: QUADRANT_PRIORITY_MAP[parsed.priority || 'P3'],
      dueDate: parsed.dueDate || undefined,
      estimatedMinutes: parsed.estimatedMinutes || undefined,
      status: 'pending',
      mode,
    })

    // Success animation
    setSuccessBurst(true)
    setTimeout(() => setSuccessBurst(false), 600)
    addToast('✓ 已添加事项')
    setValue('')
    inputRef.current?.focus()
  }, [value, checkDuplicate, addTodo, mode, addToast])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className={`relative ${shake ? 'animate-shake' : ''}`}>
      {/* Floating decorative icon */}
      <div className={`absolute -top-3 -left-1 text-2xl transition-all duration-500 ${focused || value ? 'opacity-100 -translate-y-1' : 'opacity-0 translate-y-2'}`}>
        ✨
      </div>

      {/* Main input card */}
      <div className={`relative rounded-2xl transition-all duration-300 ${
        focused
          ? 'ring-2 ring-warm-400/50 shadow-lg shadow-warm-300/20'
          : 'ring-1 ring-warm-200/60 shadow-md hover:shadow-lg hover:ring-warm-300/50'
      } ${successBurst ? 'animate-bounce-gentle' : ''}`}>
        <div className={`absolute inset-0 rounded-2xl transition-opacity duration-500 pointer-events-none ${
          focused ? 'opacity-100' : 'opacity-0'
        } bg-gradient-to-r from-warm-100/50 via-transparent to-warm-100/50`} />

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={storageDisabled ? '无法存储数据，请检查浏览器设置' : '输入新事项，Enter 保存...  (支持 /p1 #标签 @分类 周三前 预计2h)'}
          disabled={storageDisabled}
          className={`w-full px-5 py-4 glass rounded-2xl text-warm-800 dark:text-warm-200 placeholder-warm-400/60 dark:placeholder-warm-500/50 focus:outline-none transition-all text-sm relative z-10 ${
            storageDisabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          maxLength={200}
          autoFocus
        />

        {/* Submit button hint */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <kbd className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all duration-300 ${
            value
              ? 'bg-warm-500 dark:bg-warm-400 text-white dark:text-warm-900 shadow-sm'
              : 'bg-warm-200/80 dark:bg-warm-700/60 text-warm-500 dark:text-warm-400'
          }`}>
            Enter ↵
          </kbd>
        </div>
      </div>

      {/* Hint chips */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {['/p1 优先级', '#标签', '@学习', '周三前', '预计2h'].map((hint, i) => (
          <button
            key={hint}
            onClick={() => {
              setValue(v => v ? `${v} ${hint}` : hint)
              inputRef.current?.focus()
            }}
            className="text-xs px-2.5 py-1 rounded-full bg-warm-100/80 dark:bg-warm-800/60 text-warm-500 dark:text-warm-400 border border-warm-200/50 dark:border-warm-700/50 hover:bg-warm-200 dark:hover:bg-warm-700 hover:text-warm-600 dark:hover:text-warm-300 hover:border-warm-300 dark:hover:border-warm-600 transition-all hover:-translate-y-0.5 cursor-pointer"
            style={{ animationDelay: `${i * 0.08}s` }}
            title="点击添加到输入框"
          >
            {hint}
          </button>
        ))}
      </div>
    </div>
  )
}
