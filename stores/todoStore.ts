// /stores/todoStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type TodoStatus = 'OPEN' | 'DONE' | 'ARCHIVED'
export type TodoPriority = 'LOW' | 'NORMAL' | 'HIGH'

export interface Todo {
  id: number
  createdAt: string
  updatedAt: string | null
  title: string
  description: string | null
  status: TodoStatus
  priority: TodoPriority
  dueDate: string | null
  icon: string | null
  imagePath: string | null
  userId: number | null
}

export type TodoCreate = {
  title: string
  description?: string | null
  priority?: TodoPriority
  dueDate?: string | null
  icon?: string | null
  imagePath?: string | null
}

export type TodoUpdate = {
  title?: string
  description?: string | null
  status?: TodoStatus
  priority?: TodoPriority
  dueDate?: string | null
  icon?: string | null
  imagePath?: string | null
}

export const useTodoStore = defineStore('todoStore', () => {
  const todos = ref<Todo[]>([])
  const loading = ref(false)
  const hasLoaded = ref(false)

  const openTodos = computed(() => todos.value.filter((t) => t.status === 'OPEN'))
  const doneTodos = computed(() => todos.value.filter((t) => t.status === 'DONE'))
  const archivedTodos = computed(() => todos.value.filter((t) => t.status === 'ARCHIVED'))

  async function fetchTodos(includeArchived = false): Promise<void> {
    loading.value = true
    try {
      const res = await $fetch<{ success: boolean; data: Todo[] }>(
        `/api/todos${includeArchived ? '?includeArchived=1' : ''}`,
      )
      if (res.success) {
        todos.value = res.data
        hasLoaded.value = true
      }
    } catch (err) {
      console.error('fetchTodos failed:', err)
    } finally {
      loading.value = false
    }
  }

  async function createTodo(data: TodoCreate): Promise<Todo | null> {
    loading.value = true
    try {
      const res = await $fetch<{ success: boolean; data: Todo }>('/api/todos', {
        method: 'POST',
        body: data,
      })
      if (res.success && res.data) {
        todos.value = [res.data, ...todos.value]
        return res.data
      }
    } catch (err) {
      console.error('createTodo failed:', err)
    } finally {
      loading.value = false
    }
    return null
  }

  async function updateTodo(id: number, data: TodoUpdate): Promise<boolean> {
    try {
      const res = await $fetch<{ success: boolean; data: Todo }>(`/api/todos/${id}`, {
        method: 'PATCH',
        body: data,
      })
      if (res.success && res.data) {
        const idx = todos.value.findIndex((t) => t.id === id)
        if (idx !== -1) todos.value[idx] = res.data
        return true
      }
    } catch (err) {
      console.error('updateTodo failed:', err)
    }
    return false
  }

  async function deleteTodo(id: number): Promise<boolean> {
    try {
      const res = await $fetch<{ success: boolean }>(`/api/todos/${id}`, {
        method: 'DELETE',
      })
      if (res.success) {
        todos.value = todos.value.filter((t) => t.id !== id)
        return true
      }
    } catch (err) {
      console.error('deleteTodo failed:', err)
    }
    return false
  }

  async function toggleDone(todo: Todo): Promise<boolean> {
    return updateTodo(todo.id, { status: todo.status === 'DONE' ? 'OPEN' : 'DONE' })
  }

  async function archiveTodo(id: number): Promise<boolean> {
    return updateTodo(id, { status: 'ARCHIVED' })
  }

  return {
    todos,
    loading,
    hasLoaded,
    openTodos,
    doneTodos,
    archivedTodos,
    fetchTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleDone,
    archiveTodo,
  }
})
