import type { Prisma, Todo } from '@prisma/client'
import prisma from '../utils/prisma'

// Function to fetch a random reward ID
async function fetchRandomRewardId(): Promise<number> {
  const response = await fetch('/api/rewards/random')
  if (!response.ok) {
    throw new Error('Failed to fetch random reward')
  }
  const randomReward = await response.json()
  return randomReward.reward.id
}

// Function to create a new Todo
export async function createTodo(data: Partial<Todo>): Promise<Todo> {
  // Validate required fields
  if (!data.task) {
    throw new Error('Task must be provided')
  }

  // Fetch random reward ID if not provided
  const rewardId = data.rewardId ?? (await fetchRandomRewardId())

  // Create the new Todo with the associated rewardId and userId
  const todoCreateInput: Prisma.TodoCreateInput = {
    task: data.task,
    category: data.category ?? 'default',
    completed: data.completed ?? false,
    Reward: {
      connect: { id: rewardId },
    },
    User: {
      connect: { id: data.userId ?? 1 }, // Default to 1 if userId is not provided
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
