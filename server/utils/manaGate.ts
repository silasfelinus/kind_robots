// /server/utils/manaGate.ts
import { createError, type H3Event } from 'h3'
import prisma from './prisma'

type ManaGateKind = 'text' | 'art' | 'video' | 'model' | 'free'

type ManaGateInput = {
  kind: ManaGateKind
  estCostUsd?: number
  serverId?: number | null
}

type ManaGateResult = {
  user: {
    id: number
    mana: number | null
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
  const authorizationHeader = event.node.req.headers.authorization

  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message: 'Authorization token is required in the format "Bearer <token>".',
    })
  }

  const token = authorizationHeader.split(' ')[1] ?? ''

  const user = await prisma.user.findFirst({
    where: {
      apiKey: token,
    },
    select: {
      id: true,
      mana: true,
    },
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired authorization token.',
    })
  }

  const free = await isFreeServerForUser({
    userId: user.id,
    serverId: input.serverId ?? null,
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
    commit: async (refId: string, providerCostUsd?: number) => {
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

      await prisma.manaLedger.create({
        data: {
          userId: user.id,
          kind: input.kind,
          amount: -cost,
          refId,
          providerCostUsd: providerCostUsd ?? input.estCostUsd ?? null,
        },
      }).catch(() => null)

      return {
        balance: updated.mana ?? 0,
      }
    },
  }
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