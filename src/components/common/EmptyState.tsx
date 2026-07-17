interface Props {
  icon?: string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon = '🎯', title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 animate-fade-in">
      <span className="text-5xl mb-4 animate-float">{icon}</span>
      <h3 className="text-base font-medium text-warm-600 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-warm-400 mb-4 text-center max-w-xs">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-gradient-to-br from-warm-400 to-warm-500 text-white rounded-xl hover:from-warm-500 hover:to-warm-600 transition-all shadow-md hover:shadow-lg active:scale-95 text-sm font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
