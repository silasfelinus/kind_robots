// GET /api/media-entries/:id/related
//
// "Related entries — same title, other years or formats" for the Entry
// Detail panel (media-watchlist/t-006, BROWSE-UX.md §3). Admin-gated, same
// convention as the other media-entries routes.
import { defineEventHandler, getRouterParam, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'

const RELATED_LIMIT = 10

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)

    const rawId = getRouterParam(event, 'id')
    const id = Number(rawId)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid media entry id.' })
    }

    const entry = await prisma.mediaEntry.findUnique({
      where: { id },
      select: { title: true },
    })
    if (!entry) {
      throw createError({ statusCode: 404, message: 'Media entry not found.' })
    }

    const related = await prisma.mediaEntry.findMany({
      where: { title: entry.title, id: { not: id } },
      select: {
        id: true,
        title: true,
        mediaType: true,
        year: true,
        starred: true,
        watchedMonth: true,
        watchedDay: true,
      },
      orderBy: [
        { year: 'desc' },
        { watchedMonth: 'desc' },
        { watchedDay: 'desc' },
      ],
      take: RELATED_LIMIT,
    })

    return { success: true, data: related }
  } catch (error) {
    return errorHandler(error)
  }
})
