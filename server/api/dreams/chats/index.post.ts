// /server/api/dreams/chats/index.post.ts
import { defineEventHandler, readBody, getQuery, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { ChatType, Prisma } from '~/prisma/generated/prisma/client'

type CreateDreamChatBody = {
  type?: ChatType
  sender?: unknown
  title?: unknown
  content?: unknown
  recipient?: unknown
  botResponse?: unknown
  userId?: unknown
  dreamId?: unknown
  promptId?: unknown
  artImageId?: unknown
  previousEntryId?: unknown
  originId?: unknown
  recipientId?: unknown
  botName?: unknown
  channel?: unknown
  updateDream?: unknown
  currentVibe?: unknown
  currentPrompt?: unknown
  isPublic?: unknown
  isFavorite?: unknown
  isRead?: unknown
  isMature?: unknown
}

const allowedDreamChatTypes: ChatType[] = ['Dream', 'BotResponse']

function asNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function asOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function asOptionalPositiveInt(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)

    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed
    }
  }

  return undefined
}

function getDreamIdFromRequest(
  body: CreateDreamChatBody,
  query: Record<string, unknown>,
) {
  const bodyDreamId = asOptionalPositiveInt(body.dreamId)
  const queryDreamId = asOptionalPositiveInt(query.dreamId)

  return bodyDreamId ?? queryDreamId
}

export default defineEventHandler(async (event) => {
  let dreamId: number | undefined

  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<CreateDreamChatBody>(event)
    const query = getQuery(event)

    dreamId = getDreamIdFromRequest(body, query)

    if (!dreamId) {
      throw createError({
        statusCode: 400,
        message: 'Missing or invalid required field: "dreamId".',
      })
    }

    const bodyUserId = asOptionalPositiveInt(body.userId)

    if (bodyUserId && bodyUserId !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'User ID does not match the provided authorization token.',
      })
    }

    const type = body.type ?? 'Dream'
    const content = asNullableString(body.content)

    if (!allowedDreamChatTypes.includes(type)) {
      throw createError({
        statusCode: 400,
        message: 'Missing or invalid required field: "type".',
      })
    }

    if (!content) {
      throw createError({
        statusCode: 400,
        message: 'Missing required field: "content".',
      })
    }

    const dream = await prisma.dream.findUnique({
      where: { id: dreamId },
      select: {
        id: true,
        userId: true,
        isPublic: true,
        isMature: true,
        currentVibe: true,
        currentPrompt: true,
      },
    })

    if (!dream) {
      throw createError({
        statusCode: 404,
        message: `Dream with ID ${dreamId} not found.`,
      })
    }

    if (dream.userId !== user.id && user.Role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to add chats to this Dream.',
      })
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        username: true,
      },
    })

    const sender =
      asNullableString(body.sender) ?? userRecord?.username ?? `User ${user.id}`

    const data: Prisma.ChatUncheckedCreateInput = {
      type,
      sender,
      content,
      title: asNullableString(body.title),
      recipient: asNullableString(body.recipient),
      botResponse: asNullableString(body.botResponse),
      userId: user.id,
      dreamId,
      promptId: asOptionalPositiveInt(body.promptId),
      artImageId: asOptionalPositiveInt(body.artImageId),
      previousEntryId: asOptionalPositiveInt(body.previousEntryId),
      originId: asOptionalPositiveInt(body.originId),
      recipientId: asOptionalPositiveInt(body.recipientId),
      botName: asNullableString(body.botName),
      channel: asNullableString(body.channel) ?? `dream-${dreamId}`,
      isPublic: asOptionalBoolean(body.isPublic) ?? dream.isPublic,
      isFavorite: asOptionalBoolean(body.isFavorite) ?? false,
      isRead: asOptionalBoolean(body.isRead) ?? false,
      isMature: asOptionalBoolean(body.isMature) ?? dream.isMature,
    }

    const created = await prisma.chat.create({ data })

    if (body.updateDream === true) {
      const dreamUpdate: Prisma.DreamUncheckedUpdateInput = {}

      const currentVibe = asNullableString(body.currentVibe)

      if (currentVibe) {
        dreamUpdate.currentVibe = currentVibe
      }

      if (body.currentPrompt !== undefined) {
        dreamUpdate.currentPrompt = asNullableString(body.currentPrompt)
      }

      if (Object.keys(dreamUpdate).length > 0) {
        await prisma.dream.update({
          where: { id: dreamId },
          data: dreamUpdate,
        })
      }
    }

    event.node.res.statusCode = 201

    return {
      success: true,
      data: created,
      message: 'Dream chat created successfully.',
      statusCode: 201,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)

    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      data: null,
      message:
        message ||
        `Failed to create Dream chat${dreamId ? ` for Dream ID ${dreamId}` : ''}.`,
      statusCode: event.node.res.statusCode,
    }
  }
})
