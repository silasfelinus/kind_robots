// /server/api/dreams/chats/index.get.ts
import { defineEventHandler, getQuery, setResponseStatus } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { ChatType, Prisma } from '~/prisma/generated/prisma/client'
import { assertDreamAccess, getProvidedDreamCode } from '../index'

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

const allowedDreamChatTypes: ChatType[] = [
  'Dream',
  'BotResponse',
  'ToBot',
  'ToCharacter',
  'Scenario',
  'Reward',
  'Story',
]

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

function fail(
  event: Parameters<typeof setResponseStatus>[0],
  statusCode: number,
  message: string,
) {
  setResponseStatus(event, statusCode)

  return {
    success: false,
    message,
    data: null,
    statusCode,
  }
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const dreamId = normalizePositiveInt(query.dreamId)
    const limit = normalizeLimit(query.limit)
    const beforeId = normalizePositiveInt(query.beforeId)
    const afterId = normalizePositiveInt(query.afterId)
    const characterId = normalizePositiveInt(query.characterId)
    const botId = normalizePositiveInt(query.botId)
    const type = normalizeChatType(query.type)
    const includeMature = normalizeBoolean(query.includeMature)
    const providedCode = getProvidedDreamCode(event)

    if (!dreamId) {
      return fail(
        event,
        400,
        'Invalid Dream ID. It must be a positive integer.',
      )
    }

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
        accessMode: true,
        privacyCode: true,
      },
    })

    if (!dream) {
      return fail(event, 404, `Dream with ID ${dreamId} not found.`)
    }

    const isOwner = requesterId === dream.userId
    const isAdmin = requesterRole === 'ADMIN'

    assertDreamAccess({
      dream,
      userId: requesterId,
      userRole: requesterRole,
      providedCode,
      action: 'view',
    })

    if (dream.isMature && !includeMature && !isOwner && !isAdmin) {
      return fail(
        event,
        403,
        'This Dream is marked mature and cannot be viewed with the current filters.',
      )
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
      message: handled.message || 'Failed to fetch Dream chat history.',
      data: null,
      statusCode,
    }
  }
})
