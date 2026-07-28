export type MaturityPrivacyInput = {
  isMature?: unknown
  isPublic?: unknown
}

export type MaturityPrivacy = {
  isMature: boolean
  isPublic: boolean
}

function booleanOrUndefined(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

/**
 * Resolve the visibility contract used by generated images, videos, and ArtJobs.
 *
 * Explicit values always win. When public/private was not explicitly supplied,
 * mature work defaults private and general-audience work defaults public.
 */
export function resolveMaturityPrivacy(
  input: MaturityPrivacyInput | null | undefined,
  fallback?: MaturityPrivacyInput | null,
): MaturityPrivacy {
  const isMature =
    booleanOrUndefined(input?.isMature) ??
    booleanOrUndefined(fallback?.isMature) ??
    false
  const isPublic =
    booleanOrUndefined(input?.isPublic) ??
    booleanOrUndefined(fallback?.isPublic) ??
    !isMature

  return { isMature, isPublic }
}

export function defaultPublicForMaturity(isMature: boolean): boolean {
  return !isMature
}
