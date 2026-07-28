export type MaturityPrivacyInput = {
  isMature?: unknown
  isPublic?: unknown
}

export type MaturityPrivacy = {
  isMature: boolean
  isPublic: boolean
}

function asInput(value: unknown): MaturityPrivacyInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as MaturityPrivacyInput
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
  input: unknown,
  fallback?: unknown,
): MaturityPrivacy {
  const source = asInput(input)
  const fallbackSource = asInput(fallback)
  const isMature =
    booleanOrUndefined(source.isMature) ??
    booleanOrUndefined(fallbackSource.isMature) ??
    false
  const isPublic =
    booleanOrUndefined(source.isPublic) ??
    booleanOrUndefined(fallbackSource.isPublic) ??
    !isMature

  return { isMature, isPublic }
}

export function defaultPublicForMaturity(isMature: boolean): boolean {
  return !isMature
}
