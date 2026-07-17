import { create } from 'zustand'
import type { Todo, Category, Priority, Quadrant, TodoStatus, AppMode } from '../types'
import * as ops from '../db/storage'

interface TodoStore {
  todos: Todo[]
  loading: boolean

  // Actions
  loadTodos: () => Promise<void>
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>) => Promise<Todo>
  updateTodo: (id: string, updates: Partial<Todo>) => Promise<void>
  completeTodo: (id: string) => Promise<void>
  undoCompleteTodo: (id: string) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
  restoreTodo: (id: string) => Promise<void>
  permanentlyDeleteTodo: (id: string) => Promise<void>
  cleanupTrash: () => Promise<number>
  reorderTodos: (activeId: string, overId: string) => Promise<void>
  moveToQuadrant: (id: string, quadrant: Quadrant) => Promise<void>

  // Derived helpers
  getPendingTodos: () => Todo[]
  getCompletedTodos: () => Todo[]
  getTodayTodos: () => Todo[]
  getByQuadrant: (q: Quadrant) => Todo[]
  getByMode: (m: AppMode) => Todo[]
}

export const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],
  loading: false,

  loadTodos: async () => {
    set({ loading: true })
    const todos = await ops.getAllTodos()
    set({ todos, loading: false })
  },

  addTodo: async (input) => {
    const todo = await ops.addTodo(input)
    set(state => ({ todos: [todo, ...state.todos] }))
    return todo
  },

  updateTodo: async (id, updates) => {
    await ops.updateTodo(id, updates)
    set(state => ({
      todos: state.todos.map(t => (t.id === id ? { ...t, ...updates } : t)),
    }))
  },

  completeTodo: async (id) => {
    await ops.completeTodo(id)
    const now = new Date().toISOString()
    set(state => ({
      todos: state.todos.map(t =>
        t.id === id ? { ...t, status: 'completed' as TodoStatus, completedAt: now } : t
      ),
    }))
  },

  undoCompleteTodo: async (id) => {
    await ops.undoCompleteTodo(id)
    set(state => ({
      todos: state.todos.map(t =>
        t.id === id ? { ...t, status: 'pending' as TodoStatus, completedAt: undefined } : t
      ),
    }))
  },

  deleteTodo: async (id) => {
    await ops.softDeleteTodo(id)
    const now = new Date().toISOString()
    set(state => ({
      todos: state.todos.map(t =>
        t.id === id ? { ...t, status: 'deleted' as TodoStatus, deletedAt: now } : t
      ),
    }))
  },

  restoreTodo: async (id) => {
    await ops.restoreTodo(id)
    set(state => ({
      todos: state.todos.map(t =>
        t.id === id ? { ...t, status: 'pending' as TodoStatus, deletedAt: undefined } : t
      ),
    }))
  },

  permanentlyDeleteTodo: async (id) => {
    await ops.permanentlyDeleteTodo(id)
    set(state => ({ todos: state.todos.filter(t => t.id !== id) }))
  },

  cleanupTrash: async () => {
    const count = await ops.cleanupExpiredTrash()
    // Reload to get accurate state
    await get().loadTodos()
    return count
  },

  reorderTodos: async (activeId, overId) => {
    const todos = get().todos
    const activeTodo = todos.find(t => t.id === activeId)
    const overTodo = todos.find(t => t.id === overId)
    if (!activeTodo || !overTodo) return

    // Swap sortOrder values
    const activeOrder = activeTodo.sortOrder ?? 0
    const overOrder = overTodo.sortOrder ?? 0
    await ops.updateTodo(activeId, { sortOrder: overOrder })
    await ops.updateTodo(overId, { sortOrder: activeOrder })
    set(state => ({
      todos: state.todos.map(t => {
        if (t.id === activeId) return { ...t, sortOrder: overOrder }
        if (t.id === overId) return { ...t, sortOrder: activeOrder }
        return t
      }),
    }))
  },

  moveToQuadrant: async (id, quadrant) => {
    // Sync priority with quadrant: Q1→P1, Q2→P2, Q3→P3, Q4→P4
    const priorityMap: Record<Quadrant, Priority> = { Q1: 'P1', Q2: 'P2', Q3: 'P3', Q4: 'P4' }
    const priority = priorityMap[quadrant]
    await ops.updateTodo(id, { quadrant, priority } as Partial<Todo>)
    set(state => ({
      todos: state.todos.map(t =>
        t.id === id ? { ...t, quadrant, priority } : t
      ),
    }))
  },

  // Derived helpers
  getPendingTodos: () =>
    get().todos
      .filter(t => t.status === 'pending')
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
  getCompletedTodos: () => get().todos.filter(t => t.status === 'completed'),
  getTodayTodos: () => {
    const today = new Date().toISOString().split('T')[0]
    return get().todos.filter(t => t.status === 'pending' && t.dueDate === today)
  },
  getByQuadrant: (q) =>
    get().todos.filter(t => t.status === 'pending' && t.quadrant === q),
  getByMode: (m) =>
    get().todos.filter(t => t.status === 'pending' && t.mode === m),
}))
