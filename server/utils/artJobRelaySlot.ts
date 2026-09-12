// /server/utils/artJobRelaySlot.ts
//
// The home relay (conductor ops/home-server/relay_agent.py) is one slot: it
// claims a job, renders it, reports the outcome, and only then polls
// /api/art/queue/claim again. So a claim poll from an agent that still holds a
// RUNNING row is proof that row was abandoned — the relay restarted between
// claim and complete, the /complete POST was lost, or process() crashed and the
// failure report never landed. Left alone, that row stayed RUNNING beside the
// fresh claim until the queue happened to re-offer it after the stale window,
// and a low-priority one could sit behind priority-100 work for hours
// (2026-09-12: #21788, attempt 2, RUNNING for 63 minutes next to the live
// #21803, both shown as running on the dashboard).
//
// Releasing mirrors the relay's own shutdown handler (requeue with
// resetAttempts=false): the attempt was counted at claim time, and keeping the
// count means a job that wedges the relay on every try still reaches the
// attempt budget and stops instead of looping forever.
import prisma from './prisma'

export const RELAY_CLAIM_RELEASE_REASON =
  'Released by the queue: the relay polled for new work while this job was still marked RUNNING, so its outcome report never arrived.'

export type ReleasedRelayClaim = {
  id: number
  attempts: number
  status: 'PENDING' | 'FAILED'
}

export function relayClaimReleaseError(priorError: string | null | undefined) {
  const prior = priorError?.trim()
  return (
    prior
      ? `${RELAY_CLAIM_RELEASE_REASON} Previous error: ${prior}`
      : RELAY_CLAIM_RELEASE_REASON
  ).slice(0, 4000)
}

export async function releaseAbandonedRelayClaims(
  claimedBy: string,
  maxAttempts: number,
): Promise<ReleasedRelayClaim[]> {
  const held = await prisma.artJob.findMany({
    where: { status: 'RUNNING', claimedBy },
    select: { id: true, attempts: true, claimedAt: true, error: true },
  })

  const released: ReleasedRelayClaim[] = []

  for (const job of held) {
    const status = job.attempts >= maxAttempts ? 'FAILED' : 'PENDING'

    // Guarded on the claim we read so a completion that lands in between wins.
    const result = await prisma.artJob.updateMany({
      where: { id: job.id, status: 'RUNNING', claimedAt: job.claimedAt },
      data: {
        status,
        error: relayClaimReleaseError(job.error),
        claimedAt: null,
        claimedBy: null,
      },
    })

    if (result.count !== 1) continue

    released.push({ id: job.id, attempts: job.attempts, status })
    console.warn(
      `⚠️ ArtJob ${job.id} was still RUNNING (attempt ${job.attempts}) when relay ${claimedBy} polled for new work — released to ${status}.`,
    )
  }

  return released
}
