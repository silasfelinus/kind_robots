// /server/utils/manaSpendResolution.ts
//
// kind-economy/t-006: tokens-then-mana-fallback spend resolution, kept in
// its own dependency-free module (no prisma, no Nuxt/H3 auto-imports) so it
// can be unit-tested without a database or a Nuxt runtime -- see
// utils/scripts/verifyManaResourceSplit.test.ts. server/utils/manaGate.ts
// is the one caller; do not add framework imports here.
//
// Every existing user's balance was a mix of free refills and past
// purchases (today's bug); making generation tokens-only would zero out
// anyone who never bought anything the moment this ships. So: spend from
// tokens (the paid pool) when it alone covers the cost -- this is the only
// pool future creator-attribution (t-007/t-008) may ever credit from -- and
// fall back to mana (the free pool) otherwise, preserving today's "if your
// balance covers it, you can generate" behavior. No partial split of one
// spend across both pools: whichever single pool covers the full cost is
// used, tokens first; if neither alone covers it, insufficient (ok: false)
// as before.
export type ManaSpendResource = 'MANA' | 'TOKENS'

export function resolveSpendResource(input: {
  cost: number
  tokenBalance: number
  manaBalance: number
}): { ok: true; fundedBy: ManaSpendResource | null } | { ok: false } {
  if (input.cost <= 0) return { ok: true, fundedBy: null }
  if (input.tokenBalance >= input.cost) return { ok: true, fundedBy: 'TOKENS' }
  if (input.manaBalance >= input.cost) return { ok: true, fundedBy: 'MANA' }
  return { ok: false }
}
