// GET /api/media-entries/export
//
// CSV export for the Media Watchlist Stats view (media-watchlist/t-006,
// BROWSE-UX.md §4: "Export button (CSV): downloads a filtered view as CSV.
// Private data; no public sharing at MVP."). Honors the same filters the
// browse UI exposes (search, mediaType, starred, sort) so "export what I'm
// currently looking at" matches what's on screen -- mirrors the filter
// parsing in index.get.ts but skips pagination (an export is the whole
// filtered set, not one page of it). Admin-gated, same as every other
// media-entries route.
import { defineEventHandler, getQuery, setHeader } from 'h3'
import type { MediaEntry, Prisma } from '~/prisma/generated/prisma/client'
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

// Hard cap so a filterless export on a much larger future log can't build an
// unbounded CSV in memory; the current log is ~2,440 entries total.
const MAX_ROWS = 20_000

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

const CSV_COLUMNS = [
  'title',
  'mediaType',
  'year',
  'watchedMonth',
  'watchedDay',
  'starred',
  'rating',
  'rewatch',
  'author',
  'season',
  'pageCount',
  'durationHours',
  'issueCount',
  'issueRange',
  'review',
  'reviewPublic',
  'externalUrl',
  'notes',
] as const

// RFC 4180 field escaping: quote any field containing a comma, quote, or
// line break, doubling embedded quotes. `review`/`notes` are freeform text
// (BROWSE-UX.md §5) and routinely contain all three.
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = typeof value === 'boolean' ? String(value) : String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCsv(entries: MediaEntry[]): string {
  const header = CSV_COLUMNS.join(',')
  const rows = entries.map((entry) =>
    CSV_COLUMNS.map((column) => csvEscape(entry[column])).join(','),
  )
  return [header, ...rows].join('\r\n')
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)

    const query = getQuery(event)

    const andFilters: Prisma.MediaEntryWhereInput[] = []

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

    const search = typeof query.search === 'string' ? query.search.trim() : ''
    if (search) {
      andFilters.push({
        OR: [{ title: { contains: search } }, { author: { contains: search } }],
      })
    }

    const sort = SORT_MODES.includes(query.sort as SortMode)
      ? (query.sort as SortMode)
      : 'date_desc'

    const where = andFilters.length ? { AND: andFilters } : undefined

    const entries = await prisma.mediaEntry.findMany({
      where,
      orderBy: toOrderBy(sort),
      take: MAX_ROWS,
    })

    const csv = toCsv(entries)
    const filename = `media-watchlist-export-${new Date().toISOString().slice(0, 10)}.csv`

    setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
    setHeader(
      event,
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    )

    return csv
  } catch (error) {
    return errorHandler(error)
  }
})
