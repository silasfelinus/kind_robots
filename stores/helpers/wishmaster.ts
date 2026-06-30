// /stores/helpers/wishmaster.ts
import type { Todo, TodoCreate, TodoPriority } from '@/stores/todoStore'

export const WISHMASTER_PROJECT_SLUG = 'wishmaster'
export const WISHMASTER_WISH_CATEGORY = 'AGENT' as const
export const WISHMASTER_DEFAULT_ICON = 'kind-icon:wand' as const

export type WishStatus = Todo['status']
export type WishPriority = TodoPriority
export type WishTodo = Todo & { category: typeof WISHMASTER_WISH_CATEGORY }
export type WishCreate = Omit<TodoCreate, 'category'> & {
  projectSlug?: string | null
}

function cleanText(value?: string | null): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function withProjectContext(description?: string | null, projectSlug?: string | null): string | null {
  const body = cleanText(description)
  const project = cleanText(projectSlug)

  if (!project) return body
  if (!body) return `Project: ${project}`
  if (body.toLowerCase().includes(`project: ${project.toLowerCase()}`)) return body

  return `${body}\n\nProject: ${project}`
}

export function isWishTodo(todo: Todo): todo is WishTodo {
  return !todo.category || todo.category === WISHMASTER_WISH_CATEGORY
}

export function makeWishTodo(data: WishCreate): TodoCreate {
  return {
    title: data.title,
    description: withProjectContext(data.description, data.projectSlug),
    priority: data.priority ?? 'NORMAL',
    category: WISHMASTER_WISH_CATEGORY,
    dueDate: data.dueDate ?? null,
    icon: data.icon ?? WISHMASTER_DEFAULT_ICON,
    imagePath: data.imagePath ?? null,
  }
}

export function wishLabel(todo: Todo): string {
  return todo.status === 'DONE' ? 'Fulfilled wish' : 'Open wish'
}

export function wishNarrative(todo: Todo): string {
  const priority = todo.priority.toLowerCase()
  const status = todo.status.toLowerCase()
  return `${todo.title} is a ${priority}-priority ${status} Wishmaster request.`
}
