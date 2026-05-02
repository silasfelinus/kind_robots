// /server/api/dreams/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { Prisma } from '~/prisma/generated/prisma/client'

type DreamPatchBody = {
  title?: string
  slug?: string | null
  description?: string | null
  currentVibe?: string
  currentPrompt?: string | null
  pitchId?: number | null
  artId?: number | null
  artImageId?: number | null
  textServerId?: number | null
  artServerId?: number | null
  artCollectionId?: number | null
  galleryId?: number | null
  scenarioId?: number | null
  isPublic?: boolean
  isMature?: boolean
  isActive?: boolean
  tagIds?: number[]
  addArtToCollection?: boolean
}

function getDreamId(event: any): number {
  const id = Number(event.context.params?.id)
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      message: 'Invalid Dream ID. It must be a positive integer.',
    })
  }

  return id
}

function normalizeNullableId(value: unknown): number | null | undefined {
  if (value === null) return null
  if (value === undefined || value === '') return undefined

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return undefined

  return parsed
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export default defineEventHandler(async (event) => {
  let id = 0

  try {
    id = getDreamId(event)

    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const existingDream = await prisma.dream.findUnique({
      where: { id },
    })

    if (!existingDream) {
      throw createError({
        statusCode: 404,
        message: 'Dream not found.',
      })
    }

    if (existingDream.userId !== user.id && user.Role !== 'ADMIN') {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this dream.',
      })
    }

    const body = await readBody<DreamPatchBody>(event)
    if (!body || Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const dataInput: Prisma.DreamUncheckedUpdateInput = {}

    if (typeof body.title === 'string') dataInput.title = body.title.trim()
    if (body.slug !== undefined) {
      dataInput.slug = body.slug ? normalizeSlug(body.slug) : null
    }
    if (body.description !== undefined) dataInput.description = body.description
    if (typeof body.currentVibe === 'string') {
      dataInput.currentVibe = body.currentVibe
    }
    if (body.currentPrompt !== undefined) {
      dataInput.currentPrompt = body.currentPrompt
    }
    if (body.pitchId !== undefined) {
      dataInput.pitchId = normalizeNullableId(body.pitchId)
    }
    if (body.artId !== undefined) {
      dataInput.artId = normalizeNullableId(body.artId)
    }
    if (body.artImageId !== undefined) {
      dataInput.artImageId = normalizeNullableId(body.artImageId)
    }
    if (body.textServerId !== undefined) {
      dataInput.textServerId = normalizeNullableId(body.textServerId)
    }
    if (body.artServerId !== undefined) {
      dataInput.artServerId = normalizeNullableId(body.artServerId)
    }
    if (body.artCollectionId !== undefined) {
      dataInput.artCollectionId = normalizeNullableId(body.artCollectionId)
    }
    if (body.galleryId !== undefined) {
      dataInput.galleryId = normalizeNullableId(body.galleryId)
    }
    if (body.scenarioId !== undefined) {
      dataInput.scenarioId = normalizeNullableId(body.scenarioId)
    }
    if (typeof body.isPublic === 'boolean') dataInput.isPublic = body.isPublic
    if (typeof body.isMature === 'boolean') dataInput.isMature = body.isMature
    if (typeof body.isActive === 'boolean') dataInput.isActive = body.isActive

    const tagIds = Array.isArray(body.tagIds)
      ? body.tagIds
          .map(Number)
          .filter((tagId) => Number.isInteger(tagId) && tagId > 0)
      : undefined

    const data = await prisma.dream.update({
      where: { id },
      data: {
        ...dataInput,
        ...(tagIds
          ? {
              Tags: {
                set: tagIds.map((tagId) => ({ id: tagId })),
              },
            }
          : {}),
      },
      include: {
        User: {
          select: {
            id: true,
            username: true,
            avatarImage: true,
          },
        },
        Pitch: true,
        Art: true,
        ArtImage: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            createdAt: true,
            updatedAt: true,
            userId: true,
            artId: true,
            galleryId: true,
          },
        },
        ArtCollection: true,
        Gallery: true,
        Scenario: true,
        Tags: true,
      },
    })

    if (body.addArtToCollection && data.artCollectionId && data.artId) {
      await prisma.artCollection.update({
        where: { id: data.artCollectionId },
        data: {
          art: {
            connect: { id: data.artId },
          },
        },
      })
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        username: true,
      },
    })

    const sender = userRecord?.username || `User ${user.id}`

    await prisma.chat.create({
      data: {
        type: 'Dream',
        sender,
        content: 'Dream updated.',
        userId: user.id,
        dreamId: id,
        artImageId: data.artImageId ?? undefined,
        isPublic: data.isPublic,
        isMature: data.isMature,
        channel: `dream-${id}`,
      },
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
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || `Failed to update Dream with ID ${id}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
