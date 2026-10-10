// /utils/scripts/verifyZuzuShowdownKomodo.test.ts
//
// Zuzu Showdown (conductor zuzu-showdown t-017): Old Komodo's kit. Every
// special fires from its fighters.yaml input; every heavy attack soaks a hit;
// his bites poison (3 health a second for 6 seconds, all red); Sand Burrow is
// strike-invulnerable and resurfaces where he went down (LK) or under the
// opponent (HK), and any punch Rises from the Dune; Tongue Taste grabs at
// range; Old Staff is the armored anti-air; the supers; Venom Bite and
// Feeding Time fling the Siblings.
//
//   npx tsx utils/scripts/verifyZuzuShowdownKomodo.test.ts

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
import { OLD_KOMODO } from '../zuzuShowdown/fighters/old-komodo'
import { RIVER_CROC } from '../zuzuShowdown/fighters/river-croc'
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

const ROSTER: [FighterData, FighterData] = [OLD_KOMODO, PLACEHOLDER_B]
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

const BITE = motion([2, 3, 6], { lp: true })
const burrow = (kick: 'lk' | 'hk') => motion([2, 5, 2], { [kick]: true })

// ---------------------------------------------------------------- data

check(
  'every special matches its fighters.yaml input; he joins the roster',
  () => {
    const yaml: Record<string, string> = {
      'venom-bite': 'QCF+P',
      'sand-burrow': 'dd+K',
      'tongue-taste': 'QCB+P',
      'old-staff': 'DP+P',
      'slow-hunger': 'QCF QCF+P',
      'feeding-time': 'QCB QCB+HP',
    }
    const commands = OLD_KOMODO.specials.filter((s) => !s.followUp)
    assert.deepEqual(commands.map((s) => s.id).sort(), Object.keys(yaml).sort())
    for (const special of commands) {
      const parsed = parseNotation(yaml[special.id]!)
      assert.ok(parsed, special.id)
      assert.equal(parsed.motion, special.motion, special.id)
      assert.equal(parsed.button, special.button, special.id)
    }
    const rise = OLD_KOMODO.specials.find((s) => s.id === 'rise-from-the-dune')!
    assert.equal(rise.followUp, true, 'any P while burrowed')
    assert.ok(FIGHTERS.includes(OLD_KOMODO))
    assert.equal(OLD_KOMODO.health, 1150)
  },
)

// ---------------------------------------------------------------- passives

check('every heavy attack soaks a hit, light or heavy', () => {
  for (const id of [
    'stand_hp',
    'stand_hk',
    'crouch_hp',
    'crouch_hk',
  ] as const) {
    const armor = OLD_KOMODO.moves[id].armor
    assert.ok(armor && armor.hits >= 1 && !armor.lightOnly, id)
  }
  const log: SimEvent[] = []
  play(fightAt(66), 30, [press({ hp: true })], [press({ hp: true })], log)
  assert.ok(
    log.some((e) => e.type === 'armor' && e.side === 0),
    'soaked',
  )
  assert.ok(
    hits(log).some((h) => h.attacker === 0),
    'his smash lands',
  )
  assert.ok(moveOf(OLD_KOMODO, { id: 'old-staff', heavy: false }).armor)
})

check('venom: 3 health a second for 6 seconds, all of it red', () => {
  const log: SimEvent[] = []
  const bitten = play(fightAt(80), 30, BITE, [], log)
  assert.ok(
    hits(log).some((h) => h.move === 'venom-bite'),
    'the bite hit',
  )
  assert.ok(bitten.fighters[1].poison.left > 0, 'poisoned')
  const before = bitten.fighters[1]
  // Until the venom runs out (after that, red health starts regenerating).
  let s = bitten
  while (s.fighters[1].poison.left > 0) s = step(s, [N, N], ROSTER)
  const after = s.fighters[1]
  assert.equal(before.health - after.health, 18, '18 over 6 seconds')
  assert.equal(after.red - before.red, 18, 'all of it red')
  assert.equal(after.poison.left, 0)
})

// ---------------------------------------------------------------- the kit

check('Sand Burrow: strike-invulnerable underground', () => {
  const log: SimEvent[] = []
  play(
    fightAt(66),
    60,
    burrow('lk'),
    [
      ...Array(20).fill(N),
      press({ hp: true }),
      ...Array(14).fill(N),
      press({ down: true, lk: true }),
    ],
    log,
  )
  assert.ok(log.some((e) => e.type === 'special' && e.move === 'sand-burrow'))
  assert.ok(!hits(log).some((h) => h.attacker === 1), 'nothing touches him')
})

check('LK resurfaces where he went down; HK under the opponent', () => {
  const s0 = fightAt(200)
  const start = s0.fighters[0].x
  const lk = play(s0, 50, burrow('lk'))
  assert.equal(lk.fighters[0].x, start, 'where he went down')
  const hk = play(fightAt(200), 50, burrow('hk'))
  const gap = Math.abs(hk.fighters[1].x - hk.fighters[0].x) / SUB
  assert.ok(gap <= 60, `beside them now (${gap} px)`)
})

check('Rise from the Dune: any punch from the sand, a launcher', () => {
  const log: SimEvent[] = []
  let s = play(fightAt(200), 40, burrow('hk'), [], log)
  for (let i = 0; i < 30 && s.fighters[1].action !== 'airhit'; i += 1) {
    s = step(s, [press({ hp: i === 0 }), N], ROSTER)
    log.push(...s.events)
  }
  assert.ok(
    log.some((e) => e.type === 'special' && e.move === 'rise-from-the-dune'),
  )
  assert.ok(hits(log).some((h) => h.move === 'rise-from-the-dune'))
  assert.equal(s.fighters[1].action, 'airhit', 'launched')
})

check('Tongue Taste: a ranged grab that pulls them in, 40', () => {
  const log: SimEvent[] = []
  const s = play(fightAt(140), 40, motion([2, 1, 4], { lp: true }), [], log)
  const grab = log.find((e) => e.type === 'throw')
  assert.ok(grab && grab.type === 'throw' && grab.damage === 40, 'caught')
  assert.notEqual(s.fighters[1].action, 'knockdown', 'pulled in, standing')
  const gap = Math.abs(s.fighters[1].x - s.fighters[0].x) / SUB
  assert.ok(gap <= 60, `in staff range (${gap} px)`)
})

check('Old Staff: the armored anti-air', () => {
  const log: SimEvent[] = []
  play(
    fightAt(90),
    60,
    [...Array(14).fill(N), ...motion([6, 2, 3], { lp: true }, 1)],
    [press({ up: true, left: true })],
    log,
  )
  assert.ok(
    hits(log).some((h) => h.move === 'old-staff'),
    'swatted down',
  )
})

// ---------------------------------------------------------------- supers

check('Slow Hunger: three poisoned bites a light hit cannot stop', () => {
  // Close enough for the opponent's jab to reach him.
  const s0 = fightAt(52)
  s0.fighters[0].meter = METER_BAR
  const log: SimEvent[] = []
  const s = play(
    s0,
    120,
    motion([2, 3, 6, 2, 3, 6], { lp: true }),
    [...Array(18).fill(N), press({ lp: true })],
    log,
  )
  assert.ok(log.some((e) => e.type === 'super' && e.move === 'slow-hunger'))
  assert.ok(
    log.some((e) => e.type === 'armor' && e.side === 0),
    'shrugged',
  )
  assert.ok(hits(log).filter((h) => h.move === 'slow-hunger').length >= 2)
  assert.ok(s.fighters[1].poison.left > 0, 'poisoned')
  const hunger = moveOf(OLD_KOMODO, { id: 'slow-hunger', heavy: false })
  assert.equal(hunger.hits, 3)
  assert.ok(Math.abs(hunger.hits! * hunger.damage - 260) <= 1, '260 in all')
})

check('Feeding Time: three bars, the Showdown, under them anywhere', () => {
  const s0 = fightAt(240)
  s0.fighters[0].meter = METER_MAX
  const log: SimEvent[] = []
  play(s0, 140, motion([2, 1, 4, 2, 1, 4], { hp: true }), [], log)
  const sup = log.find((e) => e.type === 'super' && e.move === 'feeding-time')
  assert.ok(sup && sup.type === 'super' && sup.showdown)
  const gulp = log.find((e) => e.type === 'throw')
  assert.ok(gulp && gulp.type === 'throw' && gulp.damage === 450, 'at range')
})

check('Venom Bite and Feeding Time fling the Siblings, no one else', () => {
  const roster: [FighterData, FighterData] = [OLD_KOMODO, SIBLINGS]
  const log: SimEvent[] = []
  play(fightAt(80, roster), 30, BITE, [], log, roster)
  assert.ok(log.some((e) => e.type === 'fling' && e.move === 'venom-bite'))
  const other: SimEvent[] = []
  play(fightAt(80), 30, BITE, [], other)
  assert.ok(!other.some((e) => e.type === 'fling'))
  for (const id of ['venom-bite', 'feeding-time'])
    assert.equal(moveOf(OLD_KOMODO, { id, heavy: false }).fling, true, id)
})

// ---------------------------------------------------------------- fuzz

check('Old Komodo replays deterministically and keeps every invariant', () => {
  for (const [seed, roster] of [
    [111, ROSTER],
    [112, [ZUZU, OLD_KOMODO] as [FighterData, FighterData]],
    [113, [OLD_KOMODO, OLD_KOMODO] as [FighterData, FighterData]],
    [114, [OLD_KOMODO, RIVER_CROC] as [FighterData, FighterData]],
    [115, [SIBLINGS, OLD_KOMODO] as [FighterData, FighterData]],
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
})

console.log(`verifyZuzuShowdownKomodo: ${passed} checks passed`)
