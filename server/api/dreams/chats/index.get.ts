// /server/api/dreams/chats/index.get.ts
import { defineEventHandler, getQuery, setResponseStatus } from 'h3'
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
    const limit = normalizePositiveInt(query.limit)

    if (!dreamId) {
      return fail(
        event,
        400,
        'Invalid Dream ID. It must be a positive integer.',
      )
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
      return fail(event, 404, `Dream with ID ${dreamId} not found.`)
    }

    const validation = await validateApiKey(event)
    const requesterId =
      validation.isValid && validation.user?.id ? validation.user.id : null
    const requesterRole =
      validation.isValid && validation.user?.Role ? validation.user.Role : null

    const canViewDream =
      dream.isPublic ||
      requesterId === dream.userId ||
      requesterRole === 'ADMIN'

    if (!canViewDream) {
      return fail(
        event,
        403,
        'You do not have permission to view this Dream chat history.',
      )
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

    setResponseStatus(event, 200)

    return {
      success: true,
      message: `Dream chat history for Dream ID ${dreamId} retrieved successfully.`,
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
