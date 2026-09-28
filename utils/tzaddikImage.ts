// /utils/tzaddikImage.ts
//
// Client-safe display resolver for Tzaddik portraits. Explicit editor
// overrides win. Sourced Wikipedia/Wikimedia images are rendered through the
// same-origin proxy so browsers do not depend on direct Wikimedia hotlinks.
export type TzaddikImageLike = {
  id: number
  imageUrlOverride?: string | null
  imageFileUrl?: string | null
  imageRevisionId?: string | null
  wikipediaRevisionId?: string | null
  sourceCheckedAt?: Date | string | null
}

function clean(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function resolveTzaddikImageSrc(
  candidate: TzaddikImageLike | null | undefined,
): string {
  if (!candidate) return ''

  const override = clean(candidate.imageUrlOverride)
  if (override) return override

  if (!clean(candidate.imageFileUrl)) return ''

  const version =
    clean(candidate.imageRevisionId) ||
    clean(candidate.wikipediaRevisionId) ||
    (candidate.sourceCheckedAt ? String(candidate.sourceCheckedAt) : '')

  const base = `/api/tzaddik/${candidate.id}/image`
  return version ? `${base}?v=${encodeURIComponent(version)}` : base
}