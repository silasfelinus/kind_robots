// /server/api/dreams/chats/[id].get.ts
import {
  defineEventHandler,
  createError,
  getQuery,
  setResponseStatus,
} from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { ChatType, Prisma } from '~/prisma/generated/prisma/client'
import type { H3Event } from 'h3'

const allowedDreamChatTypes: ChatType[] = [
  'Dream',
  'BotResponse',
  'ToBot',
  'ToCharacter',
  'Scenario',
  'Reward',
  'Story',
]

const userSelect = {
  id: true,
  username: true,
  avatarImage: true,
} satisfies Prisma.UserSelect

const artImageSelect = {
  id: true,
  fileName: true,
  fileType: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  artId: true,
  galleryId: true,
} satisfies Prisma.ArtImageSelect

function getDreamId(event: H3Event): number {
  const id = Number(event.context.params?.id)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: 'Invalid Dream ID. It must be a positive integer.',
    })
  }

  return id
}

function normalizePositiveInt(value: unknown): number | null {
  const rawValue = Array.isArray(value) ? value[0] : value
  const parsedValue =
    typeof rawValue === 'string' || typeof rawValue === 'number'
      ? Number(rawValue)
      : NaN

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return null
  }

  return parsedValue
}

function normalizeLimit(value: unknown): number {
  const parsed = normalizePositiveInt(value)

  if (!parsed) return 100

  return Math.min(parsed, 200)
}

function normalizeBoolean(value: unknown): boolean {
  const rawValue = Array.isArray(value) ? value[0] : value

  return rawValue === true || rawValue === 'true'
}

function normalizeChatType(value: unknown): ChatType | null {
  const rawValue = Array.isArray(value) ? value[0] : value

  if (typeof rawValue !== 'string') return null

  return allowedDreamChatTypes.includes(rawValue as ChatType)
    ? (rawValue as ChatType)
    : null
}

export default defineEventHandler(async (event) => {
  let dreamId = 0

  try {
    dreamId = getDreamId(event)

    const query = getQuery(event)
    const limit = normalizeLimit(query.limit)
    const beforeId = normalizePositiveInt(query.beforeId)
    const afterId = normalizePositiveInt(query.afterId)
    const characterId = normalizePositiveInt(query.characterId)
    const botId = normalizePositiveInt(query.botId)
    const type = normalizeChatType(query.type)
    const includeMature = normalizeBoolean(query.includeMature)

    const validation = await validateApiKey(event)
    const requesterId =
      validation.isValid && validation.user?.id ? validation.user.id : null
    const requesterRole =
      validation.isValid && validation.user?.Role ? validation.user.Role : null

    const dream = await prisma.dream.findUnique({
      where: { id: dreamId },
      select: {
        id: true,
        title: true,
        userId: true,
        isPublic: true,
        isMature: true,
        isActive: true,
      },
    })

    if (!dream) {
      throw createError({
        statusCode: 404,
        message: `Dream with ID ${dreamId} not found.`,
      })
    }

    const isOwner = requesterId === dream.userId
    const isAdmin = requesterRole === 'ADMIN'
    const canViewDream = dream.isPublic || isOwner || isAdmin

    if (!canViewDream) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to view this Dream chat history.',
      })
    }

    if (dream.isMature && !includeMature && !isOwner && !isAdmin) {
      throw createError({
        statusCode: 403,
        message:
          'This Dream is marked mature and cannot be viewed with the current filters.',
      })
    }

    const where: Prisma.ChatWhereInput = {
      dreamId,
      ...(includeMature || isOwner || isAdmin ? {} : { isMature: false }),
      ...(beforeId ? { id: { lt: beforeId } } : {}),
      ...(afterId ? { id: { gt: afterId } } : {}),
      ...(characterId ? { characterId } : {}),
      ...(botId ? { botId } : {}),
      ...(type ? { type } : {}),
    }

    const chats = await prisma.chat.findMany({
      where,
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
      include: {
        User: {
          select: userSelect,
        },
        Bot: {
          select: {
            id: true,
            name: true,
            subtitle: true,
            avatarImage: true,
            personality: true,
            isPublic: true,
            isMature: true,
            userId: true,
          },
        },
        Character: {
          select: {
            id: true,
            name: true,
            honorific: true,
            species: true,
            class: true,
            personality: true,
            imagePath: true,
            artImageId: true,
            isPublic: true,
            isMature: true,
            userId: true,
          },
        },
        Prompt: true,
        ArtImage: {
          select: artImageSelect,
        },
        Reactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 12,
          include: {
            User: {
              select: userSelect,
            },
          },
        },
      },
    })

    setResponseStatus(event, 200)

    return {
      success: true,
      message: `Dream chat history for "${dream.title}" retrieved successfully.`,
      data: chats,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    setResponseStatus(event, statusCode)

    return {
      success: false,
      message:
        handled.message ||
        `Failed to fetch Dream chat history for Dream ID ${dreamId}.`,
      data: null,
      statusCode,
    }
  }
})
