// /server/api/admin/wonderlab/review-drafts/generate.post.ts
import { createError, defineEventHandler, H3Error, readBody } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { generateWonderLabReviewDraft } from '@/server/utils/wonderLabReviewDraftGenerator'
import {
  positiveReviewDraftId,
  reviewDraftAuthor,
} from '@/utils/wonderlab/reviewDraft'

type GenerateReviewDraftBody = {
  componentId?: unknown
  authorBotId?: unknown
  authorCharacterId?: unknown
  model?: unknown
  regenerate?: unknown
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const body = await readBody<GenerateReviewDraftBody>(event)

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({ statusCode: 400, message: 'Generation payload is required.' })
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
        message: error instanceof Error ? error.message : 'Invalid reviewer identity.',
      })
    }

    if (body.model !== undefined && typeof body.model !== 'string') {
      throw createError({ statusCode: 400, message: 'model must be a string.' })
    }
    if (body.regenerate !== undefined && typeof body.regenerate !== 'boolean') {
      throw createError({ statusCode: 400, message: 'regenerate must be boolean.' })
    }

    const result = await generateWonderLabReviewDraft({
      componentId,
      author,
      actorUserId: auth.user.id,
      model: typeof body.model === 'string' ? body.model : null,
      regenerate: body.regenerate === true,
    })

    event.node.res.statusCode = result.generated ? 201 : 200
    return {
      success: true,
      data: result,
      message: result.generated
        ? result.draft.status === 'FAILED'
          ? 'Review draft generated but held for low confidence.'
          : 'Review draft generated for editorial review.'
        : 'An existing draft was reused. Set regenerate=true to create another attempt.',
    }
  } catch (error) {
    if (error instanceof H3Error) throw error
    const message = error instanceof Error ? error.message : 'Review generation failed.'

    if (/not found/i.test(message)) {
      throw createError({ statusCode: 404, message })
    }
    if (/voice data|confidence|generated review|provider returned|invalid json/i.test(message)) {
      throw createError({ statusCode: 422, message })
    }
    if (/api key|openai review generation failed|empty review draft/i.test(message)) {
      throw createError({ statusCode: 502, message })
    }

    return errorHandler(error)
  }
})
