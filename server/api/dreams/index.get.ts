// /server/api/dreams/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { Prisma } from '~/prisma/generated/prisma/client'

const dreamInclude = {
  User: {
    select: {
      id: true,
      username: true,
      avatarImage: true,
    },
  },
  Pitch: true,
  Art: true,
  ArtImage: {
    select: {
      id: true,
      fileName: true,
      fileType: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
      artId: true,
      galleryId: true,
    },
  },
  ArtCollection: {
    include: {
      art: {
        take: 12,
        orderBy: { createdAt: 'desc' },
      },
    },
  },
  Gallery: true,
  Scenario: true,
  Tags: true,
  _count: {
    select: {
      Chats: true,
      Reactions: true,
    },
  },
} satisfies Prisma.DreamInclude

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { isValid, user } = await validateApiKey(event)
    const includeUserData = isValid && user && typeof user.id === 'number'

    const showInactive = query.showInactive === 'true'
    const userOnly = query.userOnly === 'true'
    const includeMature = query.includeMature === 'true'
    const collectionId = Number(query.artCollectionId)
    const galleryId = Number(query.galleryId)
    const scenarioId = Number(query.scenarioId)

    const where: Prisma.DreamWhereInput = {
      ...(showInactive ? {} : { isActive: true }),
      ...(includeMature ? {} : { isMature: false }),
      ...(Number.isInteger(collectionId) && collectionId > 0
        ? { artCollectionId: collectionId }
        : {}),
      ...(Number.isInteger(galleryId) && galleryId > 0 ? { galleryId } : {}),
      ...(Number.isInteger(scenarioId) && scenarioId > 0 ? { scenarioId } : {}),
    }

    if (includeUserData && userOnly) {
      where.userId = user.id
    } else if (includeUserData) {
      where.OR = [{ isPublic: true }, { userId: user.id }]
    } else {
      where.isPublic = true
    }

    const data = await prisma.dream.findMany({
      where,
      include: dreamInclude,
      orderBy: { updatedAt: 'desc' },
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: includeUserData
        ? `Dreams retrieved for user ${user.id}.`
        : 'Public dreams retrieved successfully.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to fetch dreams.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
