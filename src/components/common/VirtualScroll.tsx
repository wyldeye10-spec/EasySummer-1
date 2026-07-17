import { useRef, useState, useCallback, useEffect, type ReactNode } from 'react'

interface Props<T> {
  items: T[]
  itemHeight: number           // fixed height per item in px
  overscan?: number            // extra items above/below viewport (default 10)
  threshold?: number           // items count above which virtual scrolling activates (default 100)
  renderItem: (item: T, index: number) => ReactNode
  className?: string
}

/**
 * Lightweight virtual scrolling using the windowing pattern.
 * Only renders items visible in the viewport plus overscan buffer.
 * Falls back to rendering all items when count is below threshold.
 */
export function VirtualScroll<T>({
  items,
  itemHeight,
  overscan = 10,
  threshold = 100,
  renderItem,
  className = '',
}: Props<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  // If below threshold, render everything (no virtualization needed)
  if (items.length < threshold) {
    return (
      <div className={className}>
        {items.map((item, i) => renderItem(item, i))}
      </div>
    )
  }

  const totalHeight = items.length * itemHeight
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = items.slice(startIndex, endIndex)
  const offsetY = startIndex * itemHeight

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop)
    }
  }, [])

  // Measure container on mount and resize
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height)
      }
    })
    observer.observe(el)
    setContainerHeight(el.clientHeight)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-y-auto ${className}`}
      style={{ maxHeight: '70vh' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, i) => {
            const actualIndex = startIndex + i
            return renderItem(item, actualIndex)
          })}
        </div>
      </div>
    </div>
  )
}
