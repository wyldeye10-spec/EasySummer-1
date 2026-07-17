import { useEffect } from 'react'
import { useTodoStore } from '../../store/todoStore'
import { EmptyState } from '../common/EmptyState'

export function Trash() {
  const todos = useTodoStore(s => s.todos)
  const restoreTodo = useTodoStore(s => s.restoreTodo)
  const permanentlyDeleteTodo = useTodoStore(s => s.permanentlyDeleteTodo)
  const cleanupTrash = useTodoStore(s => s.cleanupTrash)

  useEffect(() => {
    cleanupTrash()
  }, [])

  const deleted = todos.filter(t => t.status === 'deleted')

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold gradient-text">🗑️ 回收站</h2>
        {deleted.length > 0 && (
          <button
            onClick={cleanupTrash}
            className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all active:scale-95"
          >
            清理过期 (30天)
          </button>
        )}
      </div>

      <p className="text-sm text-warm-400">
        已删除的事项会保留 30 天，之后自动清理
      </p>

      {deleted.length === 0 ? (
        <EmptyState icon="🗑️" title="回收站是空的" description="删除的事项会在这里暂存 30 天" />
      ) : (
        <div className="space-y-2">
          {deleted.map((todo, i) => {
            const daysLeft = todo.deletedAt
              ? Math.max(0, 30 - Math.floor((Date.now() - new Date(todo.deletedAt).getTime()) / (1000 * 60 * 60 * 24)))
              : 30
            const isExpiring = daysLeft <= 3

            return (
              <div
                key={todo.id}
                className={`flex items-center gap-3 p-4 glass rounded-2xl border transition-all hover-lift animate-slide-up ${
                  isExpiring ? 'border-red-200/60' : 'border-warm-200/60'
                }`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-warm-600 line-through">{todo.title}</div>
                  {todo.deletedAt && (
                    <div className={`text-xs mt-1 flex items-center gap-1 ${
                      isExpiring ? 'text-red-400 font-medium' : 'text-warm-400'
                    }`}>
                      <span>
                        删除时间：{new Date(todo.deletedAt).toLocaleDateString()}
                      </span>
                      <span>·</span>
                      <span className={isExpiring ? 'animate-pulse-soft' : ''}>
                        剩余 {daysLeft} 天
                      </span>
                      {isExpiring && <span className="text-[10px]">⚠ 即将清理</span>}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => restoreTodo(todo.id)}
                  className="px-3.5 py-1.5 text-xs font-medium bg-warm-100/80 text-warm-700 rounded-xl hover:bg-warm-200 transition-all active:scale-95"
                >
                  恢复
                </button>
                <button
                  onClick={() => permanentlyDeleteTodo(todo.id)}
                  className="px-3.5 py-1.5 text-xs font-medium bg-red-50 text-red-400 rounded-xl hover:bg-red-100 hover:text-red-500 transition-all active:scale-95"
                >
                  彻底删除
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
