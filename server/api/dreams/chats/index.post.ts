// /server/api/dreams/chats/index.post.ts
import { defineEventHandler, getQuery, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import { ChatType } from '~/prisma/generated/prisma/client'

type DreamChatPostInput = {
  type?: unknown
  sender?: unknown
  content?: unknown
  botResponse?: unknown
  userId?: unknown
  dreamId?: unknown
  updateDream?: unknown
  currentVibe?: unknown
  currentPrompt?: unknown
  isPublic?: unknown
  isMature?: unknown
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

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmedValue = value.trim()

  return trimmedValue.length ? trimmedValue : undefined
}

function normalizeRequiredString(value: unknown, field: string): string {
  const normalizedValue = normalizeOptionalString(value)

  if (!normalizedValue) {
    throw {
      success: false,
      message: `${field} is required.`,
      statusCode: 400,
    }
  }

  return normalizedValue
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value
  }

  return fallback
}

function normalizeChatType(value: unknown): ChatType {
  if (typeof value === 'string') {
    const match = Object.values(ChatType).find((chatType) => chatType === value)

    if (match) {
      return match
    }
  }

  return ChatType.Dream
}

export default defineEventHandler(async (event) => {
  try {
    const validation = await validateApiKey(event)

    if (!validation.isValid || !validation.user?.id) {
      return errorHandler({
        message: 'Invalid authentication token.',
        statusCode: 401,
      })
    }

    const body = await readBody<DreamChatPostInput>(event)
    const query = getQuery(event)

    const dreamId =
      normalizePositiveInt(query.dreamId) ?? normalizePositiveInt(body.dreamId)

    if (!dreamId) {
      return errorHandler({
        message: 'Invalid Dream ID. It must be a positive integer.',
        statusCode: 400,
      })
    }

    const dream = await prisma.dream.findUnique({
      where: { id: dreamId },
      select: {
        id: true,
        userId: true,
        isPublic: true,
        isMature: true,
      },
    })

    if (!dream) {
      return errorHandler({
        message: `Dream with ID ${dreamId} not found.`,
        statusCode: 404,
      })
    }

    if (dream.userId !== validation.user.id) {
      return errorHandler({
        message: 'You do not have permission to add chats to this Dream.',
        statusCode: 403,
      })
    }

    const content = normalizeRequiredString(body.content, 'content')
    const type = normalizeChatType(body.type)
    const sender = normalizeOptionalString(body.sender) ?? 'Dream'
    const botResponse = normalizeOptionalString(body.botResponse)
    const userId = normalizePositiveInt(body.userId) ?? validation.user.id
    const isPublic = normalizeBoolean(body.isPublic, dream.isPublic)
    const isMature = normalizeBoolean(body.isMature, dream.isMature)
    const updateDream = normalizeBoolean(body.updateDream, false)
    const currentVibe = normalizeOptionalString(body.currentVibe)
    const currentPrompt = normalizeOptionalString(body.currentPrompt)

    const result = await prisma.$transaction(async (tx) => {
      const chat = await tx.chat.create({
        data: {
          type,
          sender,
          content,
          botResponse,
          userId,
          dreamId,
          isPublic,
          isMature,
        },
      })

      if (updateDream) {
        await tx.dream.update({
          where: { id: dreamId },
          data: {
            ...(currentVibe ? { currentVibe } : {}),
            ...(currentPrompt ? { currentPrompt } : {}),
            isPublic,
            isMature,
          },
        })
      }

      return chat
    })

    return {
      success: true,
      message: `Dream chat added to Dream ID ${dreamId} successfully.`,
      data: result,
      statusCode: 201,
    }
  } catch (error) {
    return errorHandler(error)
  }
})
