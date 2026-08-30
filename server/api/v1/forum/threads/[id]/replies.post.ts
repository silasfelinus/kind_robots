import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import {
  assertMatureForumWriteAllowed,
  forumPostSelect,
  parseForumAttachmentReferences,
  requireForumAttachmentRelations,
  requireForumReplyParent,
  requireForumThreadRoot,
  requireForumWriter,
  serializeForumPost,
} from '@/server/utils/forumApi'
import {
  assertJsonObject,
  assertOnlyFields,
  optionalBoolean,
  optionalPositiveId,
  requiredString,
} from '@/server/utils/chatApi'

const FORUM_REPLY_CREATE_FIELDS = new Set([
  'content',
  'parentId',
  'isMature',
  'attachments',
])

export default defineEventHandler(async (event) => {
  const threadId = Number(getRouterParam(event, 'id'))

  try {
    if (!Number.isInteger(threadId) || threadId <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid forum thread ID.' })
    }

    const actor = await requireForumWriter(event)
    const rawBody = await readBody<unknown>(event)
    assertJsonObject(rawBody, 'A JSON forum reply body is required.')
    assertOnlyFields(rawBody, FORUM_REPLY_CREATE_FIELDS, 'forum reply')

    const content = requiredString(rawBody.content, 'content', 60_000)
    const requestedMature = optionalBoolean(rawBody.isMature, 'isMature') ?? false
    const requestedParentId = optionalPositiveId(rawBody.parentId, 'parentId')
    const thread = await requireForumThreadRoot(threadId, true)
    assertMatureForumWriteAllowed(actor.auth, thread.isMature)

    const parent = requestedParentId
      ? await requireForumReplyParent(threadId, requestedParentId)
      : thread

    const isMature = thread.isMature || parent.isMature || requestedMature
    assertMatureForumWriteAllowed(actor.auth, isMature)

    const attachmentReferences = parseForumAttachmentReferences(rawBody.attachments) ?? []
    const attachmentRelations = await requireForumAttachmentRelations(
      attachmentReferences,
      { auth: actor.auth, isMature },
    )

    const data: Prisma.ChatCreateInput = {
      type: 'ToForum',
      sender: actor.displayName,
      content,
      title: null,
      channel: thread.channel,
      isPublic: true,
      isActive: true,
      isMature,
      originId: thread.id,
      previousEntryId: parent.id,
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

    const created = await prisma.chat.create({
      data,
      select: forumPostSelect,
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      data: serializeForumPost(created, isMature),
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
