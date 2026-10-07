// /utils/scripts/verifyZuzuShowdownCoyote.test.ts
//
// Zuzu Showdown (conductor zuzu-showdown t-014): the Coyote Vagrant's kit.
// Every special fires from its fighters.yaml input; Wild Shot spends a
// bullet, the aim wobbles by a seeded amount, six shots then a reload; Pocket
// Sand stops the victim blocking; Stump Shiv is a three-stab combo; Pick
// Pocket steals meter; Play Dead counters strikes but loses to lows and
// grabs; Last Meal and Six Bad Shots; and a fuzzed replay with the whole kit.
//
//   npx tsx utils/scripts/verifyZuzuShowdownCoyote.test.ts

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
  pushbox,
  step,
} from '../zuzuShowdown/sim'
import { PLACEHOLDER_B } from '../zuzuShowdown/fighters/placeholders'
import { COYOTE } from '../zuzuShowdown/fighters/coyote'
import { ZUZU } from '../zuzuShowdown/fighters/zuzu'
import { DEFAULT_FIGHTERS, FIGHTERS } from '../zuzuShowdown/fighters'
import {
  SIM_BUTTONS,
  SUB,
  neutralInput,
  type FighterData,
  type MatchState,
  type SimEvent,
  type SimInput,
} from '../zuzuShowdown/types'

const ROSTER: [FighterData, FighterData] = [COYOTE, PLACEHOLDER_B]
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
const specialsFired = (log: SimEvent[], id: string) =>
  log.filter(
    (e) => (e.type === 'special' || e.type === 'super') && e.move === id,
  ).length

// ---------------------------------------------------------------- data

check(
  'every special matches its fighters.yaml input; the roster leads with Zuzu vs the Coyote',
  () => {
    const yaml: Record<string, string> = {
      'wild-shot': 'QCF+P',
      'pocket-sand': 'QCB+K',
      'stump-shiv': '[b]f+P',
      'pick-pocket': 'HCB+K',
      'play-dead': 'dd+D',
      reload: 'dd+P',
      'last-meal': 'QCF QCF+K',
      'six-bad-shots': 'QCB QCB+HP',
    }
    assert.deepEqual(
      COYOTE.specials.map((s) => s.id).sort(),
      Object.keys(yaml).sort(),
    )
    for (const special of COYOTE.specials) {
      const parsed = parseNotation(yaml[special.id]!)
      assert.ok(parsed, special.id)
      assert.equal(parsed.motion, special.motion, special.id)
      assert.equal(parsed.button, special.button, special.id)
    }
    assert.ok(FIGHTERS.includes(COYOTE))
    assert.deepEqual(DEFAULT_FIGHTERS, ['zuzu', 'coyote-vagrant'])
    assert.equal(COYOTE.health, 950)
  },
)

// ---------------------------------------------------------------- the gun

check(
  'Wild Shot spends a bullet; six shots, then nothing until he reloads',
  () => {
    let s = fightAt(300)
    assert.equal(s.fighters[0].ammo, 6)
    const log: SimEvent[] = []
    for (let shot = 0; shot < 7; shot += 1) {
      s = play(s, 70, motion([2, 3, 6], { lp: true }), [], log)
    }
    assert.equal(specialsFired(log, 'wild-shot'), 6)
    assert.equal(s.fighters[0].ammo, 0)
    const reloadLog: SimEvent[] = []
    s = play(s, 40, motion([2, 5, 2], { lp: true }), [], reloadLog)
    assert.equal(specialsFired(reloadLog, 'reload'), 1)
    assert.equal(s.fighters[0].ammo, 6)
    const again: SimEvent[] = []
    play(s, 30, motion([2, 3, 6], { lp: true }), [], again)
    assert.equal(specialsFired(again, 'wild-shot'), 1)
  },
)

check(
  'the aim wobbles by a seeded amount: same seed, same shot; other seeds differ',
  () => {
    const shotY = (seed: number) => {
      const s = play(
        fightAt(300, ROSTER, seed),
        20,
        motion([2, 3, 6], { lp: true }),
      )
      assert.equal(s.projectiles.length, 1)
      return s.projectiles[0]!.y
    }
    assert.equal(shotY(7), shotY(7))
    const heights = new Set([1, 2, 3, 4, 5, 6, 7, 8].map(shotY))
    assert.ok(heights.size >= 3, `only ${heights.size} distinct heights`)
    const spread = COYOTE.specials.find((s) => s.id === 'wild-shot')!.move
      .projectile!.spread!
    const centre = 70 * SUB
    for (const y of heights) assert.ok(Math.abs(y - centre) <= spread * SUB)
  },
)

check('a shot hits a standing target at range', () => {
  const log: SimEvent[] = []
  play(fightAt(200), 60, motion([2, 3, 6], { hp: true }), [], log)
  assert.ok(hits(log).some((h) => h.move === 'wild-shot'))
})

// ---------------------------------------------------------------- dirty tricks

check('Pocket Sand: the victim can’t block for a moment', () => {
  const log: SimEvent[] = []
  const back = press({ right: true })
  let s = play(fightAt(44), 14, motion([2, 1, 4], { lk: true }), [], log)
  assert.ok(hits(log).some((h) => h.move === 'pocket-sand'))
  assert.ok(s.fighters[1].blind > 0)
  // He recovers while they stagger; once it ends, holding back still
  // doesn't block his jab.
  s = play(s, 18, [], Array(18).fill(back))
  assert.equal(s.fighters[0].action, 'idle')
  assert.ok(s.fighters[1].blind > 0)
  const blind: SimEvent[] = []
  s = play(s, 20, [press({ lp: true })], Array(20).fill(back), blind)
  assert.ok(hits(blind).some((h) => h.move === 'stand_lp'))
  // Once it wears off, the same jab is blocked.
  s = run(s, 40)
  assert.equal(s.fighters[1].blind, 0)
  s.fighters[0].x = -22 * SUB
  s.fighters[1].x = 22 * SUB
  const clear: SimEvent[] = []
  play(s, 20, [press({ lp: true })], Array(20).fill(back), clear)
  assert.ok(clear.some((e) => e.type === 'block'))
})

function run(s: MatchState, frames: number): MatchState {
  return play(s, frames, [], [])
}

check('Stump Shiv: three stabs, one combo', () => {
  const log: SimEvent[] = []
  const charge = [
    ...Array(50).fill(press({ down: true, left: true })),
    press({ right: true, lp: true }),
  ]
  play(fightAt(56), 120, charge, [], log)
  const stabs = hits(log).filter((h) => h.move === 'stump-shiv')
  assert.deepEqual(
    stabs.map((h) => h.combo),
    [1, 2, 3],
  )
})

check('Pick Pocket steals half a bar', () => {
  const s0 = fightAt(36)
  s0.fighters[1].meter = METER_BAR
  const log: SimEvent[] = []
  const s = play(s0, 30, motion([6, 3, 2, 1, 4], { lk: true }, 1), [], log)
  assert.ok(log.some((e) => e.type === 'throw' && e.attacker === 0))
  const grab = moveOf(COYOTE, { id: 'pick-pocket', heavy: false })
  // The victim keeps what was left plus what being hit earned them.
  assert.equal(
    s.fighters[1].meter,
    METER_BAR - 500 + Math.trunc(grab.damage / 2),
  )
  assert.equal(s.fighters[0].meter, grab.damage + 500)
})

check('Play Dead counters a strike, but a low or a grab gets him', () => {
  const p1 = motion([2, 5, 2], { dodge: true })
  // A standing jab: the kick-up counter.
  const log: SimEvent[] = []
  const s = play(
    fightAt(40),
    60,
    p1,
    [...Array(p1.length + 4).fill(N), press({ lp: true })],
    log,
  )
  assert.ok(log.some((e) => e.type === 'parry' && e.side === 0))
  assert.equal(s.fighters[1].health, PLACEHOLDER_B.health - 90)
  // A low kick hits the "corpse".
  const low: SimEvent[] = []
  play(
    fightAt(40),
    60,
    p1,
    [...Array(p1.length + 4).fill(N), press({ down: true, lk: true })],
    low,
  )
  assert.ok(!low.some((e) => e.type === 'parry'))
  assert.ok(hits(low).some((h) => h.attacker === 1))
  // And a throw takes him.
  const grabbed: SimEvent[] = []
  play(
    fightAt(36),
    60,
    p1,
    [...Array(p1.length + 4).fill(N), press({ lp: true, lk: true })],
    grabbed,
  )
  assert.ok(grabbed.some((e) => e.type === 'throw' && e.attacker === 1))
})

// ---------------------------------------------------------------- supers

check('Last Meal: a bar for a four-hit rush', () => {
  const s0 = fightAt(70)
  s0.fighters[0].meter = METER_BAR
  const log: SimEvent[] = []
  play(s0, 120, motion([2, 3, 6, 2, 3, 6], { lk: true }), [], log)
  assert.ok(log.some((e) => e.type === 'super' && e.move === 'last-meal'))
  assert.equal(hits(log).filter((h) => h.move === 'last-meal').length, 4)
})

check('Six Bad Shots: three bars, HP, the Showdown, 400', () => {
  const s0 = fightAt(160)
  s0.fighters[0].meter = METER_MAX
  const log: SimEvent[] = []
  play(s0, 200, motion([2, 1, 4, 2, 1, 4], { hp: true }), [], log)
  assert.ok(
    log.some(
      (e) => e.type === 'super' && e.move === 'six-bad-shots' && e.showdown,
    ),
  )
  assert.equal(hits(log).find((h) => h.move === 'six-bad-shots')?.damage, 400)
})

check('ammo comes back each round', () => {
  let s = fightAt(300)
  s = play(s, 30, motion([2, 3, 6], { lp: true }))
  assert.equal(s.fighters[0].ammo, 5)
  s.fighters[1].health = 1
  s.fighters[0].x = s.fighters[1].x - 50 * SUB
  s = play(s, 10, [press({ lp: true })])
  s = run(s, 160)
  assert.equal(s.round, 2)
  assert.equal(s.fighters[0].ammo, 6)
})

// ---------------------------------------------------------------- fuzz

check(
  'the Coyote replays deterministically (seeded aim included) and keeps every invariant',
  () => {
    for (const [seed, roster] of [
      [51, ROSTER],
      [52, [ZUZU, COYOTE] as [FighterData, FighterData]],
      [53, [COYOTE, COYOTE] as [FighterData, FighterData]],
    ] as const) {
      const once = () => {
        const rand = mulberry32(seed)
        const held: [SimInput, SimInput] = [neutralInput(), neutralInput()]
        let s = createMatch(roster, seed)
        const hashes: string[] = []
        for (let i = 0; i < 4000 && s.phase !== 'over'; i += 1) {
          for (const p of held) {
            for (const button of SIM_BUTTONS)
              if (rand() < 0.1) p[button] = !p[button]
          }
          s = step(s, [{ ...held[0] }, { ...held[1] }], roster)
          for (const side of [0, 1] as const) {
            const f = s.fighters[side]
            assert.ok(f.health >= 0 && f.health <= roster[side].health)
            assert.ok(f.meter >= 0 && f.meter <= METER_MAX)
            assert.ok(f.ammo >= 0 && f.ammo <= (roster[side].ammo ?? 0))
            assert.ok(f.blind >= 0)
          }
          const [a, b] = s.fighters
          const passing = [a, b].some((f, side) => {
            if (f.action === 'dodge') return true
            return (
              f.attack !== null &&
              moveOf(roster[side as 0 | 1], f.attack).passThrough !== undefined
            )
          })
          if (s.phase === 'fight' && a.y === 0 && b.y === 0 && !passing) {
            const pa = pushbox(a, roster[0])
            const pb = pushbox(b, roster[1])
            assert.ok(
              Math.min(pa.right, pb.right) - Math.max(pa.left, pb.left) <= 0,
              `overlap on frame ${i}`,
            )
          }
          hashes.push(hashState(s))
        }
        return hashes
      }
      assert.deepEqual(once(), once())
    }
  },
)

console.log(`verifyZuzuShowdownCoyote: ${passed} checks passed`)
