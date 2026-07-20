// GET /api/media-entries
//
// Browse route for the Media Watchlist personal log (media-watchlist/t-009).
// Filter/sort/paginate per conductor
// projects/media-watchlist/docs/t-008-final-schema-and-browse-api.md §3.
// Admin-gated: this is Silas's private personal log (BROWSE-UX.md — "Private
// by default; no social features at MVP"), same convention as
// server/api/art/queue/stats.get.ts.
import { defineEventHandler, getQuery } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import { MediaType } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'

const MEDIA_TYPES = Object.values(MediaType) as string[]
const SORT_MODES = [
  'date_desc',
  'date_asc',
  'title_asc',
  'title_desc',
  'starred_first',
] as const
type SortMode = (typeof SORT_MODES)[number]

function toPositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 0) return fallback
  return Math.min(parsed, max)
}

function parseIntList(value: unknown): number[] {
  if (typeof value !== 'string' || !value.trim()) return []
  return value
    .split(',')
    .map((entry) => Number(entry.trim()))
    .filter((entry) => Number.isInteger(entry))
}

// MySQL/MariaDB always sorts NULL first and gives Prisma no `nulls: 'last'`
// escape hatch for this provider (that option only exists for
// Postgres/CockroachDB/SQL Server) -- so DESC naturally puts unwatched-date
// entries last (matching BROWSE-UX.md's "unknowns to the bottom" default),
// but ASC puts them first. Documented rather than worked around with raw SQL,
// since this is the minimal browse route -- a future pass can add a raw
// `ORDER BY watchedMonth IS NULL, ...` if the ASC case needs to match too.
function toOrderBy(
  sort: SortMode,
): Prisma.MediaEntryOrderByWithRelationInput[] {
  switch (sort) {
    case 'date_asc':
      return [{ watchedMonth: 'asc' }, { watchedDay: 'asc' }]
    case 'title_asc':
      return [{ title: 'asc' }]
    case 'title_desc':
      return [{ title: 'desc' }]
    case 'starred_first':
      return [
        { starred: 'desc' },
        { watchedMonth: 'desc' },
        { watchedDay: 'desc' },
      ]
    case 'date_desc':
    default:
      return [{ watchedMonth: 'desc' }, { watchedDay: 'desc' }]
  }
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)

    const query = getQuery(event)

    const andFilters: Prisma.MediaEntryWhereInput[] = []

    const year = toPositiveInt(query.year, 0, 9999)
    if (year) andFilters.push({ year })

    const mediaTypes =
      typeof query.mediaType === 'string'
        ? query.mediaType
            .split(',')
            .map((entry) => entry.trim())
            .filter((entry) => MEDIA_TYPES.includes(entry))
        : []
    if (mediaTypes.length) {
      andFilters.push({ mediaType: { in: mediaTypes as MediaType[] } })
    }

    if (query.starred === 'true') {
      andFilters.push({ starred: true })
    }

    const months = parseIntList(query.month).filter((m) => m >= 1 && m <= 12)
    if (months.length) andFilters.push({ watchedMonth: { in: months } })

    const season = toPositiveInt(query.season, 0, 999)
    if (season) andFilters.push({ season })

    const search = typeof query.search === 'string' ? query.search.trim() : ''
    if (search) {
      andFilters.push({
        OR: [{ title: { contains: search } }, { author: { contains: search } }],
      })
    }

    const sort = SORT_MODES.includes(query.sort as SortMode)
      ? (query.sort as SortMode)
      : 'date_desc'

    const take = Math.max(1, toPositiveInt(query.take, 50, 200))
    const skip = toPositiveInt(query.skip, 0, 1_000_000)

    const where = andFilters.length ? { AND: andFilters } : undefined

    const [data, total] = await Promise.all([
      prisma.mediaEntry.findMany({
        where,
        orderBy: toOrderBy(sort),
        take,
        skip,
      }),
      prisma.mediaEntry.count({ where }),
    ])

    return {
      success: true,
      data,
      count: data.length,
      total,
    }
  } catch (error) {
    return errorHandler(error)
  }
})
