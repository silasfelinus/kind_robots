// /server/api/dreams/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { Prisma } from '~/prisma/generated/prisma/client'
import {
  accessModeToIsPublic,
  normalizeDreamAccessMode,
  normalizeDreamPrivacyCode,
  redactDreamAccess,
  type DreamAccessMode,
} from './index'

type DreamCreateBody = {
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
  accessMode?: DreamAccessMode
  privacyCode?: string | null
  isPublic?: boolean
  isMature?: boolean
  isActive?: boolean
  createCollection?: boolean
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

    const currentVibe = body.currentVibe?.trim()
    if (!currentVibe) {
      throw createError({
        statusCode: 400,
        message: 'The "currentVibe" field is required.',
      })
    }

    const accessMode = normalizeDreamAccessMode(body.accessMode)
    const privacyCode =
      accessMode === 'CODE' ? normalizeDreamPrivacyCode(body.privacyCode) : null

    if (accessMode === 'CODE' && !privacyCode) {
      throw createError({
        statusCode: 400,
        message: 'A privacy code is required when accessMode is CODE.',
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

    let artCollectionId = normalizeNullableId(body.artCollectionId)

    if (body.createCollection && !artCollectionId) {
      const collection = await prisma.artCollection.create({
        data: {
          label: `${title} Collection`,
          description: `Curated art for ${title}`,
          userId: user.id,
          username: sender,
          isPublic: body.isPublic ?? accessModeToIsPublic(accessMode),
          isMature: body.isMature ?? false,
        },
      })

      artCollectionId = collection.id
    }

    const dataInput: Prisma.DreamUncheckedCreateInput = {
      title,
      slug,
      description: body.description ?? null,
      currentVibe,
      currentPrompt: body.currentPrompt ?? null,
      userId: user.id,
      pitchId: normalizeNullableId(body.pitchId),
      artId: normalizeNullableId(body.artId),
      artImageId: normalizeNullableId(body.artImageId),
      textServerId: normalizeNullableId(body.textServerId),
      artServerId: normalizeNullableId(body.artServerId),
      artCollectionId,
      galleryId: normalizeNullableId(body.galleryId),
      scenarioId: normalizeNullableId(body.scenarioId),
      accessMode,
      privacyCode,
      isPublic: body.isPublic ?? accessModeToIsPublic(accessMode),
      isMature: body.isMature ?? false,
      isActive: body.isActive ?? true,
    }

    const data = await prisma.dream.create({
      data: dataInput,
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
        Characters: true,
        Rewards: true,
        Tags: true,
        _count: {
          select: {
            Chats: true,
            Reactions: true,
            Characters: true,
            Rewards: true,
          },
        },
      },
    })

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
      data: redactDreamAccess(data, true),
      statusCode: 201,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to create dream.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
