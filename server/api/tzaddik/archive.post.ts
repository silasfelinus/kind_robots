// /server/api/tzaddik/archive.post.ts
//
// Admin-only archival of a Tzaddik candidate (tzaddik-gallery/t-008). Moves
// PENDING (rejecting a submission) or APPROVED (retiring a live entry) to
// ARCHIVED. Not a terminal state -- approve.post.ts can restore an archived
// candidate. Flat body-based shape, matching recheck.post.ts's convention.
import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdminApiUser } from '../../utils/authGuard'
import { errorHandler } from '../../utils/error'
import { logAdminAction } from '../../utils/audit'
import {
  archiveTzaddikCandidate,
  TzaddikCandidateNotFoundError,
  TzaddikCandidateStateError,
} from '../../utils/tzaddikModeration'

type ArchiveBody = { candidateId?: unknown }

function toPositiveId(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

export default defineEventHandler(async (event) => {
  try {
    const { user: admin } = await requireAdminApiUser(event)

    const body = await readBody<ArchiveBody>(event)
    const candidateId = toPositiveId(body?.candidateId)

    if (!candidateId) {
      throw createError({
        statusCode: 400,
        message: '"candidateId" is required.',
      })
    }

    const updated = await archiveTzaddikCandidate(candidateId)

    await logAdminAction(
      admin,
      `Archived Tzaddik candidate #${candidateId} (${updated.displayName}).`,
    )

    return {
      success: true,
      message: 'Tzaddik candidate archived.',
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
      message: handled.message || 'Failed to archive this Tzaddik candidate.',
      statusCode: event.node.res.statusCode,
    }
  }
})
