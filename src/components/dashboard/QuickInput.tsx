import { useState, useRef, useCallback } from 'react'
import { parseInput } from '../../utils/parser'
import { useTodos } from '../../hooks/useTodos'
import { useUIStore } from '../../store/uiStore'
import { useSettingsStore } from '../../store/settingsStore'
import { QUADRANT_PRIORITY_MAP } from '../../constants'

/**
 * Extract the active tag query after the last '#' that hasn't been closed by a space.
 * Returns null if no active tag is being typed.
 */
function getActiveTagQuery(value: string): { query: string; startIndex: number } | null {
  const lastHash = value.lastIndexOf('#')
  if (lastHash === -1) return null
  const afterHash = value.slice(lastHash + 1)
  // Tag already completed (space after it) — don't show suggestions
  if (afterHash.includes(' ')) return null
  return { query: afterHash, startIndex: lastHash }
}

/**
 * Filter tags by substring match (case-insensitive).
 * Returns all tags if query is empty.
 */
function filterTags(query: string, allTags: string[]): string[] {
  if (!query) return allTags
  const q = query.toLowerCase()
  return allTags.filter(tag => tag.toLowerCase().includes(q))
}

/** Four preset categories for @category autocomplete */
const PRESET_CATEGORIES = [
  { key: 'study', label: '学习', hex: '#5a9ec9' },
  { key: 'work', label: '工作', hex: '#d97c63' },
  { key: 'life', label: '生活', hex: '#6ab880' },
  { key: 'other', label: '其他', hex: '#a895c5' },
]

/**
 * Extract the active @category query after the last '@' that hasn't been closed by a space.
 * Returns null if no active category is being typed.
 */
function getActiveCategoryQuery(value: string): { query: string; startIndex: number } | null {
  const lastAt = value.lastIndexOf('@')
  if (lastAt === -1) return null
  const afterAt = value.slice(lastAt + 1)
  // Category already completed (space after it) — don't show suggestions
  if (afterAt.includes(' ')) return null
  return { query: afterAt, startIndex: lastAt }
}

/**
 * Filter preset categories by substring match against both Chinese label and English key.
 * Returns all presets if query is empty.
 */
function filterCategories(query: string) {
  if (!query) return PRESET_CATEGORIES
  const q = query.toLowerCase()
  return PRESET_CATEGORIES.filter(
    c => c.key.toLowerCase().includes(q) || c.label.includes(q)
  )
}

export function QuickInput() {
  const [value, setValue] = useState('')
  const [shake, setShake] = useState(false)
  const [focused, setFocused] = useState(false)
  const [successBurst, setSuccessBurst] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { addTodo, checkDuplicate } = useTodos()
  const mode = useUIStore(s => s.mode)
  const addToast = useUIStore(s => s.addToast)
  const storageMode = useUIStore(s => s.storageMode)
  const storageDisabled = storageMode === 'none'
  const customCategories = useSettingsStore(s => s.settings.customCategories)
  const customTags = useSettingsStore(s => s.settings.customTags)

  // Autocomplete state for #tag suggestions
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)

  // Autocomplete state for @category suggestions
  const [categorySuggestions, setCategorySuggestions] = useState<typeof PRESET_CATEGORIES>([])
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0)

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

  /**
   * Insert a tag suggestion: replace the partial #query with the full #tagName.
   */
  const insertTag = useCallback((tagName: string) => {
    const active = getActiveTagQuery(value)
    if (!active) return
    const before = value.slice(0, active.startIndex)
    const after = value.slice(active.startIndex + 1 + active.query.length)
    const newValue = `${before}#${tagName} ${after}`
    setValue(newValue)
    setShowDropdown(false)
    // Restore cursor position after the inserted tag
    const cursorPos = before.length + tagName.length + 2 // # + tagName + space
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(cursorPos, cursorPos)
    }, 0)
  }, [value])

  /**
   * Insert a category suggestion: replace the partial @query with the full @categoryKey.
   */
  const insertCategory = useCallback((categoryKey: string) => {
    const active = getActiveCategoryQuery(value)
    if (!active) return
    const before = value.slice(0, active.startIndex)
    const after = value.slice(active.startIndex + 1 + active.query.length)
    const newValue = `${before}@${categoryKey} ${after}`
    setValue(newValue)
    setShowCategoryDropdown(false)
    // Restore cursor position after the inserted category
    const cursorPos = before.length + categoryKey.length + 2 // @ + key + space
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(cursorPos, cursorPos)
    }, 0)
  }, [value])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)

    // Detect active @category query and #tag query
    const activeTag = getActiveTagQuery(newValue)
    const activeCat = getActiveCategoryQuery(newValue)

    // When both are active, the rightmost trigger wins
    if (activeCat && (!activeTag || activeCat.startIndex > activeTag.startIndex)) {
      const matches = filterCategories(activeCat.query)
      setCategorySuggestions(matches)
      setShowCategoryDropdown(matches.length > 0)
      setSelectedCategoryIndex(0)
      setShowDropdown(false) // close tag dropdown
    } else if (activeTag && customTags.length > 0) {
      const matches = filterTags(activeTag.query, customTags)
      setSuggestions(matches)
      setShowDropdown(matches.length > 0)
      setSelectedIndex(0)
      setShowCategoryDropdown(false) // close category dropdown
    } else {
      setShowDropdown(false)
      setShowCategoryDropdown(false)
    }
  }, [customTags])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle category dropdown keyboard navigation
    if (showCategoryDropdown && categorySuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedCategoryIndex(prev => (prev + 1) % categorySuggestions.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedCategoryIndex(prev => (prev - 1 + categorySuggestions.length) % categorySuggestions.length)
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        insertCategory(categorySuggestions[selectedCategoryIndex].key)
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowCategoryDropdown(false)
        return
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        insertCategory(categorySuggestions[selectedCategoryIndex].key)
        return
      }
    }

    // Handle tag dropdown keyboard navigation
    if (showDropdown && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % suggestions.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        insertTag(suggestions[selectedIndex])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowDropdown(false)
        return
      }
      if (e.key === 'Tab') {
        // Tab selects the highlighted item and closes
        e.preventDefault()
        insertTag(suggestions[selectedIndex])
        return
      }
    }

    // Normal Enter submit when no dropdown
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }, [showCategoryDropdown, categorySuggestions, selectedCategoryIndex, insertCategory, showDropdown, suggestions, selectedIndex, insertTag, handleSubmit])

  const handleBlur = useCallback(() => {
    // Delay to allow click on a suggestion to register before closing
    setTimeout(() => {
      setShowDropdown(false)
      setShowCategoryDropdown(false)
    }, 150)
    setFocused(false)
  }, [])

  // Build hint chips: base hints + dynamic custom tag chips
  const baseHintsBefore = ['/p1 优先级']
  const baseHintsAfter = ['@学习', '@工作', '@生活', '@其他', '周三前', '预计2h']
  const tagHints = customTags.length > 0
    ? customTags.map(t => `#${t}`)
    : ['#标签']

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
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
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

        {/* Tag autocomplete dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute left-3 right-3 top-full mt-1 z-20 glass-strong rounded-xl border border-warm-200/60 shadow-lg overflow-hidden animate-scale-in"
          >
            <div className="max-h-48 overflow-y-auto py-1">
              {suggestions.map((tag, i) => (
                <button
                  key={tag}
                  onMouseDown={e => {
                    e.preventDefault() // prevent onBlur from closing before click
                    insertTag(tag)
                  }}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${
                    i === selectedIndex
                      ? 'bg-warm-100 dark:bg-warm-800 text-warm-800 dark:text-warm-200'
                      : 'text-warm-600 dark:text-warm-400 hover:bg-warm-50 dark:hover:bg-warm-800/60'
                  }`}
                >
                  <span className="text-warm-400 text-xs">#</span>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category autocomplete dropdown */}
        {showCategoryDropdown && categorySuggestions.length > 0 && (
          <div className="absolute left-3 right-3 top-full mt-1 z-20 glass-strong rounded-xl border border-warm-200/60 shadow-lg overflow-hidden animate-scale-in">
            <div className="max-h-48 overflow-y-auto py-1">
              {categorySuggestions.map((cat, i) => (
                <button
                  key={cat.key}
                  onMouseDown={e => {
                    e.preventDefault() // prevent onBlur from closing before click
                    insertCategory(cat.key)
                  }}
                  onMouseEnter={() => setSelectedCategoryIndex(i)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${
                    i === selectedCategoryIndex
                      ? 'bg-warm-100 dark:bg-warm-800 text-warm-800 dark:text-warm-200'
                      : 'text-warm-600 dark:text-warm-400 hover:bg-warm-50 dark:hover:bg-warm-800/60'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.hex }}
                  />
                  <span className="text-warm-400 text-xs">@</span>
                  <span>{cat.label}</span>
                  <span className="text-warm-400/60 text-xs ml-auto">{cat.key}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hint chips */}
      <div className="flex flex-wrap gap-1.5 mt-2">
        {[...baseHintsBefore, ...tagHints, ...baseHintsAfter].map((hint) => (
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
