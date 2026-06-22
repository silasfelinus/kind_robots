// /server/api/sheets/by-dream/[dreamId].post.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import { buildPitchSheetFromDream } from '@/server/utils/pitchSheets/defaults'
import { sanitizePitchSheetPayload } from '@/server/utils/pitchSheets/payload'

export default defineEventHandler(async (event) => {
  let dreamId = 0

  try {
    dreamId = Number(event.context.params?.dreamId)
    if (Number.isNaN(dreamId) || dreamId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid Dream ID. Must be a positive integer.' })
    }

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({ statusCode: 401, message: 'Invalid or expired token.' })
    }

    const dream = await prisma.dream.findUnique({ where: { id: dreamId } })
    if (!dream) {
      throw createError({ statusCode: 404, message: `Dream with ID ${dreamId} not found.` })
    }

    if (dream.userId !== user.id && user.Role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: `You are not authorized to create a PitchSheet for Dream ${dreamId}.`,
      })
    }

    const existing = await prisma.pitchSheet.findUnique({
      where: { dreamId },
      include: {
          Dream: true,
          ArtImage: {
            select: {
              id: true,
              imagePath: true,
              thumbnailData: true,
              fileName: true,
              fileType: true,
            },
          },
        },
    })

    if (existing) {
      event.node.res.statusCode = 200
      return {
        success: true,
        message: 'PitchSheet already exists for this Dream.',
        data: existing,
        statusCode: 200,
      }
    }

    const body = await readBody<Record<string, unknown>>(event).catch(() => ({}))
    const overrides = sanitizePitchSheetPayload(body || {})
    const data = buildPitchSheetFromDream(dream, user.id, overrides)

    const created = await prisma.pitchSheet.create({
      data,
      include: {
          Dream: true,
          ArtImage: {
            select: {
              id: true,
              imagePath: true,
              thumbnailData: true,
              fileName: true,
              fileType: true,
            },
          },
        },
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      message: 'PitchSheet created successfully.',
      data: created,
      statusCode: 201,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || `Failed to create PitchSheet for Dream ${dreamId}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
