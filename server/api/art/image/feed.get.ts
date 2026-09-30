// /server/api/art/image/feed.get.ts
//
// The Gallery's image-first feed: newest art first, one page at a time, every
// row carrying one thumbnail url that works whatever stores its pixels. It
// replaces opening the Gallery as ~150 collection tiles that each fetched their
// own count and preview. A collection is an optional filter here, not the way
// in.
import { defineEventHandler, getQuery } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import {
  buildArtImageSelect,
  buildArtImageWhere,
  buildGalleryFilterWhere,
  getArtImageAccessContext,
  readGalleryMaturityFilter,
  readGalleryPrivacyFilter,
  type QueryValue,
} from '~/server/utils/artImageAccess'
import {
  attachGalleryArchiveMediaPaths,
  galleryThumbnailUrl,
} from '~/server/utils/artGalleryArchiveMedia'

const DEFAULT_PAGE_SIZE = 48
const MAX_PAGE_SIZE = 96
const MAX_SEARCH_LENGTH = 120

function readPositiveInt(value: QueryValue): number | null {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number(raw)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function readSearch(value: QueryValue): string {
  const raw = Array.isArray(value) ? value[0] : value
  return String(raw ?? '')
    .trim()
    .slice(0, MAX_SEARCH_LENGTH)
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event) as Record<string, QueryValue>
    const access = await getArtImageAccessContext(event)
    const cursor = readPositiveInt(query.cursor)
    const collectionId = readPositiveInt(query.collectionId)
    const limit = Math.min(
      readPositiveInt(query.limit) ?? DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    )
    const search = readSearch(query.q)

    const clauses: Prisma.ArtImageWhereInput[] = [
      buildArtImageWhere(access),
      ...buildGalleryFilterWhere(
        access,
        readGalleryPrivacyFilter(query.privacy),
        readGalleryMaturityFilter(query.maturity),
      ),
    ]
    if (cursor) clauses.push({ id: { lt: cursor } })
    if (collectionId) {
      clauses.push({ ArtCollections: { some: { id: collectionId } } })
    }
    if (search) {
      const asId = Number(search.replace(/^#/, ''))
      clauses.push({
        OR: [
          { promptString: { contains: search } },
          { fileName: { contains: search } },
          ...(Number.isInteger(asId) && asId > 0 ? [{ id: asId }] : []),
        ],
      })
    }

    const rows = await prisma.artImage.findMany({
      where: { AND: clauses },
      select: buildArtImageSelect({}),
      orderBy: { id: 'desc' },
      take: limit + 1,
    })

    const hasMore = rows.length > limit
    const page = hasMore ? rows.slice(0, limit) : rows
    attachGalleryArchiveMediaPaths(page, 'medium')

    const data = page.map((row) => ({
      ...row,
      thumbnailUrl: galleryThumbnailUrl(row.id),
    }))

    return {
      success: true,
      message: data.length ? 'Art feed page loaded.' : 'No art images found.',
      data: {
        items: data,
        nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
      },
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to load the art feed.',
      data: { items: [], nextCursor: null },
    }
  }
})
