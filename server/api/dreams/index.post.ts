// /server/api/dreams/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { requireApiUser } from '@/server/utils/authGuard'
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
import { dreamMutationSelect } from './selects'

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

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const body = await readBody<DreamCreateBody>(event)
    const title = body.title?.trim()

    if (!title) {
      throw createError({
        statusCode: 400,
        message: 'The "title" field is required.',
      })
    }

    const sender = user.username || `User ${user.id}`
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
      allowReviews: body.allowReviews ?? false,
      isPublic: body.isPublic ?? true,
      isMature: body.isMature ?? false,
      isActive: body.isActive ?? true,
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
      select: dreamMutationSelect,
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
