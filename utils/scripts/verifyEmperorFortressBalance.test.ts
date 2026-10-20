// Seeded balance thresholds (conductor emperor-of-dust t-009). The report in
// conductor projects/emperor-of-dust/BALANCE-REPORT.md is this same simulation.
import assert from 'node:assert/strict'
import {
  HOST_FACTIONS,
  HOST_HIDEOUT,
  POLICIES,
  balanceReport,
} from '../emperorOfDust/fortress/balance'
import { ENDINGS } from '../emperorOfDust/fortress/endings'

const RUNS = 10
const report = balanceReport(RUNS)
const of = (id: string) => report.find((r) => r.policy === id)!
const share = (count: number | undefined) => (count ?? 0) / RUNS

assert.deepEqual(
  report.map((r) => r.policy),
  POLICIES.map((p) => p.id),
)

// Whoever the crown champions takes it in: every host's patron hides there.
for (const faction of HOST_FACTIONS) {
  const hideout = HOST_HIDEOUT[faction]!
  const landed = share(of(`patron:${faction}`).hideouts[hideout])
  assert.ok(
    landed >= 0.7,
    `patron of ${faction} hides in ${hideout} (${landed})`,
  )
}
// A court that sends nobody anywhere ends in the nameless cave, and loses.
const idle = of('idle')
assert.ok(share(idle.hideouts['nameless-cave']) >= 0.8, 'idle: the cave')
assert.ok(share(idle.endings['long-night']) >= 0.8, 'idle: the long night')
assert.ok(idle.wipedOut / RUNS >= 0.5, 'neglect lets a faction die')

// Every ending family happens to somebody.
const seen = new Set(report.flatMap((r) => Object.keys(r.endings)))
for (const id of Object.keys(ENDINGS))
  assert.ok(seen.has(id), `${id} is reached`)
// The peace follows the patron.
assert.ok(share(of('patron:moles').endings['tunnels-and-councils']) >= 0.7)
assert.ok(share(of('patron:storm-crows').endings['crows-bargain']) >= 0.7)
assert.ok(share(of('patron:mire-mothers').endings['witchwater-throne']) >= 0.7)

// Careful play usually seals the crypt, and deaths stay rare and signposted.
for (const r of report) {
  if (r.policy === 'idle' || r.policy === 'reckless') continue
  assert.ok(
    share(r.endings['long-night']) <= 0.2,
    `${r.policy} rarely loses the crypt`,
  )
  assert.ok(r.deaths / RUNS <= 0.6, `${r.policy} deaths ${r.deaths / RUNS}`)
}
// Recklessness costs more than care.
assert.ok(
  of('reckless').deaths > of('greedy').deaths,
  'reckless play buries more followers',
)
// A full barracks lives on taxes and quest brass, not on the Ledger's loans.
for (const r of report) {
  if (r.policy === 'idle') continue
  assert.ok(r.loans / RUNS <= 5, `${r.policy} loans ${r.loans / RUNS}`)
}

console.log('Emperor of Dust balance: ok')
