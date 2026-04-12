// /server/api/chats/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { Chat, ChatType, Prisma } from '~/prisma/generated/prisma/client'

type CreateChatBody = Partial<Chat>

const allowedChatTypes: ChatType[] = [
  'ToBot',
  'BotResponse',
  'ToForum',
  'ToUser',
  'ToCharacter',
  'Weirdlandia',
]

function asNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function asOptionalPositiveInt(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    return undefined
  }
  return value
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Authorization token is required or invalid.',
      })
    }

    const body = await readBody<CreateChatBody>(event)

    const type = body.type
    const sender = asNullableString(body.sender)
    const content = asNullableString(body.content)

    if (!type || !allowedChatTypes.includes(type)) {
      throw createError({
        statusCode: 400,
        message: 'Missing or invalid required field: "type".',
      })
    }

    if (!sender || !content) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields: "sender", "content".',
      })
    }

    const data: Prisma.ChatCreateInput = {
      type,
      sender,
      content,
      title: asNullableString(body.title),
      recipient: asNullableString(body.recipient),
      isPublic: body.isPublic ?? true,
      isFavorite: body.isFavorite ?? false,
      isRead: body.isRead ?? false,
      isMature: body.isMature ?? false,
      previousEntryId: asOptionalPositiveInt(body.previousEntryId),
      originId: asOptionalPositiveInt(body.originId),
      recipientId: asOptionalPositiveInt(body.recipientId),
      botName: asNullableString(body.botName),
      channel: asNullableString(body.channel),
      botResponse: asNullableString(body.botResponse),
      User: {
        connect: { id: user.id },
      },
    }

    const botId = asOptionalPositiveInt(body.botId)
    const characterId = asOptionalPositiveInt(body.characterId)
    const promptId = asOptionalPositiveInt(body.promptId)
    const artImageId = asOptionalPositiveInt(body.artImageId)

    if (botId) {
      data.Bot = { connect: { id: botId } }
    }

    if (characterId) {
      data.Character = { connect: { id: characterId } }
    }

    if (promptId) {
      data.Prompt = { connect: { id: promptId } }
    }

    if (artImageId) {
      data.ArtImage = { connect: { id: artImageId } }
    }

    const created = await prisma.chat.create({ data })

    event.node.res.statusCode = 201
    return {
      success: true,
      data: created,
      message: 'Chat created successfully.',
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)

    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      data: null,
      message: message || 'Failed to create chat entry due to a server error.',
    }
  }
})
