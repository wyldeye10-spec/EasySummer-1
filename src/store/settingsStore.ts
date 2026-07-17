import { create } from 'zustand'
import type { UserSettings } from '../types'
import { DEFAULT_SETTINGS } from '../constants'
import * as ops from '../db/storage'

interface SettingsStore {
  settings: UserSettings
  loaded: boolean

  load: () => Promise<void>
  update: (updates: Partial<UserSettings>) => Promise<void>
  reset: () => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  loaded: false,

  load: async () => {
    const saved = await ops.getSettings()
    if (saved) {
      set({ settings: saved, loaded: true })
    } else {
      // Initialize with defaults
      await ops.saveSettings({ ...DEFAULT_SETTINGS, id: 'user-settings' })
      set({ settings: { ...DEFAULT_SETTINGS }, loaded: true })
    }
  },

  update: async (updates) => {
    const current = get().settings
    const merged = { ...current, ...updates }
    await ops.saveSettings(merged)
    set({ settings: merged })
  },

  reset: async () => {
    await ops.saveSettings({ ...DEFAULT_SETTINGS, id: 'user-settings' })
    set({ settings: { ...DEFAULT_SETTINGS } })
  },
}))
