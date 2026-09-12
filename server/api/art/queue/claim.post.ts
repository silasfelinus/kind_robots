// /server/api/art/queue/claim.post.ts
//
// Atomically claim the next runnable ArtJob. Called by the home relay agent
// on its poll loop (pull model — the server never dials into the home
// network). Restricted to admin/server credentials: the relay executes other
// users' jobs, so a plain user key must not be able to drain the queue.
//
// Smart queueing is enabled by default. Within the highest-priority tier, the
// relay prefers a bounded lookahead job whose model-loader affinity matches the
// last job that relay completed, trying an exact match (nothing reloads) before
// a heavy-model match (same unet, different LoRAs - avoids the 8-12GB swap that
// actually costs throughput on a 12GB card). The bypass cap prevents a busy
// model family from starving older work indefinitely. Set smartQueue=false for
// strict FIFO.
// The claim itself is an updateMany guarded on the expected status, so two
// relays can never win the same job — the loser retries another candidate.
//
// A relay is one slot: it claims, renders, reports, and only then polls again.
// So a poll from an agent that still holds a RUNNING row is proof that row was
// abandoned — the outcome report never landed (relay restart between claim and
// complete, a lost /complete POST, a crash inside process()). Before handing
// out new work, this releases every RUNNING row the polling agent still holds:
// back to PENDING with its attempt count intact, or FAILED once the budget is
// spent. Without that, the abandoned row stayed RUNNING beside the fresh claim
// until the queue happened to re-offer it after STALE_CLAIM_MINUTES, and a
// low-priority one could sit behind priority-100 work for hours (2026-09-12:
// #21788, attempt 2, RUNNING for 63 minutes next to the live #21803). A relay
// that genuinely renders several jobs at once opts out with singleSlot=false.
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'
import {
  decodeArtJobPayload,
  parseArtJobPayload,
  serializeArtJobPayload,
} from '../../../utils/artJobPayload'
import {
  enrichArtJobPayload,
  readArtJobProvenance,
} from '../../../utils/artJobProvenance'
import {
  artJobQueueAffinityKey,
  artJobQueueModelKey,
  selectSmartQueueCandidate,
} from '../../../utils/artJobQueueAffinity'
import { reconcileQueuedArtJobCoverage } from '../../../utils/artJobQueueCoverage'
import { assertQueuedArtPromptContract } from '../../../utils/artJobQueueSettings'
import {
  recordSamplerRepair,
  repairQueuedArtSampler,
} from '../../../utils/artJobSamplerRepair'
import { recordRelayClaimAttempt } from '../../../utils/relayAgentRegistry'
import { isQueuePaused } from '../../../utils/queueControl'
import { releaseAbandonedRelayClaims } from '../../../utils/artJobRelaySlot'

const STALE_CLAIM_MINUTES = 15
const MAX_ATTEMPTS = 3
const CLAIM_CANDIDATE_TRIES = 5
const CLAIM_LOOKAHEAD = 50
const SMART_QUEUE_MAX_BYPASS = 24

type ClaimRequestBody = {
  agentId?: string | null
  engines?: string[] | null
  supportsInputImages?: boolean | null
  supportsCompletionProof?: boolean | null
  agentVersion?: string | null
  smartQueue?: boolean | null
  singleSlot?: boolean | null
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)

    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required to claim queued jobs.',
      })
    }

    const body = (await readBody(event).catch(
      () => null,
    )) as ClaimRequestBody | null
    const claimedBy = body?.agentId?.trim().slice(0, 255) || 'relay'

    const engines = (body?.engines || ['A1111', 'COMFY'])
      .map((engine) => String(engine).toUpperCase())
      .filter((engine) => engine === 'A1111' || engine === 'COMFY') as (
      'A1111' | 'COMFY'
    )[]

    const supportsInputImages = body?.supportsInputImages === true
    const supportsCompletionProof = body?.supportsCompletionProof === true
    const smartQueue = body?.smartQueue !== false
    const singleSlot = body?.singleSlot !== false

    recordRelayClaimAttempt({
      agentId: claimedBy,
      supportsInputImages,
      engines,
      agentVersion: body?.agentVersion,
    })

    if (!engines.length) {
      throw createError({ statusCode: 400, message: 'No valid engines given.' })
    }

    // Runs before the paused check and the idle fast path on purpose: a relay
    // polling while paused has still abandoned whatever it holds, and a
    // released row is new PENDING work (or a fresh FAILED) that the probe
    // below must see either way.
    const released = singleSlot
      ? await releaseAbandonedRelayClaims(claimedBy, MAX_ATTEMPTS)
      : []

    // Queue paused (admin toggle): hand out no work so the queue is preserved
    // but not drained. Graceful — defaults to not-paused if the control table
    // is not migrated yet, so this can never wedge the pipeline.
    if (await isQueuePaused()) {
      return {
        success: true,
        message: 'Queue processing is paused.',
        data: {
          job: null,
          released,
          paused: true,
          scheduling: { mode: smartQueue ? 'SMART' : 'FIFO' },
        },
        statusCode: 200,
      }
    }

    const staleBefore = new Date(Date.now() - STALE_CLAIM_MINUTES * 60_000)

    // The relay polls frequently while idle. Avoid stale cleanup, affinity
    // lookup, and the 50-row smart-queue query when there is clearly no work.
    // This cheap probe also sees stale RUNNING jobs so recovery still happens.
    const queueSignal = await prisma.artJob.findFirst({
      where: {
        engine: { in: engines },
        OR: [
          { status: 'PENDING', attempts: { lt: MAX_ATTEMPTS } },
          { status: 'RUNNING', claimedAt: { lt: staleBefore } },
        ],
      },
      select: { id: true },
    })

    if (!queueSignal) {
      return {
        success: true,
        message: 'No runnable jobs.',
        data: {
          job: null,
          released,
          scheduling: {
            mode: smartQueue ? 'SMART' : 'FIFO',
            preferredAffinity: null,
          },
        },
        statusCode: 200,
      }
    }

    const skippedIds: number[] = []

    await prisma.artJob.updateMany({
      where: {
        status: 'RUNNING',
        claimedAt: { lt: staleBefore },
        attempts: { gte: MAX_ATTEMPTS },
      },
      data: {
        status: 'FAILED',
        error: `Stale claim reaped: relay stopped responding after ${MAX_ATTEMPTS} attempts.`,
        claimedAt: null,
        claimedBy: null,
      },
    })

    const previousJob = smartQueue
      ? await prisma.artJob.findFirst({
          where: {
            claimedBy,
            status: 'DONE',
            engine: { in: engines },
          },
          orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
          select: {
            engine: true,
            payload: true,
          },
        })
      : null

    const previousPayload = previousJob
      ? parseArtJobPayload(previousJob.payload)
      : null

    const preferredAffinity = previousJob
      ? artJobQueueAffinityKey(previousJob.engine, previousPayload)
      : null

    // The heavy half of the same key. Matching on it lets a Krea job follow a
    // Krea job that merely uses a different LoRA, which the full key counts as
    // a miss - see the second tier in selectSmartQueueCandidate.
    const preferredModelKey = previousJob
      ? artJobQueueModelKey(previousJob.engine, previousPayload)
      : null

    for (let attempt = 0; attempt < CLAIM_CANDIDATE_TRIES; attempt++) {
      const candidates = await prisma.artJob.findMany({
        where: {
          engine: { in: engines },
          attempts: { lt: MAX_ATTEMPTS },
          id: { notIn: skippedIds },
          OR: [
            { status: 'PENDING' },
            { status: 'RUNNING', claimedAt: { lt: staleBefore } },
          ],
        },
        orderBy: [{ priority: 'desc' }, { id: 'asc' }],
        take: CLAIM_LOOKAHEAD,
      })

      if (!candidates.length) {
        return {
          success: true,
          message: 'No runnable jobs.',
          data: {
            job: null,
            released,
            scheduling: {
              mode: smartQueue ? 'SMART' : 'FIFO',
              preferredAffinity,
            },
          },
          statusCode: 200,
        }
      }

      const eligible = candidates
        .map((candidate) => ({
          ...candidate,
          payload: parseArtJobPayload(candidate.payload),
        }))
        .filter((candidate) => {
          const needsInputImages =
            Array.isArray(candidate.payload.images) &&
            candidate.payload.images.length > 0
          return !needsInputImages || supportsInputImages
        })

      if (!eligible.length) {
        skippedIds.push(...candidates.map((candidate) => candidate.id))
        continue
      }

      const selection = selectSmartQueueCandidate(
        eligible,
        smartQueue ? preferredAffinity : null,
        smartQueue ? SMART_QUEUE_MAX_BYPASS : 0,
        smartQueue ? preferredModelKey : null,
      )
      const candidate = selection.candidate

      if (!candidate) continue

      // Baseline coverage is one useful image per entity, not four speculative
      // variants. Reconcile only this candidate's equivalence class so a large
      // backlog is cleaned as it drains without adding an O(queue) sweep to
      // every relay poll. Explicit retry payloads are excluded by the policy.
      const coverage = await reconcileQueuedArtJobCoverage({
        ...candidate,
        payload: serializeArtJobPayload(candidate.payload),
      })
      if (coverage.skipCandidate) {
        skippedIds.push(candidate.id)
        continue
      }

      let enrichedPayload

      try {
        // A step or cfg above the engine's ceiling is the one contract
        // violation with an objectively correct repair, so repair it instead of
        // killing the row: clamp to the distilled limits first, then assert. On
        // 2026-08-09 eight pre-gate jobs had already died on nothing but
        // "krea2 ... got 20" with 27 more queued behind them, all of whose
        // prompts were otherwise clean. Enqueue still rejects these outright, so
        // producers writing new work still fail loudly; only the pre-gate
        // backlog self-heals here. See server/utils/artJobSamplerRepair.ts.
        const samplerRepair = repairQueuedArtSampler(
          candidate.engine,
          candidate.payload,
        )

        // New enqueues pass the prompt contract at creation time. Old backlog
        // rows predate that boundary, so apply the same rules again immediately
        // before claim using the ACTUAL Comfy graph's engine/cfg/steps. This is
        // what prevents stale 20-step/cfg-7 Krea jobs from rendering just because
        // they were already sitting in PENDING when the gate shipped — the clamp
        // above fixes the sampler numbers, and everything a machine cannot
        // safely rewrite (conditionals, format nouns, text piles) still fails.
        assertQueuedArtPromptContract(candidate.engine, samplerRepair.payload)

        const currentProvenance = readArtJobProvenance(samplerRepair.payload)
        enrichedPayload = enrichArtJobPayload(
          candidate.engine as 'A1111' | 'COMFY',
          samplerRepair.payload,
          {
            projectSlug: candidate.projectSlug,
            idempotencyKey: currentProvenance?.idempotencyKey,
            requireCompletionProof:
              currentProvenance?.requireCompletionProof === true ||
              supportsCompletionProof,
          },
        ).payload
        recordSamplerRepair(
          enrichedPayload,
          samplerRepair,
          new Date().toISOString(),
        )
      } catch (error: unknown) {
        const handled = errorHandler(error)
        const invalid = await prisma.artJob.updateMany({
          where: {
            id: candidate.id,
            status: candidate.status,
            claimedAt: candidate.claimedAt,
          },
          data: {
            status: 'FAILED',
            error:
              `ArtJob validation failed before claim: ${handled.message}`.slice(
                0,
                4000,
              ),
            claimedAt: null,
            claimedBy: null,
          },
        })

        if (invalid.count === 1) {
          skippedIds.push(candidate.id)
        }
        continue
      }

      const won = await prisma.artJob.updateMany({
        where: {
          id: candidate.id,
          status: candidate.status,
          claimedAt: candidate.claimedAt,
        },
        data: {
          status: 'RUNNING',
          claimedAt: new Date(),
          claimedBy,
          attempts: { increment: 1 },
          payload: serializeArtJobPayload(enrichedPayload),
        },
      })

      if (won.count === 1) {
        const job = await prisma.artJob.findUnique({
          where: { id: candidate.id },
        })

        return {
          success: true,
          message: selection.affinityMatched
            ? `Job claimed with ${selection.matchTier === 'model' ? 'heavy-model' : 'exact'} affinity (${selection.bypassedCount} older same-priority job(s) bypassed).`
            : 'Job claimed.',
          data: {
            job: job ? decodeArtJobPayload(job) : null,
            released,
            relayContract: {
              supportsCompletionProof,
              completionProofRequired:
                readArtJobProvenance(enrichedPayload)
                  ?.requireCompletionProof === true,
            },
            scheduling: {
              mode: smartQueue ? 'SMART' : 'FIFO',
              affinityMatched: selection.affinityMatched,
              matchTier: selection.matchTier,
              bypassedCount: selection.bypassedCount,
              preferredAffinity: selection.preferredAffinity,
              selectedAffinity: selection.selectedAffinity,
              preferredModelKey: selection.preferredModelKey ?? null,
              selectedModelKey: selection.selectedModelKey ?? null,
            },
          },
          statusCode: 200,
        }
      }

      skippedIds.push(candidate.id)
    }

    return {
      success: true,
      message: 'Queue contended; retry shortly.',
      data: {
        job: null,
        scheduling: {
          mode: smartQueue ? 'SMART' : 'FIFO',
          preferredAffinity,
        },
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to claim art job.',
      statusCode,
    }
  }
})
