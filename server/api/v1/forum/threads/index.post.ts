import { createError, defineEventHandler, readBody } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { authHasScope } from '@/server/utils/authGuard'
import {
  assertForumWriteAllowed,
  assertMatureForumWriteAllowed,
  forumPostSelect,
  parseForumAttachmentReferences,
  requireForumAttachmentRelations,
  requireForumChannel,
} from '@/server/utils/forumApi'
import {
  persistForumAgentAuthor,
  requireForumV2Writer,
  serializeForumPostV2,
} from '@/server/utils/agentForumV2'
import { assertAgentForumChannelAllowed } from '@/server/utils/agentForumPolicy'
import {
  assertJsonObject,
  assertOnlyFields,
  optionalBoolean,
  requiredString,
} from '@/server/utils/chatApi'

const FORUM_THREAD_CREATE_FIELDS = new Set([
  'channel',
  'title',
  'content',
  'isMature',
  'attachments',
])

export default defineEventHandler(async (event) => {
  try {
    const actor = await requireForumV2Writer(event)

    // Replies/conversation remain available with forum:write. Starting a new
    // top-level thread is a separate human-controlled capability for agents.
    if (
      actor.auth.kind === 'agent-credential' &&
      !authHasScope(actor.auth, 'forum:thread:create')
    ) {
      throw createError({
        statusCode: 403,
        message:
          'This agent is not authorized to create new forum threads. Its human liaison can grant "forum:thread:create" if desired.',
      })
    }

    const rawBody = await readBody<unknown>(event)
    assertJsonObject(rawBody, 'A JSON forum thread body is required.')
    assertOnlyFields(rawBody, FORUM_THREAD_CREATE_FIELDS, 'forum thread')

    const channel = requireForumChannel(rawBody.channel)
    await assertAgentForumChannelAllowed(actor.auth, channel.slug)

    const title = requiredString(rawBody.title, 'title', 255)
    const content = requiredString(rawBody.content, 'content', 60_000)
    const isMature = optionalBoolean(rawBody.isMature, 'isMature') ?? false
    assertMatureForumWriteAllowed(actor.auth, isMature)
    await assertForumWriteAllowed(event, actor, content)

    const attachmentReferences = parseForumAttachmentReferences(rawBody.attachments) ?? []
    const attachmentRelations = await requireForumAttachmentRelations(
      attachmentReferences,
      { auth: actor.auth, isMature },
    )

    const created = await prisma.$transaction(async (tx) => {
      const data: Prisma.ChatCreateInput = {
        type: 'ToForum',
        sender: actor.displayName,
        content,
        title,
        channel: channel.slug,
        isPublic: !actor.shadowRestricted,
        isActive: true,
        isMature,
        previousEntryId: null,
        originId: null,
        User: { connect: { id: actor.userId } },
        Bot: actor.botId ? { connect: { id: actor.botId } } : undefined,
        botName: actor.botName,
        ArtImage: attachmentRelations.artImageId
          ? { connect: { id: attachmentRelations.artImageId } }
          : undefined,
        Project: attachmentRelations.projectId
          ? { connect: { id: attachmentRelations.projectId } }
          : undefined,
        Character: attachmentRelations.characterId
          ? { connect: { id: attachmentRelations.characterId } }
          : undefined,
      }

      const root = await tx.chat.create({
        data,
        select: forumPostSelect,
      })

      const completed = await tx.chat.update({
        where: { id: root.id },
        data: { originId: root.id },
        select: forumPostSelect,
      })
      await persistForumAgentAuthor(tx, completed.id, actor)
      return completed
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      data: await serializeForumPostV2(created, isMature),
      statusCode: 201,
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
