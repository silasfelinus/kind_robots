// /utils/scripts/verifyZuzuShowdownWitch.test.ts
//
// Zuzu Showdown (conductor zuzu-showdown t-028): the Swamp Witch's kit. Every
// special fires from its fighters.yaml input; Bog Grasp bursts out close (LP)
// or under the opponent anywhere (HP), and a jumper is over it; Leech Hex
// drains 60 over five seconds, all of it red; Sink is untouchable and surfaces
// beside the opponent; Coil Snare grabs; Bargain catches a strike, staggers the
// striker and banks half a bar, but a command grab beats it; the supers; Coil
// Snare and The Door Below fling the Siblings.
//
//   npx tsx utils/scripts/verifyZuzuShowdownWitch.test.ts

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
import { SWAMP_WITCH } from '../zuzuShowdown/fighters/swamp-witch'
import { HYENA_MATRIARCH } from '../zuzuShowdown/fighters/hyena-matriarch'
import { ABBESS } from '../zuzuShowdown/fighters/abbess'
import { SIBLINGS } from '../zuzuShowdown/fighters/siblings'
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

const ROSTER: [FighterData, FighterData] = [SWAMP_WITCH, PLACEHOLDER_B]
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

const GRASP = (button: 'lp' | 'hp') => motion([2, 3, 6], { [button]: true })
const HEX = motion([2, 1, 4], { lp: true })
const SINK = motion([2, 5, 2], { lk: true })
const SNARE = motion([6, 3, 2, 1, 4], { lp: true })
const BARGAIN = motion([2, 5, 2], { lp: true })

// ---------------------------------------------------------------- data

check(
  'every special matches its fighters.yaml input; she joins the roster',
  () => {
    const yaml: Record<string, string> = {
      'bog-grasp': 'QCF+P',
      'leech-hex': 'QCB+P',
      sink: 'dd+K',
      'coil-snare': 'HCB+P',
      bargain: 'dd+P',
      'drowning-pool': 'QCF QCF+P',
      'the-door-below': 'QCB QCB+HP',
    }
    assert.deepEqual(
      SWAMP_WITCH.specials.map((s) => s.id).sort(),
      Object.keys(yaml).sort(),
    )
    for (const special of SWAMP_WITCH.specials) {
      const parsed = parseNotation(yaml[special.id]!)
      assert.ok(parsed, special.id)
      assert.equal(parsed.motion, special.motion, special.id)
      assert.equal(parsed.button, special.button, special.id)
    }
    assert.ok(FIGHTERS.includes(SWAMP_WITCH))
    assert.equal(SWAMP_WITCH.health, 950)
    assert.equal(SWAMP_WITCH.hurtStand.h, 120)
  },
)

// ---------------------------------------------------------------- the kit

check('Bog Grasp: LP bursts out close; HP rises under them anywhere', () => {
  const close: SimEvent[] = []
  play(fightAt(70), 40, GRASP('lp'), [], close)
  assert.ok(
    hits(close).some((h) => h.move === 'bog-grasp'),
    'LP close',
  )
  const farLp: SimEvent[] = []
  play(fightAt(220), 50, GRASP('lp'), [], farLp)
  assert.ok(!hits(farLp).some((h) => h.move === 'bog-grasp'), 'LP short')
  const farHp: SimEvent[] = []
  play(fightAt(220), 50, GRASP('hp'), [], farHp)
  assert.ok(
    hits(farHp).some((h) => h.move === 'bog-grasp'),
    'HP far',
  )
})

check('Bog Grasp: a jumper is over it', () => {
  const log: SimEvent[] = []
  // They jump as she starts the motion; at the top of the jump the tentacle rises.
  play(fightAt(220), 50, GRASP('hp'), [N, N, press({ up: true })], log)
  assert.ok(!hits(log).some((h) => h.move === 'bog-grasp'), 'over it')
  const grasp = moveOf(SWAMP_WITCH, { id: 'bog-grasp', heavy: true })
  assert.equal(grasp.strikeAt, 'opponent')
  assert.ok(grasp.hitbox.h <= 80)
})

check('Leech Hex: 60 over five seconds after the hit, all of it red', () => {
  const log: SimEvent[] = []
  let s = play(fightAt(200), 1, HEX, [], log)
  for (let i = 1; i < 120 && !hits(log).length; i += 1) {
    s = step(s, [HEX[i] ?? N, N], ROSTER)
    log.push(...s.events)
  }
  assert.ok(
    hits(log).some((h) => h.move === 'leech-hex'),
    'the glob hit',
  )
  assert.ok(s.fighters[1].poison.left > 0, 'the leech clings')
  const before = s.fighters[1]
  while (s.fighters[1].poison.left > 0) s = step(s, [N, N], ROSTER)
  const after = s.fighters[1]
  assert.equal(before.health - after.health, 60, '60 drained')
  assert.equal(after.red - before.red, 60, 'all of it red')
})

check('Sink: untouchable in the mud, then up beside the opponent', () => {
  const log: SimEvent[] = []
  const s = play(
    fightAt(66),
    60,
    SINK,
    [
      ...Array(18).fill(N),
      press({ hp: true }),
      ...Array(10).fill(N),
      press({ down: true, lk: true }),
    ],
    log,
  )
  assert.ok(log.some((e) => e.type === 'special' && e.move === 'sink'))
  assert.ok(!hits(log).some((h) => h.attacker === 1), 'nothing touches her')
  const far = play(fightAt(220), 60, SINK)
  const gap = Math.abs(far.fighters[1].x - far.fighters[0].x) / SUB
  assert.ok(gap <= 60, `surfaced beside them (${gap} px)`)
  assert.ok(s.fighters[0].health === SWAMP_WITCH.health)
})

check('Coil Snare: the command grab, 140', () => {
  const log: SimEvent[] = []
  play(fightAt(50), 40, SNARE, [], log)
  const grab = log.find((e) => e.type === 'throw')
  assert.ok(grab && grab.type === 'throw' && grab.damage === 140, 'wrapped')
})

check(
  'Bargain: a caught strike staggers the striker and banks half a bar',
  () => {
    const s0 = fightAt(50)
    const meter = s0.fighters[0].meter
    const log: SimEvent[] = []
    const s = play(
      s0,
      24,
      BARGAIN,
      [...Array(8).fill(N), press({ hp: true })],
      log,
    )
    assert.ok(
      log.some((e) => e.type === 'parry' && e.side === 0),
      'caught',
    )
    assert.ok(!hits(log).some((h) => h.attacker === 1), 'no damage to her')
    assert.equal(s.fighters[1].action, 'hitstun', 'the striker staggers')
    assert.ok(s.fighters[0].meter - meter >= METER_BAR / 2, 'half a bar')
  },
)

check('Bargain: a command grab goes straight through it', () => {
  const roster: [FighterData, FighterData] = [SWAMP_WITCH, HYENA_MATRIARCH]
  const log: SimEvent[] = []
  // The Hyena faces left: Bone Crusher's half circle runs forward (left) to back.
  play(
    fightAt(44, roster),
    40,
    BARGAIN,
    [...Array(4).fill(N), ...motion([4, 1, 2, 3, 6], { lp: true }, 1)],
    log,
    roster,
  )
  assert.ok(!log.some((e) => e.type === 'parry'), 'nothing to catch')
  const grab = log.find((e) => e.type === 'throw')
  assert.ok(grab && grab.type === 'throw' && grab.attacker === 1, 'grabbed')
})

// ---------------------------------------------------------------- supers

check('Drowning Pool: one bar, three tentacles in a line, 260 in all', () => {
  const s0 = fightAt(120)
  s0.fighters[0].meter = METER_BAR
  const log: SimEvent[] = []
  play(s0, 90, motion([2, 3, 6, 2, 3, 6], { lp: true }), [], log)
  assert.ok(log.some((e) => e.type === 'super' && e.move === 'drowning-pool'))
  assert.ok(hits(log).filter((h) => h.move === 'drowning-pool').length >= 2)
  const pool = moveOf(SWAMP_WITCH, { id: 'drowning-pool', heavy: false })
  assert.equal(pool.hits, 3)
  assert.ok(Math.abs(pool.hits! * pool.damage - 260) <= 1, '260 in all')
})

check('The Door Below: three bars, the Showdown, under them anywhere', () => {
  const s0 = fightAt(240)
  s0.fighters[0].meter = METER_MAX
  const log: SimEvent[] = []
  play(s0, 140, motion([2, 1, 4, 2, 1, 4], { hp: true }), [], log)
  const sup = log.find((e) => e.type === 'super' && e.move === 'the-door-below')
  assert.ok(sup && sup.type === 'super' && sup.showdown)
  const pulled = log.find((e) => e.type === 'throw')
  assert.ok(
    pulled && pulled.type === 'throw' && pulled.damage === 430,
    'at range',
  )
})

check('Coil Snare and The Door Below fling the Siblings, no one else', () => {
  const roster: [FighterData, FighterData] = [SWAMP_WITCH, SIBLINGS]
  const log: SimEvent[] = []
  play(fightAt(50, roster), 40, SNARE, [], log, roster)
  assert.ok(log.some((e) => e.type === 'fling' && e.move === 'coil-snare'))
  const other: SimEvent[] = []
  play(fightAt(50), 40, SNARE, [], other)
  assert.ok(!other.some((e) => e.type === 'fling'))
  for (const id of ['coil-snare', 'the-door-below'])
    assert.equal(moveOf(SWAMP_WITCH, { id, heavy: false }).fling, true, id)
})

// ---------------------------------------------------------------- fuzz

check(
  'the Swamp Witch replays deterministically and keeps every invariant',
  () => {
    for (const [seed, roster] of [
      [281, ROSTER],
      [282, [ZUZU, SWAMP_WITCH] as [FighterData, FighterData]],
      [283, [SWAMP_WITCH, SWAMP_WITCH] as [FighterData, FighterData]],
      [284, [SWAMP_WITCH, ABBESS] as [FighterData, FighterData]],
      [285, [SIBLINGS, SWAMP_WITCH] as [FighterData, FighterData]],
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
          }
        }
        return hashState(s)
      }
      assert.equal(once(), once(), `seed ${seed}`)
    }
  },
)

console.log(`verifyZuzuShowdownWitch: ${passed} checks passed`)
