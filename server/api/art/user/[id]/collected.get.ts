// /server/api/art/user/[id]/collected.get.ts
import { defineEventHandler, createError } from 'h3'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import { errorHandler } from '../../../../utils/error'
import prisma from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const userId = Number(event.context.params?.id)

  try {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid user ID.',
      })
    }

    const collectedArt = await fetchUserCollectedArt(userId)

    return {
      success: true,
      data: {
        collectedArt,
      },
      message: 'Collected art images fetched successfully.',
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      data: {
        collectedArt: [],
      },
      message:
        handled.message ||
        `Failed to fetch collected art images for user ${userId}.`,
    }
  }
})

async function fetchUserCollectedArt(userId: number): Promise<ArtImage[]> {
  const collections = await prisma.artCollection.findMany({
    where: {
      userId,
      isActive: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      ArtImages: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  const imageMap = new Map<number, ArtImage>()

  for (const collection of collections) {
    for (const image of collection.ArtImages) {
      imageMap.set(image.id, image)
    }
  }

  return Array.from(imageMap.values())
}
