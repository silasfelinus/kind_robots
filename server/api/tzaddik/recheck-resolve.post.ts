// /server/api/tzaddik/recheck-resolve.post.ts
//
// Admin-only resolution of a NEEDS_REVIEW recheck request (tzaddik-gallery/
// t-030): "Update" re-fetches Wikipedia and accepts the new article identity
// as the candidate's canonical source, "Keep" dismisses the flag and leaves
// the current source untouched. Flat body-based shape, matching this
// project's approve.post.ts/archive.post.ts convention.
import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdminApiUser } from '../../utils/authGuard'
import { errorHandler } from '../../utils/error'
import { logAdminAction } from '../../utils/audit'
import {
  resolveTzaddikRecheckReview,
  TzaddikCandidateNotFoundError,
  TzaddikCandidateStateError,
  type TzaddikRecheckResolution,
} from '../../utils/tzaddikModeration'

type ResolveBody = { candidateId?: unknown; resolution?: unknown }

const RESOLUTIONS = new Set<TzaddikRecheckResolution>(['accept', 'dismiss'])

function toPositiveId(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function toResolution(value: unknown): TzaddikRecheckResolution | undefined {
  return typeof value === 'string' &&
    RESOLUTIONS.has(value as TzaddikRecheckResolution)
    ? (value as TzaddikRecheckResolution)
    : undefined
}

export default defineEventHandler(async (event) => {
  try {
    const { user: admin } = await requireAdminApiUser(event)

    const body = await readBody<ResolveBody>(event)
    const candidateId = toPositiveId(body?.candidateId)
    const resolution = toResolution(body?.resolution)

    if (!candidateId) {
      throw createError({
        statusCode: 400,
        message: '"candidateId" is required.',
      })
    }
    if (!resolution) {
      throw createError({
        statusCode: 400,
        message: '"resolution" must be "accept" or "dismiss".',
      })
    }

    const updated = await resolveTzaddikRecheckReview(candidateId, resolution)

    await logAdminAction(
      admin,
      resolution === 'accept'
        ? `Accepted the new Wikipedia article identity for Tzaddik candidate #${candidateId} (${updated.displayName}).`
        : `Dismissed the recheck flag for Tzaddik candidate #${candidateId} (${updated.displayName}), keeping its current source.`,
    )

    return {
      success: true,
      message:
        resolution === 'accept'
          ? 'Sourced fields refreshed from the new Wikipedia article.'
          : 'Recheck flag dismissed -- current source kept.',
      data: updated,
      statusCode: 200,
    }
  } catch (error) {
    if (error instanceof TzaddikCandidateNotFoundError) {
      event.node.res.statusCode = 404
      return { success: false, message: error.message, statusCode: 404 }
    }
    if (error instanceof TzaddikCandidateStateError) {
      event.node.res.statusCode = 409
      return { success: false, message: error.message, statusCode: 409 }
    }

    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return {
      success: false,
      message: handled.message || 'Failed to resolve this recheck request.',
      statusCode: event.node.res.statusCode,
    }
  }
})
