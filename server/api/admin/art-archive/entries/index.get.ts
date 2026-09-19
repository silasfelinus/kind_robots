import { createError, defineEventHandler, getQuery } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import {
  ArchiveEntryMatchState,
  ArchiveEntryProcessState,
} from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { viewerShowsMature } from '~/server/utils/contentAccess'

type EntryListQuery = {
  folderCollectionId?: string
  processState?: string
  matchState?: string
  rating?: string
  search?: string
  includeInactive?: string
  page?: string
  pageSize?: string
}

function clampPageSize(raw?: string): number {
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 200) : 50
}

function clampPage(raw?: string): number {
  const parsed = Number(raw)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    if (!viewerShowsMature(auth.user)) {
      throw createError({
        statusCode: 403,
        message: 'Mature-content access is required for Art Archive entries.',
      })
    }

    const query = getQuery<EntryListQuery>(event)
    const where: Prisma.ArchiveEntryWhereInput = {
      isActive: query.includeInactive === 'true' ? undefined : true,
    }

    const folderCollectionId = Number(query.folderCollectionId)
    if (Number.isInteger(folderCollectionId) && folderCollectionId > 0)
      where.folderCollectionId = folderCollectionId
    if (
      query.processState &&
      (Object.values(ArchiveEntryProcessState) as string[]).includes(
        query.processState,
      )
    ) {
      where.processState = query.processState as ArchiveEntryProcessState
    }
    if (
      query.matchState &&
      (Object.values(ArchiveEntryMatchState) as string[]).includes(
        query.matchState,
      )
    ) {
      where.matchState = query.matchState as ArchiveEntryMatchState
    }
    const rating = Number(query.rating)
    if (Number.isInteger(rating) && rating >= 1 && rating <= 5)
      where.rating = rating
    if (query.search?.trim())
      where.relativePath = { contains: query.search.trim() }

    const page = clampPage(query.page)
    const pageSize = clampPageSize(query.pageSize)
    const [total, rows] = await Promise.all([
      prisma.archiveEntry.count({ where }),
      prisma.archiveEntry.findMany({
        where,
        orderBy: { relativePath: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          relativePath: true,
          parentFolder: true,
          contentHash: true,
          fileSize: true,
          fileMtime: true,
          artImageId: true,
          folderCollectionId: true,
          processState: true,
          matchState: true,
          resourceMatchLocked: true,
          rating: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ])

    const imageIds = rows.flatMap((entry) =>
      entry.artImageId ? [entry.artImageId] : [],
    )
    const folderCollectionIds = [
      ...new Set(
        rows.flatMap((entry) =>
          entry.folderCollectionId ? [entry.folderCollectionId] : [],
        ),
      ),
    ]
    const [images, folderCollections] = await Promise.all([
      imageIds.length
        ? prisma.artImage.findMany({
            where: { id: { in: imageIds } },
            select: {
              id: true,
              path: true,
              thumbnailPath: true,
              isMature: true,
              isPublic: true,
              promptString: true,
              negativePrompt: true,
              checkpoint: true,
              sampler: true,
              steps: true,
              seed: true,
              cfg: true,
            },
          })
        : Promise.resolve([]),
      folderCollectionIds.length
        ? prisma.artCollection.findMany({
            where: { id: { in: folderCollectionIds } },
            select: { id: true, slug: true, label: true },
          })
        : Promise.resolve([]),
    ])
    const imagesById = new Map(images.map((image) => [image.id, image]))
    const folderCollectionsById = new Map(
      folderCollections.map((collection) => [collection.id, collection]),
    )
    const entries = rows.map((entry) => {
      const artImage = entry.artImageId
        ? (imagesById.get(entry.artImageId) ?? null)
        : null
      return {
        ...entry,
        imagePath: artImage?.path ?? null,
        thumbnailPath: artImage?.thumbnailPath ?? artImage?.path ?? null,
        isMature: artImage?.isMature ?? false,
        isPublic: artImage?.isPublic ?? true,
        prompt: artImage?.promptString ?? null,
        negativePrompt: artImage?.negativePrompt ?? null,
        checkpoint: artImage?.checkpoint ?? null,
        generationMetadata: artImage
          ? {
              sampler: artImage.sampler ?? null,
              steps: artImage.steps ?? null,
              seed: artImage.seed ?? null,
              cfg: artImage.cfg ?? null,
            }
          : null,
        folderCollection: entry.folderCollectionId
          ? (folderCollectionsById.get(entry.folderCollectionId) ?? null)
          : null,
      }
    })

    return {
      success: true,
      message: `Fetched ${entries.length} of ${total} archive entr${total === 1 ? 'y' : 'ies'}.`,
      data: { entries, page, pageSize, total },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to list Art Archive entries.',
      statusCode,
    }
  }
})
