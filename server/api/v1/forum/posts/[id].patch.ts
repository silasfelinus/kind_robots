import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { isMaturityRestricted } from '@/server/utils/contentAccess'
import {
  assertForumPostManageable,
  assertMatureForumWriteAllowed,
  forumPostSelect,
  parseForumAttachmentReferences,
  requireForumAttachmentRelations,
  requireForumWriter,
  serializeForumPost,
} from '@/server/utils/forumApi'
import {
  assertJsonObject,
  assertOnlyFields,
  optionalBoolean,
  optionalString,
} from '@/server/utils/chatApi'

const FORUM_POST_PATCH_FIELDS = new Set([
  'content',
  'title',
  'isMature',
  'attachments',
])

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  try {
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid forum post ID.' })
    }

    const actor = await requireForumWriter(event)
    const post = await prisma.chat.findFirst({
      where: { id, type: 'ToForum', isActive: true },
      select: forumPostSelect,
    })

    if (!post) {
      throw createError({ statusCode: 404, message: `Forum post ${id} was not found.` })
    }

    assertForumPostManageable(actor.auth, post)

    const rawBody = await readBody<unknown>(event)
    assertJsonObject(rawBody, 'A JSON forum post update body is required.')
    assertOnlyFields(rawBody, FORUM_POST_PATCH_FIELDS, 'forum post')

    if (!Object.keys(rawBody).length) {
      throw createError({ statusCode: 400, message: 'No forum post changes were provided.' })
    }

    const content = optionalString(rawBody.content, 'content', 60_000)
    const title = optionalString(rawBody.title, 'title', 255)
    const requestedMature = optionalBoolean(rawBody.isMature, 'isMature')

    if (typeof title !== 'undefined' && post.previousEntryId !== null) {
      throw createError({
        statusCode: 400,
        message: 'Only forum thread roots can have a title.',
      })
    }

    let isMature = requestedMature
    if (requestedMature === false && post.previousEntryId !== null) {
      const inherited = await prisma.chat.findMany({
        where: {
          id: {
            in: [post.originId, post.previousEntryId].filter(
              (value): value is number => Boolean(value),
            ),
          },
          type: 'ToForum',
        },
        select: { isMature: true },
      })

      if (inherited.some((entry) => entry.isMature)) isMature = true
    }

    if (typeof isMature !== 'undefined') {
      assertMatureForumWriteAllowed(actor.auth, isMature)
    }

    const effectiveIsMature = isMature ?? post.isMature
    const attachmentReferences = parseForumAttachmentReferences(rawBody.attachments)
    const attachmentRelations = attachmentReferences
      ? await requireForumAttachmentRelations(attachmentReferences, {
          auth: actor.auth,
          isMature: effectiveIsMature,
        })
      : null

    if (attachmentRelations) {
      assertMatureForumWriteAllowed(actor.auth, effectiveIsMature)
    }

    const updateData: Prisma.ChatUpdateInput = {
      content,
      title,
      isMature,
      ...(attachmentRelations
        ? {
            ArtImage: attachmentRelations.artImageId
              ? { connect: { id: attachmentRelations.artImageId } }
              : { disconnect: true },
            Project: attachmentRelations.projectId
              ? { connect: { id: attachmentRelations.projectId } }
              : { disconnect: true },
            Character: attachmentRelations.characterId
              ? { connect: { id: attachmentRelations.characterId } }
              : { disconnect: true },
          }
        : {}),
    }

    if (Object.values(updateData).every((value) => typeof value === 'undefined')) {
      throw createError({ statusCode: 400, message: 'No valid forum post changes were provided.' })
    }

    const updated = await prisma.chat.update({
      where: { id },
      data: updateData,
      select: forumPostSelect,
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      data: serializeForumPost(
        updated,
        effectiveIsMature && !isMaturityRestricted(actor.auth.user),
      ),
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
