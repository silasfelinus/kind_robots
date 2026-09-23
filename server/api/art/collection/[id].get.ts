// /server/api/art/collection/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import {
  buildArtCollectionWhere,
  buildArtImageWhere,
  getArtImageAccessContext,
} from '~/server/utils/artImageAccess'
import { attachGalleryArchiveMediaPaths } from '~/server/utils/artGalleryArchiveMedia'

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

function buildArtCollectionSelect(imageWhere: Prisma.ArtImageWhereInput) {
  return {
    id: true,
    createdAt: true,
    updatedAt: true,
    userId: true,
    label: true,
    slug: true,
    parentFolder: true,
    isMature: true,
    isPublic: true,
    isActive: true,
    artPrompt: true,
    description: true,
    username: true,
    ArtImages: {
      where: imageWhere,
      orderBy: {
        id: 'desc',
      },
      select: artImageListSelect,
    },
    _count: {
      select: {
        ArtImages: { where: imageWhere },
      },
    },
  } satisfies Prisma.ArtCollectionSelect
}

export default defineEventHandler(async (event) => {
  try {
    const collectionId = Number(event.context.params?.id)

    if (!Number.isInteger(collectionId) || collectionId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid collection ID.',
      })
    }

    /*
     * `isPublic: true` in the select above asks for the column; it never
     * filtered anything, so this served every collection -- private and mature
     * alike, with every image inside it -- to anyone who guessed an id. The
     * collection and its images now each carry the viewer's own rule, and a
     * collection the viewer may not see is simply not found.
     */
    const access = await getArtImageAccessContext(event)
    const imageWhere = buildArtImageWhere(access)

    const data = await prisma.artCollection.findFirst({
      where: {
        AND: [{ id: collectionId }, buildArtCollectionWhere(access)],
      },
      select: buildArtCollectionSelect(imageWhere),
    })

    if (!data) {
      throw createError({
        statusCode: 404,
        message: `Collection with ID ${collectionId} not found.`,
      })
    }

    attachGalleryArchiveMediaPaths(data.ArtImages, 'medium')

    return {
      success: true,
      data,
      message: 'Art collection loaded.',
    }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
