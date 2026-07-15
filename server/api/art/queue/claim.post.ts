// /server/api/art/queue/claim.post.ts
//
// Atomically claim the next runnable ArtJob. Called by the home relay agent
// on its poll loop (pull model — the server never dials into the home
// network). Restricted to admin/server credentials: the relay executes other
// users' jobs, so a plain user key must not be able to drain the queue.
//
// Claimable jobs, in order: PENDING by priority desc then id asc, else a
// RUNNING job whose claim went stale (crashed relay). The claim itself is an
// updateMany guarded on the expected status, so two relays can never win the
// same job — the loser just retries the next candidate.
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'
import {
  decodeArtJobPayload,
  parseArtJobPayload,
} from '../../../utils/artJobPayload'

const STALE_CLAIM_MINUTES = 15
const MAX_ATTEMPTS = 3
const CLAIM_CANDIDATE_TRIES = 5

type ClaimRequestBody = {
  agentId?: string | null
  engines?: string[] | null
  // Capability handshake: jobs whose payload carries input images (e.g. Hair
  // Studio kontext jobs) are only handed to agents that declare support, so
  // a stale relay never claims-and-fails them — they wait instead.
  supportsInputImages?: boolean | null
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

    if (!engines.length) {
      throw createError({ statusCode: 400, message: 'No valid engines given.' })
    }

    const supportsInputImages = body?.supportsInputImages === true
    const staleBefore = new Date(Date.now() - STALE_CLAIM_MINUTES * 60_000)
    const skippedIds: number[] = []

    // Reap zombies: a RUNNING job whose claim went stale AND has already used up
    // all its attempts is never re-offered (the candidate query requires
    // attempts < MAX_ATTEMPTS) and never completed — it would sit RUNNING
    // forever. Mark those FAILED so they surface in the dashboard instead of
    // silently stalling the queue. Runs opportunistically on each claim poll.
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

    for (let attempt = 0; attempt < CLAIM_CANDIDATE_TRIES; attempt++) {
      const candidate = await prisma.artJob.findFirst({
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
      })

      if (!candidate) {
        return {
          success: true,
          message: 'No runnable jobs.',
          data: { job: null },
          statusCode: 200,
        }
      }

      const payload = parseArtJobPayload(candidate.payload)
      const needsInputImages =
        Array.isArray(payload.images) && payload.images.length > 0

      if (needsInputImages && !supportsInputImages) {
        // Leave the job for an image-capable agent instead of failing it.
        skippedIds.push(candidate.id)
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
        },
      })

      if (won.count === 1) {
        const job = await prisma.artJob.findUnique({
          where: { id: candidate.id },
        })

        return {
          success: true,
          message: 'Job claimed.',
          data: { job: job ? decodeArtJobPayload(job) : null },
          statusCode: 200,
        }
      }
      // Lost the race to another relay — try the next candidate.
    }

    return {
      success: true,
      message: 'Queue contended; retry shortly.',
      data: { job: null },
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
