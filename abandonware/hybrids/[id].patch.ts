// /server/api/hybrids/[id].patch.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../../server/api/utils/prisma'
import { errorHandler } from '../../server/api/utils/error'
import { validateApiKey } from '../../server/api/utils/validateKey'
import type { Hybrid } from '@prisma/client'

export default defineEventHandler(async (event) => {
  let hybridId: number = -1

  try {
    // 🔒 Validate API key FIRST
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    // ✅ Then check Hybrid ID
    hybridId = Number(event.context.params?.id)
    if (!hybridId || isNaN(hybridId) || hybridId <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid Hybrid ID. It must be a positive integer.',
      })
    }

    // 🔐 Verify ownership
    const existingHybrid = await prisma.hybrid.findUnique({
      where: { id: hybridId },
      select: { userId: true },
    })

    if (!existingHybrid) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: `Hybrid with ID ${hybridId} does not exist.`,
      })
    }

    if (existingHybrid.userId !== user.id) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this hybrid.',
      })
    }

    // ✅ Read update data
    const hybridData: Partial<Hybrid> = await readBody(event)
    if (!hybridData || Object.keys(hybridData).length === 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // ✏️ Perform update
    const updated = await prisma.hybrid.update({
      where: { id: hybridId },
      data: hybridData,
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Hybrid updated successfully.',
      data: updated,
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
