import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import type { Todo } from '../../types'
import { getCategoryLabel } from '../../constants'
import { useSettingsStore } from '../../store/settingsStore'

interface Props {
  todos: Todo[]
}

const PRESET_PIE_COLORS: Record<string, string> = {
  '学习': '#5a9ec9',
  '工作': '#d97c63',
  '生活': '#6ab880',
  '其他': '#a895c5',
}

export function CategoryPieChart({ todos }: Props) {
  const customCategories = useSettingsStore(s => s.settings.customCategories)

  const { data, colorMap } = useMemo(() => {
    const byCategory = new Map<string, { value: number; rawCategory: string }>()
    for (const t of todos) {
      if (t.status === 'completed') {
        const label = getCategoryLabel(t.category, customCategories)
        const entry = byCategory.get(label)
        if (entry) {
          entry.value++
        } else {
          byCategory.set(label, { value: 1, rawCategory: t.category })
        }
      }
    }

    const data = Array.from(byCategory.entries())
      .map(([name, info]) => ({
        name,
        value: info.value,
        rawCategory: info.rawCategory,
      }))
      .sort((a, b) => b.value - a.value)

    // Build color map: preset colors + custom category colors
    const colorMap: Record<string, string> = { ...PRESET_PIE_COLORS }
    for (const cat of customCategories) {
      colorMap[cat.name] = cat.color
    }
    // Also add preset category colors keyed by label
    colorMap['学习'] = '#5a9ec9'
    colorMap['工作'] = '#d97c63'
    colorMap['生活'] = '#6ab880'
    colorMap['其他'] = '#a895c5'

    return { data, colorMap }
  }, [todos, customCategories])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-warm-400">
        暂无数据
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
          animationBegin={0}
          animationDuration={800}
          animationEasing="ease-out"
        >
          {data.map(entry => (
            <Cell
              key={entry.name}
              fill={colorMap[entry.name] || colorMap[entry.rawCategory] || '#c49a5c'}
              stroke="none"
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid rgba(196,154,92,0.2)',
            borderRadius: '12px',
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
          formatter={(value: number) => [`${value} 项`, '完成']}
        />
        <Legend
          verticalAlign="bottom"
          height={32}
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => (
            <span style={{ color: '#8f6332', fontSize: '12px' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
