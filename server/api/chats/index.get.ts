// /server/api/chats/index.get.ts
import {
  defineEventHandler,
  createError,
  getHeader,
  getQuery,
  type H3Event,
} from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { ChatType, Prisma } from '~/prisma/generated/prisma/client'

type ChatListQuery = {
  take?: string | string[]
  limit?: string | string[]
  skip?: string | string[]
  afterId?: string | string[]
  beforeId?: string | string[]
  type?: string | string[]
  channel?: string | string[]
  userId?: string | string[]
  recipientId?: string | string[]
  botId?: string | string[]
  characterId?: string | string[]
  dreamId?: string | string[]
  promptId?: string | string[]
  artImageId?: string | string[]
  serverId?: string | string[]
  mine?: string | string[]
  userOnly?: string | string[]
  includeInactive?: string | string[]
  showInactive?: string | string[]
  includeMature?: string | string[]
}

type OptionalUser = {
  id: number | null
  role: string | null
  hasBearerToken: boolean
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

function firstQueryValue(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value
}

function normalizePositiveInt(value: unknown): number | null {
  const raw = firstQueryValue(value)
  const parsed = Number(raw)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function normalizeLimit(value: unknown, max = 100): number | undefined {
  const parsed = normalizePositiveInt(value)

  return parsed ? Math.min(parsed, max) : undefined
}

function normalizeBoolean(value: unknown): boolean {
  const raw = firstQueryValue(value)

  return raw === true || raw === 'true' || raw === '1' || raw === 'yes'
}

function normalizeText(value: unknown): string | undefined {
  const raw = firstQueryValue(value)

  if (typeof raw !== 'string') return undefined

  const text = raw.trim()

  return text || undefined
}

function normalizeChatType(value: unknown): ChatType | undefined {
  const raw = normalizeText(value)

  return raw && chatTypes.includes(raw as ChatType)
    ? (raw as ChatType)
    : undefined
}

function isAdmin(role: string | null): boolean {
  return role === 'ADMIN' || role === 'SYSTEM'
}

async function getOptionalUser(event: H3Event): Promise<OptionalUser> {
  const authorization = getHeader(event, 'authorization')
  const hasBearerToken = Boolean(authorization?.startsWith('Bearer '))

  if (!hasBearerToken) {
    return { id: null, role: null, hasBearerToken: false }
  }

  try {
    const { isValid, user } = await validateApiKey(event)

    return {
      id: isValid && user?.id ? user.id : null,
      role: isValid && user?.Role ? user.Role : null,
      hasBearerToken,
    }
  } catch {
    return { id: null, role: null, hasBearerToken }
  }
}

async function assertDreamChatAccess(
  dreamId: number,
  viewer: OptionalUser,
): Promise<void> {
  const dream = await prisma.dream.findUnique({
    where: { id: dreamId },
    select: {
      id: true,
      userId: true,
      isPublic: true,
    },
  })

  if (!dream) {
    throw createError({
      statusCode: 404,
      message: `Dream with ID ${dreamId} not found.`,
    })
  }

  if (dream.isPublic) return
  if (viewer.id && dream.userId === viewer.id) return
  if (isAdmin(viewer.role)) return

  throw createError({
    statusCode: viewer.hasBearerToken ? 403 : 401,
    message: 'You do not have permission to view this Dream chat history.',
  })
}

function addOptionalIdFilter(
  where: Prisma.ChatWhereInput,
  field: keyof Prisma.ChatWhereInput,
  value: unknown,
): void {
  const id = normalizePositiveInt(value)

  if (id) {
    ;(where as Record<string, unknown>)[field as string] = id
  }
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery<ChatListQuery>(event)
    const viewer = await getOptionalUser(event)

    const take = normalizeLimit(query.take ?? query.limit)
    const skip = normalizePositiveInt(query.skip) ?? undefined
    const afterId = normalizePositiveInt(query.afterId)
    const beforeId = normalizePositiveInt(query.beforeId)
    const type = normalizeChatType(query.type)
    const channel = normalizeText(query.channel)
    const includeInactive =
      normalizeBoolean(query.includeInactive) ||
      normalizeBoolean(query.showInactive)
    const includeMature = normalizeBoolean(query.includeMature)
    const mine =
      normalizeBoolean(query.mine) || normalizeBoolean(query.userOnly)

    const where: Prisma.ChatWhereInput = {}

    if (!includeInactive) where.isActive = true
    if (!includeMature) where.isMature = false
    if (type) where.type = type
    if (channel) where.channel = channel

    if (afterId || beforeId) {
      where.id = {
        ...(afterId ? { gt: afterId } : {}),
        ...(beforeId ? { lt: beforeId } : {}),
      }
    }

    const dreamId = normalizePositiveInt(query.dreamId)

    if (dreamId) {
      await assertDreamChatAccess(dreamId, viewer)
      where.dreamId = dreamId
    } else if (mine) {
      if (!viewer.id) {
        throw createError({
          statusCode: 401,
          message: 'Valid authorization token required.',
        })
      }

      where.OR = [{ userId: viewer.id }, { recipientId: viewer.id }]
    } else if (viewer.id) {
      where.OR = [
        { isPublic: true },
        { userId: viewer.id },
        { recipientId: viewer.id },
      ]
    } else {
      where.isPublic = true
    }

    addOptionalIdFilter(where, 'userId', query.userId)
    addOptionalIdFilter(where, 'recipientId', query.recipientId)
    addOptionalIdFilter(where, 'botId', query.botId)
    addOptionalIdFilter(where, 'characterId', query.characterId)
    addOptionalIdFilter(where, 'promptId', query.promptId)
    addOptionalIdFilter(where, 'artImageId', query.artImageId)
    addOptionalIdFilter(where, 'serverId', query.serverId)

    const data = await prisma.chat.findMany({
      where,
      ...(take ? { take } : {}),
      ...(skip ? { skip } : {}),
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
      message: 'Chats loaded successfully.',
      data,
      count: data.length,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)

    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to load chats.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
