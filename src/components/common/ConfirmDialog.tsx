interface Props {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold text-warm-900 mb-2">{title}</h3>
        <p className="text-warm-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-warm-700 bg-warm-100 rounded-lg hover:bg-warm-200 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${
              danger ? 'bg-red-500 hover:bg-red-600' : 'bg-warm-500 hover:bg-warm-600'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
