// /server/api/sheets/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { requireApiUser } from '@/server/utils/authGuard'
import { sanitizePitchSheetPayload } from '@/server/utils/pitchSheets/payload'
import { pitchSheetMutationSelect } from './selects'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const body = await readBody<Record<string, unknown>>(event).catch(
      () => ({} as Record<string, unknown>),
    )

    if (body.dreamId !== undefined && body.dreamId !== null) {
      throw createError({
        statusCode: 400,
        message:
          'Dream-derived PitchSheets must be created through /api/sheets/by-dream/:dreamId.',
      })
    }

    const overrides = sanitizePitchSheetPayload(body)
    const title = typeof overrides.title === 'string' ? overrides.title.trim() : ''

    if (!title) {
      throw createError({
        statusCode: 400,
        message: 'A "title" is required to create a standalone PitchSheet.',
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
      select: pitchSheetMutationSelect,
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
