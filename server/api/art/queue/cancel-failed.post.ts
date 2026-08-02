// /server/api/art/queue/cancel-failed.post.ts
//
// Admin action: cancel an explicit, page-sized selection of FAILED ArtJobs in
// one database operation. Keeping this bulk avoids saturating the connection
// pool with one simultaneous request per row from the dashboard.
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'
import { normalizeFailedArtJobIds } from '../../../utils/failedArtJobScope'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)

    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required to cancel failed jobs.',
      })
    }

    const body = await readBody<{ jobIds?: unknown; reason?: unknown }>(event)
    const scope = normalizeFailedArtJobIds(body?.jobIds, 'cancel')

    if (!scope.ok) {
      throw createError({ statusCode: 400, message: scope.message })
    }

    const reason =
      typeof body.reason === 'string' && body.reason.trim()
        ? body.reason.trim().slice(0, 4000)
        : 'Cleared from failed queue by admin.'

    const result = await prisma.artJob.updateMany({
      where: {
        id: { in: scope.ids },
        status: 'FAILED',
      },
      data: {
        status: 'CANCELLED',
        claimedAt: null,
        claimedBy: null,
        error: reason,
      },
    })

    const skippedCount = scope.ids.length - result.count

    return {
      success: true,
      message:
        skippedCount > 0
          ? `Cancelled ${result.count} failed ArtJobs. ${skippedCount} selected jobs were skipped because they were missing or no longer failed.`
          : `Cancelled ${result.count} failed ArtJobs.`,
      data: {
        selectedCount: scope.ids.length,
        cancelledCount: result.count,
        skippedCount,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to cancel selected failed ArtJobs.',
      statusCode,
    }
  }
})
