import { defineEventHandler } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { readComicId, requireComicSeries } from '@/server/utils/comicStudio'
import { toComicCritiqueDto } from '@/server/utils/comicEditor'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const seriesId = readComicId(event, 'series id')
    await requireComicSeries(seriesId)
    const rows = await prisma.comicCritique.findMany({
      where: { seriesId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return {
      success: true,
      statusCode: 200,
      message: `${rows.length} verdicts.`,
      data: rows.map(toComicCritiqueDto),
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
