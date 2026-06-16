// /server/api/dreams/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { H3Event } from 'h3'
import type { DreamType, Prisma } from '~/prisma/generated/prisma/client'
import { assertDreamAccess } from './index'

type DreamPatchBody = {
  title?: string
  slug?: string | null
  dreamType?: DreamType
  description?: string | null
  pitch?: string | null
  flavorText?: string | null
  examples?: string | null
  artPrompt?: string | null
  imagePath?: string | null
  highlightImage?: string | null
  icon?: string | null
  designer?: string | null
  artImageId?: number | null
  artCollectionId?: number | null
  scenarioId?: number | null
  isPublic?: boolean
  isMature?: boolean
  isActive?: boolean
  characterIds?: number[]
  rewardIds?: number[]
  artImageIds?: number[]
  artCollectionIds?: number[]
  addArtImageToCollection?: boolean
  updateNote?: string | null
}

const dreamTypes: DreamType[] = [
  'ARTDREAM',
  'BRAINSTORM',
  'WEIRDLANDIA',
  'RANDOMLIST',
  'TITLE',
  'VIBE',
  'BOT',
  'INSPIRATION',
  'CHARACTER',
  'REWARD',
  'SCENARIO',
  'TEXT',
  'LOCATION',
]

const dreamInclude = {
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
      imagePath: true,
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
  Characters: {
    select: {
      id: true,
      name: true,
      honorific: true,
      title: true,
      role: true,
      species: true,
      class: true,
      gender: true,
      presentation: true,
      alignment: true,
      genre: true,
      personality: true,
      drive: true,
      backstory: true,
      quirks: true,
      imagePath: true,
      artImageId: true,
      artPrompt: true,
      isPublic: true,
      isMature: true,
      userId: true,
    },
  },
  Rewards: {
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      flavorText: true,
      effect: true,
      icon: true,
      collection: true,
      rarity: true,
      rewardType: true,
      imagePath: true,
      artImageId: true,
      artPrompt: true,
      isPublic: true,
      isMature: true,
      isActive: true,
      userId: true,
    },
  },
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

/** Connect / disconnect a singular primary FK based on a nullable id. */
function relationFromNullableId(
  value: unknown,
): { connect: { id: number } } | { disconnect: true } | undefined {
  const id = normalizeNullableId(value)

  if (id === null) return { disconnect: true }
  if (id) return { connect: { id } }

  return undefined
}

function getUpdateSummary(body: DreamPatchBody): string {
  const changes: string[] = []

  if (body.title !== undefined) changes.push('name')
  if (body.description !== undefined || body.pitch !== undefined) {
    changes.push('idea')
  }
  if (body.dreamType !== undefined) changes.push('type')
  if (body.artPrompt !== undefined) changes.push('prompt')
  if (
    body.artImageId !== undefined ||
    body.artImageIds !== undefined ||
    body.imagePath !== undefined ||
    body.highlightImage !== undefined
  ) {
    changes.push('visuals')
  }
  if (
    body.artCollectionId !== undefined ||
    body.artCollectionIds !== undefined
  ) {
    changes.push('collections')
  }
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
        isPublic: true,
      },
    })

    if (!existingDream) {
      throw createError({
        statusCode: 404,
        message: 'Dream not found.',
      })
    }

    assertDreamAccess({
      dream: existingDream,
      userId: user.id,
      userRole: user.Role,
      action: 'mutate',
    })

    const body = await readBody<DreamPatchBody>(event)

    if (!body || Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const dataInput: Prisma.DreamUpdateInput = {}

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

    if (body.dreamType !== undefined && dreamTypes.includes(body.dreamType)) {
      dataInput.dreamType = body.dreamType
    }

    if (body.description !== undefined) {
      dataInput.description = normalizeOptionalText(body.description)
    }

    if (body.pitch !== undefined) {
      dataInput.pitch = normalizeOptionalText(body.pitch)
    }

    if (body.flavorText !== undefined) {
      dataInput.flavorText = normalizeOptionalText(body.flavorText)
    }

    if (body.examples !== undefined) {
      dataInput.examples = normalizeOptionalText(body.examples)
    }

    if (body.artPrompt !== undefined) {
      dataInput.artPrompt = normalizeOptionalText(body.artPrompt)
    }

    if (body.imagePath !== undefined) {
      dataInput.imagePath = normalizeOptionalText(body.imagePath)
    }

    if (body.highlightImage !== undefined) {
      dataInput.highlightImage = normalizeOptionalText(body.highlightImage)
    }

    if (body.icon !== undefined) {
      dataInput.icon = normalizeOptionalText(body.icon)
    }

    if (body.designer !== undefined) {
      dataInput.designer = normalizeOptionalText(body.designer)
    }

    if (body.artImageId !== undefined) {
      const relation = relationFromNullableId(body.artImageId)
      if (relation) dataInput.ArtImage = relation
    }

    if (body.artCollectionId !== undefined) {
      const relation = relationFromNullableId(body.artCollectionId)
      if (relation) dataInput.ArtCollection = relation
    }

    if (body.scenarioId !== undefined) {
      const relation = relationFromNullableId(body.scenarioId)
      if (relation) dataInput.Scenario = relation
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

    const characterIds = normalizeIdArray(body.characterIds)
    const rewardIds = normalizeIdArray(body.rewardIds)
    const artImageIds = normalizeIdArray(body.artImageIds)
    const artCollectionIds = normalizeIdArray(body.artCollectionIds)

    if (characterIds) {
      dataInput.Characters = {
        set: characterIds.map((characterId) => ({ id: characterId })),
      }
    }

    if (rewardIds) {
      dataInput.Rewards = {
        set: rewardIds.map((rewardId) => ({ id: rewardId })),
      }
    }

    if (artImageIds) {
      dataInput.ArtImages = {
        set: artImageIds.map((artImageId) => ({ id: artImageId })),
      }
    }

    if (artCollectionIds) {
      dataInput.ArtCollections = {
        set: artCollectionIds.map((collectionId) => ({ id: collectionId })),
      }
    }

    const data = await prisma.dream.update({
      where: { id },
      data: dataInput,
      include: dreamInclude,
    })

    if (
      body.addArtImageToCollection &&
      data.artImageId &&
      data.artCollectionId
    ) {
      await prisma.artCollection.update({
        where: { id: data.artCollectionId },
        data: {
          ArtImages: {
            connect: { id: data.artImageId },
          },
        },
      })
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { username: true },
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
