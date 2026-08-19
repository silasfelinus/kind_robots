// /server/utils/revenueSplit.ts
//
// kind-economy/t-008: the immutable RevenueSplit ledger's pure, dependency-
// free calculation core. No prisma, no Nuxt/H3 imports -- unit-testable
// without a database, same discipline as server/utils/manaSpendResolution.ts
// (see utils/scripts/verifyRevenueSplit.test.ts). server/utils/manaGate.ts
// is the sole caller that turns a computeRevenueSplit() result into a
// database row, inside its commit() closure, for TOKENS-funded spends only.
//
// BASIS (Silas, 2026-08-19, verbatim): "Profit share should be net. Not
// gross." -- payment-processing fee and provider (model/GPU) cost come off
// the top of gross FIRST; only what remains (net) is split three ways.
// Integer cents only, everywhere in this module -- never floats -- so the
// invariant below can be asserted with exact equality, not an epsilon.
//
// INVARIANT (property-tested): for every input,
//   platformShareCents + missionShareCents + creatorShareCents
//     + paymentProcessingFeeCents + providerCostCents
//     + roundingRemainderCents === grossCents
// exactly, and no share field is ever negative. roundingRemainderCents
// itself is signed: it is 0 whenever netCents > 0 (the rounding leftover in
// that case is folded directly into platformShareCents, see below -- so
// there is nothing left to report separately), and it carries the
// (non-positive) shortfall verbatim whenever netCents <= 0, when all three
// shares are forced to 0. It never does both at once.

// ---------------------------------------------------------------------------
// USD/token <-> cents conversion
// ---------------------------------------------------------------------------

// The SAME peg server/utils/mana.ts uses to convert USD into spendable
// token/mana units (1 unit = PEG_USD_PER_MANA USD = 1000 units per dollar).
// Defined HERE, not there, specifically so this module stays prisma-free
// (mana.ts imports server/utils/prisma.ts at module scope, which throws
// synchronously without a live DATABASE_URL -- see
// utils/scripts/verifyManaAttribution.test.ts's comment on the same issue)
// -- mana.ts imports and re-exports this constant instead of defining its
// own copy, so there is still exactly one number, just owned by the
// dependency-free side of the relationship rather than the prisma-coupled
// side.
export const PEG_USD_PER_MANA = 0.001

const CENTS_PER_USD = 100

/**
 * Convert a spent token/mana amount (integer units, as debited by
 * applyMana()) into its USD-cent gross value via the existing peg.
 *
 * ROUNDING POLICY: round-half-up to the nearest cent. A single unit costs
 * PEG_USD_PER_MANA * 100 = 0.1 cent, i.e. sub-cent -- the smallest real
 * spend (cost=1, the manaGate.ts floor) rounds DOWN to 0 gross cents here,
 * which is intentional, not a bug: a 0-gross-cent row still gets a
 * RevenueSplit row (0 gross, and typically 0 fee/cost/shares too), so the
 * ledger stays complete rather than silently skipping sub-cent spends.
 */
export function tokensToGrossCents(tokenAmount: number): number {
  if (!Number.isInteger(tokenAmount) || tokenAmount < 0) {
    throw new Error(
      `tokensToGrossCents: tokenAmount must be a non-negative integer, got ${tokenAmount}.`,
    )
  }
  return Math.round(tokenAmount * PEG_USD_PER_MANA * CENTS_PER_USD)
}

/**
 * Convert a USD amount (e.g. ManaTransaction.costUsd) into integer cents,
 * round-half-up. Returns 0 for null/undefined/negative/non-finite input
 * rather than throwing or producing NaN -- see the caller-side comment in
 * server/utils/manaGate.ts on why costUsd can legitimately be missing.
 */
export function usdToCents(usd: number | null | undefined): number {
  if (usd == null || !Number.isFinite(usd) || usd < 0) return 0
  return Math.round(usd * CENTS_PER_USD)
}

// ---------------------------------------------------------------------------
// Payment-processing fee policy
// ---------------------------------------------------------------------------

// FEE POLICY (documented judgment call -- Silas/Reviewer can override with a
// one-line change here): tokens are purchased in one batch (Stripe's ~2.9%
// + $0.30 applies once, at PURCHASE-time checkout) but spent later,
// fungibly, across many separate generations -- there is no way to trace
// which specific token purchase funded which specific spend, so a real
// per-transaction Stripe fee lookup is not possible at spend time.
//
// Chosen policy: treat the processing fee as already absorbed at
// purchase time (netted into how many tokens a dollar buys), and do NOT
// re-deduct a modeled fee on every downstream spend -- re-deducting one here
// would double-count a cost the token purchase already paid once. This
// constant is the single override point: setting it above 0 switches every
// future spend to also carry an assumed flat-rate processing fee
// (grossCents * rate) as a modeling simplification, if a future reviewer
// decides the per-spend attribution is worth doing anyway.
export const ASSUMED_PAYMENT_PROCESSING_FEE_RATE = 0

export function computePaymentProcessingFeeCents(grossCents: number): number {
  return Math.round(grossCents * ASSUMED_PAYMENT_PROCESSING_FEE_RATE)
}

// ---------------------------------------------------------------------------
// Three-way net split
// ---------------------------------------------------------------------------

// kind-economy/t-008: the split ratio behind one named constant so a future
// change to the percentages (or a move away from equal thirds) is a
// one-line edit -- change these weights together, everything else derives
// from them.
export const REVENUE_SPLIT_RATIO = {
  platform: 1,
  mission: 1,
  creator: 1,
} as const

const RATIO_TOTAL =
  REVENUE_SPLIT_RATIO.platform +
  REVENUE_SPLIT_RATIO.mission +
  REVENUE_SPLIT_RATIO.creator

export type RevenueSplitInput = {
  grossCents: number
  paymentProcessingFeeCents: number
  providerCostCents: number
}

export type RevenueSplitResult = {
  platformShareCents: number
  missionShareCents: number
  creatorShareCents: number
  // See the file-level INVARIANT comment: 0 in the normal (netCents > 0)
  // case, the (non-positive) shortfall when netCents <= 0.
  roundingRemainderCents: number
}

/**
 * Split a spend's net revenue (gross minus payment-processing fee minus
 * provider cost) three ways -- platform / mission / creator -- per
 * REVENUE_SPLIT_RATIO.
 *
 * NEGATIVE-NET POLICY: a spend whose off-the-top costs meet or exceed its
 * gross produces a zero-margin row -- all three shares are forced to 0,
 * NEVER negative. The shortfall (grossCents - fee - cost, which is <= 0 in
 * this branch) is recorded verbatim in roundingRemainderCents so the
 * top-level invariant (sum of everything === grossCents) still holds
 * exactly for these rows too, instead of silently dropping the loss.
 *
 * ROUNDING POLICY (netCents > 0 case): floor each share at
 * netCents * ratio/RATIO_TOTAL, then fold the ENTIRE non-negative leftover
 * (0..RATIO_TOTAL-1 cents -- at most 2 cents for equal thirds) into the
 * platform share. Platform is the fixed remainder-absorber (never mission
 * or creator) because it is the one share with no per-user or per-creator
 * variance to audit against -- an off-by-a-cent-or-two always lands
 * somewhere deterministic and auditable, never silently inflating whichever
 * creator happened to be attributed to that particular spend.
 */
export function computeRevenueSplit(
  input: RevenueSplitInput,
): RevenueSplitResult {
  const { grossCents, paymentProcessingFeeCents, providerCostCents } = input

  for (const [name, value] of Object.entries(input)) {
    if (!Number.isInteger(value)) {
      throw new Error(
        `computeRevenueSplit: ${name} must be an integer number of cents (never a float), got ${value}.`,
      )
    }
  }
  if (grossCents < 0) {
    throw new Error('computeRevenueSplit: grossCents must not be negative.')
  }

  const netCents = grossCents - paymentProcessingFeeCents - providerCostCents

  if (netCents <= 0) {
    return {
      platformShareCents: 0,
      missionShareCents: 0,
      creatorShareCents: 0,
      roundingRemainderCents: netCents,
    }
  }

  const platformBase = Math.floor(
    (netCents * REVENUE_SPLIT_RATIO.platform) / RATIO_TOTAL,
  )
  const missionBase = Math.floor(
    (netCents * REVENUE_SPLIT_RATIO.mission) / RATIO_TOTAL,
  )
  const creatorBase = Math.floor(
    (netCents * REVENUE_SPLIT_RATIO.creator) / RATIO_TOTAL,
  )
  const leftover = netCents - platformBase - missionBase - creatorBase

  return {
    platformShareCents: platformBase + leftover,
    missionShareCents: missionBase,
    creatorShareCents: creatorBase,
    roundingRemainderCents: 0,
  }
}
