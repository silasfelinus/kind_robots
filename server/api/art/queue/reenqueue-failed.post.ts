// /server/api/art/queue/reenqueue-failed.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'
import { serializeArtJobPayload } from '../../../utils/artJobPayload'
import { prepareArtJobRetryPayload } from '../../../utils/artJobRetry'

type ReenqueueFailedBody = {
  refreshSeed?: boolean
}

type FailedSourceJob = Awaited<
  ReturnType<typeof prisma.artJob.findMany>
>[number]

const CREATE_CONCURRENCY = 10

function createRetryJob(source: FailedSourceJob, refreshSeed: boolean) {
  const payload = prepareArtJobRetryPayload(
    source.payload,
    source.id,
    source.artImageId,
    'NEW_OUTPUT',
    refreshSeed,
  )

  return prisma.artJob.create({
    data: {
      engine: source.engine,
      payload: serializeArtJobPayload(payload),
      priority: source.priority,
      projectSlug: source.projectSlug,
      projectId: source.projectId,
      userId: source.userId,
    },
    select: { id: true },
  })
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)

    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required to re-enqueue failed jobs.',
      })
    }

    const body = (await readBody(event).catch(() => null)) as
      | ReenqueueFailedBody
      | null
    const refreshSeed = body?.refreshSeed !== false

    const sources = await prisma.artJob.findMany({
      where: { status: 'FAILED' },
      orderBy: { id: 'asc' },
    })

    const queuedSourceJobIds: number[] = []
    const failedSourceJobIds: number[] = []
    const createdJobIds: number[] = []

    for (let index = 0; index < sources.length; index += CREATE_CONCURRENCY) {
      const batch = sources.slice(index, index + CREATE_CONCURRENCY)
      const results = await Promise.allSettled(
        batch.map((source) => createRetryJob(source, refreshSeed)),
      )

      results.forEach((result, resultIndex) => {
        const source = batch[resultIndex]
        if (!source) return

        if (result.status === 'fulfilled') {
          queuedSourceJobIds.push(source.id)
          createdJobIds.push(result.value.id)
        } else {
          failedSourceJobIds.push(source.id)
        }
      })
    }

    const queuedCount = queuedSourceJobIds.length
    const failedCount = failedSourceJobIds.length
    const requestedCount = sources.length

    event.node.res.statusCode = queuedCount > 0 ? 201 : 200

    return {
      success: true,
      message:
        requestedCount === 0
          ? 'No failed art jobs were found.'
          : failedCount > 0
            ? `Re-enqueued ${queuedCount} of ${requestedCount} failed art jobs. ${failedCount} could not be queued.`
            : `Re-enqueued all ${queuedCount} failed art jobs as fresh outputs.`,
      data: {
        requestedCount,
        queuedCount,
        failedCount,
        sourceJobIds: sources.map((source) => source.id),
        queuedSourceJobIds,
        failedSourceJobIds,
        createdJobIds,
        refreshSeed,
      },
      statusCode: event.node.res.statusCode,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to re-enqueue failed art jobs.',
      statusCode,
    }
  }
})
