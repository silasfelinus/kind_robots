// /server/api/admin/wonderlab/review-drafts/index.get.ts
import { createError, defineEventHandler, getQuery, H3Error } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { listReviewDrafts } from '@/server/utils/reviewDraftRepository'
import {
  normalizeReviewDraftStatus,
  positiveReviewDraftId,
} from '@/utils/wonderlab/reviewDraft'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const query = getQuery(event)

    const status = query.status
      ? normalizeReviewDraftStatus(query.status)
      : null
    if (query.status && !status) {
      throw createError({ statusCode: 400, message: 'Invalid review draft status.' })
    }

    const componentId = query.componentId
      ? positiveReviewDraftId(query.componentId)
      : null
    const authorBotId = query.authorBotId
      ? positiveReviewDraftId(query.authorBotId)
      : null
    const authorCharacterId = query.authorCharacterId
      ? positiveReviewDraftId(query.authorCharacterId)
      : null

    if (query.componentId && !componentId) {
      throw createError({ statusCode: 400, message: 'Invalid componentId.' })
    }
    if (query.authorBotId && !authorBotId) {
      throw createError({ statusCode: 400, message: 'Invalid authorBotId.' })
    }
    if (query.authorCharacterId && !authorCharacterId) {
      throw createError({ statusCode: 400, message: 'Invalid authorCharacterId.' })
    }

    const drafts = await listReviewDrafts({
      status,
      componentId,
      authorBotId,
      authorCharacterId,
      limit: Number(query.limit) || 100,
    })

    return { success: true, data: drafts, count: drafts.length }
  } catch (error) {
    if (error instanceof H3Error) throw error
    return errorHandler(error)
  }
})
