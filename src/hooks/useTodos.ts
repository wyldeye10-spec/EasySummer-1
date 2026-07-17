import { useCallback } from 'react'
import { useTodoStore } from '../store/todoStore'
import { similarity } from '../utils/similiarity'
import type { Todo } from '../types'

export function useTodos() {
  const store = useTodoStore()

  const checkDuplicate = useCallback(
    (title: string): Todo | undefined => {
      return store.todos
        .filter(t => t.status === 'pending')
        .find(t => similarity(t.title, title) > 0.85)
    },
    [store.todos]
  )

  return {
    ...store,
    checkDuplicate,
  }
}
