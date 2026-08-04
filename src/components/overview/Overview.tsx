import { useState, useMemo } from 'react'
import { useTodoStore } from '../../store/todoStore'
import { getCategoryLabel, getCategoryColors, PRIORITY_LABELS } from '../../constants'
import { useSettingsStore } from '../../store/settingsStore'
import { getRelativeDateDescription, isOverdue, getDaysUntil } from '../../utils/date'
import { EmptyState } from '../common/EmptyState'
import { SkeletonCard } from '../common/Skeleton'
import type { Todo } from '../../types'

// ============ Date helpers (computed once per render) ============

function getDateStrs() {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const dayAfter = new Date(now)
  dayAfter.setDate(now.getDate() + 2)
  const dayAfterStr = dayAfter.toISOString().split('T')[0]

  // Monday of current week (Chinese convention: Monday is start of week)
  const dayOfWeek = now.getDay() // 0=Sun
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  const mondayStr = monday.toISOString().split('T')[0]

  // Sunday of current week
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const sundayStr = sunday.toISOString().split('T')[0]

  return { todayStr, tomorrowStr, dayAfterStr, mondayStr, sundayStr }
}

// ============ Date group config ============

interface DateGroup {
  key: string
  label: string
  icon: string
  tasks: Todo[]
}

// ============ Task row (read-only) ============

function OverviewTaskRow({ todo }: { todo: Todo }) {
  const customCategories = useSettingsStore(s => s.settings.customCategories)
  const colors = getCategoryColors(todo.category, customCategories)
  const isCompleted = todo.status === 'completed'
  const hasDueDate = !!todo.dueDate
  const overdue = hasDueDate && !isCompleted && isOverdue(todo.dueDate!)

  return (
    <div className={`flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors border ${
      isCompleted
        ? 'opacity-50 bg-warm-50/50 border-warm-100/50 dark:bg-warm-800/20 dark:border-warm-700/20'
        : overdue
          ? 'bg-red-50/30 border-red-200/30 dark:bg-red-900/10 dark:border-red-800/20'
          : 'bg-white/50 border-transparent hover:border-warm-200/60 dark:bg-warm-800/30 dark:hover:border-warm-700/40'
    }`}>
      {/* Priority glow bar */}
      {!isCompleted && (
        <div
          className={`w-1 h-8 rounded-full flex-shrink-0 self-center ${
            todo.priority === 'P1' ? 'bg-red-400' :
            todo.priority === 'P2' ? 'bg-study-400' :
            todo.priority === 'P3' ? 'bg-amber-400' : 'bg-warm-300'
          }`}
        />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
        <span className={`text-sm ${isCompleted ? 'line-through text-warm-400' : 'text-warm-800 dark:text-warm-200'}`}>
          {todo.title}
        </span>

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
          todo.priority === 'P2' ? 'text-study-600 dark:text-study-500' :
          'text-warm-500'
        }`}>
          {PRIORITY_LABELS[todo.priority]}
        </span>

        {/* Tags */}
        {todo.tags.map(tag => (
          <span key={tag} className="text-xs text-warm-400 bg-warm-100/80 dark:bg-warm-800/60 px-1.5 py-0.5 rounded-md border border-warm-200/50 dark:border-warm-700/50">
            #{tag}
          </span>
        ))}

        {/* Due date */}
        {hasDueDate && (
          <span className={`text-xs flex items-center gap-1 ${
            overdue ? 'text-red-400 font-medium' :
            !isCompleted && getDaysUntil(todo.dueDate!) <= 3 ? 'text-red-400' :
            !isCompleted && getDaysUntil(todo.dueDate!) <= 7 ? 'text-amber-500' :
            'text-warm-400'
          }`}>
            <span className="text-[10px]">📅</span>
            {getRelativeDateDescription(todo.dueDate!)}
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

        {/* Completed checkmark */}
        {isCompleted && (
          <span className="text-xs text-emerald-500 font-medium">✓ 已完成</span>
        )}
      </div>
    </div>
  )
}

// ============ Main component ============

export function Overview() {
  const todos = useTodoStore(s => s.todos)
  const loading = useTodoStore(s => s.loading)
  const [showCompleted, setShowCompleted] = useState(false)

  const { todayStr, tomorrowStr, dayAfterStr, mondayStr, sundayStr } = getDateStrs()

  const { stats, dateGroups, completedTasks, hasAnyTasks } = useMemo(() => {
    // Exclude deleted and subtasks
    const nonDeleted = todos.filter(t => t.status !== 'deleted' && !t.parentId)
    const pending = nonDeleted.filter(t => t.status === 'pending')
    const completed = nonDeleted.filter(t => t.status === 'completed')

    // === Stats ===
    const totalIncomplete = pending.length
    const dueToday = pending.filter(t => t.dueDate === todayStr).length
    const dueTomorrow = pending.filter(t => t.dueDate === tomorrowStr).length
    const dueDayAfter = pending.filter(t => t.dueDate === dayAfterStr).length
    const dueThisWeek = pending.filter(t => {
      if (!t.dueDate) return false
      return t.dueDate >= mondayStr && t.dueDate <= sundayStr
    }).length

    // === Date groups (mutually exclusive) ===
    const overdueGroup: Todo[] = []
    const todayGroup: Todo[] = []
    const tomorrowGroup: Todo[] = []
    const dayAfterGroup: Todo[] = []
    const thisWeekGroup: Todo[] = []
    const laterGroup: Todo[] = []
    const noDueDateGroup: Todo[] = []

    for (const t of pending) {
      if (!t.dueDate) {
        noDueDateGroup.push(t)
      } else if (t.dueDate < todayStr) {
        overdueGroup.push(t)
      } else if (t.dueDate === todayStr) {
        todayGroup.push(t)
      } else if (t.dueDate === tomorrowStr) {
        tomorrowGroup.push(t)
      } else if (t.dueDate === dayAfterStr) {
        dayAfterGroup.push(t)
      } else if (t.dueDate >= mondayStr && t.dueDate <= sundayStr) {
        thisWeekGroup.push(t)
      } else {
        laterGroup.push(t)
      }
    }

    // Sort each group by priority then sortOrder
    const priorityOrder = { P1: 0, P2: 1, P3: 2, P4: 3 }
    const sortFn = (a: Todo, b: Todo) => {
      const pDiff = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
      if (pDiff !== 0) return pDiff
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    }

    const groups: DateGroup[] = [
      { key: 'overdue', label: '已过期', icon: '⚠️', tasks: overdueGroup.sort(sortFn) },
      { key: 'today', label: '今天', icon: '📌', tasks: todayGroup.sort(sortFn) },
      { key: 'tomorrow', label: '明天', icon: '📅', tasks: tomorrowGroup.sort(sortFn) },
      { key: 'dayAfter', label: '后天', icon: '📆', tasks: dayAfterGroup.sort(sortFn) },
      { key: 'thisWeek', label: '本周内', icon: '📋', tasks: thisWeekGroup.sort(sortFn) },
      { key: 'later', label: '更晚', icon: '📁', tasks: laterGroup.sort(sortFn) },
      { key: 'noDueDate', label: '无截止日期', icon: '📝', tasks: noDueDateGroup.sort(sortFn) },
    ].filter(g => g.tasks.length > 0) // Hide empty groups

    return {
      stats: { totalIncomplete, dueToday, dueTomorrow, dueDayAfter, dueThisWeek },
      dateGroups: groups,
      completedTasks: completed,
      hasAnyTasks: nonDeleted.length > 0,
    }
  }, [todos, todayStr, tomorrowStr, dayAfterStr, mondayStr, sundayStr])

  if (loading) return <SkeletonCard />

  if (!hasAnyTasks) {
    return (
      <div className="space-y-1">
        <h2 className="text-xl font-bold gradient-text">📊 概况</h2>
        <p className="text-sm text-warm-400">所有任务的综合视图</p>
        <EmptyState
          icon="📊"
          title="暂无任务数据"
          description="在首页添加一些待办事项吧~"
        />
      </div>
    )
  }

  const statTiles = [
    { label: '未完成总数', value: stats.totalIncomplete, color: 'text-warm-700 dark:text-warm-300' },
    { label: '今天到期', value: stats.dueToday, color: 'text-red-500' },
    { label: '明天到期', value: stats.dueTomorrow, color: 'text-amber-500' },
    { label: '后天到期', value: stats.dueDayAfter, color: 'text-warm-600 dark:text-warm-400' },
    { label: '本周到期', value: stats.dueThisWeek, color: 'text-study-500 dark:text-study-400' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold gradient-text">📊 概况</h2>
        <p className="text-sm text-warm-400 mt-1">所有任务的综合视图</p>
      </div>

      {/* Stats tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statTiles.map(tile => (
          <div
            key={tile.label}
            className="glass rounded-2xl border border-warm-200/60 dark:border-warm-700/40 p-4 hover-lift text-center"
          >
            <div className={`text-3xl font-extrabold tabular-nums ${tile.color}`}>
              {tile.value}
            </div>
            <div className="text-xs text-warm-500 dark:text-warm-400 mt-1">
              {tile.label}
            </div>
          </div>
        ))}
      </div>

      {/* Date-grouped task list */}
      <div>
        {dateGroups.map(group => (
          <div key={group.key} className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{group.icon}</span>
              <h3 className="text-sm font-semibold text-warm-700 dark:text-warm-300">
                {group.label}
              </h3>
              <span className="text-xs bg-warm-200/40 dark:bg-warm-700/40 text-warm-500 dark:text-warm-400 px-2 py-0.5 rounded-full font-medium tabular-nums">
                {group.tasks.length}
              </span>
            </div>
            <div className="space-y-1">
              {group.tasks.map(todo => (
                <OverviewTaskRow key={todo.id} todo={todo} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Completed — collapsed by default */}
      {completedTasks.length > 0 && (
        <div className="mt-5">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-sm text-warm-400 hover:text-warm-500 dark:text-warm-500 dark:hover:text-warm-400 transition-all mb-3 group py-1"
          >
            <span className={`transform transition-transform duration-300 text-[10px] ${
              showCompleted ? 'rotate-90' : ''
            } group-hover:translate-x-0.5`}>
              ▶
            </span>
            <span>✅ 已完成</span>
            <span className="bg-warm-200/40 dark:bg-warm-700/40 text-warm-500 dark:text-warm-400 px-2 py-0.5 rounded-full text-xs font-medium tabular-nums">
              {completedTasks.length}
            </span>
          </button>

          {showCompleted && (
            <div className="space-y-1 opacity-60">
              {completedTasks.map(todo => (
                <OverviewTaskRow key={todo.id} todo={todo} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
