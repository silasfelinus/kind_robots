import { createError } from 'h3'
import type { ArtJob } from '~/prisma/generated/prisma/client'
import prisma from './prisma'
import {
  allocateFreeKrea2Slot,
  FREE_KREA2_QUEUE_PRIORITY,
  PAID_GENERATION_PRIORITY_FLOOR,
  recordFreeKrea2Claim,
  type FreeKrea2Allocation,
} from './freeGenerationQuota'

type Krea2QuotaGate = {
  user: { id: number }
  agentProfileId: number | null
  cost: number
  free: boolean
  canPay: boolean
  balance: number
  commit: (refId: string) => Promise<{ balance: number }>
}

type Krea2JobInput = {
  payload: string
  priority: number
  projectSlug: string | null
  userId: number
}

export type Krea2QueueAdmission = {
  job: ArtJob
  balance: number
  charged: number
  subsidy: FreeKrea2Allocation | null
  funded: 'existing-free-rule' | 'daily-free-krea2' | 'paid'
}

function freePriority(requested: number): number {
  return Math.min(requested, FREE_KREA2_QUEUE_PRIORITY)
}

function paidPriority(requested: number): number {
  return Math.max(requested, PAID_GENERATION_PRIORITY_FLOOR)
}

/**
 * Create one queued Krea2 job using the existing free-server/admin rules,
 * Rainbow's human-owned daily subsidy, or normal mana/token billing.
 *
 * Subsidy reservation and ArtJob creation share a transaction so a concurrent
 * request cannot spend the same human/global slot. Paid debiting remains the
 * existing post-create manaGate commit behavior. Daily subsidy never consumes
 * mana/tokens, and multiple AgentProfiles owned by one human all compete for
 * the same userId counter while agentProfileId is retained only for audit.
 */
export async function enqueueKrea2WithQuota(input: {
  gate: Krea2QuotaGate
  job: Krea2JobInput
  refPrefix: string
}): Promise<Krea2QueueAdmission> {
  if (input.job.userId !== input.gate.user.id) {
    throw createError({
      statusCode: 403,
      message: 'Generation quota owner and queued job owner do not match.',
    })
  }

  // Existing Kind Robots free semantics take precedence: own server, donated
  // public non-official server, admin/FAMILY and other trusted free paths do
  // not consume Rainbow's subsidized first-party Krea2 pool.
  if (input.gate.free) {
    const job = await prisma.artJob.create({
      data: {
        engine: 'COMFY',
        payload: input.job.payload,
        priority: input.job.priority,
        projectSlug: input.job.projectSlug,
        userId: input.job.userId,
      },
    })
    const { balance } = await input.gate.commit(`${input.refPrefix}:${job.id}`)
    return {
      job,
      balance,
      charged: 0,
      subsidy: null,
      funded: 'existing-free-rule',
    }
  }

  const reserved = await prisma.$transaction(async (tx) => {
    const subsidy = await allocateFreeKrea2Slot(tx, {
      userId: input.job.userId,
    })
    if (!subsidy.claimed || !subsidy.day) return { subsidy, job: null }

    const job = await tx.artJob.create({
      data: {
        engine: 'COMFY',
        payload: input.job.payload,
        priority: freePriority(input.job.priority),
        projectSlug: input.job.projectSlug,
        userId: input.job.userId,
      },
    })
    await recordFreeKrea2Claim(tx, {
      artJobId: job.id,
      userId: input.job.userId,
      agentProfileId: input.gate.agentProfileId,
      day: subsidy.day,
    })
    return { subsidy, job }
  })

  if (reserved.job && reserved.subsidy.claimed) {
    return {
      job: reserved.job,
      balance: input.gate.balance,
      charged: 0,
      subsidy: reserved.subsidy,
      funded: 'daily-free-krea2',
    }
  }

  if (reserved.subsidy.reason === 'capacity-full') {
    throw createError({
      statusCode: 503,
      message:
        'Free Krea2 capacity is fully reserved for the next several days. No paid generation was started. Try again later or use your own generator server.',
    })
  }

  // Personal daily exhaustion or a disabled free policy is the normal paid
  // overage boundary. If the caller cannot pay, rethrow manaGate's original
  // 402 before creating a job. This is intentionally distinct from global
  // capacity exhaustion above, which must never silently become paid work.
  if (!input.gate.canPay) {
    await input.gate.commit(`${input.refPrefix}:quota-overage`)
    throw createError({ statusCode: 402, message: 'Generation balance required.' })
  }

  const job = await prisma.artJob.create({
    data: {
      engine: 'COMFY',
      payload: input.job.payload,
      priority: paidPriority(input.job.priority),
      projectSlug: input.job.projectSlug,
      userId: input.job.userId,
    },
  })
  const { balance } = await input.gate.commit(`${input.refPrefix}:${job.id}`)
  return {
    job,
    balance,
    charged: input.gate.cost,
    subsidy: reserved.subsidy,
    funded: 'paid',
  }
}
