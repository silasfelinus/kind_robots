import { createError, type H3Event } from 'h3'
import type { Prisma } from '~/prisma/generated/prisma/client'
import { requireScopedApiUser } from './authGuard'
import { userRoles } from './authUser'
import { estimateArtCostUsd } from './manaCost'
import { manaGate } from './manaGate'
import prisma from './prisma'
import {
  deferredKrea2QueueError,
  enqueueKrea2PublicFreeJob,
  getKrea2QuotaStatus,
  type Krea2QuotaStatus,
} from './krea2Quota'

type Krea2GateInput = {
  steps?: number | null
  width?: number | null
  height?: number | null
  serverId?: number | null
}

type Krea2QuotaMode =
  | 'RESOURCE_FREE'
  | 'FREE_QUOTA'
  | 'DEFERRED_FREE'
  | 'PAID_TOKENS'

type Krea2EnqueueOutcome = {
  job: Awaited<ReturnType<typeof prisma.artJob.create>>
  balance: number
  charged: number
  quotaMode: Krea2QuotaMode
  quota: Krea2QuotaStatus | null
}

export type Krea2GenerationGate = {
  user: { id: number }
  isAdmin: boolean
  cost: number
  free: boolean
  quotaMode: Krea2QuotaMode
  quota: Krea2QuotaStatus | null
  enqueueArtJob: (
    data: Prisma.ArtJobUncheckedCreateInput,
    refPrefix: string,
  ) => Promise<Krea2EnqueueOutcome>
}

async function usesFreeCompute(input: {
  userId: number
  serverId?: number | null
  isAdmin: boolean
  isServerKey: boolean
  roles: readonly string[]
}): Promise<boolean> {
  if (input.isAdmin || input.isServerKey) return true
  if (input.roles.some((role) => String(role).toUpperCase() === 'FAMILY')) {
    return true
  }
  if (!input.serverId) return false

  const server = await prisma.server.findFirst({
    where: { id: input.serverId, isActive: true },
    select: { userId: true, isPublic: true, isOfficial: true },
  })
  if (!server) return false
  return (
    server.userId === input.userId ||
    (server.isPublic === true && server.isOfficial === false)
  )
}

async function requirePaidTokenGate(
  event: H3Event,
  input: Krea2GateInput,
) {
  const paid = await manaGate(event, {
    kind: 'art',
    estCostUsd: estimateArtCostUsd({
      engine: 'comfy',
      steps: input.steps,
      width: input.width,
      height: input.height,
    }),
    serverId: input.serverId ?? null,
  })

  if (!paid.free && paid.fundedBy !== 'TOKENS') {
    throw createError({
      statusCode: 402,
      message:
        'Your daily free Krea 2 allowance is used. Additional Krea 2 generations require paid tokens; free mana is not used as an overflow pool.',
    })
  }
  return paid
}

/**
 * Krea 2 public capacity is intentionally separate from mana. Ordinary humans
 * and all AgentProfiles they operate share one daily allowance. Own/community
 * compute remains free without consuming the public pool. Once the human daily
 * allowance is used, additional work must be funded by paid TOKENS.
 */
export async function krea2GenerationGate(
  event: H3Event,
  input: Krea2GateInput,
): Promise<Krea2GenerationGate> {
  const auth = await requireScopedApiUser(event, 'generation:art')
  const intrinsicFree = await usesFreeCompute({
    userId: auth.user.id,
    serverId: input.serverId ?? null,
    isAdmin: auth.isAdmin,
    isServerKey: auth.isServerKey,
    roles: [...userRoles(auth.user)],
  })

  if (intrinsicFree) {
    const gate = await manaGate(event, {
      kind: 'art',
      estCostUsd: estimateArtCostUsd({
        engine: 'comfy',
        steps: input.steps,
        width: input.width,
        height: input.height,
      }),
      serverId: input.serverId ?? null,
    })
    return {
      user: { id: auth.user.id },
      isAdmin: auth.isAdmin,
      cost: 0,
      free: true,
      quotaMode: 'RESOURCE_FREE',
      quota: null,
      enqueueArtJob: async (data, refPrefix) => {
        const job = await prisma.artJob.create({ data })
        const committed = await gate.commit(`${refPrefix}:${job.id}`)
        return {
          job,
          balance: committed.balance,
          charged: 0,
          quotaMode: 'RESOURCE_FREE',
          quota: null,
        }
      },
    }
  }

  const quota = await getKrea2QuotaStatus(auth.user.id)
  if (quota.userRemaining <= 0) {
    const paid = await requirePaidTokenGate(event, input)
    return {
      user: { id: auth.user.id },
      isAdmin: auth.isAdmin,
      cost: paid.cost,
      free: false,
      quotaMode: 'PAID_TOKENS',
      quota,
      enqueueArtJob: async (data, refPrefix) => {
        const priority = Math.max(Number(data.priority ?? 100), 200)
        const job = await prisma.artJob.create({ data: { ...data, priority } })
        const committed = await paid.commit(`${refPrefix}:${job.id}`)
        return {
          job,
          balance: committed.balance,
          charged: paid.cost,
          quotaMode: 'PAID_TOKENS',
          quota: await getKrea2QuotaStatus(auth.user.id),
        }
      },
    }
  }

  const initialMode: Krea2QuotaMode =
    quota.publicRemaining > 0 ? 'FREE_QUOTA' : 'DEFERRED_FREE'

  return {
    user: { id: auth.user.id },
    isAdmin: auth.isAdmin,
    cost: 0,
    free: true,
    quotaMode: initialMode,
    quota,
    enqueueArtJob: async (data, refPrefix) => {
      const freeResult = await enqueueKrea2PublicFreeJob(data, {
        userId: auth.user.id,
        agentProfileId: auth.agentProfileId ?? null,
        credentialId: auth.credentialId ?? null,
      })

      if (freeResult.mode === 'DEFERRED_LIMIT') {
        deferredKrea2QueueError()
      }

      if (freeResult.mode === 'USER_LIMIT') {
        // Another tab/agent may have claimed the human's final daily slot after
        // the preflight above. Fall back to the same explicit paid-token rule;
        // never silently consume legacy free mana.
        const paid = await requirePaidTokenGate(event, input)
        const priority = Math.max(Number(data.priority ?? 100), 200)
        const job = await prisma.artJob.create({ data: { ...data, priority } })
        const committed = await paid.commit(`${refPrefix}:${job.id}`)
        return {
          job,
          balance: committed.balance,
          charged: paid.cost,
          quotaMode: 'PAID_TOKENS',
          quota: await getKrea2QuotaStatus(auth.user.id),
        }
      }

      const job = await prisma.artJob.findUnique({
        where: { id: freeResult.job.id },
      })
      if (!job) {
        throw createError({
          statusCode: 500,
          message: 'The Krea 2 queue job could not be reloaded after enqueue.',
        })
      }
      return {
        job,
        balance: Number(auth.user.mana ?? 0),
        charged: 0,
        quotaMode: freeResult.mode,
        quota: await getKrea2QuotaStatus(auth.user.id),
      }
    },
  }
}
