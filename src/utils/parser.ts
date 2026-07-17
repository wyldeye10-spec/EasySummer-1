import type { ParsedInput, Priority, Category } from '../types'

/**
 * Parse a natural-language todo input into structured fields.
 * Examples:
 *   "周三前复习完生理学第三章 /p1" → { title: "复习完生理学第三章", priority: "P1", dueDate: 本周三 }
 *   "买实验器材 @工作 #科技实践部 /p2 预计2h" → { title: "买实验器材", category: "work", tags: ["科技实践部"], priority: "P2", estimatedMinutes: 120 }
 *
 * @param raw - Raw input string
 * @param customCategories - User's custom categories from settings, for @customName matching
 */
export function parseInput(raw: string, customCategories: { name: string; color: string }[] = []): ParsedInput {
  let title = raw.trim()
  let priority: Priority | null = null
  let category: Category | null = null
  const tags: string[] = []
  let estimatedMinutes: number | null = null
  let dueDate: string | null = null

  // Extract priority: /p1, /P1, /p2, etc.
  const priorityMatch = title.match(/\/([pP][1-4])\b/)
  if (priorityMatch) {
    priority = priorityMatch[1].toUpperCase() as Priority
    title = title.replace(priorityMatch[0], '')
  }

  // Extract tags: #tagName
  const tagRegex = /#(\S+)/g
  let tagMatch: RegExpExecArray | null
  while ((tagMatch = tagRegex.exec(title)) !== null) {
    tags.push(tagMatch[1])
  }
  title = title.replace(/#\S+/g, '')

  // Extract category: @study, @work, @life, @other, or @customCategory
  const catMap: Record<string, Category> = {
    study: 'study', 学习: 'study',
    work: 'work', 工作: 'work',
    life: 'life', 生活: 'life',
    other: 'other', 其他: 'other',
  }
  // Build regex that includes custom category names
  const customNames = customCategories.map(c => c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const catPattern = customNames.length > 0
    ? new RegExp(`@(study|work|life|other|学习|工作|生活|其他${customNames ? '|' + customNames : ''})\\b`)
    : /@(study|work|life|other|学习|工作|生活|其他)\b/
  const categoryMatch = title.match(catPattern)
  if (categoryMatch) {
    const cat = categoryMatch[1]
    category = catMap[cat] ?? cat // Use the matched name directly for custom categories
    title = title.replace(categoryMatch[0], '')
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

  // Auto-detect category from keywords
  if (!category) {
    const studyKeywords = /复习|考试|学习|课程|实验报告|论文|阅读|背|记|练|题|生理|生化|病理|药理|解剖|诊断|内科|外科|妇产|儿科/
    const workKeywords = /部门|会议|文档|策划|活动|团委|科技实践|部长|老师|汇报|总结|申请|材料/
    const lifeKeywords = /跑步|运动|健身|作息|早睡|早起|吃|饭|打扫|整理|购物|买/

    if (studyKeywords.test(title)) category = 'study'
    else if (workKeywords.test(title)) category = 'work'
    else if (lifeKeywords.test(title)) category = 'life'
    else category = 'other'
  }

  // Clean up title
  title = title.replace(/\s+/g, ' ').trim()

  return {
    title: title || raw.trim(),
    priority,
    category,
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
