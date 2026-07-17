import { useState, useMemo } from 'react'
import type { Todo } from '../../types'
import { CATEGORY_LABELS, PRIORITY_LABELS } from '../../constants'

interface Props {
  todos: Todo[]
  onSave: (suggestion: string) => Promise<void>
  onDismiss: () => void
}

export function DailySummaryModal({ todos, onSave, onDismiss }: Props) {
  const [suggestion, setSuggestion] = useState('')
  const [saving, setSaving] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const { completed, pending } = useMemo(() => {
    const todayTodos = todos.filter(t => {
      if (t.parentId) return false
      return t.createdAt.startsWith(today) || t.completedAt?.startsWith(today)
    })
    return {
      completed: todayTodos.filter(t => t.status === 'completed' && t.completedAt?.startsWith(today)),
      pending: todayTodos.filter(t => t.status === 'pending')
        .sort((a, b) => {
          const pOrder = { P1: 0, P2: 1, P3: 2, P4: 3 }
          return pOrder[a.priority] - pOrder[b.priority]
        }),
    }
  }, [todos, today])

  // Auto suggestion based on high-priority pending items
  const autoSuggestion = useMemo(() => {
    const highPri = pending.filter(t => t.priority === 'P1' || t.priority === 'P2')
    if (highPri.length === 0 && pending.length === 0) {
      return '今天全部完成，太棒了！可以放松一下，或者为明天做点准备~'
    }
    if (highPri.length > 0) {
      return `明天优先处理：${highPri.map(t => t.title).join('、')}`
    }
    return `还有 ${pending.length} 件事项待完成，明天继续加油！`
  }, [pending])

  const handleSave = async () => {
    setSaving(true)
    await onSave(suggestion || autoSuggestion)
    setSaving(false)
    onDismiss()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in p-4">
      <div className="glass-strong rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="text-center mb-5">
          <span className="text-4xl block mb-2">🌙</span>
          <h2 className="text-xl font-bold text-warm-800 dark:text-warm-200">
            今日小结
          </h2>
          <p className="text-sm text-warm-500 dark:text-warm-400 mt-1">
            {today}
          </p>
        </div>

        {/* Completed */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-emerald-500 mb-2 flex items-center gap-1">
            ✅ 已完成 ({completed.length})
          </h3>
          {completed.length === 0 ? (
            <p className="text-sm text-warm-400 pl-1">今天还没有完成事项</p>
          ) : (
            <div className="space-y-1">
              {completed.map(t => (
                <div key={t.id} className="text-sm text-warm-600 dark:text-warm-400 line-through opacity-70 pl-1">
                  {t.title}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending */}
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-warm-600 dark:text-warm-400 mb-2 flex items-center gap-1">
            📋 未完成 ({pending.length})
          </h3>
          {pending.length === 0 ? (
            <p className="text-sm text-warm-400 pl-1">全部清空！🎉</p>
          ) : (
            <div className="space-y-1">
              {pending.map(t => (
                <div key={t.id} className="flex items-center gap-2 text-sm text-warm-700 dark:text-warm-300 pl-1">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                    t.priority === 'P1' ? 'bg-red-100 text-red-500' :
                    t.priority === 'P2' ? 'bg-study-100 text-study-600' :
                    'bg-warm-100 text-warm-500'
                  }`}>
                    {PRIORITY_LABELS[t.priority]}
                  </span>
                  <span>{t.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Suggestion */}
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-warm-600 dark:text-warm-400 mb-2">
            💡 今日总结 / 明日建议
          </h3>
          <textarea
            value={suggestion}
            onChange={e => setSuggestion(e.target.value)}
            placeholder={autoSuggestion}
            className="w-full h-20 px-3 py-2 bg-warm-50/50 dark:bg-warm-800/50 border border-warm-200/60 dark:border-warm-700/40 rounded-xl text-sm text-warm-700 dark:text-warm-200 placeholder-warm-400 resize-none focus:outline-none focus:ring-2 focus:ring-warm-300/30"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-gradient-to-br from-warm-400 to-warm-500 text-white rounded-xl text-sm font-medium hover:from-warm-500 hover:to-warm-600 transition-all shadow-md active:scale-95"
          >
            {saving ? '保存中...' : '💾 保存'}
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-2.5 bg-warm-100/80 dark:bg-warm-800/60 text-warm-600 dark:text-warm-400 rounded-xl text-sm font-medium hover:bg-warm-200 dark:hover:bg-warm-700 transition-all active:scale-95"
          >
            跳过
          </button>
        </div>
      </div>
    </div>
  )
}
