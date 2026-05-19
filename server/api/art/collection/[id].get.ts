// /server/api/art/collection/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'

const artImageListSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  galleryId: true,
  userId: true,
  fileName: true,
  fileType: true,
  imagePath: true,
  path: true,
  promptString: true,
  negativePrompt: true,
  checkpoint: true,
  checkpointResourceId: true,
  sampler: true,
  seed: true,
  steps: true,
  cfg: true,
  cfgHalf: true,
  designer: true,
  genres: true,
  isPublic: true,
  isMature: true,
  artId: true,
  pitchId: true,
  promptId: true,
  resourceId: true,
  rewardId: true,
  characterId: true,
  botId: true,
  componentId: true,
  milestoneId: true,
  chatId: true,
  serverId: true,
  serverName: true,
  serverUrl: true,
} as const

const legacyArtListSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  isMature: true,
  isPublic: true,
  isActive: true,
  path: true,
  imagePath: true,
  promptString: true,
  negativePrompt: true,
  checkpoint: true,
  checkpointResourceId: true,
  sampler: true,
  seed: true,
  steps: true,
  cfg: true,
  cfgHalf: true,
  designer: true,
  genres: true,
  galleryId: true,
  promptId: true,
  pitchId: true,
  serverId: true,
  serverName: true,
  serverUrl: true,
  artImageId: true,
} as const

export default defineEventHandler(async (event) => {
  try {
    const collectionId = Number(event.context.params?.id)

    if (!Number.isInteger(collectionId) || collectionId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid collection ID.',
      })
    }

    const collection = await prisma.artCollection.findUnique({
      where: {
        id: collectionId,
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        label: true,
        isMature: true,
        isPublic: true,
        isActive: true,
        artPrompt: true,
        description: true,
        username: true,
        ArtImages: {
          orderBy: {
            id: 'desc',
          },
          select: artImageListSelect,
        },
        _count: {
          select: {
            ArtImages: true,
          },
        },
      },
    })

    if (!collection) {
      throw createError({
        statusCode: 404,
        message: `Collection with ID ${collectionId} not found.`,
      })
    }

    return {
      success: true,
      data: collection,
      message: 'Art collection loaded.',
    }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
