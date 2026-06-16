// /server/api/dreams/chats/index.post.ts
import { defineEventHandler, createError, getQuery, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { ChatType, Prisma } from '~/prisma/generated/prisma/client'
import { assertDreamAccess } from '../index'

type DreamChatBody = {
  dreamId?: number | string | null
  type?: ChatType | string | null
  sender?: string | null
  recipient?: string | null
  content?: string | null
  title?: string | null
  isPublic?: boolean
  isFavorite?: boolean
  previousEntryId?: number | null
  originId?: number | null
  userId?: number | null
  botId?: number | null
  recipientId?: number | null
  artImageId?: number | null
  promptId?: number | null
  botName?: string | null
  channel?: string | null
  botResponse?: string | null
  characterId?: number | null
  isRead?: boolean
  isMature?: boolean
  serverId?: number | null
  serverName?: string | null
  updateDream?: boolean
  description?: string | null
  pitch?: string | null
  flavorText?: string | null
  examples?: string | null
  artPrompt?: string | null
  imagePath?: string | null
  highlightImage?: string | null
  icon?: string | null
}

type DreamChatQuery = {
  dreamId?: string
  id?: string
}

const chatTypes: ChatType[] = [
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

function normalizePositiveInt(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function normalizeNullableId(value: unknown): number | null | undefined {
  if (value === null) return null
  if (value === undefined || value === '') return undefined

  return normalizePositiveInt(value)
}

function normalizeChatType(value: unknown): ChatType {
  return typeof value === 'string' && chatTypes.includes(value as ChatType)
    ? (value as ChatType)
    : 'Dream'
}

function normalizeOptionalText(value: unknown): string | null | undefined {
  if (value === null) return null
  if (value === undefined) return undefined
  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()
  return trimmed || null
}

function cleanRequiredText(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({
      statusCode: 400,
      message: `The "${fieldName}" field is required.`,
    })
  }

  return value.trim()
}

function relationValue(value: unknown): number | undefined {
  return normalizePositiveInt(value)
}

function buildDreamUpdate(body: DreamChatBody): Prisma.DreamUpdateInput {
  const data: Prisma.DreamUpdateInput = {}

  if (body.description !== undefined) {
    data.description = normalizeOptionalText(body.description)
  }

  if (body.pitch !== undefined) {
    data.pitch = normalizeOptionalText(body.pitch)
  }

  if (body.flavorText !== undefined) {
    data.flavorText = normalizeOptionalText(body.flavorText)
  }

  if (body.examples !== undefined) {
    data.examples = normalizeOptionalText(body.examples)
  }

  if (body.artPrompt !== undefined) {
    data.artPrompt = normalizeOptionalText(body.artPrompt)
  }

  if (body.imagePath !== undefined) {
    data.imagePath = normalizeOptionalText(body.imagePath)
  }

  if (body.highlightImage !== undefined) {
    data.highlightImage = normalizeOptionalText(body.highlightImage)
  }

  if (body.icon !== undefined) {
    data.icon = normalizeOptionalText(body.icon)
  }

  return data
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<DreamChatBody>(event)
    const query = getQuery<DreamChatQuery>(event)
    const dreamId =
      normalizePositiveInt(body?.dreamId) ??
      normalizePositiveInt(query.dreamId) ??
      normalizePositiveInt(query.id)

    if (!dreamId) {
      throw createError({
        statusCode: 400,
        message: 'A valid dreamId is required.',
      })
    }

    const content = cleanRequiredText(body?.content, 'content')

    const dream = await prisma.dream.findUnique({
      where: { id: dreamId },
      select: {
        id: true,
        title: true,
        userId: true,
        artImageId: true,
        isPublic: true,
        isMature: true,
      },
    })

    if (!dream) {
      throw createError({
        statusCode: 404,
        message: `Dream with ID ${dreamId} not found.`,
      })
    }

    assertDreamAccess({
      dream,
      userId: user.id,
      userRole: user.Role,
      action: 'chat',
    })

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { username: true },
    })

    const sender = normalizeOptionalText(body.sender) || userRecord?.username || `User ${user.id}`
    const type = normalizeChatType(body.type)
    const artImageId = relationValue(body.artImageId) ?? dream.artImageId ?? undefined
    const dreamUpdate = body.updateDream ? buildDreamUpdate(body) : {}

    const data = await prisma.$transaction(async (tx) => {
      if (body.updateDream && Object.keys(dreamUpdate).length) {
        await tx.dream.update({
          where: { id: dreamId },
          data: dreamUpdate,
        })
      }

      return tx.chat.create({
        data: {
          type,
          sender,
          recipient: normalizeOptionalText(body.recipient),
          content,
          title: normalizeOptionalText(body.title) ?? dream.title,
          isPublic: body.isPublic ?? dream.isPublic,
          isFavorite: body.isFavorite ?? false,
          previousEntryId: normalizeNullableId(body.previousEntryId) ?? undefined,
          originId: normalizeNullableId(body.originId) ?? undefined,
          userId: user.id,
          botId: normalizeNullableId(body.botId) ?? undefined,
          recipientId: normalizeNullableId(body.recipientId) ?? undefined,
          artImageId,
          promptId: normalizeNullableId(body.promptId) ?? undefined,
          botName: normalizeOptionalText(body.botName),
          channel: normalizeOptionalText(body.channel) ?? `dream-${dreamId}`,
          botResponse: normalizeOptionalText(body.botResponse),
          characterId: normalizeNullableId(body.characterId) ?? undefined,
          isRead: body.isRead ?? false,
          isMature: body.isMature ?? dream.isMature,
          dreamId,
          serverId: normalizeNullableId(body.serverId) ?? undefined,
          serverName: normalizeOptionalText(body.serverName),
        },
        include: {
          User: {
            select: {
              id: true,
              username: true,
              avatarImage: true,
            },
          },
          ArtImage: {
            select: {
              id: true,
              imagePath: true,
              fileName: true,
              thumbnailData: true,
            },
          },
        },
      })
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'Dream chat created successfully.',
      data,
      statusCode: 201,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to create Dream chat.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
