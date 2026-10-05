import { defineEventHandler } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import {
  comicImageMap,
  readComicId,
  requireComicSeries,
  syncComicAttempts,
  toComicAttemptDto,
} from '@/server/utils/comicStudio'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const seriesId = readComicId(event, 'series id')
    await requireComicSeries(seriesId)
    const changed = await syncComicAttempts({ seriesId })
    const active = await prisma.comicAttempt.findMany({
      where: {
        Slot: { seriesId },
        status: { in: ['QUEUING', 'PENDING', 'RUNNING'] },
      },
    })
    const rows = [
      ...new Map([...changed, ...active].map((row) => [row.id, row])).values(),
    ]
    const images = await comicImageMap(rows.map((row) => row.artImageId ?? 0))
    return {
      success: true,
      statusCode: 200,
      message: `${active.length} render${active.length === 1 ? '' : 's'} in flight.`,
      data: {
        attempts: rows.map((row) => toComicAttemptDto(row, images)),
        active: active.length,
      },
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
