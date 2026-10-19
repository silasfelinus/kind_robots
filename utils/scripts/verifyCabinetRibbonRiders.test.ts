// Ribbon Riders depth pass, slice 1 (conductor kr-arcade/t-074): the riding feel and the wrap-up.
// The wrap-up's fill and rival capture, slipstream chains, the brake and turbo, near-miss whiskers,
// the six pickups, the rival personality table, the arena data format, a deterministic seeded round
// and a pilot probe showing that runs still end. Each rule is pinned on a staged arena.
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import {
  BRAKE_SPEED,
  TURBO_MAX,
  TURBO_SPEED,
  WRAP_CELL_POINTS,
  WRAP_LIMIT,
  create,
  slipMultiplier,
} from '../arcade/games/ribbonRiders'
import { GRID, T, idx, type Dir } from '../arcade/ribbonRiders/grid'
import {
  MIDWAY,
  RIDER_SPAWNS,
  RIVAL_SPAWNS,
  buildArena,
  gateOpen,
} from '../arcade/ribbonRiders/arenas'
import { findWraps } from '../arcade/ribbonRiders/wrap'
import { RIVALS, steer, type SteerCtx } from '../arcade/ribbonRiders/rivals'
import { PICKUPS, rollPickup } from '../arcade/ribbonRiders/pickups'

type Bike = {
  id: number
  seat: number
  kind: string | null
  x: number
  y: number
  dir: Dir
  want: Dir
  acc: number
  speed: number
  alive: boolean
  wrapped: boolean
  laid: number
  turbo: number
  boosting: boolean
  braking: boolean
  snips: number
  spool: number
  bow: boolean
  chain: number
  whiskers: number
  wraps: number
  wrapCombo: number
}
type Inner = {
  score: number
  level: number
  lives: number
  over: boolean
  ready: number
  banner: unknown
  freeze: number
  bikes: Bike[]
  cells: Uint8Array
  fill: Uint8Array
  pickups: Array<{ x: number; y: number; kind: string; life: number }>
  arena: { terrain: Uint8Array; spec: { id: string } }
  roundTicks: number
  margin: number
  roundClear: number
  lay(b: Bike, x?: number, y?: number): void
  startRound(round: number): void
  demoInput(seat?: number): InputFrame
  update(input: InputFrame): void
  render(g: CanvasRenderingContext2D): void
}

const quiet = { play: () => {} }
function game(seed = 3, demo = false): Inner {
  return create({
    rng: mulberry32(seed),
    sound: quiet,
    demo,
    hiScore: 0,
  }) as unknown as Inner
}
const hold = (...buttons: Array<keyof InputFrame['held']>): InputFrame => {
  const f = emptyInput()
  for (const b of buttons) f.held[b] = true
  return f
}
/** A cleared board: no ribbons, every rival parked out of the way and frozen. */
function staged(seed = 3): Inner {
  const g = game(seed)
  g.ready = 0
  g.cells.fill(0)
  g.fill.fill(0)
  g.pickups = []
  return g
}
function place(g: Inner, b: Bike, x: number, y: number, dir: Dir) {
  Object.assign(b, { x, y, dir, want: dir, acc: 0 })
  g.lay(b)
}
/** Ride until `done`, holding a heading picked by `plan`, with the rivals held still. */
function ride(
  g: Inner,
  plan: (p: Bike) => Array<keyof InputFrame['held']>,
  done: () => boolean,
  max = 3000,
) {
  for (let t = 0; t < max && !done(); t++) {
    g.freeze = 5
    g.update(hold(...plan(g.bikes[0]!)))
  }
}
/** Ride a box: up to `top`, right to `right`, down to `bottom`, then left. */
const box =
  (top: number, right: number, bottom: number) =>
  (p: Bike): Array<keyof InputFrame['held']> => {
    if (p.dir === 0 && p.y <= top) return ['right']
    if (p.dir === 1 && p.x >= right) return ['down']
    if (p.dir === 2 && p.y >= bottom) return ['left']
    return []
  }

// --- the wrap rule, on its own -------------------------------------------------------------------
{
  // A ring of own ribbon round a 3 x 3 pocket, the rider just closing it at the bottom.
  const own = new Set<number>()
  for (let x = 10; x <= 14; x++) own.add(idx(x, 10)).add(idx(x, 14))
  for (let y = 10; y <= 14; y++) own.add(idx(10, y)).add(idx(14, y))
  const side = (x: number, y: number) =>
    x < 0 || y < 0 || x >= GRID || y >= GRID || own.has(idx(x, y))
  const regions = findWraps({ x: 11, y: 14, dir: 3, limit: 100, side })
  assert.equal(regions.length, 1, 'a closed ring wraps')
  assert.equal(regions[0]!.length, 9, 'the pocket inside, 3 x 3')
  // Too big for the limit: the pocket is part of the open arena.
  assert.equal(
    findWraps({ x: 11, y: 14, dir: 3, limit: 8, side }).length,
    0,
    'a loop larger than the limit does not wrap',
  )
  // The road ahead is never wrapped.
  const regionsAhead = findWraps({ x: 11, y: 14, dir: 0, limit: 100, side })
  assert.equal(regionsAhead.length, 0, 'heading into the pocket keeps it open')
  // A teammate inside forbids the wrap.
  assert.equal(
    findWraps({
      x: 11,
      y: 14,
      dir: 3,
      limit: 100,
      side,
      forbid: (i) => i === idx(12, 12),
    }).length,
    0,
  )
  // Wrapping edges: a ring open across the edge is not closed.
  const strip = new Set<number>()
  for (let x = 0; x < GRID; x++) strip.add(idx(x, 20)).add(idx(x, 24))
  const sideStrip = (x: number, y: number) =>
    x < 0 || y < 0 || x >= GRID || y >= GRID || strip.has(idx(x, y))
  assert.equal(
    findWraps({ x: 5, y: 20, dir: 1, limit: 400, side: sideStrip })[0]!.length,
    3 * GRID,
    'walls at the board edge close the strip',
  )
  assert.equal(
    findWraps({ x: 5, y: 20, dir: 1, limit: 400, side: sideStrip, wrapX: true })
      .length,
    1,
  )
}

// --- the wrap-up in play: fill, rival capture, pickups, the bow --------------------------------
{
  const g = staged()
  const [p, r] = g.bikes
  place(g, p!, 8, 30, 0)
  place(g, r!, 13, 22, 0)
  g.pickups.push({ x: 11, y: 25, kind: 'bow', life: 600 })
  ride(g, box(16, 18, 30), () => p!.wraps > 0 || !p!.alive)
  assert.ok(p!.alive, 'the rider closes the loop without crashing')
  assert.equal(p!.wraps, 1)
  assert.equal(r!.alive, false)
  assert.equal(r!.wrapped, true, 'the rival inside is wrapped, not crashed')
  assert.equal(g.fill[idx(13, 22)], 1, 'the rival cell is filled')
  assert.equal(g.cells[idx(13, 22)], p!.id)
  assert.equal(p!.bow, true, 'the pickup inside was collected by the wrap')
  assert.equal(g.pickups.length, 0)
  const filled = g.fill.reduce((n, v) => n + v, 0)
  assert.equal(filled, 9 * 13, 'the inside of the loop is filled: 9 x 13')
  assert.ok(g.score >= filled * WRAP_CELL_POINTS + 1000, 'area and capture pay')
  // The last rival out clears the round.
  for (let t = 0; t < 5; t++) g.update(hold(p!.dir === 3 ? 'up' : 'left'))
  assert.ok(g.roundClear > 0, 'round clear')
}

// A rival's ribbon is not a side: a loop drawn across one still closes.
{
  const g = staged()
  const [p, r] = g.bikes
  place(g, p!, 8, 30, 0)
  place(g, r!, 40, 40, 1)
  for (let x = 4; x < 24; x++) g.lay(r!, x, 22)
  ride(g, box(16, 18, 30), () => p!.wraps > 0 || !p!.alive, 3000)
  // The rider crosses the rival's ribbon? It can't, so it crashes into it on the way up.
  assert.equal(p!.alive, false, 'a rival ribbon still blocks the road')
  // With a Snip, the rider cuts through and closes the loop across it.
  const h = staged()
  const [q, s] = h.bikes
  place(h, q!, 8, 30, 0)
  place(h, s!, 40, 40, 1)
  for (let x = 4; x < 24; x++) h.lay(s!, x, 22)
  q!.snips = 2
  ride(h, box(16, 18, 30), () => q!.wraps > 0 || !q!.alive, 3000)
  assert.ok(q!.alive, 'two snips cut the way up and the way down')
  assert.equal(q!.snips, 0)
  assert.equal(q!.wraps, 1, 'the loop across a rival ribbon wraps')
  assert.equal(h.fill[idx(12, 22)], 1, 'the rival ribbon inside is wrapped up')
}

// The size limit, and the Bow doubling it.
{
  const big = (bow: boolean) => {
    const g = staged()
    const [p, r] = g.bikes
    place(g, p!, 4, 40, 0)
    place(g, r!, 44, 4, 2)
    p!.bow = bow
    // 15 x 15 inside: more than WRAP_LIMIT, less than twice it.
    ride(g, box(24, 20, 40), () => p!.wraps > 0 || !p!.alive || p!.x < 4)
    return p!
  }
  assert.ok(15 * 15 > WRAP_LIMIT && 15 * 15 < WRAP_LIMIT * 2)
  assert.equal(big(false).wraps, 0, 'too big to wrap')
  const p = big(true)
  assert.equal(p.wraps, 1, 'a Bow wraps a loop twice the size')
  assert.equal(p.bow, false, 'the Bow is spent')
}

// --- slipstream, brake, turbo, whiskers --------------------------------------------------------
{
  const g = staged()
  const [p, r] = g.bikes
  place(g, p!, 10, 40, 0)
  place(g, r!, 40, 40, 1)
  for (let y = 4; y < 44; y++) g.lay(r!, 11, y)
  p!.turbo = 20
  const before = g.score
  ride(
    g,
    () => [],
    () => p!.y <= 20,
  )
  assert.ok(
    p!.chain >= 18,
    `a slipstream chain builds beside a ribbon (${p!.chain})`,
  )
  assert.ok(p!.turbo > 20 + 18, 'the slipstream refills turbo')
  assert.ok(g.score > before + 20, 'and pays')
  assert.equal(slipMultiplier(0), 1)
  assert.equal(slipMultiplier(16), 2)
  assert.equal(slipMultiplier(999), 5)
  // Off the ribbon, the chain lapses.
  ride(
    g,
    () => ['left'],
    () => p!.chain === 0,
    200,
  )
  assert.equal(p!.chain, 0)
}
{
  // Brake halves the pace, turbo nearly doubles it and runs down.
  const g = staged()
  const p = g.bikes[0]!
  place(g, p, 24, 40, 0)
  g.update(hold('b'))
  const pace = p.speed / BRAKE_SPEED
  assert.ok(p.braking)
  g.update(hold('a'))
  assert.ok(Math.abs(p.speed - pace * TURBO_SPEED) < 1e-9, 'turbo')
  assert.equal(p.turbo, TURBO_MAX - 1)
  g.update(hold('a', 'b'))
  assert.ok(!p.boosting && p.braking, 'the brake wins over turbo')
  assert.ok(Math.abs(p.speed - pace * BRAKE_SPEED) < 1e-9)
}
{
  // A whisker: turning a cell short of a ribbon at speed.
  const g = staged()
  const [p, r] = g.bikes
  place(g, p!, 24, 40, 0)
  place(g, r!, 40, 4, 2)
  for (let x = 20; x < 30; x++) g.lay(r!, x, 30)
  ride(
    g,
    (b) => (b.y <= 31 ? ['right'] : []),
    () => p!.dir === 1,
  )
  assert.equal(p!.whiskers, 1, 'a late turn is a whisker')
  // Braked, it is not.
  const h = staged()
  const [q, s] = h.bikes
  place(h, q!, 24, 40, 0)
  place(h, s!, 40, 4, 2)
  for (let x = 20; x < 30; x++) h.lay(s!, x, 30)
  ride(
    h,
    (b) => (b.y <= 31 ? ['right', 'b'] : []),
    () => q!.dir === 1,
  )
  assert.equal(q!.whiskers, 0)
}

// --- the six pickups -----------------------------------------------------------------------------
{
  assert.equal(Object.keys(PICKUPS).length, 6)
  assert.equal(rollPickup(0), 'snip')
  assert.equal(rollPickup(0.999), 'spark')
  assert.equal(rollPickup(0.5, ['bow']), 'bow')
  const collect = (kind: string, setup?: (g: Inner, p: Bike) => void) => {
    const g = staged()
    const p = g.bikes[0]!
    place(g, p, 24, 40, 0)
    setup?.(g, p)
    g.pickups.push({ x: 24, y: 37, kind, life: 600 })
    ride(
      g,
      () => [],
      () => g.pickups.length === 0 || !p.alive,
      200,
    )
    assert.equal(g.pickups.length, 0, `${kind}: ridden over and collected`)
    return { g, p }
  }
  assert.equal(collect('snip').p.snips, 1)
  assert.ok(collect('spool').p.spool > 0)
  {
    // The Spool lays a double-wide ribbon.
    const { g, p } = collect('spool')
    ride(
      g,
      () => [],
      () => p.y <= 30,
    )
    assert.equal(g.cells[idx(25, 32)], p.id, 'the cell beside is laid too')
  }
  {
    const { p } = collect('spark', (_g, b) => (b.turbo = 5))
    assert.equal(p.turbo, TURBO_MAX)
  }
  {
    const { g } = collect('freeze')
    assert.ok(g.freeze > 0, 'the Freeze Frame holds the rivals')
    const r = g.bikes[1]!
    const at = [r.x, r.y]
    g.update(emptyInput())
    assert.deepEqual([r.x, r.y], at)
  }
  {
    // The Eraser takes the tail.
    const { g, p } = collect('eraser', (h, b) => {
      for (let y = 47; y > 40; y--) h.lay(b, 24, y)
      for (let x = 0; x < 40; x++) h.lay(b, x, 47)
    })
    assert.equal(g.cells[idx(24, 47)], 0, 'the oldest cells vanish')
    assert.equal(g.cells[idx(39, 47)], p.id, 'the newer ones stay')
  }
}

// --- the arenas ----------------------------------------------------------------------------------
{
  assert.ok(MIDWAY.length >= 8)
  assert.equal(
    new Set(MIDWAY.map((a) => a.id)).size,
    MIDWAY.length,
    'every arena is distinct',
  )
  const cross = buildArena(MIDWAY.find((a) => a.id === 'crossroads')!)
  assert.equal(cross.terrain[idx(10, 20)], T.PILLAR)
  assert.equal(
    cross.terrain[idx(37, 27)],
    T.PILLAR,
    'the crossroads mirror in both axes',
  )
  const yard = buildArena(MIDWAY.find((a) => a.id === 'switchyard')!)
  assert.equal(yard.terrain[idx(12, 14)], T.PILLAR)
  assert.equal(
    yard.terrain[idx(35, 14)],
    T.PILLAR,
    'the switchyard mirrors across x',
  )
  assert.equal(yard.gates.length > 0, true, 'the switchyard has a beat gate')
  for (const spec of MIDWAY) {
    const arena = buildArena(spec)
    const spawns = [RIDER_SPAWNS[0]!, ...(spec.rivalSpawns ?? RIVAL_SPAWNS)]
    for (const [x, y, d] of spawns.slice(0, spec.crew.length + 1)) {
      for (let k = 0; k < 4; k++) {
        const i = idx(x + [0, 1, 0, -1][d]! * k, y + [-1, 0, 1, 0][d]! * k)
        assert.equal(
          arena.terrain[i],
          T.FLOOR,
          `${spec.id}: a spawn has four clear cells ahead`,
        )
      }
    }
  }
  // Mirrored features: the lamp posts come in fours.
  const lamps = buildArena(MIDWAY.find((a) => a.id === 'lamps')!)
  assert.equal(lamps.terrain[idx(13, 13)], T.PILLAR)
  assert.equal(lamps.terrain[idx(34, 34)], T.PILLAR)
  // The turnabout's pads turn the four ways.
  const turn = buildArena(MIDWAY.find((a) => a.id === 'turnabout')!)
  const pads = new Set<number>()
  for (const t of turn.terrain) if (t >= T.PAD && t < T.PAD + 4) pads.add(t)
  assert.equal(pads.size, 4)
  // Gates open and shut on the beat.
  const house = buildArena(MIDWAY.find((a) => a.id === 'gatehouse')!)
  assert.equal(house.gates.length, 4)
  const gate = house.gates[0]!
  assert.ok(gateOpen(gate, 0) && !gateOpen(gate, gate.open))
}
{
  // A pad turns a bike.
  const g = game()
  g.startRound(4)
  g.ready = 0
  g.cells.fill(0)
  const p = g.bikes[0]!
  for (const r of g.bikes.slice(2)) r.alive = false
  place(g, g.bikes[1]!, 44, 44, 0)
  place(g, p, 12, 16, 0)
  ride(
    g,
    () => [],
    () => p.y <= 12 || !p.alive,
    200,
  )
  assert.equal(p.dir, 1, 'the pad at (12, 12) turns the rider right')
}
{
  // A gate shutting on a bike bumps it.
  const g = game()
  g.startRound(5)
  g.ready = 0
  g.cells.fill(0)
  const p = g.bikes[0]!
  for (const r of g.bikes.slice(2)) r.alive = false
  place(g, g.bikes[1]!, 44, 4, 2)
  place(g, p, 10, 23, 1)
  p.acc = -1e9
  let t = 0
  while (p.alive && t++ < 600) {
    g.freeze = 5
    g.update(emptyInput())
  }
  assert.equal(p.alive, false, 'the gate shuts on a parked bike')
  assert.ok(g.roundTicks < 4 * 30 + 5, 'on its beat')
}

// --- the rival personalities ---------------------------------------------------------------------
{
  const kinds = Object.keys(RIVALS)
  for (const k of ['roamer', 'cutter', 'copycat', 'pacer', 'hugger', 'dasher'])
    assert.ok(kinds.includes(k), k)
  for (const spec of Object.values(RIVALS)) assert.ok(spec.tell && spec.answer)
  // A bare context: an open board.
  const ctx = (target: SteerCtx['target'], rng = mulberry32(1)): SteerCtx => ({
    rng,
    cunning: 1,
    room: (x) => (x <= 0 ? 0 : 90),
    next: (x, y, d) => [x + [0, 1, 0, -1][d]!, y + [-1, 0, 1, 0][d]!],
    solid: (x) => x === 0,
    target,
  })
  // Over ten rolls of the dice, a personality wins out over the odd random turn.
  const mostly = (
    kind: Parameters<typeof steer>[2],
    target: SteerCtx['target'],
    bike: { x: number; y: number; dir: Dir },
    want: Dir,
  ) => {
    let hits = 0
    for (let seed = 1; seed <= 10; seed++)
      if (steer(ctx(target, mulberry32(seed)), bike, kind) === want) hits++
    assert.ok(hits >= 8, `${kind}: ${hits}/10`)
  }
  // The Copycat turns as you turn, mirrored across the middle: you head up, it heads down.
  mostly('copycat', { x: 24, y: 40, dir: 0 }, { x: 24, y: 7, dir: 1 }, 2)
  mostly('copycat', { x: 24, y: 40, dir: 3 }, { x: 24, y: 7, dir: 0 }, 3)
  // The Cutter heads for a point ahead of you.
  mostly('cutter', { x: 24, y: 40, dir: 3 }, { x: 24, y: 20, dir: 1 }, 2)
  // The Pacer closes on your flank.
  mostly('pacer', { x: 30, y: 30, dir: 0 }, { x: 20, y: 30, dir: 0 }, 1)
  // The Hugger would rather ride along a wall than away from it.
  let hugs = 0
  for (let seed = 1; seed <= 10; seed++) {
    const d = steer(
      ctx(null, mulberry32(seed)),
      { x: 1, y: 20, dir: 1 },
      'hugger',
    )
    if (d !== 1) hugs++
  }
  assert.ok(hugs >= 8, `the Hugger turns to hug the wall (${hugs}/10)`)
}
{
  // The Dasher's ribbon leaks: every other cell is open.
  const g = game()
  g.startRound(5)
  g.ready = 0
  const dasher = g.bikes.find((b) => b.kind === 'dasher')!
  for (let t = 0; t < 200; t++) {
    g.lives = 3
    g.update(g.demoInput())
  }
  let laid = 0
  for (const v of g.cells) if (v === dasher.id) laid++
  assert.ok(
    laid > 0 && laid < dasher.laid * 0.6,
    `dotted: ${laid}/${dasher.laid}`,
  )
  // The Pacer rides at its target's speed.
  const h = game()
  h.startRound(4)
  h.ready = 0
  const pacer = h.bikes.find((b) => b.kind === 'pacer')!
  h.update(hold('a'))
  assert.ok(
    Math.abs(pacer.speed - h.bikes[0]!.speed) < 1e-9,
    'the Pacer matches',
  )
}

// --- a deterministic seeded round, and the pilot probe -------------------------------------------
{
  const play = () => {
    const g = game(17)
    for (let t = 0; t < 60 * 40 && !g.over; t++) {
      g.lives = Math.max(g.lives, 2)
      g.update(g.demoInput())
    }
    return JSON.stringify({
      score: g.score,
      level: g.level,
      bikes: g.bikes.map((b) => [b.x, b.y, b.dir, b.alive]),
      cells: Array.from(g.cells).reduce((h, v, i) => (h * 31 + v * i) % 1e9, 7),
    })
  }
  assert.equal(play(), play(), 'the same seed plays the same round')
}
{
  // The attract demo never scores, whatever it does.
  const g = game(7, true)
  for (let t = 0; t < 60 * 120 && !g.over; t++) g.update(emptyInput())
  assert.equal(g.score, 0)
  // The pilot with real lives: every run ends, at a sane pace.
  const ends: number[] = []
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const h = game(seed)
    let t = 0
    for (; t < 60 * 60 * 20 && !h.over; t++) h.update(h.demoInput())
    assert.ok(h.over, `seed ${seed}: the pilot's run ends`)
    assert.ok(h.score > 0)
    ends.push(t)
  }
  const mean = ends.reduce((a, b) => a + b, 0) / ends.length / 60
  assert.ok(mean > 30 && mean < 60 * 10, `runs last ${mean.toFixed(0)} s`)
}

console.log('ribbon riders slice 1: ok')
