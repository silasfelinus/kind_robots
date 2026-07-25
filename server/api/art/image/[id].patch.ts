// /server/api/art/image/[id].patch.ts
import { defineEventHandler, createError, readBody, type H3Event } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'
import { assertArtImageRelationsAttachable } from './relations'
import { artImageMutationSelect } from './selects'

type PatchUser = {
  id: number
  isAdmin: boolean
  isServerKey: boolean
}

type LoraRelationPatch = {
  loraResourceIds: number[]
  disconnectLoraResourceIds: number[]
  clearLoraResources: boolean
}

const ART_IMAGE_PATCH_FIELDS = new Set<
  keyof Prisma.ArtImageUncheckedUpdateInput
>([
  'imageData',
  'thumbnailData',
  'thumbnailPath',
  'heroData',
  'heroPath',
  'cardData',
  'cardPath',
  'iconData',
  'iconPath',
  'fileName',
  'fileType',
  'imagePath',
  'path',
  'promptString',
  'artPrompt',
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
  'isActive',
  'serverId',
  'serverName',
  'serverUrl',
])

async function requirePatchUser(event: H3Event): Promise<PatchUser> {
  const auth = await requireMachineUser(event)

  return {
    id: auth.user.id,
    isAdmin: auth.isAdmin,
    isServerKey: auth.isServerKey,
  }
}

function normalizeIdArray(value: unknown, fieldName: string): number[] {
  if (typeof value === 'undefined' || value === null) return []

  if (!Array.isArray(value)) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must be an array of positive integers.`,
    })
  }

  const ids = value.map((entry) => Number(entry))

  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must contain only positive integers.`,
    })
  }

  return [...new Set(ids)]
}

function readLoraRelationPatch(body: Record<string, unknown>): LoraRelationPatch {
  const loraResourceIds = normalizeIdArray(
    body.loraResourceIds,
    'loraResourceIds',
  )
  const connectIds = new Set(loraResourceIds)
  const disconnectLoraResourceIds = normalizeIdArray(
    body.disconnectLoraResourceIds,
    'disconnectLoraResourceIds',
  ).filter((id) => !connectIds.has(id))

  if (
    typeof body.clearLoraResources !== 'undefined' &&
    typeof body.clearLoraResources !== 'boolean'
  ) {
    throw createError({
      statusCode: 400,
      message: 'clearLoraResources must be a boolean.',
    })
  }

  return {
    loraResourceIds,
    disconnectLoraResourceIds,
    clearLoraResources: body.clearLoraResources === true,
  }
}

function sanitizeArtImagePatch(
  body: Record<string, unknown>,
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

    updateData[key as keyof Prisma.ArtImageUncheckedUpdateInput] =
      value as never
  }

  return updateData
}

function buildLoraRelationData(
  patch: LoraRelationPatch,
): Prisma.ArtImageUpdateInput {
  if (patch.clearLoraResources) {
    return { LoraResources: { set: [] } }
  }

  if (
    !patch.loraResourceIds.length &&
    !patch.disconnectLoraResourceIds.length
  ) {
    return {}
  }

  return {
    LoraResources: {
      ...(patch.loraResourceIds.length
        ? {
            connect: patch.loraResourceIds.map((id) => ({ id })),
          }
        : {}),
      ...(patch.disconnectLoraResourceIds.length
        ? {
            disconnect: patch.disconnectLoraResourceIds.map((id) => ({ id })),
          }
        : {}),
    },
  }
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

    const updateData = sanitizeArtImagePatch(body)
    const loraPatch = readLoraRelationPatch(body)
    const hasLoraPatch =
      loraPatch.clearLoraResources ||
      loraPatch.loraResourceIds.length > 0 ||
      loraPatch.disconnectLoraResourceIds.length > 0

    if (Object.keys(updateData).length === 0 && !hasLoraPatch) {
      throw createError({
        statusCode: 400,
        message: 'No valid ArtImage fields provided for update.',
      })
    }

    await assertArtImageRelationsAttachable(
      {
        serverId:
          typeof updateData.serverId === 'number' ? updateData.serverId : null,
        checkpointResourceId:
          typeof updateData.checkpointResourceId === 'number'
            ? updateData.checkpointResourceId
            : null,
        loraResourceIds: loraPatch.loraResourceIds,
      },
      user.id,
      user.isAdmin || user.isServerKey,
    )

    const relationData = buildLoraRelationData(loraPatch)
    const data = {
      ...updateData,
      ...relationData,
    } as Prisma.ArtImageUpdateInput

    const updated = await prisma.artImage.update({
      where: { id },
      data,
      select: artImageMutationSelect,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `ArtImage #${id} updated successfully.`,
      data: updated,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || `Failed to update ArtImage #${id}.`,
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
