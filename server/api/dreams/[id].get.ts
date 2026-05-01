// /server/api/dreams/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'

function getDreamId(event: any): number {
  const id = Number(event.context.params?.id)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: 'Invalid Dream ID. It must be a positive integer.',
    })
  }

  return id
}
export default defineEventHandler(async (event) => {
  let id = 0

  try {
    id = getDreamId(event)

    const { isValid, user } = await validateApiKey(event)
    const userId = isValid && user ? user.id : null

    const data = await prisma.dream.findUnique({
      where: { id },
      include: {
        User: {
          select: {
            id: true,
            username: true,
            avatarImage: true,
          },
        },
        Pitch: true,
        Art: true,
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
        ArtCollection: {
          include: {
            art: {
              orderBy: { createdAt: 'desc' },
              take: 48,
            },
          },
        },
        Gallery: true,
        Scenario: true,
        Tags: true,
        Reactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        Chats: {
          orderBy: { createdAt: 'asc' },
          take: 100,
          include: {
            User: {
              select: {
                id: true,
                username: true,
                avatarImage: true,
              },
            },
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
        },
      },
    })

    if (!data) {
      throw createError({
        statusCode: 404,
        message: `Dream with ID ${id} not found.`,
      })
    }

    if (!data.isPublic && data.userId !== userId && user?.Role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'You are not authorized to view this dream.',
      })
    }

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Dream fetched successfully.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || `Failed to fetch Dream with ID ${id}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
