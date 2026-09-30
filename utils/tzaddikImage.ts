// /utils/tzaddikImage.ts
//
// Client-safe display resolver for Tzaddik portraits. Explicit editor
// overrides win. Both sourced Wikipedia/Wikimedia images and explicit
// external portrait overrides are rendered through the same-origin proxy so
// browsers never depend on third-party hotlinks directly.
export type TzaddikImageLike = {
  id: number
  curationState?: string | null
  imageUrlOverride?: string | null
  imageFileUrl?: string | null
  imageRevisionId?: string | null
  wikipediaRevisionId?: string | null
  sourceCheckedAt?: Date | string | null
  overrideUpdatedAt?: Date | string | null
}

function clean(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function resolveTzaddikImageSrc(
  candidate: TzaddikImageLike | null | undefined,
): string {
  if (!candidate) return ''

  const override = clean(candidate.imageUrlOverride)
  const sourced = clean(candidate.imageFileUrl)
  if (!override && !sourced) return ''

  // The same-origin proxy intentionally exposes only APPROVED candidates.
  // PENDING/ARCHIVED rows are visible only through authenticated moderation
  // APIs, but an <img> request cannot attach the JWT kept by the client store.
  // Their portrait URLs are already public source URLs, so review surfaces
  // render that source directly instead of asking the proxy to 404 it.
  if (candidate.curationState && candidate.curationState !== 'APPROVED') {
    return override || sourced
  }

  const version = override
    ? candidate.overrideUpdatedAt
      ? String(candidate.overrideUpdatedAt)
      : override
    : clean(candidate.imageRevisionId) ||
      clean(candidate.wikipediaRevisionId) ||
      (candidate.sourceCheckedAt ? String(candidate.sourceCheckedAt) : '')

  const base = `/api/tzaddik/${candidate.id}/image`
  return version ? `${base}?v=${encodeURIComponent(version)}` : base
}
