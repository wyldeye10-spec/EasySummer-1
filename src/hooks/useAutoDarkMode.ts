import { useEffect, useRef } from 'react'
import { useUIStore } from '../store/uiStore'
import { useSettingsStore } from '../store/settingsStore'

const AUTO_DARK_HOUR = 19 // 7 PM
const CHECK_INTERVAL_MS = 60_000 // check every minute

/**
 * Auto dark mode hook:
 * - If autoDarkMode is enabled, checks time every 60s
 * - After 19:00, auto-enables dark mode
 * - Before 19:00, auto-disables dark mode
 * - Manual override lasts until time boundary crosses (day<->night) or page reload
 */
export function useAutoDarkMode() {
  const darkMode = useUIStore(s => s.darkMode)
  const toggleDarkMode = useUIStore(s => s.toggleDarkMode)
  const autoDarkMode = useSettingsStore(s => s.settings.autoDarkMode)

  // Track manual override — reset on time boundary crossing
  const userOverrodeRef = useRef(false)
  const lastAutoStateRef = useRef<boolean | null>(null)

  useEffect(() => {
    if (!autoDarkMode) return

    function isAfterDarkHour(): boolean {
      return new Date().getHours() >= AUTO_DARK_HOUR
    }

    function applyAuto() {
      const shouldBeDark = isAfterDarkHour()

      // Detect time boundary crossing (day↔night transition)
      if (lastAutoStateRef.current !== null && lastAutoStateRef.current !== shouldBeDark) {
        userOverrodeRef.current = false
      }

      if (!userOverrodeRef.current && darkMode !== shouldBeDark) {
        toggleDarkMode()
      }

      lastAutoStateRef.current = shouldBeDark
    }

    // Run immediately on mount / when autoDarkMode is enabled
    applyAuto()

    const interval = setInterval(applyAuto, CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [autoDarkMode, darkMode, toggleDarkMode])

  // Expose: TopBar calls this when user manually toggles dark mode
  function markUserOverride() {
    userOverrodeRef.current = true
  }

  return { markUserOverride }
}
