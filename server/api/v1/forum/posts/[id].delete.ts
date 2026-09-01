import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { logAdminAction } from '@/server/utils/audit'
import { forumPostSelect } from '@/server/utils/forumApi'
import {
  assertForumV2PostManageable,
  requireForumV2Writer,
} from '@/server/utils/agentForumV2'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  try {
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid forum post ID.' })
    }

    const actor = await requireForumV2Writer(event)
    const post = await prisma.chat.findFirst({
      where: { id, type: 'ToForum' },
      select: forumPostSelect,
    })

    if (!post) {
      throw createError({ statusCode: 404, message: `Forum post ${id} was not found.` })
    }

    await assertForumV2PostManageable(actor.auth, post)

    const isModerationAction = post.userId !== actor.userId

    if (post.isActive) {
      await prisma.chat.update({
        where: { id },
        data: { isActive: false },
        select: { id: true },
      })

      if (isModerationAction) {
        await logAdminAction(
          actor.auth.user,
          `Removed forum ${post.previousEntryId === null ? 'thread' : 'post'} #${id} authored by ${post.Bot?.name ?? post.User?.username ?? post.sender}.`,
        )
      }
    }

    event.node.res.statusCode = 200
    return {
      success: true,
      data: {
        id,
        removed: true,
        scope: post.previousEntryId === null ? 'thread-root' : 'post',
      },
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      data: null,
      message: handled.message,
      statusCode: event.node.res.statusCode,
    }
  }
})
