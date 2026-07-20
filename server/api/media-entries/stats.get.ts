// GET /api/media-entries/stats
//
// Aggregate stats for the Media Watchlist Stats view (media-watchlist/t-009,
// BROWSE-UX.md §4). Follows the groupBy + reducer pattern in
// server/api/art/queue/stats.get.ts. Admin-gated, same as the browse route.
//
// Query: ?year=<int> (optional; omit for all-time totals)
import { defineEventHandler, getQuery } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)

    const query = getQuery(event)
    const parsedYear = Number(query.year)
    const year = Number.isInteger(parsedYear) ? parsedYear : undefined
    const where = year ? { year } : {}

    const [
      totalCount,
      byMediaType,
      byMonth,
      starredCount,
      topStarred,
      audiobookHours,
      pagesRead,
      comicIssues,
      tvSeasons,
    ] = await Promise.all([
      prisma.mediaEntry.count({ where }),
      prisma.mediaEntry.groupBy({
        by: ['mediaType'],
        where,
        _count: { _all: true },
      }),
      prisma.mediaEntry.groupBy({
        by: ['watchedMonth'],
        where: { ...where, watchedMonth: { not: null } },
        _count: { _all: true },
      }),
      prisma.mediaEntry.count({ where: { ...where, starred: true } }),
      prisma.mediaEntry.findMany({
        where: { ...where, starred: true },
        orderBy: [{ watchedMonth: 'desc' }, { watchedDay: 'desc' }],
        take: 5,
        select: { id: true, title: true, mediaType: true, year: true },
      }),
      prisma.mediaEntry.aggregate({
        where: { ...where, mediaType: 'AUDIOBOOK' },
        _sum: { durationHours: true },
      }),
      prisma.mediaEntry.aggregate({
        where: { ...where, mediaType: { in: ['BOOK', 'NOVELLA'] } },
        _sum: { pageCount: true },
      }),
      prisma.mediaEntry.aggregate({
        where: { ...where, mediaType: 'COMIC' },
        _sum: { issueCount: true },
      }),
      prisma.mediaEntry.aggregate({
        where: { ...where, mediaType: 'TV' },
        _count: { _all: true },
        _sum: { season: true },
      }),
    ])

    const countByType = byMediaType.reduce<Record<string, number>>(
      (acc, group) => {
        acc[group.mediaType] = group._count._all
        return acc
      },
      {},
    )

    const countByMonth = byMonth.reduce<Record<string, number>>(
      (acc, group) => {
        if (group.watchedMonth != null) {
          acc[String(group.watchedMonth)] = group._count._all
        }
        return acc
      },
      {},
    )

    return {
      success: true,
      data: {
        year: year ?? null,
        totalCount,
        countByType,
        countByMonth,
        starredCount,
        topStarred,
        audiobookHours: audiobookHours._sum.durationHours ?? 0,
        pagesRead: pagesRead._sum.pageCount ?? 0,
        comicIssuesRead: comicIssues._sum.issueCount ?? 0,
        tvShowCount: tvSeasons._count._all,
        tvSeasonCount: tvSeasons._sum.season ?? 0,
      },
    }
  } catch (error) {
    return errorHandler(error)
  }
})
