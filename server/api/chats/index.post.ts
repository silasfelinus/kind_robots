// /server/api/chats/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import type { Chat, ChatType, Prisma } from '~/prisma/generated/prisma/client'

type CreateChatBody = Partial<Chat>

const allowedChatTypes: ChatType[] = [
  'ToBot',
  'BotResponse',
  'ToForum',
  'ToUser',
  'ToCharacter',
  'Weirdlandia',
  'Dream',
  'Reward',
  'Story',
  'Scenario',
  'Character',
  'Bot',
]

function asNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function asOptionalPositiveInt(value: unknown): number | undefined {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

async function assertRelatedRecordsExist(options: {
  botId?: number
  characterId?: number
  promptId?: number
  artImageId?: number
  dreamId?: number
  serverId?: number
}) {
  const { botId, characterId, promptId, artImageId, dreamId, serverId } =
    options

  if (botId) {
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      select: { id: true },
    })

    if (!bot) {
      throw createError({
        statusCode: 404,
        message: `Bot ID not found: ${botId}.`,
      })
    }
  }

  if (characterId) {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: { id: true },
    })

    if (!character) {
      throw createError({
        statusCode: 404,
        message: `Character ID not found: ${characterId}.`,
      })
    }
  }

  if (promptId) {
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      select: { id: true },
    })

    if (!prompt) {
      throw createError({
        statusCode: 404,
        message: `Prompt ID not found: ${promptId}.`,
      })
    }
  }

  if (artImageId) {
    const artImage = await prisma.artImage.findUnique({
      where: { id: artImageId },
      select: { id: true },
    })

    if (!artImage) {
      throw createError({
        statusCode: 404,
        message: `ArtImage ID not found: ${artImageId}.`,
      })
    }
  }

  if (dreamId) {
    const dream = await prisma.dream.findUnique({
      where: { id: dreamId },
      select: { id: true },
    })

    if (!dream) {
      throw createError({
        statusCode: 404,
        message: `Dream ID not found: ${dreamId}.`,
      })
    }
  }

  if (serverId) {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { id: true },
    })

    if (!server) {
      throw createError({
        statusCode: 404,
        message: `Server ID not found: ${serverId}.`,
      })
    }
  }
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user, kind } = await validateApiKey(event)

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

    const requestedUserId = asOptionalPositiveInt(body.userId)
    const isAdmin = user.Role === 'ADMIN' || user.id === 1
    const isServerKey = kind === 'server'

    const userId =
      (isAdmin || isServerKey) && requestedUserId ? requestedUserId : user.id

    if (
      requestedUserId &&
      requestedUserId !== user.id &&
      !isAdmin &&
      !isServerKey
    ) {
      throw createError({
        statusCode: 403,
        message: 'User ID does not match the authenticated user.',
      })
    }

    const botId = asOptionalPositiveInt(body.botId)
    const characterId = asOptionalPositiveInt(body.characterId)
    const promptId = asOptionalPositiveInt(body.promptId)
    const artImageId = asOptionalPositiveInt(body.artImageId)
    const dreamId = asOptionalPositiveInt(body.dreamId)
    const serverId = asOptionalPositiveInt(body.serverId)

    await assertRelatedRecordsExist({
      botId,
      characterId,
      promptId,
      artImageId,
      dreamId,
      serverId,
    })

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
      isActive: body.isActive ?? true,
      previousEntryId: asOptionalPositiveInt(body.previousEntryId),
      originId: asOptionalPositiveInt(body.originId),
      recipientId: asOptionalPositiveInt(body.recipientId),
      botName: asNullableString(body.botName),
      channel: asNullableString(body.channel),
      botResponse: asNullableString(body.botResponse),
      User: {
        connect: { id: userId },
      },
      Bot: botId
        ? {
            connect: { id: botId },
          }
        : undefined,
      Character: characterId
        ? {
            connect: { id: characterId },
          }
        : undefined,
      Prompt: promptId
        ? {
            connect: { id: promptId },
          }
        : undefined,
      ArtImage: artImageId
        ? {
            connect: { id: artImageId },
          }
        : undefined,
      Dream: dreamId
        ? {
            connect: { id: dreamId },
          }
        : undefined,
      Server: serverId
        ? {
            connect: { id: serverId },
          }
        : undefined,
    }

    const created = await prisma.chat.create({
      data,
      include: {
        User: {
          select: {
            id: true,
            username: true,
            Role: true,
          },
        },
        Bot: {
          select: {
            id: true,
            name: true,
          },
        },
        Character: {
          select: {
            id: true,
            name: true,
          },
        },
        Prompt: {
          select: {
            id: true,
            prompt: true,
          },
        },
        ArtImage: {
          select: {
            id: true,
            imagePath: true,
            fileName: true,
          },
        },
        Dream: {
          select: {
            id: true,
            title: true,
          },
        },
        Server: {
          select: {
            id: true,
            title: true,
            label: true,
            serverType: true,
          },
        },
      },
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
      message: message || 'Failed to create chat entry due to a server error.',
      statusCode: event.node.res.statusCode,
    }
  }
})
