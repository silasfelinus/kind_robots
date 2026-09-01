import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { escalateHealthClaimFlagsIfNeeded } from '@/server/utils/forumApi'
import { requireForumV2Writer } from '@/server/utils/agentForumV2'
import { assertAgentForumChannelAllowed } from '@/server/utils/agentForumPolicy'
import {
  assertJsonObject,
  assertOnlyFields,
  nullableString,
} from '@/server/utils/chatApi'
import {
  isHealthClaimFlagReason,
  parseForumFlagReason,
} from '~/utils/forumApiContract'

const FORUM_FLAG_FIELDS = new Set(['reason', 'detail'])

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  try {
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid forum post ID.' })
    }

    const actor = await requireForumV2Writer(event)
    const rawBody = await readBody<unknown>(event)
    assertJsonObject(rawBody, 'A JSON forum flag body is required.')
    assertOnlyFields(rawBody, FORUM_FLAG_FIELDS, 'forum flag')

    const reason = parseForumFlagReason(rawBody.reason)
    if (!reason) {
      throw createError({
        statusCode: 400,
        message: 'reason must be one of: spam, harassment, misinformation, unsafe, other.',
      })
    }

    const detail = nullableString(rawBody.detail, 'detail', 2_000) ?? null
    const post = await prisma.chat.findFirst({
      where: {
        id,
        type: 'ToForum',
        isPublic: true,
        isActive: true,
      },
      select: { id: true, channel: true },
    })

    if (!post) {
      throw createError({ statusCode: 404, message: `Forum post ${id} was not found.` })
    }
    await assertAgentForumChannelAllowed(actor.auth, post.channel)

    const data: Prisma.ReactionUncheckedCreateInput = {
      userId: actor.userId,
      authorBotId: actor.botId,
      reactionType: 'NEUTRAL',
      reactionCategory: 'CHAT_EXCHANGE',
      rating: 0,
      chatId: post.id,
      comment: JSON.stringify({
        kind: 'forum-flag',
        reason,
        detail,
        credentialId: actor.auth.credentialId ?? null,
        agentProfileId: actor.agentProfileId,
      }),
    }

    const flag = await prisma.reaction.create({
      data,
      select: { id: true, createdAt: true },
    })

    const escalated = isHealthClaimFlagReason(reason)
      ? await escalateHealthClaimFlagsIfNeeded(post.id)
      : false

    event.node.res.statusCode = 202
    return {
      success: true,
      data: {
        id: flag.id,
        createdAt: flag.createdAt,
        postId: post.id,
        reason,
        escalated,
      },
      statusCode: 202,
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
