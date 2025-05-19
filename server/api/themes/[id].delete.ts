// /server/api/themes/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/api/utils/prisma'
import { errorHandler } from '@/server/api/utils/error'
import { validateApiKey } from '@/server/api/utils/validateKey'

export default defineEventHandler(async (event) => {
  let response
  let id

  try {
    // Validate theme ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid theme ID. It must be a positive integer.',
      })
    }

    console.log(`[theme.delete] Attempting to delete theme with ID: ${id}`)

    // Validate auth token
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Fetch theme
    const theme = await prisma.theme.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!theme) {
      throw createError({
        statusCode: 404,
        message: `Theme with ID ${id} does not exist.`,
      })
    }

    // Admin bypass
    if (user.Role === 'ADMIN') {
      await prisma.theme.delete({ where: { id } })
      response = {
        success: true,
        message: `Theme with ID ${id} deleted successfully by admin.`,
        statusCode: 200,
      }
      event.node.res.statusCode = 200
      return response
    }

    // Ownership check
    if (theme.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You are not authorized to delete this theme.',
      })
    }

    // Proceed to delete
    await prisma.theme.delete({ where: { id } })

    console.log(`[theme.delete] Theme with ID ${id} successfully deleted.`)

    response = {
      success: true,
      message: `Theme with ID ${id} successfully deleted.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('[theme.delete] Error while deleting theme:', handledError)

    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to delete theme with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
