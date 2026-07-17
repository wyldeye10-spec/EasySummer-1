export const PRESET_CATEGORY_LABELS: Record<string, string> = {
  study: '学习',
  work: '工作',
  life: '生活',
  other: '其他',
}

export const PRESET_CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; hex: string }> = {
  study: { bg: 'bg-study-100', text: 'text-study-700', border: 'border-study-400', hex: '#5a9ec9' },
  work: { bg: 'bg-work-100', text: 'text-work-700', border: 'border-work-400', hex: '#d97c63' },
  life: { bg: 'bg-life-100', text: 'text-life-700', border: 'border-life-400', hex: '#6ab880' },
  other: { bg: 'bg-other-100', text: 'text-other-700', border: 'border-other-400', hex: '#a895c5' },
}

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
  return { bg: 'bg-warm-100', text: 'text-warm-700', border: 'border-warm-400', hex: '#c49a5c' }
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

import type { Quadrant } from '../types'

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
  customTags: [],
}
