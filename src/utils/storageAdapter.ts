/**
 * localStorage-based fallback storage when IndexedDB is unavailable.
 * Mirrors the same interface as db/operations.ts for todos, dailySummaries, and settings.
 */
import { nanoid } from 'nanoid'
import type { Todo, DailySummary, UserSettings } from '../types'
import { DEFAULT_SETTINGS } from '../constants'

const KEYS = {
  todos: 'planner_ls_todos',
  summaries: 'planner_ls_summaries',
  settings: 'planner_ls_settings',
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

// ============ Todo CRUD ============

function readTodos(): Todo[] {
  return read<Todo[]>(KEYS.todos, [])
}

function writeTodos(todos: Todo[]): boolean {
  return write(KEYS.todos, todos)
}

export async function lsGetAllTodos(): Promise<Todo[]> {
  return readTodos().filter(t => t.status !== 'deleted')
}

export async function lsGetTodosByStatus(status: Todo['status']): Promise<Todo[]> {
  return readTodos().filter(t => t.status === status)
}

export async function lsAddTodo(input: Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>): Promise<Todo> {
  const todos = readTodos()
  const now = new Date().toISOString()
  const maxOrder = todos.reduce((max, t) => Math.max(max, t.sortOrder ?? 0), -1)
  const newTodo: Todo = {
    ...input,
    id: nanoid(),
    sortOrder: maxOrder + 1,
    createdAt: now,
    updatedAt: now,
  }
  todos.push(newTodo)
  writeTodos(todos)
  return newTodo
}

export async function lsUpdateTodo(id: string, updates: Partial<Todo>): Promise<void> {
  const todos = readTodos()
  const idx = todos.findIndex(t => t.id === id)
  if (idx !== -1) {
    todos[idx] = { ...todos[idx], ...updates, updatedAt: new Date().toISOString() }
    writeTodos(todos)
  }
}

export async function lsCompleteTodo(id: string): Promise<void> {
  const now = new Date().toISOString()
  await lsUpdateTodo(id, { status: 'completed', completedAt: now } as Partial<Todo>)
}

export async function lsUndoCompleteTodo(id: string): Promise<void> {
  await lsUpdateTodo(id, { status: 'pending', completedAt: undefined } as Partial<Todo>)
}

export async function lsSoftDeleteTodo(id: string): Promise<void> {
  const now = new Date().toISOString()
  await lsUpdateTodo(id, { status: 'deleted', deletedAt: now } as Partial<Todo>)
}

export async function lsRestoreTodo(id: string): Promise<void> {
  await lsUpdateTodo(id, { status: 'pending', deletedAt: undefined } as Partial<Todo>)
}

export async function lsPermanentlyDeleteTodo(id: string): Promise<void> {
  const todos = readTodos().filter(t => t.id !== id)
  writeTodos(todos)
}

export async function lsCleanupTrash(daysThreshold: number = 30): Promise<number> {
  const threshold = new Date()
  threshold.setDate(threshold.getDate() - daysThreshold)
  const thresholdStr = threshold.toISOString()
  const todos = readTodos()
  const expired = todos.filter(t => t.status === 'deleted' && t.deletedAt && t.deletedAt < thresholdStr)
  writeTodos(todos.filter(t => !expired.includes(t)))
  return expired.length
}

// ============ DailySummary CRUD ============

function readSummaries(): DailySummary[] {
  return read<DailySummary[]>(KEYS.summaries, [])
}

export async function lsGetDailySummary(date: string): Promise<DailySummary | undefined> {
  return readSummaries().find(s => s.date === date)
}

export async function lsGetAllDailySummaries(): Promise<DailySummary[]> {
  return readSummaries()
}

export async function lsSaveDailySummary(summary: DailySummary): Promise<void> {
  const summaries = readSummaries()
  const idx = summaries.findIndex(s => s.id === summary.id)
  if (idx !== -1) {
    summaries[idx] = summary
  } else {
    summaries.push(summary)
  }
  write(KEYS.summaries, summaries)
}

// ============ Settings ============

export async function lsGetSettings(): Promise<UserSettings | undefined> {
  const settings = read<UserSettings | null>(KEYS.settings, null)
  return settings ?? undefined
}

export async function lsSaveSettings(settings: UserSettings): Promise<void> {
  write(KEYS.settings, { ...settings, id: 'user-settings' })
}

// ============ Storage health check ============

export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__ls_test__'
    localStorage.setItem(testKey, '1')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

export function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined'
}

export type StorageMode = 'indexeddb' | 'localstorage' | 'none'

export function getStorageMode(): StorageMode {
  if (isIndexedDBAvailable()) return 'indexeddb'
  if (isLocalStorageAvailable()) return 'localstorage'
  return 'none'
}
