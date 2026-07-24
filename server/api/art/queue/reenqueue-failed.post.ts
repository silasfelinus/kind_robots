// /server/api/art/queue/reenqueue-failed.post.ts
//
// Admin action: return explicitly selected FAILED ArtJobs to the queue in place.
// This endpoint intentionally has no global default. Callers must send the exact
// IDs they reviewed, capped to one dashboard page, so a stale button or script
// cannot restart every historical failure in the database.
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'
import { normalizeFailedArtJobIds } from '../../../utils/failedArtJobScope'

const REQUEUE_CONCURRENCY = 10

async function requeueFailedJob(id: number): Promise<number> {
  const updated = await prisma.artJob.updateMany({
    where: {
      id,
      status: 'FAILED',
    },
    data: {
      status: 'PENDING',
      claimedAt: null,
      claimedBy: null,
      error: null,
      attempts: 0,
    },
  })

  if (updated.count !== 1) {
    throw new Error(`ArtJob ${id} was no longer FAILED.`)
  }

  return id
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)

    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required to requeue failed jobs.',
      })
    }

    const body = await readBody<{ jobIds?: unknown }>(event)
    const scope = normalizeFailedArtJobIds(body?.jobIds)

    if (!scope.ok) {
      throw createError({
        statusCode: 400,
        message: scope.message,
      })
    }

    const selectedJobIds = scope.ids
    const matchingRows = await prisma.artJob.findMany({
      where: {
        id: { in: selectedJobIds },
        status: 'FAILED',
      },
      select: { id: true },
    })
    const matchingIds = new Set(matchingRows.map((row) => row.id))
    const sources = selectedJobIds
      .filter((id) => matchingIds.has(id))
      .map((id) => ({ id }))
    const skippedJobIds = selectedJobIds.filter((id) => !matchingIds.has(id))

    const requeuedJobIds: number[] = []
    const failedSourceJobIds: number[] = []

    for (let index = 0; index < sources.length; index += REQUEUE_CONCURRENCY) {
      const batch = sources.slice(index, index + REQUEUE_CONCURRENCY)
      const results = await Promise.allSettled(
        batch.map((source) => requeueFailedJob(source.id)),
      )

      results.forEach((result, resultIndex) => {
        const source = batch[resultIndex]
        if (!source) return

        if (result.status === 'fulfilled') {
          requeuedJobIds.push(result.value)
        } else {
          failedSourceJobIds.push(source.id)
        }
      })
    }

    const selectedCount = selectedJobIds.length
    const requestedCount = sources.length
    const queuedCount = requeuedJobIds.length
    const failedCount = failedSourceJobIds.length
    const skippedCount = skippedJobIds.length

    return {
      success: true,
      message:
        requestedCount === 0
          ? 'None of the selected ArtJobs are still failed.'
          : failedCount > 0
            ? `Requeued ${queuedCount} of ${requestedCount} selected failed ArtJobs. ${failedCount} could not be requeued.`
            : skippedCount > 0
              ? `Requeued ${queuedCount} selected failed ArtJobs. ${skippedCount} selected jobs were skipped because they were missing or no longer failed.`
              : `Requeued ${queuedCount} selected failed ArtJobs in place.`,
      data: {
        selectedCount,
        requestedCount,
        queuedCount,
        failedCount,
        skippedCount,
        selectedJobIds,
        sourceJobIds: sources.map((source) => source.id),
        skippedJobIds,
        queuedSourceJobIds: requeuedJobIds,
        failedSourceJobIds,
        createdJobIds: [],
        refreshSeed: false,
        requeuedJobIds,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to requeue selected failed ArtJobs.',
      statusCode,
    }
  }
})
