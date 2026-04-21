// /server/api/butterfly/records/index.post.ts
// Called when a user confirms a capture in the game modal.
// The @@unique([userId, butterflyId]) constraint on ButterflyRecord
// means catching the same species twice returns a clean 409, not a crash.

import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<{ butterflyId: number }>(event)

    if (!body?.butterflyId || typeof body.butterflyId !== 'number') {
      throw createError({
        statusCode: 400,
        message: '"butterflyId" is required and must be a number.',
      })
    }

    const butterfly = await prisma.butterfly.findUnique({
      where: { id: body.butterflyId },
      select: { id: true, isPublic: true },
    })
    if (!butterfly) {
      throw createError({
        statusCode: 404,
        message: `Butterfly with ID ${body.butterflyId} not found.`,
      })
    }

    // Check for existing catch — return 409 rather than letting the DB
    // throw a unique constraint error, so the client gets a clear signal.
    const existing = await prisma.butterflyRecord.findUnique({
      where: {
        userId_butterflyId: {
          userId: user.id,
          butterflyId: body.butterflyId,
        },
      },
    })
    if (existing) {
      throw createError({
        statusCode: 409,
        message: 'You have already caught this butterfly.',
      })
    }

    const data = await prisma.butterflyRecord.create({
      data: {
        userId: user.id,
        butterflyId: body.butterflyId,
      },
      include: {
        Butterfly: {
          select: {
            id: true,
            name: true,
            message: true,
            wingTopColor: true,
            wingBottomColor: true,
            rarityNumber: true,
          },
        },
      },
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      message: `${data.Butterfly.name} added to your collection.`,
      data,
      statusCode: 201,
    }
  } catch (error) {
    const handled = errorHandler(error)
    console.error('[butterfly-records.post] Error:', handled)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to record butterfly capture.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
