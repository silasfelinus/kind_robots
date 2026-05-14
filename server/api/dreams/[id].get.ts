// /server/api/dreams/[id].get.ts
import { defineEventHandler, createError, getQuery } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { H3Event } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import {
  assertDreamAccess,
  getProvidedDreamCode,
  redactDreamAccess,
} from './index'

const artImageSelect = {
  id: true,
  fileName: true,
  fileType: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  artId: true,
  galleryId: true,
} satisfies Prisma.ArtImageSelect

const userSelect = {
  id: true,
  username: true,
  avatarImage: true,
} satisfies Prisma.UserSelect

function getDreamId(event: H3Event): number {
  const id = Number(event.context.params?.id)

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: 'Invalid Dream ID. It must be a positive integer.',
    })
  }

  return id
}

function parsePositiveInt(
  value: unknown,
  fallback: number,
  max: number,
): number {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback
  }

  return Math.min(parsed, max)
}

function parseBoolean(value: unknown): boolean {
  return value === true || value === 'true'
}

function getDreamInclude(options: {
  artLimit: number
  chatLimit: number
  includeChats: boolean
  includeReactions: boolean
}) {
  const { artLimit, chatLimit, includeChats, includeReactions } = options

  return {
    User: {
      select: userSelect,
    },
    Pitch: true,
    Art: true,
    ArtImage: {
      select: artImageSelect,
    },
    ArtCollection: {
      include: {
        art: {
          orderBy: { createdAt: 'desc' },
          take: artLimit,
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            path: true,
            checkpoint: true,
            checkpointResourceId: true,
            sampler: true,
            seed: true,
            steps: true,
            designer: true,
            isPublic: true,
            isMature: true,
            promptId: true,
            userId: true,
            pitchId: true,
            galleryId: true,
            promptString: true,
            cfg: true,
            cfgHalf: true,
            serverId: true,
            serverName: true,
            artImageId: true,
            imagePath: true,
            genres: true,
            negativePrompt: true,
          },
        },
      },
    },
    Gallery: true,
    Scenario: {
      include: {
        ArtImage: {
          select: artImageSelect,
        },
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
      },
    },
    Characters: {
      select: {
        id: true,
        name: true,
        honorific: true,
        species: true,
        class: true,
        alignment: true,
        level: true,
        backstory: true,
        drive: true,
        inventory: true,
        quirks: true,
        skills: true,
        genre: true,
        imagePath: true,
        artImageId: true,
        artPrompt: true,
        designer: true,
        personality: true,
        isPublic: true,
        isMature: true,
        userId: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    },
    Rewards: {
      select: {
        id: true,
        icon: true,
        text: true,
        power: true,
        collection: true,
        rarity: true,
        label: true,
        userId: true,
        artImageId: true,
        imagePath: true,
        artPrompt: true,
        isPublic: true,
        isMature: true,
      },
      orderBy: [
        {
          rarity: 'desc',
        },
        {
          updatedAt: 'desc',
        },
      ],
    },
    Tags: true,
    Reactions: includeReactions
      ? {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            User: {
              select: userSelect,
            },
          },
        }
      : false,
    Chats: includeChats
      ? {
          orderBy: { createdAt: 'asc' },
          take: chatLimit,
          include: {
            User: {
              select: userSelect,
            },
            Prompt: true,
            ArtImage: {
              select: artImageSelect,
            },
            Reactions: true,
          },
        }
      : false,
    _count: {
      select: {
        Chats: true,
        Reactions: true,
        Characters: true,
        Rewards: true,
      },
    },
  } satisfies Prisma.DreamInclude
}

export default defineEventHandler(async (event) => {
  let id = 0

  try {
    id = getDreamId(event)

    const query = getQuery(event)
    const { isValid, user } = await validateApiKey(event)
    const userId = isValid && user ? user.id : null
    const userRole = isValid && user ? user.Role : null
    const providedCode = getProvidedDreamCode(event)

    const artLimit = parsePositiveInt(query.artLimit, 48, 96)
    const chatLimit = parsePositiveInt(query.chatLimit, 100, 200)
    const includeChats = !parseBoolean(query.skipChats)
    const includeReactions = !parseBoolean(query.skipReactions)
    const includeMature = parseBoolean(query.includeMature)

    const data = await prisma.dream.findUnique({
      where: { id },
      include: getDreamInclude({
        artLimit,
        chatLimit,
        includeChats,
        includeReactions,
      }),
    })

    if (!data) {
      throw createError({
        statusCode: 404,
        message: `Dream with ID ${id} not found.`,
      })
    }

    const isOwner = data.userId === userId
    const isAdmin = userRole === 'ADMIN'

    assertDreamAccess({
      dream: data,
      userId,
      userRole,
      providedCode,
      action: 'view',
    })

    if (data.isMature && !includeMature && !isOwner && !isAdmin) {
      throw createError({
        statusCode: 403,
        message:
          'This dream is marked mature and cannot be viewed with the current filters.',
      })
    }

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Dream fetched successfully.',
      data: redactDreamAccess(data, isOwner || isAdmin),
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || `Failed to fetch Dream with ID ${id}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
