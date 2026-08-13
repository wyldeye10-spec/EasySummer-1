import { useUIStore } from '../../store/uiStore'

export function Toast() {
  const toasts = useUIStore(s => s.toasts)
  const removeToast = useUIStore(s => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl shadow-md text-sm font-medium flex items-center gap-2 animate-[slideIn_0.3s_ease-out] ${
            t.type === 'success'
              ? 'bg-life-50 text-life-700 border border-life-200'
              : t.type === 'error'
              ? 'bg-work-50 text-work-700 border border-work-200'
              : 'bg-study-50 text-study-700 border border-study-200'
          }`}
          onClick={() => removeToast(t.id)}
        >
          <span>
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✗' : 'ℹ'}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  )
}
