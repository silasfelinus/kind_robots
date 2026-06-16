// /server/api/dreams/batch.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type {
  CreationSource,
  DreamType,
  Prisma,
} from '~/prisma/generated/prisma/client'

type DreamMutationInput = {
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
  scenarioIds?: number[]
  Scenarios?: number[]
  characterIds?: number[]
  rewardIds?: number[]
  artImageIds?: number[]
  artCollectionIds?: number[]
  isPublic?: boolean
  isMature?: boolean
  isActive?: boolean
  createCollection?: boolean
}

type DreamBatchBody =
  | DreamMutationInput[]
  | {
      dreams?: DreamMutationInput[]
    }

type DreamBatchError = {
  index: number
  title: string | null
  message: string
  statusCode: number
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

const creationSources: CreationSource[] = [
  'HUMAN',
  'AI',
  'HYBRID',
  'UPLOAD',
  'UNKNOWN',
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
  Scenarios: true,
  Characters: true,
  Rewards: true,
} satisfies Prisma.DreamInclude

function getDreamsFromBody(body: DreamBatchBody): DreamMutationInput[] {
  if (Array.isArray(body)) {
    return body
  }

  if (body && typeof body === 'object' && Array.isArray(body.dreams)) {
    return body.dreams
  }

  return []
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

function normalizeDreamType(value: unknown): DreamType {
  return dreamTypes.includes(value as DreamType)
    ? (value as DreamType)
    : 'ARTDREAM'
}

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

function normalizeScenarioIds(body: DreamMutationInput): number[] | undefined {
  const scenarioIds = normalizeIdArray(body.scenarioIds)

  if (scenarioIds !== undefined) return scenarioIds

  const legacyScenarios = normalizeIdArray(body.Scenarios)

  if (legacyScenarios !== undefined) return legacyScenarios

  const scenarioId = normalizeNullableId(body.scenarioId)

  if (scenarioId) return [scenarioId]

  return undefined
}

async function createDreamFromInput(
  body: DreamMutationInput,
  userId: number,
  sender: string,
) {
  const title = body.title?.trim()

  if (!title) {
    throw createError({
      statusCode: 400,
      message: 'The "title" field is required.',
    })
  }

  const slug = body.slug?.trim()
    ? normalizeSlug(body.slug)
    : normalizeSlug(title)

  const isPublic = body.isPublic ?? true
  const isMature = body.isMature ?? false

  const artImageId = normalizeNullableId(body.artImageId)
  let artCollectionId = normalizeNullableId(body.artCollectionId)

  if (body.createCollection && !artCollectionId) {
    const collection = await prisma.artCollection.create({
      data: {
        label: `${title} Collection`,
        description: `Curated art for ${title}`,
        userId,
        username: sender,
        isPublic,
        isMature,
      },
    })

    artCollectionId = collection.id
  }

  const scenarioIds = normalizeScenarioIds(body)
  const characterIds = normalizeIdArray(body.characterIds)
  const rewardIds = normalizeIdArray(body.rewardIds)
  const artImageIds = normalizeIdArray(body.artImageIds)
  const artCollectionIds = normalizeIdArray(body.artCollectionIds)

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
      connect: { id: userId },
    },
    ...(artImageId
      ? {
          ArtImage: {
            connect: { id: artImageId },
          },
        }
      : {}),
    ...(artCollectionId
      ? {
          ArtCollection: {
            connect: { id: artCollectionId },
          },
        }
      : {}),
    ...(scenarioIds?.length
      ? {
          Scenarios: {
            connect: scenarioIds.map((id) => ({ id })),
          },
        }
      : {}),
    ...(characterIds?.length
      ? {
          Characters: {
            connect: characterIds.map((id) => ({ id })),
          },
        }
      : {}),
    ...(rewardIds?.length
      ? {
          Rewards: {
            connect: rewardIds.map((id) => ({ id })),
          },
        }
      : {}),
    ...(artImageIds?.length
      ? {
          ArtImages: {
            connect: artImageIds.map((id) => ({ id })),
          },
        }
      : {}),
    ...(artCollectionIds?.length
      ? {
          ArtCollections: {
            connect: artCollectionIds.map((id) => ({ id })),
          },
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
      userId,
      dreamId: data.id,
      artImageId: data.artImageId ?? undefined,
      isPublic: data.isPublic,
      isMature: data.isMature,
      channel: `dream-${data.id}`,
    },
  })

  return data
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

    const body = await readBody<DreamBatchBody>(event)
    const dreamsData = getDreamsFromBody(body)

    if (!Array.isArray(dreamsData)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid JSON body. Expected an array of dreams.',
      })
    }

    if (dreamsData.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Dream batch cannot be empty.',
      })
    }

    for (const [index, dreamData] of dreamsData.entries()) {
      if (
        !dreamData ||
        typeof dreamData !== 'object' ||
        Array.isArray(dreamData)
      ) {
        throw createError({
          statusCode: 400,
          message: `Invalid dream at index ${index}. Expected an object.`,
        })
      }
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { username: true },
    })

    const sender = userRecord?.username || `User ${user.id}`
    const dreams = []
    const errors: DreamBatchError[] = []

    for (const [index, dreamData] of dreamsData.entries()) {
      try {
        const dream = await createDreamFromInput(dreamData, user.id, sender)

        dreams.push(dream)
      } catch (error: unknown) {
        const handled = errorHandler(error)

        errors.push({
          index,
          title: dreamData.title?.trim() || null,
          message: handled.message || 'Failed to create dream.',
          statusCode: handled.statusCode || 500,
        })
      }
    }

    if (errors.length > 0) {
      event.node.res.statusCode = dreams.length > 0 ? 207 : 400

      return {
        success: dreams.length > 0,
        message:
          dreams.length > 0
            ? 'Some dreams were created, but some failed.'
            : 'No dreams could be created.',
        errors,
        count: dreams.length,
        data: dreams,
        dreams,
        statusCode: event.node.res.statusCode,
      }
    }

    event.node.res.statusCode = 201

    return {
      success: true,
      message: `${dreams.length} dream(s) created successfully.`,
      count: dreams.length,
      data: dreams,
      dreams,
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)

    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to create dreams batch.',
      statusCode: event.node.res.statusCode,
    }
  }
})
