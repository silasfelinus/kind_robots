// /server/api/dreams/batch.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { Prisma } from '~/prisma/generated/prisma/client'
import {
  normalizeCreationSource,
  normalizeDreamType,
  normalizeOptionalText,
  normalizeSlug,
} from './index'
import {
  assertDreamMutationInput,
  dreamBatchCreateFields,
  normalizeBoundedDreamIdArray,
  normalizeBoundedDreamNullableId,
  normalizeBoundedDreamScenarioIds,
  type DreamMutationBody,
} from './mutation'
import {
  dreamMutationSelect,
  type DreamMutationResult,
} from './selects'

const DREAM_BATCH_LIMIT = 100

type DreamBatchBody =
  | DreamMutationBody[]
  | {
      dreams?: DreamMutationBody[]
    }

type DreamBatchError = {
  index: number
  title: string | null
  message: string
  statusCode: number
}

function getDreamsFromBody(body: unknown): DreamMutationBody[] {
  if (Array.isArray(body)) return body as DreamMutationBody[]

  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>
    const unsupported = Object.keys(record).filter((field) => field !== 'dreams')

    if (unsupported.length) {
      throw createError({
        statusCode: 400,
        message: `Unsupported Dream batch fields: ${unsupported.join(', ')}.`,
      })
    }

    if (Array.isArray(record.dreams)) {
      return record.dreams as DreamMutationBody[]
    }
  }

  return []
}

async function createDreamFromInput(
  body: DreamMutationBody,
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
  const artImageId = normalizeBoundedDreamNullableId(
    body.artImageId,
    'artImageId',
  )
  const artCollectionId = normalizeBoundedDreamNullableId(
    body.artCollectionId,
    'artCollectionId',
  )
  const scenarioIds = normalizeBoundedDreamScenarioIds(body)
  const characterIds = normalizeBoundedDreamIdArray(
    body.characterIds,
    'characterIds',
  )
  const rewardIds = normalizeBoundedDreamIdArray(
    body.rewardIds,
    'rewardIds',
  )
  const artImageIds = normalizeBoundedDreamIdArray(
    body.artImageIds,
    'artImageIds',
  )
  const artCollectionIds = normalizeBoundedDreamIdArray(
    body.artCollectionIds,
    'artCollectionIds',
  )
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
    ...(typeof artImageId === 'number'
      ? {
          ArtImage: {
            connect: { id: artImageId },
          },
        }
      : {}),
    ...(typeof artCollectionId === 'number'
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

    if (dreamsData.length > DREAM_BATCH_LIMIT) {
      throw createError({
        statusCode: 400,
        message: `Dream batch may contain at most ${DREAM_BATCH_LIMIT} entries.`,
      })
    }

    for (const [index, dreamData] of dreamsData.entries()) {
      assertDreamMutationInput(dreamData, {
        allowedFields: dreamBatchCreateFields,
        context: `Dream batch item ${index}`,
      })
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
      data: null,
      statusCode,
    }
  }
})
