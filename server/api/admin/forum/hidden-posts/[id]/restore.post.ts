// /server/api/admin/forum/hidden-posts/[id]/restore.post.ts
//
// rainbow-butterflies/t-031: admin-only restore of a post the health-claim
// flag-escalation threshold auto-hid. Sets isPublic back to true -- the same
// field the escalation function flipped, no new schema. Only acts on a post
// that is actually in the pending-review state (ToForum, isPublic: false,
// isActive: true); already-removed or never-hidden posts 409.
import { createError, defineEventHandler } from 'h3'
import prisma from '../../../../../utils/prisma'
import { errorHandler } from '../../../../../utils/error'
import { requireAdminApiUser } from '../../../../../utils/authGuard'
import { logAdminAction } from '../../../../../utils/audit'

export default defineEventHandler(async (event) => {
  try {
    const { user: admin } = await requireAdminApiUser(event)

    const id = Number(event.context.params?.id)
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid post id.' })
    }

    const post = await prisma.chat.findUnique({
      where: { id },
      select: { id: true, type: true, isPublic: true, isActive: true },
    })

    if (!post || post.type !== 'ToForum') {
      throw createError({ statusCode: 404, message: 'Forum post not found.' })
    }
    if (post.isPublic || !post.isActive) {
      throw createError({
        statusCode: 409,
        message: 'This post is not pending review.',
      })
    }

    const updated = await prisma.chat.update({
      where: { id },
      data: { isPublic: true },
      select: { id: true, isPublic: true, isActive: true, updatedAt: true },
    })

    await logAdminAction(
      admin,
      `Restored forum post #${id}: cleared auto-hide, post is public again.`,
    )

    return {
      success: true,
      message: `Forum post #${id} restored.`,
      statusCode: 200,
      data: updated,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to restore forum post.',
      statusCode: event.node.res.statusCode,
    }
  }
})
