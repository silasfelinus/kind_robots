// /utils/scripts/verifyZuzuShowdownCombat.test.ts
//
// Zuzu Showdown (conductor zuzu-showdown t-005): the combat systems on top of
// the core sim. Chains and cancels, the launcher and air combo, damage
// scaling, infinite protection, specials (projectile, invincible uppercut,
// parry, command grab, multi-hit rush, armor, poison, air dive), supers and
// the super flash, meter, red health, counter hits, FIRST ATTACK, REVERSAL,
// the strike/grab/guard READ!, dodge, taunt, the Combo Breaker, Easy Specials,
// the fling flag, and a determinism replay with the whole kit in play.
//
//   npx tsx utils/scripts/verifyZuzuShowdownCombat.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { EASY_DAMAGE_PERCENT, type Dir } from '../zuzuShowdown/motion'
import {
  BREAKER_COST,
  COUNTER_DAMAGE_PERCENT,
  INTRO_FRAMES,
  LAUNCH_POP,
  METER_BAR,
  METER_MAX,
  REGEN_DELAY,
  REGEN_EVERY,
  SCALE_FLOOR,
  TAUNT_METER,
  createMatch,
  hashState,
  scaledDamage,
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

type Script = (frame: number, s: MatchState) => [SimInput, SimInput]

function run(
  s: MatchState,
  frames: number,
  script: Script,
  roster = ROSTER,
  log?: SimEvent[],
): MatchState {
  let state = s
  for (let i = 0; i < frames; i += 1) {
    state = step(state, script(i, state), roster)
    if (log) log.push(...state.events)
  }
  return state
}

function fightAt(gapPx: number, roster = ROSTER): MatchState {
  let s = createMatch(roster)
  s = run(s, INTRO_FRAMES, () => [N, N], roster)
  const half = Math.trunc((gapPx * SUB) / 2)
  s.fighters[0].x = -half
  s.fighters[1].x = gapPx * SUB - half
  return s
}

/** Numpad direction -> stick input for a fighter facing `facing`. */
function stick(dir: Dir, facing: 1 | -1): Partial<SimInput> {
  const forward = facing === 1 ? 'right' : 'left'
  const back = facing === 1 ? 'left' : 'right'
  const out: Partial<SimInput> = {}
  if ([7, 8, 9].includes(dir)) out.up = true
  if ([1, 2, 3].includes(dir)) out.down = true
  if ([3, 6, 9].includes(dir)) out[forward] = true
  if ([1, 4, 7].includes(dir)) out[back] = true
  return out
}

/** Frames of input that perform a motion, the button on the last frame. */
function motion(
  dirs: Dir[],
  button: Partial<SimInput>,
  facing: 1 | -1 = 1,
  each = 2,
): SimInput[] {
  const frames: SimInput[] = []
  dirs.forEach((dir, index) => {
    for (let i = 0; i < each; i += 1) {
      const last = index === dirs.length - 1 && i === each - 1
      frames.push(press({ ...stick(dir, facing), ...(last ? button : {}) }))
    }
  })
  return frames
}

/** Play `p1` then `p2` frame lists (padding with `rest`), for `frames`. */
function play(
  s: MatchState,
  frames: number,
  p1: SimInput[],
  p2: SimInput[] = [],
  log?: SimEvent[],
  rest: [SimInput, SimInput] = [N, N],
  roster = ROSTER,
): MatchState {
  return run(
    s,
    frames,
    (i) => [p1[i] ?? rest[0], p2[i] ?? rest[1]],
    roster,
    log,
  )
}

const hits = (log: SimEvent[]) =>
  log.filter((e): e is Extract<SimEvent, { type: 'hit' }> => e.type === 'hit')

// ---------------------------------------------------------------- scaling

check(
  'damage scaling: full for two hits, then 10% less a hit down to 30%; supers ignore half',
  () => {
    assert.equal(scaledDamage(100, 1, 'normal'), 100)
    assert.equal(scaledDamage(100, 2, 'normal'), 100)
    assert.equal(scaledDamage(100, 3, 'normal'), 90)
    assert.equal(scaledDamage(100, 6, 'special'), 60)
    assert.equal(scaledDamage(100, 50, 'normal'), SCALE_FLOOR)
    assert.equal(scaledDamage(100, 6, 'super'), 80)
    assert.equal(scaledDamage(1, 50, 'normal'), 1, 'never below 1')
  },
)

// ---------------------------------------------------------------- chains

check('a jab chains into a kick on contact: one combo, two hits', () => {
  const log: SimEvent[] = []
  const p1 = [press({ lp: true }), ...Array(6).fill(N), press({ lk: true })]
  const s = play(fightAt(40), 40, p1, [], log)
  assert.deepEqual(
    hits(log).map((h) => [h.move, h.combo]),
    [
      ['stand_lp', 1],
      ['stand_lk', 2],
    ],
  )
  assert.equal(s.fighters[1].health, ROSTER[1].health - 30 - 35)
})

check(
  'chains only go up (heavy never chains back to light) and need contact',
  () => {
    const back: SimEvent[] = []
    play(
      fightAt(40),
      50,
      [press({ hp: true }), ...Array(12).fill(N), press({ lp: true })],
      [],
      back,
    )
    assert.deepEqual(
      hits(back).map((h) => h.move),
      ['stand_hp'],
    )
    // A whiffed jab can't chain: the kick only comes out after the jab ends.
    let s = fightAt(200)
    s = play(s, 6, [
      press({ lp: true }),
      ...Array(4).fill(N),
      press({ lk: true }),
    ])
    assert.equal(s.fighters[0].attack?.id, 'stand_lp')
  },
)

check(
  'the same move twice in one combo trips infinite protection (Breakout)',
  () => {
    const loopy: FighterData = {
      ...PLACEHOLDER_A,
      chains: { ...PLACEHOLDER_A.chains, stand_lp: ['stand_lp', 'stand_lk'] },
    }
    const roster: [FighterData, FighterData] = [loopy, PLACEHOLDER_B]
    const log: SimEvent[] = []
    const p1 = [press({ lp: true }), ...Array(6).fill(N), press({ lp: true })]
    const s = play(fightAt(40, roster), 40, p1, [], log, [N, N], roster)
    assert.equal(hits(log).length, 1)
    assert.ok(log.some((e) => e.type === 'breakout' && e.side === 1))
    assert.equal(s.fighters[1].health, PLACEHOLDER_B.health - 30)
    // A `rapid` move may repeat.
    const rapid: FighterData = {
      ...loopy,
      moves: {
        ...loopy.moves,
        stand_lp: { ...loopy.moves.stand_lp, rapid: true },
      },
    }
    const ok: SimEvent[] = []
    play(
      fightAt(40, [rapid, PLACEHOLDER_B]),
      40,
      p1,
      [],
      ok,
      [N, N],
      [rapid, PLACEHOLDER_B],
    )
    assert.equal(hits(ok).length, 2)
  },
)

// ---------------------------------------------------------------- launcher

check(
  'the launcher pops high; a super jump and an air chain juggle with scaling',
  () => {
    let s = fightAt(44)
    const log: SimEvent[] = []
    s = play(s, 1, [press({ down: true, hk: true })], [], log)
    let launched = false
    const chain: Array<keyof SimInput> = ['lp', 'lk', 'hk', 'hp']
    let next = 0
    for (let i = 0; i < 160; i += 1) {
      const f = s.fighters[0]
      const d = s.fighters[1]
      let input = press({
        down: f.action === 'attack' && f.attack?.id === 'crouch_hk',
      })
      if (d.action === 'airhit' && f.action === 'attack')
        input = press({ up: true })
      if (
        f.action === 'jump' &&
        next < chain.length &&
        d.y > 0 &&
        Math.abs(f.y - d.y) < 50 * SUB
      ) {
        const ready =
          !f.attack ||
          (f.attack.contact && f.attack.frame > f.attack.lastHitFrame + 1)
        if (ready && !f.prev[chain[next]!]) {
          input = press({ [chain[next]!]: true })
          next += 1
        }
      }
      s = step(s, [input, N], ROSTER)
      log.push(...s.events)
      if (
        s.fighters[1].action === 'airhit' &&
        s.fighters[1].vy >= LAUNCH_POP - 2 * SUB
      )
        launched = true
    }
    assert.ok(launched, 'the launcher should pop the defender')
    const combo = hits(log)
    assert.equal(combo[0]?.move, 'crouch_hk')
    assert.ok(combo.length >= 3, `air combo landed ${combo.length} hits`)
    assert.deepEqual(
      combo.map((h) => h.combo),
      combo.map((_, i) => i + 1),
      'one unbroken combo',
    )
    const third = combo[2]!
    const base = ROSTER[0].moves[third.move as 'jump_lk'].damage
    assert.equal(third.damage, scaledDamage(base, 3, 'normal'))
    assert.equal(s.fighters[1].y, 0)
  },
)

// ---------------------------------------------------------------- specials

check('cancel: a heavy punch cancels into a fireball on contact', () => {
  const log: SimEvent[] = []
  const p1 = [
    press({ hp: true }),
    ...Array(9).fill(N),
    ...motion([2, 3, 6], { lp: true }),
  ]
  play(fightAt(44), 60, p1, [], log)
  assert.ok(log.some((e) => e.type === 'special' && e.move === 'fireball'))
  assert.deepEqual(
    hits(log).map((h) => [h.move, h.combo]),
    [
      ['stand_hp', 1],
      ['fireball', 2],
    ],
  )
})

check('fireballs travel, chip on block, one per player, and clash', () => {
  const log: SimEvent[] = []
  let s = play(fightAt(240), 160, motion([2, 3, 6], { lp: true }), [], log, [
    N,
    press({ right: true }),
  ])
  const block = log.find((e) => e.type === 'block')
  assert.deepEqual(block, {
    type: 'block',
    attacker: 0,
    move: 'fireball',
    chip: 8,
  })
  assert.equal(s.fighters[1].health, ROSTER[1].health - 8)
  assert.equal(s.fighters[1].red, 8, 'chip damage is all recoverable')

  // A second fireball can't start while the first is still out.
  s = fightAt(300)
  s = play(s, 20, motion([2, 3, 6], { lp: true }))
  assert.equal(s.projectiles.length, 1)
  const again: SimEvent[] = []
  s = play(s, 10, motion([2, 3, 6], { hp: true }), [], again)
  assert.ok(!again.some((e) => e.type === 'special'))

  // Two fireballs meeting cancel out.
  const clash: SimEvent[] = []
  s = play(
    fightAt(300),
    120,
    motion([2, 3, 6], { lp: true }),
    motion([2, 3, 6], { lp: true }, -1),
    clash,
  )
  assert.ok(clash.some((e) => e.type === 'clash'))
  assert.ok(!clash.some((e) => e.type === 'hit' || e.type === 'block'))
})

check(
  'the uppercut is invincible on startup: it beats a jab, and from blockstun it is a REVERSAL',
  () => {
    const log: SimEvent[] = []
    const p1 = motion([6, 2, 3], { hp: true })
    const p2 = [...Array(p1.length - 2).fill(N), press({ lp: true })]
    play(fightAt(40), 40, p1, p2, log)
    assert.deepEqual(
      hits(log).map((h) => h.move),
      ['rising'],
    )

    // Block a jab, then uppercut on the first free frame.
    // The motion goes in during blockstun; the button on the first free frame.
    const rev: SimEvent[] = []
    let blocked = false
    run(
      fightAt(40),
      60,
      (i, state) => {
        const f = state.fighters[0]
        const p2 = i === 0 ? press({ lp: true }) : N
        if (f.action === 'blockstun') {
          blocked = true
          if (f.stun > 4) return [press({ left: true }), p2]
          if (f.stun > 2) return [press({ right: true }), p2]
          if (f.stun > 1) return [press({ down: true }), p2]
          return [press({ down: true, right: true }), p2]
        }
        if (blocked && f.reversal > 0)
          return [press({ down: true, right: true, lp: true }), p2]
        return [press({ left: !blocked }), p2]
      },
      ROSTER,
      rev,
    )
    assert.ok(rev.some((e) => e.type === 'block'))
    assert.ok(
      rev.some(
        (e) => e.type === 'reversal' && e.side === 0 && e.move === 'rising',
      ),
    )
  },
)

check(
  'a parry catches a strike, answers it, and scores READ! (guard beats strike)',
  () => {
    const log: SimEvent[] = []
    const p2 = motion([2, 1, 4], { lk: true }, -1)
    const p1 = [...Array(p2.length).fill(N), press({ lp: true })]
    const s = play(fightAt(40), 60, p1, p2, log)
    assert.ok(log.some((e) => e.type === 'parry' && e.side === 1))
    assert.ok(
      log.some((e) => e.type === 'read' && e.side === 1 && e.kind === 'guard'),
    )
    assert.equal(s.fighters[0].health, ROSTER[0].health - 100)
    assert.equal(s.fighters[1].health, ROSTER[1].health)
  },
)

check(
  'a command grab ignores a block (READ! grab beats guard) and flings a childGuard fighter',
  () => {
    const circle = motion([6, 3, 2, 1, 4, 7, 8], { lp: true }, 1, 1)
    const log: SimEvent[] = []
    const s = play(
      fightAt(40),
      40,
      circle,
      Array(40).fill(press({ right: true })),
      log,
    )
    assert.ok(
      log.some(
        (e) => e.type === 'throw' && e.attacker === 0 && e.damage === 160,
      ),
    )
    assert.ok(
      log.some((e) => e.type === 'read' && e.side === 0 && e.kind === 'grab'),
    )
    assert.equal(s.fighters[1].health, ROSTER[1].health - 160)
    assert.ok(
      !log.some((e) => e.type === 'fling'),
      'no fling against an ordinary fighter',
    )

    const kids: FighterData = {
      ...PLACEHOLDER_B,
      slug: 'siblings-stand-in',
      childGuard: true,
    }
    const flung: SimEvent[] = []
    play(
      fightAt(40, [PLACEHOLDER_A, kids]),
      40,
      circle,
      [],
      flung,
      [N, N],
      [PLACEHOLDER_A, kids],
    )
    assert.ok(flung.some((e) => e.type === 'fling' && e.move === 'crusher'))
  },
)

check('a multi-hit rush lands all three hits as one combo', () => {
  const log: SimEvent[] = []
  const charge = [
    ...Array(50).fill(press({ down: true, left: true })),
    press({ right: true, lp: true }),
  ]
  play(fightAt(60), 120, charge, [], log)
  const rush = hits(log).filter((h) => h.move === 'rush')
  assert.equal(rush.length, 3)
  assert.deepEqual(
    rush.map((h) => h.combo),
    [1, 2, 3],
  )
})

check('armor soaks one hit and the armored move still lands', () => {
  const log: SimEvent[] = []
  const p1 = motion([2, 5, 2], { lp: true })
  const p2 = [...Array(p1.length + 2).fill(N), press({ lp: true })]
  const s = play(fightAt(44), 60, p1, p2, log)
  assert.ok(log.some((e) => e.type === 'armor' && e.side === 0))
  assert.ok(hits(log).some((h) => h.move === 'bulwark'))
  assert.equal(s.fighters[0].health, ROSTER[0].health - 30)
})

check('poison drains as red health over time and never finishes anyone', () => {
  const log: SimEvent[] = []
  let s = play(fightAt(50), 40, motion([6, 3, 2, 1, 4], { lk: true }), [], log)
  assert.ok(hits(log).some((h) => h.move === 'venom'))
  const after = s.fighters[1].health
  s = run(s, 200, () => [N, N])
  assert.ok(s.fighters[1].health < after, 'poison drains')
  // Nearly dead and poisoned: it bottoms out at 1.
  s.fighters[1].health = 3
  s.fighters[1].red = 0
  s.fighters[1].poison = { left: 300, every: 10 }
  s = run(s, 300, () => [N, N])
  assert.equal(s.fighters[1].health, 1)
  assert.equal(s.phase, 'fight')
})

check('the air dive is an overhead special', () => {
  let s = fightAt(140)
  s = play(s, 1, [press({ up: true, right: true })])
  const log: SimEvent[] = []
  let thrown = false
  for (let i = 0; i < 80; i += 1) {
    const f = s.fighters[0]
    const p1 = N
    if (!thrown && f.action === 'jump' && f.y > 40 * SUB) {
      const seq = motion([2, 3, 6], { lk: true }, 1, 1)
      for (const input of seq) {
        s = step(s, [input, press({ right: true, down: true })], ROSTER)
        log.push(...s.events)
      }
      thrown = true
      continue
    }
    s = step(s, [p1, press({ right: true, down: true })], ROSTER)
    log.push(...s.events)
  }
  assert.ok(log.some((e) => e.type === 'special' && e.move === 'dive'))
  assert.equal(
    hits(log).find((h) => h.move === 'dive')?.move,
    'dive',
    'crouch-blocking can’t stop an overhead',
  )
})

// ---------------------------------------------------------------- meter & supers

check(
  'hits build meter for both sides; a super needs a bar and spends it',
  () => {
    const log: SimEvent[] = []
    let s = play(fightAt(40), 20, [press({ lp: true })], [], log)
    assert.equal(s.fighters[0].meter, 30)
    assert.equal(s.fighters[1].meter, 15)

    // No meter: QCF QCF + P falls back to a special inside the motion (here
    // the 6-2-3 in the middle reads as the uppercut, as in Street Fighter).
    s = fightAt(80)
    const none: SimEvent[] = []
    play(s, 20, motion([2, 3, 6, 2, 3, 6], { lp: true }), [], none)
    assert.ok(!none.some((e) => e.type === 'super'))
    assert.ok(none.some((e) => e.type === 'special'))

    // One bar: the super, its flash freeze, and the bar spent.
    s = fightAt(80)
    s.fighters[0].meter = METER_BAR
    const flash: SimEvent[] = []
    const seq = motion([2, 3, 6, 2, 3, 6], { lp: true })
    s = play(s, seq.length, seq, [], flash)
    assert.deepEqual(
      flash.find((e) => e.type === 'super'),
      {
        type: 'super',
        side: 0,
        move: 'super',
        showdown: false,
      },
    )
    assert.equal(s.fighters[0].meter, 0)
    const frozenAt = JSON.stringify(s.fighters)
    const frozen = run(s, 20, () => [
      press({ right: true }),
      press({ left: true }),
    ])
    assert.equal(
      JSON.stringify(frozen.fighters.map((f) => [f.x, f.y])),
      JSON.stringify(
        JSON.parse(frozenAt).map((f: { x: number; y: number }) => [f.x, f.y]),
      ),
      'nothing moves during the flash',
    )
  },
)

check(
  'the Showdown super needs three bars and HP, and flags the eye strip',
  () => {
    const seq = motion([2, 1, 4, 2, 1, 4], { hp: true })
    let s = fightAt(80)
    s.fighters[0].meter = 2 * METER_BAR
    const short: SimEvent[] = []
    play(s, seq.length, seq, [], short)
    assert.ok(!short.some((e) => e.type === 'super'))
    s = fightAt(80)
    s.fighters[0].meter = METER_MAX
    const full: SimEvent[] = []
    s = play(s, 200, seq, [], full)
    assert.ok(full.some((e) => e.type === 'super' && e.showdown))
    const landed = hits(full).find((h) => h.move === 'showdown')
    assert.equal(landed?.damage, 420)
    assert.equal(s.fighters[0].meter, 0, 'supers build no meter')
  },
)

check('Easy Specials fire with Special + a direction at 80% damage', () => {
  const log: SimEvent[] = []
  let s = fightAt(44)
  s = play(s, 40, [press({ special: true, down: true })], [], log)
  assert.ok(
    log.some((e) => e.type === 'special' && e.move === 'rising' && e.easy),
  )
  const rising = PLACEHOLDER_A.specials.find((sp) => sp.id === 'rising')!
  assert.equal(
    hits(log)[0]?.damage,
    Math.trunc((rising.move.damage * EASY_DAMAGE_PERCENT) / 100),
  )
})

// ---------------------------------------------------------------- triangle & callouts

check(
  'counter hits: hitting an attack’s startup deals 120% and says so',
  () => {
    const log: SimEvent[] = []
    play(
      fightAt(40),
      30,
      [N, N, N, press({ lp: true })],
      [press({ hk: true })],
      log,
    )
    const counter = hits(log).find((h) => h.counter)
    assert.ok(counter, 'the jab should counter the slow kick')
    assert.equal(
      counter.damage,
      Math.trunc((30 * COUNTER_DAMAGE_PERCENT) / 100),
    )
  },
)

check('FIRST ATTACK is called once per round', () => {
  const log: SimEvent[] = []
  play(
    fightAt(40),
    60,
    [press({ lp: true }), ...Array(20).fill(N), press({ lp: true })],
    [],
    log,
  )
  assert.deepEqual(
    log.filter((e) => e.type === 'firstAttack'),
    [{ type: 'firstAttack', side: 0 }],
  )
})

check(
  'a forward dodge rolls through a strike: READ! (guard beats strike)',
  () => {
    const log: SimEvent[] = []
    const s = play(
      fightAt(50),
      40,
      [press({ right: true, dodge: true })],
      [N, N, press({ hk: true })],
      log,
    )
    assert.ok(
      log.some((e) => e.type === 'read' && e.side === 0 && e.kind === 'guard'),
    )
    assert.ok(!hits(log).length)
    assert.ok(
      s.fighters[0].x > s.fighters[1].x,
      'the roll ends on the far side',
    )
  },
)

check('only a dodge’s recovery can be grabbed (grab beats guard)', () => {
  // Grab during the dodge's invulnerability: whiff.
  const early: SimEvent[] = []
  play(
    fightAt(36),
    20,
    [press({ left: true, dodge: true })],
    [N, press({ lp: true, lk: true })],
    early,
  )
  assert.ok(early.some((e) => e.type === 'throwWhiff'))
  // Grab timed for the recovery: it connects and is a READ!.
  // Grab timed for the recovery (the grabber walks in after the sidestep).
  const late: SimEvent[] = []
  let grabbed = false
  run(
    fightAt(36),
    40,
    (i, state) => {
      const f = state.fighters[0]
      const p1 = i === 0 ? press({ left: true, dodge: true }) : N
      if (!grabbed && f.action === 'dodge' && f.frame >= 8) {
        grabbed = true
        return [p1, press({ lp: true, lk: true })]
      }
      return [p1, grabbed ? N : press({ left: true })]
    },
    ROSTER,
    late,
  )
  assert.ok(
    late.some((e) => e.type === 'read' && e.side === 1 && e.kind === 'grab'),
  )
})

check('the taunt builds a little meter and leaves the taunter open', () => {
  const log: SimEvent[] = []
  let s = play(fightAt(40), 2, [press({ dodge: true, hk: true })], [], log)
  assert.ok(log.some((e) => e.type === 'taunt'))
  assert.equal(s.fighters[0].meter, TAUNT_METER)
  s = play(s, 20, [], [press({ lp: true })], log)
  assert.ok(hits(log).some((h) => h.attacker === 1))
})

check('red health regenerates after a pause, up to what was red', () => {
  let s = play(fightAt(40), 20, [press({ hp: true })])
  const hurt = s.fighters[1]
  const lost = ROSTER[1].health - hurt.health
  assert.equal(hurt.red, Math.trunc((70 * 40) / 100))
  s = run(s, REGEN_DELAY + hurt.red * REGEN_EVERY + 30, () => [N, N])
  assert.equal(s.fighters[1].red, 0)
  assert.equal(
    s.fighters[1].health,
    ROSTER[1].health - lost + Math.trunc((70 * 40) / 100),
  )
})

check('the Combo Breaker costs two bars and knocks the attacker off', () => {
  const log: SimEvent[] = []
  let s = fightAt(40)
  s.fighters[1].meter = BREAKER_COST
  const p1 = [press({ lp: true }), ...Array(6).fill(N), press({ lk: true })]
  const p2 = [...Array(14).fill(N), press({ dodge: true, lp: true })]
  s = play(s, 30, p1, p2, log)
  assert.ok(log.some((e) => e.type === 'breaker' && e.side === 1))
  // Two bars spent; what is left is the meter the jab gave the defender.
  assert.equal(s.fighters[1].meter, Math.trunc(30 / 2))
  // Without the meter, the same input does nothing.
  const broke: SimEvent[] = []
  play(fightAt(40), 30, p1, p2, broke)
  assert.ok(!broke.some((e) => e.type === 'breaker'))
})

check('meter carries over between rounds', () => {
  let s = fightAt(40)
  s.fighters[0].meter = 1234
  s.fighters[1].health = 1
  s = play(s, 10, [press({ lp: true })])
  s = run(s, 160, () => [N, N])
  assert.equal(s.round, 2)
  assert.ok(s.fighters[0].meter >= 1234)
})

// ---------------------------------------------------------------- determinism

check(
  'the whole kit replays deterministically and keeps its invariants',
  () => {
    for (const seed of [3, 4, 5, 6]) {
      const runOnce = () => {
        const rand = mulberry32(seed)
        const held: [SimInput, SimInput] = [neutralInput(), neutralInput()]
        let s = createMatch(ROSTER)
        const hashes: string[] = []
        for (let i = 0; i < 4000 && s.phase !== 'over'; i += 1) {
          for (const p of held) {
            for (const button of SIM_BUTTONS)
              if (rand() < 0.1) p[button] = !p[button]
          }
          s = step(s, [{ ...held[0] }, { ...held[1] }], ROSTER)
          for (const f of s.fighters) {
            assert.ok(f.meter >= 0 && f.meter <= METER_MAX)
            assert.ok(f.red >= 0)
          }
          hashes.push(hashState(s))
        }
        return hashes
      }
      assert.deepEqual(runOnce(), runOnce())
    }
  },
)

console.log(`verifyZuzuShowdownCombat: ${passed} checks passed`)
