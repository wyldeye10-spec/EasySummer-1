import { useState } from 'react'
import { useTodoStore } from '../../store/todoStore'
import { useUIStore } from '../../store/uiStore'
import { QUADRANT_PRIORITY_MAP } from '../../constants'
import type { Todo } from '../../types'

interface Props {
  parentTodo: Todo
}

export function SubTaskList({ parentTodo }: Props) {
  const todos = useTodoStore(s => s.todos)
  const addTodo = useTodoStore(s => s.addTodo)
  const completeTodo = useTodoStore(s => s.completeTodo)
  const undoCompleteTodo = useTodoStore(s => s.undoCompleteTodo)
  const deleteTodo = useTodoStore(s => s.deleteTodo)
  const updateTodo = useTodoStore(s => s.updateTodo)
  const mode = useUIStore(s => s.mode)
  const addToast = useUIStore(s => s.addToast)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const subTasks = todos
    .filter(t => t.parentId === parentTodo.id && t.status !== 'deleted')
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  const handleAdd = async () => {
    if (!newTitle.trim()) return
    await addTodo({
      title: newTitle.trim(),
      category: parentTodo.category,
      tags: [],
      priority: parentTodo.priority,
      quadrant: parentTodo.quadrant,
      dueDate: parentTodo.dueDate,
      status: 'pending',
      mode,
      parentId: parentTodo.id,
    })
    addToast('✓ 已添加子任务')
    setNewTitle('')
    setAdding(false)
  }

  const handleToggle = (sub: Todo) => {
    if (sub.status === 'completed') {
      undoCompleteTodo(sub.id)
    } else {
      completeTodo(sub.id)
    }
  }

  const pendingCount = subTasks.filter(t => t.status === 'pending').length

  return (
    <div className="ml-8 mt-1 border-l-2 border-warm-200/60 dark:border-warm-700/40 pl-3 space-y-1">
      {/* Existing subtasks */}
      {subTasks.map(sub => (
        <div
          key={sub.id}
          className={`flex items-center gap-2 py-1 px-2 rounded-lg text-sm transition-all ${
            sub.status === 'completed'
              ? 'opacity-50 text-warm-400 dark:text-warm-500 line-through'
              : 'text-warm-700 dark:text-warm-300'
          }`}
        >
          <button
            onClick={() => handleToggle(sub)}
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              sub.status === 'completed'
                ? 'bg-emerald-400 border-emerald-400 text-white'
                : 'border-warm-300 dark:border-warm-600 hover:border-warm-400'
            }`}
          >
            {sub.status === 'completed' && <span className="text-[8px]">✓</span>}
          </button>
          <span className="flex-1">{sub.title}</span>
          <button
            onClick={() => deleteTodo(sub.id)}
            className="opacity-0 group-hover:opacity-100 text-warm-400 hover:text-red-500 text-xs transition-all"
          >
            ✕
          </button>
        </div>
      ))}

      {/* Add subtask form */}
      {adding ? (
        <div className="flex items-center gap-2 py-1">
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') setAdding(false)
            }}
            placeholder="子任务标题..."
            className="flex-1 px-2 py-1 text-sm bg-warm-50/50 dark:bg-warm-800/50 border border-warm-200/60 dark:border-warm-700/40 rounded-lg focus:outline-none focus:border-warm-400 dark:text-warm-200 placeholder-warm-400"
            autoFocus
          />
          <button
            onClick={handleAdd}
            className="text-xs px-2 py-1 bg-warm-400 text-white rounded-lg hover:bg-warm-500"
          >
            添加
          </button>
          <button
            onClick={() => setAdding(false)}
            className="text-xs text-warm-400 hover:text-warm-600"
          >
            取消
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="text-xs text-warm-400 hover:text-warm-600 dark:hover:text-warm-300 flex items-center gap-1 py-1 px-2 transition-colors"
        >
          <span>＋</span> 添加子任务
          {pendingCount > 0 && (
            <span className="text-[10px] bg-warm-200/60 dark:bg-warm-700/40 px-1.5 py-0.5 rounded-full">
              {pendingCount} 未完成
            </span>
          )}
        </button>
      )}
    </div>
  )
}
