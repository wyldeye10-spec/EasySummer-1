/**
 * Unified storage interface that auto-selects between IndexedDB (Dexie) and localStorage fallback.
 * All stores should use this module instead of directly importing from db/operations.ts.
 */
import type { Todo, DailySummary, UserSettings } from '../types'
import * as idb from './operations'
import * as ls from '../utils/storageAdapter'
import { useUIStore, type StorageMode } from '../store/uiStore'

// ============ Initialization ============

/**
 * Detect available storage mode and update the UI store.
 * Call this once at app startup.
 */
export async function initStorage(): Promise<StorageMode> {
  // Try IndexedDB first
  try {
    if (typeof indexedDB === 'undefined') throw new Error('IndexedDB not available')
    // Test Dexie by opening the DB
    const db = (await import('./database')).db
    await db.open()
    useUIStore.getState().setStorageMode('indexeddb')
    return 'indexeddb'
  } catch {
    // Try localStorage
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, '1')
      localStorage.removeItem(testKey)
      useUIStore.getState().setStorageMode('localstorage')
      return 'localstorage'
    } catch {
      useUIStore.getState().setStorageMode('none')
      return 'none'
    }
  }
}

// ============ Helpers ============

function storageMode(): StorageMode {
  return useUIStore.getState().storageMode
}

// ============ Todo CRUD ============

export async function getAllTodos(): Promise<Todo[]> {
  if (storageMode() === 'localstorage') return ls.lsGetAllTodos()
  try { return await idb.getAllTodos() } catch { return ls.lsGetAllTodos() }
}

export async function getTodosByStatus(status: Todo['status']): Promise<Todo[]> {
  if (storageMode() === 'localstorage') return ls.lsGetTodosByStatus(status)
  try { return await idb.getTodosByStatus(status) } catch { return ls.lsGetTodosByStatus(status) }
}

export async function addTodo(input: Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>): Promise<Todo> {
  if (storageMode() === 'localstorage') return ls.lsAddTodo(input)
  try { return await idb.addTodo(input) } catch { return ls.lsAddTodo(input) }
}

export async function updateTodo(id: string, updates: Partial<Todo>): Promise<void> {
  if (storageMode() === 'localstorage') { await ls.lsUpdateTodo(id, updates); return }
  try { await idb.updateTodo(id, updates) } catch { await ls.lsUpdateTodo(id, updates) }
}

export async function completeTodo(id: string): Promise<void> {
  if (storageMode() === 'localstorage') { await ls.lsCompleteTodo(id); return }
  try { await idb.completeTodo(id) } catch { await ls.lsCompleteTodo(id) }
}

export async function undoCompleteTodo(id: string): Promise<void> {
  if (storageMode() === 'localstorage') { await ls.lsUndoCompleteTodo(id); return }
  try { await idb.undoCompleteTodo(id) } catch { await ls.lsUndoCompleteTodo(id) }
}

export async function softDeleteTodo(id: string): Promise<void> {
  if (storageMode() === 'localstorage') { await ls.lsSoftDeleteTodo(id); return }
  try { await idb.softDeleteTodo(id) } catch { await ls.lsSoftDeleteTodo(id) }
}

export async function restoreTodo(id: string): Promise<void> {
  if (storageMode() === 'localstorage') { await ls.lsRestoreTodo(id); return }
  try { await idb.restoreTodo(id) } catch { await ls.lsRestoreTodo(id) }
}

export async function permanentlyDeleteTodo(id: string): Promise<void> {
  if (storageMode() === 'localstorage') { await ls.lsPermanentlyDeleteTodo(id); return }
  try { await idb.permanentlyDeleteTodo(id) } catch { await ls.lsPermanentlyDeleteTodo(id) }
}

export async function cleanupExpiredTrash(daysThreshold: number = 30): Promise<number> {
  if (storageMode() === 'localstorage') return ls.lsCleanupTrash(daysThreshold)
  try { return await idb.cleanupExpiredTrash(daysThreshold) } catch { return ls.lsCleanupTrash(daysThreshold) }
}

// ============ DailySummary CRUD ============

export async function getDailySummary(date: string): Promise<DailySummary | undefined> {
  if (storageMode() === 'localstorage') return ls.lsGetDailySummary(date)
  try { return await idb.getDailySummary(date) } catch { return ls.lsGetDailySummary(date) }
}

export async function getAllDailySummaries(): Promise<DailySummary[]> {
  if (storageMode() === 'localstorage') return ls.lsGetAllDailySummaries()
  try { return await idb.getAllDailySummaries() } catch { return ls.lsGetAllDailySummaries() }
}

export async function saveDailySummary(summary: DailySummary): Promise<void> {
  if (storageMode() === 'localstorage') { await ls.lsSaveDailySummary(summary); return }
  try { await idb.saveDailySummary(summary) } catch { await ls.lsSaveDailySummary(summary) }
}

// ============ Settings ============

export async function getSettings(): Promise<UserSettings | undefined> {
  if (storageMode() === 'localstorage') return ls.lsGetSettings()
  try { return await idb.getSettings() } catch { return ls.lsGetSettings() }
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  if (storageMode() === 'localstorage') { await ls.lsSaveSettings(settings); return }
  try { await idb.saveSettings(settings) } catch { await ls.lsSaveSettings(settings) }
}
