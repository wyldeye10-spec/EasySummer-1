export function today(): string {
  return new Date().toISOString().split('T')[0]
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const w = weekDays[d.getDay()]
  return `${y}年${m}月${day}日 ${w}`
}

export function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date(new Date().toISOString().split('T')[0])
}

export function getRelativeDateDescription(dateStr: string): string {
  const target = new Date(dateStr)
  const now = new Date()
  const diffMs = target.getTime() - new Date(now.toISOString().split('T')[0]).getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '明天'
  if (diffDays === -1) return '昨天'
  if (diffDays > 1 && diffDays <= 7) return `${diffDays}天后`
  if (diffDays < -1 && diffDays >= -7) return `${-diffDays}天前`
  return formatDate(dateStr)
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const m = String(month).padStart(2, '0')
  return {
    start: `${year}-${m}-01`,
    end: `${year}-${m}-${String(getDaysInMonth(year, month)).padStart(2, '0')}`,
  }
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了，注意休息 🌙'
  if (hour < 9) return '早上好 ☀️'
  if (hour < 12) return '上午好 🌤️'
  if (hour < 14) return '中午好，记得休息 ☕'
  if (hour < 18) return '下午好 🌻'
  if (hour < 22) return '晚上好 🌆'
  return '夜深了，注意休息 🌙'
}
