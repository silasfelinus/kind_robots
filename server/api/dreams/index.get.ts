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
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          path: true,
          promptString: true,
          imagePath: true,
          artImageId: true,
          userId: true,
          isPublic: true,
          isMature: true,
        },
      },
    },
  },
  Gallery: true,
  Scenario: true,
  Characters: {
    select: {
      id: true,
      name: true,
      honorific: true,
      species: true,
      class: true,
      personality: true,
      imagePath: true,
      artImageId: true,
      isPublic: true,
      isMature: true,
      userId: true,
    },
  },
  Rewards: {
    select: {
      id: true,
      label: true,
      icon: true,
      text: true,
      power: true,
      collection: true,
      rarity: true,
      imagePath: true,
      artImageId: true,
      isPublic: true,
      isMature: true,
      userId: true,
    },
  },
  Tags: true,
  _count: {
    select: {
      Chats: true,
      Reactions: true,
      Characters: true,
      Rewards: true,
    },
  },
} satisfies Prisma.DreamInclude

function parseBoolean(value: unknown): boolean {
  return value === true || value === 'true'
}

function parsePositiveInt(value: unknown): number | undefined {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined
  }

  return parsed
}

function parseLimit(value: unknown): number {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 60
  }

  return Math.min(parsed, 100)
}

function parseSearch(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()

  return trimmed.length > 1 ? trimmed : undefined
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { isValid, user } = await validateApiKey(event)
    const includeUserData = isValid && user && typeof user.id === 'number'

    const showInactive = parseBoolean(query.showInactive)
    const userOnly = parseBoolean(query.userOnly)
    const includeMature = parseBoolean(query.includeMature)
    const limit = parseLimit(query.limit)

    const search = parseSearch(query.q || query.search)
    const artCollectionId = parsePositiveInt(query.artCollectionId)
    const galleryId = parsePositiveInt(query.galleryId)
    const scenarioId = parsePositiveInt(query.scenarioId)
    const pitchId = parsePositiveInt(query.pitchId)
    const tagId = parsePositiveInt(query.tagId)
    const characterId = parsePositiveInt(query.characterId)
    const rewardId = parsePositiveInt(query.rewardId)

    const where: Prisma.DreamWhereInput = {
      ...(showInactive ? {} : { isActive: true }),
      ...(includeMature ? {} : { isMature: false }),
      ...(artCollectionId ? { artCollectionId } : {}),
      ...(galleryId ? { galleryId } : {}),
      ...(scenarioId ? { scenarioId } : {}),
      ...(pitchId ? { pitchId } : {}),
      ...(tagId
        ? {
            Tags: {
              some: {
                id: tagId,
              },
            },
          }
        : {}),
      ...(characterId
        ? {
            Characters: {
              some: {
                id: characterId,
              },
            },
          }
        : {}),
      ...(rewardId
        ? {
            Rewards: {
              some: {
                id: rewardId,
              },
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              {
                title: {
                  contains: search,
                },
              },
              {
                slug: {
                  contains: search,
                },
              },
              {
                description: {
                  contains: search,
                },
              },
              {
                currentVibe: {
                  contains: search,
                },
              },
              {
                currentPrompt: {
                  contains: search,
                },
              },
              {
                Tags: {
                  some: {
                    OR: [
                      {
                        label: {
                          contains: search,
                        },
                      },
                      {
                        title: {
                          contains: search,
                        },
                      },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    }

    if (includeUserData && userOnly) {
      where.userId = user.id
    } else if (includeUserData) {
      where.AND = [
        ...(Array.isArray(where.AND)
          ? where.AND
          : where.AND
            ? [where.AND]
            : []),
        {
          OR: [{ isPublic: true }, { userId: user.id }],
        },
      ]
    } else {
      where.isPublic = true
    }

    const data = await prisma.dream.findMany({
      where,
      include: dreamInclude,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: includeUserData
        ? `Dream atlas retrieved for user ${user.id}.`
        : 'Public dream atlas retrieved successfully.',
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
