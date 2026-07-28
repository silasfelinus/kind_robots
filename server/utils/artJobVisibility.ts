import { resolveMaturityPrivacy } from '~/utils/maturityPrivacy'
import type { ArtJobPayloadRecord } from './artJobPayload'

type VisibilityOverrides = {
  isMature?: boolean | null
  isPublic?: boolean | null
}

function asRecord(value: unknown): ArtJobPayloadRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as ArtJobPayloadRecord
}

/**
 * Apply explicit queue-editor visibility values and normalize legacy payloads.
 * Explicit privacy always wins; otherwise changing maturity adopts its default.
 */
export function applyArtJobVisibility(
  payload: ArtJobPayloadRecord,
  overrides?: VisibilityOverrides | null,
): ArtJobPayloadRecord {
  const save = asRecord(payload.save)
  const current = resolveMaturityPrivacy(save)
  const hasMatureOverride = typeof overrides?.isMature === 'boolean'
  const hasPublicOverride = typeof overrides?.isPublic === 'boolean'
  const isMature = hasMatureOverride
    ? Boolean(overrides?.isMature)
    : current.isMature
  const isPublic = hasPublicOverride
    ? Boolean(overrides?.isPublic)
    : hasMatureOverride
      ? !isMature
      : current.isPublic

  payload.save = {
    ...save,
    isMature,
    isPublic,
  }
  return payload
}
