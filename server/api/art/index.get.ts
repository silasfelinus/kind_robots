// /server/api/art/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
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

type ArtAccessContext = {
  userId: number | null
  isAdmin: boolean
  showMature: boolean
  isAuthenticated: boolean
}

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

  return Boolean(user.isAdmin || role === 'admin' || role === 'superadmin')
}

async function getArtAccessContext(
  event: Parameters<typeof getQuery>[0],
): Promise<ArtAccessContext> {
  const query = getQuery(event)

  try {
    const auth = await validateApiKey(event)
    const user = auth.user as ValidatedUser | null | undefined
    const isAuthenticated =
      Boolean(auth.isValid) && typeof user?.id === 'number'

    const queryShowMature = readBoolean(
      query.showMature ?? query.includeMature ?? query.mature,
      false,
    )

    const showMature = isAuthenticated
      ? readBoolean(queryShowMature, Boolean(user?.showMature))
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

function buildArtWhere({
  userId,
  isAdmin,
  showMature,
  isAuthenticated,
}: ArtAccessContext): Prisma.ArtWhereInput {
  const visibilityWhere: Prisma.ArtWhereInput = isAdmin
    ? {}
    : isAuthenticated && userId
      ? {
          OR: [{ isPublic: true }, { userId }],
        }
      : {
          isPublic: true,
        }

  const matureWhere: Prisma.ArtWhereInput = showMature
    ? {}
    : {
        isMature: false,
      }

  return {
    AND: [visibilityWhere, matureWhere],
  }
}

export default defineEventHandler(async (event) => {
  try {
    const access = await getArtAccessContext(event)
    const where = buildArtWhere(access)

    const data = await prisma.art.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: access.isAdmin
        ? `All accessible art retrieved for admin.`
        : access.isAuthenticated
          ? `Public and user art retrieved for user ${access.userId}.`
          : 'Public art retrieved successfully.',
      data,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to fetch art entries.',
      data: [],
    }
  }
})

export async function fetchAllArt(
  access: ArtAccessContext = {
    userId: null,
    isAdmin: false,
    showMature: false,
    isAuthenticated: false,
  },
) {
  return await prisma.art.findMany({
    where: buildArtWhere(access),
    orderBy: { createdAt: 'desc' },
  })
}
