// GET /api/todos/project/:projectId
// Returns todos scoped to a first-class Project, ordered for workspace display.
import { createError, defineEventHandler, H3Error } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { requireApiUser } from '@/server/utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const projectId = Number(event.context.params?.projectId)

    if (!Number.isInteger(projectId) || projectId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid projectId.' })
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })

    if (!project) {
      throw createError({ statusCode: 404, message: 'Project not found.' })
    }

    if (auth.user.Role !== 'ADMIN' && project.userId !== auth.user.id) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to view this Project.',
      })
    }

    const todos = await prisma.todo.findMany({
      where: {
        projectId,
        ...(auth.user.Role === 'ADMIN' ? {} : { userId: auth.user.id }),
      },
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
