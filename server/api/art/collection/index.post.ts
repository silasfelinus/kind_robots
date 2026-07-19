// /server/api/art/collection/index.post.ts
import { defineEventHandler, readBody } from 'h3'
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
  'artImageIds',
  'label',
  'slug',
  'parentFolder',
  'description',
  'isPublic',
  'isMature',
  'artPrompt',
])

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const body = await readBody(event)

    assertPlainObjectBody(body)
    rejectUnknownFields(body, ALLOWED_FIELDS)

    const artImageIds = normalizeIdArray(body.artImageIds, 'artImageIds')

    await assertOwnedActiveArtImages({
      ids: artImageIds.ids,
      fieldName: 'artImageIds',
      userId: auth.user.id,
      isAdmin: auth.isAdmin,
    })

    const label = cleanRequiredText(body.label, 'label', 255)
    const rawSlug = cleanOptionalText(body.slug, 'slug', 255)
    const slug = normalizeSlugInput(rawSlug)
    const rawParentFolder = cleanOptionalText(
      body.parentFolder,
      'parentFolder',
      500,
    )
    const parentFolder = rawParentFolder
      ? rawParentFolder.replace(/^\/+|\/+$/g, '') || null
      : rawParentFolder
    const description = cleanOptionalText(
      body.description,
      'description',
      5_000,
    )
    const artPrompt = cleanOptionalText(body.artPrompt, 'artPrompt', 10_000)
    const isPublic = cleanOptionalBoolean(body.isPublic, 'isPublic') ?? false
    const isMature = cleanOptionalBoolean(body.isMature, 'isMature') ?? false

    const data = await prisma.artCollection.create({
      data: {
        label,
        slug: slug ?? undefined,
        parentFolder,
        description,
        artPrompt,
        isPublic,
        isMature,
        username: auth.user.username || null,
        User: {
          connect: { id: auth.user.id },
        },
        ArtImages: artImageIds.ids.length
          ? {
              connect: artImageIds.ids.map((id) => ({ id })),
            }
          : undefined,
      },
      select: artCollectionMutationSelect,
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      data,
      message: 'Art collection created successfully.',
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      data: null,
      message: handled.message || 'Failed to create art collection.',
      statusCode: event.node.res.statusCode,
    }
  }
})
