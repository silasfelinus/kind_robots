// utils/scripts/verifyAquariumSpendLocks.test.ts
//
// Contract for the Cthulhuquarium release-candidate review (2026-11-21): every
// write that spends coins, adds a fish or settles elapsed time takes the tank
// row lock (lockTank, SELECT ... FOR UPDATE) as its transaction's first
// statement and re-checks what it read outside it. Before this, two open tabs
// paid the same absence twice, a double-tapped finale charged twice and
// parallel purchases overdrew coins and overfilled the tank. The behaviour is
// exercised against a database by conductor
// projects/cthulhuquarium/data/api_exploit_suite.mjs; this guards the shape.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const source = readFileSync(join(root, 'server/utils/aquarium.ts'), 'utf8')

function body(name: string): string {
  const start = source.indexOf(`export async function ${name}(`)
  assert.ok(start >= 0, `${name} exists`)
  const next = source.indexOf('\nexport ', start + 1)
  return source.slice(start, next === -1 ? undefined : next)
}

function firstStatementInTransaction(fn: string): string {
  const tx = fn.indexOf('prisma.$transaction(')
  assert.ok(tx >= 0, 'has a transaction')
  const open = fn.indexOf('{', fn.indexOf('=>', tx))
  return fn.slice(open + 1, open + 400).trim()
}

assert.match(
  source,
  /SELECT coins, lastTickAt FROM Aquarium WHERE id = \$\{aquariumId\} FOR UPDATE/,
  'lockTank takes a row lock on the tank',
)

for (const name of [
  'settleTickForUser',
  'feedFishForUser',
  'purchaseSpeciesForUser',
  'equipSetForUser',
  'purchaseLastAquariumForUser',
  'purchaseDecorForUser',
]) {
  const first = firstStatementInTransaction(body(name))
  assert.ok(
    /^(\/\/[^\n]*\n\s*)*const locked = await lockTank\(tx, tank\.id\)/.test(
      first,
    ),
    `${name}: lockTank is the transaction's first statement`,
  )
}

const tick = body('settleTickForUser')
assert.ok(
  tick.includes('locked.lastTickAt?.getTime() !== tank.lastTickAt?.getTime()'),
  'tick settles nothing when another settle moved the anchor',
)
assert.ok(tick.includes('if (!settled)'), 'a stale tick returns a no-op result')

const purchase = body('purchaseSpeciesForUser')
assert.ok(
  purchase.includes('requireCoins(locked.coins, cost') &&
    purchase.includes('tx.aquariumStock.count('),
  'species purchase re-checks coins and room under the lock',
)

const finale = body('purchaseLastAquariumForUser')
assert.ok(
  finale.includes('boughtMeanwhile'),
  'the finale re-checks that it was not bought meanwhile',
)

// Grandfathering: a per-tank marker, never a wall-clock cutoff.
assert.ok(
  !source.includes('FLOOR_KEYS_INTRODUCED_AT'),
  'no wall-clock grandfather cutoff',
)
assert.ok(
  source.includes("const FLOOR_KEYS_MARKER = 'floor-keys-introduced'") &&
    source.includes('Events: { create: { kind: FLOOR_KEYS_MARKER } }'),
  'new tanks are born past the one-time key grant',
)

console.log(
  '✅ verifyAquariumSpendLocks: every spend and settle is serialized on the tank row; grandfathering is per tank',
)
