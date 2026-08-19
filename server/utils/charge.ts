// /server/utils/charge.ts
import { applyMana, usdToMana } from './mana'
import type { Role } from '~/prisma/generated/prisma/client'
import { userIsAdmin, userHasRole } from './authUser'

type Plan = 'community' | 'byok' | 'local' | 'family'

// NOTE (kind-economy/t-006 audit): grepping the whole server tree finds no
// caller of chargeForGeneration -- server/utils/manaGate.ts is the actual
// spend chokepoint every route uses (see generationMana.ts). This function
// predates and is not part of the tokens/mana split; the `resource: 'MANA'`
// below only preserves its pre-existing behavior (debiting a single pool,
// same as before this task) in case it's ever wired up. If it IS wired up
// later, it should be reworked to use manaGate's tokens-then-mana-fallback
// resolution instead of hardcoding MANA.
//
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
  if (userHasRole(user, 'FAMILY') || plan === 'family') {
    await applyMana({
      userId: user.id,
      amount: 0,
      reason,
      resource: 'MANA',
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
      resource: 'MANA',
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
    resource: 'MANA',
    refId,
    provider: 'community',
    costUsd: estCostUsd,
  })

  // ADMIN: refund immediately so the test shows real cost but doesn't drain
  if (userIsAdmin(user)) {
    await applyMana({
      userId: user.id,
      amount: cost,
      reason: 'ADMIN_REFUND',
      resource: 'MANA',
      refId,
      note: `auto-refund for ${refId}`,
    })
  }
  return { charged: cost, useAdminToken: false }
}
