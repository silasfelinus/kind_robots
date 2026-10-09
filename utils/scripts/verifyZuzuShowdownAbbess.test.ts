// /utils/scripts/verifyZuzuShowdownAbbess.test.ts
//
// Zuzu Showdown (conductor zuzu-showdown t-015): the Abbess's kit.
// Every special fires from its fighters.yaml input; Benediction throws a dagger,
// Reaching Tentacle launches, The Thin Place teleports, Last Rites is a command
// grab, Vespers halves the opponent's projectiles, and the supers.
//
//   npx tsx utils/scripts/verifyZuzuShowdownAbbess.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { parseNotation, type Dir } from '../zuzuShowdown/motion'
import {
  INTRO_FRAMES,
  METER_BAR,
  METER_MAX,
  createMatch,
  hashState,
  moveOf,
  step,
} from '../zuzuShowdown/sim'
import { PLACEHOLDER_B } from '../zuzuShowdown/fighters/placeholders'
import { ABBESS } from '../zuzuShowdown/fighters/abbess'
import { COYOTE } from '../zuzuShowdown/fighters/coyote'
import { ZUZU } from '../zuzuShowdown/fighters/zuzu'
import { FIGHTERS } from '../zuzuShowdown/fighters'
import {
  SIM_BUTTONS,
  SUB,
  neutralInput,
  type FighterData,
  type MatchState,
  type SimEvent,
  type SimInput,
} from '../zuzuShowdown/types'

const ROSTER: [FighterData, FighterData] = [ABBESS, PLACEHOLDER_B]
const N = neutralInput()

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

const press = (over: Partial<SimInput>): SimInput => ({ ...N, ...over })

function fightAt(gapPx: number, roster = ROSTER, seed?: number): MatchState {
  let s = createMatch(roster, seed)
  for (let i = 0; i < INTRO_FRAMES; i += 1) s = step(s, [N, N], roster)
  const half = Math.trunc((gapPx * SUB) / 2)
  s.fighters[0].x = -half
  s.fighters[1].x = gapPx * SUB - half
  return s
}

function stick(dir: Dir): Partial<SimInput> {
  const out: Partial<SimInput> = {}
  if ([7, 8, 9].includes(dir)) out.up = true
  if ([1, 2, 3].includes(dir)) out.down = true
  if ([3, 6, 9].includes(dir)) out.right = true
  if ([1, 4, 7].includes(dir)) out.left = true
  return out
}

function motion(dirs: Dir[], button: Partial<SimInput>, each = 2): SimInput[] {
  const frames: SimInput[] = []
  dirs.forEach((dir, index) => {
    for (let i = 0; i < each; i += 1) {
      const last = index === dirs.length - 1 && i === each - 1
      frames.push(press({ ...stick(dir), ...(last ? button : {}) }))
    }
  })
  return frames
}

function play(
  s: MatchState,
  frames: number,
  p1: SimInput[],
  p2: SimInput[] = [],
  log?: SimEvent[],
  roster = ROSTER,
): MatchState {
  let state = s
  for (let i = 0; i < frames; i += 1) {
    state = step(state, [p1[i] ?? N, p2[i] ?? N], roster)
    if (log) log.push(...state.events)
  }
  return state
}

const hits = (log: SimEvent[]) =>
  log.filter((e): e is Extract<SimEvent, { type: 'hit' }> => e.type === 'hit')

// ---------------------------------------------------------------- data

check('every special matches its fighters.yaml input; she joins the roster', () => {
  const yaml: Record<string, string> = {
    benediction: 'QCF+P',
    'reaching-tentacle': 'DP+P',
    'the-thin-place': 'QCB+K',
    'last-rites': '360+P',
    vespers: 'dd+P',
    'the-choir': 'QCF QCF+P',
    'open-the-door': 'QCB QCB+HP',
  }
  assert.deepEqual(
    ABBESS.specials.map((s) => s.id).sort(),
    Object.keys(yaml).sort(),
  )
  for (const special of ABBESS.specials) {
    const parsed = parseNotation(yaml[special.id]!)
    assert.ok(parsed, special.id)
    assert.equal(parsed.motion, special.motion, special.id)
    assert.equal(parsed.button, special.button, special.id)
  }
  assert.ok(FIGHTERS.includes(ABBESS))
  assert.equal(ABBESS.health, 950)
})

// ---------------------------------------------------------------- the kit

check('Benediction throws a dagger that hits at range; the HP flies higher', () => {
  const log: SimEvent[] = []
  play(fightAt(200), 80, motion([2, 3, 6], { lp: true }), [], log)
  assert.ok(hits(log).some((h) => h.move === 'benediction'))
  const lp = play(fightAt(300), 20, motion([2, 3, 6], { lp: true }))
  const hp = play(fightAt(300), 20, motion([2, 3, 6], { hp: true }))
  assert.ok(hp.projectiles[0]!.y > lp.projectiles[0]!.y)
})

check('Reaching Tentacle is slow, launches, and the HP reaches farther', () => {
  const log: SimEvent[] = []
  play(fightAt(40), 80, motion([6, 2, 3], { lp: true }), [], log)
  const hit = hits(log).find((h) => h.move === 'reaching-tentacle')
  assert.ok(hit, 'short range LP connects')
  const far: SimEvent[] = []
  play(fightAt(110), 80, motion([6, 2, 3], { lp: true }), [], far)
  assert.ok(!hits(far).some((h) => h.move === 'reaching-tentacle'))
  const farHp: SimEvent[] = []
  play(fightAt(110), 80, motion([6, 2, 3], { hp: true }), [], farHp)
  assert.ok(hits(farHp).some((h) => h.move === 'reaching-tentacle'))
  const move = moveOf(ABBESS, { id: 'reaching-tentacle', heavy: false })
  assert.ok(move.startup >= 20, 'a trap, not a reversal')
  assert.equal(move.launcher, true)
})

check('The Thin Place: LK lands her behind them, HK at the far wall', () => {
  const lk = play(fightAt(120), 40, motion([2, 1, 4], { lk: true }))
  assert.ok(lk.fighters[0].x > lk.fighters[1].x, 'now on the far side')
  assert.equal(lk.fighters[0].facing, -1, 'facing them')
  const hk = play(fightAt(120), 40, motion([2, 1, 4], { hk: true }))
  assert.ok(hk.fighters[0].x > lk.fighters[0].x, 'further, at the wall')
  assert.ok(Math.abs(hk.fighters[0].x) <= 384 * SUB)
})

check('Last Rites grabs through a block for 160, and flings the Siblings', () => {
  const log: SimEvent[] = []
  const s = play(
    fightAt(36),
    60,
    motion([6, 3, 2, 1, 4, 7, 8, 9, 6], { lp: true }, 1),
    Array(60).fill(press({ left: true })),
    log,
  )
  assert.ok(log.some((e) => e.type === 'throw' && e.attacker === 0))
  assert.equal(s.fighters[1].health, PLACEHOLDER_B.health - 160)
  assert.equal(moveOf(ABBESS, { id: 'last-rites', heavy: false }).fling, true)
})

check('Vespers halves the speed of the opponent’s projectiles', () => {
  const roster: [FighterData, FighterData] = [ABBESS, COYOTE]
  const shotAfter = (bell: boolean): number => {
    let s = fightAt(300, roster)
    if (bell) s = play(s, 40, motion([2, 5, 2], { lp: true }), [], undefined, roster)
    assert.equal(s.fighters[0].bell > 0, bell)
    const before = s.projectiles.length
    s = play(
      s,
      20,
      [],
      motion([2, 1, 4], { lp: true }),
      undefined,
      roster,
    )
    assert.equal(s.projectiles.length, before + 1)
    const x0 = s.projectiles.find((c) => c.owner === 1)!.x
    s = play(s, 10, [], [], undefined, roster)
    const q = s.projectiles.find((c) => c.owner === 1)!
    return Math.abs(q.x - x0)
  }
  const plain = shotAfter(false)
  const slow = shotAfter(true)
  assert.ok(slow > 0 && slow * 2 <= plain + SUB, `${slow} vs ${plain}`)
})

// ---------------------------------------------------------------- supers

check('The Choir: a bar for a full-screen low sweep (jump it)', () => {
  const s0 = fightAt(200)
  s0.fighters[0].meter = METER_BAR
  const log: SimEvent[] = []
  play(s0, 120, motion([2, 3, 6, 2, 3, 6], { lp: true }), [], log)
  assert.ok(log.some((e) => e.type === 'super' && e.move === 'the-choir'))
  assert.equal(hits(log).find((h) => h.move === 'the-choir')?.damage, 250)
  const jumped = fightAt(200)
  jumped.fighters[0].meter = METER_BAR
  jumped.fighters[1].y = 40 * SUB
  const air: SimEvent[] = []
  play(jumped, 24, motion([2, 3, 6, 2, 3, 6], { lp: true }), [], air)
  assert.ok(!hits(air).some((h) => h.move === 'the-choir'))
})

check('Open the Door: three bars, HP, the Showdown, 430', () => {
  const s0 = fightAt(160)
  s0.fighters[0].meter = METER_MAX
  const log: SimEvent[] = []
  play(s0, 200, motion([2, 1, 4, 2, 1, 4], { hp: true }), [], log)
  assert.ok(
    log.some(
      (e) => e.type === 'super' && e.move === 'open-the-door' && e.showdown,
    ),
  )
  assert.equal(hits(log).find((h) => h.move === 'open-the-door')?.damage, 430)
})

// ---------------------------------------------------------------- fuzz

check('the Abbess replays deterministically and keeps every invariant', () => {
  for (const [seed, roster] of [
    [61, ROSTER],
    [62, [ZUZU, ABBESS] as [FighterData, FighterData]],
    [63, [ABBESS, ABBESS] as [FighterData, FighterData]],
    [64, [ABBESS, COYOTE] as [FighterData, FighterData]],
  ] as const) {
    const once = () => {
      const rand = mulberry32(seed)
      let s = createMatch(roster, seed)
      for (let i = 0; i < 4000; i += 1) {
        const inputs = [0, 1].map(() => {
          const input = { ...N }
          for (const button of SIM_BUTTONS)
            if (rand() < 0.18) input[button] = true
          return input
        }) as [SimInput, SimInput]
        s = step(s, inputs, roster)
        for (const f of s.fighters) {
          assert.ok(Math.abs(f.x) <= 384 * SUB + SUB, 'in the arena')
          assert.ok(f.health >= 0 && f.meter >= 0 && f.meter <= METER_MAX)
          assert.ok(f.bell >= 0)
        }
      }
      return hashState(s)
    }
    assert.equal(once(), once(), `seed ${seed}`)
  }
})

console.log(`verifyZuzuShowdownAbbess: ${passed} checks passed`)
