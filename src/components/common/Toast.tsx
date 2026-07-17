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
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : t.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
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
