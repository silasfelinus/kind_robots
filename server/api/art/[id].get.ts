// /server/api/art/[id].get.ts
import { defineEventHandler, createError, getQuery, type H3Event } from 'h3'
import type { Art, Prisma } from '~/prisma/generated/prisma/client'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'

type ValidatedUser = {
  id?: number | null
  Role?: string | null
  role?: string | null
  isAdmin?: boolean | null
  showMature?: boolean | null
}

type AccessContext = {
  userId: number | null
  isAdmin: boolean
  showMature: boolean
  isAuthenticated: boolean
}

type QueryValue = string | number | boolean | null | undefined | QueryValue[]

function readBoolean(value: unknown, fallback = false): boolean {
  if (Array.isArray(value)) return readBoolean(value[0], fallback)
  if (value == null) return fallback

  const normalized = String(value).trim().toLowerCase()

  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true
  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false

  return fallback
}

function isAdminUser(user: ValidatedUser | null | undefined): boolean {
  if (!user) return false

  const role = String(user.Role || user.role || '').toLowerCase()

  return Boolean(user.isAdmin || role === 'admin' || role === 'system')
}

async function getAccessContext(event: H3Event): Promise<AccessContext> {
  const query = getQuery(event) as Record<string, QueryValue>

  try {
    const auth = await validateApiKey(event)
    const user = auth.user as ValidatedUser | null | undefined
    const isAuthenticated =
      Boolean(auth.isValid) && typeof user?.id === 'number'

    const requestedMature = readBoolean(
      query.showMature ?? query.includeMature ?? query.mature,
      false,
    )

    const showMature = isAuthenticated
      ? requestedMature || Boolean(user?.showMature)
      : false

    return {
      userId: isAuthenticated ? Number(user?.id) : null,
      isAdmin: isAuthenticated && isAdminUser(user),
      showMature,
      isAuthenticated,
    }
  } catch {
    return {
      userId: null,
      isAdmin: false,
      showMature: false,
      isAuthenticated: false,
    }
  }
}

function canReadArt(art: Art, access: AccessContext): boolean {
  if (!access.showMature && art.isMature) return false
  if (access.isAdmin) return true
  if (art.isPublic) return true
  if (access.isAuthenticated && access.userId && art.userId === access.userId) {
    return true
  }

  return false
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

    const access = await getAccessContext(event)
    const data = await fetchArtById(id)

    if (!data) {
      throw createError({
        statusCode: 404,
        message: `Art entry with ID ${id} not found.`,
      })
    }

    if (!canReadArt(data, access)) {
      throw createError({
        statusCode: 403,
        message: 'You are not allowed to view this art entry.',
      })
    }

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `Art #${id} retrieved successfully.`,
      data,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || `Failed to fetch Art #${id}.`,
      data: null,
    }
  }
})

export async function fetchArtById(id: number): Promise<Art | null> {
  return await prisma.art.findUnique({
    where: { id },
  })
}

export async function fetchArtByGalleryId(
  galleryId: number,
  access?: AccessContext,
): Promise<Art[]> {
  const where: Prisma.ArtWhereInput = {
    galleryId,
  }

  const data = await prisma.art.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  if (!access) return data

  return data.filter((art) => canReadArt(art, access))
}
