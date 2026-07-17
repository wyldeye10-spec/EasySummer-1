import { create } from 'zustand'
import type { AppMode } from '../types'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

export type StorageMode = 'indexeddb' | 'localstorage' | 'none'

interface UIStore {
  // Mode
  mode: AppMode
  toggleMode: () => void
  setMode: (mode: AppMode) => void

  // Sidebar (for future mobile)
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Toasts
  toasts: Toast[]
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void

  // Theme
  darkMode: boolean
  toggleDarkMode: () => void

  // Storage mode
  storageMode: StorageMode
  setStorageMode: (mode: StorageMode) => void
  storageWarningDismissed: boolean
  dismissStorageWarning: () => void
}

let toastId = 0

export const useUIStore = create<UIStore>((set, get) => ({
  mode: 'study',
  toggleMode: () => {
    const next = get().mode === 'study' ? 'work' : 'study'
    set({ mode: next })
  },
  setMode: (mode) => set({ mode }),

  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toasts: [],
  addToast: (message, type = 'success') => {
    const id = String(++toastId)
    set(state => ({ toasts: [...state.toasts, { id, message, type }] }))
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
    }, 3000)
  },
  removeToast: (id) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
  },

  darkMode: window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  toggleDarkMode: () => set(state => ({ darkMode: !state.darkMode })),

  storageMode: 'indexeddb',
  setStorageMode: (mode) => set({ storageMode: mode }),
  storageWarningDismissed: false,
  dismissStorageWarning: () => set({ storageWarningDismissed: true }),
}))
