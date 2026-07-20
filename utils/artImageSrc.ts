// /utils/artImageSrc.ts
//
// Path-first ArtImage rendering. The database is provisioned for path-only art,
// so rendering prefers a stored path (URL) and only falls back to inline base64
// for rows that have no path yet — e.g. a fresh upload whose bytes haven't been
// written to a path. This keeps upload/save flows working while letting the API
// stop shipping (and eventually storing) heavy base64 blobs for pathed art.

export type ArtImageLike =
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
  image: ArtImageLike,
  fallback = '',
): string {
  const path = cleanValue(image?.imagePath) || cleanValue(image?.path)
  if (path) return path
  return toArtDataUri(image?.imageData, image?.fileType) || fallback
}

// Renderable source for a thumbnail. Prefers thumbnailPath, then the full-size
// path, then inline thumbnail/full base64, then `fallback`.
export function resolveArtImageThumbSrc(
  image: ArtImageLike,
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
