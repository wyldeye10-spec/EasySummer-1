import { QuickInput } from './QuickInput'
import { TodoList } from './TodoList'
import { StatsCard } from './StatsCard'
import { PomodoroTimer } from './PomodoroTimer'

export function Dashboard() {
  return (
    <div className="space-y-6 relative">
      {/* Animated background decorations */}
      <div className="bg-decorations" aria-hidden="true">
        <div className="bg-deco bg-deco-1" />
        <div className="bg-deco bg-deco-2" />
        <div className="bg-deco bg-deco-3" />
      </div>

      {/* Hero area */}
      <div className="animate-slide-down">
        <QuickInput />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Main Todo List */}
        <div className="lg:col-span-2 animate-slide-up">
          <TodoList />
        </div>

        {/* Sidebar */}
        <div className="space-y-4 animate-fade-in">
          <StatsCard />
          <PomodoroTimer />
        </div>
      </div>
    </div>
  )
}
