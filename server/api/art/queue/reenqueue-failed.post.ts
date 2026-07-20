// /server/api/art/queue/reenqueue-failed.post.ts
//
// Admin action: return every FAILED ArtJob to the queue in place. A failed job
// is an exhausted work item, not a template for a replacement row. Requeueing
// resets its attempt cycle, clears the terminal error and claim, and changes the
// same job back to PENDING so the FAILED list remains an actionable worklist.
import { createError, defineEventHandler } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'

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

    const sources = await prisma.artJob.findMany({
      where: { status: 'FAILED' },
      orderBy: { id: 'asc' },
      select: { id: true },
    })

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

    const queuedCount = requeuedJobIds.length
    const failedCount = failedSourceJobIds.length
    const requestedCount = sources.length

    return {
      success: true,
      message:
        requestedCount === 0
          ? 'No failed art jobs were found.'
          : failedCount > 0
            ? `Requeued ${queuedCount} of ${requestedCount} failed art jobs in place. ${failedCount} could not be requeued.`
            : `Requeued all ${queuedCount} failed art jobs in place.`,
      data: {
        requestedCount,
        queuedCount,
        failedCount,
        sourceJobIds: sources.map((source) => source.id),
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
      message: handled.message || 'Failed to requeue failed art jobs.',
      statusCode,
    }
  }
})
