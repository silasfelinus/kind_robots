// /utils/scripts/verifyZuzuShowdownMittens.test.ts
//
// Zuzu Showdown (conductor zuzu-showdown t-032): Jeffery Mittens's kit. Every
// special fires from its fighters.yaml input; Boot Toss spends one of his four
// boots (LP high, HP skidding low) and Scavenge restrings them; Underfoot slides
// low through the opponent and out the other side, under their projectiles;
// Ledge Drop is an overhead from the air that springs him back up; Tied Laces
// grabs through a block and leaves them standing; Little Knife beats a jump-in;
// Weren't Me catches a swing but not a sweep; the supers.
//
//   npx tsx utils/scripts/verifyZuzuShowdownMittens.test.ts

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
import { JEFFERY_MITTENS } from '../zuzuShowdown/fighters/jeffery-mittens'
import { COYOTE } from '../zuzuShowdown/fighters/coyote'
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

const ROSTER: [FighterData, FighterData] = [JEFFERY_MITTENS, PLACEHOLDER_B]
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
const blocks = (log: SimEvent[]) =>
  log.filter(
    (e): e is Extract<SimEvent, { type: 'block' }> => e.type === 'block',
  )

const TOSS = (button: 'lp' | 'hp') => motion([2, 3, 6], { [button]: true })
const UNDERFOOT = motion([2, 1, 4], { lk: true })
const LACES = motion([6, 3, 2, 1, 4], { lp: true })
const KNIFE = motion([6, 2, 3], { lp: true })
const WERENT_ME = motion([2, 5, 2], { lk: true })
const SCAVENGE = motion([2, 5, 2], { lp: true })
// The opponent stands on the right: holding right is holding back.
const BLOCK_HIGH = press({ right: true })
const BLOCK_LOW = press({ right: true, down: true })

// ---------------------------------------------------------------- data

check(
  'every special matches its fighters.yaml input; he joins the roster',
  () => {
    const yaml: Record<string, string> = {
      'boot-toss': 'QCF+P',
      underfoot: 'QCB+K',
      'ledge-drop': 'QCB+K',
      'tied-laces': 'HCB+P',
      'little-knife': 'DP+P',
      'werent-me': 'dd+K',
      scavenge: 'dd+P',
      'every-last-boot': 'QCF QCF+P',
      'the-dry-well-pack': 'QCB QCB+HP',
    }
    assert.deepEqual(
      JEFFERY_MITTENS.specials.map((s) => s.id).sort(),
      Object.keys(yaml).sort(),
    )
    for (const special of JEFFERY_MITTENS.specials) {
      const parsed = parseNotation(yaml[special.id]!)
      assert.ok(parsed, special.id)
      assert.equal(parsed.motion, special.motion, special.id)
      assert.equal(parsed.button, special.button, special.id)
    }
    assert.equal(JEFFERY_MITTENS.slug, 'jeffery-mittens')
    assert.ok(FIGHTERS.includes(JEFFERY_MITTENS))
    assert.equal(JEFFERY_MITTENS.health, 900)
    assert.equal(JEFFERY_MITTENS.ammo, 4)
  },
)

// ---------------------------------------------------------------- the kit

check('Boot Toss: one boot each, four to a string, then Scavenge', () => {
  let s = fightAt(220)
  const log: SimEvent[] = []
  for (let i = 0; i < 5; i += 1) s = play(s, 50, TOSS('lp'), [], log)
  const thrown = log.filter(
    (e) => e.type === 'special' && e.move === 'boot-toss',
  )
  assert.equal(thrown.length, 4, 'four boots, no fifth')
  assert.equal(s.fighters[0].ammo, 0)
  s = play(s, 40, SCAVENGE)
  assert.equal(s.fighters[0].ammo, 4, 'restrung')
  assert.ok(
    hits(log).some((h) => h.move === 'boot-toss'),
    'a boot landed',
  )
})

check('Boot Toss HP skids low: a standing block misses it', () => {
  const standing: SimEvent[] = []
  play(fightAt(200), 70, TOSS('hp'), Array(70).fill(BLOCK_HIGH), standing)
  assert.ok(
    hits(standing).some((h) => h.move === 'boot-toss'),
    'hit high-blocker',
  )
  const crouching: SimEvent[] = []
  play(fightAt(200), 70, TOSS('hp'), Array(70).fill(BLOCK_LOW), crouching)
  assert.ok(
    blocks(crouching).some((b) => b.move === 'boot-toss'),
    'low block',
  )
})

check('Underfoot: a low slide that comes out the other side', () => {
  const s0 = fightAt(60)
  const log: SimEvent[] = []
  const s = play(s0, 50, UNDERFOOT, [], log)
  assert.ok(
    hits(log).some((h) => h.move === 'underfoot'),
    'it hit',
  )
  assert.ok(s.fighters[0].x > s.fighters[1].x, 'he came out behind them')
  const low: SimEvent[] = []
  play(fightAt(60), 50, UNDERFOOT, Array(50).fill(BLOCK_LOW), low)
  assert.ok(
    blocks(low).some((b) => b.move === 'underfoot'),
    'blocked low',
  )
  const slide = moveOf(JEFFERY_MITTENS, { id: 'underfoot', heavy: false })
  assert.ok(slide.invuln?.projectile, 'boots and bullets pass over him')
  assert.ok(slide.passThrough)
})

check('Underfoot slides under a bullet', () => {
  const roster: [FighterData, FighterData] = [JEFFERY_MITTENS, COYOTE]
  const log: SimEvent[] = []
  // The Coyote (facing left) fires Wild Shot as Jeffery starts his slide.
  play(
    fightAt(150, roster),
    60,
    [...Array(6).fill(N), ...UNDERFOOT],
    motion([2, 1, 4], { lp: true }),
    log,
    roster,
  )
  assert.ok(log.some((e) => e.type === 'special' && e.side === 1))
  assert.ok(
    !hits(log).some((h) => h.attacker === 1 && h.move === 'wild-shot'),
    'the shot went over',
  )
})

check('Ledge Drop: an overhead from the air that springs him back up', () => {
  const p1 = [
    press({ up: true, right: true }),
    ...Array(10).fill(press({ right: true })),
    ...motion([2, 1, 4], { lk: true }, 1),
  ]
  let s = fightAt(80)
  const log: SimEvent[] = []
  let bounced = false
  for (let i = 0; i < 60; i += 1) {
    s = step(s, [p1[i] ?? N, BLOCK_LOW], ROSTER)
    log.push(...s.events)
    if (
      s.events.some((e) => e.type === 'hit' && e.move === 'ledge-drop') &&
      s.fighters[0].vy > 0
    )
      bounced = true
  }
  assert.ok(log.some((e) => e.type === 'special' && e.move === 'ledge-drop'))
  assert.ok(
    hits(log).some((h) => h.move === 'ledge-drop'),
    'beat a low block',
  )
  assert.ok(bounced, 'sprang back up')
})

check(
  'Tied Laces: grabs through a block and leaves them standing, close',
  () => {
    const log: SimEvent[] = []
    // A crouching block holds its ground (holding back walks away).
    const s = play(fightAt(46), 40, LACES, Array(40).fill(BLOCK_LOW), log)
    const grab = log.find((e) => e.type === 'throw')
    assert.ok(grab && grab.type === 'throw' && grab.damage === 50, 'tied')
    const [jeffery, victim] = s.fighters
    assert.notEqual(victim.action, 'knockdown', 'left standing')
    assert.ok(Math.abs(victim.x - jeffery.x) <= 60 * SUB, 'still in reach')
  },
)

check('Little Knife: beats a jump-in', () => {
  const log: SimEvent[] = []
  // The opponent jumps in with a heavy kick; he answers with the rising knife.
  play(
    fightAt(110),
    70,
    [...Array(14).fill(N), ...KNIFE],
    [
      press({ up: true, left: true }),
      ...Array(9).fill(press({ left: true })),
      press({ hk: true }),
    ],
    log,
  )
  assert.ok(
    hits(log).some((h) => h.move === 'little-knife'),
    'knife landed',
  )
  assert.ok(!hits(log).some((h) => h.attacker === 1), 'the jump-in did not')
})

check("Weren't Me: catches a swing, but a sweep gets him", () => {
  const caught: SimEvent[] = []
  play(
    fightAt(50),
    24,
    WERENT_ME,
    [...Array(5).fill(N), press({ hp: true })],
    caught,
  )
  assert.ok(
    caught.some((e) => e.type === 'parry' && e.side === 0),
    'caught',
  )
  assert.ok(!hits(caught).some((h) => h.attacker === 1), 'no damage to him')
  const swept: SimEvent[] = []
  play(
    fightAt(50),
    30,
    WERENT_ME,
    [...Array(5).fill(N), press({ down: true, hk: true })],
    swept,
  )
  assert.ok(!swept.some((e) => e.type === 'parry'), 'nothing to catch')
  assert.ok(
    hits(swept).some((h) => h.attacker === 1),
    'swept',
  )
})

// ---------------------------------------------------------------- supers

check('Every Last Boot: one bar, the whole string, five boots', () => {
  const s0 = fightAt(60)
  s0.fighters[0].meter = METER_BAR
  const log: SimEvent[] = []
  play(s0, 90, motion([2, 3, 6, 2, 3, 6], { lp: true }), [], log)
  assert.ok(log.some((e) => e.type === 'super' && e.move === 'every-last-boot'))
  assert.ok(hits(log).filter((h) => h.move === 'every-last-boot').length >= 3)
  const flail = moveOf(JEFFERY_MITTENS, { id: 'every-last-boot', heavy: false })
  assert.equal(flail.hits, 5)
})

check(
  'The Dry Well Pack: three bars, the Showdown, wherever they stand',
  () => {
    const s0 = fightAt(260)
    s0.fighters[0].meter = METER_MAX
    const log: SimEvent[] = []
    play(s0, 140, motion([2, 1, 4, 2, 1, 4], { hp: true }), [], log)
    const sup = log.find(
      (e) => e.type === 'super' && e.move === 'the-dry-well-pack',
    )
    assert.ok(sup && sup.type === 'super' && sup.showdown)
    assert.ok(
      hits(log).some((h) => h.move === 'the-dry-well-pack'),
      'the pack found them across the screen',
    )
  },
)

// ---------------------------------------------------------------- fuzz

check('Jeffery replays deterministically and keeps every invariant', () => {
  for (const [seed, roster] of [
    [321, ROSTER],
    [322, [ZUZU, JEFFERY_MITTENS] as [FighterData, FighterData]],
    [323, [JEFFERY_MITTENS, JEFFERY_MITTENS] as [FighterData, FighterData]],
    [324, [JEFFERY_MITTENS, COYOTE] as [FighterData, FighterData]],
    [325, [SIBLINGS, JEFFERY_MITTENS] as [FighterData, FighterData]],
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
          assert.ok(f.ammo >= 0)
        }
      }
      return hashState(s)
    }
    assert.equal(once(), once(), `seed ${seed}`)
  }
})

console.log(`verifyZuzuShowdownMittens: ${passed} checks passed`)
