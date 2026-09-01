import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { requireForumWriter } from '@/server/utils/forumApi'
import { setForumUpvote } from '@/server/utils/forumUpvotes'
import { isForumThreadRoot } from '~/utils/forumApiContract'

type UpvoteBody = {
  upvoted?: unknown
}

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid forum thread ID.' })
    }

    const actor = await requireForumWriter(event)
    const body = await readBody<UpvoteBody>(event)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({ statusCode: 400, message: 'An upvote body is required.' })
    }

    const fields = Object.keys(body)
    if (fields.length !== 1 || fields[0] !== 'upvoted' || typeof body.upvoted !== 'boolean') {
      throw createError({
        statusCode: 400,
        message: 'The upvote body must contain only boolean field "upvoted".',
      })
    }

    const thread = await prisma.chat.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        originId: true,
        previousEntryId: true,
        isPublic: true,
        isActive: true,
      },
    })

    if (
      !thread ||
      !thread.isPublic ||
      !thread.isActive ||
      !isForumThreadRoot(thread)
    ) {
      throw createError({ statusCode: 404, message: 'Forum thread not found.' })
    }

    // Shadow-restricted accounts cannot influence public ranking. Removing an
    // existing vote is still honored, while setting one becomes a quiet no-op
    // just like their other forum participation containment.
    const desired = actor.shadowRestricted ? false : body.upvoted
    const stat = await setForumUpvote({
      threadId: id,
      userId: actor.userId,
      upvoted: desired,
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      data: stat,
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
