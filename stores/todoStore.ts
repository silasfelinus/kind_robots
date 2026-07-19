// /stores/todoStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch, handleError } from './utils'

export type TodoStatus = 'OPEN' | 'DONE' | 'ARCHIVED'
export type TodoPriority = 'LOW' | 'NORMAL' | 'HIGH'
export type TodoCategory = 'AGENT' | 'KAIZEN' | 'HONEYDO' | 'DESIRED_FEATURE'

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
  dreamId: number | null
  projectId: number | null
  order: number | null
}

export type TodoCreate = {
  title: string
  description?: string | null
  priority?: TodoPriority
  category?: TodoCategory
  dueDate?: string | null
  icon?: string | null
  imagePath?: string | null
  dreamId?: number | null
  projectId?: number | null
  order?: number | null
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
  dreamId?: number | null
  projectId?: number | null
  order?: number | null
}

export const useTodoStore = defineStore('todoStore', () => {
  const todos = ref<Todo[]>([])
  const loading = ref(false)
  const hasLoaded = ref(false)
  const lastError = ref<string | null>(null)
  const activeFetches = ref(0)
  const fetchPromises = new Map<string, Promise<void>>()

  const openTodos = computed(() =>
    todos.value.filter((todo) => todo.status === 'OPEN'),
  )
  const doneTodos = computed(() =>
    todos.value.filter((todo) => todo.status === 'DONE'),
  )
  const archivedTodos = computed(() =>
    todos.value.filter((todo) => todo.status === 'ARCHIVED'),
  )

  const agentTodos = computed(() =>
    openTodos.value.filter((todo) => !todo.category || todo.category === 'AGENT'),
  )

  function isSerendipityAgentTodo(todo: Todo): boolean {
    if (todo.category && todo.category !== 'AGENT') return false
    const title = todo.title.toLowerCase()
    const description = todo.description?.toLowerCase() ?? ''
    return (
      todo.icon === 'kind-icon:sparkles' ||
      title.startsWith('story decision on ') ||
      description.startsWith('captured by serendipity for conductor task ')
    )
  }

  const serendipityAgentTodos = computed(() =>
    agentTodos.value.filter((todo) => isSerendipityAgentTodo(todo)),
  )
  const regularAgentTodos = computed(() =>
    agentTodos.value.filter((todo) => !isSerendipityAgentTodo(todo)),
  )

  const kaizenTodos = computed(() =>
    openTodos.value.filter((todo) => todo.category === 'KAIZEN'),
  )
  const honeyDoTodos = computed(() =>
    openTodos.value.filter((todo) => todo.category === 'HONEYDO'),
  )

  function runFetch(key: string, task: () => Promise<void>): Promise<void> {
    const existing = fetchPromises.get(key)
    if (existing) return existing

    activeFetches.value += 1
    loading.value = true

    const request = task().finally(() => {
      fetchPromises.delete(key)
      activeFetches.value = Math.max(0, activeFetches.value - 1)
      loading.value = activeFetches.value > 0
    })

    fetchPromises.set(key, request)
    return request
  }

  function dreamKaizens(dreamId: number) {
    return computed(() =>
      openTodos.value.filter(
        (todo) => todo.dreamId === dreamId && todo.category === 'KAIZEN',
      ),
    )
  }

  function dreamFeatures(dreamId: number) {
    return computed(() =>
      todos.value
        .filter(
          (todo) =>
            todo.dreamId === dreamId && todo.category === 'DESIRED_FEATURE',
        )
        .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999)),
    )
  }

  function projectKaizens(projectId: number) {
    return computed(() =>
      openTodos.value.filter(
        (todo) => todo.projectId === projectId && todo.category === 'KAIZEN',
      ),
    )
  }

  function projectFeatures(projectId: number) {
    return computed(() =>
      todos.value
        .filter(
          (todo) =>
            todo.projectId === projectId && todo.category === 'DESIRED_FEATURE',
        )
        .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999)),
    )
  }

  async function fetchDreamTodos(dreamId: number): Promise<void> {
    return runFetch(`dream:${dreamId}`, async () => {
      lastError.value = null
      try {
        const response = await performFetch<Todo[]>(
          `/api/todos/dream/${dreamId}`,
        )
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to fetch Dream todos')
        }
        const others = todos.value.filter((todo) => todo.dreamId !== dreamId)
        todos.value = [...others, ...response.data]
      } catch (error) {
        handleError(error, 'fetchDreamTodos')
        lastError.value =
          error instanceof Error ? error.message : 'Failed to fetch Dream todos'
      }
    })
  }

  async function fetchProjectTodos(projectId: number): Promise<void> {
    return runFetch(`project:${projectId}`, async () => {
      lastError.value = null
      try {
        const response = await performFetch<Todo[]>(
          `/api/todos/project/${projectId}`,
        )
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to fetch Project todos')
        }
        const others = todos.value.filter((todo) => todo.projectId !== projectId)
        todos.value = [...others, ...response.data]
      } catch (error) {
        handleError(error, 'fetchProjectTodos')
        lastError.value =
          error instanceof Error
            ? error.message
            : 'Failed to fetch Project todos'
      }
    })
  }

  async function fetchTodos(includeArchived = false): Promise<void> {
    return runFetch(`all:${includeArchived ? 1 : 0}`, async () => {
      lastError.value = null

      try {
        const response = await performFetch<Todo[]>(
          `/api/todos${includeArchived ? '?includeArchived=1' : ''}`,
        )

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to fetch todos')
        }

        todos.value = response.data
        hasLoaded.value = true
      } catch (error) {
        handleError(error, 'fetchTodos')
        lastError.value =
          error instanceof Error ? error.message : 'Failed to fetch todos'
      }
    })
  }

  async function createTodo(data: TodoCreate): Promise<Todo | null> {
    loading.value = true
    lastError.value = null

    try {
      const response = await performFetch<Todo>('/api/todos', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create todo')
      }

      todos.value = [response.data, ...todos.value]
      return response.data
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

  async function updateTodo(id: number, data: TodoUpdate): Promise<boolean> {
    lastError.value = null

    try {
      const response = await performFetch<Todo>(`/api/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update todo')
      }

      const index = todos.value.findIndex((todo) => todo.id === id)
      if (index !== -1) todos.value[index] = response.data

      return true
    } catch (error) {
      handleError(error, 'updateTodo')
      lastError.value =
        error instanceof Error ? error.message : 'Failed to update todo'
      console.error('updateTodo failed:', error)
      return false
    }
  }

  async function deleteTodo(id: number): Promise<boolean> {
    lastError.value = null

    try {
      const response = await performFetch(`/api/todos/${id}`, {
        method: 'DELETE',
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete todo')
      }

      todos.value = todos.value.filter((todo) => todo.id !== id)
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

  return {
    todos,
    loading,
    hasLoaded,
    lastError,
    openTodos,
    doneTodos,
    archivedTodos,
    agentTodos,
    serendipityAgentTodos,
    regularAgentTodos,
    isSerendipityAgentTodo,
    kaizenTodos,
    honeyDoTodos,
    dreamKaizens,
    dreamFeatures,
    projectKaizens,
    projectFeatures,
    fetchTodos,
    fetchDreamTodos,
    fetchProjectTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleDone,
    archiveTodo,
  }
})
