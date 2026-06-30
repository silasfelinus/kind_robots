// /stores/todoStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { isWishTodo, makeWishTodo, type WishCreate, type WishTodo } from '@/stores/helpers/wishmaster'
import { performFetch, handleError } from './utils'

export type TodoStatus = 'OPEN' | 'DONE' | 'ARCHIVED'
export type TodoPriority = 'LOW' | 'NORMAL' | 'HIGH'
export type TodoCategory = 'AGENT' | 'KAIZEN' | 'HONEYDO'

export interface Todo {
  id: number
  createdAt: string
  updatedAt: string | null
  title: string
  description: string | null
  status: TodoStatus
  priority: TodoPriority
  category: TodoCategory
  dueDate: string | null
  icon: string | null
  imagePath: string | null
  userId: number | null
}

export type TodoCreate = {
  title: string
  description?: string | null
  priority?: TodoPriority
  category?: TodoCategory
  dueDate?: string | null
  icon?: string | null
  imagePath?: string | null
}

export type TodoUpdate = {
  title?: string
  description?: string | null
  status?: TodoStatus
  priority?: TodoPriority
  category?: TodoCategory
  dueDate?: string | null
  icon?: string | null
  imagePath?: string | null
}

export type Wish = WishTodo
export type WishUpdate = TodoUpdate

export const useTodoStore = defineStore('todoStore', () => {
  const todos = ref<Todo[]>([])
  const loading = ref(false)
  const hasLoaded = ref(false)
  const lastError = ref<string | null>(null)

  const openTodos = computed(() =>
    todos.value.filter((t) => t.status === 'OPEN'),
  )
  const doneTodos = computed(() =>
    todos.value.filter((t) => t.status === 'DONE'),
  )
  const archivedTodos = computed(() =>
    todos.value.filter((t) => t.status === 'ARCHIVED'),
  )

  const agentTodos = computed(() =>
    openTodos.value.filter((t) => !t.category || t.category === 'AGENT'),
  )
  const kaizenTodos = computed(() =>
    openTodos.value.filter((t) => t.category === 'KAIZEN'),
  )
  const honeyDoTodos = computed(() =>
    openTodos.value.filter((t) => t.category === 'HONEYDO'),
  )

  const wishes = computed(() =>
    todos.value.filter(isWishTodo),
  )
  const openWishes = computed(() =>
    openTodos.value.filter(isWishTodo),
  )
  const doneWishes = computed(() =>
    doneTodos.value.filter(isWishTodo),
  )
  const archivedWishes = computed(() =>
    archivedTodos.value.filter(isWishTodo),
  )

  async function fetchTodos(includeArchived = false): Promise<void> {
    loading.value = true
    lastError.value = null

    try {
      const res = await performFetch<Todo[]>(
        `/api/todos${includeArchived ? '?includeArchived=1' : ''}`,
      )

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to fetch todos')
      }

      todos.value = res.data
      hasLoaded.value = true
    } catch (error) {
      handleError(error, 'fetchTodos')
      lastError.value =
        error instanceof Error ? error.message : 'Failed to fetch todos'
      console.error('fetchTodos failed:', error)
    } finally {
      loading.value = false
    }
  }

  async function createTodo(data: TodoCreate): Promise<Todo | null> {
    loading.value = true
    lastError.value = null

    try {
      const res = await performFetch<Todo>('/api/todos', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to create todo')
      }

      todos.value = [res.data, ...todos.value]
      return res.data
    } catch (error) {
      handleError(error, 'createTodo')
      lastError.value =
        error instanceof Error ? error.message : 'Failed to create todo'
      console.error('createTodo failed:', error)
      return null
    } finally {
      loading.value = false
    }
  }

  async function createWish(data: WishCreate): Promise<Wish | null> {
    const todo = await createTodo(makeWishTodo(data))
    return todo && isWishTodo(todo) ? todo : null
  }

  async function updateTodo(id: number, data: TodoUpdate): Promise<boolean> {
    lastError.value = null

    try {
      const res = await performFetch<Todo>(`/api/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to update todo')
      }

      const idx = todos.value.findIndex((t) => t.id === id)
      if (idx !== -1) todos.value[idx] = res.data

      return true
    } catch (error) {
      handleError(error, 'updateTodo')
      lastError.value =
        error instanceof Error ? error.message : 'Failed to update todo'
      console.error('updateTodo failed:', error)
      return false
    }
  }

  async function updateWish(id: number, data: WishUpdate): Promise<boolean> {
    return updateTodo(id, { ...data, category: 'AGENT' })
  }

  async function deleteTodo(id: number): Promise<boolean> {
    lastError.value = null

    try {
      const res = await performFetch(`/api/todos/${id}`, {
        method: 'DELETE',
      })

      if (!res.success) {
        throw new Error(res.message || 'Failed to delete todo')
      }

      todos.value = todos.value.filter((t) => t.id !== id)
      return true
    } catch (error) {
      handleError(error, 'deleteTodo')
      lastError.value =
        error instanceof Error ? error.message : 'Failed to delete todo'
      console.error('deleteTodo failed:', error)
      return false
    }
  }

  async function toggleDone(todo: Todo): Promise<boolean> {
    return updateTodo(todo.id, {
      status: todo.status === 'DONE' ? 'OPEN' : 'DONE',
    })
  }

  async function archiveTodo(id: number): Promise<boolean> {
    return updateTodo(id, { status: 'ARCHIVED' })
  }

  async function completeWish(todo: Wish): Promise<boolean> {
    return updateTodo(todo.id, { status: 'DONE' })
  }

  async function archiveWish(id: number): Promise<boolean> {
    return archiveTodo(id)
  }

  async function deleteWish(id: number): Promise<boolean> {
    return deleteTodo(id)
  }

  return {
    todos,
    loading,
    hasLoaded,
    lastError,
    openTodos,
    doneTodos,
    archivedTodos,
    agentTodos,
    kaizenTodos,
    honeyDoTodos,
    wishes,
    openWishes,
    doneWishes,
    archivedWishes,
    fetchTodos,
    createTodo,
    createWish,
    updateTodo,
    updateWish,
    deleteTodo,
    toggleDone,
    archiveTodo,
    completeWish,
    archiveWish,
    deleteWish,
  }
})
