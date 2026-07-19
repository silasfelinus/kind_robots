// /server/api/chats/[id].patch.ts
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import { userIsAdmin } from '../../utils/authUser'
import {
  assertChatRelationsAccessible,
  assertJsonObject,
  assertOnlyFields,
  nullableString,
  optionalBoolean,
  optionalChatType,
  optionalPositiveId,
  optionalString,
} from '../../utils/chatApi'
import { chatMutationSelect } from './selects'

const CHAT_PATCH_FIELDS = new Set([
  'type',
  'sender',
  'recipient',
  'content',
  'title',
  'isPublic',
  'isFavorite',
  'previousEntryId',
  'originId',
  'botId',
  'recipientId',
  'artImageId',
  'promptId',
  'botName',
  'channel',
  'botResponse',
  'characterId',
  'isRead',
  'isMature',
  'serverId',
  'serverName',
  'dreamId',
  'isActive',
])

function relationUpdate(
  value: number | null | undefined,
): { connect: { id: number } } | { disconnect: true } | undefined {
  if (typeof value === 'undefined') return undefined
  if (value === null) return { disconnect: true }
  return { connect: { id: value } }
}

function hasUpdateData(data: Record<string, unknown>): boolean {
  return Object.values(data).some((value) => value !== undefined)
}

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  try {
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Chat ID. It must be a positive integer.',
      })
    }

    const { isValid, user, kind } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const chat = await prisma.chat.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!chat) {
      throw createError({
        statusCode: 404,
        message: `Chat with ID ${id} not found.`,
      })
    }

    const canManageAny = userIsAdmin(user) || kind === 'server'

    if (chat.userId !== user.id && !canManageAny) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this chat.',
      })
    }

    const rawBody = await readBody<unknown>(event)
    assertJsonObject(rawBody, 'A JSON Chat update body is required.')
    assertOnlyFields(rawBody, CHAT_PATCH_FIELDS)

    if (!Object.keys(rawBody).length) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const botId = optionalPositiveId(rawBody.botId, 'botId', true)
    const characterId = optionalPositiveId(
      rawBody.characterId,
      'characterId',
      true,
    )
    const promptId = optionalPositiveId(rawBody.promptId, 'promptId', true)
    const artImageId = optionalPositiveId(
      rawBody.artImageId,
      'artImageId',
      true,
    )
    const dreamId = optionalPositiveId(rawBody.dreamId, 'dreamId', true)
    const serverId = optionalPositiveId(rawBody.serverId, 'serverId', true)
    const recipientId = optionalPositiveId(
      rawBody.recipientId,
      'recipientId',
      true,
    )

    await assertChatRelationsAccessible({
      values: {
        botId,
        characterId,
        promptId,
        artImageId,
        dreamId,
        serverId,
        recipientId,
      },
      user,
      canManageAny,
    })

    const updateData: Prisma.ChatUpdateInput = {
      type: optionalChatType(rawBody.type),
      sender: optionalString(rawBody.sender, 'sender', 255),
      recipient: nullableString(rawBody.recipient, 'recipient', 255),
      content: optionalString(rawBody.content, 'content', 60_000),
      title: nullableString(rawBody.title, 'title', 255),
      channel: nullableString(rawBody.channel, 'channel', 255),
      botName: nullableString(rawBody.botName, 'botName', 255),
      botResponse: nullableString(rawBody.botResponse, 'botResponse', 60_000),
      serverName: nullableString(rawBody.serverName, 'serverName', 256),
      isPublic: optionalBoolean(rawBody.isPublic, 'isPublic'),
      isFavorite: optionalBoolean(rawBody.isFavorite, 'isFavorite'),
      isRead: optionalBoolean(rawBody.isRead, 'isRead'),
      isMature: optionalBoolean(rawBody.isMature, 'isMature'),
      isActive: optionalBoolean(rawBody.isActive, 'isActive'),
      previousEntryId: optionalPositiveId(
        rawBody.previousEntryId,
        'previousEntryId',
        true,
      ),
      originId: optionalPositiveId(rawBody.originId, 'originId', true),
      recipientId,
      Bot: relationUpdate(botId),
      Character: relationUpdate(characterId),
      Prompt: relationUpdate(promptId),
      ArtImage: relationUpdate(artImageId),
      Dream: relationUpdate(dreamId),
      Server: relationUpdate(serverId),
    }

    if (!hasUpdateData(updateData as Record<string, unknown>)) {
      throw createError({
        statusCode: 400,
        message: 'No valid Chat fields provided for update.',
      })
    }

    const data = await prisma.chat.update({
      where: { id },
      data: updateData,
      select: chatMutationSelect,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `Chat with ID ${id} updated successfully.`,
      data,
      statusCode: 200,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || `Failed to update Chat with ID ${id}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
