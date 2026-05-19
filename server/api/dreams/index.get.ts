// /server/api/dreams/index.get.ts
import { defineEventHandler, getHeader, getQuery } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { Prisma } from '~/prisma/generated/prisma/client'
import { redactDreamAccess } from './index'

type DreamListQuery = {
  take?: string
  skip?: string
  includeMature?: string
  includeInactive?: string
  mine?: string
  search?: string
}

function normalizeLimit(value: unknown, fallback = 24, max = 100): number {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) return fallback

  return Math.min(parsed, max)
}

function normalizeSkip(value: unknown): number {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 0) return 0

  return parsed
}

function normalizeBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === '1'
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery<DreamListQuery>(event)
    const authorization = getHeader(event, 'authorization')

    let userId: number | null = null

    if (authorization?.startsWith('Bearer ')) {
      try {
        const { isValid, user } = await validateApiKey(event)

        if (isValid && user?.id) {
          userId = user.id
        }
      } catch {
        userId = null
      }
    }

    const take = normalizeLimit(query.take)
    const skip = normalizeSkip(query.skip)
    const includeMature = normalizeBoolean(query.includeMature)
    const includeInactive = normalizeBoolean(query.includeInactive)
    const mine = normalizeBoolean(query.mine)
    const search = query.search?.trim()

    const publicWhere: Prisma.DreamWhereInput = {
      isPublic: true,
      accessMode: 'OPEN',
      ...(includeInactive ? {} : { isActive: true }),
      ...(includeMature ? {} : { isMature: false }),
    }

    const ownerWhere: Prisma.DreamWhereInput | null =
      userId && mine
        ? {
            userId,
            ...(includeInactive ? {} : { isActive: true }),
            ...(includeMature ? {} : { isMature: false }),
          }
        : null

    const where: Prisma.DreamWhereInput = {
      AND: [
        ownerWhere
          ? {
              OR: [publicWhere, ownerWhere],
            }
          : publicWhere,
        search
          ? {
              OR: [
                {
                  title: {
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
              ],
            }
          : {},
      ],
    }

    const [dreams, count] = await Promise.all([
      prisma.dream.findMany({
        where,
        take,
        skip,
        orderBy: {
          updatedAt: 'desc',
        },
        include: {
          User: {
            select: {
              id: true,
              username: true,
              avatarImage: true,
            },
          },
          ArtImage: {
            select: {
              id: true,
              fileName: true,
              fileType: true,
              imagePath: true,
              path: true,
              artPrompt: true,
              promptString: true,
              createdAt: true,
              updatedAt: true,
              userId: true,
              isPublic: true,
              isMature: true,
            },
          },
          ArtCollection: {
            select: {
              id: true,
              label: true,
              description: true,
              isPublic: true,
              isMature: true,
              isActive: true,
              artPrompt: true,
              ArtImages: {
                take: 12,
                orderBy: {
                  createdAt: 'desc',
                },
                select: {
                  id: true,
                  createdAt: true,
                  updatedAt: true,
                  fileName: true,
                  fileType: true,
                  path: true,
                  promptString: true,
                  imagePath: true,
                  userId: true,
                  isPublic: true,
                  isMature: true,
                },
              },
            },
          },
          Scenarios: true,
          Characters: true,
          Rewards: true,
          Pitches: true,
        },
      }),
      prisma.dream.count({ where }),
    ])

    return {
      success: true,
      message: 'Dreams loaded successfully.',
      data: dreams.map((dream) =>
        redactDreamAccess(dream, dream.userId === userId),
      ),
      count,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to load dreams.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
