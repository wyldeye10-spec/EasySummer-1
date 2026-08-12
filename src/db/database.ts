import Dexie, { type EntityTable } from 'dexie'
import type { Todo, DailySummary, UserSettings, MonthlyJournal } from '../types'

export class PlannerDB extends Dexie {
  todos!: EntityTable<Todo, 'id'>
  dailySummaries!: EntityTable<DailySummary, 'id'>
  settings!: EntityTable<UserSettings>
  monthlyJournals!: EntityTable<MonthlyJournal, 'id'>

  constructor() {
    super('SummerPlannerDB')

    this.version(1).stores({
      todos: 'id, status, category, priority, quadrant, mode, dueDate, createdAt',
      dailySummaries: 'id, date',
      settings: 'id',
    })

    // v2: add sortOrder for drag-and-drop
    this.version(2).stores({
      todos: 'id, status, category, priority, quadrant, mode, dueDate, createdAt, sortOrder',
      dailySummaries: 'id, date',
      settings: 'id',
    }).upgrade(async tx => {
      const todos = await tx.table('todos').toArray() as Todo[]
      for (let i = 0; i < todos.length; i++) {
        await tx.table('todos').update(todos[i].id, {
          sortOrder: todos[i].sortOrder ?? i,
        })
      }
    })

    // v3: add pomodoroCount to todos
    this.version(3).stores({
      todos: 'id, status, category, priority, quadrant, mode, dueDate, createdAt, sortOrder',
      dailySummaries: 'id, date',
      settings: 'id',
    }).upgrade(async tx => {
      const todos = await tx.table('todos').toArray() as Todo[]
      for (const todo of todos) {
        if (todo.pomodoroCount === undefined) {
          await tx.table('todos').update(todo.id, { pomodoroCount: 0 })
        }
      }
    })

    // v4: add monthlyJournals table (per-month highlights + next goals)
    this.version(4).stores({
      todos: 'id, status, category, priority, quadrant, mode, dueDate, createdAt, sortOrder',
      dailySummaries: 'id, date',
      settings: 'id',
      monthlyJournals: 'id',
    })
  }
}

export const db = new PlannerDB()
