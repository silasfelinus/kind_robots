// /server/api/dreams/[id].patch.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { requireApiUser } from '@/server/utils/authGuard'
import type { Prisma } from '~/prisma/generated/prisma/client'
import {
  assertDreamAccess,
  getDreamId,
  normalizeCreationSource,
  normalizeOptionalText,
  normalizeSlug,
  relationFromNullableId,
} from './index'
import {
  assertDreamMutationInput,
  assertDreamRelationsAttachable,
  boundedScenariosRelationFromPatch,
  dreamPatchFields,
  normalizeBoundedDreamIdArray,
} from './mutation'
import { dreamMutationSelect } from './selects'

function setTextField<T extends keyof Prisma.DreamUpdateInput>(
  dataInput: Prisma.DreamUpdateInput,
  key: T,
  value: unknown,
) {
  const normalized = normalizeOptionalText(value)

  if (normalized !== undefined) {
    dataInput[key] = normalized as Prisma.DreamUpdateInput[T]
  }
}

export default defineEventHandler(async (event) => {
  let id = 0

  try {
    id = getDreamId(event)

    const { user } = await requireApiUser(event)
    const existingDream = await prisma.dream.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
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

    const rawBody = await readBody<unknown>(event)

    assertDreamMutationInput(rawBody, {
      allowedFields: dreamPatchFields,
      context: 'Dream patch payload',
      authenticatedUserId: user.id,
      routeId: id,
      requireNonEmpty: true,
    })

    const body = rawBody
    await assertDreamRelationsAttachable(body, user.id, user.Role)

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

    if (body.dreamType !== undefined) {
      dataInput.dreamType = body.dreamType
    }

    if (body.creationSource !== undefined) {
      dataInput.creationSource = normalizeCreationSource(body.creationSource)
    }

    if (body.description !== undefined) {
      setTextField(dataInput, 'description', body.description)
    }

    if (body.pitch !== undefined) {
      setTextField(dataInput, 'pitch', body.pitch)
    }

    if (body.flavorText !== undefined) {
      setTextField(dataInput, 'flavorText', body.flavorText)
    }

    if (body.examples !== undefined) {
      setTextField(dataInput, 'examples', body.examples)
    }

    if (body.artPrompt !== undefined) {
      setTextField(dataInput, 'artPrompt', body.artPrompt)
    }

    if (body.imagePath !== undefined) {
      setTextField(dataInput, 'imagePath', body.imagePath)
    }

    if (body.cardPath !== undefined) {
      setTextField(dataInput, 'cardPath', body.cardPath)
    }

    if (body.heroPath !== undefined) {
      setTextField(dataInput, 'heroPath', body.heroPath)
    }

    if (body.highlightImage !== undefined) {
      setTextField(dataInput, 'highlightImage', body.highlightImage)
    }

    if (body.icon !== undefined) {
      setTextField(dataInput, 'icon', body.icon)
    }

    if (body.designer !== undefined) {
      setTextField(dataInput, 'designer', body.designer)
    }

    if (body.artImageId !== undefined) {
      const relation = relationFromNullableId(body.artImageId)
      if (relation) dataInput.ArtImage = relation
    }

    if (body.artCollectionId !== undefined) {
      const relation = relationFromNullableId(body.artCollectionId)
      if (relation) dataInput.ArtCollection = relation
    }

    const scenariosRelation = boundedScenariosRelationFromPatch(body)

    if (scenariosRelation) {
      dataInput.Scenarios = scenariosRelation
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

    if (typeof body.allowReviews === 'boolean') {
      dataInput.allowReviews = body.allowReviews
    }

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

    if (characterIds !== undefined) {
      dataInput.Characters = {
        set: characterIds.map((characterId) => ({ id: characterId })),
      }
    }

    if (rewardIds !== undefined) {
      dataInput.Rewards = {
        set: rewardIds.map((rewardId) => ({ id: rewardId })),
      }
    }

    if (artImageIds !== undefined) {
      dataInput.ArtImages = {
        set: artImageIds.map((artImageId) => ({ id: artImageId })),
      }
    }

    if (artCollectionIds !== undefined) {
      dataInput.ArtCollections = {
        set: artCollectionIds.map((collectionId) => ({ id: collectionId })),
      }
    }

    if (Object.keys(dataInput).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No valid Dream update fields provided.',
      })
    }

    const data = await prisma.dream.update({
      where: { id },
      data: dataInput,
      select: dreamMutationSelect,
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
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || `Failed to update Dream with ID ${id}.`,
      data: null,
      statusCode,
    }
  }
})
