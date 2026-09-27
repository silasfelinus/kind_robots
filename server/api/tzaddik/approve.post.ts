// /server/api/tzaddik/approve.post.ts
//
// Admin-only approval of a Tzaddik candidate (tzaddik-gallery/t-008). Moves
// PENDING (the normal review path) or ARCHIVED (restoring a previously
// archived entry) to APPROVED. Flat body-based shape, matching this
// project's own recheck.post.ts convention rather than a nested [id]/action
// route.
import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdminApiUser } from '../../utils/authGuard'
import { errorHandler } from '../../utils/error'
import { logAdminAction } from '../../utils/audit'
import {
  approveTzaddikCandidate,
  TzaddikCandidateNotFoundError,
  TzaddikCandidateStateError,
} from '../../utils/tzaddikModeration'

type ApproveBody = { candidateId?: unknown }

function toPositiveId(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

export default defineEventHandler(async (event) => {
  try {
    const { user: admin } = await requireAdminApiUser(event)

    const body = await readBody<ApproveBody>(event)
    const candidateId = toPositiveId(body?.candidateId)

    if (!candidateId) {
      throw createError({
        statusCode: 400,
        message: '"candidateId" is required.',
      })
    }

    const updated = await approveTzaddikCandidate(candidateId, admin.id)

    await logAdminAction(
      admin,
      `Approved Tzaddik candidate #${candidateId} (${updated.displayName}).`,
    )

    return {
      success: true,
      message: 'Tzaddik candidate approved.',
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
      message: handled.message || 'Failed to approve this Tzaddik candidate.',
      statusCode: event.node.res.statusCode,
    }
  }
})
