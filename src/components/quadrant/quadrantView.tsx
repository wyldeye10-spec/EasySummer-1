import { useCallback } from 'react'
import {
  DndContext,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useTodoStore } from '../../store/todoStore'
import type { Quadrant } from '../../types'
import { TodoItem } from '../dashboard/TodoItem'
import { EmptyState } from '../common/EmptyState'
import { SkeletonCard } from '../common/Skeleton'

const QUADRANT_CONFIG: Record<Quadrant, {
  title: string; subtitle: string; emoji: string;
  gradient: string; borderColor: string; bgColor: string
}> = {
  Q1: {
    title: '紧急重要', subtitle: '立即去做', emoji: '🔥',
    gradient: 'from-red-50/60 to-orange-50/30', borderColor: 'border-l-red-400', bgColor: 'bg-red-50/20',
  },
  Q2: {
    title: '重要不紧急', subtitle: '计划去做', emoji: '📋',
    gradient: 'from-study-50/60 to-blue-50/30', borderColor: 'border-l-study-400', bgColor: 'bg-study-50/20',
  },
  Q3: {
    title: '紧急不重要', subtitle: '快速处理', emoji: '⚡',
    gradient: 'from-amber-50/60 to-yellow-50/30', borderColor: 'border-l-amber-400', bgColor: 'bg-amber-50/20',
  },
  Q4: {
    title: '不重要不紧急', subtitle: '尽量减少', emoji: '🌿',
    gradient: 'from-warm-50/60 to-stone-50/30', borderColor: 'border-l-warm-300', bgColor: 'bg-warm-50/30',
  },
}

function QuadrantDropZone({ quadrant, children }: { quadrant: Quadrant; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `quadrant-${quadrant}` })
  return (
    <div
      ref={setNodeRef}
      className={`transition-all duration-200 rounded-2xl ${
        isOver ? 'ring-2 ring-warm-400/60 scale-[1.02] shadow-lg' : ''
      }`}
    >
      {children}
    </div>
  )
}

export function QuadrantView() {
  const todos = useTodoStore(s => s.todos)
  const loading = useTodoStore(s => s.loading)
  const completeTodo = useTodoStore(s => s.completeTodo)
  const undoCompleteTodo = useTodoStore(s => s.undoCompleteTodo)
  const deleteTodo = useTodoStore(s => s.deleteTodo)
  const updateTodo = useTodoStore(s => s.updateTodo)
  const moveToQuadrant = useTodoStore(s => s.moveToQuadrant)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const overId = String(over.id)
    // Check if dropped on a quadrant drop zone
    if (overId.startsWith('quadrant-')) {
      const targetQuadrant = overId.replace('quadrant-', '') as Quadrant
      moveToQuadrant(String(active.id), targetQuadrant)
    }
  }, [moveToQuadrant])

  if (loading) return <SkeletonCard />

  const byQuadrant = (q: Quadrant) =>
    todos
      .filter(t => t.status === 'pending' && t.quadrant === q)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold gradient-text">📐 四象限视图</h2>
        <p className="text-sm text-warm-400 mt-1">
          按照重要和紧急两个维度，把事项归入四个象限，帮你优先做正确的事
        </p>
        <p className="text-xs text-warm-400/70 mt-1">
          💡 拖拽事项卡片可在象限间移动
        </p>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.entries(QUADRANT_CONFIG) as [Quadrant, typeof QUADRANT_CONFIG[Quadrant]][]).map(
            ([key, config], idx) => {
              const items = byQuadrant(key)
              const isEmpty = items.length === 0
              return (
                <QuadrantDropZone key={key} quadrant={key}>
                  <div
                    className={`rounded-2xl border border-warm-200/60 border-l-4 ${config.borderColor} bg-gradient-to-br ${config.gradient} p-5 min-h-[200px] hover-lift transition-all animate-slide-up`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{config.emoji}</span>
                        <div>
                          <h3 className="font-semibold text-warm-800 text-sm">{config.title}</h3>
                          <p className="text-xs text-warm-400">{config.subtitle}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all ${
                        isEmpty
                          ? 'bg-warm-200/60 text-warm-500'
                          : 'bg-white/80 text-warm-700 shadow-sm'
                      }`}>
                        {items.length}
                      </span>
                    </div>

                    {isEmpty ? (
                      <EmptyState
                        icon="📭"
                        title="暂无事项"
                        description="拖拽事项到此处"
                      />
                    ) : (
                      <div className="space-y-1 max-h-[280px] overflow-y-auto">
                        {items.map((todo, i) => (
                          <TodoItem
                            key={todo.id}
                            todo={todo}
                            index={i}
                            onComplete={completeTodo}
                            onUndo={undoCompleteTodo}
                            onDelete={deleteTodo}
                            onEdit={updateTodo}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </QuadrantDropZone>
              )
            }
          )}
        </div>
      </DndContext>
    </div>
  )
}
