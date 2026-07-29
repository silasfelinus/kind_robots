// /server/api/lora/download/claim.post.ts
//
// The home import agent claims the next PENDING LoRA download on its poll loop
// (pull model — the server never dials the home network). Machine credentials
// only: this hands out work to a trusted downloader. The claim is an updateMany
// guarded on the expected status, so two agents can never win the same row.
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { requireMachineUser } from '../../../utils/authGuard'

const STALE_CLAIM_MINUTES = 20
const MAX_ATTEMPTS = 3
const CLAIM_TRIES = 5

type ClaimBody = {
  agentId?: string | null
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireMachineUser(event)

    if (!auth.isAdmin && !auth.isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Admin access required to claim downloads.',
      })
    }

    const body = (await readBody(event).catch(() => null)) as ClaimBody | null
    const claimedBy = body?.agentId?.trim().slice(0, 255) || 'lora-import'

    const staleBefore = new Date(Date.now() - STALE_CLAIM_MINUTES * 60_000)

    // Reap stale claims that exhausted their attempts.
    await prisma.downloadRequest.updateMany({
      where: {
        status: 'CLAIMED',
        claimedAt: { lt: staleBefore },
        attempts: { gte: MAX_ATTEMPTS },
      },
      data: {
        status: 'FAILED',
        error: 'Stale claim reaped: downloader stopped responding.',
        claimedAt: null,
        claimedBy: null,
      },
    })

    const skippedIds: number[] = []

    for (let attempt = 0; attempt < CLAIM_TRIES; attempt++) {
      const candidate = await prisma.downloadRequest.findFirst({
        where: {
          attempts: { lt: MAX_ATTEMPTS },
          id: { notIn: skippedIds },
          OR: [
            { status: 'PENDING' },
            { status: 'CLAIMED', claimedAt: { lt: staleBefore } },
          ],
        },
        orderBy: { id: 'asc' },
      })

      if (!candidate) {
        return {
          success: true,
          message: 'No pending downloads.',
          data: { request: null },
          statusCode: 200,
        }
      }

      const won = await prisma.downloadRequest.updateMany({
        where: {
          id: candidate.id,
          status: candidate.status,
          claimedAt: candidate.claimedAt,
        },
        data: {
          status: 'CLAIMED',
          claimedAt: new Date(),
          claimedBy,
          attempts: { increment: 1 },
        },
      })

      if (won.count === 1) {
        const request = await prisma.downloadRequest.findUnique({
          where: { id: candidate.id },
        })

        return {
          success: true,
          message: 'Download claimed.',
          data: { request },
          statusCode: 200,
        }
      }

      skippedIds.push(candidate.id)
    }

    return {
      success: true,
      message: 'Queue contended; retry shortly.',
      data: { request: null },
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || 'Failed to claim download.',
      statusCode,
    }
  }
})
