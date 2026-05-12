// /server/api/dreams/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { H3Event } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'

type DreamPatchBody = {
  title?: string
  slug?: string | null
  description?: string | null
  currentVibe?: string
  currentPrompt?: string | null
  pitchId?: number | null
  artId?: number | null
  artImageId?: number | null
  textServerId?: number | null
  artServerId?: number | null
  artCollectionId?: number | null
  galleryId?: number | null
  scenarioId?: number | null
  isPublic?: boolean
  isMature?: boolean
  isActive?: boolean
  tagIds?: number[]
  characterIds?: number[]
  rewardIds?: number[]
  addArtToCollection?: boolean
  updateNote?: string | null
}

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

function normalizeNullableId(value: unknown): number | null | undefined {
  if (value === null) return null
  if (value === undefined || value === '') return undefined

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) return undefined

  return parsed
}

function normalizeIdArray(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined

  const ids = value.map(Number).filter((id) => Number.isInteger(id) && id > 0)

  return Array.from(new Set(ids))
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function normalizeOptionalText(value: unknown): string | null | undefined {
  if (value === null) return null
  if (value === undefined) return undefined
  if (typeof value !== 'string') return undefined

  return value.trim()
}

function getUpdateSummary(body: DreamPatchBody): string {
  const changes: string[] = []

  if (body.title !== undefined) changes.push('name')
  if (body.description !== undefined) changes.push('description')
  if (body.currentVibe !== undefined) changes.push('vibe')
  if (body.currentPrompt !== undefined) changes.push('prompt')
  if (body.scenarioId !== undefined) changes.push('scenario')
  if (body.artImageId !== undefined || body.artId !== undefined)
    changes.push('visuals')
  if (body.artCollectionId !== undefined) changes.push('collection')
  if (body.tagIds !== undefined) changes.push('tags')
  if (body.characterIds !== undefined) changes.push('cast')
  if (body.rewardIds !== undefined) changes.push('items')
  if (
    body.isPublic !== undefined ||
    body.isMature !== undefined ||
    body.isActive !== undefined
  ) {
    changes.push('settings')
  }

  if (!changes.length) return 'Dream updated.'

  return `Dream updated: ${changes.join(', ')}.`
}

export default defineEventHandler(async (event) => {
  let id = 0

  try {
    id = getDreamId(event)

    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const existingDream = await prisma.dream.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        title: true,
        artCollectionId: true,
      },
    })

    if (!existingDream) {
      throw createError({
        statusCode: 404,
        message: 'Dream not found.',
      })
    }

    if (existingDream.userId !== user.id && user.Role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this dream.',
      })
    }

    const body = await readBody<DreamPatchBody>(event)

    if (!body || Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const dataInput: Prisma.DreamUncheckedUpdateInput = {}

    if (typeof body.title === 'string') {
      const title = body.title.trim()

      if (!title) {
        throw createError({
          statusCode: 400,
          message: 'The "title" field cannot be empty.',
        })
      }

      dataInput.title = title
    }

    if (body.slug !== undefined) {
      dataInput.slug = body.slug ? normalizeSlug(body.slug) : null
    }

    if (body.description !== undefined) {
      dataInput.description = normalizeOptionalText(body.description)
    }

    if (typeof body.currentVibe === 'string') {
      const currentVibe = body.currentVibe.trim()

      if (!currentVibe) {
        throw createError({
          statusCode: 400,
          message: 'The "currentVibe" field cannot be empty.',
        })
      }

      dataInput.currentVibe = currentVibe
    }

    if (body.currentPrompt !== undefined) {
      dataInput.currentPrompt = normalizeOptionalText(body.currentPrompt)
    }

    if (body.pitchId !== undefined) {
      dataInput.pitchId = normalizeNullableId(body.pitchId)
    }

    if (body.artId !== undefined) {
      dataInput.artId = normalizeNullableId(body.artId)
    }

    if (body.artImageId !== undefined) {
      dataInput.artImageId = normalizeNullableId(body.artImageId)
    }

    if (body.textServerId !== undefined) {
      dataInput.textServerId = normalizeNullableId(body.textServerId)
    }

    if (body.artServerId !== undefined) {
      dataInput.artServerId = normalizeNullableId(body.artServerId)
    }

    if (body.artCollectionId !== undefined) {
      dataInput.artCollectionId = normalizeNullableId(body.artCollectionId)
    }

    if (body.galleryId !== undefined) {
      dataInput.galleryId = normalizeNullableId(body.galleryId)
    }

    if (body.scenarioId !== undefined) {
      dataInput.scenarioId = normalizeNullableId(body.scenarioId)
    }

    if (typeof body.isPublic === 'boolean') {
      dataInput.isPublic = body.isPublic
    }

    if (typeof body.isMature === 'boolean') {
      dataInput.isMature = body.isMature
    }

    if (typeof body.isActive === 'boolean') {
      dataInput.isActive = body.isActive
    }

    const tagIds = normalizeIdArray(body.tagIds)
    const characterIds = normalizeIdArray(body.characterIds)
    const rewardIds = normalizeIdArray(body.rewardIds)

    const data = await prisma.dream.update({
      where: { id },
      data: {
        ...dataInput,
        ...(tagIds
          ? {
              Tags: {
                set: tagIds.map((tagId) => ({ id: tagId })),
              },
            }
          : {}),
        ...(characterIds
          ? {
              Characters: {
                set: characterIds.map((characterId) => ({ id: characterId })),
              },
            }
          : {}),
        ...(rewardIds
          ? {
              Rewards: {
                set: rewardIds.map((rewardId) => ({ id: rewardId })),
              },
            }
          : {}),
      },
      include: dreamInclude,
    })

    if (body.addArtToCollection && data.artCollectionId && data.artId) {
      const existingCollectionLink = await prisma.artCollection.findFirst({
        where: {
          id: data.artCollectionId,
          art: {
            some: {
              id: data.artId,
            },
          },
        },
        select: {
          id: true,
        },
      })

      if (!existingCollectionLink) {
        await prisma.artCollection.update({
          where: { id: data.artCollectionId },
          data: {
            art: {
              connect: { id: data.artId },
            },
          },
        })
      }
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        username: true,
      },
    })

    const sender = userRecord?.username || `User ${user.id}`
    const updateNote = normalizeOptionalText(body.updateNote)
    const content = updateNote || getUpdateSummary(body)

    await prisma.chat.create({
      data: {
        type: 'Dream',
        sender,
        content,
        title: data.title,
        userId: user.id,
        dreamId: id,
        artImageId: data.artImageId ?? undefined,
        isPublic: data.isPublic,
        isMature: data.isMature,
        channel: `dream-${id}`,
      },
    })

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Dream updated successfully.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || `Failed to update Dream with ID ${id}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
