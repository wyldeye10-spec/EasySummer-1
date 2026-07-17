import { nanoid } from 'nanoid'
import { db } from './database'
import type { Todo, DailySummary, UserSettings } from '../types'

// ============ Todo CRUD ============

export async function getAllTodos(): Promise<Todo[]> {
  return db.todos.toArray()
}

export async function getTodosByStatus(status: Todo['status']): Promise<Todo[]> {
  return db.todos.where('status').equals(status).toArray()
}

export async function getTodosByDate(date: string): Promise<Todo[]> {
  return db.todos
    .filter(t => t.status !== 'deleted' && t.dueDate === date)
    .toArray()
}

export async function getTodosByQuadrant(quadrant: Todo['quadrant']): Promise<Todo[]> {
  return db.todos
    .where('quadrant')
    .equals(quadrant)
    .filter(t => t.status === 'pending')
    .toArray()
}

export async function getTodosByMode(mode: Todo['mode']): Promise<Todo[]> {
  return db.todos
    .where('mode')
    .equals(mode)
    .filter(t => t.status === 'pending')
    .toArray()
}

export async function getDeletedTodos(): Promise<Todo[]> {
  return db.todos.where('status').equals('deleted').toArray()
}

export async function addTodo(todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>): Promise<Todo> {
  const now = new Date().toISOString()
  // Calculate next sortOrder
  const allTodos = await db.todos.where('status').notEqual('deleted').toArray()
  const maxOrder = allTodos.reduce((max, t) => Math.max(max, t.sortOrder ?? 0), -1)
  const newTodo: Todo = {
    ...todo,
    id: nanoid(),
    sortOrder: maxOrder + 1,
    createdAt: now,
    updatedAt: now,
  }
  await db.todos.add(newTodo)
  return newTodo
}

export async function updateTodo(id: string, updates: Partial<Todo>): Promise<void> {
  await db.todos.update(id, { ...updates, updatedAt: new Date().toISOString() })
}

export async function completeTodo(id: string): Promise<void> {
  const now = new Date().toISOString()
  await db.todos.update(id, {
    status: 'completed',
    completedAt: now,
    updatedAt: now,
  })
}

export async function undoCompleteTodo(id: string): Promise<void> {
  await db.todos.update(id, {
    status: 'pending',
    completedAt: undefined,
    updatedAt: new Date().toISOString(),
  })
}

export async function softDeleteTodo(id: string): Promise<void> {
  await db.todos.update(id, {
    status: 'deleted',
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

export async function restoreTodo(id: string): Promise<void> {
  await db.todos.update(id, {
    status: 'pending',
    deletedAt: undefined,
    updatedAt: new Date().toISOString(),
  })
}

export async function permanentlyDeleteTodo(id: string): Promise<void> {
  await db.todos.delete(id)
}

export async function cleanupExpiredTrash(daysThreshold: number = 30): Promise<number> {
  const threshold = new Date()
  threshold.setDate(threshold.getDate() - daysThreshold)
  const thresholdStr = threshold.toISOString()

  const expired = await db.todos
    .where('status')
    .equals('deleted')
    .filter(t => !!(t.deletedAt && t.deletedAt < thresholdStr))
    .toArray()

  await db.todos.bulkDelete(expired.map(t => t.id))
  return expired.length
}

// ============ DailySummary CRUD ============

export async function getDailySummary(date: string): Promise<DailySummary | undefined> {
  return db.dailySummaries.where('date').equals(date).first()
}

export async function getAllDailySummaries(): Promise<DailySummary[]> {
  return db.dailySummaries.toArray()
}

export async function saveDailySummary(summary: DailySummary): Promise<void> {
  await db.dailySummaries.put(summary)
}

// ============ Settings ============

export async function getSettings(): Promise<UserSettings | undefined> {
  return db.settings.get({ id: 'user-settings' })
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await db.settings.put({ ...settings, id: 'user-settings' })
}
