// /server/utils/manaGate.ts
import type { H3Event } from 'h3'
import { createError } from 'h3'
import prisma from './prisma'
import { validateApiKey } from './validateKey'
import { applyMana, usdToMana } from './mana'
import type { ManaReason } from '~/prisma/generated/prisma/client'

type GenKind = 'art' | 'text'

interface GateResult {
  user: { id: number; Role: string; mana: number }
  cost: number // mana that WILL be charged on commit (0 for free plans)
  estCostUsd: number
  free: boolean // family / byok / local — no debit
  useAdminToken: boolean
  // Call on SUCCESS to commit the charge + write the ledger row.
  commit: (
    refId: string,
    providerCostUsd?: number,
  ) => Promise<{ balance: number }>
}

interface GateOpts {
  kind: GenKind
  estCostUsd: number
  // 'community' = our tokens (charge). 'byok'/'local' = their resource (free).
  // 'family' forced free. Resolve from the request before calling.
  plan: 'community' | 'byok' | 'local'
}

/**
 * Authenticates, resolves billing, and verifies the user can afford the
 * generation BEFORE any work happens. Returns a `commit` you call only after
 * a successful generation so failed generations never charge.
 */
export async function manaGate(
  event: H3Event,
  opts: GateOpts,
): Promise<GateResult> {
  const { isValid, user: authUser } = await validateApiKey(event)
  if (!isValid || !authUser) {
    throw createError({ statusCode: 401, message: 'Invalid or expired token.' })
  }

  // validateApiKey returns a trimmed user (no wallet fields), and its balance
  // may be stale. Pull the authoritative wallet columns fresh.
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, Role: true, mana: true },
  })
  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found.' })
  }

  const reason: ManaReason =
    opts.kind === 'art' ? 'GENERATION_ART' : 'GENERATION_TEXT'

  // FAMILY: always free, runs on house tokens.
  const isFamily = user.Role === 'FAMILY'
  const free = isFamily || opts.plan === 'byok' || opts.plan === 'local'

  const cost = free ? 0 : usdToMana(opts.estCostUsd)

  // Pre-flight balance check — fail fast, before doing expensive work.
  if (!free && user.mana < cost) {
    throw createError({
      statusCode: 402,
      message: `Not enough mana. This costs ${cost} ⚡ and you have ${user.mana}.`,
      data: { code: 'INSUFFICIENT_MANA', cost, balance: user.mana },
    })
  }

  const commit = async (refId: string, providerCostUsd?: number) => {
    const provider = isFamily
      ? 'admin'
      : opts.plan === 'community'
        ? 'community'
        : opts.plan

    if (free) {
      // Log a zero-cost row for visibility, no balance change.
      await applyMana({
        userId: user.id,
        amount: 0,
        reason,
        refId,
        provider,
        costUsd: 0,
        note: isFamily ? 'family-free' : 'byo-resource',
      })
      return { balance: user.mana }
    }

    const { balance } = await applyMana({
      userId: user.id,
      amount: -cost,
      reason,
      refId,
      provider,
      costUsd: providerCostUsd ?? opts.estCostUsd,
    })

    // ADMIN: charge for real (so numbers are honest) then refund immediately.
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
    estCostUsd: opts.estCostUsd,
    free,
    useAdminToken: isFamily,
    commit,
  }
}
