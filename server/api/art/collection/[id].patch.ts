// /server/api/art/collection/[id].patch.ts
import {
  createError,
  defineEventHandler,
  getRouterParam,
  readBody,
} from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireApiUser } from '../../../utils/authGuard'
import { normalizeSlugInput } from '~/utils/slugify'
import {
  artCollectionMutationSelect,
  assertOwnedActiveArtImages,
  assertPlainObjectBody,
  cleanOptionalBoolean,
  cleanOptionalText,
  cleanRequiredText,
  normalizeIdArray,
  rejectUnknownFields,
} from '~/server/utils/artCollectionApi'

const ALLOWED_FIELDS = new Set([
  'label',
  'slug',
  'parentFolder',
  'description',
  'isPublic',
  'isMature',
  'artImageIds',
  'addArtImageIds',
  'removeArtImageIds',
  'mode',
  'artPrompt',
])

function mergeArtImageRelationUpdate(
  updateData: Prisma.ArtCollectionUpdateInput,
  nextUpdate: Prisma.ArtImageUpdateManyWithoutArtCollectionsNestedInput,
): void {
  const existingUpdate =
    updateData.ArtImages && typeof updateData.ArtImages === 'object'
      ? updateData.ArtImages
      : {}

  updateData.ArtImages = {
    ...existingUpdate,
    ...nextUpdate,
  }
}

export default defineEventHandler(async (event) => {
  let collectionId = 0

  try {
    collectionId = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(collectionId) || collectionId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid collection ID.',
      })
    }

    const auth = await requireApiUser(event)
    const collection = await prisma.artCollection.findUnique({
      where: { id: collectionId },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!collection) {
      throw createError({
        statusCode: 404,
        message: 'Collection not found.',
      })
    }

    if (!auth.isAdmin && collection.userId !== auth.user.id) {
      throw createError({
        statusCode: 403,
        message: 'Not authorized to update this collection.',
      })
    }

    const body = await readBody(event)
    assertPlainObjectBody(body)
    rejectUnknownFields(body, ALLOWED_FIELDS)

    const updateData: Prisma.ArtCollectionUpdateInput = {}

    if (Object.hasOwn(body, 'label')) {
      updateData.label = cleanRequiredText(body.label, 'label', 255)
    }

    if (Object.hasOwn(body, 'slug')) {
      const rawSlug = cleanOptionalText(body.slug, 'slug', 255)
      updateData.slug = normalizeSlugInput(rawSlug) ?? null
    }

    if (Object.hasOwn(body, 'parentFolder')) {
      const rawParentFolder = cleanOptionalText(
        body.parentFolder,
        'parentFolder',
        500,
      )
      updateData.parentFolder = rawParentFolder
        ? rawParentFolder.replace(/^\/+|\/+$/g, '') || null
        : rawParentFolder
    }

    if (Object.hasOwn(body, 'description')) {
      updateData.description = cleanOptionalText(
        body.description,
        'description',
        5_000,
      )
    }

    if (Object.hasOwn(body, 'isPublic')) {
      updateData.isPublic = cleanOptionalBoolean(body.isPublic, 'isPublic')
    }

    if (Object.hasOwn(body, 'isMature')) {
      updateData.isMature = cleanOptionalBoolean(body.isMature, 'isMature')
    }

    if (Object.hasOwn(body, 'artPrompt')) {
      updateData.artPrompt = cleanOptionalText(
        body.artPrompt,
        'artPrompt',
        10_000,
      )
    }

    const artImageIds = normalizeIdArray(body.artImageIds, 'artImageIds')
    const addArtImageIds = normalizeIdArray(
      body.addArtImageIds,
      'addArtImageIds',
    )
    const removeArtImageIds = normalizeIdArray(
      body.removeArtImageIds,
      'removeArtImageIds',
    )

    if (
      artImageIds.provided &&
      (addArtImageIds.provided || removeArtImageIds.provided)
    ) {
      throw createError({
        statusCode: 400,
        message:
          'artImageIds cannot be combined with addArtImageIds or removeArtImageIds.',
      })
    }

    let mode: 'replace' | 'add' = 'replace'

    if (Object.hasOwn(body, 'mode')) {
      if (!artImageIds.provided) {
        throw createError({
          statusCode: 400,
          message: 'mode may only be used with artImageIds.',
        })
      }

      if (body.mode !== 'replace' && body.mode !== 'add') {
        throw createError({
          statusCode: 400,
          message: 'mode must be replace or add.',
        })
      }

      mode = body.mode
    }

    if (artImageIds.provided) {
      await assertOwnedActiveArtImages({
        ids: artImageIds.ids,
        fieldName: 'artImageIds',
        userId: auth.user.id,
        isAdmin: auth.isAdmin,
      })

      if (mode === 'add') {
        if (artImageIds.ids.length) {
          mergeArtImageRelationUpdate(updateData, {
            connect: artImageIds.ids.map((id) => ({ id })),
          })
        }
      } else {
        mergeArtImageRelationUpdate(updateData, {
          set: artImageIds.ids.map((id) => ({ id })),
        })
      }
    }

    if (addArtImageIds.provided && addArtImageIds.ids.length) {
      await assertOwnedActiveArtImages({
        ids: addArtImageIds.ids,
        fieldName: 'addArtImageIds',
        userId: auth.user.id,
        isAdmin: auth.isAdmin,
      })

      mergeArtImageRelationUpdate(updateData, {
        connect: addArtImageIds.ids.map((id) => ({ id })),
      })
    }

    if (removeArtImageIds.provided && removeArtImageIds.ids.length) {
      mergeArtImageRelationUpdate(updateData, {
        disconnect: removeArtImageIds.ids.map((id) => ({ id })),
      })
    }

    if (!Object.keys(updateData).length) {
      throw createError({
        statusCode: 400,
        message: 'No valid collection updates were provided.',
      })
    }

    const updated = await prisma.artCollection.update({
      where: { id: collectionId },
      data: updateData,
      select: artCollectionMutationSelect,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Collection updated.',
      data: updated,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      data: null,
      message:
        handled.message || `Failed to update collection ${collectionId}.`,
      statusCode: event.node.res.statusCode,
    }
  }
})
