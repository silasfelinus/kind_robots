// Seeded balance thresholds (conductor shifting-desks t-019). The report in
// conductor projects/shifting-desks/BALANCE-REPORT.md is this same simulation.
import assert from 'node:assert/strict'
import { POLICIES, balanceReport } from '../shiftingDesks/balance'
import {
  DEPARTMENTS,
  ENDINGS,
  ORIENTATION,
  TOY_DIVISION,
} from '../shiftingDesks/rules'

const report = balanceReport(2000)
const named = report.policies
const lost = (counts: Record<string, number>) =>
  Object.values(counts).reduce((a, b) => a + b, 0)
const seen = (endings: Record<string, number>) =>
  Object.keys(endings).filter((id) => endings[id]! > 0)

assert.deepEqual(
  named.map((p) => p.policy),
  POLICIES.map((p) => p.id),
)
assert.ok(POLICIES.length >= 4, 'complier, rebel, coward and saint all play')

for (const p of named) {
  const perRun = lost(p.successorDeaths) / p.runs
  // No clean wins: every temperament pays in Successors.
  assert.ok(perRun >= 2, `${p.policy} loses Successors (${perRun.toFixed(2)})`)
  assert.ok(
    p.eliminated <= p.runs * 0.5,
    `${p.policy} is eliminated at most half the time (${p.eliminated})`,
  )
  assert.ok(
    p.completed >= p.runs * 0.4,
    `${p.policy} finishes often enough to see an ending (${p.completed})`,
  )
  for (const d of DEPARTMENTS) {
    assert.ok(
      (p.successorDeaths[d.department.id] ?? 0) / p.runs <= 2,
      `${p.policy} survives ${d.department.id} without a massacre`,
    )
  }
}

// Every ending is reachable by some temperament, and by random play alone.
const byNamed = new Set(named.flatMap((p) => seen(p.endings)))
for (const e of ENDINGS) {
  assert.ok(byNamed.has(e.id), `${e.id} is reached by some temperament`)
}
assert.equal(seen(report.random.endings).length, ENDINGS.length)

// Safety is buyable, but it never buys a payoff ending.
const coward = named.find((p) => p.policy === 'coward')!
for (const id of seen(coward.endings)) {
  assert.ok(
    [
      'employee-of-the-month',
      'early-retirement',
      'position-eliminated',
    ].includes(id),
    `playing it safe stays out of the payoff endings (${id})`,
  )
}

assert.deepEqual(
  report.dominantChoices,
  [],
  'no choice is the same call for every temperament',
)
// Deep callbacks may stay rare; an ungated choice nobody ever takes is dead.
for (const { card, choice } of report.unpickedChoices) {
  const c = DEPARTMENTS.flatMap((d) => [...d.encounters, d.boss])
    .find((x) => x.id === card)!
    .choices.find((x) => x.id === choice)!
  assert.ok(c.requires?.flag, `${card}/${choice} is only rare because gated`)
}

// The tuning the first report called for stays in place.
const swap = ORIENTATION.boss.choices.find((c) => c.id === 'swap-the-file')!
assert.equal(swap.cost.successors, undefined, 'no Successor spent up front')
assert.equal(swap.success.effects.successors, -1, 'success spends one')
assert.equal(swap.roll?.target, 9)
const duck = TOY_DIVISION.encounters
  .flatMap((e) => e.choices)
  .find((c) => c.id === 'squeeze-the-duck')!
assert.equal(duck.roll?.target, 9, 'the squeak code is a Risky listen')

console.log(
  `balance ok: ${named
    .map((p) => `${p.policy} ${((100 * p.eliminated) / p.runs).toFixed(1)}%`)
    .join(', ')}`,
)
