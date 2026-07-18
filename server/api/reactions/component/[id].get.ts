// /server/api/reactions/component/[id].get.ts
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { errorHandler } from '../../../utils/error'
import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const componentId = Number(getRouterParam(event, 'id'))

  try {
    if (!Number.isInteger(componentId) || componentId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'A valid component ID is required.',
      })
    }

    const data = await prisma.reaction.findMany({
      where: { componentId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        User: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarImage: true,
            Role: true,
            isPublic: true,
          },
        },
      },
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message:
        handledError.message ||
        `Failed to retrieve reactions for component with ID ${componentId}.`,
      data: [],
      statusCode: event.node.res.statusCode,
    }
  }
})
