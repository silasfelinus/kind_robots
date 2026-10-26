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
    landed >= (faction === 'rustline' ? 0.6 : 0.7),
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
//
// t-041 retuned this deliberately. The old cap (0.6 deaths a run) was met
// with room to spare because nothing on the board could kill: three persona
// campaigns buried nobody, lethal quests previewed at 0-4% death and A Hundred
// Candles was unreachable. Lethal quests now go out at honest 55-90% odds and
// a deep wound on a failed (or barely held) lethal road can kill, so careful
// courts lose about one follower every two campaigns. The cap is one death a
// campaign on average; the floors below make sure the board can still cost a
// life and that losing two is something a careful court can do.
const careful = report.filter(
  (r) => r.policy !== 'idle' && r.policy !== 'reckless',
)
for (const r of careful) {
  assert.ok(
    share(r.endings['long-night']) <= 0.2,
    `${r.policy} rarely loses the crypt`,
  )
  assert.ok(r.deaths / RUNS <= 1, `${r.policy} deaths ${r.deaths / RUNS}`)
}
const carefulRuns = careful.length * RUNS
const carefulDeaths = careful.reduce((sum, r) => sum + r.deaths, 0)
assert.ok(
  carefulDeaths / carefulRuns >= 0.2,
  `careful courts lose followers (${carefulDeaths / carefulRuns} a run)`,
)
const candles = careful.reduce(
  (sum, r) => sum + (r.endings['hundred-candles'] ?? 0),
  0,
)
assert.ok(
  candles >= 1 && candles / carefulRuns <= 0.2,
  `A Hundred Candles is reachable by careful play, not routine (${candles})`,
)
// With three recruits rather than four automatic starters, the reckless
// court has fewer bodies to dispatch. It still needs real fatal risk. A
// raw comparison against greedy is no longer a stable safety measure because
// the larger greedy parties run more quests across these ten campaign seeds.
assert.ok(
  of('reckless').deaths >= RUNS * 0.2,
  'reckless play still carries a meaningful fatal risk',
)
// A full barracks lives on taxes and quest brass, not on the Ledger's loans.
for (const r of report) {
  if (r.policy === 'idle') continue
  assert.ok(r.loans / RUNS <= 5, `${r.policy} loans ${r.loans / RUNS}`)
}
// A bed now costs at least 100 brass per recruit instead of 40 for three.
// Unfunded beds remain unavailable; a patron cannot borrow their way past the
// recruitment gate. Some courts instead keep their funds and turn people away.
assert.ok(
  careful.filter((r) => r.loans > 0).length >= careful.length * 0.5,
  'at least half of careful courts still borrow with expensive beds',
)
assert.ok(
  careful.some((r) => r.brassMin <= 20),
  'some careful campaigns still reach a genuine brass shortage',
)

console.log('Emperor of Dust balance: ok')
