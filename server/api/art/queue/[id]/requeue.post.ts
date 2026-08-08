// /server/api/art/queue/[id]/requeue.post.ts
//
// Admin action: return a stuck job to the queue. Resets it to PENDING, clears
// the claim, and (by default) resets the attempt counter so a job that
// exhausted its retries — or a "zombie" stuck RUNNING on a dead relay — can be
// picked up again. Used by the ArtJob dashboard's requeue button.
//
// Admin/server credentials only (same trust level as claim/complete).
import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { requireMachineUser } from '../../../../utils/authGuard'
import { serializeArtJobPayload } from '../../../../utils/artJobPayload'
import { refreshArtJobResources } from '../../../../utils/artJobResourceRefresh'

type RequeueBody = {
  resetAttempts?: boolean
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)

    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required to requeue jobs.',
      })
    }

    const id = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid job id.' })
    }

    const body = (await readBody(event).catch(() => null)) as RequeueBody | null
    const resetAttempts = body?.resetAttempts !== false

    const job = await prisma.artJob.findUnique({ where: { id } })

    if (!job) {
      throw createError({ statusCode: 404, message: `Job ${id} not found.` })
    }

    if (job.status === 'DONE') {
      throw createError({
        statusCode: 409,
        message: `Job ${id} is already DONE — nothing to requeue.`,
      })
    }

    const resourceRefresh = await refreshArtJobResources(job.payload)
    const payload = resourceRefresh.payload
    payload.queueRepair = {
      repairedAt: new Date().toISOString(),
      resourcePathsChanged: resourceRefresh.changed,
      checkpointResourceId: resourceRefresh.checkpointResourceId,
      checkpointName: resourceRefresh.checkpointName,
      loraResourceIds: resourceRefresh.loraResourceIds,
      loraNames: resourceRefresh.loraNames,
    }

    const updated = await prisma.artJob.update({
      where: { id },
      data: {
        payload: serializeArtJobPayload(payload),
        status: 'PENDING',
        claimedAt: null,
        claimedBy: null,
        error: null,
        ...(resetAttempts ? { attempts: 0 } : {}),
      },
    })

    return {
      success: true,
      message: resourceRefresh.changed
        ? `Job ${id} repaired from its current Resources and requeued (attempts ${updated.attempts}).`
        : `Job ${id} requeued (attempts ${updated.attempts}).`,
      data: {
        job: updated,
        resourcePathsChanged: resourceRefresh.changed,
        checkpointResourceId: resourceRefresh.checkpointResourceId,
        checkpointName: resourceRefresh.checkpointName,
        loraResourceIds: resourceRefresh.loraResourceIds,
        loraNames: resourceRefresh.loraNames,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to requeue art job.',
      statusCode,
    }
  }
})
