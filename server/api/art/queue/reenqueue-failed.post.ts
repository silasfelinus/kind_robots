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
import { serializeArtJobPayload } from '../../../utils/artJobPayload'
import {
  enrichArtJobPayload,
  readArtJobProvenance,
} from '../../../utils/artJobProvenance'
import { normalizeQueuedArtJobPayload } from '../../../utils/artJobNormalization'
import {
  recordSamplerRepair,
  repairQueuedArtSampler,
} from '../../../utils/artJobSamplerRepair'
import { refreshArtJobLoraResources } from '../../../utils/artJobResourceRefresh'

const REQUEUE_CONCURRENCY = 10

type FailedJobSource = {
  id: number
  engine: 'A1111' | 'COMFY'
  projectSlug: string | null
  payload: string
}

type RequeueResult = {
  id: number
  imagePathChanged: boolean
  promptChanged: boolean
  loraPathChanged: boolean
  loraResourceIds: number[]
  loraNames: string[]
}

type RequeueFailure = {
  id: number
  message: string
}

function failureMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return String(error || 'Unknown requeue failure.')
}

async function requeueFailedJob(
  source: FailedJobSource,
): Promise<RequeueResult> {
  const normalization = normalizeQueuedArtJobPayload(source.payload)
  // A job that failed the claim-time contract on nothing but an out-of-band
  // step count would otherwise be requeued verbatim and fail again on the next
  // poll — a requeue loop that repairs everything except the thing that killed
  // it. Clamp the sampler here too, so a requeued row comes back legal.
  const samplerRepair = repairQueuedArtSampler(
    source.engine,
    normalization.payload,
  )
  const resourceRefresh = await refreshArtJobLoraResources(
    samplerRepair.payload,
  )
  const priorProvenance = readArtJobProvenance(source.payload)
  const { payload } = enrichArtJobPayload(
    source.engine,
    resourceRefresh.payload,
    {
      projectSlug: source.projectSlug,
      idempotencyKey: priorProvenance?.idempotencyKey,
      requireCompletionProof: priorProvenance?.requireCompletionProof,
    },
  )

  const repairedAt = new Date().toISOString()
  payload.queueRepair = {
    repairedAt,
    imagePathChanged: normalization.imagePathChanged,
    promptChanged: normalization.promptChanged,
    loraPathChanged: resourceRefresh.changed,
    loraResourceIds: resourceRefresh.loraResourceIds,
    loraNames: resourceRefresh.loraNames,
    samplerChanged: samplerRepair.changed,
  }
  recordSamplerRepair(payload, samplerRepair, repairedAt)

  const updated = await prisma.artJob.updateMany({
    where: {
      id: source.id,
      status: 'FAILED',
    },
    data: {
      payload: serializeArtJobPayload(payload),
      status: 'PENDING',
      claimedAt: null,
      claimedBy: null,
      error: null,
      attempts: 0,
    },
  })

  if (updated.count !== 1) {
    throw new Error(`ArtJob ${source.id} was no longer FAILED.`)
  }

  return {
    id: source.id,
    imagePathChanged: normalization.imagePathChanged,
    promptChanged: normalization.promptChanged,
    loraPathChanged: resourceRefresh.changed,
    loraResourceIds: resourceRefresh.loraResourceIds,
    loraNames: resourceRefresh.loraNames,
  }
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
      select: {
        id: true,
        engine: true,
        projectSlug: true,
        payload: true,
      },
    })
    const sourcesById = new Map(
      matchingRows.map((row) => [row.id, row as FailedJobSource]),
    )
    const sources = selectedJobIds
      .map((id) => sourcesById.get(id))
      .filter((source): source is FailedJobSource => Boolean(source))
    const skippedJobIds = selectedJobIds.filter((id) => !sourcesById.has(id))

    const requeuedJobIds: number[] = []
    const failedJobs: RequeueFailure[] = []
    let repairedImagePathCount = 0
    let repairedPromptCount = 0
    let repairedLoraPathCount = 0

    for (let index = 0; index < sources.length; index += REQUEUE_CONCURRENCY) {
      const batch = sources.slice(index, index + REQUEUE_CONCURRENCY)
      const results = await Promise.allSettled(
        batch.map((source) => requeueFailedJob(source)),
      )

      results.forEach((result, resultIndex) => {
        const source = batch[resultIndex]
        if (!source) return

        if (result.status === 'fulfilled') {
          requeuedJobIds.push(result.value.id)
          if (result.value.imagePathChanged) repairedImagePathCount += 1
          if (result.value.promptChanged) repairedPromptCount += 1
          if (result.value.loraPathChanged) repairedLoraPathCount += 1
        } else {
          failedJobs.push({
            id: source.id,
            message: failureMessage(result.reason),
          })
        }
      })
    }

    const failedSourceJobIds = failedJobs.map((failure) => failure.id)
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
            ? `Repaired and requeued ${queuedCount} of ${requestedCount} selected failed ArtJobs. ${failedCount} could not be requeued.`
            : skippedCount > 0
              ? `Repaired and requeued ${queuedCount} selected failed ArtJobs. ${skippedCount} selected jobs were skipped because they were missing or no longer failed.`
              : `Repaired and requeued ${queuedCount} selected failed ArtJobs in place.`,
      data: {
        selectedCount,
        requestedCount,
        queuedCount,
        failedCount,
        skippedCount,
        repairedImagePathCount,
        repairedPromptCount,
        repairedLoraPathCount,
        selectedJobIds,
        sourceJobIds: sources.map((source) => source.id),
        skippedJobIds,
        queuedSourceJobIds: requeuedJobIds,
        failedSourceJobIds,
        failedJobs,
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
