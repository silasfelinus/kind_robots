// /server/utils/charge.ts
import { applyMana, usdToMana } from './mana'
import type { Role } from '~/prisma/generated/prisma/client'

type Plan = 'community' | 'byok' | 'local' | 'family'

// Decide how this generation is billed before doing work.
export async function chargeForGeneration(opts: {
  user: { id: number; Role: Role }
  kind: 'art' | 'text'
  plan: Plan // resolved by your server-selection logic
  estCostUsd: number // your estimate from model + tokens
  refId: string
}) {
  const { user, kind, plan, estCostUsd, refId } = opts
  const reason = kind === 'art' ? 'GENERATION_ART' : 'GENERATION_TEXT'

  // FAMILY: free on admin token, logged at zero for visibility
  if (user.Role === 'FAMILY' || plan === 'family') {
    await applyMana({
      userId: user.id,
      amount: 0,
      reason,
      refId,
      provider: 'admin',
      costUsd: 0,
      note: 'family-free',
    })
    return { charged: 0, useAdminToken: true }
  }

  // BYOK / local: no charge, they pay their own way
  if (plan === 'byok' || plan === 'local') {
    await applyMana({
      userId: user.id,
      amount: 0,
      reason,
      refId,
      provider: plan,
      costUsd: 0,
      note: 'byo-resource',
    })
    return { charged: 0, useAdminToken: false }
  }

  // Community pool: real debit
  const cost = usdToMana(estCostUsd)
  await applyMana({
    userId: user.id,
    amount: -cost,
    reason,
    refId,
    provider: 'community',
    costUsd: estCostUsd,
  })

  // ADMIN: refund immediately so the test shows real cost but doesn't drain
  if (user.Role === 'ADMIN') {
    await applyMana({
      userId: user.id,
      amount: cost,
      reason: 'ADMIN_REFUND',
      refId,
      note: `auto-refund for ${refId}`,
    })
  }
  return { charged: cost, useAdminToken: false }
}
