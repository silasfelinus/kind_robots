// GET /api/todos/dream/:dreamId
// Returns all todos scoped to a specific dream/project, ordered for display.
import { defineEventHandler, createError, H3Error } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { requireApiUser } from '@/server/utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)

    const dreamId = Number(event.context.params?.dreamId)
    if (!Number.isInteger(dreamId) || dreamId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid dreamId.' })
    }

    const todos = await prisma.todo.findMany({
      where: { dreamId, userId: auth.user.id },
      orderBy: [
        { order: 'asc' },
        { priority: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return { success: true, data: todos }
  } catch (error) {
    if (error instanceof H3Error) throw error
    return errorHandler(error)
  }
})
