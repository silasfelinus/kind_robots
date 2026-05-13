// /server/api/art/[id].patch.ts
import { defineEventHandler, createError, readBody, type H3Event } from 'h3'
import type { Art, Prisma } from '~/prisma/generated/prisma/client'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'

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

const ART_PATCH_FIELDS = new Set<keyof Prisma.ArtUncheckedUpdateInput>([
  'path',
  'checkpoint',
  'checkpointResourceId',
  'sampler',
  'seed',
  'steps',
  'designer',
  'isPublic',
  'isMature',
  'promptId',
  'userId',
  'pitchId',
  'galleryId',
  'promptString',
  'cfg',
  'cfgHalf',
  'serverId',
  'serverName',
  'serverUrl',
  'artImageId',
  'imagePath',
  'genres',
  'negativePrompt',
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

function sanitizeArtPatch(
  body: Record<string, unknown>,
  user: PatchUser,
): Prisma.ArtUncheckedUpdateInput {
  const updateData: Prisma.ArtUncheckedUpdateInput = {}

  for (const [key, value] of Object.entries(body)) {
    if (!ART_PATCH_FIELDS.has(key as keyof Prisma.ArtUncheckedUpdateInput)) {
      continue
    }

    if (value === undefined) {
      continue
    }

    if (key === 'userId' && !user.isAdmin) {
      continue
    }

    updateData[key as keyof Prisma.ArtUncheckedUpdateInput] = value as never
  }

  return updateData
}

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)

  try {
    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Art ID. It must be a positive integer.',
      })
    }

    const user = await requirePatchUser(event)

    const existing = await prisma.art.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: `Art entry with ID ${id} does not exist.`,
      })
    }

    if (!user.isAdmin && existing.userId !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'You are not allowed to update this art entry.',
      })
    }

    const body = await readBody<Record<string, unknown>>(event)

    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const updateData = sanitizeArtPatch(body, user)

    if (Object.keys(updateData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No valid Art fields provided for update.',
      })
    }

    const data: Art = await prisma.art.update({
      where: { id },
      data: updateData,
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `Art #${id} updated successfully.`,
      data,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || `Failed to update Art #${id}.`,
      data: null,
    }
  }
})
