// /server/api/resonance/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from './../utils/error'
import { validateApiKey } from './../utils/validateKey'
import prisma from './../utils/prisma'

export default defineEventHandler(async (event) => {
  let response
  let id

  try {
    // Validate and parse the resonance ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid resonance ID. It must be a positive integer.',
      })
    }

    console.log(`Attempting to delete resonance with ID: ${id}`)

    // Authenticate
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Fetch the resonance entry and verify ownership
    const resonance = await prisma.resonance.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!resonance) {
      throw createError({
        statusCode: 404,
        message: `resonance with ID ${id} does not exist.`,
      })
    }

    // Admin bypass
    if (user.Role === 'ADMIN') {
      await prisma.resonance.delete({ where: { id } })
      return {
        success: true,
        message: `resonance with ID ${id} deleted successfully by admin.`,
      }
    }

    // User must be the owner
    if (resonance.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You are not authorized to delete this resonance.',
      })
    }

    // Proceed to delete
    await prisma.resonance.delete({ where: { id } })

    console.log(`resonance with ID ${id} successfully deleted.`)
    response = {
      success: true,
      message: `resonance with ID ${id} successfully deleted.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error while deleting resonance:', handledError)

    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message || `Failed to delete resonance with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
