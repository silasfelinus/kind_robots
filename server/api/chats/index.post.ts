// /server/api/chats/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
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
  optionalPositiveId,
  requiredChatType,
  requiredString,
} from '../../utils/chatApi'
import { chatMutationSelect } from './selects'

const CHAT_CREATE_FIELDS = new Set([
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
  'projectId',
])

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user, kind } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Authorization token is required or invalid.',
      })
    }

    const rawBody = await readBody<unknown>(event)
    assertJsonObject(rawBody, 'A JSON Chat body is required.')
    assertOnlyFields(rawBody, CHAT_CREATE_FIELDS)

    const type = requiredChatType(rawBody.type)
    const sender = requiredString(rawBody.sender, 'sender', 255)
    const content = requiredString(rawBody.content, 'content', 60_000)

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
    const projectId = optionalPositiveId(rawBody.projectId, 'projectId', true)
    const serverId = optionalPositiveId(rawBody.serverId, 'serverId', true)
    const recipientId = optionalPositiveId(
      rawBody.recipientId,
      'recipientId',
      true,
    )

    const canManageAny = userIsAdmin(user) || kind === 'server'

    await assertChatRelationsAccessible({
      values: {
        botId,
        characterId,
        promptId,
        artImageId,
        dreamId,
        projectId,
        serverId,
        recipientId,
      },
      user,
      canManageAny,
    })

    const data: Prisma.ChatCreateInput = {
      type,
      sender,
      content,
      recipient: nullableString(rawBody.recipient, 'recipient', 255) ?? null,
      title: nullableString(rawBody.title, 'title', 255) ?? null,
      isPublic: optionalBoolean(rawBody.isPublic, 'isPublic') ?? true,
      isFavorite:
        optionalBoolean(rawBody.isFavorite, 'isFavorite') ?? false,
      isRead: optionalBoolean(rawBody.isRead, 'isRead') ?? false,
      isMature: optionalBoolean(rawBody.isMature, 'isMature') ?? false,
      isActive: optionalBoolean(rawBody.isActive, 'isActive') ?? true,
      previousEntryId:
        optionalPositiveId(rawBody.previousEntryId, 'previousEntryId', true) ??
        null,
      originId:
        optionalPositiveId(rawBody.originId, 'originId', true) ?? null,
      recipientId: recipientId ?? null,
      botName: nullableString(rawBody.botName, 'botName', 255) ?? null,
      channel: nullableString(rawBody.channel, 'channel', 255) ?? null,
      botResponse:
        nullableString(rawBody.botResponse, 'botResponse', 60_000) ?? null,
      serverName:
        nullableString(rawBody.serverName, 'serverName', 256) ?? null,
      User: {
        connect: { id: user.id },
      },
      Bot: botId ? { connect: { id: botId } } : undefined,
      Character: characterId ? { connect: { id: characterId } } : undefined,
      Prompt: promptId ? { connect: { id: promptId } } : undefined,
      ArtImage: artImageId ? { connect: { id: artImageId } } : undefined,
      Dream: dreamId ? { connect: { id: dreamId } } : undefined,
      Project: projectId ? { connect: { id: projectId } } : undefined,
      Server: serverId ? { connect: { id: serverId } } : undefined,
    }

    const created = await prisma.chat.create({
      data,
      select: chatMutationSelect,
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      data: created,
      message: 'Chat created successfully.',
      statusCode: 201,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      data: null,
      message: message || 'Failed to create Chat.',
      statusCode: event.node.res.statusCode,
    }
  }
})
