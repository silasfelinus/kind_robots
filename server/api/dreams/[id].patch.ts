// /server/api/dreams/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { H3Event } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import {
  accessModeToIsPublic,
  assertDreamAccess,
  normalizeDreamAccessMode,
  normalizeDreamPrivacyCode,
  redactDreamAccess,
  type DreamAccessMode,
} from './index'

type DreamPatchBody = {
  title?: string
  slug?: string | null
  description?: string | null
  currentVibe?: string
  currentPrompt?: string | null
  artImageId?: number | null
  textServerId?: number | null
  artServerId?: number | null
  accessMode?: DreamAccessMode
  privacyCode?: string | null
  isPublic?: boolean
  isMature?: boolean
  isActive?: boolean
  characterIds?: number[]
  rewardIds?: number[]
  artCollectionIds?: number[]
  addArtImageToCollections?: boolean
  updateNote?: string | null
}

const dreamInclude = {
  User: {
    select: {
      id: true,
      username: true,
      avatarImage: true,
    },
  },
  ArtImage: {
    select: {
      id: true,
      fileName: true,
      fileType: true,
      imagePath: true,
      path: true,
      artPrompt: true,
      promptString: true,
      userId: true,
      isPublic: true,
      isMature: true,
    },
  },
  ArtCollection: {
    select: {
      id: true,
      label: true,
      description: true,
      isPublic: true,
      isMature: true,
      isActive: true,
      artPrompt: true,
      ArtImages: {
        take: 12,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          fileName: true,
          fileType: true,
          path: true,
          promptString: true,
          imagePath: true,
          userId: true,
          isPublic: true,
          isMature: true,
        },
      },
    },
  },
  Characters: {
    select: {
      id: true,
      name: true,
      honorific: true,
      title: true,
      role: true,
      species: true,
      class: true,
      gender: true,
      presentation: true,
      alignment: true,
      genre: true,
      personality: true,
      drive: true,
      backstory: true,
      quirks: true,
      imagePath: true,
      artImageId: true,
      artPrompt: true,
      isPublic: true,
      isMature: true,
      userId: true,
    },
  },
  Rewards: {
    select: {
      id: true,
      label: true,
      icon: true,
      text: true,
      power: true,
      collection: true,
      rarity: true,
      imagePath: true,
      artImageId: true,
      isPublic: true,
      isMature: true,
      userId: true,
    },
  },
  _count: {
    select: {
      Chats: true,
      Reactions: true,
      Characters: true,
      Rewards: true,
    },
  },
} satisfies Prisma.DreamInclude

function getDreamId(event: H3Event): number {
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

function normalizeIdArray(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined

  const ids = value.map(Number).filter((id) => Number.isInteger(id) && id > 0)

  return Array.from(new Set(ids))
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

function normalizeOptionalText(value: unknown): string | null | undefined {
  if (value === null) return null
  if (value === undefined) return undefined
  if (typeof value !== 'string') return undefined

  return value.trim()
}

function getUpdateSummary(body: DreamPatchBody): string {
  const changes: string[] = []

  if (body.title !== undefined) changes.push('name')
  if (body.description !== undefined) changes.push('description')
  if (body.currentVibe !== undefined) changes.push('vibe')
  if (body.currentPrompt !== undefined) changes.push('prompt')
  if (body.artImageId !== undefined) changes.push('visuals')
  if (body.artCollectionIds !== undefined) changes.push('collections')
  if (body.characterIds !== undefined) changes.push('cast')
  if (body.rewardIds !== undefined) changes.push('items')

  if (body.accessMode !== undefined || body.privacyCode !== undefined) {
    changes.push('access')
  }

  if (
    body.isPublic !== undefined ||
    body.isMature !== undefined ||
    body.isActive !== undefined
  ) {
    changes.push('settings')
  }

  if (!changes.length) return 'Dream updated.'

  return `Dream updated: ${changes.join(', ')}.`
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
      select: {
        id: true,
        userId: true,
        title: true,
        isPublic: true,
        accessMode: true,
        privacyCode: true,
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

    const body = await readBody<DreamPatchBody>(event)

    if (!body || Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

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

    if (body.description !== undefined) {
      dataInput.description = normalizeOptionalText(body.description)
    }

    if (typeof body.currentVibe === 'string') {
      const currentVibe = body.currentVibe.trim()

      if (!currentVibe) {
        throw createError({
          statusCode: 400,
          message: 'The "currentVibe" field cannot be empty.',
        })
      }

      dataInput.currentVibe = currentVibe
    }

    if (body.currentPrompt !== undefined) {
      dataInput.currentPrompt = normalizeOptionalText(body.currentPrompt)
    }

    if (body.artImageId !== undefined) {
      const artImageId = normalizeNullableId(body.artImageId)

      dataInput.ArtImage =
        artImageId === null
          ? {
              disconnect: true,
            }
          : artImageId
            ? {
                connect: {
                  id: artImageId,
                },
              }
            : undefined
    }

    if (body.textServerId !== undefined) {
      dataInput.textServerId = normalizeNullableId(body.textServerId)
    }

    if (body.artServerId !== undefined) {
      dataInput.artServerId = normalizeNullableId(body.artServerId)
    }

    if (body.accessMode !== undefined) {
      const accessMode = normalizeDreamAccessMode(
        body.accessMode,
        existingDream.accessMode || 'OPEN',
      )

      dataInput.accessMode = accessMode
      dataInput.isPublic = accessModeToIsPublic(accessMode)

      if (accessMode !== 'CODE') {
        dataInput.privacyCode = null
      }
    }

    if (body.privacyCode !== undefined) {
      const accessMode =
        (dataInput.accessMode as DreamAccessMode | undefined) ||
        existingDream.accessMode ||
        'OPEN'

      const privacyCode = normalizeDreamPrivacyCode(body.privacyCode)

      if (accessMode === 'CODE' && !privacyCode) {
        throw createError({
          statusCode: 400,
          message: 'A privacy code is required when accessMode is CODE.',
        })
      }

      dataInput.privacyCode = accessMode === 'CODE' ? privacyCode : null
    }

    if (typeof body.isPublic === 'boolean' && body.accessMode === undefined) {
      dataInput.isPublic = body.isPublic
    }

    if (typeof body.isMature === 'boolean') {
      dataInput.isMature = body.isMature
    }

    if (typeof body.isActive === 'boolean') {
      dataInput.isActive = body.isActive
    }

    const characterIds = normalizeIdArray(body.characterIds)
    const rewardIds = normalizeIdArray(body.rewardIds)
    const artCollectionIds = normalizeIdArray(body.artCollectionIds)

    const data = await prisma.dream.update({
      where: { id },
      data: {
        ...dataInput,
        ...(characterIds
          ? {
              Characters: {
                set: characterIds.map((characterId) => ({ id: characterId })),
              },
            }
          : {}),
        ...(rewardIds
          ? {
              Rewards: {
                set: rewardIds.map((rewardId) => ({ id: rewardId })),
              },
            }
          : {}),
        ...(artCollectionIds
          ? {
              ArtCollection: artCollectionIds[0]
                ? {
                    connect: {
                      id: artCollectionIds[0],
                    },
                  }
                : {
                    disconnect: true,
                  },
            }
          : {}),
      },
      include: dreamInclude,
    })

    if (
      body.addArtImageToCollections &&
      data.artImageId &&
      data.artCollectionId
    ) {
      await prisma.artCollection.update({
        where: {
          id: data.artCollectionId,
        },
        data: {
          ArtImages: {
            connect: {
              id: data.artImageId,
            },
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
    const updateNote = normalizeOptionalText(body.updateNote)
    const content = updateNote || getUpdateSummary(body)

    await prisma.chat.create({
      data: {
        type: 'Dream',
        sender,
        content,
        title: data.title,
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
      data: redactDreamAccess(data, true),
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
