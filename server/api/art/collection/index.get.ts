// /server/api/art/collection/index.get.ts
import { defineEventHandler } from 'h3'
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

export default defineEventHandler(async () => {
  try {
    const data = await prisma.artCollection.findMany({
      orderBy: [
        {
          updatedAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
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
        art: {
          orderBy: {
            id: 'desc',
          },
          select: legacyArtListSelect,
        },
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

    return {
      success: true,
      data,
      message: data.length
        ? 'Art collections loaded.'
        : 'No art collections found.',
    }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
