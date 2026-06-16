// /server/api/dreams/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type {
  CreationSource,
  DreamType,
  Prisma,
} from '~/prisma/generated/prisma/client'

type DreamCreateBody = {
  title?: string
  slug?: string | null
  dreamType?: DreamType
  creationSource?: CreationSource
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
  characterIds?: number[]
  rewardIds?: number[]
  artImageIds?: number[]
  artCollectionIds?: number[]
  isPublic?: boolean
  isMature?: boolean
  isActive?: boolean
  createCollection?: boolean
  scenarioIds?: number[]
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
  'PITCH',
  'GENRE',
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
  ArtCollection: true,
  Scenario: true,
  Characters: true,
  Rewards: true,
} satisfies Prisma.DreamInclude

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

function normalizeDreamType(value: unknown): DreamType {
  return dreamTypes.includes(value as DreamType)
    ? (value as DreamType)
    : 'ARTDREAM'
}

const creationSources: CreationSource[] = [
  'HUMAN',
  'AI',
  'HYBRID',
  'UPLOAD',
  'UNKNOWN',
]

function normalizeCreationSource(value: unknown): CreationSource {
  return creationSources.includes(value as CreationSource)
    ? (value as CreationSource)
    : 'HUMAN'
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()

  return trimmed || null
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<DreamCreateBody>(event)

    const title = body.title?.trim()
    if (!title) {
      throw createError({
        statusCode: 400,
        message: 'The "title" field is required.',
      })
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { username: true },
    })

    const sender = userRecord?.username || `User ${user.id}`

    const slug = body.slug?.trim()
      ? normalizeSlug(body.slug)
      : normalizeSlug(title)

    const isPublic = body.isPublic ?? true
    const isMature = body.isMature ?? false

    let artCollectionId = normalizeNullableId(body.artCollectionId)

    if (body.createCollection && !artCollectionId) {
      const collection = await prisma.artCollection.create({
        data: {
          label: `${title} Collection`,
          description: `Curated art for ${title}`,
          userId: user.id,
          username: sender,
          isPublic,
          isMature,
        },
      })

      artCollectionId = collection.id
    }

    const characterIds = normalizeIdArray(body.characterIds)
    const rewardIds = normalizeIdArray(body.rewardIds)
    const artImageIds = normalizeIdArray(body.artImageIds)
    const artCollectionIds = normalizeIdArray(body.artCollectionIds)
    const scenarioIds = normalizeIdArray(body.scenarioIds)

    const dataInput: Prisma.DreamCreateInput = {
      title,
      slug,
      dreamType: normalizeDreamType(body.dreamType),
      creationSource: normalizeCreationSource(body.creationSource),
      description: normalizeOptionalText(body.description),
      pitch: normalizeOptionalText(body.pitch),
      flavorText: normalizeOptionalText(body.flavorText),
      examples: normalizeOptionalText(body.examples),
      artPrompt: normalizeOptionalText(body.artPrompt),
      imagePath: normalizeOptionalText(body.imagePath),
      highlightImage: normalizeOptionalText(body.highlightImage),
      icon: normalizeOptionalText(body.icon),
      designer: normalizeOptionalText(body.designer) ?? sender,
      isPublic,
      isMature,
      isActive: body.isActive ?? true,
      User: {
        connect: { id: user.id },
      },
      ...(normalizeNullableId(body.artImageId)
        ? {
            ArtImage: {
              connect: { id: normalizeNullableId(body.artImageId)! },
            },
          }
        : {}),
      ...(artCollectionId
        ? { ArtCollection: { connect: { id: artCollectionId } } }
        : {}),
      ...(normalizeNullableId(body.scenarioId)
        ? {
            Scenario: {
              connect: { id: normalizeNullableId(body.scenarioId)! },
            },
          }
        : {}),
      ...(characterIds?.length
        ? { Characters: { connect: characterIds.map((id) => ({ id })) } }
        : {}),
      ...(rewardIds?.length
        ? { Rewards: { connect: rewardIds.map((id) => ({ id })) } }
        : {}),
      ...(scenarioIds?.length
        ? { Scenarios: { connect: scenarioIds.map((id) => ({ id })) } }
        : {}),
      ...(artImageIds?.length
        ? { ArtImages: { connect: artImageIds.map((id) => ({ id })) } }
        : {}),
      ...(artCollectionIds?.length
        ? {
            ArtCollections: { connect: artCollectionIds.map((id) => ({ id })) },
          }
        : {}),
    }

    const data = await prisma.dream.create({
      data: dataInput,
      include: dreamInclude,
    })

    await prisma.chat.create({
      data: {
        type: 'Dream',
        sender,
        content: `Dream started: ${title}`,
        title,
        userId: user.id,
        dreamId: data.id,
        artImageId: data.artImageId ?? undefined,
        isPublic: data.isPublic,
        isMature: data.isMature,
        channel: `dream-${data.id}`,
      },
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      message: 'Dream created successfully.',
      data,
      statusCode: 201,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to create dream.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
