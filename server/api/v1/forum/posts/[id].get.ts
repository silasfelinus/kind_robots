import { createError, defineEventHandler, getQuery, getRouterParam } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import {
  forumPostSelect,
  getForumReadContext,
  serializeForumPost,
} from '@/server/utils/forumApi'
import { notInRestricted } from '@/server/utils/restriction'
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
        // No isActive filter here: a removed post still resolves so a
        // direct link (e.g. from a thread's own reply list) renders a
        // "[removed]" tombstone instead of an opaque 404. A restricted
        // author's post, by contrast, should look like it never existed --
        // notInRestricted below still excludes it outright.
        ...(includeMature ? {} : { isMature: false }),
        ...(await notInRestricted('userId')),
      },
      select: forumPostSelect,
    })

    if (!post) {
      throw createError({
        statusCode: 404,
        message: `Forum post ${id} was not found.`,
      })
    }

    // A reply is only browsable through its thread, so it must not outlive
    // that thread's root becoming unreachable (removed, privatized, or its
    // author restricted) -- otherwise a direct link to the reply would keep
    // working via GET by id even though threads/[id].get.ts's
    // requireForumThreadRoot already 404s the same thread when browsed.
    // Mirrors requireForumThreadRoot's own visibility filter exactly.
    // (A thread root's own originId points at itself, so this only fires
    // for genuine replies, not an extra round-trip re-checking the root
    // against its own already-verified state.)
    if (post.originId && post.originId !== post.id) {
      const rootVisible = await prisma.chat.findFirst({
        where: {
          id: post.originId,
          type: 'ToForum',
          isPublic: true,
          isActive: true,
          previousEntryId: null,
          ...(includeMature ? {} : { isMature: false }),
          ...(await notInRestricted('userId')),
        },
        select: { id: true },
      })

      if (!rootVisible) {
        throw createError({
          statusCode: 404,
          message: `Forum post ${id} was not found.`,
        })
      }
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
