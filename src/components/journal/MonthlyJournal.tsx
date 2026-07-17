import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTodoStore } from '../../store/todoStore'
import { exportMonthlyJournalMarkdown, downloadFile } from '../../utils/export'
import { printMonthlyJournal } from '../../utils/exportPdf'
import { getMonthRange } from '../../utils/date'
import { HeatmapCalendar } from './HeatmapCalendar'
import { CategoryPieChart } from './CategoryPieChart'

export function MonthlyJournal() {
  const { year, month } = useParams()
  const navigate = useNavigate()

  const now = new Date()
  const currentYear = year ? parseInt(year) : now.getFullYear()
  const currentMonth = month ? parseInt(month) : now.getMonth() + 1

  const todos = useTodoStore(s => s.todos)
  const [highlights, setHighlights] = useState('')
  const [nextGoals, setNextGoals] = useState('')
  const [exporting, setExporting] = useState(false)

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

  const handleExport = () => {
    setExporting(true)
    const md = exportMonthlyJournalMarkdown(currentYear, currentMonth, monthTodos, highlights, nextGoals)
    setTimeout(() => {
      downloadFile(md, `${currentYear}-${String(currentMonth).padStart(2, '0')}-月志.md`)
      setExporting(false)
    }, 300)
  }

  const statCards = [
    { label: '本月事项', value: stats.total, color: 'text-warm-800' },
    { label: '已完成', value: stats.completed, color: 'text-emerald-500' },
    { label: '完成率', value: `${stats.rate}%`, color: stats.rate >= 80 ? 'text-emerald-500' : stats.rate >= 50 ? 'text-study-500' : 'text-warm-500' },
    { label: '累计时长', value: stats.hours > 0 ? `${stats.hours}h${stats.mins > 0 ? ` ${stats.mins}m` : ''}` : `${stats.mins}m`, color: 'text-study-500' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
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

      {/* Stats grid with animated numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className="glass rounded-2xl border border-warm-200/60 p-4 text-center hover-lift animate-scale-in"
            style={{ animationDelay: `${i * 0.08}s` }}
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
                stats.rate >= 80 ? 'text-emerald-400' : stats.rate >= 50 ? 'text-study-500' : 'text-warm-400'
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

      {/* Highlights Editor */}
      <div className="glass rounded-2xl border border-warm-200/60 p-5 hover-lift">
        <h3 className="font-semibold text-warm-800 mb-3 flex items-center gap-2">
          <span className="text-xl">✨</span> 高光时刻
        </h3>
        <textarea
          value={highlights}
          onChange={e => setHighlights(e.target.value)}
          placeholder="这个月有哪些值得记录的成就或感悟？支持 Markdown..."
          className="w-full h-32 px-4 py-3 bg-warm-50/50 border border-warm-200/60 rounded-xl text-sm text-warm-700 placeholder-warm-400 focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-300/30 resize-none transition-all"
        />
      </div>

      {/* Next Month Goals */}
      <div className="glass rounded-2xl border border-warm-200/60 p-5 hover-lift">
        <h3 className="font-semibold text-warm-800 mb-3 flex items-center gap-2">
          <span className="text-xl">🎯</span> 下月目标
        </h3>
        <textarea
          value={nextGoals}
          onChange={e => setNextGoals(e.target.value)}
          placeholder="下个月，我想..."
          className="w-full h-24 px-4 py-3 bg-warm-50/50 border border-warm-200/60 rounded-xl text-sm text-warm-700 placeholder-warm-400 focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-300/30 resize-none transition-all"
        />
      </div>

      {/* Export */}
      <div className="flex justify-end gap-2">
        <button
          onClick={printMonthlyJournal}
          className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md hover:shadow-lg active:scale-95 bg-warm-100/80 dark:bg-warm-800/60 text-warm-700 dark:text-warm-300 hover:bg-warm-200 dark:hover:bg-warm-700"
        >
          🖨️ 导出 PDF
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md hover:shadow-lg active:scale-95 ${
            exporting
              ? 'bg-emerald-400 text-white'
              : 'bg-gradient-to-br from-warm-400 to-warm-500 text-white hover:from-warm-500 hover:to-warm-600'
          }`}
        >
          {exporting ? '✅ 已导出！' : '📥 导出 Markdown'}
        </button>
      </div>
    </div>
  )
}
