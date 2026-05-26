// /server/api/art/collection/[id].get.ts
import { defineEventHandler, createError } from 'h3'
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

export default defineEventHandler(async (event) => {
  try {
    const collectionId = Number(event.context.params?.id)

    if (!Number.isInteger(collectionId) || collectionId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid collection ID.',
      })
    }

    const data = await prisma.artCollection.findUnique({
      where: {
        id: collectionId,
      },
      select: artCollectionSelect,
    })

    if (!data) {
      throw createError({
        statusCode: 404,
        message: `Collection with ID ${collectionId} not found.`,
      })
    }

    return {
      success: true,
      data,
      message: 'Art collection loaded.',
    }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
