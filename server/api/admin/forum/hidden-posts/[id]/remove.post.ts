// /server/api/admin/forum/hidden-posts/[id]/remove.post.ts
//
// rainbow-butterflies/t-031: admin-only confirmation that an auto-hidden
// post should stay hidden. Sets isActive: false (the existing soft-delete
// field) rather than deleting the row, so the audit trail and any
// reply/reaction relations stay intact. Terminal: an already-removed or
// never-hidden post 409s the same as restore.post.ts.
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
      data: { isActive: false },
      select: { id: true, isPublic: true, isActive: true, updatedAt: true },
    })

    await logAdminAction(
      admin,
      `Removed forum post #${id}: confirmed removal after health-claim flag escalation.`,
    )

    return {
      success: true,
      message: `Forum post #${id} removed.`,
      statusCode: 200,
      data: updated,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to remove forum post.',
      statusCode: event.node.res.statusCode,
    }
  }
})
