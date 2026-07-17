import { useMemo } from 'react'
import type { Todo } from '../../types'

interface Props {
  year: number
  month: number
  todos: Todo[]
}

interface DayCell {
  date: string
  day: number
  count: number
  isToday: boolean
  isPast: boolean
  isCurrentMonth: boolean
}

const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

function getHeatColor(count: number): string {
  if (count === 0) return 'bg-warm-100/60 dark:bg-warm-800/40'
  if (count <= 2) return 'bg-warm-300/60 dark:bg-warm-600/60'
  if (count <= 5) return 'bg-warm-400/70 dark:bg-warm-500/70'
  if (count <= 8) return 'bg-warm-500/80 dark:bg-warm-400/80'
  return 'bg-warm-600/90 dark:bg-warm-300/90'
}

export function HeatmapCalendar({ year, month, todos }: Props) {
  const { cells, maxCount } = useMemo(() => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // Get first day of month and last day
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const daysInMonth = lastDay.getDate()

    // Day of week for first day (0=Sun, 1=Mon, ...6=Sat) -> we want Mon=0
    const startDayOfWeek = (firstDay.getDay() + 6) % 7

    // Tally completions per day
    const dailyCounts = new Map<string, number>()
    for (const t of todos) {
      if (t.status === 'completed' && t.completedAt) {
        const d = t.completedAt.split('T')[0]
        dailyCounts.set(d, (dailyCounts.get(d) || 0) + 1)
      }
    }

    const cells: DayCell[] = []

    // Empty cells before month start
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({
        date: '',
        day: 0,
        count: 0,
        isToday: false,
        isPast: false,
        isCurrentMonth: false,
      })
    }

    // Month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({
        date: dateStr,
        day: d,
        count: dailyCounts.get(dateStr) || 0,
        isToday: dateStr === todayStr,
        isPast: dateStr <= todayStr,
        isCurrentMonth: true,
      })
    }

    const maxCount = Math.max(...cells.map(c => c.count), 1)

    return { cells, maxCount }
  }, [year, month, todos])

  // Split cells into weeks (rows of 7)
  const weeks: DayCell[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  return (
    <div className="space-y-1">
      {/* Day labels header */}
      <div className="flex gap-1">
        {/* Offset for the label column space */}
        {weeks.length > 0 && weeks[0].some(c => !c.isCurrentMonth) && (
          <div className="w-5" />
        )}
        <div className="flex gap-1 flex-1">
          {DAY_LABELS.map(label => (
            <div
              key={label}
              className="flex-1 text-center text-[10px] text-warm-400 font-medium"
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="flex flex-col gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex gap-1">
            {week.map((cell, ci) => {
              if (!cell.isCurrentMonth) {
                return <div key={`empty-${ci}`} className="flex-1 aspect-square" />
              }
              return (
                <div
                  key={cell.date}
                  className={`flex-1 aspect-square rounded-md flex items-center justify-center text-[10px] font-medium transition-all duration-200 hover:scale-125 hover:z-10 relative group ${
                    cell.isToday
                      ? 'ring-2 ring-warm-500 ring-offset-1 dark:ring-offset-warm-900'
                      : ''
                  } ${getHeatColor(cell.count)}`}
                  title={`${cell.date}: ${cell.count} 项完成`}
                >
                  <span className={`${
                    cell.count > 0 ? 'text-white/80' : 'text-warm-500/50 dark:text-warm-400/50'
                  } ${cell.isToday ? 'font-bold' : ''}`}>
                    {cell.day}
                  </span>

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-warm-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-lg">
                    {cell.date}: {cell.count} 项完成
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-warm-800" />
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-2">
        <span className="text-[10px] text-warm-400">少</span>
        {[0, 1, 3, 6, 9].map(count => (
          <div
            key={count}
            className={`w-3 h-3 rounded-sm ${getHeatColor(count)}`}
          />
        ))}
        <span className="text-[10px] text-warm-400">多</span>
      </div>
    </div>
  )
}
