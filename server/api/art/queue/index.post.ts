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
import { normalizeQueuedArtJobPayload } from '../../../utils/artJobNormalization'
import { assertArtPromptContract } from '../../../utils/artPromptContract'
import { extractRenderRequest } from '../../comfy/utils/engineWorkflow'

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

    /*
     * NEVER DEFAULT TO A1111. This single fallback is the whole reason 60 page
     * backdrop jobs died on 2026-08-05 with `WinError 10061 ... target machine
     * actively refused it` — connection refused, three attempts each, prompts
     * never read. Nothing runs A1111 here: every PENDING job in the queue is
     * COMFY, every recent DONE job is COMFY, and the only A1111 rows anywhere
     * are CANCELLED.
     *
     * A silent default is what makes this dangerous rather than annoying. A
     * caller that forgets `engine` gets a job that looks perfectly queued, sits
     * at the right priority, and cannot possibly run. Silas, having been bitten
     * before: "make sure there is no more references to a111, that has hit us
     * before."
     *
     * COMFY is the default now because it is what the relay actually claims.
     * A1111 remains a valid EXPLICIT choice — the branches keyed on
     * `serverType === 'A1111'` elsewhere are real capability handling for a
     * server that genuinely is one, and they stay. What is gone is getting it
     * by accident.
     */
    const engine = String(body?.engine || 'COMFY').toUpperCase()

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
    const normalizedPayload = normalizeQueuedArtJobPayload(rawPayload).payload

    // Gate after normalization, on the render request actually extracted from
    // the workflow — that is the string ComfyUI receives, and it is not always
    // the caller's `promptString` (a COMFY payload carries a baked graph).
    // Conductor's bulk lanes enter here, so this is where a stale replayed
    // prompt gets stopped rather than rendered.
    try {
      // extractRenderRequest returns prompt/size/seed only; steps and cfg live
      // on the payload, which is Record<string, unknown> — coerce explicitly
      // rather than leaning on `unknown` surviving `||` and `??`.
      const render = extractRenderRequest(normalizedPayload)
      const numeric = (value: unknown): number | null => {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : null
      }
      const payloadEngine =
        typeof normalizedPayload.engine === 'string'
          ? normalizedPayload.engine
          : engine
      assertArtPromptContract({
        prompt: render.prompt,
        engine: String(payloadEngine || '').toLowerCase(),
        steps: numeric(normalizedPayload.steps),
        cfg: numeric(normalizedPayload.cfg),
      })
    } catch (contractError: unknown) {
      // A payload shape this endpoint cannot introspect is not a contract
      // violation — only rethrow the gate's own 422.
      const status = (contractError as { statusCode?: number })?.statusCode
      if (status === 422) throw contractError
    }

    const { payload, provenance } = enrichArtJobPayload(
      engine as 'A1111' | 'COMFY',
      normalizedPayload,
      {
        projectSlug,
        idempotencyKey: body?.idempotencyKey,
        requireCompletionProof:
          engine === 'COMFY' && body?.requireCompletionProof === true,
      },
    )

    const lockName =
      `artjob:${auth.user.id}:${provenance.attemptFingerprint}`.slice(0, 64)

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
          /*
           * BY COLUMN, NOT BY LIKE. This was
           *   payload: { contains: '"attemptFingerprint":"…"' }
           * which no index can serve, so it scanned every LongText payload this
           * user had ever produced -- inside this transaction, holding one of
           * two pool connections. See ArtJob.attemptFingerprint in
           * prisma/schema.prisma for the production numbers.
           *
           * Same semantics: the column mirrors payload.attemptFingerprint, and
           * migration 20260809210000 backfilled it from the payload for every
           * pre-existing row.
           */
          const existing = await tx.artJob.findFirst({
            where: {
              userId: auth.user.id,
              status: { in: ['PENDING', 'RUNNING', 'DONE'] },
              attemptFingerprint: provenance.attemptFingerprint,
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
              attemptFingerprint: provenance.attemptFingerprint,
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
