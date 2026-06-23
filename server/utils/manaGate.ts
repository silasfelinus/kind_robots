// /server/utils/manaGate.ts
import { createError, type H3Event } from 'h3'
import prisma from './prisma'
import { requireApiUser } from './authGuard'

type ManaGateKind = 'text' | 'art' | 'video' | 'model' | 'free'

type ManaGateInput = {
  kind: ManaGateKind
  estCostUsd?: number
  serverId?: number | null
  useOwnResource?: boolean
}

type ManaGateResult = {
  user: {
    id: number
    mana: number | null
    Role?: string | null
  }
  cost: number
  free: boolean
  commit: (
    refId: string,
    providerCostUsd?: number,
  ) => Promise<{ balance: number }>
}

const MANA_PER_USD = 1000

export async function manaGate(
  event: H3Event,
  input: ManaGateInput,
): Promise<ManaGateResult> {
  const auth = await requireApiUser(event)

  const user = await prisma.user.findUnique({
    where: {
      id: auth.user.id,
    },
    select: {
      id: true,
      mana: true,
      Role: true,
    },
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Authorization user was not found.',
    })
  }

  const free = await isFreeGeneration({
    userId: user.id,
    serverId: input.serverId ?? null,
    useOwnResource: input.useOwnResource ?? false,
    isAdmin: auth.isAdmin,
    isServerKey: auth.isServerKey,
    kind: input.kind,
  })

  const cost = free
    ? 0
    : Math.max(1, Math.ceil((input.estCostUsd ?? 0.001) * MANA_PER_USD))

  const balance = user.mana ?? 0

  if (cost > 0 && balance < cost) {
    throw createError({
      statusCode: 402,
      message: `Not enough mana. Required: ${cost}, available: ${balance}.`,
    })
  }

  return {
    user,
    cost,
    free,
    commit: async (_refId: string, _providerCostUsd?: number) => {
      if (cost <= 0) {
        return {
          balance,
        }
      }

      const updated = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          mana: {
            decrement: cost,
          },
        },
        select: {
          mana: true,
        },
      })

      return {
        balance: updated.mana ?? 0,
      }
    },
  }
}

async function isFreeGeneration(input: {
  userId: number
  serverId?: number | null
  useOwnResource: boolean
  isAdmin: boolean
  isServerKey: boolean
  kind: ManaGateKind
}): Promise<boolean> {
  if (input.kind === 'free') return true
  if (input.useOwnResource) return true
  if (input.isAdmin) return true
  if (input.isServerKey) return true

  return await isFreeServerForUser({
    userId: input.userId,
    serverId: input.serverId ?? null,
  })
}

async function isFreeServerForUser(input: {
  userId: number
  serverId?: number | null
}): Promise<boolean> {
  if (!input.serverId) return false

  const server = await prisma.server.findFirst({
    where: {
      id: input.serverId,
      isActive: true,
    },
    select: {
      id: true,
      userId: true,
      isPublic: true,
      isOfficial: true,
    },
  })

  if (!server) return false

  if (server.userId === input.userId) return true
  if (server.isPublic && !server.isOfficial) return true

  return false
}
