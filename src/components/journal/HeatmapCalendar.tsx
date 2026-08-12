import { useMemo, useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
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

function getHeatColor(count: number, maxCount: number): string {
  if (count === 0) return 'bg-warm-100/50 dark:bg-warm-800/30 ring-1 ring-warm-300/10 dark:ring-warm-600/15'
  const ratio = maxCount > 0 ? count / maxCount : 0
  if (ratio <= 0.25) return 'bg-study-100/60 dark:bg-study-900/50 ring-1 ring-study-200/30 dark:ring-study-700/30'
  if (ratio <= 0.5)  return 'bg-study-200/70 dark:bg-study-800/60 ring-1 ring-study-300/30 dark:ring-study-600/30'
  if (ratio <= 0.75) return 'bg-study-400/80 dark:bg-study-600/70 ring-1 ring-study-400/30 dark:ring-study-500/40'
  return 'bg-study-500/90 dark:bg-study-500/90 ring-1 ring-study-600/50 dark:ring-study-400/50'
}

function formatTooltipDate(dateStr: string): string {
  const d = new Date(dateStr)
  const m = d.getMonth() + 1
  const day = d.getDate()
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${m}月${day}日 ${weekDays[d.getDay()]}`
}

interface TooltipState {
  date: string
  count: number
  x: number
  y: number
}

export function HeatmapCalendar({ year, month, todos }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const { cells, maxCount } = useMemo(() => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const daysInMonth = lastDay.getDate()

    // Monday = 0
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

    // Empty filler cells before month start
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

  // Dynamic legend values
  const legendValues = useMemo(() => {
    if (maxCount <= 1) return [0, 1]
    return [
      0,
      Math.max(1, Math.round(maxCount * 0.25)),
      Math.round(maxCount * 0.5),
      Math.round(maxCount * 0.75),
      maxCount,
    ]
  }, [maxCount])

  const handleMouseEnter = useCallback((e: React.MouseEvent, cell: DayCell) => {
    if (!cell.isCurrentMonth) return
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({
      date: cell.date,
      count: cell.count,
      x: rect.left + rect.width / 2,
      y: rect.top,
    })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setTooltip(null)
  }, [])

  // Touch: toggle on tap
  const handleClick = useCallback((e: React.MouseEvent, cell: DayCell) => {
    if (!cell.isCurrentMonth) return
    // Only toggle on touch devices; on desktop hover handles it
    if (!('ontouchstart' in window)) return
    if (tooltip && tooltip.date === cell.date) {
      setTooltip(null)
    } else {
      const rect = e.currentTarget.getBoundingClientRect()
      setTooltip({
        date: cell.date,
        count: cell.count,
        x: rect.left + rect.width / 2,
        y: rect.top,
      })
    }
  }, [tooltip])

  // Close tooltip on scroll
  useEffect(() => {
    const handler = () => setTooltip(null)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div className="space-y-1 relative">
      {/* Grid: 7 columns — day labels row + all cells */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Day labels as first row */}
        {DAY_LABELS.map(label => (
          <div
            key={label}
            className="text-center text-xs text-warm-400 font-medium py-1"
          >
            {label}
          </div>
        ))}

        {/* All cells — grid auto-wraps into rows of 7 */}
        {cells.map((cell, ci) => {
          if (!cell.isCurrentMonth) {
            // Empty filler — invisible but same dimensions
            return (
              <div
                key={`empty-${ci}`}
                className="aspect-square rounded-md"
              />
            )
          }

          const colorClass = getHeatColor(cell.count, maxCount)

          return (
            <div
              key={cell.date}
              className={`aspect-square rounded-md flex items-center justify-center text-[11px] font-medium transition-all duration-200 hover:scale-125 hover:z-10 relative cursor-default ${
                cell.isToday
                  ? '!ring-2 !ring-study-500 ring-offset-1 dark:ring-offset-warm-900'
                  : ''
              } ${colorClass}`}
              onMouseEnter={e => handleMouseEnter(e, cell)}
              onMouseLeave={handleMouseLeave}
              onClick={e => handleClick(e, cell)}
            >
              <span className={`${
                cell.count > 0 ? 'text-white/85 dark:text-white/80' : 'text-warm-500/50 dark:text-warm-400/40'
              } ${cell.isToday ? 'font-bold' : ''}`}>
                {cell.day}
              </span>
            </div>
          )
        })}
      </div>

      {/* Tooltip — rendered via Portal to body, bypassing parent backdrop-filter containment */}
      {tooltip && createPortal(
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="animate-scale-in relative">
            <div className="
              glass-strong rounded-xl px-3.5 py-2.5 shadow-xl
              border border-warm-200/60 dark:border-warm-600/30
              bg-white/90 dark:bg-warm-900/92
              backdrop-blur-xl
            ">
              <div className="text-xs font-medium text-warm-500 dark:text-warm-400 mb-0.5">
                {formatTooltipDate(tooltip.date)}
              </div>
              <div className="text-lg font-bold text-warm-800 dark:text-warm-100">
                {tooltip.count === 0 ? (
                  <span className="text-warm-400 dark:text-warm-500">无记录</span>
                ) : (
                  <>{tooltip.count} <span className="text-sm font-normal text-warm-500 dark:text-warm-400">项完成</span></>
                )}
              </div>
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
              border-l-[6px] border-r-[6px] border-t-[6px]
              border-l-transparent border-r-transparent
              border-t-white/90 dark:border-t-warm-900/92
            " />
          </div>
        </div>,
        document.body
      )}

      {/* Legend — dynamic values */}
      <div className="flex items-center justify-end gap-1.5 mt-2">
        <span className="text-[10px] text-warm-400">少</span>
        {legendValues.map((val, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-sm ${getHeatColor(val, maxCount)}`}
          />
        ))}
        <span className="text-[10px] text-warm-400">多</span>
      </div>
    </div>
  )
}
