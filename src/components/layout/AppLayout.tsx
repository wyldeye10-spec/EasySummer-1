import { Outlet, NavLink } from 'react-router-dom'
import { TopBar } from './TopBar'
import { Toast } from '../common/Toast'
import { useAutoSave } from '../../hooks/useAutoSave'
import { useTodoStore } from '../../store/todoStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useUIStore } from '../../store/uiStore'
import { initStorage } from '../../db/storage'
import { useEffect } from 'react'

export function AppLayout() {
  useAutoSave()

  const loadTodos = useTodoStore(s => s.loadTodos)
  const loadSettings = useSettingsStore(s => s.load)
  const settingsLoaded = useSettingsStore(s => s.loaded)
  const storageMode = useUIStore(s => s.storageMode)
  const dismissWarning = useUIStore(s => s.dismissStorageWarning)
  const warningDismissed = useUIStore(s => s.storageWarningDismissed)

  useEffect(() => {
    initStorage().then(() => {
      loadTodos()
      loadSettings()
    })
  }, [loadTodos, loadSettings])

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-warm-200 dark:bg-warm-700 text-warm-800 dark:text-warm-200'
        : 'text-warm-500 dark:text-warm-400 hover:text-warm-700 dark:hover:text-warm-300 hover:bg-warm-100 dark:hover:bg-warm-800'
    }`

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-900">
      <TopBar />

      {/* Storage degradation warning */}
      {storageMode !== 'indexeddb' && !warningDismissed && (
        <div className={`px-4 py-2.5 text-center text-sm font-medium flex items-center justify-center gap-2 ${
          storageMode === 'localstorage'
            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-b border-amber-200/60 dark:border-amber-800/40'
            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-b border-red-200/60 dark:border-red-800/40'
        }`}>
          <span>
            {storageMode === 'localstorage'
              ? '⚠️ 当前环境不支持数据持久化存储，数据将在清除浏览器数据后丢失，建议使用常规模式打开'
              : '❌ 无法存储数据，请检查浏览器设置'}
          </span>
          <button
            onClick={dismissWarning}
            className="ml-2 text-xs underline hover:no-underline opacity-70 hover:opacity-100"
          >
            知道了
          </button>
        </div>
      )}

      <div className="flex">
        {/* Side Nav */}
        <nav className="sticky top-[92px] h-[calc(100vh-92px)] w-48 flex-shrink-0 border-r border-warm-200 dark:border-warm-700/60 p-3 space-y-1 overflow-y-auto hidden md:block">
          <NavLink to="/" end className={navLinkClass}>
            🏠 首页
          </NavLink>
          <NavLink to="/quadrant" className={navLinkClass}>
            📐 四象限
          </NavLink>
          <NavLink to="/journal" className={navLinkClass}>
            📓 月志
          </NavLink>
          <NavLink to="/trash" className={navLinkClass}>
            🗑️ 回收站
          </NavLink>
          <div className="pt-3 mt-3 border-t border-warm-200 dark:border-warm-700/60">
            <NavLink to="/settings" className={navLinkClass}>
              ⚙️ 设置
            </NavLink>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-warm-50/90 dark:bg-warm-900/90 backdrop-blur-md border-t border-warm-200 dark:border-warm-700/60 md:hidden flex justify-around py-2">
        <NavLink to="/" end className={navLinkClass}>🏠</NavLink>
        <NavLink to="/quadrant" className={navLinkClass}>📐</NavLink>
        <NavLink to="/journal" className={navLinkClass}>📓</NavLink>
        <NavLink to="/settings" className={navLinkClass}>⚙️</NavLink>
      </nav>

      <Toast />
    </div>
  )
}
