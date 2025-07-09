// /server/api/hybrids/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'

export default defineEventHandler(async (event) => {
  let response
  let hybridId: number = -1

  try {
    // 🔐 Authenticate user FIRST
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // ✅ Validate ID AFTER token check
    hybridId = Number(event.context.params?.id)
    if (!hybridId || isNaN(hybridId) || hybridId <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid Hybrid ID. It must be a positive integer.',
      })
    }

    console.log(`User ${userId} requested deletion of Hybrid ${hybridId}`)

    // 🔍 Find hybrid and verify ownership
    const hybrid = await prisma.hybrid.findUnique({
      where: { id: hybridId },
      select: { userId: true },
    })

    if (!hybrid) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: `Hybrid with ID ${hybridId} does not exist.`,
      })
    }

    if (hybrid.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this hybrid.',
      })
    }

    // 🗑️ Delete the hybrid
    await prisma.hybrid.delete({ where: { id: hybridId } })
    console.log(`Hybrid ${hybridId} deleted successfully`)

    event.node.res.statusCode = 200
    response = {
      success: true,
      message: `Hybrid with ID ${hybridId} successfully deleted.`,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    console.error(`Error deleting hybrid ${hybridId}:`, message)

    event.node.res.statusCode = statusCode || 500
    response = {
      success: false,
      message: message || `Failed to delete hybrid with ID ${hybridId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
