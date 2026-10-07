// /utils/scripts/verifyZuzuShowdownCpu.test.ts
//
// Zuzu Showdown CPU opponent (conductor zuzu-showdown t-020): it plays through the same input path as a
// player (every special and super in both kits comes out of its input frames), it only reads the
// match, a CPU-vs-CPU match replays to the same hash from the same seeds, the difficulty ladder holds
// (Showdown blocks far more than Kid; Kid never spends a Showdown super), from Normal up it leans to
// the counter of your close-range habits, and it beats a training dummy.
//
//   npx tsx utils/scripts/verifyZuzuShowdownCpu.test.ts

import assert from 'node:assert/strict'
import {
  CPU_LEVELS,
  LEVELS,
  cpuInput,
  newCpu,
  specialFrames,
  triangleWeights,
  type CpuLevel,
  type CpuState,
} from '../zuzuShowdown/cpu'
import {
  INTRO_FRAMES,
  METER_MAX,
  createMatch,
  hashState,
  step,
} from '../zuzuShowdown/sim'
import { findFighter } from '../zuzuShowdown/fighters'
import {
  SUB,
  neutralInput,
  type FighterData,
  type MatchState,
  type SimEvent,
  type SimInput,
} from '../zuzuShowdown/types'

let passed = 0
function check(name: string, fn: () => void): void {
  try {
    fn()
    passed += 1
  } catch (error) {
    console.error(`FAIL ${name}`)
    throw error
  }
}

const ZUZU = findFighter('zuzu')
const COYOTE = findFighter('coyote-vagrant')
const N = neutralInput()

function fightAt(
  roster: [FighterData, FighterData],
  gapPx: number,
): MatchState {
  let s = createMatch(roster)
  for (let i = 0; i < INTRO_FRAMES; i += 1) s = step(s, [N, N], roster)
  const half = Math.trunc((gapPx * SUB) / 2)
  s.fighters[0].x = -half
  s.fighters[1].x = gapPx * SUB - half
  return s
}

check('every special and super comes out of the CPU’s input frames', () => {
  for (const data of [ZUZU, COYOTE]) {
    const roster: [FighterData, FighterData] = [data, COYOTE]
    for (const special of data.specials) {
      const frames = specialFrames(special, 1)
      assert.ok(
        frames,
        `${data.slug} ${special.id} has a motion the CPU can do`,
      )
      let s = fightAt(roster, 200)
      s.fighters[0].meter = METER_MAX
      s.fighters[0].ammo = 6
      let started = false
      // An air special is done from a jump.
      const jump = special.air
        ? [
            { ...N, up: true, right: true },
            ...Array.from({ length: 8 }, () => N),
          ]
        : []
      for (const input of [
        ...jump,
        ...frames,
        ...Array.from({ length: 4 }, () => N),
      ]) {
        s = step(s, [input, N], roster)
        if (s.fighters[0].attack?.id === special.id) started = true
      }
      assert.ok(started, `${data.slug} ${special.id} starts`)
    }
  }
})

/** A CPU-vs-CPU match from two seeds: its final hash and every event. */
function cpuMatch(
  levels: [CpuLevel, CpuLevel],
  seeds: [number, number],
  roster: [FighterData, FighterData] = [ZUZU, COYOTE],
  frames = 4000,
): { hash: string; events: SimEvent[]; s: MatchState } {
  let s = createMatch(roster)
  const cpus: [CpuState, CpuState] = [
    newCpu(levels[0], seeds[0]),
    newCpu(levels[1], seeds[1]),
  ]
  const events: SimEvent[] = []
  for (let i = 0; i < frames && s.phase !== 'over'; i += 1) {
    const inputs = ([0, 1] as const).map((side) => {
      const turn = cpuInput(cpus[side], s, side, roster)
      cpus[side] = turn.cpu
      return turn.input
    }) as [SimInput, SimInput]
    s = step(s, inputs, roster)
    events.push(...s.events)
  }
  return { hash: hashState(s), events, s }
}

check(
  'a CPU-vs-CPU match replays to the same hash; the CPU only reads the match',
  () => {
    const a = cpuMatch(['hard', 'normal'], [11, 22])
    const b = cpuMatch(['hard', 'normal'], [11, 22])
    assert.equal(a.hash, b.hash)
    assert.notEqual(cpuMatch(['hard', 'normal'], [11, 23]).hash, a.hash)
    assert.ok(
      a.events.some((e) => e.type === 'hit'),
      'the CPUs land blows on each other',
    )
    // Reading the match never changes it.
    const s = fightAt([ZUZU, COYOTE], 60)
    const before = hashState(s)
    let cpu = newCpu('showdown', 5)
    for (let i = 0; i < 200; i += 1)
      cpu = cpuInput(cpu, s, 1, [ZUZU, COYOTE]).cpu
    assert.equal(hashState(s), before)
  },
)

/** P1 jabs at close range all match long; the share of its jabs the CPU (P2) blocks. */
function blockRate(level: CpuLevel, seed: number): number {
  const roster: [FighterData, FighterData] = [COYOTE, ZUZU]
  let s = fightAt(roster, 44)
  let cpu = newCpu(level, seed)
  let blocks = 0
  let hits = 0
  for (let i = 0; i < 1800 && s.phase === 'fight'; i += 1) {
    const turn = cpuInput(cpu, s, 1, roster)
    cpu = turn.cpu
    // Keep the jabber close, and keep pressing.
    const jab = { ...N, lp: i % 14 === 0, right: i % 14 > 8 }
    s = step(s, [jab, turn.input], roster)
    for (const e of s.events) {
      if (e.type === 'block' && e.attacker === 0) blocks += 1
      if (e.type === 'hit' && e.attacker === 0) hits += 1
    }
    // Reset the health so the round runs the whole sample.
    s.fighters[1].health = ZUZU.health
  }
  return blocks / Math.max(1, blocks + hits)
}

check('the ladder: Showdown blocks far more than Kid', () => {
  const rates = Object.fromEntries(
    CPU_LEVELS.map((level) => [
      level,
      (blockRate(level, 1) + blockRate(level, 2)) / 2,
    ]),
  ) as Record<CpuLevel, number>
  assert.ok(rates.kid < 0.35, `Kid blocks rarely (${rates.kid.toFixed(2)})`)
  assert.ok(
    rates.showdown > rates.kid + 0.3,
    `Showdown blocks far more (${rates.showdown.toFixed(2)} vs ${rates.kid.toFixed(2)})`,
  )
  assert.ok(rates.hard >= rates.normal - 0.05)
})

check('Kid never spends a Showdown super; Showdown does', () => {
  /** CPU-vs-CPU with full meter: did `side` throw a Showdown super? */
  const showdowns = (level: CpuLevel) => {
    const roster: [FighterData, FighterData] = [ZUZU, COYOTE]
    let s = fightAt(roster, 80)
    const cpus: [CpuState, CpuState] = [newCpu('normal', 3), newCpu(level, 4)]
    let count = 0
    for (let i = 0; i < 3000 && s.phase !== 'over'; i += 1) {
      s.fighters[1].meter = METER_MAX
      s.fighters[1].ammo = 6
      const inputs = ([0, 1] as const).map((side) => {
        const turn = cpuInput(cpus[side], s, side, roster)
        cpus[side] = turn.cpu
        return turn.input
      }) as [SimInput, SimInput]
      s = step(s, inputs, roster)
      count += s.events.filter(
        (e) => e.type === 'super' && e.side === 1 && e.showdown,
      ).length
    }
    return count
  }
  assert.equal(showdowns('kid'), 0)
  assert.ok(showdowns('showdown') > 0)
})

check(
  'from Normal up it leans to the counter of your close-range habits',
  () => {
    const strikes = { strike: 9, grab: 1, guard: 1 }
    const guards = { strike: 1, grab: 1, guard: 9 }
    assert.deepEqual(
      triangleWeights('kid', strikes),
      triangleWeights('kid', guards),
      'Kid does not read you',
    )
    for (const level of ['normal', 'hard', 'showdown'] as const) {
      const vsStrikes = triangleWeights(level, strikes)
      assert.ok(
        vsStrikes.guard > vsStrikes.strike && vsStrikes.guard > vsStrikes.grab,
      )
      const vsGuards = triangleWeights(level, guards)
      assert.ok(
        vsGuards.grab > vsGuards.guard && vsGuards.grab > vsGuards.strike,
      )
      assert.ok(
        Math.abs(vsStrikes.strike + vsStrikes.grab + vsStrikes.guard - 1) <
          1e-9,
      )
    }
    assert.ok(LEVELS.showdown.reads > LEVELS.normal.reads)
    // In a match: a jabber's habit is what the CPU remembers.
    const roster: [FighterData, FighterData] = [COYOTE, ZUZU]
    let s = fightAt(roster, 44)
    let cpu = newCpu('hard', 9)
    for (let i = 0; i < 900 && s.phase === 'fight'; i += 1) {
      const turn = cpuInput(cpu, s, 1, roster)
      cpu = turn.cpu
      s = step(
        s,
        [{ ...N, lp: i % 14 === 0, right: i % 14 > 8 }, turn.input],
        roster,
      )
      s.fighters[1].health = ZUZU.health
    }
    assert.ok(
      cpu.habits.strike > cpu.habits.grab + cpu.habits.guard,
      `it saw the jabs (${JSON.stringify(cpu.habits)})`,
    )
  },
)

check('every level beats a training dummy', () => {
  for (const level of CPU_LEVELS) {
    const roster: [FighterData, FighterData] = [COYOTE, ZUZU]
    let s = createMatch(roster)
    let cpu = newCpu(level, 7)
    for (let i = 0; i < 99 * 60 * 5 && s.phase !== 'over'; i += 1) {
      const turn = cpuInput(cpu, s, 1, roster)
      cpu = turn.cpu
      s = step(s, [N, turn.input], roster)
    }
    assert.equal(s.phase, 'over', `${level} finishes the match`)
    assert.ok(
      s.wins[1] > s.wins[0],
      `${level} wins (${s.wins[0]}-${s.wins[1]})`,
    )
  }
})

console.log(`verifyZuzuShowdownCpu: ${passed} checks passed`)
