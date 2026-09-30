// /utils/tzaddikImage.ts
//
// Client-safe display resolver for Tzaddik portraits. Explicit editor
// overrides win. Both sourced Wikipedia/Wikimedia images and explicit
// external portrait overrides are rendered through the same-origin proxy so
// browsers never depend on third-party hotlinks directly.
export type TzaddikImageLike = {
  id: number
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
