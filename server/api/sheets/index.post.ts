// /server/api/sheets/index.post.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { requireApiUser } from '@/server/utils/authGuard'
import { buildPitchSheetFromDream } from '@/server/utils/pitchSheets/defaults'
import { sanitizePitchSheetPayload } from '@/server/utils/pitchSheets/payload'

const artImageSelect = {
  select: {
    id: true,
    imagePath: true,
    thumbnailData: true,
    fileName: true,
    fileType: true,
  },
} as const

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)

    const body: Record<string, unknown> = await readBody<
      Record<string, unknown>
    >(event).catch(() => ({}))
    const overrides = sanitizePitchSheetPayload(body)
    const dreamId =
      body.dreamId != null ? Number(body.dreamId) : undefined

    // Dream-attached create: verify + delegate to the dream-derived defaults
    // (same behavior as POST /api/sheets/by-dream/{dreamId}).
    if (dreamId !== undefined) {
      if (Number.isNaN(dreamId) || dreamId <= 0) {
        throw createError({
          statusCode: 400,
          message: 'Invalid dreamId. Must be a positive integer.',
        })
      }

      const dream = await prisma.dream.findUnique({ where: { id: dreamId } })
      if (!dream) {
        throw createError({
          statusCode: 404,
          message: `Dream with ID ${dreamId} not found.`,
        })
      }
      if (dream.userId !== user.id && user.Role !== 'ADMIN') {
        throw createError({
          statusCode: 403,
          message: `You are not authorized to create a PitchSheet for Dream ${dreamId}.`,
        })
      }

      const existing = await prisma.pitchSheet.findUnique({
        where: { dreamId },
        include: { Dream: true, ArtImage: artImageSelect },
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

      const created = await prisma.pitchSheet.create({
        data: buildPitchSheetFromDream(dream, user.id, overrides),
        include: { Dream: true, ArtImage: artImageSelect },
      })

      event.node.res.statusCode = 201
      return {
        success: true,
        message: 'PitchSheet created successfully.',
        data: created,
        statusCode: 201,
      }
    }

    // Standalone create (no dream): title is the only required field.
    const title = typeof overrides.title === 'string' ? overrides.title.trim() : ''
    if (!title) {
      throw createError({
        statusCode: 400,
        message: 'A "title" is required to create a PitchSheet without a dreamId.',
      })
    }

    const created = await prisma.pitchSheet.create({
      data: {
        ...overrides,
        title,
        layoutKey:
          typeof overrides.layoutKey === 'string' && overrides.layoutKey
            ? overrides.layoutKey
            : 'pitch-card',
        userId: user.id,
      },
      include: { Dream: true, ArtImage: artImageSelect },
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
      message: handled.message || 'Failed to create PitchSheet.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
