import { createError, defineEventHandler, getQuery, getRouterParam } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import {
  forumPostSelect,
  getForumReadContext,
  serializeForumPost,
} from '@/server/utils/forumApi'
import { parseForumBoolean } from '~/utils/forumApiContract'

type ForumPostReadQuery = {
  includeMature?: string | string[]
}

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  try {
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid forum post ID.' })
    }

    const query = getQuery<ForumPostReadQuery>(event)
    const { includeMature } = await getForumReadContext(
      event,
      parseForumBoolean(query.includeMature),
    )

    const post = await prisma.chat.findFirst({
      where: {
        id,
        type: 'ToForum',
        isPublic: true,
        isActive: true,
        ...(includeMature ? {} : { isMature: false }),
      },
      select: forumPostSelect,
    })

    if (!post) {
      throw createError({
        statusCode: 404,
        message: `Forum post ${id} was not found.`,
      })
    }

    event.node.res.statusCode = 200
    return {
      success: true,
      data: serializeForumPost(post, includeMature),
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
