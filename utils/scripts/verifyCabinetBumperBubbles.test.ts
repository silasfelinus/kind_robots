// Bumper Bubbles depth pass, slice 1 (conductor kr-arcade/t-059): Fizzwick Tower's ASCII floors
// with air currents, screen wrap, bubbles as platforms, cluster pops and the treat ladder, Old
// Flat Fizz, FRIEND letters, the six wing 1-2 grumps, gumdrop springs, the Gum tap and the save at
// every wing. Each rule is pinned on a staged floor; a pilot probe shows runs still end.
//
//   npx tsx utils/scripts/verifyCabinetBumperBubbles.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { ARCADE_GAMES } from '../arcade/games'
import { sanitizeSaves, withSave } from '../arcade/saves'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import {
  BUBBLE_R,
  BUILT_FLOORS,
  FRIEND,
  GUM_TICKS,
  HURRY_TICKS,
  HURRY_WARN,
  TREAT_LADDER,
  WINGS,
  create,
  floorPlan,
  readBumperSave,
} from '../arcade/games/bumperBubbles'
import type {
  Bubble,
  BumperSave,
  FlatFizz,
  Robot,
  Treat,
} from '../arcade/games/bumperBubbles'
import {
  GRUMPS,
  GRUMP_LETTERS,
  RISE_TICKS,
  harmful,
  makeGrump,
  updateGrump,
} from '../arcade/bumperBubbles/grumps'
import type {
  Grump,
  GrumpKind,
  GrumpWorld,
} from '../arcade/bumperBubbles/grumps'
import {
  COLS,
  FLOOR_Y,
  ROWS,
  SPRING_V,
  TILE,
  TOP,
  feetOf,
  navOf,
  parseFloor,
  reachableSegments,
  route,
  segmentKey,
  segmentUnder,
  solid,
  stepBody,
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
  roundTicks: number
  floor: Floor
  robots: Robot[]
  grumps: Grump[]
  bubbles: Bubble[]
  treats: Treat[]
  fizz: FlatFizz | null
  letters: Set<string>
  boost: number
  nextBoost: number
  offer: BumperSave | null
  update(input: InputFrame, players?: InputFrame[]): void
  pilot(r: Robot): InputFrame
  startFloor(n: number): void
  setPhase(p: string): void
  popCluster(b: Bubble, seat: number): void
}

const quiet = { play: () => {} }
function game(
  options: {
    seed?: number
    players?: number
    resume?: unknown
    demo?: boolean
  } = {},
): Inner {
  return create({
    rng: mulberry32(options.seed ?? 1),
    sound: quiet,
    demo: options.demo ?? false,
    hiScore: 0,
    players: options.players,
    resume: options.resume,
  }) as unknown as Inner
}
/** A floor in play with its grumps cleared away, so one rule can be staged. */
function staged(n = 1, seed = 1): Inner {
  const g = game({ seed })
  g.startFloor(n)
  g.setPhase('play')
  g.grumps = []
  g.robots[0]!.invuln = 0
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
    owner: 0,
    ...extra,
  }
}
/** The game's Old Flat Fizz (read fresh, so an assertion about null doesn't narrow it). */
function fizzOf(g: Inner): FlatFizz {
  return g.fizz!
}
/** Keep a game's grumps from clearing the floor (a far-off waddler, frozen in a bubble). */
function anchor(g: Inner) {
  const w = makeGrump('waddler', { x: 200, y: 64 }, () => 0.5)
  g.bubbles.push(bubble(200, 40, { held: w, holdLeft: 99_999 }))
}

// --- floors as data ------------------------------------------------------------------------------
{
  assert.equal(WINGS.length, 2, 'slice 1 builds wings 1 and 2')
  assert.equal(BUILT_FLOORS, 20)
  assert.deepEqual(
    WINGS.map((w) => w.name),
    ['THE BOTTLING HALL', 'GUMDROP GARDENS'],
  )
  const names = new Set<string>()
  for (const wing of WINGS) {
    assert.equal(wing.floors.length, 10, `${wing.name} has ten floors`)
    for (const def of wing.floors) {
      const f = parseFloor(def)
      assert.ok(!names.has(def.name), `${def.name} is named once`)
      names.add(def.name)
      for (let r = 0; r < ROWS; r++)
        for (const c of [0, 1, COLS - 2, COLS - 1])
          assert.ok(solid(f, c, r), `${def.name}: walls down both sides`)
      for (let c = 2; c < COLS - 2; c++)
        assert.ok(
          !solid(f, c, 1),
          `${def.name}: row 1 is clear for a body wrapping in`,
        )
      // Every floor gap sits under a ceiling gap, and is wide enough to fall through.
      for (const c of f.wrapCols) {
        assert.ok(
          !solid(f, c, 0),
          `${def.name}: a floor gap at ${c} has a ceiling gap`,
        )
        assert.ok(
          f.wrapCols.includes(c - 1) || f.wrapCols.includes(c + 1),
          `${def.name}: gap at ${c} is two tiles or more`,
        )
      }
      assert.ok(
        f.spawns.length >= 3 && f.spawns.length <= 8,
        `${def.name}: 3-8 grumps`,
      )
      // Each grump belongs to this wing or an earlier one.
      for (const s of f.spawns) {
        const kind = GRUMP_LETTERS[s.letter]
        assert.ok(kind, `${def.name}: "${s.letter}" names a grump`)
        assert.ok(
          GRUMPS[kind].wing <= wing.n,
          `${def.name}: no ${kind} before wing ${GRUMPS[kind].wing}`,
        )
      }
      // A tap needs a flavour, and a flavour a tap.
      assert.equal(
        f.tap !== null,
        f.flavour !== null,
        `${def.name}: tap and flavour together`,
      )
      // Everything is reachable from the robots' starts.
      const reached = reachableSegments(f)
      for (const seg of navOf(f).segs)
        assert.ok(
          reached.has(segmentKey(seg)),
          `${def.name}: row ${seg.r} cols ${seg.c0}-${seg.c1} is reachable`,
        )
      for (const s of f.starts)
        assert.ok(
          segmentUnder(f, s.x, s.y) >= 0,
          `${def.name}: robots start on a block`,
        )
    }
  }
  // The Bottling Hall teaches currents and wrap; the Gardens bring gumdrops and the Gum tap.
  const hall = WINGS[0]!.floors.map(parseFloor)
  const gardens = WINGS[1]!.floors.map(parseFloor)
  assert.ok(
    hall.some((f) => f.wrapCols.length > 0),
    'a wing 1 floor wraps',
  )
  assert.ok(
    hall.some((f) => f.currents.some((c, i) => c === 1 && i > COLS * 2)),
    'a wing 1 floor has a rising current column',
  )
  assert.ok(
    gardens.filter((f) => f.flavour === 'gum').length >= 3,
    'Gum taps on three Gardens floors',
  )
  assert.ok(
    gardens.filter((f) => f.cells.includes(2)).length >= 5,
    'gumdrop springs across the Gardens',
  )
  assert.ok(
    gardens.some((f) =>
      f.spawns.some((s) => GRUMP_LETTERS[s.letter] === 'bouncer'),
    ),
  )
  assert.ok(
    gardens.some((f) =>
      f.spawns.some((s) => GRUMP_LETTERS[s.letter] === 'sprout'),
    ),
  )
  // Pictures and letters: floor 6 is a B, floor 4 a heart, floor 10 a robot face.
  assert.equal(floorPlan(6).def.name, 'THE BIG B')
  assert.equal(floorPlan(4).def.name, 'SWEETHEART')
  // The plan: wing by floor, and the built floors replayed past the top until the tower grows.
  assert.equal(floorPlan(1).wing.n, 1)
  assert.equal(floorPlan(11).wing.n, 2)
  assert.equal(floorPlan(20).def.name, 'THE GREENHOUSE')
  assert.equal(floorPlan(21).map, 0)
  // Parse errors are loud.
  assert.throws(() => parseFloor({ name: 'BAD', rows: ['##'] }), /rows/)
}

// --- the tower's physics -------------------------------------------------------------------------
{
  const f = parsedFloor(1) // The Drop: a four-tile gap in the floor.
  assert.ok(f.wrapCols.length === 4)
  const gapX = f.wrapCols[1]! * TILE + 4
  const body = { x: gapX, y: FLOOR_Y - 20, vx: 0, vy: 0, onGround: false }
  let wrapped = false
  for (let t = 0; t < 60 && !wrapped; t++)
    wrapped = stepBody(f, body, 5).wrapped
  assert.ok(wrapped, 'falling through the floor gap wraps')
  assert.ok(body.y < TOP + 16, 'back in at the top')
  for (let t = 0; t < 200; t++) stepBody(f, body, 5)
  assert.ok(
    body.onGround && body.y < FLOOR_Y,
    'and lands on a platform below the ceiling gap',
  )
  // One-way blocks: up through from beneath, land on top.
  const g = parsedFloor(0)
  const hop = { x: 128, y: FLOOR_Y, vx: 0, vy: -6.2, onGround: false }
  for (let t = 0; t < 120; t++) stepBody(g, hop, 5)
  assert.ok(
    hop.onGround && hop.y < FLOOR_Y,
    'hopped up through a platform and stood on it',
  )
  // A hop clears one platform row (five tiles), never two.
  const reach = 4.4 ** 2 / (2 * 0.2)
  assert.ok(reach > 5 * TILE && reach < 7 * TILE)
  // Gumdrops bounce.
  const lawn = parsedFloor(10)
  const springCol = [...Array(COLS).keys()].find(
    (c) => lawn.cells[(ROWS - 1) * COLS + c] === 2,
  )!
  const b = {
    x: springCol * TILE + 4,
    y: FLOOR_Y - 10,
    vx: 0,
    vy: 0,
    onGround: false,
  }
  let sprang = false
  for (let t = 0; t < 30 && !sprang; t++) sprang = stepBody(lawn, b, 5).sprang
  assert.ok(sprang && b.vy === SPRING_V, 'a gumdrop springs a robot high')
  // Walking into a block at waist height stops you; hopping clears it.
  const crates = parsedFloor(7)
  const walker = {
    x: 7 * TILE - 12,
    y: FLOOR_Y,
    vx: 1.3,
    vy: 0,
    onGround: true,
  }
  let bumped = false
  for (let t = 0; t < 20; t++)
    bumped = stepBody(crates, walker, 5).bumped || bumped
  assert.ok(bumped && walker.x < 7 * TILE, 'a crate stops a walk')
  // The pilot's map: every floor routes from the starts to every surface.
  for (let m = 0; m < BUILT_FLOORS; m++) {
    const fl = parsedFloor(m)
    const start = segmentUnder(fl, fl.starts[0]!.x, fl.starts[0]!.y)
    navOf(fl).segs.forEach((_, i) => {
      if (i !== start)
        assert.ok(route(fl, start, i), `${fl.name}: a route to surface ${i}`)
    })
  }
}

// --- bubbles: riding, cluster pops and the treat ladder ------------------------------------------
{
  // Hold HOP as you land on a bubble: it bounces you up and stays.
  const g = staged(1)
  anchor(g)
  const r = g.robots[0]!
  r.x = 128
  r.y = 150
  r.vy = 2
  r.onGround = false
  const b = bubble(128, 157)
  g.bubbles.push(b)
  g.update(hold('up'))
  assert.ok(g.bubbles.includes(b), 'riding a bubble keeps it')
  assert.ok(r.vy < 0, 'and bounces the robot up')
  assert.equal(r.rides, 1)
  // Without HOP it pops.
  r.x = 128
  r.y = b.y - 4
  r.vy = 1
  g.update(emptyInput())
  assert.ok(!g.bubbles.includes(b), 'touching a bubble without HOP pops it')
}
{
  // Popping one bubble pops every bubble touching it; each grump in the cluster drops a bigger treat.
  const g = staged(1)
  anchor(g)
  const chain = Array.from({ length: 7 }, (_, i) =>
    bubble(60 + i * 13, 100, {
      held: makeGrump('waddler', { x: 0, y: 0 }, () => 0.5),
    }),
  )
  const empty = bubble(60 + 7 * 13, 100)
  const apart = bubble(60, 160)
  g.bubbles.push(...chain, empty, apart)
  g.popCluster(chain[0]!, 0)
  assert.ok(
    chain.every((b) => !g.bubbles.includes(b)),
    'the whole cluster pops',
  )
  assert.ok(!g.bubbles.includes(empty), 'empty bubbles in it too')
  assert.ok(g.bubbles.includes(apart), 'a bubble not touching stays')
  assert.deepEqual(
    g.treats.map((t) => t.value),
    [...TREAT_LADDER],
    'treats climb the ladder: 1,000 up to 64,000 for the seventh',
  )
  assert.equal(TREAT_LADDER[6], 64_000)
  // Treats fall, land and are picked up for their value.
  const before = g.score
  const r = g.robots[0]!
  for (let t = 0; t < 120; t++) g.update(emptyInput())
  assert.ok(g.treats.every((t) => t.onGround || t.y > 0))
  const t0 = g.treats[0]!
  r.x = t0.x
  r.y = t0.y
  g.update(emptyInput())
  assert.ok(g.score >= before + t0.value, 'a treat pays its rung')
}
{
  // Air currents steer floating bubbles; a bubble pinned under a ceiling drifts to the gather point.
  const g = staged(7) // Bubble Elevator: a rising column up the middle.
  anchor(g)
  const f = g.floor
  const col = [...Array(COLS).keys()].find(
    (c) => f.currents[12 * COLS + c] === 1,
  )!
  const b = bubble(col * TILE + 4, TOP + 12 * TILE + 4)
  g.bubbles.push(b)
  const y0 = b.y
  for (let t = 0; t < 20; t++) g.update(emptyInput())
  assert.ok(b.y < y0 - 5, 'the current carries it up')
  const g2 = staged(1) // First Fizz: row 1 blows to the middle.
  anchor(g2)
  const c = bubble(40, TOP + TILE + 8)
  g2.bubbles.push(c)
  for (let t = 0; t < 60; t++) g2.update(emptyInput())
  assert.ok(c.x > 50, 'row 1 blows it toward the middle')
  // A shot traps a grump; a trapped grump escapes angry when the hold runs out.
  const g3 = staged(1)
  anchor(g3)
  const w = makeGrump('waddler', { x: 100, y: FLOOR_Y }, () => 0.5)
  g3.grumps.push(w)
  const shot = bubble(100, FLOOR_Y - 6, { flight: 10 })
  g3.bubbles.push(shot)
  g3.update(emptyInput())
  assert.equal(shot.held, w, 'trapped')
  shot.holdLeft = 1
  g3.update(emptyInput())
  assert.ok(g3.grumps.includes(w) && w.angry, 'it bursts free, angry')
}

// --- the grumps ----------------------------------------------------------------------------------
{
  const f = parsedFloor(0)
  const world = (
    rng: () => number,
    robots = [{ x: 30, y: FLOOR_Y }],
  ): GrumpWorld => ({
    floor: f,
    rng,
    speed: 0.6,
    hop: 0.01,
    robots,
  })
  const run = (
    kind: GrumpKind,
    at: { x: number; y: number },
    ticks: number,
    w: GrumpWorld,
  ) => {
    const g = makeGrump(kind, at, () => 0.9)
    for (let t = 0; t < ticks; t++) updateGrump(g, w)
    return g
  }
  // Waddlers turn at an edge; dashers run off it and are faster.
  const ledge = feetOf(9, 10) // Right end of the left platform on row 11.
  const wad = makeGrump('waddler', ledge, () => 0.9)
  wad.dir = 1
  for (let t = 0; t < 60; t++)
    updateGrump(
      wad,
      world(() => 0.1),
    )
  assert.ok(wad.y === ledge.y, 'a waddler turns back at the edge')
  const dash = makeGrump('dasher', ledge, () => 0.9)
  dash.dir = 1
  for (let t = 0; t < 60; t++)
    updateGrump(
      dash,
      world(() => 0.9),
    )
  assert.ok(dash.y > ledge.y, 'a dasher runs off it')
  assert.ok(GRUMPS.dasher.speed > GRUMPS.waddler.speed)
  // Hoppers hop more than waddlers.
  const hops = (kind: GrumpKind) => {
    const rng = mulberry32(3)
    const g = makeGrump(kind, feetOf(15, ROWS - 2), rng)
    let n = 0
    for (let t = 0; t < 2000; t++) {
      const was = g.onGround
      updateGrump(g, { ...world(rng), robots: [] })
      if (was && g.vy < 0) n++
    }
    return n
  }
  assert.ok(hops('hopper') > hops('waddler') * 2, 'hoppers hop often')
  // A climber hops toward a robot above it.
  const climber = makeGrump('climber', feetOf(15, ROWS - 2), () => 0.9)
  updateGrump(
    climber,
    world(() => 0.9, [{ x: 200, y: FLOOR_Y }]),
  )
  let climbed = false
  for (let t = 0; t < 400 && !climbed; t++) {
    updateGrump(
      climber,
      world(() => 0.01, [{ x: 200, y: 100 }]),
    )
    if (climber.vy < 0) climbed = true
  }
  assert.ok(climbed && climber.dir === 1, 'a climber hops toward a robot above')
  // Bouncers fly diagonally, ricochet off walls and never land.
  const bouncer = run(
    'bouncer',
    { x: 128, y: 120 },
    400,
    world(() => 0.5),
  )
  assert.equal(bouncer.state, 'fly')
  assert.ok(!bouncer.onGround)
  const b2 = makeGrump('bouncer', { x: 30, y: 120 }, () => 0.9)
  b2.dir = -1
  for (let t = 0; t < 30; t++)
    updateGrump(
      b2,
      world(() => 0.5),
    )
  assert.equal(b2.dir, 1, 'it ricochets off a wall')
  // Sprout sneaks hide as flowers, harmless, twitch when a robot is near and pop up when it passes.
  const sp = makeGrump('sprout', feetOf(10, 20), () => 0.9)
  updateGrump(
    sp,
    world(() => 0.5, [{ x: 200, y: FLOOR_Y }]),
  )
  assert.equal(sp.state, 'hidden')
  assert.ok(!harmful(sp), 'a flower does not bonk')
  for (let t = 0; t < 30; t++)
    updateGrump(
      sp,
      world(() => 0.5, [{ x: 200, y: FLOOR_Y }]),
    )
  assert.ok(!sp.twitch)
  updateGrump(
    sp,
    world(() => 0.5, [{ x: sp.x + 40, y: sp.y }]),
  )
  assert.ok(sp.twitch && sp.state === 'hidden', 'its petals twitch')
  updateGrump(
    sp,
    world(() => 0.5, [{ x: sp.x + 10, y: sp.y }]),
  )
  assert.equal(sp.state, 'rise')
  assert.ok(!harmful(sp), 'still unfolding')
  for (let t = 0; t < RISE_TICKS; t++)
    updateGrump(
      sp,
      world(() => 0.5, [{ x: 200, y: FLOOR_Y }]),
    )
  assert.ok(sp.state === 'walk' && harmful(sp), 'then it walks, and bonks')
  // A flower can be bubbled.
  const g = staged(11)
  anchor(g)
  const flower = makeGrump('sprout', { x: 100, y: FLOOR_Y }, () => 0.5)
  g.grumps.push(flower)
  g.bubbles.push(bubble(100, FLOOR_Y - 6, { flight: 5 }))
  g.update(emptyInput())
  assert.ok(!g.grumps.includes(flower), 'bubble the flower')
}

// --- Old Flat Fizz -------------------------------------------------------------------------------
{
  const g = staged(1)
  anchor(g)
  g.grumps.push(makeGrump('waddler', { x: 200, y: 64 }, () => 0.5))
  g.grumps[0]!.state = 'walk'
  const r = g.robots[0]!
  r.invuln = 99_999
  g.roundTicks = HURRY_WARN - 1
  g.update(emptyInput())
  assert.equal(g.fizz, null, 'HURRY! first')
  g.roundTicks = HURRY_TICKS - 1
  g.update(emptyInput())
  assert.ok(g.fizz, 'then Old Flat Fizz drifts in')
  const d0 = Math.hypot(fizzOf(g).x - r.x, fizzOf(g).y - r.y)
  for (let t = 0; t < 120; t++) g.update(emptyInput())
  assert.ok(
    Math.hypot(fizzOf(g).x - r.x, fizzOf(g).y - r.y) < d0 - 40,
    'it follows the robot',
  )
  // It can't be trapped.
  const shot = bubble(fizzOf(g).x, fizzOf(g).y, { flight: 5 })
  g.bubbles.push(shot)
  g.update(emptyInput())
  assert.equal(shot.held, null)
  // It bonks on touch, and a bonk starts the floor timer again and sends it home.
  r.invuln = 0
  fizzOf(g).x = r.x
  fizzOf(g).y = r.y - 7
  const lives = g.lives
  g.update(emptyInput())
  assert.equal(g.lives, lives - 1, 'a bonk')
  assert.equal(g.fizz, null)
  assert.equal(g.roundTicks, 0)
  // A floor cleared with it about sends it off.
  const g2 = staged(1)
  g2.fizz = { x: 100, y: 100, t: 0, leaving: false }
  g2.robots[0]!.invuln = 99_999
  g2.update(emptyInput())
  assert.equal(g2.phase, 'clear')
  assert.ok(fizzOf(g2).leaving)
}

// --- FRIEND letters ------------------------------------------------------------------------------
{
  const g = staged(1)
  anchor(g)
  const lives = g.lives
  for (const ch of FRIEND) {
    const b = bubble(60, 120, { letter: ch })
    g.bubbles.push(b)
    g.popCluster(b, 0)
  }
  assert.equal(g.lives, lives + 1, 'FRIEND spells an extra robot')
  assert.equal(g.letters.size, 0, 'and the letters start again')
  assert.equal(g.nextBoost, 1, "the next floor's treats start a rung higher")
  g.startFloor(2)
  assert.equal(g.boost, 1)
  const b = bubble(60, 120, {
    held: makeGrump('waddler', { x: 0, y: 0 }, () => 0.5),
  })
  g.bubbles.push(b)
  g.popCluster(b, 0)
  assert.equal(g.treats[0]!.value, 2000)
  // Letter bubbles drift in from the walls on most floors.
  let seen = 0
  for (let seed = 1; seed <= 10; seed++) {
    const h = staged(1, seed)
    anchor(h)
    h.robots[0]!.invuln = 99_999
    for (let t = 0; t < 1400; t++) {
      h.update(emptyInput())
      if (h.bubbles.some((x) => x.letter)) {
        seen++
        break
      }
    }
  }
  assert.ok(seen >= 4, `letters float in on most floors (${seen}/10)`)
}

// --- the Gum tap ---------------------------------------------------------------------------------
{
  const g = staged(11) // Gumdrop Lawn.
  anchor(g)
  const r = g.robots[0]!
  r.invuln = 99_999
  const tap = g.floor.tap!
  r.x = tap.x
  r.y = tap.y
  g.update(emptyInput())
  assert.equal(r.flavour, 'gum', 'touching the tap pours gum bubbles')
  // A gum bubble that hits a wall sticks there as a ledge.
  r.x = 40
  r.y = FLOOR_Y
  r.face = -1
  r.cooldown = 0
  g.update(press('a'))
  const gum = g.bubbles.find((b) => b.flavour === 'gum')!
  for (let t = 0; t < 30 && gum.stuck === 0; t++) g.update(emptyInput())
  assert.ok(gum.stuck > 0, 'it sticks to the wall')
  const at = { x: gum.x, y: gum.y }
  for (let t = 0; t < 60; t++) g.update(emptyInput())
  assert.deepEqual({ x: gum.x, y: gum.y }, at, 'and hangs there')
  // A robot lands on it, and doesn't pop it.
  r.x = gum.x
  r.y = gum.y - 30
  r.vy = 0
  r.onGround = false
  for (let t = 0; t < 30; t++) g.update(emptyInput())
  assert.ok(
    r.onGround && Math.abs(r.y - (gum.y - BUBBLE_R + 1)) < 1,
    'a ledge you stand on',
  )
  assert.ok(g.bubbles.includes(gum))
  // It lets go after ten seconds.
  gum.stuck = 2
  g.update(emptyInput())
  g.update(emptyInput())
  assert.ok(!g.bubbles.includes(gum), 'and lets go')
  assert.equal(GUM_TICKS, 600)
  // A bonk takes the flavour away.
  r.invuln = 0
  g.grumps.push(makeGrump('dasher', { x: r.x, y: r.y }, () => 0.5))
  g.update(emptyInput())
  assert.equal(r.flavour, 'classic', 'losing a robot loses the flavour')
}

// --- the climb, wing cards and saves -------------------------------------------------------------
{
  const g = game()
  assert.equal(g.level, 1)
  assert.equal(g.phase, 'card', 'the climb opens on the wing card')
  assert.equal(g.save, null, 'nothing to keep yet')
  // Clearing a floor climbs to the next.
  g.setPhase('play')
  g.grumps = []
  g.bubbles = []
  for (let t = 0; t < 400 && g.level === 1; t++) g.update(emptyInput())
  assert.equal(g.level, 2, 'cleared floors climb')
  // Wing 2's first floor writes the save.
  g.score = 81_234
  g.startFloor(11)
  assert.deepEqual(g.save, { v: 1, wing: 2, score: 81_234, letters: '' })
  assert.equal(g.phase, 'card')
  // Saves are validated on the way back in.
  assert.equal(readBumperSave(null), null)
  assert.equal(
    readBumperSave({ v: 1, wing: 1, score: 0, letters: '' }),
    null,
    'wing 1 needs no save',
  )
  assert.equal(readBumperSave({ v: 1, wing: 99, score: 0, letters: '' }), null)
  assert.equal(readBumperSave({ v: 1, wing: 2, score: -1, letters: '' }), null)
  assert.equal(readBumperSave({ v: 1, wing: 2, score: 5, letters: 'FF' }), null)
  assert.equal(readBumperSave({ v: 2, wing: 2, score: 5, letters: '' }), null)
  assert.deepEqual(readBumperSave({ v: 1, wing: 2, score: 5, letters: 'RF' }), {
    v: 1,
    wing: 2,
    score: 5,
    letters: 'RF',
  })
  // The demo never saves.
  assert.equal(game({ demo: true }).save, undefined)
}
{
  /** What the cabinet does: keep the save, store it as JSON, read it back and resume a new game. */
  const roundTrip = (save: unknown) => {
    const stored = JSON.parse(
      JSON.stringify(withSave({}, 'bumper-bubbles', save)),
    )
    return sanitizeSaves(stored)['bumper-bubbles']
  }
  const climbed = game()
  climbed.score = 90_000
  climbed.letters = new Set(['F', 'R'])
  climbed.startFloor(11)
  const kept = roundTrip(climbed.save)
  assert.deepEqual(kept, { v: 1, wing: 2, score: 90_000, letters: 'FR' })
  // A resumed game offers to continue, at half score, from the wing's first floor.
  const back = game({ resume: kept })
  assert.ok(back.offer, 'the tower remembers')
  assert.equal(back.level, 1, 'nothing moves until the player chooses')
  back.update(press('a'))
  assert.equal(back.offer, null)
  assert.equal(back.level, 11)
  assert.equal(back.score, 45_000, 'a continue keeps half the score')
  assert.deepEqual([...back.letters].sort(), ['F', 'R'])
  // Quit straight after continuing: the save is unchanged, not halved again.
  assert.deepEqual(
    roundTrip(back.save),
    kept,
    'a quit after a continue keeps the save',
  )
  // Quit in the middle of the wing: still the wing's save.
  back.setPhase('play')
  for (let t = 0; t < 600; t++) back.update(emptyInput())
  assert.deepEqual(roundTrip(back.save), kept, 'a quit mid-wing keeps it')
  // A new climb from the offer, then a few floors played and a quit: the old save survives.
  const fresh = game({ resume: kept })
  fresh.update(press('b'))
  assert.equal(fresh.offer, null)
  assert.equal(fresh.level, 1, 'a new climb starts at the bottom')
  fresh.startFloor(2)
  fresh.setPhase('play')
  for (let t = 0; t < 300; t++) fresh.update(emptyInput())
  assert.deepEqual(
    roundTrip(fresh.save),
    kept,
    'starting over does not throw the wing 2 save away',
  )
  // Game over keeps the save too: the continue is the point.
  const lost = game({ resume: kept })
  lost.update(press('a'))
  lost.setPhase('play')
  lost.lives = 1
  const r = lost.robots[0]!
  r.invuln = 0
  for (let t = 0; t < 600 && !lost.over; t++) {
    lost.grumps.push(makeGrump('dasher', { x: r.x, y: r.y }, () => 0.5))
    lost.update(emptyInput())
  }
  assert.ok(lost.over, 'the climb ends')
  assert.deepEqual(
    roundTrip(lost.save),
    kept,
    'and the save waits for the next go',
  )
}

// --- co-op through the players frames ------------------------------------------------------------
{
  const g = game({ players: 2 })
  assert.equal(g.robots.length, 2)
  assert.equal(g.lives, 4, 'one more robot in the pool for the second seat')
  assert.notEqual(
    g.robots[0]!.x,
    g.robots[1]!.x,
    'each robot has its own start',
  )
  g.setPhase('play')
  const before = g.robots[1]!.x
  g.update(emptyInput(), [emptyInput(), hold('left')])
  assert.ok(g.robots[1]!.x < before, 'seat 2 moves on its own frame')
  // Shared lives: a bonked robot comes back only while there is a robot to spare.
  g.lives = 2
  const [a, b] = g.robots
  a!.invuln = 0
  b!.invuln = 99_999
  g.grumps.push(makeGrump('dasher', { x: a!.x, y: a!.y }, () => 0.5))
  g.update(emptyInput(), [emptyInput(), emptyInput()])
  assert.equal(g.lives, 1)
  g.grumps = []
  anchor(g)
  for (let t = 0; t < 100; t++)
    g.update(emptyInput(), [emptyInput(), emptyInput()])
  assert.ok(a!.out, 'no spare: the bonked robot sits out')
  assert.ok(!g.over, 'while its partner climbs on')
}

// --- a deterministic floor clear, the demo and the pilot probe -----------------------------------
{
  const clearFirst = (seed: number) => {
    const g = game({ seed })
    let t = 0
    for (; t < 60 * 90 && g.level === 1; t++) g.update(g.pilot(g.robots[0]!))
    return { t, score: g.score, level: g.level }
  }
  const a = clearFirst(4)
  assert.equal(a.level, 2, 'the pilot clears floor 1')
  assert.deepEqual(clearFirst(4), a, 'and the same seed clears it the same way')
  // The attract demo never scores.
  const demo = game({ demo: true, seed: 7 })
  for (let t = 0; t < 60 * 60; t++) demo.update(emptyInput())
  assert.equal(demo.score, 0)
  assert.ok(demo.level >= 2, 'the demo climbs')
  // Probe: on real lives the climb ends; with lives topped up the pilot keeps climbing.
  const meta = ARCADE_GAMES.find((m) => m.slug === 'bumper-bubbles')!
  for (let seed = 1; seed <= 3; seed++) {
    const g = game({ seed })
    let t = 0
    for (; t < 60 * 60 * 40 && !g.over; t++) g.update(g.pilot(g.robots[0]!))
    assert.ok(
      g.over,
      `seed ${seed}: a run on real lives ends (floor ${g.level})`,
    )
    assert.ok(g.score < meta.maxPlausibleScore)
  }
  const g = game({ seed: 2 })
  for (let t = 0; t < 60 * 60 * 12; t++) {
    g.lives = Math.max(g.lives, 3)
    g.update(g.pilot(g.robots[0]!))
  }
  assert.ok(
    g.level >= 15,
    `the pilot climbs 15 floors in 12 minutes (reached ${g.level})`,
  )
  assert.ok(g.score < meta.maxPlausibleScore)
}

console.log('bumper bubbles (slice 1): ok')
