// /server/api/art/queue/[id]/reenqueue.post.ts
//
// Admin action: re-run any ArtJob by cloning its generation spec into a fresh
// PENDING job. Two explicit intents are supported:
//
// - NEW_OUTPUT: keep the source ArtImage intact and create another ArtImage.
// - OVERWRITE: render into a temporary ArtImage, then atomically replace the
//   source ArtImage's pixels/metadata at completion while preserving its id and
//   every Dream/Bot/Reward/etc. relation that points at it.
//
// Retry metadata lives in payload.retry so the relay remains generic and the UI
// can explain ancestry. Curator/human feedback is deliberately not copied to the
// fresh attempt, and concrete generation seeds are refreshed by default so a
// Comfy retry does not reproduce the exact same pixels.
import {
  createError,
  defineEventHandler,
  getRouterParam,
  readBody,
} from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from '../../../../utils/prisma'
import { errorHandler } from '../../../../utils/error'
import { requireMachineUser } from '../../../../utils/authGuard'

type RetryMode = 'NEW_OUTPUT' | 'OVERWRITE'

type ReenqueueBody = {
  mode?: string | null
  refreshSeed?: boolean
}

type JsonRecord = Record<string, unknown>

const RETRY_MODES = new Set<RetryMode>(['NEW_OUTPUT', 'OVERWRITE'])
const SEED_KEYS = new Set(['seed', 'noise_seed'])

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as JsonRecord
}

function nextSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000_000_000)
}

function refreshConcreteSeeds(value: unknown, key = ''): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => refreshConcreteSeeds(item))
  }

  if (!value || typeof value !== 'object') {
    if (SEED_KEYS.has(key)) {
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        return nextSeed()
      }
      if (
        typeof value === 'string' &&
        value.trim() &&
        Number.isFinite(Number(value)) &&
        Number(value) >= 0
      ) {
        return String(nextSeed())
      }
    }
    return value
  }

  return Object.fromEntries(
    Object.entries(value as JsonRecord).map(([childKey, child]) => [
      childKey,
      refreshConcreteSeeds(child, childKey),
    ]),
  )
}

function preparePayload(
  rawPayload: Prisma.JsonValue,
  sourceJobId: number,
  sourceArtImageId: number | null,
  mode: RetryMode,
  refreshSeed: boolean,
): Prisma.InputJsonValue {
  const cloned = JSON.parse(JSON.stringify(rawPayload ?? {})) as JsonRecord
  const previousRetry = asRecord(cloned.retry)
  const rootJobId = Number(previousRetry.rootJobId) || sourceJobId

  // A new render has not been curated yet. Keeping old feedback here would make
  // the trainer believe the replacement pixels had already been reviewed.
  delete cloned.curation

  const generationPayload = refreshSeed
    ? (refreshConcreteSeeds(cloned) as JsonRecord)
    : cloned

  generationPayload.retry = {
    mode,
    sourceJobId,
    rootJobId,
    targetArtImageId: mode === 'OVERWRITE' ? sourceArtImageId : null,
    refreshSeed,
    requestedAt: new Date().toISOString(),
  }

  return generationPayload as Prisma.InputJsonValue
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)

    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required to re-enqueue jobs.',
      })
    }

    const id = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({ statusCode: 400, message: 'Invalid job id.' })
    }

    const body = (await readBody(event).catch(() => null)) as ReenqueueBody | null
    const mode = String(body?.mode || 'NEW_OUTPUT').toUpperCase() as RetryMode
    const refreshSeed = body?.refreshSeed !== false

    if (!RETRY_MODES.has(mode)) {
      throw createError({
        statusCode: 400,
        message: 'mode must be NEW_OUTPUT or OVERWRITE.',
      })
    }

    const source = await prisma.artJob.findUnique({ where: { id } })

    if (!source) {
      throw createError({ statusCode: 404, message: `Job ${id} not found.` })
    }

    if (mode === 'OVERWRITE') {
      if (source.status !== 'DONE' || !source.artImageId) {
        throw createError({
          statusCode: 409,
          message:
            'Overwrite retries require a completed source job with an ArtImage.',
        })
      }

      const target = await prisma.artImage.findUnique({
        where: { id: source.artImageId },
        select: { id: true },
      })

      if (!target) {
        throw createError({
          statusCode: 409,
          message: `ArtImage ${source.artImageId} no longer exists.`,
        })
      }
    }

    const payload = preparePayload(
      source.payload,
      source.id,
      source.artImageId,
      mode,
      refreshSeed,
    )

    const job = await prisma.artJob.create({
      data: {
        engine: source.engine,
        payload,
        priority: source.priority,
        projectSlug: source.projectSlug,
        projectId: source.projectId,
        userId: source.userId,
      },
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      message:
        mode === 'OVERWRITE'
          ? `Queued job ${job.id} to replace ArtImage ${source.artImageId}.`
          : `Re-enqueued job ${id} as new-output job ${job.id}.`,
      data: {
        job,
        sourceJobId: id,
        mode,
        targetArtImageId: mode === 'OVERWRITE' ? source.artImageId : null,
      },
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to re-enqueue art job.',
      statusCode,
    }
  }
})