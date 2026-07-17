import { useState, useMemo, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useTodos } from '../../hooks/useTodos'
import { TodoItem } from './TodoItem'
import { EmptyState } from '../common/EmptyState'
import { SkeletonCard } from '../common/Skeleton'
import { VirtualScroll } from '../common/VirtualScroll'

const VIRTUAL_SCROLL_THRESHOLD = 500

export function TodoList() {
  const { todos, loading, completeTodo, undoCompleteTodo, deleteTodo, updateTodo, reorderTodos } = useTodos()
  const [showAllCompleted, setShowAllCompleted] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // drag must move 8px before activating (avoid accidental drags)
      },
    })
  )

  // Merge pending + recent completed into one unified list
  // Exclude subtasks from the main list — they render under their parent
  const { displayList, olderCompleted, completionRate, totalCount, pendingIds } = useMemo(() => {
    const pending = todos
      .filter(t => t.status === 'pending' && !t.parentId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

    const allCompleted = todos
      .filter(t => t.status === 'completed' && !t.parentId)
      .sort((a, b) =>
        new Date(b.completedAt || b.updatedAt).getTime() -
        new Date(a.completedAt || a.updatedAt).getTime()
      )

    // Show today's completed inline; older ones go to the collapsible section
    const today = new Date().toISOString().split('T')[0]
    const todayCompleted = allCompleted.filter(t => t.completedAt?.startsWith(today))
    const olderCompleted = allCompleted.filter(t => !t.completedAt?.startsWith(today))

    const displayList = [...pending, ...todayCompleted]
    const total = pending.length + allCompleted.length
    const pendingIds = pending.map(t => t.id)

    return {
      displayList,
      olderCompleted,
      completionRate: total > 0 ? Math.round((allCompleted.length / total) * 100) : 0,
      totalCount: total,
      pendingIds,
    }
  }, [todos])

  const handleComplete = useCallback((id: string) => {
    completeTodo(id)
  }, [completeTodo])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    reorderTodos(String(active.id), String(over.id))
  }, [reorderTodos])

  if (loading) return <SkeletonCard />

  return (
    <div>
      {/* Progress header */}
      {totalCount > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-warm-500 font-medium">
              今日进度
            </span>
            <span className="text-xs font-bold text-warm-700 tabular-nums">
              {todos.filter(t => t.status === 'completed').length}/{totalCount}
            </span>
          </div>
          <div className="h-2 bg-warm-200/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                completionRate === 100
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                  : completionRate > 50
                    ? 'bg-gradient-to-r from-study-400 to-study-500'
                    : 'bg-gradient-to-r from-warm-400 to-warm-500'
              } ${completionRate > 0 && completionRate < 100 ? 'stripe-progress' : ''}`}
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      )}

      {/* Unified list: pending first (with drag-and-drop), then completed inline */}
      {displayList.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="这里还没有待办事项"
          description="试试在上方输入框添加一个吧~"
        />
      ) : pendingIds.length >= VIRTUAL_SCROLL_THRESHOLD ? (
        /* Virtual scrolling for very large lists (>=500 pending items) */
        <>
          <p className="text-xs text-warm-400/70 mb-2 flex items-center gap-1">
            <span>⚡ 已启用虚拟滚动（共 {pendingIds.length} 项）</span>
            <span className="text-[10px] text-warm-400/50">— 拖拽排序暂时不可用</span>
          </p>
          <VirtualScroll
            items={displayList}
            itemHeight={80}
            overscan={10}
            threshold={VIRTUAL_SCROLL_THRESHOLD}
            renderItem={(todo, i) => (
              <div className="px-0.5 py-0.5">
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  index={i}
                  onComplete={handleComplete}
                  onUndo={undoCompleteTodo}
                  onDelete={deleteTodo}
                  onEdit={updateTodo}
                />
              </div>
            )}
          />
          {/* All-done celebration */}
          {displayList.every(t => t.status === 'completed') && (
            <div className="text-center py-6 animate-scale-in">
              <span className="text-5xl block mb-3 animate-float">🎉</span>
              <p className="text-warm-600 font-bold text-lg">全部完成！</p>
              <p className="text-sm text-warm-400 mt-1">干得漂亮，今天真棒！</p>
            </div>
          )}
        </>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={pendingIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {displayList.map((todo, i) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  index={i}
                  onComplete={handleComplete}
                  onUndo={undoCompleteTodo}
                  onDelete={deleteTodo}
                  onEdit={updateTodo}
                />
              ))}

              {/* All-done celebration */}
              {displayList.every(t => t.status === 'completed') && displayList.length > 0 && (
                <div className="text-center py-6 animate-scale-in">
                  <span className="text-5xl block mb-3 animate-float">🎉</span>
                  <p className="text-warm-600 font-bold text-lg">全部完成！</p>
                  <p className="text-sm text-warm-400 mt-1">干得漂亮，今天真棒！</p>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Drag hint — shown when there are pending items (only when DnD is active) */}
      {pendingIds.length > 1 && pendingIds.length < VIRTUAL_SCROLL_THRESHOLD && (
        <p className="text-center mt-3 text-xs text-warm-400/70">
          💡 拖拽事项卡片可调整顺序
        </p>
      )}

      {/* Older completed (before today) — collapsible */}
      {olderCompleted.length > 0 && (
        <div className="mt-5 animate-fade-in">
          <button
            onClick={() => setShowAllCompleted(!showAllCompleted)}
            className="flex items-center gap-2 text-sm text-warm-400 hover:text-warm-500 transition-all mb-3 group py-1"
          >
            <span className={`transform transition-transform duration-300 text-[10px] ${
              showAllCompleted ? 'rotate-90' : ''
            } group-hover:translate-x-0.5`}>
              ▶
            </span>
            <span>更早完成</span>
            <span className="bg-warm-200/40 text-warm-500 px-2 py-0.5 rounded-full text-xs font-medium tabular-nums">
              {olderCompleted.length}
            </span>
          </button>

          {showAllCompleted && (
            <div className="space-y-1 opacity-60">
              {olderCompleted.map((todo, i) => (
                <div key={todo.id} className="animate-slide-down" style={{ animationDelay: `${i * 0.03}s` }}>
                  <TodoItem
                    todo={todo}
                    index={i}
                    onComplete={handleComplete}
                    onUndo={undoCompleteTodo}
                    onDelete={deleteTodo}
                    onEdit={updateTodo}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
