// /utils/artImageSrc.ts
//
// Path-first ArtImage rendering. The database is provisioned for path-only art,
// so rendering prefers a stored path (URL) and only falls back to inline base64
// for rows that have no path yet — e.g. a fresh upload whose bytes haven't been
// written to a path. This keeps upload/save flows working while letting the API
// stop shipping (and eventually storing) heavy base64 blobs for pathed art.

export type ArtImageSrcLike =
  | {
      imagePath?: string | null
      path?: string | null
      thumbnailPath?: string | null
      cardPath?: string | null
      heroPath?: string | null
      iconPath?: string | null
      imageData?: string | null
      thumbnailData?: string | null
      cardData?: string | null
      heroData?: string | null
      iconData?: string | null
      fileType?: string | null
    }
  | null
  | undefined

function cleanValue(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

// Turn a base64 (or already-data-URI) blob into a renderable data URI. Empty
// input yields '' so callers can fall through to a fallback.
export function toArtDataUri(
  data: string | null | undefined,
  fileType?: string | null,
): string {
  const raw = cleanValue(data)
  if (!raw) return ''
  if (raw.startsWith('data:')) return raw
  const type = cleanValue(fileType) || 'png'
  return `data:image/${type};base64,${raw}`
}

// Renderable source for a full-size ArtImage. Prefers imagePath / path; falls
// back to inline base64 only when no path exists; then to `fallback`.
export function resolveArtImageSrc(
  image: ArtImageSrcLike,
  fallback = '',
): string {
  const path = cleanValue(image?.imagePath) || cleanValue(image?.path)
  if (path) return path
  return toArtDataUri(image?.imageData, image?.fileType) || fallback
}

export type ArtVariant = 'card' | 'hero' | 'icon'

const VARIANT_PATH_KEYS = {
  card: 'cardPath',
  hero: 'heroPath',
  icon: 'iconPath',
} as const

const VARIANT_DATA_KEYS = {
  card: 'cardData',
  hero: 'heroData',
  icon: 'iconData',
} as const

/**
 * Renderable source for a purpose-built art variant.
 *
 * These three slots have existed on the type since the card/hero/icon migration
 * (interface-vision t-007), but until now nothing read them: the only resolvers
 * were the full-size and thumbnail ones, so every card fell back to the entity's
 * avatar or primary image. That left hundreds of rendered card images sitting in
 * the database, invisible.
 *
 * Degrades deliberately: variant path -> variant base64 -> the full-size
 * resolver -> `fallback`. A slot that has not rendered yet therefore behaves
 * exactly as it did before rather than leaving a hole, which is what lets this
 * ship while the render queue is still draining.
 */
export function resolveArtVariantSrc(
  image: ArtImageSrcLike,
  variant: ArtVariant,
  fallback = '',
): string {
  const path = cleanValue(image?.[VARIANT_PATH_KEYS[variant]])
  if (path) return path

  const data = toArtDataUri(image?.[VARIANT_DATA_KEYS[variant]], image?.fileType)
  if (data) return data

  return resolveArtImageSrc(image, fallback)
}

// Renderable source for a thumbnail. Prefers thumbnailPath, then the full-size
// path, then inline thumbnail/full base64, then `fallback`.
export function resolveArtImageThumbSrc(
  image: ArtImageSrcLike,
  fallback = '',
): string {
  const path =
    cleanValue(image?.thumbnailPath) ||
    cleanValue(image?.imagePath) ||
    cleanValue(image?.path)
  if (path) return path
  return (
    toArtDataUri(image?.thumbnailData, image?.fileType) ||
    toArtDataUri(image?.imageData, image?.fileType) ||
    fallback
  )
}
