// /server/api/art/queue/index.post.ts
//
// Enqueue a durable art generation job. Producers (conductor scripts, UI)
// POST here instead of holding a live generation request open; the home
// relay agent claims jobs outward via /api/art/queue/claim and completes
// them via /api/art/queue/[id]/complete. See ArtJob in schema.prisma.
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'
import {
  decodeArtJobPayload,
  serializeArtJobPayload,
} from '../../../utils/artJobPayload'
import { enrichArtJobPayload } from '../../../utils/artJobProvenance'

const ENGINES = new Set(['A1111', 'COMFY'])
const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]*$/

type QueueRequestBody = {
  engine?: string | null
  payload?: Record<string, unknown> | null
  priority?: number | null
  projectSlug?: string | null
  idempotencyKey?: string | null
  requireCompletionProof?: boolean | null
}

type LockRow = {
  acquired?: number | bigint | string | null
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)
    const body = (await readBody(event)) as QueueRequestBody | null

    const engine = String(body?.engine || 'A1111').toUpperCase()

    if (!ENGINES.has(engine)) {
      throw createError({
        statusCode: 400,
        message: `Unsupported engine "${engine}". Use one of: ${[...ENGINES].join(', ')}.`,
      })
    }

    const rawPayload = body?.payload

    if (
      !rawPayload ||
      typeof rawPayload !== 'object' ||
      Array.isArray(rawPayload)
    ) {
      throw createError({
        statusCode: 400,
        message:
          'Missing required field "payload" (object with the generation request, e.g. promptString/width/height for A1111 or a workflow for COMFY).',
      })
    }

    const projectSlug = body?.projectSlug?.trim().toLowerCase() || null

    if (projectSlug && !SLUG_PATTERN.test(projectSlug)) {
      throw createError({ statusCode: 400, message: 'Invalid projectSlug.' })
    }

    const priority = Number.isInteger(body?.priority)
      ? Number(body?.priority)
      : 0

    const { payload, provenance } = enrichArtJobPayload(
      engine as 'A1111' | 'COMFY',
      rawPayload,
      {
        projectSlug,
        idempotencyKey: body?.idempotencyKey,
        requireCompletionProof:
          engine === 'COMFY' && body?.requireCompletionProof === true,
      },
    )

    const fingerprintNeedle = `"attemptFingerprint":"${provenance.attemptFingerprint}"`
    const lockName = `artjob:${auth.user.id}:${provenance.attemptFingerprint}`.slice(
      0,
      64,
    )

    const result = await prisma.$transaction(
      async (tx) => {
        const lockRows = await tx.$queryRaw<LockRow[]>`
          SELECT GET_LOCK(${lockName}, 3) AS acquired
        `

        if (Number(lockRows[0]?.acquired) !== 1) {
          throw createError({
            statusCode: 409,
            message:
              'A matching ArtJob enqueue is already being processed. Retry shortly.',
          })
        }

        try {
          const existing = await tx.artJob.findFirst({
            where: {
              userId: auth.user.id,
              status: { in: ['PENDING', 'RUNNING', 'DONE'] },
              payload: { contains: fingerprintNeedle },
            },
            orderBy: { id: 'desc' },
          })

          if (existing) {
            return { job: existing, deduplicated: true }
          }

          const job = await tx.artJob.create({
            data: {
              engine: engine as 'A1111' | 'COMFY',
              payload: serializeArtJobPayload(payload),
              priority,
              projectSlug,
              userId: auth.user.id,
            },
          })

          return { job, deduplicated: false }
        } finally {
          await tx.$queryRaw`
            SELECT RELEASE_LOCK(${lockName}) AS released
          `
        }
      },
      { timeout: 10_000 },
    )

    if (!result.deduplicated) {
      event.node.res.statusCode = 201
    }

    return {
      success: true,
      message: result.deduplicated
        ? `Matching ArtJob ${result.job.id} already exists; duplicate enqueue suppressed.`
        : 'Art job queued.',
      data: {
        job: decodeArtJobPayload(result.job),
        deduplicated: result.deduplicated,
        provenance: {
          promptHash: provenance.promptHash,
          workflowHash: provenance.workflowHash,
          workflowPromptHash: provenance.workflowPromptHash,
          attemptFingerprint: provenance.attemptFingerprint,
          expectedModels: provenance.expectedModels,
        },
      },
      statusCode: result.deduplicated ? 200 : 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to queue art job.',
      statusCode,
    }
  }
})
