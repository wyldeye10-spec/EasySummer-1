export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gradient-to-r from-warm-200 via-warm-100 to-warm-200 bg-[length:200%_100%] rounded-lg ${className}`}
      style={{ animation: 'shimmer 1.5s infinite' }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-5 h-5 rounded-full" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="w-16 h-5" />
        </div>
      ))}
    </div>
  )
}
