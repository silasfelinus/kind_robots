// /server/api/icons/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from './../utils/prisma'
import { errorHandler } from './../utils/error'
import { validateApiKey } from './../utils/validateKey'

export default defineEventHandler(async (event) => {
  let response
  let id

  try {
    // Parse and validate ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid SmartIcon ID. It must be a positive integer.',
      })
    }

    console.log(`Attempting to delete SmartIcon with ID: ${id}`)

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    const icon = await prisma.smartIcon.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!icon) {
      throw createError({
        statusCode: 404,
        message: `SmartIcon with ID ${id} does not exist.`,
      })
    }

    // Admin override
    if (user.Role === 'ADMIN') {
      await prisma.smartIcon.delete({ where: { id } })
      return {
        success: true,
        message: `SmartIcon with ID ${id} deleted successfully by admin.`,
      }
    }

    // Owner check
    if (icon.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You are not authorized to delete this SmartIcon.',
      })
    }

    await prisma.smartIcon.delete({ where: { id } })

    console.log(`SmartIcon with ID ${id} successfully deleted.`)
    response = {
      success: true,
      message: `SmartIcon with ID ${id} successfully deleted.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error) {
    const handled = errorHandler(error)
    console.error('Error while deleting SmartIcon:', handled)
    event.node.res.statusCode = handled.statusCode || 500
    response = {
      success: false,
      message: handled.message || `Failed to delete SmartIcon with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
