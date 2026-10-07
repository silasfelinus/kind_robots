// /utils/scripts/verifyZuzuShowdownZuzu.test.ts
//
// Zuzu Showdown (conductor zuzu-showdown t-014): Zuzu's kit. Every special
// fires from its fighters.yaml input; Iai Flash LP is short and HP crosses
// the screen; Falling Leaf HP is invincible where LP is not; the Kasa Toss is
// a boomerang that hits out and back and is caught; Poncho Veil parries;
// Descending Cut is an overhead; Thousand-Mile Step dashes through; Hat to
// the Dead is the Showdown super; a combo route; Easy Specials; and a fuzzed
// replay with the whole kit.
//
//   npx tsx utils/scripts/verifyZuzuShowdownZuzu.test.ts

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
  scaledDamage,
  step,
} from '../zuzuShowdown/sim'
import { PLACEHOLDER_B } from '../zuzuShowdown/fighters/placeholders'
import { ZUZU } from '../zuzuShowdown/fighters/zuzu'
import { FIGHTERS, findFighter } from '../zuzuShowdown/fighters'
import {
  SIM_BUTTONS,
  SUB,
  neutralInput,
  type FighterData,
  type MatchState,
  type SimEvent,
  type SimInput,
} from '../zuzuShowdown/types'

const ROSTER: [FighterData, FighterData] = [ZUZU, PLACEHOLDER_B]
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

function fightAt(gapPx: number, roster = ROSTER): MatchState {
  let s = createMatch(roster)
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
  rest: [SimInput, SimInput] = [N, N],
): MatchState {
  let state = s
  for (let i = 0; i < frames; i += 1) {
    state = step(state, [p1[i] ?? rest[0], p2[i] ?? rest[1]], ROSTER)
    if (log) log.push(...state.events)
  }
  return state
}

const hits = (log: SimEvent[]) =>
  log.filter((e): e is Extract<SimEvent, { type: 'hit' }> => e.type === 'hit')

// ---------------------------------------------------------------- data

check(
  'every special matches its fighters.yaml input and has a unique id',
  () => {
    const yaml: Record<string, string> = {
      'iai-flash': 'QCF+P',
      'falling-leaf': 'DP+P',
      'kasa-toss': 'QCB+P',
      'poncho-veil': 'QCB+K',
      'descending-cut': 'QCF+P in the air',
      'thousand-mile-step': 'QCF QCF+P',
      'hat-to-the-dead': 'QCB QCB+HP',
    }
    assert.deepEqual(
      ZUZU.specials.map((s) => s.id).sort(),
      Object.keys(yaml).sort(),
    )
    for (const special of ZUZU.specials) {
      const parsed = parseNotation(yaml[special.id]!)
      assert.ok(parsed, special.id)
      assert.equal(parsed.motion, special.motion, special.id)
      assert.equal(parsed.button, special.button, special.id)
      assert.equal(parsed.air, special.air ?? false, special.id)
      assert.ok(
        !(special.id in ZUZU.moves),
        `${special.id} collides with a normal`,
      )
    }
    assert.equal(findFighter('zuzu'), ZUZU)
    assert.ok(FIGHTERS.includes(ZUZU))
    assert.equal(ZUZU.hurtStand.h, 72, 'the shortest adult on the roster')
  },
)

// ---------------------------------------------------------------- specials

check(
  'Iai Flash: LP is a short dash, HP crosses much further and knocks down',
  () => {
    const travel = (button: Partial<SimInput>) => {
      const s = play(fightAt(400), 50, motion([2, 3, 6], button))
      return s.fighters[0].x - fightAt(400).fighters[0].x
    }
    const light = travel({ lp: true })
    const heavy = travel({ hp: true })
    assert.ok(
      light > 20 * SUB && light < 60 * SUB,
      `LP travelled ${light / SUB}px`,
    )
    assert.ok(heavy > light * 2, `HP travelled ${heavy / SUB}px`)
    const log: SimEvent[] = []
    const s = play(fightAt(110), 40, motion([2, 3, 6], { hp: true }), [], log)
    assert.ok(hits(log).some((h) => h.move === 'iai-flash'))
    assert.ok(['knockdown', 'wakeup'].includes(s.fighters[1].action))
  },
)

check('Falling Leaf: HP is invincible through a jab, LP is not', () => {
  const duel = (button: Partial<SimInput>) => {
    const log: SimEvent[] = []
    const p1 = motion([6, 2, 3], button)
    const p2 = [...Array(p1.length - 2).fill(N), press({ lp: true })]
    play(fightAt(40), 40, p1, p2, log)
    return hits(log).map((h) => h.attacker)
  }
  assert.deepEqual(duel({ hp: true }), [0])
  assert.ok(duel({ lp: true }).includes(1), 'the LP version can be stuffed')
})

check(
  'Kasa Toss is a boomerang: it hits going out and coming back, then he catches it',
  () => {
    const log: SimEvent[] = []
    const s = play(fightAt(110), 160, motion([2, 1, 4], { lp: true }), [], log)
    const kasa = hits(log).filter((h) => h.move === 'kasa-toss')
    assert.equal(kasa.length, 2, 'out and back')
    assert.equal(s.projectiles.length, 0, 'caught')
    // And he can throw it again once it is back.
    const again: SimEvent[] = []
    play(s, 30, motion([2, 1, 4], { lp: true }), [], again)
    assert.ok(again.some((e) => e.type === 'special' && e.move === 'kasa-toss'))
  },
)

check('Kasa Toss: one hat at a time', () => {
  const s = play(fightAt(300), 20, motion([2, 1, 4], { lp: true }))
  assert.equal(s.projectiles.length, 1)
  const log: SimEvent[] = []
  play(s, 12, motion([2, 1, 4], { hp: true }), [], log)
  assert.ok(!log.some((e) => e.type === 'special'))
})

check(
  'Zuzu is short enough that a tall fighter’s standing jab whiffs over him',
  () => {
    const log: SimEvent[] = []
    play(fightAt(38), 20, [], [press({ lp: true })], log)
    assert.equal(hits(log).length, 0)
    const low: SimEvent[] = []
    play(fightAt(38), 20, [], [press({ down: true, lp: true })], low)
    assert.equal(hits(low).length, 1)
  },
)

check('Poncho Veil parries a strike and answers with one cut', () => {
  const log: SimEvent[] = []
  // A crouching jab: the tall stand-in's standing jab sails over Zuzu's head.
  const p1 = motion([2, 1, 4], { lk: true })
  const p2 = [...Array(p1.length).fill(N), press({ down: true, lp: true })]
  const s = play(fightAt(38), 60, p1, p2, log)
  assert.ok(log.some((e) => e.type === 'parry' && e.side === 0))
  assert.equal(s.fighters[1].health, PLACEHOLDER_B.health - 100)
  assert.equal(s.fighters[0].health, ZUZU.health)
})

check('Descending Cut is an overhead from the air', () => {
  let s = fightAt(80)
  s = play(s, 1, [press({ up: true, right: true })])
  const log: SimEvent[] = []
  const crouchBlock = press({ right: true, down: true })
  let fired = false
  for (let i = 0; i < 80; i += 1) {
    const f = s.fighters[0]
    if (!fired && f.action === 'jump' && f.y > 30 * SUB) {
      for (const input of motion([2, 3, 6], { lp: true }, 1)) {
        s = step(s, [input, crouchBlock], ROSTER)
        log.push(...s.events)
      }
      fired = true
      continue
    }
    s = step(s, [N, crouchBlock], ROSTER)
    log.push(...s.events)
  }
  assert.ok(
    log.some((e) => e.type === 'special' && e.move === 'descending-cut'),
  )
  assert.ok(hits(log).some((h) => h.move === 'descending-cut'))
})

// ---------------------------------------------------------------- supers

check('Thousand-Mile Step costs a bar, dashes through, and lands', () => {
  let s = fightAt(60)
  s.fighters[0].meter = METER_BAR
  const log: SimEvent[] = []
  s = play(s, 120, motion([2, 3, 6, 2, 3, 6], { lp: true }), [], log)
  assert.ok(
    log.some((e) => e.type === 'super' && e.move === 'thousand-mile-step'),
  )
  assert.equal(
    hits(log).find((h) => h.move === 'thousand-mile-step')?.damage,
    280,
  )
  assert.ok(s.fighters[0].x > s.fighters[1].x, 'he ends on the far side')
  assert.equal(s.fighters[0].meter, 0)
})

check('Hat to the Dead: three bars, HP, the Showdown eye strip, 420', () => {
  const s = fightAt(90)
  s.fighters[0].meter = METER_MAX
  const log: SimEvent[] = []
  play(s, 200, motion([2, 1, 4, 2, 1, 4], { hp: true }), [], log)
  assert.ok(
    log.some(
      (e) => e.type === 'super' && e.move === 'hat-to-the-dead' && e.showdown,
    ),
  )
  assert.equal(hits(log).find((h) => h.move === 'hat-to-the-dead')?.damage, 420)
})

// ---------------------------------------------------------------- combos

check('a bread-and-butter route: c.LP > c.LK > s.HP xx Iai Flash HP', () => {
  let s = fightAt(42)
  const log: SimEvent[] = []
  const plan: Array<{
    when: (state: MatchState) => boolean
    input: SimInput[]
  }> = [
    { when: () => true, input: [press({ down: true, lp: true })] },
    {
      // Keep holding down through the hit freeze so the buffered kick is the crouching one.
      when: (st) => st.fighters[0].attack?.contact === true,
      input: [
        press({ down: true, lk: true }),
        ...Array(12).fill(press({ down: true })),
      ],
    },
    {
      when: (st) =>
        st.fighters[0].attack?.id === 'crouch_lk' &&
        st.fighters[0].attack.contact,
      input: [press({ hp: true })],
    },
    {
      when: (st) =>
        st.fighters[0].attack?.id === 'stand_hp' &&
        st.fighters[0].attack.contact,
      input: motion([2, 3, 6], { hp: true }, 1),
    },
  ]
  let stage = 0
  for (let i = 0; i < 120; i += 1) {
    if (stage < plan.length && plan[stage]!.when(s)) {
      for (const input of plan[stage]!.input) {
        s = step(s, [input, N], ROSTER)
        log.push(...s.events)
      }
      stage += 1
      continue
    }
    s = step(s, [N, N], ROSTER)
    log.push(...s.events)
  }
  const combo = hits(log)
  assert.deepEqual(
    combo.map((h) => h.move),
    ['crouch_lp', 'crouch_lk', 'stand_hp', 'iai-flash'],
  )
  assert.deepEqual(
    combo.map((h) => h.combo),
    [1, 2, 3, 4],
  )
  const heavyIai = moveOf(ZUZU, { id: 'iai-flash', heavy: true })
  assert.equal(combo[3]!.damage, scaledDamage(heavyIai.damage, 4, 'special'))
})

check(
  'Easy Specials: Special + down is Falling Leaf, Special + heavy is the Lv1 super',
  () => {
    const log: SimEvent[] = []
    play(fightAt(60), 4, [press({ special: true, down: true })], [], log)
    assert.ok(
      log.some(
        (e) => e.type === 'special' && e.move === 'falling-leaf' && e.easy,
      ),
    )
    const s = fightAt(60)
    s.fighters[0].meter = METER_BAR
    const sup: SimEvent[] = []
    play(s, 4, [press({ special: true, hp: true })], [], sup)
    assert.ok(
      sup.some((e) => e.type === 'super' && e.move === 'thousand-mile-step'),
    )
  },
)

// ---------------------------------------------------------------- fuzz

check('Zuzu replays deterministically and keeps every invariant', () => {
  for (const [seed, roster] of [
    [41, ROSTER],
    [42, [PLACEHOLDER_B, ZUZU] as [FighterData, FighterData]],
    [43, [ZUZU, ZUZU] as [FighterData, FighterData]],
  ] as const) {
    const once = () => {
      const rand = mulberry32(seed)
      const held: [SimInput, SimInput] = [neutralInput(), neutralInput()]
      let s = createMatch(roster)
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
          assert.ok(Number.isInteger(f.x) && Number.isInteger(f.y))
        }
        const [a, b] = s.fighters
        const passing = [a, b].some((f, side) => {
          if (f.action === 'dodge') return true
          const window = f.attack
            ? moveOf(roster[side as 0 | 1], f.attack).passThrough
            : undefined
          return window !== undefined
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
})

console.log(`verifyZuzuShowdownZuzu: ${passed} checks passed`)
