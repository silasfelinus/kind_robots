import { getCookie, getQuery, type H3Event } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import {
  validateApiKey,
  validateApiKeyString,
  type ValidateResult,
} from '~/server/utils/validateKey'
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

/**
 * Whether one ArtImage, asked for by id or by its file, may be shown to this
 * viewer. The by-id API route and the /images file route share it so the
 * bytes can never be easier to reach than the record.
 */
export function canReadArtImage(
  image: {
    userId?: number | null
    isPublic?: boolean | null
    isMature?: boolean | null
  },
  access: ArtImageAccessContext,
): boolean {
  if (access.isAdmin) return true

  /*
   * YOUR OWN IMAGE, FETCHED BY ID, IS YOURS. This route is how a tool loads the
   * one image someone is already working with -- sceneAnimatorStore reads an
   * animation source through it -- and taking that away from an opted-out adult
   * mid-task is a bug, not a protection. A maturity-RESTRICTED account keeps the
   * hard barrier even here: a CHILD should not have mature images, and hiding
   * one is the protective direction.
   *
   * Deliberately narrow to by-id reads. Listings do not do this, because a
   * grid is what someone else in the room can see.
   */
  const isOwner = Boolean(
    access.isAuthenticated && access.userId && image.userId === access.userId,
  )

  if (isOwner && !access.restricted) return true

  if (!access.showMature && image.isMature) return false

  if (image.isPublic) return true

  if (isOwner) return true

  return false
}

/*
 * Who is asking for an image FILE. A plain <img> request cannot send the
 * Authorization header the API uses, so the HttpOnly `kind-session` cookie --
 * set at login and on token validation, already trusted by first-party SSO --
 * stands in for it. A header still wins when an API client sends one.
 */
export async function getMediaViewerAccessContext(
  event: H3Event,
): Promise<ArtImageAccessContext> {
  const anonymous: ArtImageAccessContext = {
    userId: null,
    isAdmin: false,
    showMature: false,
    isAuthenticated: false,
    restricted: true,
  }

  try {
    let auth: ValidateResult = await validateApiKey(event)
    if (!auth.isValid) {
      const cookie = getCookie(event, 'kind-session')?.trim() ?? ''
      if (!cookie) return anonymous
      auth = await validateApiKeyString(cookie)
    }

    const user = auth.user as ValidatedUser | null | undefined
    if (!auth.isValid || typeof user?.id !== 'number') return anonymous

    return {
      userId: Number(user.id),
      isAdmin: isAdminUser(user),
      showMature: viewerShowsMature(user),
      isAuthenticated: true,
      restricted: isMaturityRestricted(user),
    }
  } catch {
    return anonymous
  }
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
  restricted,
}: ArtImageAccessContext): Prisma.ArtImageWhereInput {
  const visibilityWhere: Prisma.ArtImageWhereInput = isAdmin
    ? {}
    : isAuthenticated && userId
      ? { OR: [{ isPublic: true }, { userId }] }
      : { isPublic: true }

  /*
   * YOUR OWN MATURE ROWS ARRIVE; THEY ARE COVERED, NOT ABSENT.
   *
   * Silas, 2026-09-18: "in the case of mature objects I own, it's better to
   * carve them out on the listing, it's more likely that I want them hidden for
   * situational propriety, not gone for good."
   *
   * So the toggle is a curtain over your own work, not a delete. The row is
   * delivered with its isMature flag and the card covers it, with an uncover
   * the owner can use. Other people's mature content is still absent -- there
   * is nothing to uncover and no reason to ship it.
   *
   * The carve-out is the PREFERENCE only. A maturity-restricted account keeps
   * the hard barrier even on its own rows: a CHILD should not have mature
   * images, and hiding one is the protective direction.
   */
  const matureWhere: Prisma.ArtImageWhereInput = showMature
    ? {}
    : isAuthenticated && userId && !restricted
      ? { OR: [{ isMature: false }, { userId }] }
      : { isMature: false }

  return {
    AND: [{ isActive: true }, visibilityWhere, matureWhere],
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
  restricted,
}: ArtImageAccessContext): Prisma.ArtCollectionWhereInput {
  const privacy: Prisma.ArtCollectionWhereInput = isAdmin
    ? {}
    : isAuthenticated && userId
      ? { OR: [{ isPublic: true }, { userId }] }
      : { isPublic: true }

  // Same carve-out as buildArtImageWhere: your own mature collections are
  // covered by the card, not withheld by the query.
  const mature: Prisma.ArtCollectionWhereInput = showMature
    ? {}
    : isAuthenticated && userId && !restricted
      ? { OR: [{ isMature: false }, { userId }] }
      : { isMature: false }

  return { AND: [privacy, mature] }
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

export type GalleryMaturityFilter = 'all' | 'mature' | 'safe'
export type GalleryPrivacyFilter = 'all' | 'public' | 'private'

export function readGalleryPrivacyFilter(
  value: QueryValue,
): GalleryPrivacyFilter {
  const raw = Array.isArray(value) ? value[0] : value
  const normalized = String(raw ?? 'public')
    .trim()
    .toLowerCase()
  if (normalized === 'private' || normalized === 'all') return normalized
  return 'public'
}

export function readGalleryMaturityFilter(
  value: QueryValue,
): GalleryMaturityFilter {
  const raw = Array.isArray(value) ? value[0] : value
  const normalized = String(raw ?? 'all')
    .trim()
    .toLowerCase()
  if (normalized === 'mature' || normalized === 'safe') return normalized
  return 'all'
}

/**
 * The Gallery's explicit display filters, applied ON TOP of
 * buildArtImageWhere(): they only ever narrow what access already allows.
 * "private" is owner-only even for admins.
 */
export function buildGalleryFilterWhere(
  access: ArtImageAccessContext,
  privacy: GalleryPrivacyFilter,
  maturity: GalleryMaturityFilter,
): Prisma.ArtImageWhereInput[] {
  const maturityWhere: Prisma.ArtImageWhereInput =
    maturity === 'all' ? {} : { isMature: maturity === 'mature' }
  const privacyWhere: Prisma.ArtImageWhereInput =
    privacy === 'all'
      ? {}
      : privacy === 'public'
        ? { isPublic: true }
        : access.userId
          ? { isPublic: false, userId: access.userId }
          : { id: -1 }
  return [privacyWhere, maturityWhere]
}
