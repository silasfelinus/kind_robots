// /server/api/art/queue/claim.post.ts
//
// Atomically claim the next runnable ArtJob. Called by the home relay agent
// on its poll loop (pull model — the server never dials into the home
// network). Restricted to admin/server credentials: the relay executes other
// users' jobs, so a plain user key must not be able to drain the queue.
//
// Smart queueing is enabled by default. Within the highest-priority tier, the
// relay prefers a bounded lookahead job whose model-loader affinity matches the
// last job that relay completed. The bypass cap prevents a busy model family
// from starving older work indefinitely. Set smartQueue=false for strict FIFO.
// The claim itself is an updateMany guarded on the expected status, so two
// relays can never win the same job — the loser retries another candidate.
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'
import {
  decodeArtJobPayload,
  parseArtJobPayload,
} from '../../../utils/artJobPayload'
import {
  artJobQueueAffinityKey,
  selectSmartQueueCandidate,
} from '../../../utils/artJobQueueAffinity'
import { recordRelayClaimAttempt } from '../../../utils/relayAgentRegistry'

const STALE_CLAIM_MINUTES = 15
const MAX_ATTEMPTS = 3
const CLAIM_CANDIDATE_TRIES = 5
const CLAIM_LOOKAHEAD = 50
const SMART_QUEUE_MAX_BYPASS = 24

type ClaimRequestBody = {
  agentId?: string | null
  engines?: string[] | null
  supportsInputImages?: boolean | null
  agentVersion?: string | null
  smartQueue?: boolean | null
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
      | 'A1111'
      | 'COMFY'
    )[]

    const supportsInputImages = body?.supportsInputImages === true
    const smartQueue = body?.smartQueue !== false

    recordRelayClaimAttempt({
      agentId: claimedBy,
      supportsInputImages,
      engines,
      agentVersion: body?.agentVersion,
    })

    if (!engines.length) {
      throw createError({ statusCode: 400, message: 'No valid engines given.' })
    }

    const staleBefore = new Date(Date.now() - STALE_CLAIM_MINUTES * 60_000)
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

    const preferredAffinity = previousJob
      ? artJobQueueAffinityKey(
          previousJob.engine,
          parseArtJobPayload(previousJob.payload),
        )
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
      )
      const candidate = selection.candidate

      if (!candidate) continue

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
        },
      })

      if (won.count === 1) {
        const job = await prisma.artJob.findUnique({
          where: { id: candidate.id },
        })

        return {
          success: true,
          message: selection.affinityMatched
            ? `Job claimed with model affinity (${selection.bypassedCount} older same-priority job(s) bypassed).`
            : 'Job claimed.',
          data: {
            job: job ? decodeArtJobPayload(job) : null,
            scheduling: {
              mode: smartQueue ? 'SMART' : 'FIFO',
              affinityMatched: selection.affinityMatched,
              bypassedCount: selection.bypassedCount,
              preferredAffinity: selection.preferredAffinity,
              selectedAffinity: selection.selectedAffinity,
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
