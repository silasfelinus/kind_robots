// /utils/scripts/verifyManaResourceSplit.test.ts
//
// Regression test for kind-economy/t-006 (split the paid token resource
// from free mana). Exercises the two pure decision functions the split
// depends on, without touching a database:
//
//   - resolveManaResource() (server/utils/mana.ts): reason -> resource
//     mapping used by applyMana() for grants (PURCHASE/SUBSCRIPTION_GRANT
//     -> TOKENS, SIGNUP_BONUS/CYCLE_REFILL/etc -> MANA), and the "no
//     default, caller must say" guard for GENERATION_ART/GENERATION_TEXT
//     (resolved dynamically per spend) and ADMIN_REFUND/ADJUSTMENT
//     (genuinely ambiguous).
//
//   - resolveSpendResource() (server/utils/manaSpendResolution.ts, the sole
//     dependency of server/utils/manaGate.ts for this decision): the
//     tokens-then-mana-fallback spend resolution -- spend from tokens when
//     they alone cover the cost, fall back to mana otherwise, and report
//     insufficient only when NEITHER pool alone covers it (no partial
//     split across both pools).
//
// What this does NOT cover (documented, not silently skipped): the actual
// atomic credit/debit + ManaTransaction ledger row in applyMana(), the
// Stripe webhook's handleManaTopup(), and maybeRefill() all require a real
// database transaction and are not exercised here -- this sandbox has
// neither a live MariaDB instance nor Docker available to start one (see
// the PR description's Verification section for what was and wasn't run).
import assert from 'node:assert/strict'

import { resolveManaResource } from '../../server/utils/mana.js'
import { resolveSpendResource } from '../../server/utils/manaSpendResolution.js'

// --- resolveManaResource -----------------------------------------------

// Free/giveaway-shaped grants always land in MANA.
for (const reason of [
  'SIGNUP_BONUS',
  'CYCLE_REFILL',
  'SOCIAL_REACTION',
  'SOCIAL_SHARE',
  'BOUNTY_CREATE',
  'BOUNTY_REWARD',
  'KARMA_CONVERSION',
  'ACHIEVEMENT_CONFIRMED',
] as const) {
  assert.equal(
    resolveManaResource(reason),
    'MANA',
    `${reason} should default to MANA`,
  )
}

// Real-money grants always land in TOKENS.
for (const reason of ['PURCHASE', 'SUBSCRIPTION_GRANT'] as const) {
  assert.equal(
    resolveManaResource(reason),
    'TOKENS',
    `${reason} should default to TOKENS`,
  )
}

// GENERATION_ART/GENERATION_TEXT have no default -- resolved dynamically
// per spend by manaGate, not by reason. Omitting `resource` must throw
// rather than silently guessing a pool.
for (const reason of ['GENERATION_ART', 'GENERATION_TEXT'] as const) {
  assert.throws(
    () => resolveManaResource(reason),
    /requires an explicit opts\.resource/,
    `${reason} without an explicit resource should throw`,
  )
  // But an explicit resource (as manaGate always passes) is honored.
  assert.equal(resolveManaResource(reason, 'TOKENS'), 'TOKENS')
  assert.equal(resolveManaResource(reason, 'MANA'), 'MANA')
}

// ADMIN_REFUND/ADJUSTMENT are genuinely ambiguous -- same "must be explicit"
// requirement, for a different reason (not dynamic, just undecidable).
for (const reason of ['ADMIN_REFUND', 'ADJUSTMENT'] as const) {
  assert.throws(
    () => resolveManaResource(reason),
    /requires an explicit opts\.resource/,
    `${reason} without an explicit resource should throw`,
  )
  assert.equal(resolveManaResource(reason, 'EARNED'), 'EARNED')
}

// An explicit resource always wins over the reason-based default, for any
// reason (e.g. a hypothetical future EARNED-crediting caller on a reason
// that otherwise defaults to MANA).
assert.equal(resolveManaResource('SIGNUP_BONUS', 'EARNED'), 'EARNED')

console.log('✅ resolveManaResource: all reason -> resource mappings correct')

// --- resolveSpendResource -----------------------------------------------

// Free generation (cost 0): nothing is spent, no pool selected.
assert.deepEqual(
  resolveSpendResource({ cost: 0, tokenBalance: 0, manaBalance: 0 }),
  { ok: true, fundedBy: null },
)

// Tokens alone cover the cost -> spend from TOKENS (paid pool tried first).
assert.deepEqual(
  resolveSpendResource({ cost: 10, tokenBalance: 10, manaBalance: 0 }),
  { ok: true, fundedBy: 'TOKENS' },
)
assert.deepEqual(
  resolveSpendResource({ cost: 10, tokenBalance: 500, manaBalance: 500 }),
  { ok: true, fundedBy: 'TOKENS' },
  'tokens are tried first even when mana would also cover it',
)

// Tokens insufficient, mana alone covers it -> fall back to MANA. This is
// the exact regression this task exists to prevent: a user who has only
// ever used free mana (tokens = 0) must still be able to generate.
assert.deepEqual(
  resolveSpendResource({ cost: 10, tokenBalance: 0, manaBalance: 10 }),
  { ok: true, fundedBy: 'MANA' },
  'a mana-only user (tokens = 0) must still be able to spend',
)
assert.deepEqual(
  resolveSpendResource({ cost: 10, tokenBalance: 4, manaBalance: 10 }),
  { ok: true, fundedBy: 'MANA' },
  'no partial split: tokens alone (4) do not cover cost (10), so mana is used in full, not a 4+6 split',
)

// Neither pool alone covers the cost -> insufficient, exactly like the
// pre-split single-balance 402 behavior (no partial-split fallback).
assert.deepEqual(
  resolveSpendResource({ cost: 10, tokenBalance: 4, manaBalance: 4 }),
  { ok: false },
  '4 tokens + 4 mana = 8, neither alone covers a cost of 10 -> insufficient',
)
assert.deepEqual(
  resolveSpendResource({ cost: 10, tokenBalance: 0, manaBalance: 0 }),
  { ok: false },
)

console.log(
  '✅ resolveSpendResource: tokens-then-mana-fallback resolves correctly, no partial split, 402 only when neither pool alone covers the cost',
)

console.log('✅ verifyManaResourceSplit: all assertions passed')
