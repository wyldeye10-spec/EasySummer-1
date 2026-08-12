import type { Quadrant, PresetCategory } from '../types'

export const PRESET_CATEGORY_LABELS: Record<string, string> = {
  study: '学习',
  work: '工作',
  life: '生活',
  other: '其他',
}

export const PRESET_CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; hex: string }> = {
  study: { bg: 'bg-study-100 dark:bg-study-900/30', text: 'text-study-700 dark:text-study-300', border: 'border-study-400 dark:border-study-700', hex: '#4285f4' },
  work: { bg: 'bg-work-100 dark:bg-work-900/30', text: 'text-work-700 dark:text-work-300', border: 'border-work-400 dark:border-work-700', hex: '#ea4335' },
  life: { bg: 'bg-life-100 dark:bg-life-900/30', text: 'text-life-700 dark:text-life-300', border: 'border-life-400 dark:border-life-700', hex: '#34a853' },
  other: { bg: 'bg-other-100 dark:bg-other-900/30', text: 'text-other-700 dark:text-other-300', border: 'border-other-400 dark:border-other-700', hex: '#a142f4' },
}

/** 分类切换选项 — 仅 AppMode 三种（学习/工作/其他） */
export const CATEGORY_SWITCH_OPTIONS: { key: PresetCategory; label: string; emoji: string }[] = [
  { key: 'study', label: '学习', emoji: '📚' },
  { key: 'work', label: '工作', emoji: '💼' },
  { key: 'other', label: '其他', emoji: '📌' },
]

/**
 * Get the display label for a category (preset or custom).
 * Must be called within a component that has access to settings.
 */
export function getCategoryLabel(category: string, customCategories?: { name: string; color: string }[]): string {
  if (category in PRESET_CATEGORY_LABELS) {
    return PRESET_CATEGORY_LABELS[category]
  }
  // Check custom categories
  if (customCategories) {
    const custom = customCategories.find(c => c.name === category)
    if (custom) return custom.name
  }
  return category
}

/**
 * Get the color config for a category (preset or custom).
 * Must be called within a component that has access to settings.
 */
export function getCategoryColors(category: string, customCategories?: { name: string; color: string }[]): {
  bg: string; text: string; border: string; hex: string
} {
  if (category in PRESET_CATEGORY_COLORS) {
    return PRESET_CATEGORY_COLORS[category]
  }
  if (customCategories) {
    const custom = customCategories.find(c => c.name === category)
    if (custom) {
      return {
        bg: '',
        text: '',
        border: '',
        hex: custom.color,
      }
    }
  }
  return { bg: 'bg-warm-100', text: 'text-warm-700', border: 'border-warm-400', hex: '#4285f4' }
}

// Keep for backward compatibility
export const CATEGORY_LABELS = PRESET_CATEGORY_LABELS
export const CATEGORY_COLORS = PRESET_CATEGORY_COLORS

export const PRIORITY_LABELS: Record<string, string> = {
  P1: '紧急重要',
  P2: '重要不紧急',
  P3: '紧急不重要',
  P4: '不重要不紧急',
}

export const PRIORITY_CONFIG: Record<string, { emoji: string; label: string }> = {
  P1: { emoji: '🔥', label: '紧急重要' },
  P2: { emoji: '📋', label: '重要不紧急' },
  P3: { emoji: '⚡', label: '紧急不重要' },
  P4: { emoji: '🌿', label: '不重要不紧急' },
}

export const QUADRANT_PRIORITY_MAP: Record<string, Quadrant> = {
  P1: 'Q1',
  P2: 'Q2',
  P3: 'Q3',
  P4: 'Q4',
}

export const DEFAULT_MOTIVATIONAL_QUOTES = [
  '每一天都是新的开始 🌅',
  '先完成，再完美 ✨',
  '不积跬步，无以至千里 🏃',
  '今天的努力，是明天的底气 💪',
  '医学之路，贵在坚持 🩺',
  '累了就休息，但不要放弃 🌿',
  '做好每一件小事，就是了不起的大事 🌟',
]

export const DEFAULT_SETTINGS = {
  pomodoroMinutes: 25,
  dailySummaryTime: '22:00',
  motivationalQuotes: DEFAULT_MOTIVATIONAL_QUOTES,
  customCategories: [],
  customTags: ['今天前', '明晚前', '周三前', '周五前', '预计1h', '预计2h'],
  autoDarkMode: true,
}
