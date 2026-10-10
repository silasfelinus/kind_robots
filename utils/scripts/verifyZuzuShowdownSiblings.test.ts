// /utils/scripts/verifyZuzuShowdownSiblings.test.ts
//
// Zuzu Showdown (conductor zuzu-showdown t-015): the Siblings' kit.
// Every special fires from its fighters.yaml input; Apple Toss spends and
// regrows the toddler's three apples, Bared Teeth is the anti-air, Big Ears
// parries a strike, Shield Him armors one hit, Scramble slides under
// projectiles, the supers, and Abbess's Last Rites flings them. The toddler
// puppet (t-011) follows his sister's state and is never in harm's way.
//
//   npx tsx utils/scripts/verifyZuzuShowdownSiblings.test.ts

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
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
import { SIBLINGS } from '../zuzuShowdown/fighters/siblings'
import { ZUZU } from '../zuzuShowdown/fighters/zuzu'
import { FIGHTERS } from '../zuzuShowdown/fighters'
import {
  FLEE_DELAY,
  FLEE_SPEED,
  SPRITE_PUPPETS,
  fleeShift,
  puppetPlace,
} from '../zuzuShowdown/sprites'
import { drawMatch } from '../zuzuShowdown/render'
import {
  SIM_BUTTONS,
  SUB,
  neutralInput,
  type FighterData,
  type MatchState,
  type SimEvent,
  type SimInput,
} from '../zuzuShowdown/types'

const ROSTER: [FighterData, FighterData] = [SIBLINGS, PLACEHOLDER_B]
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

check(
  'every special matches its fighters.yaml input; they join the roster',
  () => {
    const yaml: Record<string, string> = {
      'apple-toss': 'QCF+P',
      'bared-teeth': 'DP+K',
      'big-ears': 'QCB+K',
      'shield-him': '[d]u+P',
      scramble: 'QCF+K',
      'rain-of-apples': 'QCF QCF+P',
      'lone-survivor': 'QCB QCB+HP',
    }
    assert.deepEqual(
      SIBLINGS.specials.map((s) => s.id).sort(),
      Object.keys(yaml).sort(),
    )
    for (const special of SIBLINGS.specials) {
      const parsed = parseNotation(yaml[special.id]!)
      assert.ok(parsed, special.id)
      assert.equal(parsed.motion, special.motion, special.id)
      assert.equal(parsed.button, special.button, special.id)
    }
    assert.ok(FIGHTERS.includes(SIBLINGS))
    assert.equal(SIBLINGS.health, 900)
    assert.equal(SIBLINGS.childGuard, true)
  },
)

// ---------------------------------------------------------------- the kit

check('Apple Toss spends one of three apples; they regrow', () => {
  const still: FighterData = { ...SIBLINGS, ammoRegen: undefined }
  const roster: [FighterData, FighterData] = [still, PLACEHOLDER_B]
  let s = fightAt(300, roster)
  assert.equal(s.fighters[0].ammo, 3)
  const toss = motion([2, 3, 6], { lp: true })
  for (let i = 0; i < 3; i += 1) {
    s = play(s, 100, toss, [], undefined, roster)
    assert.equal(s.fighters[0].ammo, 2 - i)
  }
  s = play(s, 100, toss, [], undefined, roster)
  assert.equal(s.projectiles.length, 0, 'no apple left to throw')
  s = play(fightAt(300), SIBLINGS.ammoRegen! * 2, [])
  assert.equal(s.fighters[0].ammo, 3)
  let t = play(fightAt(300), 100, toss)
  t = play(t, SIBLINGS.ammoRegen! * 2, [])
  assert.equal(t.fighters[0].ammo, 3, 'the tree regrows what was thrown')
})

check('Apple Toss hits at range; the HP lob flies farther', () => {
  const log: SimEvent[] = []
  play(fightAt(150), 70, motion([2, 3, 6], { lp: true }), [], log)
  assert.ok(hits(log).some((h) => h.move === 'apple-toss'))
  const lp = play(fightAt(300), 30, motion([2, 3, 6], { lp: true }))
  const hp = play(fightAt(300), 30, motion([2, 3, 6], { hp: true }))
  assert.ok(hp.projectiles[0]!.x > lp.projectiles[0]!.x)
})

check(
  'Bared Teeth hits an air attacker; the HK is invulnerable on startup',
  () => {
    const s0 = fightAt(30)
    s0.fighters[1].y = 40 * SUB
    const log: SimEvent[] = []
    play(s0, 40, motion([6, 2, 3], { lk: true }), [], log)
    assert.ok(hits(log).some((h) => h.move === 'bared-teeth'))
    assert.ok(!moveOf(SIBLINGS, { id: 'bared-teeth', heavy: false }).invuln)
    assert.ok(moveOf(SIBLINGS, { id: 'bared-teeth', heavy: true }).invuln)
  },
)

check('Big Ears catches a strike and scratches back', () => {
  const p1 = motion([2, 1, 4], { lk: true })
  const log: SimEvent[] = []
  const s = play(
    fightAt(40),
    60,
    p1,
    [...Array(p1.length + 4).fill(N), press({ lp: true })],
    log,
  )
  assert.ok(log.some((e) => e.type === 'parry' && e.side === 0))
  assert.equal(s.fighters[1].health, PLACEHOLDER_B.health - 70)
})

check('Shield Him absorbs a hit with armor, at half damage, for meter', () => {
  const charge = [
    ...Array(50).fill(press({ down: true })),
    press({ up: true, lp: true }),
  ]
  const log: SimEvent[] = []
  const s = play(
    fightAt(40),
    90,
    charge,
    [...Array(charge.length + 3).fill(N), press({ hp: true })],
    log,
  )
  assert.ok(log.some((e) => e.type === 'special' && e.move === 'shield-him'))
  assert.ok(log.some((e) => e.type === 'armor' && e.side === 0))
  assert.equal(
    s.fighters[0].action === 'hitstun',
    false,
    'she is not staggered',
  )
  const heavy = moveOf(PLACEHOLDER_B, { id: 'stand_hp', heavy: false })
  assert.equal(
    s.fighters[0].health,
    SIBLINGS.health - Math.trunc(heavy.damage / 2),
    'half damage through the armor',
  )
  assert.ok(s.fighters[0].meter >= 200, 'shielding him builds meter')
})

check('Scramble slides low for two hits and goes under projectiles', () => {
  const log: SimEvent[] = []
  play(fightAt(50), 60, motion([2, 3, 6], { lk: true }), [], log)
  const scramble = hits(log).filter((h) => h.move === 'scramble')
  assert.ok(scramble.length >= 1)
  assert.equal(moveOf(SIBLINGS, { id: 'scramble', heavy: false }).hits, 2)
  assert.equal(moveOf(SIBLINGS, { id: 'scramble', heavy: false }).guard, 'low')
  assert.ok(
    moveOf(SIBLINGS, { id: 'scramble', heavy: false }).invuln?.projectile,
  )
})

check('Last Rites flings the Siblings (childGuard), not other fighters', () => {
  const roster: [FighterData, FighterData] = [ABBESS, SIBLINGS]
  const log: SimEvent[] = []
  play(
    fightAt(36, roster),
    60,
    motion([6, 3, 2, 1, 4, 7, 8, 9, 6], { lp: true }, 1),
    Array(60).fill(press({ left: true })),
    log,
    roster,
  )
  assert.ok(log.some((e) => e.type === 'fling' && e.move === 'last-rites'))
  const other: SimEvent[] = []
  play(fightAt(36), 60, [], [], other)
  assert.ok(!other.some((e) => e.type === 'fling'))
})

// ---------------------------------------------------------------- supers

check('Rain of Apples: a bar, five hits, 240 in all', () => {
  const s0 = fightAt(100)
  s0.fighters[0].meter = METER_BAR
  const log: SimEvent[] = []
  play(s0, 140, motion([2, 3, 6, 2, 3, 6], { lp: true }), [], log)
  assert.ok(log.some((e) => e.type === 'super' && e.move === 'rain-of-apples'))
  const rain = hits(log).filter((h) => h.move === 'rain-of-apples')
  assert.ok(rain.length >= 2)
  assert.equal(rain[0]!.damage, 48)
  assert.equal(
    moveOf(SIBLINGS, { id: 'rain-of-apples', heavy: false }).hits! *
      moveOf(SIBLINGS, { id: 'rain-of-apples', heavy: false }).damage,
    240,
  )
})

check('Lone Survivor: three bars, HP, the Showdown, 400', () => {
  const s0 = fightAt(160)
  s0.fighters[0].meter = METER_MAX
  const log: SimEvent[] = []
  play(s0, 200, motion([2, 1, 4, 2, 1, 4], { hp: true }), [], log)
  assert.ok(
    log.some(
      (e) => e.type === 'super' && e.move === 'lone-survivor' && e.showdown,
    ),
  )
  assert.equal(hits(log).find((h) => h.move === 'lone-survivor')?.damage, 400)
})

// ---------------------------------------------------------------- fuzz

check('the toddler puppet follows her state, ducking from every hit', () => {
  assert.equal(SPRITE_PUPPETS[SIBLINGS.slug], 'toddler')
  const base = createMatch(ROSTER).fighters[0]
  const at = (over: Partial<typeof base>, context = {}) =>
    puppetPlace({ ...base, ...over }, context)
  const attack = (id: string) =>
    ({ ...base.attack, id, frame: 1 }) as NonNullable<typeof base.attack>
  assert.equal(at({ action: 'idle' }).pose, 'stand')
  assert.equal(
    at({ action: 'attack', attack: attack('apple-toss') }).pose,
    'throw',
  )
  const shoulders = at({ action: 'attack', attack: attack('rain-of-apples') })
  assert.equal(shoulders.pose, 'throw')
  assert.ok(shoulders.up > 40, 'Rain of Apples: up on her shoulders')
  assert.equal(
    at({ action: 'attack', attack: attack('shield-him') }).pose,
    'duck',
  )
  // Whenever she is struck, blocking, thrown or down, he ducks behind her legs; at a KO she scoops
  // him up (fighters.yaml children_rules): never a harmed pose.
  for (const action of [
    'hitstun',
    'airhit',
    'blockstun',
    'thrown',
    'knockdown',
    'wakeup',
    'ko',
  ] as const)
    assert.equal(at({ action }).pose, 'duck', action)
  assert.equal(at({ action: 'ko' }).front, true, 'KO: held in her arms')
  assert.equal(at({ action: 'taunt' }).pose, 'raspberry')
  assert.equal(at({ action: 'victory' }).pose, 'proud')
  assert.equal(at({ action: 'victory' }, { perfect: true }).pose, 'wave')
  // In the air he rides her back, rising with her.
  const jump = at({ action: 'jump', y: 40 * SUB })
  assert.ok(jump.up >= 40, 'riding her back')
})

check(
  "the toddler's pose sheet ships every pose he takes (or the stand)",
  () => {
    for (const style of ['pixel', 'hd'] as const) {
      const sheet = JSON.parse(
        readFileSync(
          join(
            process.cwd(),
            'public',
            'zuzu-showdown-sprites',
            `toddler-${style}.json`,
          ),
          'utf8',
        ),
      ) as { animations: Record<string, { frames: unknown[] }> }
      assert.ok(sheet.animations.stand?.frames.length, `${style}: stands`)
      // Every pose puppetPlace can ask for is drawn.
      for (const pose of [
        'stand',
        'duck',
        'throw',
        'proud',
        'wave',
        'raspberry',
      ]) {
        assert.equal(
          sheet.animations[pose]?.frames.length,
          1,
          `${style} ${pose}`,
        )
      }
    }
  },
)

check('KO is never a death: she scoops him up and runs off-screen', () => {
  // A beat on one knee, then she runs; he rides in her arms.
  assert.equal(fleeShift(0), 0)
  assert.equal(fleeShift(FLEE_DELAY), 0)
  assert.equal(fleeShift(FLEE_DELAY + 10), 10 * FLEE_SPEED)
  const base = createMatch(ROSTER).fighters[0]
  const held = puppetPlace({ ...base, action: 'walk' }, { fleeing: true })
  assert.ok(held.front && held.pose === 'duck', 'carried, not left behind')
  // A whole KO draws, and she has left the screen by the end of it.
  let s = fightAt(80)
  s.fighters[0].health = 1
  s = play(s, 1, [], [press({ right: true })])
  s.fighters[0].health = 0
  let ran = 0
  for (let i = 0; i < 200 && s.phase !== 'intro'; i += 1) {
    s = step(s, [N, N], ROSTER)
    const xs: number[] = []
    const g = new Proxy({} as CanvasRenderingContext2D, {
      get: (_t, key) =>
        key === 'fillRect'
          ? (x: number) => xs.push(x)
          : key === 'measureText'
            ? () => ({ width: 4 })
            : typeof key === 'string' && /^[a-z]/.test(key) && key !== 'canvas'
              ? () => ({ addColorStop() {} })
              : undefined,
      set: () => true,
    })
    drawMatch(g, s, ROSTER, [], { showBoxes: false, reducedMotion: true })
    if (s.phase === 'ko') ran = Math.max(ran, fleeShift(s.phaseFrame))
  }
  assert.ok(ran >= 240, `she ran off (${ran} px)`)
})

check('the Siblings replay deterministically and keep every invariant', () => {
  for (const [seed, roster] of [
    [71, ROSTER],
    [72, [ZUZU, SIBLINGS] as [FighterData, FighterData]],
    [73, [SIBLINGS, SIBLINGS] as [FighterData, FighterData]],
    [74, [SIBLINGS, ABBESS] as [FighterData, FighterData]],
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
          assert.ok(f.ammo >= 0 && f.ammo <= 3)
        }
      }
      return hashState(s)
    }
    assert.equal(once(), once(), `seed ${seed}`)
  }
})

console.log(`verifyZuzuShowdownSiblings: ${passed} checks passed`)
