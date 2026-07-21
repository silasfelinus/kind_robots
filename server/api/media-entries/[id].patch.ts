// PATCH /api/media-entries/:id
//
// Write route for the Media Watchlist Entry Detail panel (media-watchlist/t-010,
// BROWSE-UX.md §3/§5). Lets the private review editor save a draft, publish it,
// and edit rating/starred. Admin-gated, same convention as the browse/stats
// routes in this directory.
//
// Body (all optional, at least one required):
//   review    string | null   — freeform markdown, max 4000 chars per BROWSE-UX.md §5
//   rating    number | null   — 1-10 scale
//   starred   boolean
//   publish   boolean         — true sets reviewPublic = true (one-way per the
//                                MVP rule: "Publish" only sets the flag, no UI
//                                exposes un-publishing)
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'

const REVIEW_MAX_LENGTH = 4000

type MediaEntryPatchBody = {
  review?: string | null
  rating?: number | null
  starred?: boolean
  publish?: boolean
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)

    const rawId = getRouterParam(event, 'id')
    const id = Number(rawId)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid media entry id.' })
    }

    const existing = await prisma.mediaEntry.findUnique({ where: { id } })
    if (!existing) {
      throw createError({ statusCode: 404, message: 'Media entry not found.' })
    }

    const body = await readBody<MediaEntryPatchBody>(event)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({ statusCode: 400, message: 'Invalid request body.' })
    }

    const data: Record<string, unknown> = {}

    if ('review' in body) {
      const review = body.review
      if (review !== null && typeof review !== 'string') {
        throw createError({
          statusCode: 400,
          message: 'review must be a string or null.',
        })
      }
      if (typeof review === 'string' && review.length > REVIEW_MAX_LENGTH) {
        throw createError({
          statusCode: 400,
          message: `review must be ${REVIEW_MAX_LENGTH} characters or fewer.`,
        })
      }
      data.review = review === '' ? null : review
    }

    if ('rating' in body) {
      const rating = body.rating ?? null
      if (
        rating !== null &&
        (!Number.isInteger(rating) || rating < 1 || rating > 10)
      ) {
        throw createError({
          statusCode: 400,
          message: 'rating must be an integer from 1 to 10, or null.',
        })
      }
      data.rating = rating
    }

    if ('starred' in body) {
      if (typeof body.starred !== 'boolean') {
        throw createError({
          statusCode: 400,
          message: 'starred must be a boolean.',
        })
      }
      data.starred = body.starred
    }

    if (body.publish === true) {
      data.reviewPublic = true
    }

    if (!Object.keys(data).length) {
      throw createError({ statusCode: 400, message: 'No fields to update.' })
    }

    const updated = await prisma.mediaEntry.update({ where: { id }, data })

    return { success: true, data: updated }
  } catch (error) {
    return errorHandler(error)
  }
})
