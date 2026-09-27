// /server/api/tzaddik/override.patch.ts
//
// Admin-only explicit content overrides for a Tzaddik candidate
// (tzaddik-gallery/t-008): "Admin/editor controls ... override
// Wikipedia-derived display text or images. Overrides must retain the
// original source/provenance and make the edited state inspectable."
//
// Only fields present as keys on the request body are touched -- omit a
// field to leave it alone, send `null` to clear an override back to the
// sourced value, send a non-empty string to override it. The sourced
// columns (displayName/biography/rationale/objections/imageFileUrl) are
// never written here, so the original + provenance stay intact next to
// whatever is overridden; overrideUpdatedByUserId/overrideUpdatedAt/
// overrideNote record who changed it, when, and why.
import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdminApiUser } from '../../utils/authGuard'
import { errorHandler } from '../../utils/error'
import { logAdminAction } from '../../utils/audit'
import {
  hasAnyOverrideField,
  overrideTzaddikCandidate,
  TzaddikCandidateNotFoundError,
  type TzaddikOverrideInput,
} from '../../utils/tzaddikModeration'

type OverrideBody = TzaddikOverrideInput & { candidateId?: unknown }

const TEXT_FIELDS = [
  'biographyOverride',
  'rationaleOverride',
  'objectionsOverride',
  'overrideNote',
] as const

function toPositiveId(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

/** `undefined` = field omitted (leave alone), `null` = clear, string = set.
 * Anything else (a non-string, non-null value) is treated as omitted rather
 * than silently coerced. */
function normalizeOverrideValue(
  value: unknown,
  maxLength: number,
): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, maxLength) : null
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  try {
    const { user: admin } = await requireAdminApiUser(event)

    const body = await readBody<OverrideBody>(event)
    const candidateId = toPositiveId(body?.candidateId)

    if (!candidateId) {
      throw createError({
        statusCode: 400,
        message: '"candidateId" is required.',
      })
    }

    if (!hasAnyOverrideField(body)) {
      throw createError({
        statusCode: 400,
        message:
          'At least one override field is required (displayNameOverride, biographyOverride, rationaleOverride, objectionsOverride, imageUrlOverride, or overrideNote).',
      })
    }

    const input: TzaddikOverrideInput = {}

    if ('displayNameOverride' in body) {
      input.displayNameOverride = normalizeOverrideValue(
        body.displayNameOverride,
        255,
      )
    }

    for (const field of TEXT_FIELDS) {
      if (field in body) {
        input[field] = normalizeOverrideValue(body[field], 65535)
      }
    }

    if ('imageUrlOverride' in body) {
      const normalized = normalizeOverrideValue(body.imageUrlOverride, 2048)
      if (normalized && !isHttpUrl(normalized)) {
        throw createError({
          statusCode: 400,
          message: '"imageUrlOverride" must be a valid http(s) URL.',
        })
      }
      input.imageUrlOverride = normalized
    }

    const updated = await overrideTzaddikCandidate(candidateId, admin.id, input)

    await logAdminAction(
      admin,
      `Updated content overrides on Tzaddik candidate #${candidateId} (${updated.displayName}): ${Object.keys(input).join(', ')}.`,
    )

    return {
      success: true,
      message: 'Overrides updated.',
      data: updated,
      statusCode: 200,
    }
  } catch (error) {
    if (error instanceof TzaddikCandidateNotFoundError) {
      event.node.res.statusCode = 404
      return { success: false, message: error.message, statusCode: 404 }
    }

    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to update overrides.',
      statusCode: event.node.res.statusCode,
    }
  }
})
