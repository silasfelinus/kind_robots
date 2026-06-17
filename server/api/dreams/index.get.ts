// /server/api/dreams/index.get.ts
import { defineEventHandler, getHeader, getQuery } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { Prisma } from '~/prisma/generated/prisma/client'
import { dreamInclude, parseDreamType } from './index'

type DreamListQuery = {
  take?: string
  skip?: string
  includeMature?: string
  includeInactive?: string
  showInactive?: string
  mine?: string
  userOnly?: string
  search?: string
  dreamType?: string
  artCollectionId?: string
  scenarioId?: string
  characterId?: string
  rewardId?: string
}

function normalizeLimit(value: unknown, fallback = 48, max = 200): number {
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

function normalizePositiveInt(value: unknown): number | null {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery<DreamListQuery>(event)
    const authorization = getHeader(event, 'authorization')

    let userId: number | null = null
    let userRole: string | null = null

    if (authorization?.startsWith('Bearer ')) {
      try {
        const { isValid, user } = await validateApiKey(event)

        if (isValid && user?.id) {
          userId = user.id
          userRole = user.Role ?? null
        }
      } catch {
        userId = null
        userRole = null
      }
    }

    const isAdmin = userRole === 'ADMIN'
    const take = normalizeLimit(query.take)
    const skip = normalizeSkip(query.skip)
    const includeMature = normalizeBoolean(query.includeMature)
    const includeInactive =
      normalizeBoolean(query.includeInactive) ||
      normalizeBoolean(query.showInactive)
    const userOnly =
      normalizeBoolean(query.mine) || normalizeBoolean(query.userOnly)
    const search = typeof query.search === 'string' ? query.search.trim() : ''
    const dreamType = parseDreamType(query.dreamType)
    const artCollectionId = normalizePositiveInt(query.artCollectionId)
    const scenarioId = normalizePositiveInt(query.scenarioId)
    const characterId = normalizePositiveInt(query.characterId)
    const rewardId = normalizePositiveInt(query.rewardId)

    const andFilters: Prisma.DreamWhereInput[] = []

    if (!includeInactive) {
      andFilters.push({ isActive: true })
    }

    if (!includeMature && !isAdmin) {
      andFilters.push({ isMature: false })
    }

    if (userOnly) {
      andFilters.push(userId ? { userId } : { id: -1 })
    } else if (isAdmin) {
      andFilters.push({})
    } else if (userId) {
      andFilters.push({
        OR: [{ isPublic: true }, { userId }],
      })
    } else {
      andFilters.push({ isPublic: true })
    }

    if (dreamType) {
      andFilters.push({ dreamType })
    }

    if (artCollectionId) {
      andFilters.push({ artCollectionId })
    }

    if (scenarioId) {
      andFilters.push({
        Scenarios: {
          some: { id: scenarioId },
        },
      })
    }

    if (characterId) {
      andFilters.push({
        Characters: {
          some: { id: characterId },
        },
      })
    }

    if (rewardId) {
      andFilters.push({
        Rewards: {
          some: { id: rewardId },
        },
      })
    }

    if (search) {
      andFilters.push({
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
          { pitch: { contains: search } },
          { flavorText: { contains: search } },
          { examples: { contains: search } },
          { artPrompt: { contains: search } },
          { designer: { contains: search } },
          {
            Scenarios: {
              some: {
                OR: [
                  { title: { contains: search } },
                  { description: { contains: search } },
                  { locations: { contains: search } },
                  { genres: { contains: search } },
                  { inspirations: { contains: search } },
                  {
                    Characters: {
                      some: {
                        OR: [
                          { name: { contains: search } },
                          { honorific: { contains: search } },
                          { title: { contains: search } },
                          { role: { contains: search } },
                          { species: { contains: search } },
                          { class: { contains: search } },
                          { genre: { contains: search } },
                          { personality: { contains: search } },
                          { backstory: { contains: search } },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
          {
            Characters: {
              some: {
                OR: [
                  { name: { contains: search } },
                  { honorific: { contains: search } },
                  { title: { contains: search } },
                  { role: { contains: search } },
                  { species: { contains: search } },
                  { class: { contains: search } },
                  { genre: { contains: search } },
                  { personality: { contains: search } },
                  { backstory: { contains: search } },
                ],
              },
            },
          },
          {
            Rewards: {
              some: {
                OR: [
                  { name: { contains: search } },
                  { description: { contains: search } },
                  { flavorText: { contains: search } },
                  { effect: { contains: search } },
                  { collection: { contains: search } },
                ],
              },
            },
          },
        ],
      })
    }

    const where: Prisma.DreamWhereInput = {
      AND: andFilters,
    }

    const [dreams, count] = await Promise.all([
      prisma.dream.findMany({
        where,
        take,
        skip,
        orderBy: {
          updatedAt: 'desc',
        },
        include: dreamInclude,
      }),
      prisma.dream.count({ where }),
    ])

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Dreams loaded successfully.',
      data: dreams,
      count,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to load dreams.',
      data: null,
      statusCode,
    }
  }
})
