// /utils/scripts/verifyZuzuShowdownSim.test.ts
//
// Zuzu Showdown (conductor zuzu-showdown t-003): the pure fight simulation.
// Movement, jumping, blocking high and low, hits and hitstop, knockdown and
// wake-up, throws and throw techs, the corner pushback rule, round flow (KO,
// time over, double KO, best of three), and a determinism replay: one seeded
// input log run twice must give the same state hash on every frame.
//
//   npx tsx utils/scripts/verifyZuzuShowdownSim.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import {
  INTRO_FRAMES,
  KNOCKDOWN_FRAMES,
  KO_FRAMES,
  MAX_SEPARATION,
  ROUND_FRAMES,
  STAGE_HALF_WIDTH,
  TECH_WINDOW,
  THROW_STARTUP,
  WAKEUP_FRAMES,
  createMatch,
  hashState,
  hitbox,
  hurtbox,
  pushbox,
  step,
} from '../zuzuShowdown/sim'
import {
  PLACEHOLDER_A,
  PLACEHOLDER_B,
} from '../zuzuShowdown/fighters/placeholders'
import {
  SIM_BUTTONS,
  SUB,
  neutralInput,
  type FighterData,
  type MatchState,
  type SimEvent,
  type SimInput,
} from '../zuzuShowdown/types'

const ROSTER: [FighterData, FighterData] = [PLACEHOLDER_A, PLACEHOLDER_B]
const MIRROR: [FighterData, FighterData] = [PLACEHOLDER_A, PLACEHOLDER_A]
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

type Script = (frame: number) => [SimInput, SimInput]

function run(
  s: MatchState,
  frames: number,
  script: Script,
  roster = ROSTER,
  log?: SimEvent[],
): MatchState {
  let state = s
  for (let i = 0; i < frames; i += 1) {
    state = step(state, script(i), roster)
    if (log) log.push(...state.events)
  }
  return state
}

/** A match past the intro, with the fighters placed `gapPx` apart (centres). */
function fightAt(gapPx: number, roster = ROSTER): MatchState {
  let s = createMatch(roster)
  s = run(s, INTRO_FRAMES, () => [N, N], roster)
  assert.equal(s.phase, 'fight')
  const half = Math.trunc((gapPx * SUB) / 2)
  s.fighters[0].x = -half
  s.fighters[1].x = gapPx * SUB - half
  return s
}

const hold =
  (a: SimInput, b: SimInput = N): Script =>
  () => [a, b]
const neutral: Script = () => [N, N]

/** Press on frame 0, then release. */
const tap =
  (
    a: Partial<SimInput>,
    b: Partial<SimInput> = {},
    holdA: Partial<SimInput> = {},
    holdB: Partial<SimInput> = {},
  ): Script =>
  (i) =>
    i === 0
      ? [press({ ...holdA, ...a }), press({ ...holdB, ...b })]
      : [press(holdA), press(holdB)]

// ---------------------------------------------------------------- setup

check(
  'a match opens on the round 1 intro and starts the fight after it',
  () => {
    const s = createMatch(ROSTER)
    assert.equal(s.phase, 'intro')
    assert.equal(s.round, 1)
    assert.deepEqual(s.events, [{ type: 'roundStart', round: 1 }])
    assert.equal(s.fighters[0].facing, 1)
    assert.equal(s.fighters[1].facing, -1)
    const log: SimEvent[] = []
    const after = run(
      s,
      INTRO_FRAMES,
      hold(press({ lp: true, right: true })),
      ROSTER,
      log,
    )
    assert.equal(after.phase, 'fight')
    assert.deepEqual(log, [{ type: 'fight', round: 1 }])
    // Input during the intro does nothing.
    assert.equal(after.fighters[0].x, s.fighters[0].x)
    assert.equal(after.fighters[0].action, 'idle')
  },
)

check('step is pure: it never mutates the state it was given', () => {
  const s = fightAt(120)
  const before = JSON.stringify(s)
  step(s, [press({ right: true, lp: true }), press({ up: true })], ROSTER)
  assert.equal(JSON.stringify(s), before)
})

// ---------------------------------------------------------------- movement

check('walking forward and back moves at each fighter’s own speed', () => {
  const s = fightAt(200)
  const fwd = run(s, 10, hold(press({ right: true }), press({ right: true })))
  assert.equal(
    fwd.fighters[0].x - s.fighters[0].x,
    10 * PLACEHOLDER_A.walkForward,
  )
  // P2 faces left, so holding right is walking back.
  assert.equal(fwd.fighters[1].x - s.fighters[1].x, 10 * PLACEHOLDER_B.walkBack)
  assert.equal(fwd.fighters[0].action, 'walk')
})

check('fighters can’t walk through each other', () => {
  const s = run(
    fightAt(120),
    120,
    hold(press({ right: true }), press({ left: true })),
  )
  const a = pushbox(s.fighters[0], ROSTER[0])
  const b = pushbox(s.fighters[1], ROSTER[1])
  assert.ok(a.right <= b.left, `pushboxes overlap: ${a.right} > ${b.left}`)
  assert.ok(s.fighters[0].x < s.fighters[1].x)
})

check('stage edges and the one-screen separation hold', () => {
  const s = run(
    fightAt(120),
    600,
    hold(press({ left: true }), press({ right: true })),
  )
  const [a, b] = s.fighters
  assert.ok(b.x - a.x <= MAX_SEPARATION * SUB)
  for (const [f, data] of [
    [a, ROSTER[0]],
    [b, ROSTER[1]],
  ] as const) {
    assert.ok(
      Math.abs(f.x) + (data.pushbox.w * SUB) / 2 <= STAGE_HALF_WIDTH * SUB,
    )
  }
  // Walking one way, then the other, reaches the wall.
  const wall = run(
    fightAt(120),
    900,
    hold(press({ left: true }), press({ left: true })),
  )
  assert.equal(
    wall.fighters[0].x,
    -(STAGE_HALF_WIDTH * SUB - (ROSTER[0].pushbox.w * SUB) / 2),
  )
})

check('holding down crouches and stops walking', () => {
  const s = run(fightAt(200), 5, hold(press({ down: true, right: true })))
  assert.equal(s.fighters[0].action, 'crouch')
  assert.equal(s.fighters[0].vx, 0)
})

check('a jump has pre-jump frames, an arc, and a landing', () => {
  let s = fightAt(300)
  s = run(s, 3, hold(press({ up: true })))
  assert.equal(s.fighters[0].action, 'prejump')
  assert.equal(s.fighters[0].y, 0)
  s = run(s, 2, hold(press({ up: true })))
  assert.equal(s.fighters[0].action, 'jump')
  let peak = 0
  let frames = 0
  while (s.fighters[0].action === 'jump' && frames < 200) {
    s = step(s, [N, N], ROSTER)
    peak = Math.max(peak, s.fighters[0].y)
    frames += 1
  }
  assert.ok(peak > 60 * SUB, `jump too low: ${peak / SUB}px`)
  assert.equal(s.fighters[0].action, 'land')
  assert.equal(s.fighters[0].y, 0)
  s = run(s, 4, neutral)
  assert.equal(s.fighters[0].action, 'idle')
})

check('jumping over the opponent switches sides, and both turn around', () => {
  let s = fightAt(70)
  s = run(s, 1, hold(press({ up: true, right: true })))
  s = run(s, 60, neutral)
  assert.ok(s.fighters[0].x > s.fighters[1].x, 'P1 should land on the far side')
  s = run(s, 5, neutral)
  assert.equal(s.fighters[0].facing, -1)
  assert.equal(s.fighters[1].facing, 1)
})

// ---------------------------------------------------------------- hits

function closeJab(roster = ROSTER) {
  const s = fightAt(50, roster)
  const log: SimEvent[] = []
  const after = run(s, 30, tap({ lp: true }), roster, log)
  return { s, after, log }
}

check('a standing jab hits an idle opponent with hitstop and hitstun', () => {
  const s = fightAt(50)
  // Startup 4: the jab is not live on frames 1-3.
  let t = s
  for (let i = 0; i < 3; i += 1) {
    t = step(t, i === 0 ? [press({ lp: true }), N] : [N, N], ROSTER)
    assert.equal(t.events.length, 0)
  }
  t = step(t, [N, N], ROSTER)
  assert.deepEqual(t.events, [
    { type: 'hit', attacker: 0, move: 'stand_lp', damage: 30 },
  ])
  assert.equal(t.fighters[1].health, ROSTER[1].health - 30)
  assert.equal(t.fighters[1].action, 'hitstun')
  assert.equal(t.hitstop, ROSTER[0].moves.stand_lp.hitstop)
  // During hitstop nothing moves.
  const frozen = step(t, [press({ right: true }), N], ROSTER)
  assert.equal(frozen.fighters[0].x, t.fighters[0].x)
  assert.equal(frozen.hitstop, t.hitstop - 1)
})

check('a move hits once, and the defender slides back', () => {
  const { s, after, log } = closeJab()
  assert.equal(log.filter((e) => e.type === 'hit').length, 1)
  assert.ok(after.fighters[1].x > s.fighters[1].x)
})

check('holding back blocks a mid: no damage, blockstun', () => {
  const s = fightAt(50)
  const log: SimEvent[] = []
  const after = run(
    s,
    30,
    tap({ lp: true }, {}, {}, { right: true }),
    ROSTER,
    log,
  )
  assert.deepEqual(log, [{ type: 'block', attacker: 0, move: 'stand_lp' }])
  assert.equal(after.fighters[1].health, ROSTER[1].health)
})

check('a low must be blocked crouching', () => {
  const standing: SimEvent[] = []
  run(
    fightAt(50),
    30,
    tap({ down: true, lk: true }, {}, { down: true }, { right: true }),
    ROSTER,
    standing,
  )
  assert.equal(standing[0]?.type, 'hit')
  const crouching: SimEvent[] = []
  run(
    fightAt(50),
    30,
    tap(
      { down: true, lk: true },
      {},
      { down: true },
      { right: true, down: true },
    ),
    ROSTER,
    crouching,
  )
  assert.equal(crouching[0]?.type, 'block')
})

function jumpIn(defender: Partial<SimInput>): SimEvent[] {
  let s = fightAt(120)
  s = run(s, 1, hold(press({ up: true, right: true }), press(defender)))
  const log: SimEvent[] = []
  for (let i = 0; i < 60; i += 1) {
    // Press HK on the way down, low enough to reach the defender's head.
    const f = s.fighters[0]
    const attack =
      f.action === 'jump' && f.vy < 0 && f.y < 70 * SUB && !f.airAttackUsed
    s = step(s, [press({ hk: attack }), press(defender)], ROSTER)
    log.push(...s.events)
  }
  return log
}

check(
  'a jump-in is an overhead: crouch-blocking can’t stop it, standing block can',
  () => {
    assert.equal(
      jumpIn({ right: true, down: true }).find(
        (e) => e.type === 'hit' || e.type === 'block',
      )?.type,
      'hit',
    )
    assert.equal(
      jumpIn({ right: true }).find(
        (e) => e.type === 'hit' || e.type === 'block',
      )?.type,
      'block',
    )
  },
)

check('simultaneous jabs trade', () => {
  const log: SimEvent[] = []
  const s = run(fightAt(40), 20, tap({ lp: true }, { lp: true }), ROSTER, log)
  assert.equal(log.filter((e) => e.type === 'hit').length, 2)
  assert.equal(s.fighters[0].health, ROSTER[0].health - 30)
  assert.equal(s.fighters[1].health, ROSTER[1].health - 30)
})

check(
  'a sweep knocks down, and the knockdown and wake-up are invulnerable',
  () => {
    let s = fightAt(60)
    const log: SimEvent[] = []
    s = run(
      s,
      12,
      tap({ down: true, hk: true }, {}, { down: true }),
      ROSTER,
      log,
    )
    assert.equal(log[0]?.type, 'hit')
    assert.equal(s.fighters[1].action, 'knockdown')
    assert.equal(hurtbox(s.fighters[1], ROSTER[1]), null)
    // Swing at the downed fighter the whole time: nothing connects.
    const later: SimEvent[] = []
    s = run(
      s,
      KNOCKDOWN_FRAMES + WAKEUP_FRAMES - 5,
      (i) => [press({ lp: i % 14 === 0 }), N],
      ROSTER,
      later,
    )
    assert.equal(later.filter((e) => e.type === 'hit').length, 0)
    s = run(s, 40, neutral)
    assert.equal(s.fighters[1].action, 'idle')
  },
)

check(
  'a hit in the air pops the defender and knocks them down on landing',
  () => {
    let s = fightAt(40)
    s = run(s, 1, hold(N, press({ up: true })))
    // P2 jumps straight up; P1 anti-airs with crouching HP once P2 is high.
    let hit = false
    for (let i = 0; i < 40 && !hit; i += 1) {
      const high = s.fighters[1].y > 20 * SUB
      s = step(
        s,
        [
          press({ down: true, hp: high && s.fighters[0].action !== 'attack' }),
          N,
        ],
        ROSTER,
      )
      hit = s.events.some((e) => e.type === 'hit')
    }
    assert.ok(hit, 'anti-air should connect')
    assert.equal(s.fighters[1].action, 'airhit')
    s = run(s, 80, neutral)
    assert.ok(['knockdown', 'wakeup', 'idle'].includes(s.fighters[1].action))
    assert.equal(s.fighters[1].y, 0)
  },
)

check('at the wall, pushback moves the attacker instead', () => {
  let s = fightAt(50)
  const limit = STAGE_HALF_WIDTH * SUB - (ROSTER[1].pushbox.w * SUB) / 2
  s.fighters[1].x = limit
  s.fighters[0].x = limit - 50 * SUB
  const attackerBefore = s.fighters[0].x
  s = run(s, 30, tap({ lp: true }))
  assert.equal(s.fighters[1].x, limit)
  assert.ok(
    s.fighters[0].x < attackerBefore,
    'the attacker should be pushed off the cornered defender',
  )
})

// ---------------------------------------------------------------- throws

const THROW = { lp: true, lk: true }

check(
  'a throw grabs a blocking opponent (grab beats guard) after the tech window',
  () => {
    const log: SimEvent[] = []
    let s = run(
      fightAt(36),
      THROW_STARTUP,
      tap(THROW, {}, {}, { right: true }),
      ROSTER,
      log,
    )
    assert.equal(s.fighters[0].action, 'throwHold')
    assert.equal(s.fighters[1].action, 'thrown')
    s = run(s, TECH_WINDOW + 2, hold(N, press({ right: true })), ROSTER, log)
    const thrown = log.find((e) => e.type === 'throw')
    assert.deepEqual(thrown, {
      type: 'throw',
      attacker: 0,
      damage: ROSTER[0].throwDamage,
    })
    assert.equal(s.fighters[1].health, ROSTER[1].health - ROSTER[0].throwDamage)
    assert.equal(s.fighters[1].action, 'knockdown')
  },
)

check('LP+LK inside the window techs the throw: no damage', () => {
  const log: SimEvent[] = []
  let s = run(fightAt(36), THROW_STARTUP, tap(THROW), ROSTER, log)
  assert.equal(s.fighters[1].action, 'thrown')
  s = run(s, 3, (i) => [N, i === 2 ? press(THROW) : N], ROSTER, log)
  assert.ok(log.some((e) => e.type === 'tech'))
  assert.equal(s.fighters[1].health, ROSTER[1].health)
  assert.equal(s.fighters[0].action, 'tech')
})

check('holding back on the grab throws the defender to the other side', () => {
  let s = fightAt(36)
  s = run(s, THROW_STARTUP, tap(THROW, {}, { left: true }))
  s = run(s, TECH_WINDOW + 2, neutral)
  assert.ok(s.fighters[1].x < s.fighters[0].x)
})

check(
  'a back-throw against the wall never leaves the fighters inside each other',
  () => {
    let s = fightAt(36)
    const limit = STAGE_HALF_WIDTH * SUB - (ROSTER[0].pushbox.w * SUB) / 2
    s.fighters[0].x = -limit
    s.fighters[1].x = -limit + 36 * SUB
    s = run(s, THROW_STARTUP, tap(THROW, {}, { left: true }))
    s = run(s, TECH_WINDOW + 2, neutral)
    const a = pushbox(s.fighters[0], ROSTER[0])
    const b = pushbox(s.fighters[1], ROSTER[1])
    assert.ok(Math.min(a.right, b.right) - Math.max(a.left, b.left) <= 0)
    assert.equal(s.fighters[1].health, ROSTER[1].health - ROSTER[0].throwDamage)
  },
)

check('two grabs on the same frame cancel out', () => {
  const log: SimEvent[] = []
  run(fightAt(36), THROW_STARTUP + 1, tap(THROW, THROW), ROSTER, log)
  assert.deepEqual(
    log.filter((e) => e.type === 'tech'),
    [{ type: 'tech', attacker: 0 }],
  )
})

check('a strike stuffs a grab during its startup (strike beats grab)', () => {
  const log: SimEvent[] = []
  const s = run(fightAt(36), 12, tap(THROW, { lp: true }), ROSTER, log)
  assert.equal(
    log.find((e) => e.type === 'hit' || e.type === 'throw')?.type,
    'hit',
  )
  assert.equal(s.fighters[1].health, ROSTER[1].health)
  assert.equal(s.fighters[0].health, ROSTER[0].health - 30)
})

check('a grab out of range whiffs', () => {
  const log: SimEvent[] = []
  const s = run(fightAt(160), THROW_STARTUP + 1, tap(THROW), ROSTER, log)
  assert.deepEqual(log, [{ type: 'throwWhiff', attacker: 0 }])
  assert.equal(s.fighters[0].action, 'throwWhiff')
})

// ---------------------------------------------------------------- rounds

function koWith(s: MatchState, loser: 0 | 1): MatchState {
  s.fighters[loser].health = 1
  const winner = loser === 0 ? 1 : 0
  s.fighters[winner].x = s.fighters[loser].x + (loser === 0 ? 50 : -50) * SUB
  return run(s, 10, (i) => {
    const inputs: [SimInput, SimInput] = [N, N]
    inputs[winner] = press({ lp: i === 0 })
    return inputs
  })
}

check('a KO ends the round, poses both fighters, and starts round 2', () => {
  let s = koWith(fightAt(120), 1)
  assert.equal(s.phase, 'ko')
  assert.deepEqual(s.wins, [1, 0])
  assert.deepEqual(s.results, [0])
  assert.equal(s.fighters[1].action, 'ko')
  const log: SimEvent[] = []
  s = run(s, KO_FRAMES, neutral, ROSTER, log)
  assert.ok(log.some((e) => e.type === 'roundStart' && e.round === 2))
  assert.equal(s.phase, 'intro')
  assert.equal(s.fighters[0].health, ROSTER[0].health)
  assert.equal(s.fighters[1].health, ROSTER[1].health)
  assert.equal(s.timer, ROUND_FRAMES)
})

check('two round wins take the match; then the state stops changing', () => {
  let s = koWith(fightAt(120), 1)
  s = run(s, KO_FRAMES + INTRO_FRAMES, neutral)
  assert.equal(s.round, 2)
  s = koWith(s, 1)
  const log: SimEvent[] = []
  s = run(s, KO_FRAMES, neutral, ROSTER, log)
  assert.equal(s.phase, 'over')
  assert.equal(s.winner, 0)
  assert.deepEqual(
    log.filter((e) => e.type === 'matchOver'),
    [{ type: 'matchOver', winner: 0 }],
  )
  const frozen = run(s, 10, hold(press({ right: true })))
  assert.deepEqual(frozen.fighters, s.fighters)
})

check('time over gives the round to the higher health fraction', () => {
  let s = fightAt(200)
  s.timer = 3
  s.fighters[0].health = 500 // 50% of 1000
  s.fighters[1].health = 600 // 55% of 1100
  const log: SimEvent[] = []
  s = run(s, 3, neutral, ROSTER, log)
  assert.deepEqual(log, [{ type: 'timeOver', result: 1 }])
  assert.deepEqual(s.wins, [0, 1])
})

check('a double KO is a draw round that gives nobody a win', () => {
  let s = fightAt(40)
  s.fighters[0].health = 1
  s.fighters[1].health = 1
  const log: SimEvent[] = []
  s = run(s, 10, tap({ lp: true }, { lp: true }), ROSTER, log)
  assert.ok(log.some((e) => e.type === 'ko' && e.result === 'draw'))
  assert.deepEqual(s.wins, [0, 0])
  assert.equal(s.fighters[0].action, 'ko')
  assert.equal(s.fighters[1].action, 'ko')
})

check('draws can’t loop forever: the match ends after the round cap', () => {
  let s = fightAt(200)
  for (let round = 0; round < 6 && s.phase !== 'over'; round += 1) {
    s.timer = 1
    s = run(s, 1 + KO_FRAMES + INTRO_FRAMES, neutral)
  }
  assert.equal(s.phase, 'over')
  assert.equal(s.winner, 'draw')
})

// ---------------------------------------------------------------- determinism

function randomScript(seed: number): Script {
  const rand = mulberry32(seed)
  const held: [SimInput, SimInput] = [neutralInput(), neutralInput()]
  return () => {
    for (const p of held) {
      for (const button of SIM_BUTTONS) {
        // Hold buttons for a while, as a person would.
        if (rand() < 0.08) p[button] = !p[button]
      }
    }
    return [{ ...held[0] }, { ...held[1] }]
  }
}

function replay(seed: number, frames: number, roster = ROSTER): string[] {
  let s = createMatch(roster)
  const script = randomScript(seed)
  const hashes: string[] = []
  for (let i = 0; i < frames; i += 1) {
    s = step(s, script(i), roster)
    hashes.push(hashState(s))
  }
  return hashes
}

check('the same input log replays to the same hash on every frame', () => {
  for (const seed of [1, 7, 2026]) {
    assert.deepEqual(replay(seed, 2400), replay(seed, 2400))
  }
  assert.notDeepEqual(replay(1, 600), replay(2, 600))
})

check(
  'fuzzed play keeps every invariant (integers, bounds, health, pushboxes)',
  () => {
    const rosters = [
      ROSTER,
      MIRROR,
      [PLACEHOLDER_B, PLACEHOLDER_A] as [FighterData, FighterData],
    ]
    for (let seed = 11; seed < 23; seed += 1) {
      const roster = rosters[seed % rosters.length]!
      let s = createMatch(roster)
      const script = randomScript(seed)
      for (let i = 0; i < 6000 && s.phase !== 'over'; i += 1) {
        s = step(s, script(i), roster)
        const json = JSON.stringify(s)
        assert.ok(!json.includes('null,null') && !/NaN|Infinity/.test(json))
        for (const side of [0, 1] as const) {
          const f = s.fighters[side]
          const data = roster[side]
          for (const n of [f.x, f.y, f.vx, f.vy, f.health, f.push]) {
            assert.ok(Number.isInteger(n), `non-integer state on frame ${i}`)
          }
          assert.ok(f.health >= 0 && f.health <= data.health)
          assert.ok(f.y >= 0)
          assert.ok(Math.abs(f.x) <= STAGE_HALF_WIDTH * SUB)
          const box = hitbox(f, data)
          if (box) assert.ok(box.left < box.right && box.bottom < box.top)
        }
        if (
          s.phase === 'fight' &&
          s.fighters[0].y === 0 &&
          s.fighters[1].y === 0
        ) {
          const a = pushbox(s.fighters[0], roster[0])
          const b = pushbox(s.fighters[1], roster[1])
          const overlap = Math.min(a.right, b.right) - Math.max(a.left, b.left)
          assert.ok(
            overlap <= 0,
            `grounded pushboxes overlap by ${overlap} on frame ${i}`,
          )
        }
      }
    }
  },
)

console.log(`verifyZuzuShowdownSim: ${passed} checks passed`)
