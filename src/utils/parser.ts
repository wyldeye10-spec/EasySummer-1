import type { ParsedInput, Priority } from '../types'

/**
 * Parse a natural-language todo input into structured fields.
 * Examples:
 *   "周三前复习完生理学第三章 /p1" → { title: "复习完生理学第三章", priority: "P1", dueDate: 本周三 }
 *   "买实验器材 /p2 预计2h" → { title: "买实验器材", priority: "P2", estimatedMinutes: 120 }
 *
 * Category is now determined by the current study/work mode toggle, not parsed from input.
 * Tags (#tagName) are no longer parsed from input — the manual tag feature has been removed.
 *
 * @param raw - Raw input string
 */
export function parseInput(raw: string): ParsedInput {
  let title = raw.trim()
  let priority: Priority | null = null
  const tags: string[] = []
  let estimatedMinutes: number | null = null
  let dueDate: string | null = null

  // Extract priority: /p1, /P1, /p2, etc.
  const priorityMatch = title.match(/\/([pP][1-4])\b/)
  if (priorityMatch) {
    priority = priorityMatch[1].toUpperCase() as Priority
    title = title.replace(priorityMatch[0], '')
  }

  // Extract estimated time: 预计Xh, 预计X小时, ~Xh, Xmin
  const timeMatch = title.match(/(?:预计|约)?(\d+)\s*(?:h|小时|min|分钟|分钟)\b/)
  if (timeMatch) {
    const val = parseInt(timeMatch[1])
    if (timeMatch[0].includes('min') || timeMatch[0].includes('分钟') || timeMatch[0].includes('分钟')) {
      estimatedMinutes = val
    } else {
      estimatedMinutes = val * 60
    }
    title = title.replace(timeMatch[0], '')
  }

  // Extract due date: Chinese relative dates
  const datePatterns: [RegExp, (m: RegExpMatchArray) => string][] = [
    // 周三前, 周五前
    [/周(一|二|三|四|五|六|日|天)前?/, (m) => {
      const dayMap: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 0, 天: 0 }
      const targetDay = dayMap[m[1]]
      return getNextWeekday(targetDay)
    }],
    // 明天, 明天前
    [/明[天日]前?/, () => {
      const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]
    }],
    // 后天
    [/后[天日]前?/, () => {
      const d = new Date(); d.setDate(d.getDate() + 2); return d.toISOString().split('T')[0]
    }],
    // 今天
    [/今[天日]前?/, () => new Date().toISOString().split('T')[0]],
    // 下周X
    [/下周(一|二|三|四|五|六|日|天)/, (m) => {
      const dayMap: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 0, 天: 0 }
      const targetDay = dayMap[m[1]]
      return getNextWeekday(targetDay, 1)
    }],
    // 下个月, 下月
    [/下个?月/, () => {
      const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().split('T')[0]
    }],
    // ISO date: 2026-07-20
    [/(\d{4}-\d{2}-\d{2})/, (m) => m[1]],
  ]

  for (const [regex, fn] of datePatterns) {
    const match = title.match(regex)
    if (match) {
      dueDate = fn(match)
      title = title.replace(match[0], '')
      break
    }
  }

  // Clean up title
  title = title.replace(/\s+/g, ' ').trim()

  return {
    title: title || raw.trim(),
    priority,
    category: null,  // Category is now set from the mode toggle in QuickInput
    tags,
    dueDate,
    estimatedMinutes,
  }
}

function getNextWeekday(targetDay: number, weekOffset = 0): string {
  const d = new Date()
  const currentDay = d.getDay()
  let diff = targetDay - currentDay
  if (diff <= 0) diff += 7
  diff += weekOffset * 7
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}
