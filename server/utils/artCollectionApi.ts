import { createError } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'

export const artCollectionMutationSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  label: true,
  slug: true,
  parentFolder: true,
  isMature: true,
  isPublic: true,
  isActive: true,
  artPrompt: true,
  description: true,
  username: true,
  ArtImages: {
    orderBy: {
      id: 'desc',
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
      fileName: true,
      fileType: true,
      imagePath: true,
      path: true,
      promptString: true,
      negativePrompt: true,
      checkpoint: true,
      checkpointResourceId: true,
      sampler: true,
      seed: true,
      steps: true,
      cfg: true,
      cfgHalf: true,
      designer: true,
      genres: true,
      isPublic: true,
      isMature: true,
      isActive: true,
      artPrompt: true,
      serverId: true,
      serverName: true,
      serverUrl: true,
    },
  },
  _count: {
    select: {
      ArtImages: true,
    },
  },
} satisfies Prisma.ArtCollectionSelect

export type NormalizedIdArray = {
  provided: boolean
  ids: number[]
}

export function assertPlainObjectBody(
  value: unknown,
): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw createError({
      statusCode: 400,
      message: 'A JSON ArtCollection body is required.',
    })
  }
}

export function rejectUnknownFields(
  body: Record<string, unknown>,
  allowedFields: ReadonlySet<string>,
): void {
  const unknownFields = Object.keys(body).filter(
    (field) => !allowedFields.has(field),
  )

  if (unknownFields.length) {
    throw createError({
      statusCode: 400,
      message: `Unsupported ArtCollection fields: ${unknownFields.join(', ')}. Ownership is derived from authentication.`,
    })
  }
}

export function normalizeIdArray(
  value: unknown,
  fieldName: string,
  maxItems = 100,
): NormalizedIdArray {
  if (typeof value === 'undefined') {
    return { provided: false, ids: [] }
  }

  if (!Array.isArray(value)) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must be an array of positive integers.`,
    })
  }

  if (value.length > maxItems) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} may contain at most ${maxItems} entries.`,
    })
  }

  const ids = value.map((entry) => Number(entry))

  if (!ids.every((id) => Number.isInteger(id) && id > 0)) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must contain only positive integers.`,
    })
  }

  return {
    provided: true,
    ids: [...new Set(ids)],
  }
}

export async function assertOwnedActiveArtImages({
  ids,
  fieldName,
  userId,
  isAdmin,
}: {
  ids: number[]
  fieldName: string
  userId: number
  isAdmin: boolean
}): Promise<void> {
  if (!ids.length) return

  const images = await prisma.artImage.findMany({
    where: {
      id: { in: ids },
    },
    select: {
      id: true,
      userId: true,
      isActive: true,
    },
  })

  const imagesById = new Map(images.map((image) => [image.id, image]))
  const missingOrInactive = ids.filter((id) => {
    const image = imagesById.get(id)
    return !image || !image.isActive
  })

  if (missingOrInactive.length) {
    throw createError({
      statusCode: 404,
      message: `Missing or inactive ArtImage IDs in ${fieldName}: ${missingOrInactive.join(', ')}`,
    })
  }

  if (!isAdmin) {
    const foreignIds = ids.filter((id) => imagesById.get(id)?.userId !== userId)

    if (foreignIds.length) {
      throw createError({
        statusCode: 403,
        message: `You may only attach your own ArtImages. Unauthorized IDs in ${fieldName}: ${foreignIds.join(', ')}`,
      })
    }
  }
}

export function cleanRequiredText(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} is required.`,
    })
  }

  const text = value.trim()

  if (text.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must be ${maxLength} characters or fewer.`,
    })
  }

  return text
}

export function cleanOptionalText(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string | null | undefined {
  if (typeof value === 'undefined') return undefined
  if (value === null) return null

  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must be a string or null.`,
    })
  }

  const text = value.trim()

  if (text.length > maxLength) {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must be ${maxLength} characters or fewer.`,
    })
  }

  return text || null
}

export function cleanOptionalBoolean(
  value: unknown,
  fieldName: string,
): boolean | undefined {
  if (typeof value === 'undefined') return undefined

  if (typeof value !== 'boolean') {
    throw createError({
      statusCode: 400,
      message: `${fieldName} must be a boolean.`,
    })
  }

  return value
}
