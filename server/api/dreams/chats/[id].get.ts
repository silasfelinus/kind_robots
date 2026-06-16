// /server/api/dreams/chats/[id].get.ts
import { defineEventHandler, createError, getHeader, getQuery } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { H3Event } from 'h3'
import type { ChatType, Prisma } from '~/prisma/generated/prisma/client'
import { assertDreamAccess } from '../index'

type DreamChatQuery = {
  limit?: string
  take?: string
  afterId?: string
  type?: string
  includeInactive?: string
  includeMature?: string
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

function normalizePositiveInt(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function normalizeLimit(value: unknown, fallback = 50, max = 100): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback
  return Math.min(parsed, max)
}

function normalizeBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === '1'
}

function normalizeChatType(value: unknown): ChatType | null {
  return typeof value === 'string' && chatTypes.includes(value as ChatType)
    ? (value as ChatType)
    : null
}

function getDreamId(event: H3Event): number {
  const id = normalizePositiveInt(event.context.params?.id)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Invalid Dream ID. It must be a positive integer.',
    })
  }

  return id
}

async function getOptionalUser(event: H3Event) {
  const authorization = getHeader(event, 'authorization')

  if (!authorization?.startsWith('Bearer ')) {
    return {
      userId: null as number | null,
      userRole: null as string | null,
    }
  }

  try {
    const { isValid, user } = await validateApiKey(event)

    return {
      userId: isValid && user ? user.id : null,
      userRole: isValid && user ? user.Role : null,
    }
  } catch {
    return {
      userId: null as number | null,
      userRole: null as string | null,
    }
  }
}

async function loadDreamForChatAccess(
  dreamId: number,
  userId: number | null,
  userRole: string | null,
) {
  const dream = await prisma.dream.findUnique({
    where: { id: dreamId },
    select: {
      id: true,
      userId: true,
      isPublic: true,
      isActive: true,
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
    userId,
    userRole,
    action: 'view',
  })

  return dream
}

export default defineEventHandler(async (event) => {
  try {
    const dreamId = getDreamId(event)
    const query = getQuery<DreamChatQuery>(event)

    const { userId, userRole } = await getOptionalUser(event)
    await loadDreamForChatAccess(dreamId, userId, userRole)

    const take = normalizeLimit(query.limit ?? query.take)
    const afterId = normalizePositiveInt(query.afterId)
    const type = normalizeChatType(query.type)
    const includeInactive = normalizeBoolean(query.includeInactive)
    const includeMature = normalizeBoolean(query.includeMature)

    const where: Prisma.ChatWhereInput = {
      dreamId,
      ...(includeInactive ? {} : { isActive: true }),
      ...(includeMature ? {} : { isMature: false }),
      ...(afterId ? { id: { gt: afterId } } : {}),
      ...(type ? { type } : {}),
    }

    const data = await prisma.chat.findMany({
      where,
      take,
      orderBy: {
        id: 'asc',
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

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Dream chats loaded successfully.',
      data,
      count: data.length,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to load Dream chats.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
