// /server/api/art/image/[id].patch.ts
import { defineEventHandler, createError, readBody, type H3Event } from 'h3'
import type { ArtImage, Prisma } from '~/prisma/generated/prisma/client'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { validateApiKey } from '../../../utils/validateKey'

type ValidatedUser = {
  id?: number | null
  Role?: string | null
  role?: string | null
  isAdmin?: boolean | null
}

type PatchUser = {
  id: number
  isAdmin: boolean
}

const ART_IMAGE_PATCH_FIELDS = new Set<
  keyof Prisma.ArtImageUncheckedUpdateInput
>([
  'galleryId',
  'userId',
  'imageData',
  'thumbnailData',
  'fileName',
  'fileType',
  'imagePath',
  'rarity',
  'path',
  'promptString',
  'negativePrompt',
  'checkpoint',
  'checkpointResourceId',
  'sampler',
  'seed',
  'steps',
  'cfg',
  'cfgHalf',
  'designer',
  'genres',
  'isPublic',
  'isMature',
  'serverId',
  'serverName',
  'serverUrl',
  'artId',
  'botId',
  'componentId',
  'milestoneId',
  'pitchId',
  'promptId',
  'resourceId',
  'rewardId',
  'chatId',
  'characterId',
  'butterflyId',
])

function isAdminUser(user: ValidatedUser | null | undefined): boolean {
  if (!user) return false

  const role = String(user.Role || user.role || '').toLowerCase()

  return Boolean(user.isAdmin || role === 'admin' || role === 'system')
}

async function requirePatchUser(event: H3Event): Promise<PatchUser> {
  const auth = await validateApiKey(event)
  const user = auth.user as ValidatedUser | null | undefined

  if (!auth.isValid || typeof user?.id !== 'number') {
    throw createError({
      statusCode: 401,
      message: 'Valid authorization token required.',
    })
  }

  return {
    id: Number(user.id),
    isAdmin: isAdminUser(user),
  }
}

function sanitizeArtImagePatch(
  body: Record<string, unknown>,
  user: PatchUser,
): Prisma.ArtImageUncheckedUpdateInput {
  const updateData: Prisma.ArtImageUncheckedUpdateInput = {}

  for (const [key, value] of Object.entries(body)) {
    if (
      !ART_IMAGE_PATCH_FIELDS.has(
        key as keyof Prisma.ArtImageUncheckedUpdateInput,
      )
    ) {
      continue
    }

    if (value === undefined) {
      continue
    }

    if (key === 'userId' && !user.isAdmin) {
      continue
    }

    updateData[key as keyof Prisma.ArtImageUncheckedUpdateInput] =
      value as never
  }

  return updateData
}

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)

  try {
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid ArtImage ID. It must be a positive integer.',
      })
    }

    const user = await requirePatchUser(event)

    const existing = await prisma.artImage.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: `ArtImage #${id} not found.`,
      })
    }

    if (!user.isAdmin && existing.userId !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'You are not allowed to update this art image.',
      })
    }

    const body = await readBody<Record<string, unknown>>(event)

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const updateData = sanitizeArtImagePatch(body, user)

    if (Object.keys(updateData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No valid ArtImage fields provided for update.',
      })
    }

    const data: ArtImage = await prisma.artImage.update({
      where: { id },
      data: updateData,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `ArtImage #${id} updated successfully.`,
      data,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || `Failed to update ArtImage #${id}.`,
      data: null,
    }
  }
})
