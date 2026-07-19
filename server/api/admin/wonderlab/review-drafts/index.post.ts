// /server/api/admin/wonderlab/review-drafts/index.post.ts
import { createError, defineEventHandler, H3Error, readBody } from 'h3'
import { ReactionType } from '~/prisma/generated/prisma/client'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { createReviewDraft } from '@/server/utils/reviewDraftRepository'
import {
  normalizeReviewDraftRating,
  normalizeReviewDraftText,
  positiveReviewDraftId,
  reviewDraftAuthor,
} from '@/utils/wonderlab/reviewDraft'

type ReviewDraftCreateBody = {
  componentId?: unknown
  authorBotId?: unknown
  authorCharacterId?: unknown
  promptVersion?: unknown
  promptHash?: unknown
  promptPayload?: unknown
  generatedComment?: unknown
  rating?: unknown
  reactionType?: unknown
  generationModel?: unknown
  generationProvider?: unknown
}

function optionalReactionType(value: unknown): ReactionType | null {
  if (value === null || value === undefined || value === '') return null
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
    await requireAdminApiUser(event)
    const body = await readBody<ReviewDraftCreateBody>(event)

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({ statusCode: 400, message: 'Review draft payload is required.' })
    }

    const componentId = positiveReviewDraftId(body.componentId)
    if (!componentId) {
      throw createError({ statusCode: 400, message: 'A valid componentId is required.' })
    }

    let author
    try {
      author = reviewDraftAuthor(body.authorBotId, body.authorCharacterId)
    } catch (error) {
      throw createError({
        statusCode: 400,
        message: error instanceof Error ? error.message : 'Invalid author identity.',
      })
    }

    let promptVersion: string
    let promptHash: string
    let generatedComment: string
    let generationModel: string | null
    let generationProvider: string | null
    try {
      promptVersion = normalizeReviewDraftText(body.promptVersion, {
        required: true,
        maxLength: 64,
      }) as string
      promptHash = normalizeReviewDraftText(body.promptHash, {
        required: true,
        maxLength: 191,
      }) as string
      generatedComment = normalizeReviewDraftText(body.generatedComment, {
        required: true,
        maxLength: 20_000,
      }) as string
      generationModel = normalizeReviewDraftText(body.generationModel, {
        maxLength: 191,
      })
      generationProvider = normalizeReviewDraftText(body.generationProvider, {
        maxLength: 64,
      })
    } catch (error) {
      throw createError({
        statusCode: 400,
        message: error instanceof Error ? error.message : 'Invalid review draft text.',
      })
    }

    if (body.promptPayload !== undefined) {
      try {
        JSON.stringify(body.promptPayload)
      } catch {
        throw createError({ statusCode: 400, message: 'promptPayload must be JSON serializable.' })
      }
    }

    const result = await createReviewDraft({
      componentId,
      author,
      promptVersion,
      promptHash,
      promptPayload: body.promptPayload,
      generatedComment,
      rating: normalizeReviewDraftRating(body.rating),
      reactionType: optionalReactionType(body.reactionType),
      generationModel,
      generationProvider,
    })

    event.node.res.statusCode = result.created ? 201 : 200
    return {
      success: true,
      data: result.draft,
      created: result.created,
      message: result.created
        ? 'Review draft created.'
        : 'The deterministic review draft already exists.',
    }
  } catch (error) {
    if (error instanceof H3Error) throw error
    return errorHandler(error)
  }
})
