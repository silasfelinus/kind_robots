// /utils/scripts/verifyZuzuShowdownStormCrow.test.ts
//
// Zuzu Showdown (conductor zuzu-showdown t-016): Storm Crow's kit. Every
// special fires from its fighters.yaml input; Take Wing flies him freely for
// three seconds, attacking at any height, until a hit knocks him down; the
// Murder Dive bounces off; Hook and Reel reels the victim in standing and
// loses to a strike; Thunderhead strikes where the opponent stood (HP above
// him); Rifle Crack crosses the screen; the supers.
//
//   npx tsx utils/scripts/verifyZuzuShowdownStormCrow.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { parseNotation, type Dir } from '../zuzuShowdown/motion'
import {
  FLIGHT_CEILING,
  FLIGHT_HOVER,
  INTRO_FRAMES,
  METER_BAR,
  METER_MAX,
  createMatch,
  hashState,
  hitbox,
  moveOf,
  step,
} from '../zuzuShowdown/sim'
import { PLACEHOLDER_B } from '../zuzuShowdown/fighters/placeholders'
import { STORM_CROW } from '../zuzuShowdown/fighters/storm-crow'
import { RIVER_CROC } from '../zuzuShowdown/fighters/river-croc'
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

const ROSTER: [FighterData, FighterData] = [STORM_CROW, PLACEHOLDER_B]
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

/** Into flight: QCB+K, then `frames` more with `hold` held. */
function flying(frames: number, hold: Partial<SimInput> = {}): MatchState {
  const takeOff = motion([2, 1, 4], { lk: true })
  return play(fightAt(200), takeOff.length + frames, [
    ...takeOff,
    ...Array(frames).fill(press(hold)),
  ])
}

// ---------------------------------------------------------------- data

check(
  'every special matches its fighters.yaml input; he joins the roster',
  () => {
    const yaml: Record<string, string> = {
      'murder-dive': 'QCF+K',
      'hook-and-reel': 'QCB+P',
      'take-wing': 'QCB+K',
      thunderhead: 'DP+P',
      'thunderhead-air': 'DP+P',
      'rifle-crack': 'dd+P',
      'wheel-of-wings': 'QCF QCF+K',
      'the-murder': 'QCB QCB+HP',
    }
    assert.deepEqual(
      STORM_CROW.specials.map((s) => s.id).sort(),
      Object.keys(yaml).sort(),
    )
    for (const special of STORM_CROW.specials) {
      const parsed = parseNotation(yaml[special.id]!)
      assert.ok(parsed, special.id)
      assert.equal(parsed.motion, special.motion, special.id)
      assert.equal(parsed.button, special.button, special.id)
    }
    const air = (id: string) =>
      STORM_CROW.specials.find((s) => s.id === id)!.air === true
    assert.ok(air('murder-dive') && air('thunderhead-air'), 'in the air')
    assert.ok(FIGHTERS.includes(STORM_CROW))
    assert.equal(STORM_CROW.health, 950)
  },
)

// ---------------------------------------------------------------- flight

check('Take Wing: he climbs to his hover height and flies freely', () => {
  const hover = flying(60)
  const crow = hover.fighters[0]
  assert.ok(crow.flight > 0, 'in flight')
  assert.equal(crow.action, 'jump')
  assert.ok(
    Math.abs(crow.y - FLIGHT_HOVER * SUB) <= 3 * SUB,
    `holds his height (${crow.y / SUB} px)`,
  )
  // Up climbs to the ceiling and no further; forward flies him forward.
  const climb = flying(120, { up: true, right: true })
  assert.ok(climb.fighters[0].y <= FLIGHT_CEILING * SUB)
  assert.ok(climb.fighters[0].y >= (FLIGHT_CEILING - 4) * SUB, 'at the top')
  assert.ok(climb.fighters[0].x > hover.fighters[0].x, 'flew forward')
})

check('in flight he attacks again and again, at any height', () => {
  const s0 = flying(40)
  let s = s0
  const started: string[] = []
  for (let i = 0; i < 80; i += 1) {
    s = step(s, [press({ lp: i % 20 === 0 }), N], ROSTER)
    const attack = s.fighters[0].attack
    if (attack && attack.frame === 1) started.push(attack.id)
  }
  assert.ok(started.filter((id) => id === 'jump_lp').length >= 3, `${started}`)
  assert.ok(s.fighters[0].flight > 0 && s.fighters[0].y > 0, 'still flying')
})

check('flight lasts three seconds, then he falls and lands', () => {
  const s = flying(185 + 60)
  assert.equal(s.fighters[0].flight, 0)
  assert.equal(s.fighters[0].y, 0, 'landed')
})

check('a hit knocks him out of the sky', () => {
  const s0 = flying(40)
  // The opponent jumps into him with a heavy kick.
  s0.fighters[1].x = s0.fighters[0].x + 30 * SUB
  const log: SimEvent[] = []
  const s = play(
    s0,
    40,
    [],
    [press({ up: true }), ...Array(14).fill(N), press({ hk: true })],
    log,
  )
  assert.ok(
    hits(log).some((h) => h.attacker === 1),
    'he was hit',
  )
  assert.equal(s.fighters[0].flight, 0, 'flight over')
})

// ---------------------------------------------------------------- the kit

check('Murder Dive: a talon dive that bounces him back up on hit', () => {
  // A forward jump, then QCF+K on the way down.
  const p1 = [
    press({ up: true, right: true }),
    ...Array(12).fill(press({ right: true })),
    ...motion([2, 3, 6], { hk: true }, 1),
  ]
  const log: SimEvent[] = []
  let s = fightAt(70)
  let bounced = false
  for (let i = 0; i < 60; i += 1) {
    s = step(s, [p1[i] ?? N, N], ROSTER)
    log.push(...s.events)
    if (
      s.events.some((e) => e.type === 'hit' && e.move === 'murder-dive') &&
      s.fighters[0].vy > 0
    )
      bounced = true
  }
  assert.ok(log.some((e) => e.type === 'special' && e.move === 'murder-dive'))
  assert.ok(
    hits(log).some((h) => h.move === 'murder-dive'),
    'the dive hit',
  )
  assert.ok(bounced, 'he sprang back up')
  const lk = moveOf(STORM_CROW, { id: 'murder-dive', heavy: false }).velocity!
  const hk = moveOf(STORM_CROW, { id: 'murder-dive', heavy: true }).velocity!
  assert.ok(hk.y! < lk.y! && hk.x < lk.x, 'HK dives steeper')
})

check('Hook and Reel: a ranged grab that reels them in, standing', () => {
  const log: SimEvent[] = []
  const s = play(fightAt(110), 40, motion([2, 1, 4], { lp: true }), [], log)
  const grab = log.find((e) => e.type === 'throw')
  assert.ok(grab && grab.type === 'throw' && grab.damage === 80, 'caught')
  const [crow, victim] = s.fighters
  assert.notEqual(victim.action, 'knockdown', 'left standing')
  assert.ok(
    Math.abs(victim.x - crow.x) <= 60 * SUB,
    `reeled in close (${Math.abs(victim.x - crow.x) / SUB} px)`,
  )
})

check('Hook and Reel loses to any strike', () => {
  const log: SimEvent[] = []
  // The opponent jabs during the cast's startup.
  play(
    fightAt(40),
    40,
    motion([2, 1, 4], { lp: true }),
    [...Array(6).fill(N), press({ lp: true })],
    log,
  )
  assert.ok(
    hits(log).some((h) => h.attacker === 1),
    'the jab won',
  )
  assert.ok(!log.some((e) => e.type === 'throw'), 'no reel')
})

check('Thunderhead strikes where the opponent stood when he called it', () => {
  // Far beyond any reach: the bolt comes down on them.
  const log: SimEvent[] = []
  play(fightAt(220), 60, motion([6, 2, 3], { lp: true }), [], log)
  assert.ok(
    hits(log).some((h) => h.move === 'thunderhead'),
    'the bolt hit',
  )
  // They step out of the spot after he calls it: the bolt strikes empty
  // ground, neither hitting nor blocked.
  const missed: SimEvent[] = []
  play(
    fightAt(220),
    60,
    motion([6, 2, 3], { lp: true }),
    Array(60).fill(press({ left: true })),
    missed,
  )
  assert.ok(
    !missed.some(
      (e) =>
        (e.type === 'hit' || e.type === 'block') && e.move === 'thunderhead',
    ),
    'missed',
  )
  // HP is the anti-air: above him, and quicker.
  const hp = moveOf(STORM_CROW, { id: 'thunderhead', heavy: true })
  const lp = moveOf(STORM_CROW, { id: 'thunderhead', heavy: false })
  assert.equal(hp.strikeAt, undefined)
  assert.ok(hp.hitbox.y >= 60 && hp.startup < lp.startup)
  // In flight the bolt comes fast.
  const air = moveOf(STORM_CROW, { id: 'thunderhead-air', heavy: false })
  assert.ok(air.startup < lp.startup)
})

check('the bolt stands at the target, not at him', () => {
  // The target steps toward him, out of the spot the bolt is falling on.
  const toward = press({ left: true })
  let s = play(fightAt(220), 6, motion([6, 2, 3], { lp: true }))
  for (let i = 0; i < 40 && !hitbox(s.fighters[0], STORM_CROW); i += 1)
    s = step(s, [N, toward], ROSTER)
  const box = hitbox(s.fighters[0], STORM_CROW)
  assert.ok(box, 'the bolt is live')
  const target = s.fighters[0].attack!.targetX!
  assert.ok(box.left < target && box.right > target, 'centred on the target')
  assert.ok(box.left > s.fighters[0].x + 100 * SUB, 'far from him')
})

check('Rifle Crack: slow to start, fast across the screen', () => {
  const log: SimEvent[] = []
  play(fightAt(300), 60, motion([2, 5, 2], { lp: true }, 2), [], log)
  assert.ok(log.some((e) => e.type === 'special' && e.move === 'rifle-crack'))
  assert.ok(
    hits(log).some((h) => h.move === 'rifle-crack'),
    'it landed',
  )
  const rifle = moveOf(STORM_CROW, { id: 'rifle-crack', heavy: false })
  assert.ok(rifle.startup >= 20 && rifle.projectile!.speed >= 12 * SUB)
})

// ---------------------------------------------------------------- supers

check('Wheel of Wings: a bar, five hits, 260 in all', () => {
  const s0 = fightAt(50)
  s0.fighters[0].meter = METER_BAR
  const log: SimEvent[] = []
  const s = play(s0, 120, motion([2, 3, 6, 2, 3, 6], { lk: true }), [], log)
  assert.ok(log.some((e) => e.type === 'super' && e.move === 'wheel-of-wings'))
  assert.ok(hits(log).filter((h) => h.move === 'wheel-of-wings').length >= 3)
  assert.ok(s.fighters[0].meter < METER_BAR)
  const wheel = moveOf(STORM_CROW, { id: 'wheel-of-wings', heavy: false })
  assert.equal(wheel.hits! * wheel.damage, 260)
})

check('The Murder: three bars, HP, the Showdown, 420', () => {
  const s0 = fightAt(160)
  s0.fighters[0].meter = METER_MAX
  const log: SimEvent[] = []
  play(s0, 200, motion([2, 1, 4, 2, 1, 4], { hp: true }), [], log)
  const sup = log.find((e) => e.type === 'super' && e.move === 'the-murder')
  assert.ok(sup && sup.type === 'super' && sup.showdown)
  assert.ok(hits(log).filter((h) => h.move === 'the-murder').length >= 3)
  const murder = moveOf(STORM_CROW, { id: 'the-murder', heavy: false })
  assert.equal(murder.hits! * murder.damage, 420)
  assert.equal(murder.meterCost, 3 * METER_BAR)
})

// ---------------------------------------------------------------- fuzz

check('Storm Crow replays deterministically and keeps every invariant', () => {
  for (const [seed, roster] of [
    [81, ROSTER],
    [82, [ZUZU, STORM_CROW] as [FighterData, FighterData]],
    [83, [STORM_CROW, STORM_CROW] as [FighterData, FighterData]],
    [84, [STORM_CROW, RIVER_CROC] as [FighterData, FighterData]],
  ] as const) {
    const once = () => {
      const rand = mulberry32(seed)
      let s = createMatch(roster, seed)
      let flew = false
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
          assert.ok(f.y >= 0 && f.y <= 400 * SUB, 'on the screen')
          assert.ok(f.health >= 0 && f.meter >= 0 && f.meter <= METER_MAX)
          assert.ok(f.flight >= 0 && f.flight <= 180)
          if (f.flight > 0) flew = true
        }
      }
      return `${hashState(s)}:${flew}`
    }
    assert.equal(once(), once(), `seed ${seed}`)
  }
})

console.log(`verifyZuzuShowdownStormCrow: ${passed} checks passed`)
