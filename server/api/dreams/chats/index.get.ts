// /server/api/dreams/chats/index.get.ts
import { defineEventHandler, createError, getQuery } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

function requirePositiveId(value: unknown, label: string): number {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createError({
      statusCode: 400,
      message: `Invalid ${label}. It must be a positive integer.`,
    })
  }

  return parsed
}

export default defineEventHandler(async (event) => {
  let dreamId = 0

  try {
    const query = getQuery(event)
    dreamId = requirePositiveId(query.dreamId, 'Dream ID')

    const limit = Math.min(Number(query.limit) || 100, 250)

    const { isValid, user } = await validateApiKey(event)
    const userId = isValid && user ? user.id : null

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
      throw createError({
        statusCode: 404,
        message: `Dream with ID ${dreamId} not found.`,
      })
    }

    if (!dream.isPublic && dream.userId !== userId && user?.Role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'You are not authorized to view this dream chat.',
      })
    }

    const data = await prisma.chat.findMany({
      where: {
        dreamId,
        ...(dream.isPublic ? { isPublic: true } : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      include: {
        User: {
          select: {
            id: true,
            username: true,
            avatarImage: true,
          },
        },
        Bot: true,
        Character: true,
        Prompt: true,
        ArtImage: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            createdAt: true,
            updatedAt: true,
            userId: true,
            artId: true,
            galleryId: true,
          },
        },
        Reactions: true,
      },
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Dream chat history fetched successfully.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || `Failed to fetch chats for Dream ${dreamId}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
