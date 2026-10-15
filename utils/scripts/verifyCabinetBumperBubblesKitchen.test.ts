// Bumper Bubbles depth pass, slice 3 (conductor kr-arcade/t-061): Wings 5-7, the Ember Kitchen,
// the Frost Freezer and the Gearworks: hot plates, ice, push blocks, conveyors, lifts and wind-up
// doors; steam grumblers, toast poppers, snow-flingers, skaters, cog crawlers and wind-ups; THE
// KETTLE COLOSSUS on floor 50; and the third Secret Pantry. Each rule is pinned on a staged floor;
// probes show the climb gets through all three wings and that runs still end.
//
//   npx tsx utils/scripts/verifyCabinetBumperBubblesKitchen.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { ARCADE_GAMES } from '../arcade/games'
import { sanitizeSaves, withSave } from '../arcade/saves'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import {
  HOT_PLATE,
  WIND_DOOR,
  WINGS,
  create,
  floorPlan,
} from '../arcade/games/bumperBubbles'
import type {
  Bubble,
  BumperSave,
  Lift,
  PushBlock,
  Robot,
  Treat,
} from '../arcade/games/bumperBubbles'
import { BOSSES, KETTLE, bossHazards } from '../arcade/bumperBubbles/bosses'
import type { Boss } from '../arcade/bumperBubbles/bosses'
import {
  GRUMPS,
  TOAST,
  harmful,
  makeGrump,
  trappable,
  updateGrump,
} from '../arcade/bumperBubbles/grumps'
import type { Grump, GrumpWorld, Hazard } from '../arcade/bumperBubbles/grumps'
import { PANTRIES } from '../arcade/bumperBubbles/pantries'
import type { Effects } from '../arcade/bumperBubbles/specials'
import {
  Cell,
  FLOOR_Y,
  TILE,
  TOP,
  feetOf,
  parseFloor,
  setDoors,
  solid,
  stepBody,
} from '../arcade/bumperBubbles/tower'
import type { Floor } from '../arcade/bumperBubbles/tower'

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
  treats: Treat[]
  hazards: Hazard[]
  effects: Effects
  boss: Boss | null
  blocks: PushBlock[]
  lifts: Lift[]
  doorsOpen: boolean
  cards: Set<number>
  door: boolean
  recipe: { x: number; y: number } | null
  pantry: unknown
  frozen: number
  update(input: InputFrame, players?: InputFrame[]): void
  pilot(r: Robot): InputFrame
  startFloor(n: number): void
  setPhase(p: string): void
  popCluster(b: Bubble, seat: number): void
  hotState(i: number): 'cool' | 'glow' | 'puff'
}

const quiet = { play: () => {} }
/** A state read fresh (an assertion about it shouldn't narrow the next read). */
const stateOf = (x: { state: string }): string => x.state
function game(options: { seed?: number; resume?: unknown } = {}): Inner {
  const g = create({
    rng: mulberry32(options.seed ?? 1),
    sound: quiet,
    demo: false,
    hiScore: 0,
    resume: options.resume,
  }) as unknown as Inner & { menu: unknown }
  // The mode menu opens a fresh game; these tests start on the ground floor.
  g.menu = null
  return g
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
const press = (...buttons: Array<keyof InputFrame['held']>) => {
  const f = emptyInput()
  for (const b of buttons) {
    f.held[b] = true
    f.pressed[b] = true
  }
  return f
}
const hold = (...buttons: Array<keyof InputFrame['held']>) => {
  const f = emptyInput()
  for (const b of buttons) f.held[b] = true
  return f
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
function anchor(g: Inner) {
  const w = makeGrump('waddler', { x: 200, y: 64 }, () => 0.5)
  g.bubbles.push(bubble(220, 40, { held: w, holdLeft: 99_999 }))
}
const run = (g: Inner, ticks: number, input = emptyInput()) => {
  for (let t = 0; t < ticks; t++) g.update(input)
}
const roundTrip = (save: unknown) =>
  sanitizeSaves(
    JSON.parse(JSON.stringify(withSave({}, 'bumper-bubbles', save))),
  )['bumper-bubbles']
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

// --- Wings 5-7 as data ---------------------------------------------------------------------------
{
  assert.ok(WINGS.length >= 7)
  const [kitchen, freezer, gears] = [WINGS[4]!, WINGS[5]!, WINGS[6]!]
  assert.deepEqual(
    [kitchen.name, freezer.name, gears.name],
    ['THE EMBER KITCHEN', 'THE FROST FREEZER', 'THE GEARWORKS'],
  )
  assert.deepEqual(kitchen.grumps, ['grumbler', 'toaster'])
  assert.deepEqual(freezer.grumps, ['flinger', 'skater'])
  assert.deepEqual(gears.grumps, ['cog', 'windup'])
  assert.equal(kitchen.tap, 'fizz')
  assert.equal(freezer.tap, 'frost')
  const kf = kitchen.floors.map(parseFloor)
  const ff = freezer.floors.map(parseFloor)
  const gf = gears.floors.map(parseFloor)
  assert.ok(
    kf.filter((f) => f.hotPlates.length).length >= 7,
    'hot plates through the kitchen',
  )
  assert.ok(
    kf.filter((f) => f.specials.includes('toasty')).length >= 8,
    'Toasty bubbles',
  )
  assert.ok(kf.filter((f) => f.flavour === 'fizz').length >= 2, 'Fizz taps')
  assert.ok(
    ff.filter((f) => f.cells.includes(Cell.Ice)).length >= 8,
    'ice through the freezer',
  )
  assert.ok(ff.filter((f) => f.pushBlocks.length).length >= 3, 'push blocks')
  assert.ok(ff.filter((f) => f.flavour === 'frost').length >= 2, 'Frost taps')
  const belts = (f: Floor) =>
    f.cells.includes(Cell.ConveyorLeft) || f.cells.includes(Cell.ConveyorRight)
  assert.ok(gf.filter(belts).length >= 5, 'conveyors through the gearworks')
  assert.ok(gf.filter((f) => f.lifts.length).length >= 3, 'lifts')
  assert.ok(gf.filter((f) => f.doors.length).length >= 3, 'wind-up doors')
  assert.equal(
    floorPlan(50).def.boss,
    'kettle',
    'THE KETTLE COLOSSUS holds floor 50',
  )
  assert.ok(parseFloor(floorPlan(60).def).door, 'a pantry door on floor 60')
  const third = PANTRIES.find((p) => p.floor === 60)!
  assert.equal(third.card, 'SNOWMELT FIZZ')
  // Grumps spawn under girders only where there is a girder to cling to.
  for (const f of gf)
    for (const s of f.spawns.filter((x) => x.letter === GRUMPS.cog.letter))
      assert.ok(
        solid(f, Math.floor(s.x / TILE), Math.round((s.y - TOP) / TILE) - 2),
        `${f.name}: a cog crawler has a girder over it`,
      )
}

// --- hot plates, ice, conveyors, doors, lifts, push blocks ---------------------------------------
{
  // Hot plates: cool most of the beat, glowing (the tell), then puffing; only the puff scalds.
  const g = staged(41)
  anchor(g)
  const i = g.floor.hotPlates[0]!
  const states = new Set<string>()
  for (let t = 0; t < HOT_PLATE.beat; t++) {
    g.roundTicks = t
    states.add(g.hotState(i))
  }
  assert.deepEqual([...states].sort(), ['cool', 'glow', 'puff'])
  const r = g.robots[0]!
  r.invuln = 0
  r.x = (i % 32) * 8 + 4
  r.y = TOP + Math.floor(i / 32) * 8
  r.onGround = true
  let t0 = 0
  for (; t0 < HOT_PLATE.beat; t0++) {
    g.roundTicks = t0
    if (g.hotState(i) === 'cool') break
  }
  const lives = g.lives
  g.update(emptyInput())
  assert.equal(g.lives, lives, 'a cool plate is safe to stand on')
  for (let t = 0; t < HOT_PLATE.beat && g.lives === lives; t++) {
    r.x = (i % 32) * 8 + 4
    r.y = TOP + Math.floor(i / 32) * 8
    g.update(emptyInput())
  }
  assert.equal(g.lives, lives - 1, 'the puff scalds')
  // Ice: a robot keeps sliding after it lets go.
  const ice = staged(54)
  anchor(ice)
  const rr = ice.robots[0]!
  run(ice, 40, hold('right'))
  const x0 = rr.x
  run(ice, 10)
  assert.ok(rr.x - x0 > 4, 'it slides on')
  const dry = staged(1)
  anchor(dry)
  run(dry, 40, hold('right'))
  const x1 = dry.robots[0]!.x
  run(dry, 10)
  assert.equal(dry.robots[0]!.x, x1, 'where a dry floor stops it dead')
  // Conveyors carry what stands on them.
  const belt = parseFloor(floorPlan(64).def) // Assembly Line: a belt right along row 21.
  const body = { x: 60, y: TOP + 21 * TILE, vx: 0, vy: 0, onGround: true }
  for (let t = 0; t < 30; t++) stepBody(belt, body, 5)
  assert.ok(body.x > 75, 'the belt carries it along')
  // Wind-up doors open and shut on the beat.
  const doorFloor = staged(63)
  anchor(doorFloor)
  const d = doorFloor.floor.doors[0]!
  const dc = d % 32
  const dr = Math.floor(d / 32)
  assert.ok(solid(doorFloor.floor, dc, dr), 'shut')
  doorFloor.roundTicks = WIND_DOOR.open - 1
  doorFloor.update(emptyInput())
  assert.ok(doorFloor.doorsOpen && !solid(doorFloor.floor, dc, dr), 'open')
  doorFloor.roundTicks = WIND_DOOR.beat - 1
  doorFloor.update(emptyInput())
  assert.ok(solid(doorFloor.floor, dc, dr), 'and shut again')
  // A floor's doors are its own game's: another game's copy of the floor is untouched.
  const other = parseFloor(floorPlan(63).def)
  setDoors(doorFloor.floor, true)
  assert.ok(solid(other, dc, dr))
  // Lifts carry a robot up.
  const lift = staged(62)
  anchor(lift)
  const l = lift.lifts[0]!
  const lr = lift.robots[0]!
  lift.roundTicks = 0
  lift.update(emptyInput())
  lr.x = l.x + l.w / 2
  lr.y = l.top - 6
  lr.vy = 0
  lr.onGround = false
  for (let t = 0; t < 20 && !lr.onGround; t++) lift.update(emptyInput())
  assert.ok(lr.onGround, 'standing on the lift')
  const y0 = lr.y
  run(lift, 90)
  assert.ok(lr.y < y0 - 20, 'carried up')
  // Push blocks: a robot can't walk through one; shoved, it slides and bowls grumps over.
  const push = staged(52)
  anchor(push)
  const k = push.blocks.find((b) => b.y > 180)! // The block on the long ice shelf.
  const pr = push.robots[0]!
  pr.x = k.x - 30
  pr.y = k.y
  push.frozen = 9999
  const pins = [40, 70].map((dx) =>
    makeGrump('waddler', { x: k.x + dx, y: k.y }, () => 0.5),
  )
  push.grumps.push(...pins)
  const score0 = push.score
  run(push, 40, hold('right'))
  assert.ok(pr.x < k.x, 'never through it')
  assert.ok(k.sliding || k.x > pins[1]!.x, 'shoved, it slides')
  run(push, 120)
  assert.equal(push.grumps.length, 0, 'bowling every grump in its path')
  // Up the ladder: 1,000 and 2,000 (whether still lying there or already picked up).
  assert.equal(
    push.treats.reduce((n, t) => n + t.value, 0) + push.score - score0,
    3000,
  )
  assert.ok(!k.sliding, 'and stops against the wall')
}

// --- the kitchen, freezer and gearworks grumps ---------------------------------------------------
{
  const f = parseFloor(floorPlan(1).def)
  // Steam grumblers: the red nose, then a scalding puff ahead.
  const hazards: Hazard[] = []
  const grumbler = makeGrump('grumbler', feetOf(15, 25), () => 0.5)
  grumbler.cool = 1
  for (let t = 0; t < 70; t++)
    updateGrump(grumbler, world(f, [{ x: 60, y: FLOOR_Y }], hazards))
  assert.equal(hazards[0]?.kind, 'steam', 'a puff of steam')
  assert.ok(hazards[0]!.x < grumbler.x, 'ahead of it, toward the robot')
  // Toast poppers: hidden in the toaster, up on the beat, back down into the slot.
  const toaster = makeGrump('toaster', feetOf(15, 25), () => 0.5)
  updateGrump(toaster, world(f))
  assert.ok(
    !trappable(toaster) && !harmful(toaster),
    'down in the slot: out of reach',
  )
  let popped = false
  for (let t = 0; t < TOAST.beat + 5 && !popped; t++) {
    updateGrump(toaster, world(f))
    popped = stateOf(toaster) === 'popup'
  }
  assert.ok(
    popped && trappable(toaster) && harmful(toaster),
    'popped up on the beat',
  )
  for (let t = 0; t < 200 && stateOf(toaster) !== 'toast'; t++)
    updateGrump(toaster, world(f))
  assert.equal(stateOf(toaster), 'toast', 'and back into the slot')
  assert.equal(toaster.x, toaster.home.x)
  // Snow-flingers lob snowballs in arcs at the robot.
  const throws: Hazard[] = []
  const flinger = makeGrump('flinger', feetOf(20, 25), () => 0.5)
  flinger.cool = 1
  for (let t = 0; t < 60; t++)
    updateGrump(flinger, world(f, [{ x: 60, y: FLOOR_Y }], throws))
  assert.equal(throws[0]?.kind, 'snowball')
  assert.ok(
    throws[0]!.vx < 0 && (throws[0]!.vy ?? 0) < 0,
    'lobbed up and toward the robot',
  )
  // Skaters are fast and never turn back at an edge.
  assert.ok(
    GRUMPS.skater.speed > GRUMPS.dasher.speed && GRUMPS.skater.edgeTurn === 0,
  )
  // Cog crawlers creep along the underside of a girder, out of reach, then drop.
  const gearFloor = parseFloor(floorPlan(61).def)
  const cogSpawn = gearFloor.spawns.find((s) => s.letter === 'r')!
  const cog = makeGrump('cog', cogSpawn, () => 0.5)
  assert.equal(cog.state, 'cling')
  assert.ok(!trappable(cog), 'bubbles pass beneath it')
  let dropped = false
  for (let t = 0; t < 600 && !dropped; t++) {
    updateGrump(cog, world(gearFloor))
    dropped = stateOf(cog) === 'walk'
  }
  assert.ok(dropped && trappable(cog), 'it drops, and can be trapped')
  // Wind-ups run faster and faster, then stop to rewind.
  const wind = makeGrump('windup', feetOf(15, 25), () => 0.9)
  const speeds: number[] = []
  let rewound = false
  for (let t = 0; t < 400 && !rewound; t++) {
    updateGrump(wind, world(f))
    if (wind.onGround) speeds.push(Math.abs(wind.vx))
    rewound = stateOf(wind) === 'rewind'
  }
  assert.ok(speeds.at(-1)! > speeds[5]! * 2, 'faster the longer it runs')
  assert.ok(rewound, 'then it stops to rewind')
  assert.ok(trappable(wind))
}

// --- THE KETTLE COLOSSUS -------------------------------------------------------------------------
{
  const g = game({ seed: 3 })
  g.startFloor(50)
  g.setPhase('play')
  const boss = g.boss!
  assert.equal(boss.name, 'THE KETTLE COLOSSUS')
  const r = g.robots[0]!
  r.invuln = 99_999
  run(g, 200)
  assert.equal(boss.y, FLOOR_Y - boss.r, 'it squats on the floor')
  // Phase 1: the lid rattles, then steam blasts up where the robot stood.
  let blasted = false
  for (let t = 0; t < 400 && !blasted; t++) {
    g.update(emptyInput())
    blasted = stateOf(boss) === 'blast'
  }
  assert.ok(blasted)
  assert.ok(Math.abs(boss.target - r.x) < 40, 'aimed at the robot')
  const column = bossHazards(boss)[0]!
  assert.ok(column.y1 - column.y0 > 150, 'a column of steam up the room')
  assert.ok(
    g.grumps.some((x) => x.kind === BOSSES.kettle.minion),
    'steam grumblers climb out of it',
  )
  // Its own minions, popped beside it, hurt it.
  const hit = (kind: 'pop') => {
    boss.hurt = 0
    const m = makeGrump('grumbler', { x: 0, y: 0 }, () => 0.5)
    const b = bubble(boss.x + 30, boss.y - 20, { held: m })
    g.bubbles.push(b)
    g.popCluster(b, 0)
    void kind
  }
  hit('pop')
  hit('pop')
  hit('pop')
  assert.equal(boss.phase, 2, 'phase 2: it pours')
  run(g, 200)
  assert.equal(boss.flood, KETTLE.floodHeight, 'a scalding flood')
  assert.ok(
    bossHazards(boss).some((z) => z.y1 >= FLOOR_Y),
    'the flood scalds',
  )
  // A Splash wave into it: in phase 2 a minion's pop no longer hurts.
  const hp = boss.hp
  hit('pop')
  assert.equal(boss.hp, hp, 'pops no longer hurt it')
  const waveHits = () => {
    boss.hurt = 0
    g.effects.waves.push({
      x: boss.x - 40,
      y: FLOOR_Y,
      vx: 0,
      vy: 0,
      onGround: true,
      dir: 1,
      t: 0,
      bounces: 0,
      carried: [],
      trail: [],
    })
    run(g, 20)
  }
  waveHits()
  waveHits()
  waveHits()
  assert.equal(boss.phase, 3, 'phase 3: it spins')
  run(g, 200)
  assert.ok(boss.flood < 5, 'the flood drains')
  let hopped = false
  for (let t = 0; t < 120; t++) {
    g.update(emptyInput())
    if (boss.y < FLOOR_Y - boss.r - 20) hopped = true
  }
  assert.ok(hopped, 'whistling round in great hops')
  // Zap bolts stun it and hurt.
  const zap = () => {
    boss.hurt = 0
    g.effects.bolts.push({ x: boss.x - 30, y: boss.y, dir: 1, t: 0, hits: 0 })
    g.update(emptyInput())
    g.update(emptyInput())
    g.update(emptyInput())
  }
  zap()
  assert.ok(stateOf(boss) === 'stunned', 'stunned')
  const before = g.score
  zap()
  zap()
  assert.equal(boss.state, 'popping')
  run(g, 120)
  assert.ok(g.score >= before + BOSSES.kettle.prize, 'its prize')
  run(g, 10)
  assert.equal(g.phase, 'clear')
  // It bonks on touch, and the steam column bonks.
  const b2 = game({ seed: 4 })
  b2.startFloor(50)
  b2.setPhase('play')
  run(b2, 200)
  const r2 = b2.robots[0]!
  r2.invuln = 0
  const lives = b2.lives
  r2.x = b2.boss!.x
  r2.y = b2.boss!.y + 7
  b2.update(emptyInput())
  assert.equal(b2.lives, lives - 1, 'the Kettle bonks')
  // No hurry on a boss floor: Old Flat Fizz never comes.
  const b3 = game({ seed: 5 })
  b3.startFloor(50)
  b3.setPhase('play')
  b3.robots[0]!.invuln = 99_999
  b3.roundTicks = 1799
  run(b3, 5)
  assert.equal((b3 as unknown as { fizz: unknown }).fizz, null)
}

// --- the third pantry, and saves through the kitchen ---------------------------------------------
{
  const g = game()
  g.startFloor(51)
  g.startFloor(60)
  g.setPhase('play')
  g.grumps = []
  g.bubbles = []
  g.update(emptyInput())
  assert.ok(g.door, 'the third door')
  const r = g.robots[0]!
  r.x = g.floor.door!.x
  r.y = g.floor.door!.y
  g.update(emptyInput())
  run(g, 200)
  assert.equal(g.phase, 'play')
  assert.ok(g.recipe)
  r.x = g.recipe!.x
  r.y = g.recipe!.y
  r.vy = 0
  g.update(emptyInput())
  assert.ok(g.cards.has(60), 'SNOWMELT FIZZ')
  const kept = roundTrip(g.save) as BumperSave
  assert.deepEqual(kept.cards, [60], 'saved the moment it is found')
  assert.equal(kept.wing, 6)
  // Every wing start writes its save; a quit mid-kettle keeps the wing 5 save.
  const k = game({ resume: kept })
  k.update(press('a'))
  assert.equal(k.level, 51)
  k.startFloor(41)
  const at41 = roundTrip(k.save) as BumperSave
  assert.equal(at41.wing, 5)
  assert.deepEqual(at41.cards, [60])
  k.startFloor(50)
  k.setPhase('play')
  run(k, 600)
  assert.deepEqual(roundTrip(k.save), at41, 'a quit mid-boss keeps it')
  k.startFloor(61)
  assert.equal((roundTrip(k.save) as BumperSave).wing, 7)
}

// --- probes --------------------------------------------------------------------------------------
{
  const meta = ARCADE_GAMES.find((m) => m.slug === 'bumper-bubbles')!
  // From the kitchen's first floor, with lives topped up, the pilot climbs out of the Gearworks.
  const g = game({ seed: 3 })
  g.startFloor(41)
  for (let t = 0; t < 60 * 60 * 40 && g.level <= 70; t++) {
    g.lives = Math.max(g.lives, 3)
    g.update(g.pilot(g.robots[0]!))
  }
  assert.ok(g.level > 70, `the pilot climbs wings 5-7 (floor ${g.level})`)
  assert.ok(g.score < meta.maxPlausibleScore)
  // On real lives a run in the freezer still ends.
  const h = game({ seed: 6 })
  h.startFloor(51)
  for (let t = 0; t < 60 * 60 * 40 && !h.over; t++)
    h.update(h.pilot(h.robots[0]!))
  assert.ok(h.over, `a run in the freezer ends (floor ${h.level})`)
}

console.log('bumper bubbles (slice 3): ok')
