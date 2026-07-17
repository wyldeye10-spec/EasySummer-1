import { useState, useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Todo } from '../../types'
import { getCategoryLabel, getCategoryColors, PRIORITY_LABELS } from '../../constants'
import { useSettingsStore } from '../../store/settingsStore'
import { getRelativeDateDescription, isOverdue } from '../../utils/date'
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
  const customCategories = useSettingsStore(s => s.settings.customCategories)
  const colors = getCategoryColors(todo.category, customCategories)
  const isCompleted = todo.status === 'completed'
  const isPending = todo.status === 'pending'
  const isParent = !todo.parentId
  const overdue = todo.dueDate && !isCompleted && isOverdue(todo.dueDate)

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
  }

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
          : overdue
            ? 'ring-1 ring-red-300/60 bg-red-50/40 border-red-200/40'
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
            : overdue
              ? 'border-red-300 hover:border-red-400 hover:bg-red-50'
              : 'border-warm-300 hover:border-warm-400 hover:bg-warm-50 hover:scale-110'
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
              if (e.key === 'Escape') setEditing(false)
            }}
            className="w-full px-2 py-1 border-2 border-warm-300 rounded-lg focus:outline-none focus:border-warm-400 text-sm bg-white animate-scale-in"
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
            {overdue && (
              <span className="ml-2 text-xs text-red-400 font-medium animate-pulse-soft">
                ⚠ 已过期
              </span>
            )}
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {/* Category badge */}
          {colors.bg ? (
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${colors.bg} ${colors.text}`}>
              {getCategoryLabel(todo.category, customCategories)}
            </span>
          ) : (
            <span
              className="text-xs px-1.5 py-0.5 rounded-md font-medium border"
              style={{ backgroundColor: colors.hex + '20', color: colors.hex, borderColor: colors.hex + '40' }}
            >
              {getCategoryLabel(todo.category, customCategories)}
            </span>
          )}

          {/* Priority */}
          <span className={`text-xs font-medium ${
            todo.priority === 'P1' ? 'text-red-500' :
            todo.priority === 'P2' ? 'text-study-600' :
            'text-warm-500'
          }`}>
            {PRIORITY_LABELS[todo.priority]}
          </span>

          {/* Tags */}
          {todo.tags.map(tag => (
            <span key={tag} className="text-xs text-warm-400 bg-warm-100/80 px-1.5 py-0.5 rounded-md border border-warm-200/50">
              #{tag}
            </span>
          ))}

          {/* Due date */}
          {todo.dueDate && (
            <span className={`text-xs flex items-center gap-1 ${
              overdue ? 'text-red-400 font-medium' : 'text-warm-400'
            }`}>
              <span className="text-[10px]">📅</span>
              {getRelativeDateDescription(todo.dueDate)}
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
                className="h-full bg-warm-400 rounded-full animate-[shrink_3s_linear]"
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
