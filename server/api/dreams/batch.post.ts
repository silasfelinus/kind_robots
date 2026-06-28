// /server/api/dreams/batch.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type {
  CreationSource,
  DreamPriority,
  DreamType,
  Prisma,
  ProjectStatus,
} from '~/prisma/generated/prisma/client'
import {
  dreamInclude,
  normalizeCreationSource,
  normalizeDreamType,
  normalizeIdArray,
  normalizeNullableId,
  normalizeOptionalText,
  normalizeScenarioIds,
  normalizeSlug,
} from './index'

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
  cardPath?: string | null
  heroPath?: string | null
  highlightImage?: string | null
  icon?: string | null
  designer?: string | null
  repoUrl?: string | null
  liveUrl?: string | null
  projectStatus?: ProjectStatus | string | null
  priority?: DreamPriority | string | null
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
  createCollection?: boolean
  userId?: number
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

function normalizeProjectStatus(raw: unknown): ProjectStatus | undefined {
  const valid: ProjectStatus[] = ['ACTIVE', 'PAUSED', 'DONE', 'ARCHIVED', 'BRAINSTORM']
  const s = String(raw ?? '').trim().toUpperCase()
  return valid.includes(s as ProjectStatus) ? (s as ProjectStatus) : undefined
}

function normalizeProjectPriority(raw: unknown): DreamPriority | undefined {
  const valid: DreamPriority[] = ['LOW', 'NORMAL', 'HIGH']
  const s = String(raw ?? '').trim().toUpperCase()
  return valid.includes(s as DreamPriority) ? (s as DreamPriority) : undefined
}

async function createDreamFromInput(
  body: DreamMutationInput,
  callerUserId: number,
  sender: string,
) {
  const userId = (body.userId && Number.isInteger(body.userId) && body.userId > 0)
    ? body.userId
    : callerUserId
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
  const isActive = body.isActive ?? true

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
    designer: normalizeOptionalText(body.designer) ?? sender,
    repoUrl: normalizeOptionalText(body.repoUrl) ?? null,
    liveUrl: normalizeOptionalText(body.liveUrl) ?? null,
    projectStatus: normalizeProjectStatus(body.projectStatus),
    priority: normalizeProjectPriority(body.priority) ?? 'NORMAL',
    allowReviews: body.allowReviews ?? false,
    isPublic,
    isMature,
    isActive,
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

  if (data.artImageId && data.artCollectionId) {
    await prisma.artCollection.update({
      where: { id: data.artCollectionId },
      data: {
        ArtImages: {
          connect: { id: data.artImageId },
        },
      },
    })
  }

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
