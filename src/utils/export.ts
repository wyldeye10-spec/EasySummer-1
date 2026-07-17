import type { Todo, DailySummary } from '../types'
import { CATEGORY_LABELS, PRIORITY_LABELS } from '../constants'
import { formatDate } from './date'

export function exportTodosAsMarkdown(todos: Todo[]): string {
  const lines: string[] = ['# 📋 待办事项导出', '', `导出时间：${new Date().toLocaleString()}`, '']

  const byCategory = new Map<string, Todo[]>()
  for (const t of todos) {
    const cat = CATEGORY_LABELS[t.category] || t.category
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push(t)
  }

  for (const [cat, items] of byCategory) {
    lines.push(`## ${cat}`, '')
    for (const t of items) {
      const check = t.status === 'completed' ? 'x' : ' '
      const p = PRIORITY_LABELS[t.priority] || t.priority
      const due = t.dueDate ? ` 📅 ${t.dueDate}` : ''
      lines.push(`- [${check}] **${t.title}** — ${p}${due}`)
      if (t.note) lines.push(`  > ${t.note}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

export function exportMonthlyJournalMarkdown(
  year: number,
  month: number,
  todos: Todo[],
  highlights: string,
  nextGoals: string
): string {
  const lines: string[] = [
    `# 📓 ${year}年${month}月 月度总结`,
    '',
    `生成时间：${new Date().toLocaleString()}`,
    '',
  ]

  const completed = todos.filter(t => t.status === 'completed')
  const byCategory = new Map<string, number>()
  for (const t of completed) {
    const cat = CATEGORY_LABELS[t.category] || t.category
    byCategory.set(cat, (byCategory.get(cat) || 0) + 1)
  }

  lines.push('## 📊 统计', '')
  lines.push(`- 本月完成事项：${completed.length} 项`, '')
  lines.push('### 分类占比', '')
  for (const [cat, count] of byCategory) {
    const pct = completed.length > 0 ? ((count / completed.length) * 100).toFixed(1) : '0'
    lines.push(`- ${cat}：${count} (${pct}%)`)
  }
  lines.push('')

  lines.push('## ✨ 本月高光时刻', '', highlights || '_暂无_', '')
  lines.push('## 🎯 下月目标', '', nextGoals || '_暂无_', '')
  lines.push('---', '', '> 由 Summer Planner 生成')

  return lines.join('\n')
}

export function exportAsJSON(data: unknown): string {
  return JSON.stringify(data, null, 2)
}

export function downloadFile(content: string, filename: string, type: string = 'text/markdown') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  a.remove()
}
