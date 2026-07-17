import { useEffect, useState } from 'react'

interface BrowserInfo {
  name: string
  version: number
}

function detectBrowser(): BrowserInfo | null {
  const ua = navigator.userAgent

  // Edge (Chromium)
  const edgeMatch = ua.match(/Edg\/(\d+)/)
  if (edgeMatch) return { name: 'Edge', version: parseInt(edgeMatch[1]) }

  // Chrome
  const chromeMatch = ua.match(/Chrome\/(\d+)/)
  if (chromeMatch) return { name: 'Chrome', version: parseInt(chromeMatch[1]) }

  // Firefox
  const firefoxMatch = ua.match(/Firefox\/(\d+)/)
  if (firefoxMatch) return { name: 'Firefox', version: parseInt(firefoxMatch[1]) }

  // Safari
  const safariMatch = ua.match(/Version\/(\d+).*Safari\//)
  if (safariMatch) return { name: 'Safari', version: parseInt(safariMatch[1]) }

  return null
}

const MIN_VERSIONS: Record<string, number> = {
  Chrome: 90,
  Edge: 90,
  Firefox: 90,
  Safari: 15,
}

const BROWSER_NAMES_CN: Record<string, string> = {
  Chrome: 'Chrome',
  Edge: 'Edge',
  Firefox: 'Firefox',
  Safari: 'Safari',
}

export interface CompatResult {
  ok: boolean
  reason?: string
  storageAvailable: 'indexeddb' | 'localstorage' | 'none'
}

export function checkBrowserCompat(): CompatResult {
  // Check storage availability
  let storageAvailable: 'indexeddb' | 'localstorage' | 'none' = 'none'

  if (typeof indexedDB !== 'undefined') {
    storageAvailable = 'indexeddb'
  } else if (typeof localStorage !== 'undefined') {
    // Test localStorage actually works
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, '1')
      localStorage.removeItem(testKey)
      storageAvailable = 'localstorage'
    } catch {
      storageAvailable = 'none'
    }
  }

  // If IndexedDB is available, check ResizeObserver too
  if (typeof ResizeObserver === 'undefined') {
    return { ok: false, reason: '您的浏览器版本过低，请升级到最新版本。', storageAvailable }
  }

  // Detect browser and version
  const browser = detectBrowser()
  if (!browser) {
    // Unknown browser — allow but warn about storage
    return { ok: true, storageAvailable }
  }

  const minVersion = MIN_VERSIONS[browser.name]
  if (minVersion && browser.version < minVersion) {
    return {
      ok: false,
      reason: `您的浏览器版本过低（${BROWSER_NAMES_CN[browser.name]} ${browser.version}）。`,
      storageAvailable,
    }
  }

  return { ok: true, storageAvailable }
}

export function BrowserCheck({ children }: { children: React.ReactNode }) {
  const [compat, setCompat] = useState<CompatResult | null>(null)

  useEffect(() => {
    setCompat(checkBrowserCompat())
  }, [])

  if (!compat) return null

  if (!compat.ok) {
    return (
      <div className="min-h-screen bg-warm-50 dark:bg-warm-900 flex items-center justify-center p-6">
        <div className="glass rounded-2xl p-8 max-w-md text-center shadow-xl animate-scale-in">
          <span className="text-5xl block mb-4">⚠️</span>
          <h1 className="text-xl font-bold text-warm-800 dark:text-warm-200 mb-2">
            浏览器不兼容
          </h1>
          <p className="text-sm text-warm-500 dark:text-warm-400 mb-4">{compat.reason}</p>
          <p className="text-xs text-warm-400 mb-4">
            请使用 Chrome 90+、Edge 90+、Firefox 90+ 或 Safari 15+ 的最新版本打开。
          </p>
          {compat.storageAvailable === 'localstorage' && (
            <p className="text-xs text-amber-500 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
              ⚠ 当前环境不支持数据持久化，建议使用常规模式打开
            </p>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
