// Bumper Bubbles depth pass, slice 2 (conductor kr-arcade/t-060): special bubbles (Splash, Zap,
// Toasty), the Float, Fizz and Frost taps, the hidden-condition items and umbrellas, Wings 3-4
// (the Lagoon Cellar and the Starlight Observatory) with water channels, low gravity, puddle
// puffers, divers, comet sprites and telescope ticks, THE BIG CORK on floor 25, and the first
// two Secret Pantries. Each rule is pinned on a staged floor; probes show the climb gets past
// the boss and that runs still end.
//
//   npx tsx utils/scripts/verifyCabinetBumperBubblesCellar.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { ARCADE_GAMES } from '../arcade/games'
import { sanitizeSaves, withSave } from '../arcade/saves'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import {
  FLOAT_R,
  TREAT_LADDER,
  WINGS,
  create,
  floorPlan,
} from '../arcade/games/bumperBubbles'
import type {
  Bubble,
  BumperSave,
  Pickup,
  Robot,
  Treat,
} from '../arcade/games/bumperBubbles'
import { CORK } from '../arcade/bumperBubbles/bosses'
import { MUSIC } from '../arcade/bumperBubbles/music'
import type { Boss } from '../arcade/bumperBubbles/bosses'
import {
  BEAM_TICKS,
  GRUMPS,
  harmful,
  makeGrump,
  trappable,
  updateGrump,
} from '../arcade/bumperBubbles/grumps'
import type { Grump, GrumpWorld, Hazard } from '../arcade/bumperBubbles/grumps'
import { ITEMS, ITEM_IDS, ITEM_POWER } from '../arcade/bumperBubbles/items'
import type { ItemId, Stats } from '../arcade/bumperBubbles/items'
import { PANTRIES } from '../arcade/bumperBubbles/pantries'
import type { Effects } from '../arcade/bumperBubbles/specials'
import {
  FLOOR_Y,
  JUMP_V,
  TILE,
  TOP,
  WATER,
  feetOf,
  navOf,
  parseFloor,
  reachableSegments,
  segmentKey,
  stepBody,
  waterAt,
} from '../arcade/bumperBubbles/tower'
import type { Floor } from '../arcade/bumperBubbles/tower'
import { parsedFloor } from '../arcade/bumperBubbles/wings'

type Inner = {
  score: number
  level: number
  lives: number
  over: boolean
  save: BumperSave | null | undefined
  phase: string
  phaseTicks: number
  roundTicks: number
  floor: Floor
  robots: Robot[]
  grumps: Grump[]
  bubbles: Bubble[]
  treats: Treat[]
  hazards: Hazard[]
  effects: Effects
  boss: Boss | null
  pickups: Pickup[]
  stats: Stats
  owed: ItemId[]
  frozen: number
  cards: Set<number>
  door: boolean
  recipe: { x: number; y: number } | null
  pantry: unknown
  lostThisWing: boolean
  offer: BumperSave | null
  music: unknown
  update(input: InputFrame, players?: InputFrame[]): void
  pilot(r: Robot): InputFrame
  startFloor(n: number): void
  setPhase(p: string): void
  popCluster(b: Bubble, seat: number): void
  placePickup(id: ItemId): void
  takePickup(r: Robot, p: Pickup): void
}

const quiet = { play: () => {} }
/** A state read fresh (an assertion about it shouldn't narrow the next read). */
const stateOf = (x: { state: string }): string => x.state
function game(
  options: { seed?: number; resume?: unknown; demo?: boolean } = {},
): Inner {
  return create({
    rng: mulberry32(options.seed ?? 1),
    sound: quiet,
    demo: options.demo ?? false,
    hiScore: 0,
    resume: options.resume,
  }) as unknown as Inner
}
/** Floor n in play, its grumps (and any boss) cleared away, the robot safe. */
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
/** A far-off trapped grump that keeps the floor from clearing while a rule is staged. */
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

// --- Wings 3 and 4 as data -----------------------------------------------------------------------
{
  assert.ok(WINGS.length >= 4)
  const [, , cellar, stars] = WINGS
  assert.equal(cellar!.name, 'THE LAGOON CELLAR')
  assert.equal(stars!.name, 'STARLIGHT OBSERVATORY')
  assert.deepEqual(cellar!.grumps, ['puffer', 'diver'])
  assert.deepEqual(stars!.grumps, ['comet', 'tick'])
  const cf = cellar!.floors.map(parseFloor)
  const sf = stars!.floors.map(parseFloor)
  assert.ok(
    cf.filter((f) => f.water.some((w) => w !== WATER.none)).length >= 7,
    'water in the cellar',
  )
  assert.ok(
    cf.some((f) => f.water.includes(WATER.left)) &&
      cf.some((f) => f.water.includes(WATER.right)),
    'channels both ways',
  )
  assert.ok(
    cf.filter((f) => f.specials.includes('splash')).length >= 8,
    'Splash bubbles drift through the cellar',
  )
  assert.ok(sf.filter((f) => f.gravity < 0.2).length >= 4, 'low-gravity floors')
  assert.ok(sf.filter((f) => f.flavour === 'float').length >= 3, 'Float taps')
  assert.ok(
    sf.filter((f) => f.specials.includes('zap')).length >= 8,
    'Zap bubbles',
  )
  assert.equal(floorPlan(25).def.boss, 'cork', 'THE BIG CORK holds floor 25')
  assert.ok(
    parseFloor(floorPlan(25).def).tap,
    'with a Float tap for its third phase',
  )
  // The pantry doors: floors 20 and 40.
  for (const p of PANTRIES) {
    const f = parseFloor(floorPlan(p.floor).def)
    assert.ok(f.door, `floor ${p.floor} has a pantry door`)
    const room = parseFloor(p.room)
    assert.ok(
      room.card && room.treatSpots.length >= 10,
      `${p.name}: a card and its treats`,
    )
    assert.equal(room.spawns.length, 0)
    const reached = reachableSegments(room)
    assert.equal(
      reached.size,
      navOf(room).segs.length,
      `${p.name}: every shelf reachable`,
    )
  }
  // Every floor of the tower: bubbles pinned under the ceiling gather where a robot can reach.
  for (const wing of WINGS)
    for (const def of wing.floors) {
      const f = parseFloor(def)
      const jump = (JUMP_V * JUMP_V) / (2 * f.gravity)
      const c = Math.floor(f.gather / TILE)
      const reached = reachableSegments(f)
      assert.ok(
        navOf(f).segs.some(
          (s) =>
            reached.has(segmentKey(s)) &&
            c >= s.c0 - 1 &&
            c <= s.c1 + 1 &&
            TOP + s.r * TILE - jump < 60,
        ),
        `${def.name}: the gather point is under a reachable ledge`,
      )
    }
}

// --- water, low gravity --------------------------------------------------------------------------
{
  const canal = parsedFloor(21) // The Canal: a channel flowing right along row 19-20.
  const body = { x: 60, y: TOP + 21 * TILE, vx: 0, vy: 0, onGround: true }
  for (let t = 0; t < 60; t++) stepBody(canal, body, 5)
  assert.ok(body.x > 80, 'a channel carries a wading body along')
  const g = staged(22)
  anchor(g)
  const b = bubble(60, TOP + 20 * TILE)
  g.bubbles.push(b)
  run(g, 30)
  assert.ok(b.x > 80, 'and a bubble rides the flow')
  // Low gravity: higher hops, slower bubbles.
  const moon = parsedFloor(33)
  assert.ok(moon.gravity < 0.2)
  const hop = (f: Floor) => {
    const h = { x: 128, y: FLOOR_Y, vx: 0, vy: JUMP_V, onGround: false }
    let top = h.y
    for (let t = 0; t < 120; t++) {
      stepBody(f, h, 5)
      top = Math.min(top, h.y)
    }
    return FLOOR_Y - top
  }
  assert.ok(hop(moon) > hop(parsedFloor(30)) * 1.4, 'a floaty hop')
  const lo = staged(34)
  anchor(lo)
  const hi = staged(31)
  anchor(hi)
  const a = bubble(128, 150)
  const c = bubble(128, 150)
  lo.bubbles.push(a)
  hi.bubbles.push(c)
  run(lo, 20)
  run(hi, 20)
  assert.ok(150 - a.y < (150 - c.y) * 0.8, 'bubbles drift slower')
}

// --- the cellar and observatory grumps -----------------------------------------------------------
{
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
  // Puddle puffers puff their cheeks (the tell), then spit a jet along the row.
  const f = parsedFloor(0)
  const hazards: Hazard[] = []
  const puffer = makeGrump('puffer', feetOf(15, 25), () => 0.5)
  puffer.cool = 1
  for (let t = 0; t < 3; t++)
    updateGrump(puffer, world(f, [{ x: 40, y: FLOOR_Y }], hazards))
  assert.equal(puffer.state, 'windup', 'cheeks puffed')
  assert.equal(puffer.dir, -1, 'facing the robot on its level')
  for (let t = 0; t < 70; t++)
    updateGrump(puffer, world(f, [{ x: 40, y: FLOOR_Y }], hazards))
  assert.equal(hazards.length, 1)
  assert.equal(hazards[0]!.kind, 'jet')
  assert.ok(hazards[0]!.vx < 0, 'a jet toward the robot')
  // A telescope tick glints, then lights a beam across its row out to the first block.
  const lens = parsedFloor(36) // The Lens Room.
  const beams: Hazard[] = []
  const tick = makeGrump('tick', feetOf(10, 25), () => 0.5)
  tick.cool = 1
  tick.dir = 1
  updateGrump(tick, world(lens, [], beams))
  assert.equal(tick.state, 'windup')
  for (let t = 0; t < 60; t++) updateGrump(tick, world(lens, [], beams))
  assert.equal(beams.length, 1)
  assert.ok(
    beams[0]!.x1 > tick.x + 40 && beams[0]!.life === BEAM_TICKS,
    'a beam across the row',
  )
  // In play: a jet and a beam both bonk.
  for (const kind of ['jet', 'beam'] as const) {
    const g = staged(21)
    anchor(g)
    const r = g.robots[0]!
    r.invuln = 0
    g.hazards.push(
      kind === 'jet'
        ? { kind, x: r.x + 4, y: r.y - 7, vx: -2, life: 50, x0: 0, x1: 0 }
        : { kind, x: 0, y: r.y - 7, vx: 0, life: 20, x0: 16, x1: 240 },
    )
    const lives = g.lives
    g.update(emptyInput())
    assert.equal(g.lives, lives - 1, `a ${kind} bonks`)
  }
  // Divers swim out of reach, then leap clear and can be trapped.
  const deep = parsedFloor(29)
  const diver = makeGrump('diver', feetOf(10, 24), () => 0.5)
  assert.equal(diver.state, 'swim')
  assert.ok(waterAt(deep, diver.x, diver.y - 4) !== WATER.none)
  assert.ok(
    !trappable(diver) && !harmful(diver),
    'under water: out of reach, and harmless',
  )
  let leapt = false
  for (let t = 0; t < 400 && !leapt; t++) {
    updateGrump(diver, world(deep))
    leapt = stateOf(diver) === 'leap'
  }
  assert.ok(leapt && trappable(diver) && harmful(diver), 'it leaps clear')
  // Comets streak along their lane, turn at walls, and drift back to it when freed elsewhere.
  const comet = makeGrump('comet', { x: 128, y: 120 }, () => 0.9)
  const lane = comet.y
  for (let t = 0; t < 300; t++) updateGrump(comet, world(f))
  assert.equal(comet.y, lane)
  comet.y = lane - 60
  for (let t = 0; t < 200; t++) updateGrump(comet, world(f))
  assert.ok(Math.abs(comet.y - lane) < 2, 'back to its lane')
  assert.ok(GRUMPS.comet.speed > GRUMPS.dasher.speed, 'the fastest grump')
}

// --- special bubbles -----------------------------------------------------------------------------
{
  // Splash: a wave runs off along the platform, sweeping grumps up and washing them off as treats.
  const g = staged(1)
  anchor(g)
  const r = g.robots[0]!
  r.x = 40
  for (let i = 0; i < 3; i++)
    g.grumps.push(
      makeGrump('waddler', { x: 100 + i * 30, y: FLOOR_Y }, () => 0.9),
    )
  for (const gr of g.grumps) gr.state = 'walk'
  const splash = bubble(60, FLOOR_Y - 12, { special: 'splash' })
  g.bubbles.push(splash)
  g.popCluster(splash, 0)
  assert.equal(g.effects.waves.length, 1)
  run(g, 400)
  assert.equal(g.grumps.length, 0, 'the wave sweeps them all up')
  assert.deepEqual(
    g.treats.map((t) => t.value).sort((a, b) => a - b),
    [1000, 2000, 4000],
    'and they come out up the ladder',
  )
  // Zap: a bolt along the row zaps every grump in it, and counts toward the Lucky Star.
  const z = staged(1)
  anchor(z)
  z.grumps.push(makeGrump('dasher', { x: 160, y: FLOOR_Y }, () => 0.9))
  z.grumps.push(makeGrump('dasher', { x: 200, y: FLOOR_Y }, () => 0.9))
  z.grumps.push(makeGrump('dasher', { x: 200, y: 64 }, () => 0.9))
  const zap = bubble(100, FLOOR_Y - 6, { special: 'zap' })
  z.bubbles.push(zap)
  z.robots[0]!.x = 80
  z.popCluster(zap, 0)
  run(z, 60)
  assert.equal(z.grumps.length, 1, 'the bolt takes its row and only its row')
  assert.equal(z.stats.zaps, 1)
  // Toasty: flames drop to the platform below and run along it both ways.
  const t = staged(1)
  anchor(t)
  t.grumps.push(makeGrump('waddler', { x: 40, y: FLOOR_Y }, () => 0.9))
  t.grumps.push(makeGrump('waddler', { x: 220, y: FLOOR_Y }, () => 0.9))
  for (const gr of t.grumps) gr.dir = 1
  t.frozen = 9999
  run(t, 30)
  const pepper = bubble(128, 200, { special: 'toasty' })
  t.bubbles.push(pepper)
  t.popCluster(pepper, 0)
  assert.equal(t.effects.fires[0]!.y, FLOOR_Y, 'the flames drop to the floor')
  run(t, 200, emptyInput())
  assert.equal(t.grumps.length, 0, 'and burn along it both ways')
  assert.ok(t.robots[0]!.down === 0, 'robots are never toasted')
  // Specials drift in from the walls on their floors.
  const d = staged(21)
  anchor(d)
  let seen = false
  for (let i = 0; i < 900 && !seen; i++) {
    d.update(emptyInput())
    seen = d.bubbles.some((b) => b.special === 'splash')
  }
  assert.ok(seen, 'Splash bubbles drift into the cellar')
}

// --- the Fizz Taps -------------------------------------------------------------------------------
{
  // Float: big slow bubbles you stand on and ride up, like an elevator.
  const g = staged(32)
  anchor(g)
  const r = g.robots[0]!
  r.flavour = 'float'
  r.face = 1
  r.cooldown = 0
  g.update(press('a'))
  const lift = g.bubbles.find((b) => b.flavour === 'float')!
  assert.ok(lift, 'a Float bubble')
  run(g, 20)
  r.x = lift.x
  r.y = lift.y - FLOAT_R - 6
  r.vy = 0
  r.onGround = false
  for (let t = 0; t < 40 && !r.onGround; t++) g.update(emptyInput())
  assert.ok(
    r.onGround && r.on === lift && g.bubbles.includes(lift),
    'stood on, not popped',
  )
  const y0 = r.y
  run(g, 60)
  assert.ok(r.y < y0 - 8, 'and it carries the robot up')
  // Fizz: a rocket straight up that bursts at the ceiling, trapping what is beneath it.
  const fz = staged(1)
  anchor(fz)
  const fr = fz.robots[0]!
  fr.flavour = 'fizz'
  fr.x = 130
  fr.y = TOP + 16 * TILE // On the middle platform, under the top one.
  fr.cooldown = 0
  const under = makeGrump('waddler', { x: 146, y: fr.y }, () => 0.5)
  const beside = makeGrump('waddler', { x: 60, y: FLOOR_Y }, () => 0.5)
  fz.grumps.push(under, beside)
  fz.frozen = 9999
  fz.update(press('a'))
  const rocket = fz.bubbles.find((b) => b.flavour === 'fizz' && !b.held)!
  assert.ok(rocket.vy < 0, 'it rockets up')
  run(fz, 60)
  assert.ok(
    fz.bubbles.some((b) => b.held === under),
    'the shower traps the grump beneath',
  )
  assert.ok(fz.grumps.includes(beside), 'and nothing off to the side')
  // Frost: a trapped grump freezes into a block that bowls along the floor.
  const fr2 = staged(1)
  anchor(fr2)
  const robot = fr2.robots[0]!
  robot.flavour = 'frost'
  robot.x = 40
  robot.face = 1
  robot.cooldown = 0
  const first = makeGrump('waddler', { x: 62, y: FLOOR_Y }, () => 0.5)
  const pins = [120, 150, 180].map((x) =>
    makeGrump('waddler', { x, y: FLOOR_Y }, () => 0.5),
  )
  for (const p of [first, ...pins]) {
    p.dir = -1
    p.vx = 0
  }
  fr2.grumps.push(first, ...pins)
  fr2.frozen = 9999
  fr2.update(press('a'))
  run(fr2, 4)
  assert.equal(fr2.effects.ice.length, 1, 'frozen solid')
  run(fr2, 240)
  assert.equal(fr2.grumps.length, 0, 'the block bowls every grump in its path')
  assert.deepEqual(
    fr2.treats.map((t) => t.value).sort((a, b) => a - b),
    [1000, 2000, 4000, 8000],
    'a bowling chain up the ladder',
  )
}

// --- hidden-condition items ----------------------------------------------------------------------
{
  // Each item waits behind its counter.
  for (const id of ITEM_IDS) {
    const g = staged(2)
    anchor(g)
    g.stats[ITEMS[id].stat] = ITEMS[id].count
    g.update(emptyInput())
    assert.ok(
      g.pickups.some((p) => p.id === id),
      `${id} appears when its condition is met`,
    )
    assert.equal(g.stats[ITEMS[id].stat], 0, `${id}: its counter starts again`)
    // And it waits on the next floor if nobody picks it up.
    g.startFloor(3)
    assert.ok(
      g.pickups.some((p) => p.id === id),
      `${id} waits on the next floor`,
    )
  }
  // The counters count.
  const c = staged(1)
  anchor(c)
  const r = c.robots[0]!
  run(c, 30, press('right'))
  assert.ok(c.stats.walked > 3)
  r.onGround = true
  r.vy = 0
  c.update(press('up'))
  assert.equal(c.stats.hops, 1)
  // Their effects.
  const get = (g: Inner, id: ItemId) => {
    g.placePickup(id)
    const p = g.pickups.find((x) => x.id === id)!
    g.takePickup(g.robots[0]!, p)
  }
  const shod = staged(1)
  anchor(shod)
  const plain = staged(1)
  anchor(plain)
  get(shod, 'shoes')
  const x0 = shod.robots[0]!.x
  run(shod, 30, press('right'))
  run(plain, 30, press('right'))
  assert.ok(
    shod.robots[0]!.x - x0 > (plain.robots[0]!.x - x0) * 1.25,
    'speed shoes',
  )
  const sweet = staged(1)
  anchor(sweet)
  get(sweet, 'sugar')
  get(sweet, 'chew')
  sweet.robots[0]!.cooldown = 0
  sweet.update(press('a'))
  const shot = sweet.bubbles.find((b) => b.flight > 0)!
  assert.ok(
    Math.abs(shot.vx) > 4 && shot.flight > 30,
    'sugar cube and bubble gum: faster, further',
  )
  const neck = staged(1)
  anchor(neck)
  get(neck, 'necklace')
  const s0 = neck.score
  neck.robots[0]!.onGround = true
  neck.update(press('up'))
  assert.equal(
    neck.score,
    s0 + ITEM_POWER.necklace,
    'the necklace pays for every hop',
  )
  const clock = staged(1)
  anchor(clock)
  const w = makeGrump('dasher', { x: 200, y: FLOOR_Y }, () => 0.9)
  w.state = 'walk'
  clock.grumps.push(w)
  get(clock, 'clock')
  const wx = w.x
  run(clock, 60)
  assert.equal(w.x, wx, 'the clock freezes every grump')
  const party = staged(1)
  anchor(party)
  get(party, 'party')
  assert.ok(
    party.treats.length >= 14,
    'the party popper fills the floor with treats',
  )
  const star = staged(1)
  anchor(star)
  get(star, 'star')
  assert.equal(
    star.effects.bolts.length,
    ITEM_POWER.starBolts,
    'a rain of bolts',
  )
  // Kept items are lost with the robot.
  const lost = staged(1)
  anchor(lost)
  get(lost, 'lamp')
  get(lost, 'map')
  assert.deepEqual(lost.robots[0]!.items, ['lamp', 'map'])
  lost.robots[0]!.invuln = 0
  lost.grumps.push(
    makeGrump(
      'dasher',
      { x: lost.robots[0]!.x, y: lost.robots[0]!.y },
      () => 0.5,
    ),
  )
  lost.update(emptyInput())
  assert.deepEqual(lost.robots[0]!.items, [], 'gone with the robot')
  // Umbrellas skip three, five or seven floors, but never past a boss.
  const brolly = staged(10)
  anchor(brolly)
  brolly.placePickup('umbrella')
  const u = brolly.pickups.find((p) => p.id === 'umbrella')!
  u.skip = 7
  brolly.takePickup(brolly.robots[0]!, u)
  assert.equal(brolly.level, 17, 'up seven floors')
  const nearBoss = staged(21)
  anchor(nearBoss)
  nearBoss.placePickup('umbrella')
  const u2 = nearBoss.pickups.find((p) => p.id === 'umbrella')!
  u2.skip = 7
  nearBoss.takePickup(nearBoss.robots[0]!, u2)
  assert.equal(nearBoss.level, 25, 'but it stops at the boss')
}

// --- THE BIG CORK --------------------------------------------------------------------------------
{
  const g = game({ seed: 3 })
  g.startFloor(25)
  g.setPhase('play')
  const boss = g.boss!
  assert.ok(boss, 'the Big Cork')
  assert.equal(g.grumps.length, 0, 'no script: the boss spits its own')
  assert.equal(g.music, MUSIC.boss, 'the boss theme plays')
  const r = g.robots[0]!
  r.invuln = 99_999
  run(g, 400)
  assert.ok(
    g.grumps.some((x) => x.kind === 'corklet'),
    'it spits little corks',
  )
  assert.ok(boss.state === 'bounce')
  // Bubbles can't hold it: a shot through it traps nothing.
  const through = bubble(boss.x, boss.y, { flight: 10 })
  g.bubbles.push(through)
  g.update(emptyInput())
  assert.equal(through.held, null)
  // A cork bubble that floats into it knocks a chunk off.
  const hit = () => {
    boss.hurt = 0
    const cork = makeGrump('corklet', { x: 0, y: 0 }, () => 0.5)
    g.bubbles.push(bubble(boss.x, boss.y + boss.r + 4, { held: cork }))
    g.update(emptyInput())
  }
  hit()
  assert.equal(boss.hp, CORK.hpPerPhase - 1)
  hit()
  hit()
  assert.equal(boss.phase, 2, 'phase 2: it wedges in')
  // It climbs to the ceiling over the robot, creaks, and slams down onto the platform.
  let creaked = false
  let slammed = false
  for (let t = 0; t < 600 && !slammed; t++) {
    g.update(emptyInput())
    if (stateOf(boss) === 'creak') creaked = true
    if (creaked && stateOf(boss) === 'slam') slammed = true
  }
  assert.ok(creaked && slammed, 'the creak, then the slam')
  hit()
  hit()
  hit()
  assert.equal(boss.phase, 3, 'phase 3: it fizzes at double speed')
  assert.equal(boss.state, 'fizz')
  run(g, 200)
  assert.ok(boss.y < TOP + 130, 'round the top of the room')
  const before = g.score
  hit()
  hit()
  hit()
  assert.equal(boss.state, 'popping')
  run(g, 120)
  assert.equal(boss.state, 'done')
  assert.ok(g.score >= before + CORK.prize, 'its prize')
  assert.ok(g.treats.length >= TREAT_LADDER.length, 'and a shower of treats')
  run(g, 10)
  assert.equal(g.phase, 'clear', 'the floor is clear')
  // It bonks on touch.
  const b2 = game({ seed: 4 })
  b2.startFloor(25)
  b2.setPhase('play')
  run(b2, 100)
  const rb = b2.robots[0]!
  rb.invuln = 0
  const lives = b2.lives
  rb.x = b2.boss!.x
  rb.y = b2.boss!.y + 7
  b2.update(emptyInput())
  assert.equal(b2.lives, lives - 1, 'the Big Cork bonks')
}

// --- the Secret Pantries -------------------------------------------------------------------------
{
  const clearFloor = (g: Inner) => {
    g.grumps = []
    g.bubbles = []
    g.update(emptyInput())
  }
  // No robot lost since the wing began: the door appears on floor 20.
  const g = game()
  g.startFloor(11)
  g.startFloor(20)
  g.setPhase('play')
  clearFloor(g)
  assert.equal(g.phase, 'clear')
  assert.ok(g.door, 'a door has appeared')
  // A robot lost this wing: no door.
  const h = game()
  h.startFloor(11)
  h.startFloor(20)
  h.setPhase('play')
  h.lostThisWing = true
  clearFloor(h)
  assert.ok(!h.door, 'no door after a loss')
  run(h, 200)
  assert.equal(h.level, 21, 'and the climb goes on')
  // Through the door: the pantry, its treats and its recipe card.
  const r = g.robots[0]!
  const door = g.floor.door!
  r.x = door.x
  r.y = door.y
  g.update(emptyInput())
  assert.ok(g.pantry, 'into the pantry')
  assert.equal(g.level, 20)
  run(g, 200)
  assert.equal(g.phase, 'play')
  assert.ok(g.treats.length >= 10 && g.recipe, 'treats and a recipe card')
  assert.equal(g.grumps.length, 0)
  r.x = g.recipe!.x
  r.y = g.recipe!.y
  r.vy = 0
  g.update(emptyInput())
  assert.ok(g.cards.has(20), 'the card is found')
  // A quit right after finding it keeps the card.
  const kept = roundTrip(g.save) as BumperSave
  assert.deepEqual(kept.cards, [20], 'kept at once')
  // Out of the pantry, on to floor 21.
  run(g, 60 * 15)
  assert.equal(g.level, 21)
  assert.ok(!g.pantry)
  // A door already used doesn't open again.
  g.startFloor(20)
  g.setPhase('play')
  clearFloor(g)
  assert.ok(!g.door, 'one card per pantry')
  // The card survives a continue.
  const back = game({ resume: kept })
  back.update(press('a'))
  assert.ok(back.cards.has(20), 'the card comes back with the save')
  // Wing 3's save carries it, and so does a quit in the middle of the boss.
  const w3 = game({ resume: kept })
  w3.update(press('a'))
  w3.startFloor(21)
  const at21 = roundTrip(w3.save) as BumperSave
  assert.equal(at21.wing, 3)
  assert.deepEqual(at21.cards, [20])
  w3.startFloor(25)
  w3.setPhase('play')
  run(w3, 300)
  assert.deepEqual(
    roundTrip(w3.save),
    at21,
    'a quit mid-boss keeps the wing 3 save',
  )
  // Starting over from the offer, then playing, never throws the cards away.
  const fresh = game({ resume: at21 })
  fresh.update(press('b'))
  fresh.setPhase('play')
  run(fresh, 300)
  assert.deepEqual(
    roundTrip(fresh.save),
    at21,
    'a new climb keeps the old save',
  )
}

// --- probes --------------------------------------------------------------------------------------
{
  const meta = ARCADE_GAMES.find((m) => m.slug === 'bumper-bubbles')!
  // On lives topped up, the pilot climbs past THE BIG CORK into the Observatory.
  for (const seed of [1, 2]) {
    const g = game({ seed })
    for (let t = 0; t < 60 * 60 * 30 && g.level < 32; t++) {
      g.lives = Math.max(g.lives, 3)
      g.update(g.pilot(g.robots[0]!))
    }
    assert.ok(
      g.level >= 32,
      `seed ${seed}: past the Big Cork (floor ${g.level})`,
    )
    assert.ok(g.score < meta.maxPlausibleScore)
  }
  // On real lives, from the cellar's first floor, a run still ends.
  const g = game({ seed: 5 })
  g.startFloor(21)
  for (let t = 0; t < 60 * 60 * 40 && !g.over; t++)
    g.update(g.pilot(g.robots[0]!))
  assert.ok(g.over, `a run in the cellar ends (floor ${g.level})`)
}

console.log('bumper bubbles (slice 2): ok')
