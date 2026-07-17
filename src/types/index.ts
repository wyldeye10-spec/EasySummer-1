// ============ 待办事项 ============
// Category now supports both preset and custom categories
export type PresetCategory = 'study' | 'work' | 'life' | 'other'
export type Category = PresetCategory | string
export type Priority = 'P1' | 'P2' | 'P3' | 'P4'
export type Quadrant = 'Q1' | 'Q2' | 'Q3' | 'Q4'
export type TodoStatus = 'pending' | 'completed' | 'deleted'
export type AppMode = 'study' | 'work'

export interface Todo {
  id: string
  title: string
  note?: string
  category: Category
  tags: string[]
  priority: Priority
  quadrant: Quadrant
  dueDate?: string      // ISO date string
  estimatedMinutes?: number
  actualMinutes?: number
  status: TodoStatus
  mode: AppMode
  parentId?: string     // sub-task parent
  sortOrder: number     // drag-and-drop ordering
  completedAt?: string  // ISO datetime
  deletedAt?: string    // for trash recovery (30-day window)
  createdAt: string
  updatedAt: string
}

// ============ 每日小结 ============
export interface DailySummary {
  id: string
  date: string          // 'YYYY-MM-DD'
  completedIds: string[]
  incompleteIds: string[]
  suggestion: string
  createdAt: string
}

// ============ 用户设置 ============
export interface UserSettings {
  id?: string               // Dexie primary key
  pomodoroMinutes: number
  dailySummaryTime: string   // '22:00'
  motivationalQuotes: string[]
  customCategories: { name: string; color: string }[]
  customTags: string[]
}

// ============ 输入解析结果 ============
export interface ParsedInput {
  title: string
  priority: Priority | null
  category: Category | null
  tags: string[]
  dueDate: string | null
  estimatedMinutes: number | null
}

// ============ 统计 ============
export interface TodoStats {
  total: number
  completed: number
  byCategory: Record<Category, { total: number; completed: number }>
  streak: number        // consecutive completion days
}
