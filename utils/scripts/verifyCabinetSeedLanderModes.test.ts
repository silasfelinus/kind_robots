// Seed Lander depth pass, slice 5 part 1 (conductor kr-arcade/t-073, depth-pass CABINETS.md
// section 9): the Daily Hill, per-mission Time Trial and the mastery ladder.
//
//   npx tsx utils/scripts/verifyCabinetSeedLanderModes.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { create } from '../arcade/games/seedLander'
import { freshSave, readLanderSave } from '../arcade/seedLander/campaign'
import {
  ISLANDS,
  MISSIONS_PER_ISLAND,
  VAULT_INDEX,
} from '../arcade/seedLander/islands'
import {
  DAILY_MIN,
  DAILY_SPAN,
  RANKS,
  clock,
  dailyHill,
  dailyHillNumber,
  dailySeed,
  dateKey,
  masteryPoints,
  masteryRank,
  readDaily,
  readTrials,
  trialMedal,
  trialMissions,
} from '../arcade/seedLander/modes'

// The Daily Hill is the same island for the same day and a different one on another day.
const a = dailyHill('2026-10-20')
const b = dailyHill('2026-10-20')
assert.equal(JSON.stringify(a.map), JSON.stringify(b.map))
assert.equal(a.id, 'daily-2026-10-20')
assert.notEqual(
  JSON.stringify(a.map),
  JSON.stringify(dailyHill('2026-10-21').map),
)
assert.notEqual(dailySeed('2026-10-20'), dailySeed('2026-10-21'))
for (let d = 1; d <= 28; d++) {
  const n = dailyHillNumber(`2026-02-${String(d).padStart(2, '0')}`)
  assert.ok(n >= DAILY_MIN && n < DAILY_MIN + DAILY_SPAN, `hill ${n}`)
}
assert.equal(dateKey(new Date(2026, 9, 5)), '2026-10-05')

// Time Trial: formats, medals against par, and only cleared missions can be raced.
assert.equal(clock(60 * 83), '1:23')
assert.equal(trialMedal(79, 100), 'gold')
assert.equal(trialMedal(100, 100), 'silver')
assert.equal(trialMedal(101, 100), 'bronze')
const first = ISLANDS[0]!.missions[0]!
assert.equal(trialMissions({}).length, 0)
assert.deepEqual(
  trialMissions({ [first.id]: 1 }).map((m) => m.id),
  [first.id],
)
assert.deepEqual(readTrials({ [first.id]: 900, bad: -1, 'x y': 5, f: 1.5 }), {
  [first.id]: 900,
})
assert.deepEqual(readTrials([1, 2]), {})
assert.deepEqual(readDaily({ date: '2026-10-20', score: 1200 }), {
  date: '2026-10-20',
  score: 1200,
})
assert.equal(readDaily({ date: 'tomorrow', score: 1 }), undefined)
assert.equal(readDaily({ date: '2026-10-20', score: -3 }), undefined)

// The mastery ladder climbs with everything earned and tops out.
const none = { medals: {}, acorns: 0, cleared: 0, bestHill: 0, trials: {} }
assert.equal(masteryPoints(none), 0)
assert.equal(masteryRank(0).rank.name, RANKS[0]!.name)
const some = { ...none, medals: { m1: 7, m2: 1 }, acorns: 3, cleared: 1 }
assert.equal(masteryPoints(some), 4 + 6 + 4)
assert.ok(masteryRank(masteryPoints(some)).next! > 0)
const top = masteryRank(10_000)
assert.equal(top.rank.name, RANKS[RANKS.length - 1]!.name)
assert.equal(top.next, null)
assert.equal(
  masteryPoints({ ...none, bestHill: 8, trials: { a: 1, b: 2 } }),
  2 + 2,
)

// A save keeps its trial bests and daily score, and junk is dropped.
const read = (extra: object) =>
  readLanderSave(
    { ...freshSave(), ...extra },
    VAULT_INDEX + 1,
    MISSIONS_PER_ISLAND,
  )!
assert.deepEqual(read({ trials: { [first.id]: 300 } }).trials, {
  [first.id]: 300,
})
assert.deepEqual(read({ trials: 'no' }).trials, {})
assert.equal(read({ daily: { date: '2026-10-20', score: 5 } }).daily!.score, 5)
assert.equal(read({ daily: 7 }).daily, undefined)

// In the cabinet: with a cleared mission the card offers a Daily Hill and a Time Trial row,
// the trial runs without costing pods, and a first clear time is saved.
const pad = { held: {}, pressed: {} } as never
const press = (button: string) =>
  ({ held: {}, pressed: { [button]: true } }) as never
type Game = {
  menu: { pick: number } | null
  mode: string
  lives: number
  mission: { id: string }
  missionTicks: number
  trials: Record<string, number>
  save: { trials?: Record<string, number> } | null
  menuRows(): Array<{ id: string }>
  crash(pod: unknown, why: string): void
  pod: unknown
  clearMission(): void
  update(i: unknown): void
}
const make = (medals: Record<string, number>) =>
  create({
    rng: mulberry32(7),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
    resume: { ...freshSave(), campaignStarted: true, medals },
  } as never) as unknown as Game

const bare = make({})
assert.deepEqual(
  bare.menuRows().map((r) => r.id),
  ['continue', 'campaign', 'free', 'daily', 'tier'],
)

const g = make({ [first.id]: 7 })
const ids = g.menuRows().map((r) => r.id)
assert.deepEqual(ids, [
  'continue',
  'campaign',
  'free',
  'daily',
  'trial',
  'tier',
])
g.menu!.pick = ids.indexOf('trial')
g.update(press('a'))
assert.equal(g.mode, 'trial')
assert.equal(g.mission.id, first.id)
const pods = g.lives
for (let i = 0; i < 30; i++) g.update(pad)
g.crash(g.pod, 'test')
assert.equal(g.lives, pods, 'a trial crash costs no pod')
g.clearMission()
assert.equal(g.trials[first.id], g.missionTicks)
assert.equal(g.save!.trials![first.id], g.missionTicks)

const d = make({})
d.menu!.pick = d.menuRows().findIndex((r) => r.id === 'daily')
d.update(press('a'))
assert.equal(d.mode, 'daily')
assert.ok(d.mission.id.startsWith('daily-'))
for (let i = 0; i < 120; i++) d.update(pad)

console.log('seed lander modes: ok')
