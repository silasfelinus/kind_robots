// /server/api/art/collection/index.get.ts
import { defineEventHandler } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'

const artImageListSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
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
  isActive: true,
  artPrompt: true,
  serverId: true,
  serverName: true,
  serverUrl: true,
} satisfies Prisma.ArtImageSelect

const artCollectionSelect = {
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
} satisfies Prisma.ArtCollectionSelect

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
      select: artCollectionSelect,
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
