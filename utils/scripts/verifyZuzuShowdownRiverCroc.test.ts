// /utils/scripts/verifyZuzuShowdownRiverCroc.test.ts
//
// Zuzu Showdown (conductor zuzu-showdown t-016): River Croc's kit. Every
// special fires from its fighters.yaml input; his heavy normals soak a light
// hit but not a heavy one; nobody throws him out of a jump; Death Roll is the
// 360 command grab; Submerge lets strikes pass over but not lows, and any
// punch Erupts; Tail Sweep hits low; Bellow pushes back and freezes red
// health; Swallow and The Watering Hole; and every grab of his flings the
// Siblings (fighters.yaml fling_vs_siblings).
//
//   npx tsx utils/scripts/verifyZuzuShowdownRiverCroc.test.ts

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
import { RIVER_CROC } from '../zuzuShowdown/fighters/river-croc'
import { SIBLINGS } from '../zuzuShowdown/fighters/siblings'
import { STORM_CROW } from '../zuzuShowdown/fighters/storm-crow'
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

const ROSTER: [FighterData, FighterData] = [RIVER_CROC, PLACEHOLDER_B]
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

const ROLL = motion([6, 3, 2, 1, 4, 7, 8, 9, 6], { lp: true }, 1)
const SUBMERGE = motion([2, 5, 2], { lk: true }, 2)

// ---------------------------------------------------------------- data

check(
  'every special matches its fighters.yaml input; he joins the roster',
  () => {
    const yaml: Record<string, string> = {
      'death-roll': '360+P',
      submerge: 'dd+K',
      'tail-sweep': 'QCB+K',
      bellow: '[b]f+P',
      swallow: '720+P',
      'the-watering-hole': 'QCB QCB+HP',
    }
    const commands = RIVER_CROC.specials.filter((s) => !s.followUp)
    assert.deepEqual(commands.map((s) => s.id).sort(), Object.keys(yaml).sort())
    for (const special of commands) {
      const parsed = parseNotation(yaml[special.id]!)
      assert.ok(parsed, special.id)
      assert.equal(parsed.motion, special.motion, special.id)
      assert.equal(parsed.button, special.button, special.id)
    }
    // Erupt is any punch while submerged, never a command of its own.
    const erupt = RIVER_CROC.specials.find((s) => s.id === 'erupt')!
    assert.equal(erupt.followUp, true)
    assert.deepEqual(
      moveOf(RIVER_CROC, { id: 'submerge', heavy: false }).followUp,
      { buttons: ['lp', 'hp'], move: 'erupt' },
    )
    assert.ok(FIGHTERS.includes(RIVER_CROC))
    assert.equal(RIVER_CROC.health, 1100)
    assert.equal(RIVER_CROC.easy?.super, 'swallow', 'Easy: QCF QCF+P')
  },
)

// ---------------------------------------------------------------- passives

check('his heavy normals soak a light hit, not a heavy one', () => {
  const light: SimEvent[] = []
  const s = play(
    fightAt(52),
    30,
    [press({ hp: true })],
    [press({ lp: true })],
    light,
  )
  assert.ok(
    light.some((e) => e.type === 'armor' && e.side === 0),
    'soaked',
  )
  assert.ok(
    hits(light).some((h) => h.attacker === 0),
    'his bite still lands',
  )
  assert.ok(s.fighters[0].health < RIVER_CROC.health, 'the damage lands')
  const heavy: SimEvent[] = []
  play(fightAt(52), 30, [press({ hp: true })], [press({ hp: true })], heavy)
  assert.ok(!heavy.some((e) => e.type === 'armor'), 'a heavy breaks through')
  assert.ok(hits(heavy).some((h) => h.attacker === 1))
})

check('nobody throws him out of a jump', () => {
  // He jumps; the opponent grabs (LP+LK) underneath him.
  const log: SimEvent[] = []
  play(
    fightAt(52),
    30,
    [press({ up: true })],
    [...Array(8).fill(N), press({ lp: true, lk: true })],
    log,
  )
  assert.ok(!log.some((e) => e.type === 'throw'), 'not thrown')
})

// ---------------------------------------------------------------- the kit

check('Death Roll: the 360 command grab, 200, through a guard', () => {
  const log: SimEvent[] = []
  const s = play(
    fightAt(56),
    40,
    ROLL,
    Array(40).fill(press({ right: true })),
    log,
  )
  const roll = log.find((e) => e.type === 'throw')
  assert.ok(roll && roll.type === 'throw' && roll.damage === 200)
  assert.equal(s.fighters[1].health, PLACEHOLDER_B.health - 200)
})

check('Submerge: strikes pass over him, a low hits him', () => {
  // A standing heavy goes over the water.
  const over: SimEvent[] = []
  play(
    fightAt(52),
    40,
    SUBMERGE,
    [...Array(14).fill(N), press({ hp: true })],
    over,
  )
  assert.ok(over.some((e) => e.type === 'special' && e.move === 'submerge'))
  assert.ok(!hits(over).some((h) => h.attacker === 1), 'passed over')
  // A crouching kick finds him.
  const low: SimEvent[] = []
  play(
    fightAt(52),
    40,
    SUBMERGE,
    [...Array(14).fill(N), press({ down: true, lk: true })],
    low,
  )
  assert.ok(
    hits(low).some((h) => h.attacker === 1),
    'the low hit',
  )
  // He slides along the floor, HK faster.
  const lk = moveOf(RIVER_CROC, { id: 'submerge', heavy: false }).velocity!
  const hk = moveOf(RIVER_CROC, { id: 'submerge', heavy: true }).velocity!
  assert.ok(hk.x > lk.x && lk.x > 0)
})

check('Erupt: any punch from the water, a launcher', () => {
  const log: SimEvent[] = []
  const s0 = fightAt(80)
  let s = play(s0, 40, [...SUBMERGE, ...Array(34).fill(N)], [], log)
  // Slide in, then burst up under them.
  for (let i = 0; i < 40 && s.fighters[1].action !== 'airhit'; i += 1) {
    s = step(s, [press({ lp: i === 0 }), N], ROSTER)
    log.push(...s.events)
  }
  assert.ok(log.some((e) => e.type === 'special' && e.move === 'erupt'))
  assert.ok(
    hits(log).some((h) => h.move === 'erupt'),
    'it hit',
  )
  assert.equal(s.fighters[1].action, 'airhit', 'launched')
  // From neutral the same input does nothing: Erupt needs the water.
  const dry: SimEvent[] = []
  play(fightAt(52), 20, motion([2, 5, 2], { lp: true }, 2), [], dry)
  assert.ok(!dry.some((e) => e.type === 'special' && e.move === 'erupt'))
})

check('Tail Sweep hits low; the HK knocks down', () => {
  const standing: SimEvent[] = []
  play(
    fightAt(80),
    40,
    motion([2, 1, 4], { lk: true }),
    Array(40).fill(press({ right: true })),
    standing,
  )
  assert.ok(
    hits(standing).some((h) => h.move === 'tail-sweep'),
    'got under',
  )
  const s = play(fightAt(80), 30, motion([2, 1, 4], { hk: true }))
  assert.equal(s.fighters[1].action, 'knockdown')
})

check('Bellow: pushes them back and freezes their red health', () => {
  const charge = [
    ...Array(50).fill(press({ left: true })),
    press({ right: true, lp: true }),
  ]
  const s0 = fightAt(60)
  s0.fighters[1].health -= 100
  s0.fighters[1].red = 100
  // Freshly hurt: no regeneration has started before the roar lands.
  s0.fighters[1].sinceHit = 0
  const log: SimEvent[] = []
  let s = play(s0, charge.length + 30, charge, [], log)
  assert.ok(log.some((e) => e.type === 'special' && e.move === 'bellow'))
  const gap = (s.fighters[1].x - s.fighters[0].x) / SUB
  assert.ok(gap >= 140, `pushed back (${gap} px apart)`)
  assert.equal(
    s.fighters[1].health,
    PLACEHOLDER_B.health - 100,
    'the roar deals nothing',
  )
  const red = s.fighters[1].red
  assert.ok(s.fighters[1].redFreeze > 0, 'frozen')
  s = play(s, 200, [])
  assert.equal(s.fighters[1].red, red, 'no regeneration while frozen')
  s = play(s, 300, [])
  assert.ok(s.fighters[1].red < red, 'it thaws')
})

// ---------------------------------------------------------------- supers

check('Swallow: the 720, a bar, 300', () => {
  const s0 = fightAt(60)
  s0.fighters[0].meter = METER_BAR
  const log: SimEvent[] = []
  const twice = motion(
    [6, 3, 2, 1, 4, 7, 8, 9, 6, 3, 2, 1, 4, 7, 8, 9, 6],
    { lp: true },
    1,
  )
  play(s0, 60, twice, [], log)
  assert.ok(log.some((e) => e.type === 'super' && e.move === 'swallow'))
  const gulp = log.find((e) => e.type === 'throw')
  assert.ok(gulp && gulp.type === 'throw' && gulp.damage === 300)
  // At a human pace the spin passes through up into a jump; the grab still
  // comes out, on the ground.
  const s1 = fightAt(60)
  s1.fighters[0].meter = METER_BAR
  const slow: SimEvent[] = []
  const after = play(
    s1,
    60,
    motion([6, 3, 2, 1, 4, 7, 8, 9, 6, 3, 2, 1, 4, 7, 8, 9, 6], { lp: true }),
    [],
    slow,
  )
  assert.ok(slow.some((e) => e.type === 'super' && e.move === 'swallow'))
  assert.equal(after.fighters[0].y, 0, 'on the ground')
})

check(
  'The Watering Hole: three bars, the Showdown, under them anywhere',
  () => {
    const s0 = fightAt(240)
    s0.fighters[0].meter = METER_MAX
    const log: SimEvent[] = []
    play(s0, 140, motion([2, 1, 4, 2, 1, 4], { hp: true }), [], log)
    const sup = log.find(
      (e) => e.type === 'super' && e.move === 'the-watering-hole',
    )
    assert.ok(sup && sup.type === 'super' && sup.showdown)
    const roll = log.find((e) => e.type === 'throw')
    assert.ok(roll && roll.type === 'throw' && roll.damage === 450, 'at range')
  },
)

check('his grabs fling the Siblings (fling_vs_siblings), no one else', () => {
  const roster: [FighterData, FighterData] = [RIVER_CROC, SIBLINGS]
  const log: SimEvent[] = []
  play(fightAt(56, roster), 40, ROLL, [], log, roster)
  assert.ok(log.some((e) => e.type === 'fling' && e.move === 'death-roll'))
  const other: SimEvent[] = []
  play(fightAt(56), 40, ROLL, [], other)
  assert.ok(other.some((e) => e.type === 'throw'))
  assert.ok(!other.some((e) => e.type === 'fling'))
  for (const id of ['death-roll', 'swallow', 'the-watering-hole'])
    assert.equal(moveOf(RIVER_CROC, { id, heavy: false }).fling, true, id)
})

// ---------------------------------------------------------------- fuzz

check('River Croc replays deterministically and keeps every invariant', () => {
  for (const [seed, roster] of [
    [91, ROSTER],
    [92, [ZUZU, RIVER_CROC] as [FighterData, FighterData]],
    [93, [RIVER_CROC, RIVER_CROC] as [FighterData, FighterData]],
    [94, [RIVER_CROC, SIBLINGS] as [FighterData, FighterData]],
    [95, [STORM_CROW, RIVER_CROC] as [FighterData, FighterData]],
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
          assert.ok(f.redFreeze >= 0 && f.redFreeze <= 300)
        }
      }
      return hashState(s)
    }
    assert.equal(once(), once(), `seed ${seed}`)
  }
})

console.log(`verifyZuzuShowdownRiverCroc: ${passed} checks passed`)
