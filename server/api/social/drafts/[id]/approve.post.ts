// /server/api/social/drafts/[id]/approve.post.ts
//
// kind-economy/t-025: admin-only approval of one SocialPostDraft. Sets
// status APPROVED and stamps reviewedBy/reviewedAt -- that is the terminal
// state this task's code can ever reach. There is no "posted" state and no
// call to any external platform API triggered by this route, now or via any
// downstream job: approving here queues nothing further. The daily volume
// ceiling (server/utils/socialPostDraft.ts) is enforced server-side, not
// just hinted at in the UI -- exceeding it returns 429, not a warning.
import { createError, defineEventHandler } from 'h3'
import { requireAdminApiUser } from '../../../../utils/authGuard'
import { errorHandler } from '../../../../utils/error'
import { logAdminAction } from '../../../../utils/audit'
import {
  approveSocialPostDraft,
  SocialDraftCeilingError,
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

    const updated = await approveSocialPostDraft(id, admin.id)

    await logAdminAction(
      admin,
      `Approved social post draft #${id} (${updated.platform}, source DREAM #${updated.sourceId}).`,
    )

    return {
      success: true,
      message:
        'Draft approved. Nothing was posted -- posting is out of scope for this pipeline.',
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
    if (error instanceof SocialDraftCeilingError) {
      event.node.res.statusCode = 429
      return { success: false, message: error.message, statusCode: 429 }
    }

    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to approve draft.',
      statusCode: event.node.res.statusCode,
    }
  }
})
