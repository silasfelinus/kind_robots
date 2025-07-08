// /server/api/hybrids/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/api/utils/prisma'
import { errorHandler } from '@/server/api/utils/error'
import { validateApiKey } from '@/server/api/utils/validateKey'

export default defineEventHandler(async (event) => {
  const hybridId = Number(event.context.params?.id)

  try {
    // Validate ID
    if (isNaN(hybridId) || hybridId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Hybrid ID. It must be a positive integer.',
      })
    }

    // Authenticate user
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      event.node.res.statusCode = 401
      return {
        success: false,
        message: 'Invalid or expired token.',
      }
    }

    // Check hybrid ownership
    const existingHybrid = await prisma.hybrid.findUnique({
      where: { id: hybridId },
      select: { userId: true },
    })
    if (!existingHybrid) {
      event.node.res.statusCode = 404
      return {
        success: false,
        message: `Hybrid with ID ${hybridId} does not exist.`,
      }
    }

    if (existingHybrid.userId !== user.id) {
      event.node.res.statusCode = 403
      return {
        success: false,
        message: 'You do not have permission to delete this hybrid.',
      }
    }

    // Delete the hybrid
    await prisma.hybrid.delete({ where: { id: hybridId } })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Hybrid deleted successfully.',
    }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || `Failed to delete hybrid with ID ${hybridId}.`,
    }
  }
})
