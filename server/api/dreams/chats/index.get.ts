// /server/api/dreams/chats/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

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

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const dreamId = normalizePositiveInt(query.dreamId)
    const limit = normalizePositiveInt(query.limit)

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

    const validation = await validateApiKey(event)
    const requesterId =
      validation.isValid && validation.user?.id ? validation.user.id : null

    const canViewDream = dream.isPublic || requesterId === dream.userId

    if (!canViewDream) {
      return errorHandler({
        message: 'You do not have permission to view this Dream chat history.',
        statusCode: 403,
      })
    }

    const chats = await prisma.chat.findMany({
      where: {
        dreamId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit ?? undefined,
    })

    return {
      success: true,
      message: `Dream chat history for Dream ID ${dreamId} retrieved successfully.`,
      data: chats,
      statusCode: 200,
    }
  } catch (error) {
    return errorHandler(error)
  }
})
