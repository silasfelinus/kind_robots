// /server/api/code/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

export default defineEventHandler(async (event) => {
  let id = 0

  try {
    id = Number(event.context.params?.id)

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Code ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)
    const currentUser = isValid && user ? user : null
    const isAdmin = currentUser?.Role === 'ADMIN'

    const data = await prisma.code.findUnique({
      where: { id },
    })

    if (!data || !data.isActive) {
      throw createError({
        statusCode: 404,
        message: `Code with ID ${id} not found.`,
      })
    }

    const canRead =
      data.isPublic ||
      isAdmin ||
      Boolean(currentUser && data.userId === currentUser.id)

    if (!canRead) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to view this Code.',
      })
    }

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Code fetched successfully.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    console.error(`[code.get] Error fetching Code ${id}:`, handled)

    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || `Failed to fetch Code with ID ${id}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
