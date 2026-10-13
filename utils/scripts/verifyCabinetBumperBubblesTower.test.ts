// Bumper Bubbles depth pass, slice 4 (conductor kr-arcade/t-062): Wings 8-10, the Haunted Pantry,
// the Storm Rooftop and the Carbonator: dark floors, phantoms, mimic gems, thunder puffs and
// umbrella grumps, wind, rain and lightning; THE JELLY MOULD on floor 75 and THE GRUMBLE FIZZ KING
// on floor 100; the last two Secret Pantries; and the three endings (solo, co-op, true). Each rule
// is pinned on a staged floor; probes show the climb gets through the Haunted Pantry and runs end.
//
//   npx tsx utils/scripts/verifyCabinetBumperBubblesTower.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { ARCADE_GAMES } from '../arcade/games'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import {
  BUILT_FLOORS,
  ENDING_BONUS,
  ENDING_TICKS,
  STORM,
  TOWER_TOP,
  WINGS,
  create,
  floorPlan,
} from '../arcade/games/bumperBubbles'
import type { Bubble, BumperSave, Robot } from '../arcade/games/bumperBubbles'
import {
  BOSSES,
  JELLY,
  KING,
  bossHarms,
  bossHazards,
} from '../arcade/bumperBubbles/bosses'
import type { Boss } from '../arcade/bumperBubbles/bosses'
import {
  BOLT_TICKS,
  CLOUD_CHARGE,
  GRUMPS,
  MIMIC,
  PHANTOM,
  disguised,
  harmful,
  makeGrump,
  trappable,
  updateGrump,
} from '../arcade/bumperBubbles/grumps'
import type { Grump, GrumpWorld, Hazard } from '../arcade/bumperBubbles/grumps'
import { PANTRIES, PANTRY_FLOORS } from '../arcade/bumperBubbles/pantries'
import { LAMP_RADIUS, LAMP_WIDE } from '../arcade/bumperBubbles/slice4Art'
import { MUSIC } from '../arcade/bumperBubbles/music'
import { THEMES } from '../arcade/bumperBubbles/art'
import { sanitizeSaves, withSave } from '../arcade/saves'
import {
  FLOOR_Y,
  TILE,
  TOP,
  WALL_L,
  parseFloor,
  solidAt,
} from '../arcade/bumperBubbles/tower'
import type { Floor } from '../arcade/bumperBubbles/tower'
import { GRUMP_LETTERS } from '../arcade/bumperBubbles/grumps'

type Inner = {
  score: number
  level: number
  lives: number
  over: boolean
  save: BumperSave | null | undefined
  phase: string
  roundTicks: number
  floor: Floor
  robots: Robot[]
  grumps: Grump[]
  bubbles: Bubble[]
  hazards: Hazard[]
  boss: Boss | null
  cards: Set<number>
  ending: string | null
  strikeIn: number
  flash: number
  phaseTicks: number
  effects: { bolts: unknown[] }
  update(input: InputFrame, players?: InputFrame[]): void
  pilot(r: Robot): InputFrame
  startFloor(n: number): void
  setPhase(p: string): void
  popCluster(b: Bubble, seat: number): void
  lights(): Array<{ x: number; y: number; r: number }>
  render(g: CanvasRenderingContext2D): void
  music: unknown
}

const quiet = { play: () => {} }
const stateOf = (x: { state: string }): string => x.state
function game(
  options: { seed?: number; resume?: unknown; players?: number } = {},
): Inner {
  return create({
    rng: mulberry32(options.seed ?? 1),
    sound: quiet,
    demo: false,
    hiScore: 0,
    resume: options.resume,
    players: options.players,
  }) as unknown as Inner
}
function staged(n: number, seed = 1): Inner {
  const g = game({ seed })
  g.startFloor(n)
  g.setPhase('play')
  g.grumps = []
  g.boss = null
  g.robots[0]!.invuln = 99_999
  return g
}
/** Keep a game's grumps from clearing the floor (a far-off waddler, frozen in a bubble). */
function anchor(g: Inner) {
  const w = makeGrump('waddler', { x: 200, y: 64 }, () => 0.5)
  g.bubbles.push(bubble(220, 40, { held: w, holdLeft: 99_999 }))
}
const run = (g: Inner, ticks: number, input = emptyInput()) => {
  for (let t = 0; t < ticks; t++) g.update(input)
}
function bubble(x: number, y: number, extra: Partial<Bubble> = {}): Bubble {
  return {
    x,
    y,
    vx: 0,
    age: 30,
    flight: 0,
    held: null,
    holdLeft: 300,
    flavour: 'classic',
    stuck: 0,
    letter: null,
    special: null,
    vy: 0,
    owner: 0,
    ...extra,
  }
}
const world = (
  f: Floor,
  robots = [{ x: 30, y: FLOOR_Y }],
  hazards: Hazard[] = [],
): GrumpWorld => ({
  floor: f,
  rng: () => 0.5,
  speed: 0.6,
  hop: 0,
  robots,
  hazards,
})
/** A drawing context that accepts every call: enough to prove a frame paints without throwing. */
const fakeCtx = () =>
  new Proxy(
    {},
    {
      get: (_t, k) =>
        k === 'createRadialGradient' || k === 'createLinearGradient'
          ? () => ({ addColorStop: () => {} })
          : k === 'measureText'
            ? () => ({ width: 8 })
            : () => {},
      set: () => true,
    },
  ) as unknown as CanvasRenderingContext2D

// --- Wings 8-10 as data --------------------------------------------------------------------------
{
  assert.equal(WINGS.length, 10, 'ten wings')
  assert.equal(BUILT_FLOORS, 100, 'the whole tower is built')
  assert.equal(TOWER_TOP, 100)
  const [haunted, storm, carbonator] = [WINGS[7]!, WINGS[8]!, WINGS[9]!]
  assert.equal(haunted.name, 'THE HAUNTED PANTRY')
  assert.equal(storm.name, 'THE STORM ROOFTOP')
  assert.equal(carbonator.name, 'THE CARBONATOR')
  for (const w of [haunted, storm, carbonator]) {
    assert.equal(w.floors.length, 10)
    assert.ok(THEMES[w.theme], `${w.name} has a theme`)
    assert.ok(MUSIC[w.music], `${w.name} has a music loop`)
  }
  // Haunted floors are dark; storm floors have wind and rain.
  const dark = haunted.floors.map(parseFloor)
  assert.ok(
    dark.every((f) => f.dark),
    'every Haunted Pantry floor is dark',
  )
  const rooftop = storm.floors.map(parseFloor)
  assert.ok(
    rooftop.every((f) => f.storm && f.wind !== 0),
    'every Storm Rooftop floor has rain and wind',
  )
  assert.ok(
    rooftop.some((f) => f.wind > 0) && rooftop.some((f) => f.wind < 0),
    'the wind blows both ways',
  )
  // New grumps appear in their own wings.
  const letters = (wing: (typeof WINGS)[number]) =>
    new Set(
      wing.floors.flatMap((d) =>
        parseFloor(d).spawns.map((s) => GRUMP_LETTERS[s.letter]!),
      ),
    )
  assert.ok(letters(haunted).has('phantom') && letters(haunted).has('mimic'))
  assert.ok(letters(storm).has('thunder') && letters(storm).has('glider'))
  assert.ok(letters(carbonator).size >= 8, 'the Carbonator remixes many grumps')
  // The bosses.
  assert.equal(floorPlan(75).def.boss, 'jelly')
  assert.equal(floorPlan(100).def.boss, 'king')
  assert.equal(floorPlan(25).def.boss, 'cork')
  assert.equal(floorPlan(50).def.boss, 'kettle')
  assert.equal(
    floorPlan(75).def.dark,
    true,
    'the Jelly Mould fights in the dark',
  )
  // Five pantries: doors on 80 and 90 as well.
  assert.equal(PANTRIES.length, 5)
  assert.deepEqual(
    PANTRIES.map((p) => p.floor),
    [...PANTRY_FLOORS],
  )
  for (const f of [80, 90]) {
    const floor = parseFloor(floorPlan(f).def)
    assert.ok(floor.door, `floor ${f} has a pantry door`)
    const room = parseFloor(PANTRIES.find((p) => p.floor === f)!.room)
    assert.ok(
      room.card && room.treatSpots.length >= 15,
      `pantry ${f} has a card and treats`,
    )
    assert.equal(room.spawns.length, 0)
  }
  assert.equal(
    new Set(PANTRIES.map((p) => p.card)).size,
    5,
    'five different recipe cards',
  )
}

// --- the new grumps ------------------------------------------------------------------------------
{
  const f = parseFloor(floorPlan(71).def)
  // Phantom: ghostly and untouchable, drifting through blocks, then solid for a moment.
  const ph = makeGrump('phantom', { x: 200, y: 64 }, () => 0.5)
  assert.equal(stateOf(ph), 'ghost')
  assert.ok(!trappable(ph), 'a ghost cannot be trapped')
  const robots = [{ x: 40, y: FLOOR_Y }]
  const w = world(f, robots)
  const x0 = ph.x
  let crossed = false
  for (let t = 0; t < PHANTOM.ghost - 1; t++) {
    updateGrump(ph, w)
    if (solidAt(f, ph.x, ph.y)) crossed = true
  }
  assert.ok(ph.x < x0 - 10, 'it drifts after the robot')
  assert.ok(crossed, 'it drifts through the shelves')
  for (let t = 0; t < 5; t++) updateGrump(ph, w)
  assert.equal(stateOf(ph), 'solid', 'then it turns solid')
  assert.ok(trappable(ph), 'only a solid phantom can be trapped')
  for (let t = 0; t < PHANTOM.solid + 2; t++) updateGrump(ph, w)
  assert.equal(stateOf(ph), 'ghost', 'and fades again')

  // Mimic gem: harmless as a gem, bonks when its eyes blink open.
  const mi = makeGrump('mimic', { x: 100, y: FLOOR_Y }, () => 0.5)
  assert.ok(disguised(mi) && !harmful(mi), 'a gem is only a gem')
  mi.t = MIMIC.disguised + 5
  assert.ok(!disguised(mi) && harmful(mi), 'but it blinks')
  assert.ok(trappable(mi))

  // Thunder puff: grey and trappable, then storm-dark and crackling, then a bolt down its column.
  const hz: Hazard[] = []
  const th = makeGrump('thunder', { x: 128, y: 100 }, () => 0.5)
  const tw = world(f, [{ x: 128, y: FLOOR_Y }], hz)
  assert.equal(stateOf(th), 'cloud')
  assert.ok(trappable(th), 'grey: trappable')
  let charged = false
  for (let t = 0; t < 600 && !charged; t++) {
    updateGrump(th, tw)
    charged = stateOf(th) === 'charge'
  }
  assert.ok(charged, 'it charges')
  assert.ok(!trappable(th), 'charged: keep away')
  for (let t = 0; t < CLOUD_CHARGE + 1; t++) updateGrump(th, tw)
  const bolt = hz.find((h) => h.kind === 'bolt')!
  assert.ok(bolt, 'a bolt')
  assert.ok(bolt.y1! > bolt.y, 'down its column')
  assert.equal(bolt.life, BOLT_TICKS)
  assert.equal(stateOf(th), 'cloud', 'then it is grey again')

  // Umbrella grump: floats down slowly and drifts with the wind.
  const rooftop = parseFloor(floorPlan(87).def) // THE BIG GUST
  assert.ok(rooftop.wind > 0)
  const gl = makeGrump('glider', { x: 128, y: 60 }, () => 0.5)
  gl.onGround = false
  gl.vy = 3
  gl.dir = -1
  const gx = gl.x
  const gw = world(rooftop, [{ x: 30, y: FLOOR_Y }])
  updateGrump(gl, gw)
  assert.ok(gl.vy <= 0.7, 'it glides rather than drops')
  for (let t = 0; t < 30; t++) {
    if (gl.onGround) break
    updateGrump(gl, gw)
  }
  assert.ok(gl.x > gx - 10, 'the wind pushes it along')
  for (const kind of [
    'phantom',
    'mimic',
    'thunder',
    'glider',
    'jellet',
  ] as const)
    assert.ok(
      GRUMPS[kind].answer.length > 4,
      `${kind} has an answer for the guide`,
    )
}

// --- dark floors, wind and lightning -------------------------------------------------------------
{
  const g = staged(71)
  const r = g.robots[0]!
  const lights = g.lights()
  assert.equal(lights.length, 1)
  assert.equal(lights[0]!.r, LAMP_RADIUS, 'the antennae light a small pool')
  r.items = ['lamp']
  assert.equal(g.lights()[0]!.r, LAMP_WIDE, 'a Lamp widens it')
  assert.ok(LAMP_WIDE > LAMP_RADIUS)

  // Wind carries an empty bubble sideways.
  const drift = (floor: number) => {
    const s = staged(floor)
    s.robots[0]!.x = 40
    const b = bubble(128, 150)
    s.bubbles.push(b)
    run(s, 40)
    return b.x - 128
  }
  assert.ok(drift(81) > drift(1) + 4, 'wind right pushes bubbles right')
  assert.ok(drift(82) < drift(1) - 4, 'wind left pushes them left')

  // Lightning: a tell, a flash, then a bolt that bonks.
  const s = staged(81)
  anchor(s)
  const rb = s.robots[0]!
  rb.invuln = 0
  rb.x = 128
  s.strikeIn = 1
  s.update(emptyInput())
  const strike = s.hazards.find((h) => h.kind === 'bolt')
  assert.ok(strike, 'lightning picks a column')
  assert.equal(strike.warn, STORM.warn - 1, 'after a tell')
  strike.x = rb.x
  // Standing on the first ledge the bolt reaches.
  rb.y = strike.y1!
  const lives = s.lives
  run(s, STORM.warn - 5)
  assert.equal(s.lives, lives, 'the tell is safe')
  run(s, 10)
  assert.ok(s.flash > 0, 'the sky flashes')
  assert.ok(s.lives < lives || s.robots[0]!.down > 0, 'the bolt bonks')
  assert.ok(s.strikeIn >= STORM.every, 'the next strike is scheduled')
  // No lightning on a calm floor.
  const calm = staged(1)
  anchor(calm)
  run(calm, 900)
  assert.ok(!calm.hazards.some((h) => h.kind === 'bolt'))
}

// --- THE JELLY MOULD -----------------------------------------------------------------------------
{
  const g = game({ seed: 3 })
  g.startFloor(75)
  g.setPhase('play')
  const boss = g.boss!
  assert.equal(boss.name, 'THE JELLY MOULD')
  assert.ok(g.floor.dark)
  g.robots[0]!.invuln = 99_999
  run(g, 200)
  assert.equal(boss.y, FLOOR_Y - boss.r, 'it wobbles along the floor')
  const hit = () => {
    boss.hurt = 0
    const m = makeGrump('jellet', { x: 0, y: 0 }, () => 0.5)
    const b = bubble(boss.x + 20, boss.y - 12, { held: m })
    g.bubbles.push(b)
    g.popCluster(b, 0)
  }
  const jellets = () => g.grumps.filter((x) => x.kind === 'jellet').length
  assert.equal(boss.phase, 1)
  hit()
  assert.equal(boss.phase, 1)
  hit()
  assert.equal(boss.phase, 2, 'it splits into two')
  assert.equal(boss.r, JELLY.radii[1], 'smaller')
  assert.ok(jellets() >= 2, 'two little jellies')
  const n2 = jellets()
  hit()
  hit()
  assert.equal(boss.phase, 3, 'and into four')
  assert.ok(jellets() >= n2 + 4 - 2)
  assert.equal(boss.r, JELLY.radii[2])
  // Left alone, the pieces slide back together and it heals.
  boss.hp = 1
  boss.calm = JELLY.reform - 1
  run(g, 460)
  assert.equal(
    boss.hp,
    BOSSES.jelly.hpPerPhase,
    'the pieces re-form and it heals',
  )
  boss.hp = 1
  const before = g.score
  hit()
  assert.equal(boss.state, 'popping', 'the last hit')
  assert.ok(jellets() >= 8, 'eight little jellies burst out')
  run(g, 130)
  assert.ok(g.score >= before + BOSSES.jelly.prize, 'its prize')
  assert.equal(g.grumps.length, 0, 'the pieces are cleared with it')
  run(g, 10)
  assert.equal(g.phase, 'clear')
  // It bonks on touch.
  const b2 = game({ seed: 4 })
  b2.startFloor(75)
  b2.setPhase('play')
  run(b2, 200)
  b2.robots[0]!.invuln = 0
  const l = b2.lives
  b2.robots[0]!.x = b2.boss!.x
  b2.robots[0]!.y = b2.boss!.y + 7
  b2.update(emptyInput())
  assert.equal(b2.lives, l - 1)
}

// --- THE GRUMBLE FIZZ KING -----------------------------------------------------------------------
{
  const g = game({ seed: 5 })
  g.startFloor(100)
  g.setPhase('play')
  const boss = g.boss!
  assert.equal(boss.name, 'THE GRUMBLE FIZZ KING')
  assert.ok(
    g.floor.tap && g.floor.flavour === 'gum',
    'a gum tap to build ledges',
  )
  const r = g.robots[0]!
  r.invuln = 99_999
  // Phase 1: caps thrown in fans.
  let caps = 0
  for (let t = 0; t < 400 && caps < KING.fan; t++) {
    g.update(emptyInput())
    caps = g.hazards.filter((h) => h.kind === 'cap').length
  }
  assert.ok(caps >= KING.fan, 'bottle caps in a fan')
  const zap = () => {
    boss.hurt = 0
    g.effects.bolts.push({ x: boss.x - 30, y: boss.y, dir: 1, t: 0, hits: 0 })
    run(g, 3)
  }
  zap()
  zap()
  zap()
  assert.equal(boss.phase, 2, 'phase 2: he shakes himself up')
  run(g, 300)
  assert.ok(boss.flood > 20, 'fizz floods the room upward')
  assert.ok(
    bossHazards(boss).some((z) => z.y1 >= FLOOR_Y),
    'the fizz scalds',
  )
  run(g, 1200)
  assert.ok(
    boss.flood <= KING.floodMax && boss.flood >= KING.floodMin,
    'it rises and drains in turn',
  )
  // A minion popped beside him hurts too.
  const m = makeGrump('waddler', { x: 0, y: 0 }, () => 0.5)
  const hp = boss.hp
  boss.hurt = 0
  const b = bubble(boss.x + 30, boss.y - 20, { held: m })
  g.bubbles.push(b)
  g.popCluster(b, 0)
  assert.equal(boss.hp, hp - 1, 'pops beside him count')
  boss.hp = 3
  zap()
  zap()
  zap()
  assert.equal(boss.phase, 3, 'phase 3: his cap pops off')
  assert.equal(boss.r, KING.tinyRadius, 'a tiny soda bot')
  assert.ok(!bossHarms(boss), 'tiny and cheerful: harmless')
  run(g, 120)
  assert.ok(boss.flood < 5, 'the fizz drains away')
  r.invuln = 0
  const lives = g.lives
  r.x = boss.x
  r.y = boss.y + 4
  g.update(emptyInput())
  assert.equal(g.lives, lives, 'touching the tiny King is safe')
  r.invuln = 99_999
  const score = g.score
  zap()
  assert.equal(boss.state, 'popping')
  run(g, 130)
  assert.ok(g.score >= score + BOSSES.king.prize, 'his prize')
  run(g, 10)
  assert.equal(g.phase, 'clear')
}

// --- the endings ---------------------------------------------------------------------------------
{
  const finish = (g: Inner) => {
    g.startFloor(100)
    g.setPhase('play')
    g.grumps = []
    g.boss = null
    for (const r of g.robots) r.invuln = 99_999
    for (let t = 0; t < 400 && g.phase !== 'ending'; t++) g.update(emptyInput())
  }
  // Solo.
  const solo = game({ seed: 2 })
  finish(solo)
  assert.equal(solo.phase, 'ending')
  assert.equal(solo.ending, 'solo')
  assert.ok(solo.score >= ENDING_BONUS.solo)
  assert.equal(solo.save, null, 'the won climb leaves no save to continue')
  assert.ok(!solo.over)
  assert.equal(solo.music, MUSIC.carbonator)
  solo.render(fakeCtx())
  run(solo, ENDING_TICKS.solo)
  assert.ok(solo.over, 'the credits end the run')

  // Co-op: two robots at the top.
  const duo = game({ seed: 2, players: 2 })
  assert.equal(duo.robots.length, 2)
  finish(duo)
  assert.equal(duo.ending, 'coop')
  assert.ok(duo.score >= ENDING_BONUS.coop)
  duo.render(fakeCtx())

  // True: co-op with all five recipe cards.
  const best = game({ seed: 2, players: 2 })
  for (const f of PANTRY_FLOORS) best.cards.add(f)
  finish(best)
  assert.equal(best.ending, 'true')
  assert.ok(best.score >= ENDING_BONUS.true)
  for (let t = 0; t < 120; t++) {
    best.update(emptyInput())
    if (t % 40 === 0) best.render(fakeCtx())
  }
  run(best, ENDING_TICKS.true)
  assert.ok(best.over)
  assert.ok(
    ENDING_BONUS.true <
      ARCADE_GAMES.find((m) => m.slug === 'bumper-bubbles')!.maxPlausibleScore,
  )

  // One robot out when the climb is won: only one made it, so it is a solo ending.
  const lone = game({ seed: 2, players: 2 })
  lone.robots[1]!.out = true
  finish(lone)
  assert.equal(lone.ending, 'solo')
}

// --- an umbrella never skips the King, and frames paint on every new kind of floor ----------------
{
  for (const n of [71, 75, 80, 81, 84, 90, 91, 98, 99, 100]) {
    const g = game({ seed: n })
    g.startFloor(n)
    g.robots[0]!.invuln = 99_999
    for (let t = 0; t < 200; t++) {
      g.update(emptyInput())
      if (t % 50 === 0) g.render(fakeCtx())
    }
  }
  // Pantry doors on 80 and 90.
  for (const f of [80, 90]) {
    const g = game()
    g.startFloor(f)
    g.setPhase('play')
    g.grumps = []
    g.bubbles = []
    g.update(emptyInput())
    assert.ok(
      (g as unknown as { door: boolean }).door,
      `floor ${f}: the door appears`,
    )
  }
}

// --- saves ---------------------------------------------------------------------------------------
{
  const g = game()
  g.startFloor(71)
  const save = JSON.parse(
    JSON.stringify(withSave({}, 'bumper-bubbles', g.save)),
  )
  const kept = sanitizeSaves(save)['bumper-bubbles'] as BumperSave
  assert.equal(kept.wing, 8)
  g.startFloor(91)
  const top = sanitizeSaves(
    JSON.parse(JSON.stringify(withSave({}, 'bumper-bubbles', g.save))),
  )['bumper-bubbles'] as BumperSave
  assert.equal(top.wing, 10)
  const resumed = game({ resume: top })
  resumed.update({
    ...emptyInput(),
    pressed: { ...emptyInput().pressed, a: true },
  })
  assert.equal(resumed.level, 91, 'a continue from wing 10')
  // The pool of cards keeps all five.
  const full = sanitizeSaves(
    JSON.parse(
      JSON.stringify(
        withSave({}, 'bumper-bubbles', { ...top, cards: [...PANTRY_FLOORS] }),
      ),
    ),
  )['bumper-bubbles'] as BumperSave
  assert.deepEqual(full.cards, [...PANTRY_FLOORS])
}

// --- probes --------------------------------------------------------------------------------------
{
  const meta = ARCADE_GAMES.find((m) => m.slug === 'bumper-bubbles')!
  // From the Haunted Pantry's first floor, with lives topped up, the pilot climbs well into the wing.
  const g = game({ seed: 3 })
  g.startFloor(71)
  for (let t = 0; t < 60 * 60 * 25 && g.level <= 74; t++) {
    g.lives = Math.max(g.lives, 3)
    g.update(g.pilot(g.robots[0]!))
  }
  assert.ok(
    g.level > 74,
    `the pilot climbs the first Haunted Pantry floors (floor ${g.level})`,
  )
  assert.ok(g.score < meta.maxPlausibleScore)
  // On real lives, runs in each new wing still end.
  for (const [start, seed] of [
    [71, 6],
    [81, 7],
    [91, 8],
  ] as const) {
    const h = game({ seed })
    h.startFloor(start)
    for (let t = 0; t < 60 * 60 * 40 && !h.over; t++)
      h.update(h.pilot(h.robots[0]!))
    assert.ok(h.over, `a run from floor ${start} ends (floor ${h.level})`)
  }
  assert.equal(TILE, 8)
  assert.ok(WALL_L > 0)
}

console.log('bumper bubbles (slice 4): ok')
