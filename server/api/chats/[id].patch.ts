// /server/api/chats/[id].patch.ts
import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import type { Chat, ChatType, Prisma } from '~/prisma/generated/prisma/client'

type ChatPatchBody = Partial<Chat>

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

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function asOptionalNullableString(value: unknown): string | null | undefined {
  if (value === null) return null
  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function asOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function asOptionalPositiveInt(value: unknown): number | undefined {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function relationUpdate(
  value: unknown,
): { connect: { id: number } } | { disconnect: true } | undefined {
  if (value === null) return { disconnect: true }

  const id = asOptionalPositiveInt(value)

  return id ? { connect: { id } } : undefined
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

    const isAdmin = user.Role === 'ADMIN' || user.id === 1
    const isServerKey = kind === 'server'
    const isOwner = chat.userId === user.id

    if (!isOwner && !isAdmin && !isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this chat.',
      })
    }

    const body = await readBody<ChatPatchBody>(event)

    if (!body || Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const type =
      typeof body.type === 'string' && allowedChatTypes.includes(body.type)
        ? body.type
        : undefined

    const updateData: Prisma.ChatUpdateInput = {
      type,
      sender: asOptionalString(body.sender),
      recipient: asOptionalNullableString(body.recipient),
      content: asOptionalString(body.content),
      title: asOptionalNullableString(body.title),
      channel: asOptionalNullableString(body.channel),
      botName: asOptionalNullableString(body.botName),
      botResponse: asOptionalNullableString(body.botResponse),
      isPublic: asOptionalBoolean(body.isPublic),
      isFavorite: asOptionalBoolean(body.isFavorite),
      isRead: asOptionalBoolean(body.isRead),
      isMature: asOptionalBoolean(body.isMature),
      isActive: asOptionalBoolean(body.isActive),
      previousEntryId:
        body.previousEntryId === null
          ? null
          : asOptionalPositiveInt(body.previousEntryId),
      originId:
        body.originId === null ? null : asOptionalPositiveInt(body.originId),
      recipientId:
        body.recipientId === null
          ? null
          : asOptionalPositiveInt(body.recipientId),
      Bot: relationUpdate(body.botId),
      Character: relationUpdate(body.characterId),
      Prompt: relationUpdate(body.promptId),
      ArtImage: relationUpdate(body.artImageId),
      Dream: relationUpdate(body.dreamId),
      Server: relationUpdate(body.serverId),
    }

    if (!hasUpdateData(updateData as Record<string, unknown>)) {
      throw createError({
        statusCode: 400,
        message: 'No valid chat fields provided for update.',
      })
    }

    const data = await prisma.chat.update({
      where: { id },
      data: updateData,
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
      message: message || `Failed to update chat with ID ${id}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
