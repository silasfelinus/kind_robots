import { createError, defineEventHandler, getRouterParam } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import {
  assertForumPostManageable,
  forumPostSelect,
  requireForumWriter,
} from '@/server/utils/forumApi'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  try {
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid forum post ID.' })
    }

    const actor = await requireForumWriter(event)
    const post = await prisma.chat.findFirst({
      where: { id, type: 'ToForum' },
      select: forumPostSelect,
    })

    if (!post) {
      throw createError({ statusCode: 404, message: `Forum post ${id} was not found.` })
    }

    assertForumPostManageable(actor.auth, post)

    if (post.isActive) {
      await prisma.chat.update({
        where: { id },
        data: { isActive: false },
        select: { id: true },
      })
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
