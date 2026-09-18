import { getQuery, type H3Event } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import { validateApiKey } from '~/server/utils/validateKey'
import { userRoles } from '~/server/utils/authUser'
import {
  isMaturityRestricted,
  viewerShowsMature,
} from '~/server/utils/contentAccess'

export type QueryValue =
  string | number | boolean | null | undefined | QueryValue[]

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
  /** CHILD: the hard barrier, which no preference or parameter lifts. */
  restricted: boolean
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
    /*
     * The parameter may only NARROW. This read `requestedMature ||
     * user.showMature`, so an adult with the maturity toggle OFF could hand
     * themselves mature images with `?showMature=true` -- a preference a caller
     * can override is not a preference. Undefined when absent, so a surface
     * that says nothing gets the account's own answer.
     */
    const raw = query.showMature ?? query.includeMature ?? query.mature
    const requestedMature =
      raw === undefined || raw === null ? undefined : readBoolean(raw, true)
    const showMature =
      isAuthenticated && viewerShowsMature(user, requestedMature)

    return {
      userId: isAuthenticated ? Number(user?.id) : null,
      isAdmin: isAuthenticated && isAdminUser(user),
      showMature,
      isAuthenticated,
      restricted: isMaturityRestricted(user),
    }
  } catch {
    return {
      userId: null,
      isAdmin: false,
      showMature: false,
      isAuthenticated: false,
      restricted: true,
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

  /*
   * NO OWN-ROWS CARVE-OUT ON A LISTING. Silas, 2026-09-18: "I might click the
   * maturity toggle in order to safeguard the page display if I have people
   * over." A safeguard that leaves your OWN mature rows on screen is not a
   * safeguard -- on a browse surface, your own content is most of what is on it.
   *
   * The carve-out belongs to a DIRECT fetch of one object you are working with
   * (art/image/:id), not to a grid someone else may be looking at.
   */
  const matureWhere: Prisma.ArtImageWhereInput = showMature
    ? {}
    : { isMature: false }

  return {
    AND: [visibilityWhere, matureWhere],
  }
}

/**
 * The ArtCollection half of the same rule buildArtImageWhere() states for
 * ArtImage: an admin sees every collection, a signed-in viewer sees public ones
 * plus their own, everyone else sees public ones -- and a mature collection is
 * excluded unless the viewer may be shown mature content at all.
 *
 * Collections went unfiltered until 2026-09-17: /api/art/collection and
 * /api/art/collection/:id both selected `isPublic` rather than filtering on it,
 * and served every collection, private and mature, to anyone who asked.
 */
export function buildArtCollectionWhere({
  userId,
  isAdmin,
  showMature,
  isAuthenticated,
}: ArtImageAccessContext): Prisma.ArtCollectionWhereInput {
  const privacy: Prisma.ArtCollectionWhereInput = isAdmin
    ? {}
    : isAuthenticated && userId
      ? { OR: [{ isPublic: true }, { userId }] }
      : { isPublic: true }

  return { AND: [privacy, showMature ? {} : { isMature: false }] }
}

export function buildArtImageSelect(query: Record<string, QueryValue> = {}) {
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
  } satisfies Prisma.ArtImageSelect
}
