// /server/api/admin/wonderlab/review-drafts/[id].get.ts
import { createError, defineEventHandler, getRouterParam, H3Error } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { getReviewDraftById } from '@/server/utils/reviewDraftRepository'
import { positiveReviewDraftId } from '@/utils/wonderlab/reviewDraft'

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const id = positiveReviewDraftId(getRouterParam(event, 'id'))
    if (!id) throw createError({ statusCode: 400, message: 'Invalid review draft ID.' })

    const draft = await getReviewDraftById(id)
    if (!draft) throw createError({ statusCode: 404, message: 'Review draft not found.' })

    return { success: true, data: draft }
  } catch (error) {
    if (error instanceof H3Error) throw error
    return errorHandler(error)
  }
})
