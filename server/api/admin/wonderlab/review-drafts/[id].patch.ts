// /server/api/admin/wonderlab/review-drafts/[id].patch.ts
import { createError, defineEventHandler, getRouterParam, H3Error, readBody } from 'h3'
import { ReactionType } from '~/prisma/generated/prisma/client'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { updateReviewDraft } from '@/server/utils/reviewDraftRepository'
import {
  normalizeReviewDraftRating,
  normalizeReviewDraftStatus,
  normalizeReviewDraftText,
  positiveReviewDraftId,
} from '@/utils/wonderlab/reviewDraft'

type ReviewDraftPatchBody = {
  status?: unknown
  editedComment?: unknown
  rating?: unknown
  reactionType?: unknown
  failureReason?: unknown
}

function optionalReactionType(value: unknown): ReactionType | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, message: 'reactionType must be a string.' })
  }

  const normalized = value.trim().toUpperCase() as ReactionType
  if (!Object.values(ReactionType).includes(normalized)) {
    throw createError({ statusCode: 400, message: 'Invalid reactionType.' })
  }
  return normalized
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const id = positiveReviewDraftId(getRouterParam(event, 'id'))
    if (!id) throw createError({ statusCode: 400, message: 'Invalid review draft ID.' })

    const body = await readBody<ReviewDraftPatchBody>(event)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({ statusCode: 400, message: 'Review draft patch is required.' })
    }

    const status = body.status === undefined ? undefined : normalizeReviewDraftStatus(body.status)
    if (body.status !== undefined && !status) {
      throw createError({ statusCode: 400, message: 'Invalid review draft status.' })
    }

    let editedComment: string | null | undefined
    let failureReason: string | null | undefined
    try {
      editedComment =
        body.editedComment === undefined
          ? undefined
          : normalizeReviewDraftText(body.editedComment, { maxLength: 20_000 })
      failureReason =
        body.failureReason === undefined
          ? undefined
          : normalizeReviewDraftText(body.failureReason, { maxLength: 4_000 })
    } catch (error) {
      throw createError({
        statusCode: 400,
        message: error instanceof Error ? error.message : 'Invalid review draft text.',
      })
    }

    if (body.rating !== undefined && !Number.isFinite(Number(body.rating))) {
      throw createError({ statusCode: 400, message: 'rating must be numeric.' })
    }

    const updated = await updateReviewDraft({
      id,
      actorUserId: auth.user.id,
      status: status ?? undefined,
      editedComment,
      rating:
        body.rating === undefined ? undefined : normalizeReviewDraftRating(body.rating),
      reactionType: optionalReactionType(body.reactionType),
      failureReason,
    })

    return { success: true, data: updated, message: 'Review draft updated.' }
  } catch (error) {
    if (error instanceof H3Error) throw error

    const message = error instanceof Error ? error.message : 'Failed to update review draft.'
    if (/not found/i.test(message)) {
      throw createError({ statusCode: 404, message })
    }
    if (/cannot transition|only the controlled publication service/i.test(message)) {
      throw createError({ statusCode: 409, message })
    }

    return errorHandler(error)
  }
})
