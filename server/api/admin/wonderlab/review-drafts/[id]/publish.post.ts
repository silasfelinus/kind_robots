// /server/api/admin/wonderlab/review-drafts/[id]/publish.post.ts
import { createError, defineEventHandler, getRouterParam, H3Error } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { publishReviewDraft } from '@/server/utils/reviewDraftPublisher'
import { positiveReviewDraftId } from '@/utils/wonderlab/reviewDraft'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const id = positiveReviewDraftId(getRouterParam(event, 'id'))
    if (!id) throw createError({ statusCode: 400, message: 'Invalid review draft ID.' })

    const result = await publishReviewDraft(id, auth.user.id)
    event.node.res.statusCode = result.created ? 201 : 200

    return {
      success: true,
      data: result,
      message: result.created
        ? 'Approved review draft published.'
        : 'Approved review draft reconciled with its existing Reaction.',
    }
  } catch (error) {
    if (error instanceof H3Error) throw error
    const message = error instanceof Error ? error.message : 'Failed to publish review draft.'

    if (/not found/i.test(message)) {
      throw createError({ statusCode: 404, message })
    }
    if (/only an approved|no first-party author|no publishable comment/i.test(message)) {
      throw createError({ statusCode: 409, message })
    }

    return errorHandler(error)
  }
})
