import { defineEventHandler } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'

const archiveArtSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  fileName: true,
  fileType: true,
  path: true,
  imagePath: true,
  thumbnailPath: true,
  cardPath: true,
  heroPath: true,
  iconPath: true,
  artPrompt: true,
  promptString: true,
  userId: true,
  isPublic: true,
  isMature: true,
} as const

const archiveCollectionSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  label: true,
  description: true,
  imagePath: true,
  isPublic: true,
  isMature: true,
  isActive: true,
  artPrompt: true,
  ArtImages: {
    take: 6,
    orderBy: { createdAt: 'desc' as const },
    select: archiveArtSelect,
  },
} as const

const publicArchiveObjectWhere = {
  isActive: true,
  isPublic: true,
  isMature: false,
} as const

const relatedDreamInclude = {
  PitchSheet: true,
  ArtImage: { select: archiveArtSelect },
  ArtImages: {
    take: 1,
    orderBy: { createdAt: 'desc' as const },
    select: archiveArtSelect,
  },
  ArtCollection: { select: archiveCollectionSelect },
  ArtCollections: {
    take: 1,
    orderBy: { updatedAt: 'desc' as const },
    select: archiveCollectionSelect,
  },
} as const

export default defineEventHandler(async (event) => {
  try {
    const data = await prisma.dream.findMany({
      where: {
        dreamType: 'PITCH',
        isActive: true,
        isPublic: true,
        isMature: false,
        OR: [
          {
            designer: 'dream-cycle',
            PitchSheet: { isNot: null },
          },
          { designer: 'Daily Dream Facet Engine' },
          { slug: { startsWith: 'daily-dream-' } },
        ],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 100,
      include: {
        PitchSheet: true,
        ArtImage: { select: archiveArtSelect },
        ArtImages: {
          take: 6,
          orderBy: { createdAt: 'desc' },
          select: archiveArtSelect,
        },
        ArtCollection: { select: archiveCollectionSelect },
        ArtCollections: {
          take: 3,
          orderBy: { updatedAt: 'desc' },
          select: archiveCollectionSelect,
        },
        Characters: {
          where: publicArchiveObjectWhere,
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        },
        Rewards: {
          where: publicArchiveObjectWhere,
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        },
        Scenarios: {
          where: publicArchiveObjectWhere,
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        },
        Bots: {
          where: publicArchiveObjectWhere,
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        },
        RelationsFrom: {
          where: {
            ToDream: {
              is: publicArchiveObjectWhere,
            },
          },
          include: {
            ToDream: { include: relatedDreamInclude },
          },
        },
        RelationsTo: {
          where: {
            FromDream: {
              is: publicArchiveObjectWhere,
            },
          },
          include: {
            FromDream: { include: relatedDreamInclude },
          },
        },
      },
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Daily Dream archive loaded successfully.',
      data,
      count: data.length,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to load the Daily Dream archive.',
      data: [],
      count: 0,
      statusCode,
    }
  }
})
