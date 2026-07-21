// /server/api/admin/wonderlab/review-drafts/[id]/revise.patch.ts
import { createError, defineEventHandler, getRouterParam, H3Error, readBody } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { revisePublishedReview } from '@/server/utils/publishedReviewRevision'
import {
  normalizeReviewDraftText,
  positiveReviewDraftId,
  type ReviewDraftAuthorKind,
} from '@/utils/wonderlab/reviewDraft'

type PublishedReviewRevisionBody = {
  editedComment?: unknown
  expectedComponentId?: unknown
  expectedReactionId?: unknown
  expectedAuthorKind?: unknown
  expectedAuthorId?: unknown
  expectedCurrentCommentHash?: unknown
}

function expectedAuthorKind(value: unknown): ReviewDraftAuthorKind {
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, message: 'expectedAuthorKind is required.' })
  }
  const kind = value.trim().toUpperCase()
  if (kind !== 'BOT' && kind !== 'CHARACTER') {
    throw createError({ statusCode: 400, message: 'expectedAuthorKind must be BOT or CHARACTER.' })
  }
  return kind
}

function expectedCommentHash(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/i.test(value.trim())) {
    throw createError({
      statusCode: 400,
      message: 'expectedCurrentCommentHash must be a SHA-256 hex digest.',
    })
  }
  return value.trim().toLowerCase()
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const draftId = positiveReviewDraftId(getRouterParam(event, 'id'))
    if (!draftId) throw createError({ statusCode: 400, message: 'Invalid review draft ID.' })

    const body = await readBody<PublishedReviewRevisionBody>(event)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({ statusCode: 400, message: 'Published review revision body is required.' })
    }

    let editedComment: string | null
    try {
      editedComment = normalizeReviewDraftText(body.editedComment, {
        required: true,
        maxLength: 20_000,
      })
    } catch (error) {
      throw createError({
        statusCode: 400,
        message: error instanceof Error ? error.message : 'Invalid revised review text.',
      })
    }

    const expectedComponentId = positiveReviewDraftId(body.expectedComponentId)
    const expectedReactionId = positiveReviewDraftId(body.expectedReactionId)
    const expectedAuthorId = positiveReviewDraftId(body.expectedAuthorId)
    if (!expectedComponentId || !expectedReactionId || !expectedAuthorId) {
      throw createError({
        statusCode: 400,
        message: 'Expected Component, Reaction, and author IDs must be positive integers.',
      })
    }

    const result = await revisePublishedReview({
      draftId,
      editedComment: editedComment as string,
      expectedComponentId,
      expectedReactionId,
      expectedAuthor: {
        kind: expectedAuthorKind(body.expectedAuthorKind),
        id: expectedAuthorId,
      },
      expectedCurrentCommentHash: expectedCommentHash(body.expectedCurrentCommentHash),
    })

    return {
      success: true,
      data: result,
      message: 'Published review commentary revised without changing its assignment.',
    }
  } catch (error) {
    if (error instanceof H3Error) throw error

    const message = error instanceof Error ? error.message : 'Failed to revise published review.'
    if (/not found|no longer exists/i.test(message)) {
      throw createError({ statusCode: 404, message })
    }
    if (
      /only a published|missing publisher|lock|linkage|changed after|no first-party author/i.test(
        message,
      )
    ) {
      throw createError({ statusCode: 409, message })
    }

    return errorHandler(error)
  }
})
