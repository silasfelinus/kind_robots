// /server/api/dreams/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

function getDreamId(event: any): number {
  const id = Number(event.context.params?.id)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: 'Invalid Dream ID. It must be a positive integer.',
    })
  }

  return id
}

export default defineEventHandler(async (event) => {
  let id = 0

  try {
    id = getDreamId(event)

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const dream = await prisma.dream.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        userId: true,
      },
    })

    if (!dream) {
      throw createError({
        statusCode: 404,
        message: `Dream with ID ${id} not found.`,
      })
    }

    if (dream.userId !== user.id && user.Role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'You are not authorized to delete this dream.',
      })
    }

    const data = await prisma.dream.delete({
      where: { id },
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: `Dream with ID ${id} deleted successfully.`,
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || `Failed to delete Dream with ID ${id}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
