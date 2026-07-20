// /server/api/art/image/[id].patch.ts
import { defineEventHandler, createError, readBody, type H3Event } from 'h3'
import type { ArtImage, Prisma } from '~/prisma/generated/prisma/client'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'
import { assertArtImageRelationsAttachable } from './relations'

type PatchUser = {
  id: number
  isAdmin: boolean
}

// Owner transfer is intentionally NOT part of the general patch contract: a
// dedicated administrative endpoint should own reassignment. `userId` is
// therefore absent from this allowlist, so neither an owner nor an admin can
// change an ArtImage's owner through the ordinary PATCH route (audit F-1).
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
  // Same machine auth as the rest of the art API (JWT / user apiKey /
  // beta-admin token) so a token that can READ can also WRITE. Throws 401.
  const auth = await requireMachineUser(event)

  return {
    id: auth.user.id,
    isAdmin: auth.isAdmin,
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

    if (Object.keys(updateData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No valid ArtImage fields provided for update.',
      })
    }

    // A connected Server / checkpoint Resource must exist and be public or owned
    // by the caller (admins bypass the permission check). Raw scalar FK writes
    // were previously unchecked (audit F-2 residual).
    await assertArtImageRelationsAttachable(
      {
        serverId:
          typeof updateData.serverId === 'number' ? updateData.serverId : null,
        checkpointResourceId:
          typeof updateData.checkpointResourceId === 'number'
            ? updateData.checkpointResourceId
            : null,
      },
      user.id,
      user.isAdmin,
    )

    const data: ArtImage = await prisma.artImage.update({
      where: { id },
      data: updateData,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `ArtImage #${id} updated successfully.`,
      data,
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
