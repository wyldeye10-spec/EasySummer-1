import { useMemo } from 'react'
import { useTodoStore } from '../../store/todoStore'
import { useUIStore } from '../../store/uiStore'

export function StatsCard() {
  const todos = useTodoStore(s => s.todos)
  const mode = useUIStore(s => s.mode)

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const todayCompleted = todos.filter(
      t => t.status === 'completed' && t.completedAt?.startsWith(today) && t.mode === mode
    ).length
    const totalPending = todos.filter(t => t.status === 'pending' && t.mode === mode).length

    // This week's trend (last 7 days)
    const weekData: { day: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const dayLabel = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
      weekData.push({
        day: dayLabel,
        count: todos.filter(t => t.status === 'completed' && t.completedAt?.startsWith(ds) && t.mode === mode).length,
      })
    }
    const maxWeek = Math.max(...weekData.map(d => d.count), 1)

    // Streak
    let streak = 0
    const checkDate = new Date()
    while (true) {
      const ds = checkDate.toISOString().split('T')[0]
      const dayTodos = todos.filter(t => t.status === 'completed' && t.completedAt?.startsWith(ds) && t.mode === mode)
      if (dayTodos.length > 0) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    return { todayCompleted, totalPending, weekData, maxWeek, streak }
  }, [todos, mode])

  return (
    <div className="glass rounded-2xl border border-warm-200/60 p-5 hover-lift">
      <h3 className="text-sm font-medium text-warm-600 mb-4">📊 今日统计</h3>

      {/* Big numbers */}
      <div className="flex items-center gap-6 mb-4">
        <div className="text-center flex-1">
          <div className="text-4xl font-extrabold gradient-text tabular-nums">
            {stats.todayCompleted}
          </div>
          <div className="text-xs text-warm-500 mt-0.5">今日完成</div>
        </div>
        <div className="w-px h-10 bg-warm-200" />
        <div className="text-center flex-1">
          <div className="text-4xl font-extrabold text-warm-800 tabular-nums">
            {stats.totalPending}
          </div>
          <div className="text-xs text-warm-500 mt-0.5">待完成</div>
        </div>
      </div>

      {/* Week trend bars */}
      <div className="mb-3">
        <div className="text-xs text-warm-500 mb-2">本周趋势</div>
        <div className="flex items-end justify-between gap-1 h-12">
          {stats.weekData.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-full rounded-t-md transition-all duration-500 ${
                  d.count > 0
                    ? 'bg-gradient-to-t from-warm-400 to-warm-300'
                    : 'bg-warm-150'
                }`}
                style={{
                  height: `${Math.max((d.count / stats.maxWeek) * 100, d.count > 0 ? 8 : 3)}%`,
                  minHeight: '3px',
                }}
              />
              <span className="text-[10px] text-warm-400">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Streak badge */}
      {stats.streak > 0 && (
        <div className="flex items-center gap-2 p-2.5 bg-gradient-to-r from-warm-100 to-transparent rounded-xl">
          <span className="text-lg">🔥</span>
          <div>
            <div className="text-xs font-bold text-warm-700">连续 {stats.streak} 天</div>
            <div className="text-[10px] text-warm-500">保持好习惯！</div>
          </div>
        </div>
      )}
    </div>
  )
}
