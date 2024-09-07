import type { Prisma, Todo } from '@prisma/client'
import prisma from '../utils/prisma'

// Function to create a new Todo
export async function createTodo(data: Partial<Todo>): Promise<Todo> {
  // Validate required fields
  if (!data.task || !data.content || !data.userId) {
    throw new Error('Task, content, and userId must be provided')
  }

  // Create the new Todo with the provided fields
  const todoCreateInput: Prisma.TodoCreateInput = {
    task: data.task,
    content: data.content,
    notes: data.notes ?? '',
    isCompleted: data.isCompleted ?? false,
    User: {
      connect: { id: data.userId }, // userId is required
    },
  }

  return prisma.todo.create({ data: todoCreateInput })
}

// Function to add multiple Todos
export async function addTodos(
  todosData: Partial<Todo>[],
): Promise<{ count: number; todos: Todo[]; errors: string[] }> {
  const errors: string[] = []
  const todos: Todo[] = []

  for (const todoData of todosData) {
    try {
      const newTodo = await createTodo(todoData)
      todos.push(newTodo)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Failed to create todo: ${errorMessage}`)
    }
  }

  return { count: todos.length, todos, errors }
}

// Fetch all Todos with pagination
export function fetchTodos(page = 1, pageSize = 100): Promise<Todo[]> {
  const skip = (page - 1) * pageSize
  return prisma.todo.findMany({ skip, take: pageSize })
}

// Fetch a Todo by its ID
export function fetchTodoById(id: number): Promise<Todo | null> {
  return prisma.todo.findUnique({ where: { id } })
}

// Update an existing Todo
export async function updateTodo(
  id: number,
  data: Partial<Todo>,
): Promise<Todo | null> {
  const todoExists = await prisma.todo.findUnique({ where: { id } })

  if (!todoExists) {
    return null
  }

  return prisma.todo.update({
    where: { id },
    data: data as Prisma.TodoUpdateInput,
  })
}

// Delete a Todo
export async function deleteTodo(id: number): Promise<boolean> {
  const todoExists = await prisma.todo.findUnique({ where: { id } })

  if (!todoExists) {
    return false
  }

  await prisma.todo.delete({ where: { id } })
  return true
}

// Count all Todos
export function countTodos(): Promise<number> {
  return prisma.todo.count()
}

// Fetch all Todos for a specific user
export function fetchTodosByUserId(
  userId: number,
  page = 1,
  pageSize = 100,
): Promise<Todo[]> {
  const skip = (page - 1) * pageSize
  return prisma.todo.findMany({
    where: { userId },
    skip,
    take: pageSize,
  })
}

export type { Todo }