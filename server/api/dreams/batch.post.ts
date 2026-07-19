// /server/api/dreams/batch.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type {
  CreationSource,
  DreamType,
  Prisma,
} from '~/prisma/generated/prisma/client'
import {
  normalizeCreationSource,
  normalizeDreamType,
  normalizeIdArray,
  normalizeNullableId,
  normalizeOptionalText,
  normalizeScenarioIds,
  normalizeSlug,
} from './index'
import {
  dreamMutationSelect,
  type DreamMutationResult,
} from './selects'

const dreamBatchCreateFields = new Set([
  'title',
  'slug',
  'dreamType',
  'creationSource',
  'description',
  'pitch',
  'flavorText',
  'examples',
  'artPrompt',
  'imagePath',
  'cardPath',
  'heroPath',
  'highlightImage',
  'icon',
  'designer',
  'allowReviews',
  'artImageId',
  'artCollectionId',
  'scenarioId',
  'scenarioIds',
  'Scenarios',
  'characterIds',
  'rewardIds',
  'artImageIds',
  'artCollectionIds',
  'isPublic',
  'isMature',
  'isActive',
])

type DreamMutationInput = Record<string, unknown> & {
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
  cardPath?: string | null
  heroPath?: string | null
  highlightImage?: string | null
  icon?: string | null
  designer?: string | null
  allowReviews?: boolean
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

function getDreamsFromBody(body: DreamBatchBody): DreamMutationInput[] {
  if (Array.isArray(body)) return body

  if (body && typeof body === 'object' && Array.isArray(body.dreams)) {
    return body.dreams
  }

  return []
}

function assertSupportedFields(body: DreamMutationInput, index: number) {
  const unsupported = Object.keys(body).filter(
    (field) => !dreamBatchCreateFields.has(field),
  )

  if (unsupported.length > 0) {
    throw createError({
      statusCode: 400,
      message: `Unsupported Dream fields at index ${index}: ${unsupported.join(', ')}. Ownership, IDs, and timestamps are server-owned.`,
    })
  }
}

async function createDreamFromInput(
  body: DreamMutationInput,
  callerUserId: number,
  callerUsername: string | null | undefined,
): Promise<DreamMutationResult> {
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
  const artImageId = normalizeNullableId(body.artImageId)
  const artCollectionId = normalizeNullableId(body.artCollectionId)
  const scenarioIds = normalizeScenarioIds(body)
  const characterIds = normalizeIdArray(body.characterIds)
  const rewardIds = normalizeIdArray(body.rewardIds)
  const artImageIds = normalizeIdArray(body.artImageIds)
  const artCollectionIds = normalizeIdArray(body.artCollectionIds)
  const designer =
    normalizeOptionalText(body.designer) ||
    callerUsername ||
    `User ${callerUserId}`

  const dataInput: Prisma.DreamCreateInput = {
    title,
    slug,
    dreamType: normalizeDreamType(body.dreamType),
    creationSource: normalizeCreationSource(body.creationSource),
    description: normalizeOptionalText(body.description) ?? null,
    pitch: normalizeOptionalText(body.pitch) ?? null,
    flavorText: normalizeOptionalText(body.flavorText) ?? null,
    examples: normalizeOptionalText(body.examples) ?? null,
    artPrompt: normalizeOptionalText(body.artPrompt) ?? null,
    imagePath: normalizeOptionalText(body.imagePath) ?? null,
    cardPath: normalizeOptionalText(body.cardPath) ?? null,
    heroPath: normalizeOptionalText(body.heroPath) ?? null,
    highlightImage: normalizeOptionalText(body.highlightImage) ?? null,
    icon: normalizeOptionalText(body.icon) ?? 'kind-icon:dream',
    designer,
    allowReviews: body.allowReviews ?? false,
    isPublic: body.isPublic ?? true,
    isMature: body.isMature ?? false,
    isActive: body.isActive ?? true,
    User: {
      connect: { id: callerUserId },
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

  return await prisma.dream.create({
    data: dataInput,
    select: dreamMutationSelect,
  })
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

      assertSupportedFields(dreamData, index)
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { username: true },
    })
    const dreams: DreamMutationResult[] = []
    const errors: DreamBatchError[] = []

    for (const [index, dreamData] of dreamsData.entries()) {
      try {
        const dream = await createDreamFromInput(
          dreamData,
          user.id,
          userRecord?.username,
        )

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
      const statusCode = dreams.length > 0 ? 207 : 400

      event.node.res.statusCode = statusCode

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
        statusCode,
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
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to create dreams batch.',
      statusCode,
    }
  }
})
