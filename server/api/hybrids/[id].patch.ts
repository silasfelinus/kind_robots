// /server/api/hybrids/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '@/server/api/utils/prisma'
import { errorHandler } from '@/server/api/utils/error'
import { validateApiKey } from '@/server/api/utils/validateKey'
import type { Hybrid } from '@prisma/client'

export default defineEventHandler(async (event) => {
  const hybridId = Number(event.context.params?.id)

  try {
    // Validate Hybrid ID
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

    // Verify ownership
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
        message: 'You do not have permission to update this hybrid.',
      }
    }

    // Read and validate patch data
    const hybridData: Partial<Hybrid> = await readBody(event)
    if (!hybridData || Object.keys(hybridData).length === 0) {
      event.node.res.statusCode = 400
      return {
        success: false,
        message: 'No data provided for update.',
      }
    }

    // Perform update
    const data = await prisma.hybrid.update({
      where: { id: hybridId },
      data: hybridData,
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      data,
    }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: message || `Failed to update hybrid with ID ${hybridId}.`,
    }
  }
})
