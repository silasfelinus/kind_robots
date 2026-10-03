import { defineEventHandler } from 'h3'
import prisma from '@/server/utils/prisma'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { comicAttemptUrls, comicImageMap } from '@/server/utils/comicStudio'
import type { ComicSeriesSummary } from '~/types/comicStudio'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const rows = await prisma.comicSeries.findMany({
      where: { isArchived: false },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { Entities: true, Slots: true } } },
    })
    const coverIds = rows
      .map((row) => row.coverAttemptId)
      .filter((id): id is number => Boolean(id))
    const covers = coverIds.length
      ? await prisma.comicAttempt.findMany({
          where: { id: { in: coverIds } },
          select: { id: true, artImageId: true },
        })
      : []
    const coverById = new Map(
      covers.map((cover) => [cover.id, cover.artImageId]),
    )
    const images = await comicImageMap(
      covers.map((cover) => cover.artImageId ?? 0),
    )
    const data: ComicSeriesSummary[] = rows.map((row) => {
      const artImageId = row.coverAttemptId
        ? (coverById.get(row.coverAttemptId) ?? null)
        : null
      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        entityCount: row._count.Entities,
        slotCount: row._count.Slots,
        coverThumbUrl: comicAttemptUrls(
          artImageId,
          artImageId ? images.get(artImageId) : undefined,
        ).thumbUrl,
        updatedAt: row.updatedAt.toISOString(),
      }
    })
    return {
      success: true,
      statusCode: 200,
      message: `${data.length} comic series.`,
      data,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
