import { useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Todo, Priority, PresetCategory, AppMode } from '../../types'
import { getCategoryLabel, getCategoryColors, PRIORITY_LABELS, PRIORITY_CONFIG, QUADRANT_PRIORITY_MAP, CATEGORY_SWITCH_OPTIONS, PRESET_CATEGORY_COLORS } from '../../constants'
import { useSettingsStore } from '../../store/settingsStore'
import { useTodoStore } from '../../store/todoStore'
import { getRelativeDateDescription, isOverdue, getDaysUntil, formatDate } from '../../utils/date'
import { SubTaskList } from './SubTaskList'

interface Props {
  todo: Todo
  index?: number
  onComplete: (id: string) => void
  onUndo: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, updates: Partial<Todo>) => void
}

export function TodoItem({ todo, index = 0, onComplete, onUndo, onDelete, onEdit }: Props) {
  const [showUndo, setShowUndo] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(todo.title)
  const [celebrate, setCelebrate] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [showSubTasks, setShowSubTasks] = useState(false)
  const [showPriorityMenu, setShowPriorityMenu] = useState(false)
  const priorityMenuRef = useRef<HTMLDivElement>(null)
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const categoryMenuRef = useRef<HTMLDivElement>(null)
  const [animPriority, setAnimPriority] = useState(false)
  // Two-phase category switch animation: exit → change data → enter
  const [categoryPhase, setCategoryPhase] = useState<'idle' | 'exit' | 'enter'>('idle')
  const pendingCategoryRef = useRef<PresetCategory | null>(null)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const enterTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const customCategories = useSettingsStore(s => s.settings.customCategories)
  const allTodos = useTodoStore(s => s.todos)
  const colors = getCategoryColors(todo.category, customCategories)
  const isCompleted = todo.status === 'completed'
  const isPending = todo.status === 'pending'
  const isParent = !todo.parentId

  // Subtask counts for parent tasks
  const subTodos = isParent ? allTodos.filter(t => t.parentId === todo.id && t.status !== 'deleted') : []
  const subCount = subTodos.length
  const subDone = subTodos.filter(t => t.status === 'completed').length
  const subAllDone = subCount > 0 && subDone === subCount
  const hasDueDate = !!todo.dueDate
  const overdue = hasDueDate && !isCompleted && isOverdue(todo.dueDate!)
  const dueDateDays = hasDueDate && !isCompleted ? getDaysUntil(todo.dueDate!) : null

  // Sortable only for pending items
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id, disabled: !isPending })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  const handleCheck = () => {
    if (isCompleted) {
      onUndo(todo.id)
      setShowUndo(false)
    } else {
      setCelebrate(true)
      setTimeout(() => setCelebrate(false), 800)
      onComplete(todo.id)
      setShowUndo(true)
      setTimeout(() => setShowUndo(false), 3000)
    }
  }

  const handleDelete = () => {
    setExiting(true)
    setTimeout(() => onDelete(todo.id), 300)
  }

  const handleEditSubmit = () => {
    if (editTitle.trim()) {
      onEdit(todo.id, { title: editTitle.trim() })
    }
    setEditing(false)
    setShowCategoryMenu(false)
  }

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current)
    }
  }, [])

  // Click-outside handler for priority + category popovers
  useEffect(() => {
    if (!showPriorityMenu && !showCategoryMenu) return
    const handler = (e: MouseEvent) => {
      if (priorityMenuRef.current && !priorityMenuRef.current.contains(e.target as Node)) {
        setShowPriorityMenu(false)
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target as Node)) {
        setShowCategoryMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showPriorityMenu, showCategoryMenu])

  // Inline priority change — syncs both priority and quadrant
  const handlePriorityChange = (newPriority: Priority) => {
    if (newPriority === todo.priority) { setShowPriorityMenu(false); return }
    onEdit(todo.id, { priority: newPriority, quadrant: QUADRANT_PRIORITY_MAP[newPriority] })
    setShowPriorityMenu(false)
    setAnimPriority(true)
    setTimeout(() => setAnimPriority(false), 250)
  }

  // Inline category change — two-phase animation: exit old → apply change → enter new
  const handleCategoryChange = (newCategory: PresetCategory) => {
    if (newCategory === todo.category) { setShowCategoryMenu(false); return }
    setShowCategoryMenu(false)
    pendingCategoryRef.current = newCategory

    // Clear any stale timers
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current)

    // Phase 1: shrink + fade out (still showing old category)
    setCategoryPhase('exit')
    exitTimerRef.current = setTimeout(() => {
      // Midpoint: apply the actual category change
      const cat = pendingCategoryRef.current
      if (cat) {
        onEdit(todo.id, { category: cat, mode: cat as AppMode })
        pendingCategoryRef.current = null
      }
      // Phase 2: pop back in (now showing new category)
      setCategoryPhase('enter')
      enterTimerRef.current = setTimeout(() => {
        setCategoryPhase('idle')
      }, 300)
    }, 230)
  }

  // Priority-aware urgency display — lower priority tones down due-date urgency
  const getEffectiveUrgency = (): 'overdue' | 'urgent' | 'soon' | null => {
    if (!dueDateDays || dueDateDays === null) return null
    // P4 (not important, not urgent): never show urgency card styling
    if (todo.priority === 'P4') return null
    // P3 (urgent but not important): only show overdue
    if (todo.priority === 'P3') return overdue ? 'overdue' : null
    // P2 (important but not urgent): overdue + urgent only
    if (todo.priority === 'P2') {
      if (overdue) return 'overdue'
      if (dueDateDays <= 3) return 'urgent'
      return null
    }
    // P1 (urgent and important): full urgency display
    if (overdue) return 'overdue'
    if (dueDateDays <= 3) return 'urgent'
    if (dueDateDays <= 7) return 'soon'
    return null
  }
  const effectiveUrgency = getEffectiveUrgency()

  return (
    <div
      ref={setNodeRef}
      style={style as React.CSSProperties}
      className={`group flex items-start gap-3 p-3.5 rounded-xl transition-all duration-300 border hover-lift relative ${
        exiting ? 'opacity-0 translate-x-8 scale-95 pointer-events-none' : ''
      } ${
        celebrate ? 'animate-bounce-gentle ring-2 ring-emerald-300 bg-emerald-50/50' : ''
      } ${
        isDragging ? 'opacity-50 shadow-xl scale-[1.02] z-50 bg-white/90 ring-2 ring-warm-300/60' : ''
      } ${
        isCompleted
          ? 'opacity-50 bg-warm-100/50 border-warm-200/40'
          : effectiveUrgency === 'overdue'
            ? 'ring-1 ring-red-300/60 bg-red-50/40 border-red-200/40'
            : effectiveUrgency === 'urgent'
              ? 'ring-1 ring-red-200/40 bg-red-50/30 border-red-200/30'
              : effectiveUrgency === 'soon'
                ? 'ring-1 ring-amber-200/40 bg-amber-50/30 border-amber-200/30'
                : 'border-transparent hover:border-warm-200/80 bg-white/60 hover:bg-white'
      }`}
    >
      {/* Drag handle — only for pending items */}
      {isPending && (
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 p-0.5 text-warm-400 hover:text-warm-600 cursor-grab active:cursor-grabbing flex-shrink-0 rounded hover:bg-warm-100 transition-colors"
          title="拖拽排序"
        >
          <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
            <circle cx="3" cy="3" r="1.5" />
            <circle cx="9" cy="3" r="1.5" />
            <circle cx="3" cy="8" r="1.5" />
            <circle cx="9" cy="8" r="1.5" />
            <circle cx="3" cy="13" r="1.5" />
            <circle cx="9" cy="13" r="1.5" />
          </svg>
        </button>
      )}

      {/* Priority glow indicator */}
      {!isCompleted && (
        <div
          className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full transition-all ${
            todo.priority === 'P1' ? 'bg-red-400 animate-pulse-soft' :
            todo.priority === 'P2' ? 'bg-study-400' :
            todo.priority === 'P3' ? 'bg-amber-400' : 'bg-warm-300'
          }`}
        />
      )}

      {/* Checkbox */}
      <button
        onClick={handleCheck}
        className={`relative mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
          isCompleted
            ? 'bg-emerald-400 border-emerald-400 text-white scale-90'
            : effectiveUrgency === 'overdue'
              ? 'border-red-300 hover:border-red-400 hover:bg-red-50'
              : effectiveUrgency === 'urgent'
                ? 'border-red-200 hover:border-red-300 hover:bg-red-50'
                : effectiveUrgency === 'soon'
                  ? 'border-amber-300 hover:border-amber-400 hover:bg-amber-50'
                  : 'border-warm-300 hover:border-study-500 hover:bg-warm-50 hover:scale-110'
        }`}
      >
        {isCompleted && (
          <span className="text-xs animate-success-pop">✓</span>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            type="text"
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onBlur={handleEditSubmit}
            onKeyDown={e => {
              if (e.key === 'Enter') handleEditSubmit()
              if (e.key === 'Escape') { setEditing(false); setShowCategoryMenu(false) }
            }}
            className="w-full px-2 py-1 border-2 border-warm-300 rounded-lg focus:outline-none focus:border-study-500 text-sm bg-white animate-scale-in"
            autoFocus
          />
        ) : (
          <div
            className={`text-sm transition-all duration-300 ${
              isCompleted ? 'line-through text-warm-400' : 'text-warm-800'
            }`}
            onDoubleClick={() => !isCompleted && setEditing(true)}
          >
            {todo.title}
            {/* Due date warning label */}
            {!isCompleted && hasDueDate && (
              <span className={`ml-2 text-xs font-medium ${
                overdue
                  ? 'text-red-400 animate-pulse-soft'
                  : dueDateDays !== null && dueDateDays <= 3
                    ? 'text-red-400'
                    : dueDateDays !== null && dueDateDays <= 7
                      ? 'text-amber-500'
                      : 'text-warm-400'
              }`}>
                {overdue
                  ? '⚠ 已过期'
                  : dueDateDays !== null && dueDateDays <= 7
                    ? `${dueDateDays === 0 ? '⏰ 今天到期' : `⏰ ${dueDateDays}天后到期`}`
                    : `📅 ${formatDate(todo.dueDate!)}`}
              </span>
            )}
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {/* Category badge — clickable for inline editing */}
          <div className="relative" ref={categoryMenuRef}>
            <button
              onClick={() => !isCompleted && setShowCategoryMenu(!showCategoryMenu)}
              disabled={isCompleted}
              className={`text-xs px-1.5 py-0.5 rounded-md font-medium transition-all ${
                categoryPhase === 'exit' ? 'animate-category-out' :
                categoryPhase === 'enter' ? 'animate-category-in' : ''
              } ${
                isCompleted ? 'cursor-default' : 'cursor-pointer hover:ring-1 hover:ring-warm-300/60 hover:shadow-sm'
              } ${colors.bg || ''} ${colors.text || ''}`}
              style={!colors.bg ? { backgroundColor: colors.hex + '20', color: colors.hex, borderColor: colors.hex + '40' } : undefined}
              title={isCompleted ? '' : '点击切换分类'}
            >
              {getCategoryLabel(todo.category, customCategories)}
            </button>

            {/* Category popover dropdown */}
            {showCategoryMenu && !isCompleted && (
              <div className="absolute bottom-full left-0 mb-1 z-50 bg-white dark:bg-warm-800 rounded-xl shadow-xl border border-warm-200/60 dark:border-warm-700/60 p-1.5 min-w-[120px] animate-scale-in">
                {CATEGORY_SWITCH_OPTIONS.map(({ key, emoji }) => {
                  const isSelected = todo.category === key
                  const optColors = PRESET_CATEGORY_COLORS[key]
                  return (
                    <button
                      key={key}
                      onClick={() => handleCategoryChange(key)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-warm-200/60 dark:bg-warm-700/60'
                          : 'hover:bg-warm-100 dark:hover:bg-warm-700/40'
                      } ${optColors.text}`}
                    >
                      <span className="text-sm">{emoji}</span>
                      <span>{getCategoryLabel(key, customCategories)}</span>
                      {isSelected && <span className="ml-auto text-xs">✓</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Priority — clickable for inline editing */}
          <div className="relative" ref={priorityMenuRef}>
            <button
              onClick={() => !isCompleted && setShowPriorityMenu(!showPriorityMenu)}
              disabled={isCompleted}
              className={`text-xs font-medium px-1.5 py-0.5 rounded-md transition-all ${
                isCompleted ? 'cursor-default' : 'cursor-pointer hover:ring-1 hover:ring-warm-300/60 hover:shadow-sm'
              } ${
                todo.priority === 'P1' ? 'text-red-500 bg-red-50/60 dark:bg-red-900/20' :
                todo.priority === 'P2' ? 'text-study-600 bg-study-50/60 dark:bg-study-900/20' :
                todo.priority === 'P3' ? 'text-amber-600 bg-amber-50/60 dark:bg-amber-900/20' :
                'text-warm-500 bg-warm-100/60 dark:bg-warm-800/40'
              } ${animPriority ? 'animate-pop' : ''}`}
              title={isCompleted ? '' : '点击修改优先级'}
            >
              {PRIORITY_LABELS[todo.priority]}
            </button>

            {/* Priority popover dropdown */}
            {showPriorityMenu && !isCompleted && (
              <div className="absolute bottom-full left-0 mb-1 z-50 bg-white dark:bg-warm-800 rounded-xl shadow-xl border border-warm-200/60 dark:border-warm-700/60 p-1.5 min-w-[150px] animate-scale-in">
                {(Object.entries(PRIORITY_CONFIG) as [Priority, { emoji: string; label: string }][]).map(([p, cfg]) => (
                  <button
                    key={p}
                    onClick={() => handlePriorityChange(p)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      todo.priority === p
                        ? 'bg-warm-200/60 dark:bg-warm-700/60'
                        : 'hover:bg-warm-100 dark:hover:bg-warm-700/40'
                    } ${
                      p === 'P1' ? 'text-red-600 dark:text-red-400' :
                      p === 'P2' ? 'text-study-600 dark:text-study-400' :
                      p === 'P3' ? 'text-amber-600 dark:text-amber-400' :
                      'text-warm-600 dark:text-warm-400'
                    }`}
                  >
                    <span className="text-sm">{cfg.emoji}</span>
                    <span>{cfg.label}</span>
                    {todo.priority === p && <span className="ml-auto text-xs">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          {todo.tags.map(tag => (
            <span key={tag} className="text-xs text-warm-400 bg-warm-100/80 px-1.5 py-0.5 rounded-md border border-warm-200/50">
              #{tag}
            </span>
          ))}

          {/* Due date — compact display */}
          {hasDueDate && (
            <span className={`text-xs flex items-center gap-1 ${
              overdue ? 'text-red-400 font-medium' :
              dueDateDays !== null && dueDateDays <= 3 ? 'text-red-400' :
              dueDateDays !== null && dueDateDays <= 7 ? 'text-amber-500' :
              'text-warm-400'
            }`}>
              <span className="text-[10px]">📅</span>
              {getRelativeDateDescription(todo.dueDate!)}
            </span>
          )}

          {/* Estimated time */}
          {todo.estimatedMinutes && (
            <span className="text-xs text-warm-400 flex items-center gap-1">
              <span className="text-[10px]">⏱</span>
              {todo.estimatedMinutes >= 60
                ? `${Math.floor(todo.estimatedMinutes / 60)}h${todo.estimatedMinutes % 60 ? ` ${todo.estimatedMinutes % 60}m` : ''}`
                : `${todo.estimatedMinutes}m`}
            </span>
          )}

          {/* Pomodoro count */}
          {todo.pomodoroCount != null && todo.pomodoroCount > 0 && (
            <span className="text-xs text-study-500 dark:text-study-400 flex items-center gap-1">
              <span className="text-[10px]">🍅</span>
              ×{todo.pomodoroCount}
            </span>
          )}

          {/* Actual focus time */}
          {todo.actualMinutes != null && todo.actualMinutes > 0 && (
            <span className="text-xs text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
              <span className="text-[10px]">🎯</span>
              {todo.actualMinutes >= 60
                ? `${Math.floor(todo.actualMinutes / 60)}h${todo.actualMinutes % 60 ? ` ${todo.actualMinutes % 60}m` : ''}`
                : `${todo.actualMinutes}m`}
            </span>
          )}
        </div>

        {/* Undo button with countdown bar */}
        {showUndo && (
          <div className="mt-1.5 flex items-center gap-2">
            <button
              onClick={() => {
                onUndo(todo.id)
                setShowUndo(false)
              }}
              className="text-xs text-warm-500 hover:text-warm-700 underline transition-colors"
            >
              撤销
            </button>
            <div className="flex-1 h-0.5 bg-warm-200 rounded-full overflow-hidden max-w-[120px]">
              <div
                className="h-full bg-study-500 rounded-full animate-[shrink_3s_linear]"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}

        {/* SubTasks */}
        {isParent && showSubTasks && !isCompleted && (
          <SubTaskList parentTodo={todo} />
        )}

        {/* Celebrate confetti (simplified) */}
        {celebrate && (
          <div className="absolute top-0 right-4 pointer-events-none">
            {['🎉', '✨', '🌟'].map((emoji, i) => (
              <span
                key={i}
                className="absolute text-xs animate-success-pop"
                style={{
                  left: `${i * 12 - 12}px`,
                  top: `${i * -8}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                {emoji}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Subtask count badge — always visible */}
      {isParent && subCount > 0 && (
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${
          subAllDone
            ? 'bg-emerald-100/80 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-warm-200/60 text-warm-500 dark:bg-warm-700/50 dark:text-warm-400'
        }`}>
          {showSubTasks ? `📋 ${subCount}` : `${subDone}/${subCount}`}
        </span>
      )}

      {/* Actions on hover */}
      <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0 animate-fade-in">
        {isParent && (
          <button
            onClick={() => setShowSubTasks(!showSubTasks)}
            className="p-1.5 text-warm-400 hover:text-warm-600 hover:bg-warm-100 rounded-lg transition-all text-xs"
            title="子任务"
          >
            {showSubTasks ? '📋' : '📄'}
          </button>
        )}
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 text-warm-400 hover:text-warm-600 hover:bg-warm-100 rounded-lg transition-all text-xs"
          title="编辑"
          disabled={isCompleted}
        >
          ✏️
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 text-warm-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all text-xs"
          title="删除"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
