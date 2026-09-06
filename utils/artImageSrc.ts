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
      /**
       * Bot's primary render lives in `avatarImage`, not `imagePath` -- a
       * naming split that predates the shared entity-art slots and forced every
       * bot surface to special-case its own primary. Resolving it here makes
       * one good render enough for a Bot exactly as it already is for every
       * other entity (Silas, 2026-09-05: normalize Bot onto the common
       * primary). `Bot.imagePath` exists too and wins when populated, so the
       * eventual backfill needs no code change.
       */
      avatarImage?: string | null
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
  const path =
    cleanValue(image?.imagePath) ||
    cleanValue(image?.avatarImage) ||
    cleanValue(image?.path)
  if (path) return path
  return toArtDataUri(image?.imageData, image?.fileType) || fallback
}

export type ArtVariant = 'card' | 'hero' | 'icon'

/**
 * Where to anchor a crop when a purpose-built variant does not exist and the
 * primary render has to fill the frame instead.
 *
 * A purpose-built variant is already COMPOSED for its aspect -- the card prompt
 * asks for "a vertical 2:3 composition with breathing room around the focal
 * subject", the hero for "the focal subject safely inside the center region".
 * Cropping one of those again would fight the composition, so these offsets are
 * applied only to a primary standing in for a missing variant.
 *
 * Vertical bias, not centre: entity primaries are overwhelmingly figures and
 * objects with their subject in the upper half, so a centred crop of a square
 * into 2:3 or 16:9 reliably cuts heads off. 35% keeps the head and loses the
 * feet, which is the right trade for a card.
 */
export const ART_VARIANT_FOCUS: Record<ArtVariant, string> = {
  card: '50% 35%',
  hero: '50% 40%',
  icon: '50% 30%',
}

/** Where a resolved source came from, so callers know whether to re-crop it. */
export type ArtSrcOrigin = 'variant' | 'primary' | 'fallback' | 'none'

export type ResolvedArtSrc = {
  src: string
  origin: ArtSrcOrigin
}

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
 * Renderable source for an entity's art in a requested shape.
 *
 * PRIMARY FIRST (2026-09-05). Entity art is collapsing from four stored slots
 * per object to one primary render plus an inspiration gallery, because four
 * renders per object made the library unwieldy for no display benefit -- the
 * frames differ, but the picture does not need to. The primary now wins, and
 * the purpose-built variants are only a fallback for an object that has no
 * primary yet.
 *
 * The old order (variant first) is exactly what made every object cost four
 * renders. Keeping the variants as a fallback rather than deleting the branch
 * means nothing goes blank during the migration: the entities that have variant
 * art but no primary keep rendering as before until a primary arrives.
 *
 * Degrades: primary -> requested variant path -> requested variant base64 ->
 * `fallback`. Callers that need to know which they got -- a stand-in primary
 * must be re-cropped, a composed variant must not -- read `origin` from
 * resolveArtVariantSource().
 */
export function resolveArtVariantSrc(
  image: ArtImageSrcLike,
  variant: ArtVariant,
  fallback = '',
): string {
  return resolveArtVariantSource(image, variant, fallback).src
}

/**
 * As resolveArtVariantSrc, but also reports WHERE the source came from.
 *
 * Display surfaces need that distinction to crop correctly: a purpose-built
 * variant is composed for its frame and must be shown as-is, while a primary
 * standing in for a missing variant wants ART_VARIANT_FOCUS applied. The
 * string-returning wrapper above keeps every existing caller working.
 */
export function resolveArtVariantSource(
  image: ArtImageSrcLike,
  variant: ArtVariant,
  fallback = '',
): ResolvedArtSrc {
  const primary = resolveArtImageSrc(image)
  if (primary) return { src: primary, origin: 'primary' }

  const path = cleanValue(image?.[VARIANT_PATH_KEYS[variant]])
  if (path) return { src: path, origin: 'variant' }

  const data = toArtDataUri(
    image?.[VARIANT_DATA_KEYS[variant]],
    image?.fileType,
  )
  if (data) return { src: data, origin: 'variant' }

  const cleanFallback = cleanValue(fallback)
  return cleanFallback
    ? { src: cleanFallback, origin: 'fallback' }
    : { src: '', origin: 'none' }
}

/**
 * General display artwork for an entity that carries art, or null.
 *
 * `imagePath` is the canonical baseline image: one good primary render is enough
 * for an entity to be displayable everywhere because cards/heroes/icons can
 * resize or crop it. Purpose-built variants remain optional enhancements. When a
 * caller has no specific variant requirement, fall back in the stable order:
 *
 *   imagePath -> cardPath -> heroPath -> iconPath
 *
 * Variant-aware galleries should keep using resolveArtVariantSrc(), which first
 * asks for the requested shape and then falls back to imagePath.
 */
export function resolveEntityArtwork(image: ArtImageSrcLike): string | null {
  return (
    resolveArtImageSrc(image) ||
    cleanValue(image?.cardPath) ||
    toArtDataUri(image?.cardData, image?.fileType) ||
    cleanValue(image?.heroPath) ||
    toArtDataUri(image?.heroData, image?.fileType) ||
    cleanValue(image?.iconPath) ||
    toArtDataUri(image?.iconData, image?.fileType) ||
    null
  )
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
