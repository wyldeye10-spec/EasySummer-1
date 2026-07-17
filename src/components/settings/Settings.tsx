import { useState } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { useTodoStore } from '../../store/todoStore'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../../constants'
import { exportAsJSON, downloadFile } from '../../utils/export'
import type { Category } from '../../types'

export function Settings() {
  const { settings, update, reset } = useSettingsStore()
  const todos = useTodoStore(s => s.todos)
  const [saveLabel, setSaveLabel] = useState('')

  const handlePomodoroChange = (val: number) => {
    update({ pomodoroMinutes: Math.max(5, Math.min(60, val)) })
  }

  const handleAddQuote = (quote: string) => {
    if (quote.trim()) {
      update({ motivationalQuotes: [...settings.motivationalQuotes, quote.trim()] })
    }
  }

  const handleRemoveQuote = (index: number) => {
    update({
      motivationalQuotes: settings.motivationalQuotes.filter((_, i) => i !== index),
    })
  }

  const handleExportData = () => {
    const data = exportAsJSON({ todos, settings })
    downloadFile(data, 'summer-planner-backup.json', 'application/json')
    setSaveLabel('已导出 ✓')
    setTimeout(() => setSaveLabel(''), 2000)
  }

  const handleImportData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        JSON.parse(text)
        setSaveLabel('已导入 ✓')
        setTimeout(() => setSaveLabel(''), 2000)
      } catch {
        alert('导入失败：文件格式不正确')
      }
    }
    input.click()
  }

  const handleReset = () => {
    if (confirm('确定要重置所有设置吗？待办事项数据不会受影响。')) {
      reset()
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h2 className="text-xl font-bold gradient-text">⚙️ 设置</h2>

      {/* Pomodoro */}
      <div className="glass rounded-2xl border border-warm-200/60 p-5 hover-lift">
        <h3 className="font-semibold text-warm-800 mb-3 flex items-center gap-2">
          <span className="text-lg">🍅</span> 番茄钟时长
        </h3>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={settings.pomodoroMinutes}
            onChange={e => handlePomodoroChange(parseInt(e.target.value))}
            className="flex-1 accent-warm-500 h-2 rounded-full"
          />
          <span className="text-sm font-mono font-bold text-warm-700 bg-warm-100 px-3 py-1.5 rounded-xl min-w-[4rem] text-center">
            {settings.pomodoroMinutes} 分钟
          </span>
        </div>
        <div className="flex justify-between text-[10px] text-warm-400 mt-1 px-1">
          <span>5</span><span>25</span><span>60</span>
        </div>
      </div>

      {/* Daily Summary Time */}
      <div className="glass rounded-2xl border border-warm-200/60 p-5 hover-lift">
        <h3 className="font-semibold text-warm-800 mb-3 flex items-center gap-2">
          <span className="text-lg">🕙</span> 每日小结提醒
        </h3>
        <input
          type="time"
          value={settings.dailySummaryTime}
          onChange={e => update({ dailySummaryTime: e.target.value })}
          className="px-4 py-2 glass border border-warm-200/60 rounded-xl text-sm text-warm-700 focus:outline-none focus:ring-2 focus:ring-warm-300/30"
        />
      </div>

      {/* Motivational Quotes */}
      <div className="glass rounded-2xl border border-warm-200/60 p-5 hover-lift">
        <h3 className="font-semibold text-warm-800 mb-4 flex items-center gap-2">
          <span className="text-lg">💬</span> 励志短句库
        </h3>
        <div className="space-y-2 mb-4">
          {settings.motivationalQuotes.map((q, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm text-warm-700 bg-warm-50/70 px-4 py-2.5 rounded-xl border border-warm-200/40 group hover:border-warm-300/60 transition-all"
            >
              <span className="flex-1">{q}</span>
              <button
                onClick={() => handleRemoveQuote(i)}
                className="opacity-0 group-hover:opacity-100 text-warm-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-lg transition-all"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            id="new-quote"
            type="text"
            placeholder="添加一句励志短句..."
            className="flex-1 px-4 py-2 bg-warm-50/50 border border-warm-200/60 rounded-xl text-sm text-warm-700 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-warm-300/30"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleAddQuote((e.target as HTMLInputElement).value)
                ;(e.target as HTMLInputElement).value = ''
              }
            }}
          />
          <button
            onClick={() => {
              const el = document.getElementById('new-quote') as HTMLInputElement
              handleAddQuote(el.value)
              el.value = ''
            }}
            className="px-4 py-2 bg-gradient-to-br from-warm-400 to-warm-500 text-white rounded-xl text-sm font-medium hover:from-warm-500 hover:to-warm-600 transition-all shadow-md active:scale-95"
          >
            添加
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="glass rounded-2xl border border-warm-200/60 p-5 hover-lift">
        <h3 className="font-semibold text-warm-800 mb-3 flex items-center gap-2">
          <span className="text-lg">📂</span> 预设分类
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(([key, label]) => {
            const colors = CATEGORY_COLORS[key]
            return (
              <span
                key={key}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium ${colors.bg} ${colors.text} border ${colors.border} hover-lift`}
              >
                {label}
              </span>
            )
          })}
        </div>

        {/* Custom categories */}
        <h4 className="text-sm font-medium text-warm-600 dark:text-warm-400 mb-2">
          自定义分类
        </h4>
        <div className="flex flex-wrap gap-2 mb-3">
          {settings.customCategories.length === 0 && (
            <p className="text-sm text-warm-400">暂无自定义分类</p>
          )}
          {settings.customCategories.map((cat, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border group"
              style={{ backgroundColor: cat.color + '20', color: cat.color, borderColor: cat.color + '40' }}
            >
              {cat.name}
              <button
                onClick={() => update({
                  customCategories: settings.customCategories.filter((_, idx) => idx !== i),
                })}
                className="text-warm-400 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-all"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            id="new-cat-name"
            type="text"
            placeholder="分类名称..."
            className="flex-1 px-4 py-2 bg-warm-50/50 dark:bg-warm-800/50 border border-warm-200/60 dark:border-warm-700/40 rounded-xl text-sm text-warm-700 dark:text-warm-200 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-warm-300/30"
          />
          <input
            id="new-cat-color"
            type="color"
            defaultValue="#c49a5c"
            className="w-10 h-10 rounded-xl border border-warm-200/60 cursor-pointer"
          />
          <button
            onClick={() => {
              const nameEl = document.getElementById('new-cat-name') as HTMLInputElement
              const colorEl = document.getElementById('new-cat-color') as HTMLInputElement
              const name = nameEl.value.trim()
              const color = colorEl.value
              if (name) {
                update({ customCategories: [...settings.customCategories, { name, color }] })
                nameEl.value = ''
              }
            }}
            className="px-4 py-2 bg-gradient-to-br from-warm-400 to-warm-500 text-white rounded-xl text-sm font-medium hover:from-warm-500 hover:to-warm-600 transition-all shadow-md active:scale-95"
          >
            添加
          </button>
        </div>
      </div>

      {/* Tag Management */}
      <div className="glass rounded-2xl border border-warm-200/60 p-5 hover-lift">
        <h3 className="font-semibold text-warm-800 mb-4 flex items-center gap-2">
          <span className="text-lg">🏷️</span> 自定义标签
          <span className="text-xs text-warm-400 font-normal">
            （在输入框中使用 #标签名 即可）
          </span>
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {settings.customTags.length === 0 && (
            <p className="text-sm text-warm-400">暂无自定义标签，添加一个吧～</p>
          )}
          {settings.customTags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-warm-100/80 dark:bg-warm-800/60 text-warm-700 dark:text-warm-300 border border-warm-200/50 dark:border-warm-700/50 group"
            >
              #{tag}
              <button
                onClick={() => update({
                  customTags: settings.customTags.filter(t => t !== tag),
                })}
                className="text-warm-400 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-all"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            id="new-tag"
            type="text"
            placeholder="输入标签名..."
            className="flex-1 px-4 py-2 bg-warm-50/50 dark:bg-warm-800/50 border border-warm-200/60 dark:border-warm-700/40 rounded-xl text-sm text-warm-700 dark:text-warm-200 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-warm-300/30"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value.trim()
                if (val && !settings.customTags.includes(val)) {
                  update({ customTags: [...settings.customTags, val] })
                }
                ;(e.target as HTMLInputElement).value = ''
              }
            }}
          />
          <button
            onClick={() => {
              const el = document.getElementById('new-tag') as HTMLInputElement
              const val = el.value.trim()
              if (val && !settings.customTags.includes(val)) {
                update({ customTags: [...settings.customTags, val] })
              }
              el.value = ''
            }}
            className="px-4 py-2 bg-gradient-to-br from-warm-400 to-warm-500 text-white rounded-xl text-sm font-medium hover:from-warm-500 hover:to-warm-600 transition-all shadow-md active:scale-95"
          >
            添加
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="glass rounded-2xl border border-warm-200/60 p-5 hover-lift">
        <h3 className="font-semibold text-warm-800 mb-4 flex items-center gap-2">
          <span className="text-lg">💾</span> 数据管理
          {saveLabel && (
            <span className="text-xs text-emerald-500 animate-scale-in">{saveLabel}</span>
          )}
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportData}
            className="px-4 py-2.5 bg-gradient-to-br from-warm-400 to-warm-500 text-white rounded-xl text-sm font-medium hover:from-warm-500 hover:to-warm-600 transition-all shadow-md active:scale-95"
          >
            📥 导出数据 (JSON)
          </button>
          <button
            onClick={handleImportData}
            className="px-4 py-2.5 bg-warm-100/80 text-warm-700 rounded-xl text-sm font-medium hover:bg-warm-200 transition-all active:scale-95"
          >
            📤 导入数据
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2.5 bg-red-50 text-red-500 rounded-xl text-sm font-medium hover:bg-red-100 transition-all active:scale-95"
          >
            🔄 重置设置
          </button>
        </div>
      </div>
    </div>
  )
}
