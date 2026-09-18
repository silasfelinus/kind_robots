// /server/api/admin/art-archive/entries/[id]/rate.patch.ts
//
// Admin-only rating action (art-archive/t-013): sets or clears an
// ArchiveEntry's 1-5 curation rating. Rating is entry-level metadata, not
// tied to processState/isActive, so it survives rescans/moves the same way
// the schema doc for `rating` already promises -- this endpoint just gives
// that field a write path (until now it was read-only: filterable and
// displayed, but nothing could ever set it).
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'

type RateBody = { rating?: number | null }

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid archive entry id.',
      })
    }

    const body = await readBody<RateBody>(event)
    const rating = body?.rating ?? null
    if (
      rating !== null &&
      (!Number.isInteger(rating) || rating < 1 || rating > 5)
    ) {
      throw createError({
        statusCode: 400,
        message: 'rating must be an integer from 1 to 5, or null to clear it.',
      })
    }

    const entry = await prisma.archiveEntry.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!entry)
      throw createError({
        statusCode: 404,
        message: `Archive entry #${id} not found.`,
      })

    const updated = await prisma.archiveEntry.update({
      where: { id },
      data: { rating },
      select: { id: true, rating: true },
    })

    return {
      success: true,
      message: rating
        ? `Archive entry #${id} rated ${rating}.`
        : `Archive entry #${id} rating cleared.`,
      data: updated,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to rate archive entry.',
      statusCode,
    }
  }
})
