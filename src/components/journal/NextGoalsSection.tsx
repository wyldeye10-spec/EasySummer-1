import { useState } from 'react'
import type { MonthlyGoal } from '../../types'

interface Props {
  goals: MonthlyGoal[]
  onAdd: (text: string) => void
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

export function NextGoalsSection({ goals, onAdd, onToggle, onRemove }: Props) {
  const [text, setText] = useState('')
  const doneCount = goals.filter(g => g.done).length

  const handleAdd = () => {
    const t = text.trim()
    if (!t) return
    onAdd(t)
    setText('')
  }

  return (
    <div className="glass rounded-2xl border border-warm-200/60 p-5">
      <h3 className="font-semibold text-warm-800 mb-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="text-xl">🎯</span> 下月目标
        </span>
        {goals.length > 0 && (
          <span className="text-xs font-normal text-warm-400 tabular-nums">
            {doneCount}/{goals.length}
          </span>
        )}
      </h3>

      {/* Add input */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          placeholder="添加一个目标..."
          className="flex-1 min-w-0 px-3 py-2 bg-warm-50/50 dark:bg-warm-800/50 border border-warm-200/60 dark:border-warm-700/40 rounded-xl text-sm text-warm-700 dark:text-warm-200 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-study-500/30"
        />
        <button
          onClick={handleAdd}
          disabled={!text.trim()}
          className="px-3 py-2 bg-study-600 text-white rounded-xl text-sm font-medium hover:bg-study-700 disabled:opacity-40 disabled:cursor-default transition-all active:scale-95"
        >
          添加
        </button>
      </div>

      {/* Progress bar */}
      {goals.length > 0 && (
        <div className="h-1.5 bg-warm-100 dark:bg-warm-800 rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${(doneCount / goals.length) * 100}%` }}
          />
        </div>
      )}

      {/* Checklist */}
      {goals.length === 0 ? (
        <p className="text-xs text-warm-400 py-3 text-center">为下个月立几个小目标 🎯</p>
      ) : (
        <ul className="space-y-1">
          {goals.map(g => (
            <li key={g.id} className="group flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm">
              <button
                onClick={() => onToggle(g.id)}
                title={g.done ? '标记未完成' : '标记完成'}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  g.done
                    ? 'bg-emerald-400 border-emerald-400 text-white'
                    : 'border-warm-300 dark:border-warm-600 hover:border-study-400 hover:bg-study-50 dark:hover:bg-study-900/20'
                }`}
              >
                {g.done && <span className="text-[10px] font-bold leading-none">✓</span>}
              </button>
              <span
                className={`flex-1 min-w-0 break-words transition-all ${
                  g.done ? 'line-through text-warm-400' : 'text-warm-700 dark:text-warm-300'
                }`}
              >
                {g.text}
              </span>
              <button
                onClick={() => onRemove(g.id)}
                title="删除"
                className="opacity-0 group-hover:opacity-100 text-warm-400 hover:text-red-500 text-xs transition-all flex-shrink-0"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
