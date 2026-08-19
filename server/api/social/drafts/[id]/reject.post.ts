// /server/api/social/drafts/[id]/reject.post.ts
//
// kind-economy/t-025: admin-only rejection of one SocialPostDraft. Sets
// status REJECTED and stamps reviewedBy/reviewedAt -- a terminal state, not
// subject to the volume ceiling (rejecting cannot cause spam).
import { createError, defineEventHandler } from 'h3'
import { requireAdminApiUser } from '../../../../utils/authGuard'
import { errorHandler } from '../../../../utils/error'
import { logAdminAction } from '../../../../utils/audit'
import {
  rejectSocialPostDraft,
  SocialDraftNotFoundError,
  SocialDraftNotPendingError,
} from '../../../../utils/socialPostDraft'

export default defineEventHandler(async (event) => {
  try {
    const { user: admin } = await requireAdminApiUser(event)

    const id = Number(event.context.params?.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid draft id.' })
    }

    const updated = await rejectSocialPostDraft(id, admin.id)

    await logAdminAction(
      admin,
      `Rejected social post draft #${id} (${updated.platform}, source DREAM #${updated.sourceId}).`,
    )

    return {
      success: true,
      message: 'Draft rejected.',
      statusCode: 200,
      data: updated,
    }
  } catch (error: unknown) {
    if (error instanceof SocialDraftNotFoundError) {
      event.node.res.statusCode = 404
      return { success: false, message: error.message, statusCode: 404 }
    }
    if (error instanceof SocialDraftNotPendingError) {
      event.node.res.statusCode = 409
      return { success: false, message: error.message, statusCode: 409 }
    }

    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to reject draft.',
      statusCode: event.node.res.statusCode,
    }
  }
})
