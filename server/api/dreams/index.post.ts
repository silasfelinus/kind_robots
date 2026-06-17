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
    const isActive = body.isActive ?? true

    const artImageId = normalizeNullableId(body.artImageId)
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
      highlightImage: normalizeOptionalText(body.highlightImage) ?? null,
      icon: normalizeOptionalText(body.icon) ?? 'kind-icon:dream',
      designer: normalizeOptionalText(body.designer) ?? sender,
      isPublic,
      isMature,
      isActive,
      User: {
        connect: { id: user.id },
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
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to create dream.',
      data: null,
      statusCode,
    }
  }
})
