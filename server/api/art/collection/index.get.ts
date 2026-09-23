// /server/api/art/collection/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
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

function firstQueryValue(value: unknown): string {
  if (Array.isArray(value)) return firstQueryValue(value[0])
  if (value === null || value === undefined) return ''
  return String(value)
}

function queryFlag(value: unknown, fallback: boolean): boolean {
  const normalized = firstQueryValue(value).trim().toLowerCase()
  if (!normalized) return fallback
  return ['1', 'true', 'yes', 'y', 'on'].includes(normalized)
}

function queryPositiveInt(
  value: unknown,
  fallback: number | null,
): number | null {
  const normalized = firstQueryValue(value).trim()
  if (!normalized) return fallback

  const parsed = Number(normalized)
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback
  return parsed
}

function buildArtImagesRelation(
  take: number | null,
  where: Prisma.ArtImageWhereInput,
) {
  return {
    where,
    orderBy: { id: 'desc' },
    ...(take ? { take } : {}),
    select: artImageListSelect,
  } satisfies Prisma.ArtCollection$ArtImagesArgs
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const summaryOnly = queryFlag(query.summary, false)
    const includeImages = queryFlag(query.includeImages, !summaryOnly)
    const imageLimit = queryPositiveInt(
      query.imageLimit,
      summaryOnly ? 1 : null,
    )
    const userId = queryPositiveInt(query.userId, null)
    const collectionId = queryPositiveInt(query.id, null)

    /*
     * `isPublic: true` appears in the select below, which asks for the column
     * and filters nothing -- so this listed every collection, private and
     * mature, with its images, to anyone. Both halves now carry the viewer's
     * rule, and `?userId=` no longer exposes another person's private folders.
     */
    const access = await getArtImageAccessContext(event)
    const imageWhere = buildArtImageWhere(access)

    const artCollectionSelect = {
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
      ...(includeImages
        ? { ArtImages: buildArtImagesRelation(imageLimit, imageWhere) }
        : {}),
      _count: { select: { ArtImages: { where: imageWhere } } },
    } satisfies Prisma.ArtCollectionSelect

    const where: Prisma.ArtCollectionWhereInput = {
      AND: [
        {
          ...(userId ? { userId } : {}),
          ...(collectionId ? { id: collectionId } : {}),
        },
        buildArtCollectionWhere(access),
      ],
    }

    const collections = await prisma.artCollection.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      select: artCollectionSelect,
    })

    for (const collection of collections) {
      if ('ArtImages' in collection) {
        attachGalleryArchiveMediaPaths(collection.ArtImages, 'medium')
      }
    }

    const data = collections.map((collection) => {
      const artImages = 'ArtImages' in collection ? collection.ArtImages : []
      const artImageCount = collection._count.ArtImages
      const previewArtImage = artImages[0] ?? null

      return {
        ...collection,
        artImageCount,
        previewArtImage,
        artImages,
        images: artImages,
        ArtImages: artImages,
      }
    })

    return {
      success: true,
      data,
      message: data.length
        ? 'Art collections loaded.'
        : 'No art collections found.',
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return handled
  }
})
