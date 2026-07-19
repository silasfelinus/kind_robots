// /server/api/dreams/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { requireApiUser } from '@/server/utils/authGuard'
import type { Prisma } from '~/prisma/generated/prisma/client'
import {
  normalizeCreationSource,
  normalizeDreamType,
  normalizeOptionalText,
  normalizeSlug,
} from './index'
import {
  assertDreamMutationInput,
  dreamCreateFields,
  normalizeBoundedDreamIdArray,
  normalizeBoundedDreamNullableId,
  normalizeBoundedDreamScenarioIds,
} from './mutation'
import { dreamMutationSelect } from './selects'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const rawBody = await readBody<unknown>(event)

    assertDreamMutationInput(rawBody, {
      allowedFields: dreamCreateFields,
      context: 'Dream create payload',
      authenticatedUserId: user.id,
    })

    const body = rawBody
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
