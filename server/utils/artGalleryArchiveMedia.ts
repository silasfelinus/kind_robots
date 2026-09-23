// /server/utils/artGalleryArchiveMedia.ts
//
// Short-lived capability URLs for archive-backed ArtImages shown by the normal
// Gallery. Kind Robots authenticates API requests with Authorization/x-api-key
// headers, and a plain <img> request cannot send either. The Gallery therefore
// needs the authenticated JSON response to mint a URL the browser can load.
//
// The signature is bound to ArtImage id + variant + expiry. It is minted only
// after an ArtImage has already passed buildArtImageWhere() in the collection
// API, so possession of the URL is the temporary read capability. A copied URL
// expires on its own and cannot be changed from thumbnail to full/medium.
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export type GalleryArchiveMediaVariant = 'full' | 'thumbnail' | 'medium'

export const GALLERY_ARCHIVE_MEDIA_TTL_MS = 6 * 60 * 60 * 1000

const KEY_LABEL = 'kind-robots/art-gallery-archive-media/v1'
let cachedKey: Buffer | null = null

type ArchiveBackedArtImage = {
  id?: number | null
  designer?: string | null
  imagePath?: string | null
}

function signingKey(): Buffer {
  if (cachedKey) return cachedKey

  const base = (
    process.env.ARCHIVE_MEDIA_SECRET ||
    process.env.BETA_ADMIN_TOKEN ||
    process.env.ADMIN_TOKEN ||
    ''
  ).trim()

  cachedKey = base
    ? createHmac('sha256', KEY_LABEL).update(base).digest()
    : randomBytes(32)

  return cachedKey
}

/** Test seam for environment-key changes. */
export function resetGalleryArchiveMediaKey(): void {
  cachedKey = null
}

export function signGalleryArchiveMedia(
  artImageId: number,
  variant: GalleryArchiveMediaVariant,
  expiresAt: number,
): string {
  return createHmac('sha256', signingKey())
    .update(`${artImageId}:${variant}:${expiresAt}`)
    .digest('base64url')
}

export function galleryArchiveMediaUrl(
  artImageId: number,
  variant: GalleryArchiveMediaVariant = 'medium',
  now: number = Date.now(),
): string {
  const expiresAt = now + GALLERY_ARCHIVE_MEDIA_TTL_MS
  const signature = signGalleryArchiveMedia(artImageId, variant, expiresAt)
  return `/api/art/image/archive/${artImageId}?variant=${variant}&exp=${expiresAt}&sig=${signature}`
}

export function verifyGalleryArchiveMedia(
  artImageId: number,
  variant: GalleryArchiveMediaVariant,
  expiresAt: unknown,
  signature: unknown,
  now: number = Date.now(),
): boolean {
  const expiry = Number(expiresAt)
  if (!Number.isFinite(expiry) || expiry <= now) return false
  // Do not accept arbitrarily long-lived caller-chosen capabilities.
  if (expiry - now > GALLERY_ARCHIVE_MEDIA_TTL_MS) return false
  if (typeof signature !== 'string' || !signature) return false

  const expected = Buffer.from(
    signGalleryArchiveMedia(artImageId, variant, expiry),
    'utf8',
  )
  const provided = Buffer.from(signature, 'utf8')
  if (expected.length !== provided.length) return false
  return timingSafeEqual(expected, provided)
}

/**
 * The caller MUST pass only rows that already survived the current viewer's
 * server-side visibility filter. This helper adds no authority of its own; it
 * only turns that already-approved row into an <img>-loadable capability.
 */
export function attachGalleryArchiveMediaPaths<T extends ArchiveBackedArtImage>(
  rows: T[],
  variant: GalleryArchiveMediaVariant = 'medium',
): T[] {
  for (const row of rows) {
    const id = Number(row.id)
    if (row.designer === 'art-archive' && Number.isInteger(id) && id > 0) {
      row.imagePath = galleryArchiveMediaUrl(id, variant)
    }
  }
  return rows
}
