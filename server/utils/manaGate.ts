// /server/utils/manaGate.ts
import type { H3Event } from 'h3'
import { createError } from 'h3'
import prisma from './prisma'
import { validateApiKey } from './validateKey'
import { applyMana, usdToMana } from './mana'
import type { ManaReason } from '~/prisma/generated/prisma/client'

type GenKind = 'art' | 'text'
interface GateOpts {
  kind: GenKind
  estCostUsd: number
  serverId: number | null
}

// Charge ONLY when the generation runs on a metered platform server.
// A null server means no server resolved at all → treat as metered fallback.
async function isMeteredServer(serverId: number | null): Promise<boolean> {
  if (serverId == null) return true // nothing resolved → platform fallback, charge

  const server = await prisma.server.findUnique({
    where: { id: serverId },
    select: { isMetered: true },
  })

  // Unknown server id → fail safe by charging (can't confirm it's the user's).
  return server?.isMetered ?? true
}

export async function manaGate(event: H3Event, opts: GateOpts) {
  const { isValid, user: authUser } = await validateApiKey(event)
  if (!isValid || !authUser) {
    throw createError({ statusCode: 401, message: 'Invalid or expired token.' })
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, Role: true, mana: true },
  })
  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found.' })
  }

  const reason: ManaReason =
    opts.kind === 'art' ? 'GENERATION_ART' : 'GENERATION_TEXT'

  const isFamily = user.Role === 'FAMILY'
  const metered = await isMeteredServer(opts.serverId)

  const free = isFamily || !metered
  const cost = free ? 0 : usdToMana(opts.estCostUsd)

  if (!free && user.mana < cost) {
    throw createError({
      statusCode: 402,
      message: `Not enough mana. This costs ${cost} ⚡ and you have ${user.mana}.`,
      data: { code: 'INSUFFICIENT_MANA', cost, balance: user.mana },
    })
  }

  const commit = async (refId: string, providerCostUsd?: number) => {
    if (free) {
      await applyMana({
        userId: user.id,
        amount: 0,
        reason,
        refId,
        provider: isFamily ? 'admin' : 'own-server',
        costUsd: 0,
        note: isFamily ? 'family-free' : 'unmetered-server',
      })
      return { balance: user.mana }
    }

    const { balance } = await applyMana({
      userId: user.id,
      amount: -cost,
      reason,
      refId,
      provider: 'platform',
      costUsd: providerCostUsd ?? opts.estCostUsd,
    })

    if (user.Role === 'ADMIN') {
      const refunded = await applyMana({
        userId: user.id,
        amount: cost,
        reason: 'ADMIN_REFUND',
        refId,
        note: `auto-refund for ${refId}`,
      })
      return { balance: refunded.balance }
    }

    return { balance }
  }

  return {
    user: { id: user.id, Role: user.Role, mana: user.mana },
    cost,
    free,
    useAdminToken: isFamily,
    commit,
  }
}
