import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTodoStore } from '../../store/todoStore'
import { useMonthlyJournal } from '../../hooks/useMonthlyJournal'
import { printMonthlyJournal } from '../../utils/exportPdf'
import { getMonthRange } from '../../utils/date'
import { HeatmapCalendar } from './HeatmapCalendar'
import { CategoryPieChart } from './CategoryPieChart'
import { HighlightsSection } from './HighlightsSection'
import { NextGoalsSection } from './NextGoalsSection'

export function MonthlyJournal() {
  const { year, month } = useParams()
  const navigate = useNavigate()

  const now = new Date()
  const currentYear = year ? parseInt(year) : now.getFullYear()
  const currentMonth = month ? parseInt(month) : now.getMonth() + 1

  const todos = useTodoStore(s => s.todos)
  const {
    highlights,
    nextGoals,
    addHighlight,
    removeHighlight,
    addGoal,
    toggleGoal,
    removeGoal,
  } = useMonthlyJournal(currentYear, currentMonth)

  const { start, end } = getMonthRange(currentYear, currentMonth)

  const monthTodos = useMemo(
    () => todos.filter(t => t.createdAt >= start && t.createdAt <= end),
    [todos, start, end]
  )

  const stats = useMemo(() => {
    const completed = monthTodos.filter(t => t.status === 'completed')
    const totalMinutes = completed.reduce(
      (sum, t) => sum + (t.actualMinutes || t.estimatedMinutes || 0), 0
    )
    return {
      total: monthTodos.length,
      completed: completed.length,
      rate: monthTodos.length > 0 ? Math.round((completed.length / monthTodos.length) * 100) : 0,
      hours: Math.floor(totalMinutes / 60),
      mins: totalMinutes % 60,
    }
  }, [todos, start, end])

  const prevMonth = () => {
    const m = currentMonth === 1 ? 12 : currentMonth - 1
    const y = currentMonth === 1 ? currentYear - 1 : currentYear
    navigate(`/journal/${y}/${m}`)
  }

  const nextMonth = () => {
    const m = currentMonth === 12 ? 1 : currentMonth + 1
    const y = currentMonth === 12 ? currentYear + 1 : currentYear
    navigate(`/journal/${y}/${m}`)
  }

  const statCards = [
    { label: '本月事项', value: stats.total, color: 'text-warm-800' },
    { label: '已完成', value: stats.completed, color: 'text-life-500' },
    { label: '完成率', value: `${stats.rate}%`, color: stats.rate >= 80 ? 'text-life-500' : stats.rate >= 50 ? 'text-study-500' : 'text-warm-500' },
    { label: '累计时长', value: stats.hours > 0 ? `${stats.hours}h${stats.mins > 0 ? ` ${stats.mins}m` : ''}` : `${stats.mins}m`, color: 'text-study-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="p-2.5 text-warm-500 hover:text-warm-700 hover:bg-warm-100 rounded-xl transition-all active:scale-90"
        >
          ←
        </button>
        <h2 className="text-xl font-bold gradient-text">
          {currentYear}年{currentMonth}月
        </h2>
        <button
          onClick={nextMonth}
          className="p-2.5 text-warm-500 hover:text-warm-700 hover:bg-warm-100 rounded-xl transition-all active:scale-90"
        >
          →
        </button>
      </div>

      {/* Body: desktop = left sidebar (highlights + goals) + main charts; mobile = single column */}
      <div className="flex flex-col lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6 lg:items-start">
        {/* Left sidebar */}
        <aside className="space-y-6 order-2 lg:order-1 lg:sticky lg:top-[92px]">
          <HighlightsSection
            highlights={highlights}
            onAdd={addHighlight}
            onRemove={removeHighlight}
          />
          <NextGoalsSection
            goals={nextGoals}
            onAdd={addGoal}
            onToggle={toggleGoal}
            onRemove={removeGoal}
          />
        </aside>

        {/* Main column */}
        <div className="space-y-6 order-1 lg:order-2 min-w-0">
          {/* Stats grid with animated numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {statCards.map((card, i) => (
              <div
                key={card.label}
                className="glass rounded-2xl border border-warm-200/60 p-4 text-center hover-lift"
              >
                <div className={`text-3xl font-extrabold tabular-nums ${card.color}`}>
                  {card.value}
                </div>
                <div className="text-xs text-warm-500 mt-1">{card.label}</div>
              </div>
            ))}
          </div>

          {/* Progress ring */}
          <div className="flex justify-center py-2">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" className="text-warm-200/60" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="40" fill="none" stroke="currentColor"
                  className={`progress-ring-circle ${
                    stats.rate >= 80 ? 'text-life-400' : stats.rate >= 50 ? 'text-study-500' : 'text-warm-400'
                  }`}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - stats.rate / 100)}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-extrabold tabular-nums gradient-text">{stats.rate}%</span>
              </div>
            </div>
          </div>

          {/* Heatmap Calendar */}
          <div className="glass rounded-2xl border border-warm-200/60 p-5 hover-lift">
            <h3 className="font-semibold text-warm-800 mb-4 flex items-center gap-2">
              <span className="text-xl">🗓️</span> 每日完成热力图
            </h3>
            <HeatmapCalendar
              year={currentYear}
              month={currentMonth}
              todos={monthTodos}
            />
          </div>

          {/* Category Pie Chart */}
          <div className="glass rounded-2xl border border-warm-200/60 p-5 hover-lift">
            <h3 className="font-semibold text-warm-800 mb-2 flex items-center gap-2">
              <span className="text-xl">📊</span> 分类占比
            </h3>
            <CategoryPieChart todos={monthTodos} />
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="flex justify-end gap-2">
        <button
          onClick={printMonthlyJournal}
          className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md hover:shadow-lg active:scale-95 bg-warm-100/80 dark:bg-warm-800/60 text-warm-700 dark:text-warm-300 hover:bg-warm-200 dark:hover:bg-warm-700"
        >
          🖨️ 导出 PDF
        </button>
      </div>
    </div>
  )
}
