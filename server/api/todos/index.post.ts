// /server/api/todos/index.post.ts
import { createError, defineEventHandler, H3Error, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { requireApiUser } from '@/server/utils/authGuard'
import { assertOnlyFields } from '@/server/utils/chatApi'
import { todoMutationFields } from './mutation'

const todoPriorities = ['LOW', 'NORMAL', 'HIGH'] as const
const todoCategories = [
  'AGENT',
  'KAIZEN',
  'HONEYDO',
  'DESIRED_FEATURE',
] as const

type TodoPriorityValue = (typeof todoPriorities)[number]
type TodoCategoryValue = (typeof todoCategories)[number]

type TodoCreateBody = {
  title: string
  description?: string | null
  priority?: TodoPriorityValue
  category?: TodoCategoryValue
  dueDate?: string | null
  icon?: string | null
  imagePath?: string | null
  dreamId?: number | null
  projectId?: number | null
  order?: number | null
}

function normalizeDueDate(value?: string | null): Date | null {
  if (!value) return null

  const dueDate = new Date(value)
  if (Number.isNaN(dueDate.getTime())) {
    throw createError({
      statusCode: 400,
      message: 'dueDate must be a valid date',
    })
  }

  return dueDate
}

function normalizePriority(value?: TodoPriorityValue): TodoPriorityValue {
  return todoPriorities.includes(value as TodoPriorityValue)
    ? (value as TodoPriorityValue)
    : 'NORMAL'
}

function normalizeCategory(value?: TodoCategoryValue): TodoCategoryValue {
  return todoCategories.includes(value as TodoCategoryValue)
    ? (value as TodoCategoryValue)
    : 'AGENT'
}

function normalizeId(value?: number | null): number | null {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : null
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const userId = auth.user.id
    const body = await readBody<TodoCreateBody>(event)

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message: 'Todo create payload must be a JSON object.',
      })
    }

    assertOnlyFields(body as Record<string, unknown>, todoMutationFields, 'Todo')

    const title = body?.title?.trim()

    if (!title) {
      throw createError({ statusCode: 400, message: 'title is required' })
    }

    const dreamId = normalizeId(body.dreamId)
    const projectId = normalizeId(body.projectId)
    const order =
      body.order != null && Number.isInteger(body.order) ? body.order : null

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { userId: true },
      })

      if (!project) {
        throw createError({ statusCode: 404, message: 'Project not found.' })
      }

      if (auth.user.Role !== 'ADMIN' && project.userId !== userId) {
        throw createError({
          statusCode: 403,
          message: 'You do not have permission to add Todos to this Project.',
        })
      }
    }

    if (dreamId) {
      const dream = await prisma.dream.findUnique({
        where: { id: dreamId },
        select: { userId: true },
      })

      if (!dream) {
        throw createError({ statusCode: 404, message: 'Dream not found.' })
      }

      if (auth.user.Role !== 'ADMIN' && dream.userId !== userId) {
        throw createError({
          statusCode: 403,
          message: 'You do not have permission to add Todos to this Dream.',
        })
      }
    }

    const todo = await prisma.todo.create({
      data: {
        title,
        description: body.description ?? null,
        status: 'OPEN',
        priority: normalizePriority(body.priority),
        category: normalizeCategory(body.category),
        dueDate: normalizeDueDate(body.dueDate),
        icon: body.icon ?? null,
        imagePath: body.imagePath ?? null,
        userId,
        dreamId,
        projectId,
        order,
      },
    })

    event.node.res.statusCode = 201
    return { success: true, message: 'Todo created.', data: todo }
  } catch (error) {
    if (error instanceof H3Error) throw error

    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to create Todo.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
