import { useState } from 'react'
import type { MonthlyHighlight } from '../../types'

const HIGHLIGHT_EMOJIS = ['🏆', '🎉', '💪', '📚', '🏅', '🌟', '🎓', '❤️', '🚀', '😊', '🎯', '✨']

interface Props {
  highlights: MonthlyHighlight[]
  onAdd: (emoji: string, text: string) => void
  onRemove: (id: string) => void
}

export function HighlightsSection({ highlights, onAdd, onRemove }: Props) {
  const [text, setText] = useState('')
  const [emoji, setEmoji] = useState('✨')

  const handleAdd = () => {
    const t = text.trim()
    if (!t) return
    onAdd(emoji, t)
    setText('')
  }

  return (
    <div className="glass rounded-2xl border border-warm-200/60 p-5">
      <h3 className="font-semibold text-warm-800 mb-3 flex items-center gap-2">
        <span className="text-xl">✨</span> 高光时刻
      </h3>

      {/* Emoji palette */}
      <div className="flex flex-wrap gap-1 mb-2.5">
        {HIGHLIGHT_EMOJIS.map(e => (
          <button
            key={e}
            onClick={() => setEmoji(e)}
            title="选择图标"
            className={`w-7 h-7 flex items-center justify-center rounded-lg text-base transition-all ${
              emoji === e
                ? 'bg-study-100 dark:bg-study-900/40 ring-2 ring-study-400/60 scale-110'
                : 'hover:bg-warm-100 dark:hover:bg-warm-800'
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Add input */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          placeholder="记录一个瞬间..."
          className="flex-1 min-w-0 px-3 py-2 bg-warm-50/50 dark:bg-warm-800/50 border border-warm-200/60 dark:border-warm-700/40 rounded-xl text-sm text-warm-700 dark:text-warm-200 placeholder-warm-400 focus:outline-none focus:ring-2 focus:ring-study-500/30"
        />
        <button
          onClick={handleAdd}
          disabled={!text.trim()}
          className="px-3 py-2 bg-study-600 text-white rounded-xl text-sm font-medium hover:bg-study-700 disabled:opacity-40 disabled:cursor-default transition-all active:scale-95"
        >
          添加
        </button>
      </div>

      {/* List */}
      {highlights.length === 0 ? (
        <p className="text-xs text-warm-400 py-3 text-center">记录这个月值得记住的瞬间 ✨</p>
      ) : (
        <ul className="space-y-1.5">
          {highlights.map(h => (
            <li
              key={h.id}
              className="group flex items-start gap-2 px-2.5 py-2 rounded-xl bg-warm-50/60 dark:bg-warm-800/40 border border-warm-100/60 dark:border-warm-700/30 text-sm"
            >
              <span className="text-base leading-snug flex-shrink-0">{h.emoji}</span>
              <span className="flex-1 min-w-0 text-warm-700 dark:text-warm-300 break-words">{h.text}</span>
              <button
                onClick={() => onRemove(h.id)}
                title="删除"
                className="opacity-0 group-hover:opacity-100 text-warm-400 hover:text-work-500 text-xs transition-all flex-shrink-0"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
