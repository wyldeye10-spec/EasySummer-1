# CLAUDE.md

## Project Overview

**EasySummer** (暑期规划 · Summer Planner) is a client-side personal task management SPA designed for a Chinese medical student's daily planning. No backend — runs entirely in the browser with IndexedDB persistence.

- **Tech**: React 19 + TypeScript 5 + Vite 7 + Tailwind CSS 4 + Zustand 5 + Dexie 4 + React Router 7
- **Deploy**: GitHub Pages via `.github/workflows/deploy.yml` — static build to `./dist`, HashRouter in production
- **Language**: zh-CN UI, code comments in Chinese + English mixed

## Project Structure

```
src/
├── main.tsx              # Entry: StrictMode → BrowserCheck → App
├── App.tsx               # Router: HashRouter(PROD)/BrowserRouter(DEV) → AppLayout → routes
├── index.css             # Tailwind v4 import + @theme tokens + custom keyframes + dark mode overrides
├── types/index.ts        # Todo, DailySummary, UserSettings, ParsedInput, TodoStats, AppMode, etc.
├── constants/index.ts    # Category labels/colors, priority labels, quadrant map, default settings, quotes
├── store/                # Zustand — flat, no slices
│   ├── todoStore.ts      # Todo[] + full CRUD + derived selectors (getByQuadrant, getByMode, etc.)
│   ├── uiStore.ts        # mode, sidebarOpen, toasts[], darkMode, storageMode
│   └── settingsStore.ts  # UserSettings + load/update/reset
├── db/
│   ├── database.ts       # Dexie schema (PlannerDB), version migrations
│   ├── operations.ts     # Raw IndexedDB CRUD (todos, dailySummaries, settings)
│   └── storage.ts        # Unified facade: auto-selects IndexedDB vs localStorage fallback; initStorage() at boot
├── hooks/
│   ├── useTodos.ts       # Wraps todoStore, adds duplicate detection (string similarity)
│   ├── useDailySummary.ts # Timed daily summary modal trigger
│   ├── usePomodoro.ts    # Countdown timer state machine
│   ├── useAutoSave.ts    # Periodic localStorage backup (30s interval)
│   └── useKeyboard.ts    # Declarative shortcut binding
├── utils/
│   ├── parser.ts         # Natural language input parser (priority /p1, tags #tag, @category, dates, time est.)
│   ├── date.ts           # today(), formatDate(), isOverdue(), getRelativeDateDescription(), getGreeting()
│   ├── storageAdapter.ts # localStorage fallback mirroring operations.ts interface
│   ├── similarity.ts     # String similarity for duplicate detection
│   ├── export.ts         # JSON export helper
│   └── exportPdf.ts      # PDF generation
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx  # Sidebar nav (desktop) + bottom nav (mobile) + storage warning + Toast
│   │   └── TopBar.tsx     # Header: greeting, date, study/work mode toggle, dark mode toggle, random quote
│   ├── common/            # ErrorBoundary, Toast, EmptyState, Skeleton, ConfirmDialog, BrowserCheck, VirtualScroll
│   ├── dashboard/         # Dashboard, QuickInput, TodoList, TodoItem, SubTaskList, StatsCard, PomodoroTimer, DailySummaryModal
│   ├── quadrant/          # QuadrantView — Eisenhower matrix with drag-and-drop between zones
│   ├── journal/           # MonthlyJournal, HeatmapCalendar, CategoryPieChart
│   └── settings/          # Settings (pomodoro, quotes, categories, tags, export/import), Trash (30-day soft delete)
```

## Architecture Rules

### Data Flow (unidirectional)
```
User Input → Zustand Store → Dexie (IndexedDB) / localStorage fallback → Zustand Store → React Components
```

### Storage Layer
- **Primary**: IndexedDB via Dexie (`db/operations.ts`)
- **Fallback**: localStorage via `utils/storageAdapter.ts`
- **Facade**: `db/storage.ts` — all stores import from here, NOT directly from operations or adapter
- **Auto-detect**: `initStorage()` called once in `AppLayout` on mount, sets `uiStore.storageMode`
- **Backup**: `useAutoSave` persists `{todos, settings}` to localStorage every 30s

### State Management
- 3 Zustand stores; no context providers needed
- `todoStore` is the source of truth for todos — always in sync with DB
- `uiStore` holds transient UI state (never persisted beyond session)
- `settingsStore` mirrors `UserSettings` in DB
- Derived data (filtered lists, stats) computed via `.filter()` in components/selectors, not stored separately

### Todo Lifecycle
```
pending → completed (completedAt set)
pending → deleted (deletedAt set, status='deleted') → restore → pending
deleted + 30 days elapsed → permanent delete (cleanupExpiredTrash)
```

### Key Patterns
- **Soft delete only**: Never hard-delete from UI; `deleteTodo` = soft delete, `permanentlyDeleteTodo` = hard delete
- **Priority ↔ Quadrant**: P1→Q1, P2→Q2, P3→Q3, P4→Q4 — always synced when moving between quadrants
- **Sub-tasks**: `parentId` field; subtasks excluded from main lists, rendered under parent
- **Drag-and-drop**: Uses `sortOrder` field (integer), swap on drag end. Virtual scroll disables DnD (≥500 items).
- **Duplicate detection**: `useTodos.checkDuplicate()` uses string similarity > 0.85 threshold

### Natural Language Parser (`utils/parser.ts`)
Syntax: `/p1` priority, `#tagName` tags, `@study|@work|@life|@other|@customName` category, `周三前|明天|后天|下周X|ISO-date` due date, `预计2h|30min` time estimate. Falls back to keyword-based category detection (medical study terms → study, work terms → work, etc.).

### Routing
- `/` — Dashboard (QuickInput + TodoList + StatsCard + PomodoroTimer)
- `/quadrant` — Eisenhower matrix view
- `/journal` and `/journal/:year/:month` — Monthly journal
- `/settings` — Settings panel
- `/trash` — Soft-deleted items recovery
- `HashRouter` in production (static file compat), `BrowserRouter` in dev

## Design System

### Color Palette
- **Warm base**: warm-50 (#fdfbf7) through warm-900 (#4a3420) — paper-like warm tones
- **Category colors**: study=blue (#5a9ec9), work=orange (#d97c63), life=green (#6ab880), other=purple (#a895c5)
- **Theme**: Light by default, dark via `.dark` class on `<html>` (toggle persisted in localStorage key `summer-planner-dark-mode`)

### Visual Language
- Glassmorphism cards (`.glass`, `.glass-strong`) with backdrop-filter blur
- CSS-only animations via `@keyframes` + utility classes (`.animate-float`, `.animate-slide-up`, `.animate-scale-in`, `.animate-shake`, etc.)
- `hover-lift` for interactive cards (translateY -2px + shadow)
- `gradient-text` for headings (warm gradient, clipped)
- Emoji-based iconography for visual labels
- Custom scrollbar styles, progress bar stripes, confetti particles

### Responsive
- Desktop: sticky sidebar nav (48px width) + max-w-4xl centered content
- Mobile: bottom fixed nav (md:hidden), full-width content
- Breakpoint: md (768px)

## When Making Changes

### Before Touching Data
- The storage façade (`db/storage.ts`) is the only entry point for persistence — never bypass it
- Type definitions live in `types/index.ts`; any new field must be added there first
- DB migrations: add new Dexie version in `db/database.ts` with `.upgrade()` handler

### Before Touching State
- New store data → Zustand store in `src/store/`
- UI-only transient state → `uiStore`
- Persistent user config → `settingsStore` (backed by DB) + `constants/index.ts` for defaults

### Before Touching UI
- Reusable UI → `components/common/`
- Page-level → `components/<feature>/`
- Layout changes → `components/layout/`
- Check both light and dark mode (`dark:` variants in CSS or inline)
- Check print styles if the content should be printable
- Mobile bottom nav must be considered for new pages (add entry in `AppLayout.tsx`)

### Natural Language Input Changes
- New parsing syntax → `utils/parser.ts`, then update `QuickInput.tsx` hint chips
- New auto-detected categories → add keywords to parser

### Deployment
- Pushes to `main` auto-deploy via GitHub Actions to GitHub Pages
- `vite.config.ts` sets `base` for GitHub Pages path — check before build

## Important Constraints

1. **Offline-first**: Everything must work without network; no API calls exist
2. **No framework lock-in**: Plain React + Zustand, no Next.js/Remix SSR
3. **Chinese-first**: All user-facing text in Chinese; dev-facing code comments mixed
4. **Medical context**: Default motivational quotes and keyword detection assume a Chinese medical student user
5. **Storage degradation**: App must gracefully handle IndexedDB unavailability (already handled via localStorage fallback)
6. **No authentication**: Single-user, local-only — no login, no multi-user
