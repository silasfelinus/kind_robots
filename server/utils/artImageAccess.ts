import { getQuery, type H3Event } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import { validateApiKey } from '~/server/utils/validateKey'
import { userRoles } from '~/server/utils/authUser'
import { isMaturityRestricted } from '~/server/utils/contentAccess'

export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | QueryValue[]

type ValidatedUser = {
  id?: number | null
  Role?: string | null
  role?: string | null
  roles?: string[] | null
  isAdmin?: boolean | null
  showMature?: boolean | null
}

export type ArtImageAccessContext = {
  userId: number | null
  isAdmin: boolean
  showMature: boolean
  isAuthenticated: boolean
}

export function readBoolean(value: unknown, fallback = false): boolean {
  if (Array.isArray(value)) return readBoolean(value[0], fallback)
  if (value == null) return fallback

  const normalized = String(value).trim().toLowerCase()

  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true
  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false

  return fallback
}

function isAdminUser(user: ValidatedUser | null | undefined): boolean {
  if (!user) return false
  if (user.isAdmin) return true

  return userRoles({
    id: user.id ?? 0,
    Role: user.Role ?? user.role,
    roles: user.roles,
  }).has('ADMIN')
}

export async function getArtImageAccessContext(
  event: H3Event,
): Promise<ArtImageAccessContext> {
  const query = getQuery(event)

  try {
    const auth = await validateApiKey(event)
    const user = auth.user as ValidatedUser | null | undefined
    const isAuthenticated =
      Boolean(auth.isValid) && typeof user?.id === 'number'
    const requestedMature = readBoolean(
      query.showMature ?? query.includeMature ?? query.mature,
      false,
    )
    const showMature =
      isAuthenticated &&
      !isMaturityRestricted(user) &&
      (requestedMature || user?.showMature === true)

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

export function buildArtImageWhere({
  userId,
  isAdmin,
  showMature,
  isAuthenticated,
}: ArtImageAccessContext): Prisma.ArtImageWhereInput {
  const visibilityWhere: Prisma.ArtImageWhereInput = isAdmin
    ? {}
    : isAuthenticated && userId
      ? { OR: [{ isPublic: true }, { userId }] }
      : { isPublic: true }

  const matureWhere: Prisma.ArtImageWhereInput = showMature
    ? {}
    : { isMature: false }

  return {
    AND: [visibilityWhere, matureWhere],
  }
}

export function buildArtImageSelect(
  query: Record<string, QueryValue> = {},
): Prisma.ArtImageSelect {
  const includeImageData = readBoolean(query.includeImageData, false)
  const includeThumbnailData = readBoolean(query.includeThumbnailData, false)

  return {
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
    serverId: true,
    serverName: true,
    serverUrl: true,
    imageData: includeImageData,
    thumbnailData: includeThumbnailData,
  }
}
