// /server/api/dreams/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { H3Event } from 'h3'
import {
  assertDreamAccess,
  getProvidedDreamCode,
  redactDreamAccess,
} from './index'

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

export default defineEventHandler(async (event) => {
  let id = 0

  try {
    id = getDreamId(event)

    const { isValid, user } = await validateApiKey(event)
    const userId = isValid && user ? user.id : null
    const userRole = isValid && user ? user.Role : null
    const providedCode = getProvidedDreamCode(event)

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
        ArtImage: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            imagePath: true,
            path: true,
            artPrompt: true,
            promptString: true,
            userId: true,
            isPublic: true,
            isMature: true,
          },
        },
        ArtCollections: {
          select: {
            id: true,
            label: true,
            description: true,
            isPublic: true,
            isMature: true,
            isActive: true,
            artPrompt: true,
            ArtImages: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 12,
              select: {
                id: true,
                fileName: true,
                fileType: true,
                imagePath: true,
                path: true,
                artPrompt: true,
                promptString: true,
                userId: true,
                isPublic: true,
                isMature: true,
              },
            },
          },
        },
        Characters: {
          select: {
            id: true,
            name: true,
            honorific: true,
            title: true,
            role: true,
            species: true,
            class: true,
            gender: true,
            presentation: true,
            alignment: true,
            genre: true,
            personality: true,
            drive: true,
            backstory: true,
            quirks: true,
            imagePath: true,
            artImageId: true,
            artPrompt: true,
            isPublic: true,
            isMature: true,
            userId: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
        Rewards: {
          select: {
            id: true,
            icon: true,
            text: true,
            power: true,
            collection: true,
            rarity: true,
            label: true,
            userId: true,
            artImageId: true,
            imagePath: true,
            artPrompt: true,
            isPublic: true,
            isMature: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
        Scenarios: {
          select: {
            id: true,
            title: true,
            description: true,
            intros: true,
            userId: true,
            artImageId: true,
            imagePath: true,
            locations: true,
            artPrompt: true,
            genres: true,
            inspirations: true,
            isPublic: true,
            isMature: true,
            isActive: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
        Pitches: {
          select: {
            id: true,
            title: true,
            pitch: true,
            designer: true,
            flavorText: true,
            highlightImage: true,
            PitchType: true,
            artPrompt: true,
            isPublic: true,
            isMature: true,
            isActive: true,
            userId: true,
            artImageId: true,
            description: true,
            examples: true,
            icon: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
        _count: {
          select: {
            Chats: true,
            Reactions: true,
            Characters: true,
            Rewards: true,
            Pitches: true,
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

    const isOwner = data.userId === userId
    const isAdmin = userRole === 'ADMIN'

    assertDreamAccess({
      dream: data,
      userId,
      userRole,
      providedCode,
      action: 'view',
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Dream fetched successfully.',
      data: redactDreamAccess(data, isOwner || isAdmin),
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
