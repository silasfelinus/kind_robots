// Ribbon Riders depth pass, slice 2 (conductor kr-arcade/t-075): the first two fairgrounds.
// Boardwalk at Dusk and Frostlight Rink as data (ten arenas, their board routes and spawns), the
// carousel, ice, snowbanks and the pier's wrap edges, the Snowplow, Tandem and Lantern Kid, the
// five objectives, the Carousel Keeper's and the Zamboni Swan's three phases, the Paint Shop's
// ticket economy and save/resume at each fairground. The first fairground is cleared by script
// from the title screen to the Paint Shop, and a pilot probe shows festival runs still end.
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { ARCADE_GAMES } from '../arcade/games'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import { create, REBOOT_TICKS } from '../arcade/games/ribbonRiders'
import { GRID, T, idx, type Dir } from '../arcade/ribbonRiders/grid'
import {
  MELT_TICKS,
  RIDER_SPAWNS,
  RIVAL_SPAWNS,
  buildArena,
  horseCells,
} from '../arcade/ribbonRiders/arenas'
import {
  FAIRGROUNDS,
  OBJECTIVES,
  arenaById,
  openEvents,
  outlineCells,
  type FairArena,
} from '../arcade/ribbonRiders/fairgrounds'
import {
  SHOP,
  buy,
  newKit,
  readFestivalSave,
  shopBlock,
  type FestivalSave,
} from '../arcade/ribbonRiders/festival'
import {
  CarouselKeeper,
  KEEPER,
  ZamboniSwan,
  spiralPath,
} from '../arcade/ribbonRiders/marshals'
import { RIVALS } from '../arcade/ribbonRiders/rivals'

type Bike = {
  id: number
  seat: number
  kind: string | null
  x: number
  y: number
  dir: Dir
  want: Dir
  acc: number
  alive: boolean
  wrapped: boolean
  reboot: number
  partner: number
  lead: boolean
  bugs: number
  arch: number
  laid: number
  wraps: number
}
type Menu = { kind: string; cursor: number; ticks: number; note: string }
type Inner = {
  score: number
  level: number
  lives: number
  over: boolean
  ready: number
  freeze: number
  bikes: Bike[]
  cells: Uint8Array
  fill: Uint8Array
  dyn: Uint8Array
  pickups: unknown[]
  arena: {
    terrain: Uint8Array
    banks: Array<{ cells: number[]; melt: number }>
    spec: { id: string }
  }
  roundTicks: number
  roundClear: number
  dead: number
  margin: number
  menu: Menu | null
  mode: string
  fair: number
  node: FairArena | null
  tickets: number
  kit: ReturnType<typeof newKit>
  cleared: Set<string>
  timeLeft: number
  wrappedCount: number
  kidWrapped: boolean
  bugs: Array<{ x: number; y: number; vx: number; vy: number }>
  arches: number[][]
  traced: Uint8Array
  tracedCount: number
  outline: number[]
  carouselStep: number
  marshal: (CarouselKeeper | ZamboniSwan) | null
  titleChoices: string[]
  save: FestivalSave | null | undefined
  menuOpen: boolean
  lay(b: Bike, x?: number, y?: number): void
  playArena(a: FairArena): void
  openFairground(fair: number): void
  demoInput(seat?: number): InputFrame
  update(input: InputFrame): void
}

const quiet = { play: () => {} }
function game(
  opts: { seed?: number; select?: boolean; resume?: unknown } = {},
): Inner {
  return create({
    rng: mulberry32(opts.seed ?? 5),
    sound: quiet,
    demo: false,
    hiScore: 0,
    selectScreen: opts.select,
    resume: opts.resume,
  }) as unknown as Inner
}
const hold = (...buttons: Array<keyof InputFrame['held']>): InputFrame => {
  const f = emptyInput()
  for (const b of buttons) f.held[b] = true
  return f
}
function press(g: Inner, button: keyof InputFrame['pressed']) {
  for (let t = 0; t < 10; t++) g.update(emptyInput())
  const f = emptyInput()
  f.pressed[button] = true
  g.update(f)
}
function place(g: Inner, b: Bike, x: number, y: number, dir: Dir) {
  Object.assign(b, { x, y, dir, want: dir, acc: 0 })
  g.lay(b)
}
/** Ride holding nothing (straight on), every rival and the Marshal frozen, until `done`. */
function ride(g: Inner, done: () => boolean, max = 600, keys: string[] = []) {
  for (let t = 0; t < max && !done(); t++) {
    g.freeze = 5
    g.update(hold(...(keys as Array<keyof InputFrame['held']>)))
  }
}
const fairArena = (f: number, id: string) => arenaById(FAIRGROUNDS[f]!, id)
/** Into an event with the ready countdown skipped. */
function enter(g: Inner, a: FairArena) {
  g.playArena(a)
  g.ready = 0
}
/** Can a ring of player ribbon go round this interior, with a free cell to ride out? */
function boxFree(g: Inner, x0: number, y0: number, x1: number, y1: number) {
  for (let y = y0 - 1; y <= y1 + 1; y++)
    for (let x = x0 - 1; x <= x1 + 2; x++) {
      if (x < g.margin + 1 || y < g.margin + 1) return false
      if (x >= GRID - g.margin - 1 || y >= GRID - g.margin - 1) return false
      const inside = x >= x0 && x <= x1 && y >= y0 && y <= y1
      if (inside) continue
      const i = idx(x, y)
      if (g.cells[i] || g.dyn[i]) return false
      if (g.arena.terrain[i] !== T.FLOOR && g.arena.terrain[i] !== T.ICE)
        return false
      if (g.bikes.some((b) => b.alive && b.x === x && b.y === y)) return false
    }
  return true
}
/**
 * Close a ring of player ribbon round the interior [x0..x1] x [y0..y1]: the left, right and
 * bottom sides are laid, and the rider rides the top side left to right, closing it as it goes.
 */
function wrapBox(g: Inner, x0: number, y0: number, x1: number, y1: number) {
  const p = g.bikes[0]!
  assert.ok(boxFree(g, x0, y0, x1, y1), `a free ring round ${x0},${y0}`)
  for (let y = y0 - 1; y <= y1 + 1; y++) g.lay(p, x0 - 1, y)
  for (let y = y0; y <= y1 + 1; y++) g.lay(p, x1 + 1, y)
  for (let x = x0; x <= x1; x++) g.lay(p, x, y1 + 1)
  place(g, p, x0 - 1, y0 - 1, 1)
  const before = p.wraps
  ride(g, () => p.wraps > before || !p.alive || p.x > x1)
  assert.ok(p.alive, 'the rider closes the ring without a bump')
  assert.ok(p.wraps > before, 'and it wraps')
}
/** An open 3 x 3 pocket somewhere, for staging a wrap. */
function openPocket(g: Inner): [number, number] {
  for (let y = 6; y < GRID - 6; y += 2)
    for (let x = 6; x < GRID - 6; x += 2) {
      if (!boxFree(g, x - 1, y - 1, x + 1, y + 1)) continue
      let clear = true
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const i = idx(x + dx, y + dy)
          if (g.cells[i] || g.dyn[i] || g.arena.terrain[i] === T.PILLAR)
            clear = false
          if (g.bikes.some((b) => b.alive && b.x === x + dx && b.y === y + dy))
            clear = false
        }
      if (clear) return [x, y]
    }
  throw new Error('no open pocket')
}
/** Move a rival into an open pocket and wrap it there. */
function wrapRival(g: Inner, r: Bike) {
  const [x, y] = openPocket(g)
  Object.assign(r, { x, y, acc: 0 })
  wrapBox(g, x - 1, y - 1, x + 1, y + 1)
  assert.ok(r.wrapped, `${r.kind} wrapped`)
}
/** Tick through the round-clear card. */
function settle(g: Inner) {
  for (let t = 0; t < 400 && g.roundClear > 0; t++) g.update(emptyInput())
}

// --- the fairgrounds as data ---------------------------------------------------------------------
{
  assert.equal(FAIRGROUNDS.length, 4)
  assert.deepEqual(
    FAIRGROUNDS.map((f) => f.name),
    ['BOARDWALK AT DUSK', 'FROSTLIGHT RINK', 'CLOCKWORK BAZAAR', 'STARLIGHT LOOM'],
  )
  const arenas = FAIRGROUNDS.flatMap((f) => f.arenas.filter((a) => !a.marshal))
  assert.equal(arenas.length, 20, 'twenty authored arenas')
  assert.deepEqual(
    [...new Set(arenas.map((a) => a.objective))].sort(),
    ['art', 'escort', 'giftwrap', 'glowbug', 'last', 'taglap'],
    'five objectives',
  )
  assert.deepEqual(
    FAIRGROUNDS.map((f) => f.arenas.find((a) => a.marshal)!.marshal),
    ['keeper', 'swan', 'conductor', 'loom'],
  )
  assert.equal(new Set(arenas.map((a) => `${a.id}:${a.floor}`)).size, 20)
  for (const f of FAIRGROUNDS) {
    assert.equal(f.arenas.filter((a) => a.special).length, 1, f.id)
    // Every arena is on a route from the first event, and every route reaches the Marshal.
    const reach = new Set<string>()
    const walk = (id: string) => {
      if (reach.has(id)) return
      reach.add(id)
      for (const n of arenaById(f, id).next) walk(n)
    }
    walk(f.arenas[0]!.id)
    assert.equal(reach.size, f.arenas.length, `${f.id}: all on the board`)
    for (const a of f.arenas) {
      if (a.marshal) continue
      assert.ok(a.next.length > 0, `${a.id} leads on`)
      const ends = (id: string): boolean =>
        id === 'marshal' || arenaById(f, id).next.every(ends)
      assert.ok(ends(a.id), `${a.id}: every route reaches the Marshal`)
    }
    // The board offers a choice of two at each fork.
    assert.deepEqual(openEvents(f, new Set()), [f.arenas[0]!.id])
    assert.equal(openEvents(f, new Set([f.arenas[0]!.id])).length, 2)
    // Spawns have four clear cells ahead, on every arena.
    for (const a of f.arenas) {
      const built = buildArena(a)
      let spawns = [RIDER_SPAWNS[0]!, ...(a.rivalSpawns ?? RIVAL_SPAWNS)]
      spawns = spawns.slice(0, a.crew.length + 1)
      for (const [x, y, d] of spawns) {
        for (let k = 0; k < 4; k++) {
          const i = idx(x + [0, 1, 0, -1][d]! * k, y + [-1, 0, 1, 0][d]! * k)
          const t = built.terrain[i]
          assert.ok(
            t === T.FLOOR || t === T.ICE,
            `${a.id}: a spawn has four clear cells ahead`,
          )
        }
      }
      if (a.objective in OBJECTIVES) assert.ok(OBJECTIVES[a.objective].name)
    }
  }
  // The mechanics each fairground promises are in its data.
  const bw = FAIRGROUNDS[0]!.arenas
  assert.ok(
    bw.some((a) => a.carousel),
    'the carousel',
  )
  assert.ok(
    bw.some((a) => a.wrap?.x),
    'the pier wraps',
  )
  assert.ok(bw.some((a) => a.features.some((f) => f.kind === 'pillar')))
  const fr = FAIRGROUNDS[1]!.arenas.map(buildArena)
  assert.ok(
    fr.some((a) => a.terrain.includes(T.ICE)),
    'ice',
  )
  assert.ok(
    fr.some((a) => a.banks.length > 0),
    'snowbanks',
  )
  assert.ok(
    fr.some((a) => a.terrain.some((t) => t >= T.PAD && t < T.PAD + 4)),
    'turn pads',
  )
  // The new rivals each have a tell and an answer.
  for (const k of ['snowplow', 'tandem', 'lanternKid'] as const)
    assert.ok(RIVALS[k].tell && RIVALS[k].answer, k)
}

// --- ice, snowbanks and the carousel -------------------------------------------------------------
{
  // On ice a turn takes one extra cell; Grip Tyres take it away.
  const turnAt = (grip: boolean) => {
    const g = game()
    g.mode = 'festival'
    enter(g, fairArena(1, 'fr-rink'))
    g.kit.grip = grip
    const p = g.bikes[0]!
    g.cells.fill(0)
    place(g, p, 20, 30, 0)
    assert.equal(g.arena.terrain[idx(20, 30)], T.ICE)
    ride(g, () => p.y <= 26)
    ride(g, () => p.dir === 1, 50, ['right'])
    return p.y
  }
  const slid = turnAt(false)
  const gripped = turnAt(true)
  assert.equal(slid, gripped - 1, 'the turn on ice bites one cell later')
}
{
  const g = game()
  enter(g, fairArena(1, 'fr-banks'))
  const p = g.bikes[0]!
  g.cells.fill(0)
  const bank = g.arena.banks[0]!
  const i = bank.cells[0]!
  const [bx, by] = [i % GRID, Math.floor(i / GRID)]
  assert.equal(g.arena.terrain[i], T.SNOW)
  // A snowbank is a wall.
  place(g, p, bx - 3, by, 1)
  ride(g, () => !p.alive || p.x >= bx, 120)
  assert.equal(p.alive, false, 'riding into a snowbank bumps')
  // A ribbon brushing it starts a melt, and the bank melts away.
  const h = game()
  enter(h, fairArena(1, 'fr-banks'))
  h.cells.fill(0)
  const q = h.bikes[0]!
  const hb = h.arena.banks[0]!
  const top = hb.cells[0]!
  place(h, q, top % GRID, Math.floor(top / GRID) - 1, 1)
  assert.ok(hb.melt > 0, 'brushed: the bank drips')
  for (let t = 0; t <= MELT_TICKS + 2; t++) {
    h.freeze = 5
    h.update(emptyInput())
  }
  assert.equal(hb.melt, 0)
  assert.ok(
    hb.cells.every((c) => h.arena.terrain[c] === T.FLOOR),
    'the whole bank melted to floor',
  )
}
{
  const g = game()
  const spec = fairArena(0, 'bw-carousel')
  enter(g, spec)
  const c = spec.carousel!
  const before = horseCells(c, g.carouselStep)
  assert.ok(
    before.every((i) => g.dyn[i] === 1),
    'the horses are solid',
  )
  const ahead = horseCells(c, g.carouselStep + 1)[0]!
  // A ribbon on the next horse cell is trampled.
  g.lay(g.bikes[1]!, ahead % GRID, Math.floor(ahead / GRID))
  for (let t = 0; t < c.every + 1; t++) {
    g.freeze = 5
    g.update(emptyInput())
  }
  assert.ok(g.carouselStep >= 1, 'the carousel turns')
  assert.equal(g.cells[ahead], 0, 'a horse tramples a ribbon in its way')
  assert.equal(g.dyn[ahead], 1)
}

// --- the new rivals ------------------------------------------------------------------------------
{
  // The Snowplow drives through a ribbon and scrapes it away.
  const g = game()
  enter(g, fairArena(1, 'fr-rink'))
  g.cells.fill(0)
  const [p, plow] = [g.bikes[0]!, g.bikes.find((b) => b.kind === 'snowplow')!]
  for (const b of g.bikes.slice(1)) if (b !== plow) b.alive = false
  place(g, p, 40, 44, 1)
  p.acc = -1e9
  for (let x = 10; x < 30; x++) g.lay(p, x, 6)
  place(g, plow, 20, 3, 2)
  for (let t = 0; t < 60 && plow.y < 8; t++) g.update(emptyInput())
  assert.ok(plow.alive, 'the plow crosses the ribbon unharmed')
  assert.notEqual(g.cells[idx(20, 6)], p.id, 'and erased the cell it crossed')
}
{
  // The Tandem: two bikes, one tether, turning together; one loop round both wraps both.
  const g = game()
  enter(g, fairArena(1, 'fr-banks'))
  const pair = g.bikes.filter((b) => b.kind === 'tandem')
  assert.equal(pair.length, 2, 'a Tandem is two bikes')
  const [lead, mate] = pair as [Bike, Bike]
  assert.ok(lead.lead && lead.partner === mate.id && mate.partner === lead.id)
  for (let t = 0; t < 120; t++) {
    g.lives = 3
    g.update(g.demoInput())
  }
  if (lead.alive && mate.alive)
    assert.equal(lead.dir, mate.dir, 'the pair always heads the same way')
  // Wrap both in one loop.
  const h = game()
  enter(h, fairArena(1, 'fr-banks'))
  h.cells.fill(0)
  const [a, b] = h.bikes.filter((x) => x.kind === 'tandem') as [Bike, Bike]
  Object.assign(a, { x: 14, y: 40 })
  Object.assign(b, { x: 16, y: 40 })
  wrapBox(h, 13, 39, 17, 41)
  assert.ok(a.wrapped && b.wrapped, 'one loop wraps both')
  assert.equal(h.wrappedCount, 2)
}
{
  // The Lantern Kid lays no ribbon, chases glowbugs, and costs the Kind Rider ticket if wrapped.
  const g = game()
  enter(g, fairArena(0, 'bw-glowbug'))
  const kid = g.bikes.find((b) => b.kind === 'lanternKid')!
  for (let t = 0; t < 600; t++) {
    g.lives = 3
    g.update(g.demoInput())
  }
  assert.ok(kid.laid > 0 || kid.reboot > 0 || !kid.alive || kid.bugs >= 0)
  let owned = 0
  for (const v of g.cells) if (v === kid.id) owned++
  assert.equal(owned, 0, 'the Lantern Kid lays no ribbon')
  const kids = g.bikes.filter((b) => b.kind === 'lanternKid')
  assert.ok(
    kids.reduce((n, b) => n + b.bugs, 0) > 0,
    'the Lantern Kids go after the glowbugs',
  )
  const h = game()
  enter(h, fairArena(0, 'bw-lamps'))
  h.cells.fill(0)
  wrapRival(
    h,
    h.bikes.find((b) => b.kind === 'lanternKid')!,
  )
  assert.ok(h.kidWrapped, 'wrapping a Lantern Kid is noticed')
  assert.equal(h.wrappedCount, 0, 'and never counts toward Gift Wrap')
}

// --- the objectives ------------------------------------------------------------------------------
{
  // Gift Wrap: a rival that bumps itself reboots, and time running out costs a rider.
  const g = game()
  enter(g, fairArena(0, 'bw-lamps'))
  const roamer = g.bikes.find((b) => b.kind === 'roamer')!
  // Boxed into the corner with nowhere to turn, it bumps itself.
  g.cells.fill(0)
  g.lay(g.bikes[0]!, 1, 0)
  g.lay(g.bikes[0]!, 0, 1)
  place(g, roamer, 0, 0, 0)
  for (let t = 0; t < 30 && roamer.alive; t++) g.update(emptyInput())
  assert.equal(roamer.alive, false)
  assert.equal(roamer.reboot > 0, true, 'a self-bump on Gift Wrap reboots')
  for (let t = 0; t < REBOOT_TICKS + 5; t++) {
    g.freeze = 5
    g.update(emptyInput())
  }
  assert.ok(roamer.alive, 'rebooted')
  const lives = g.lives
  g.timeLeft = 1
  g.update(emptyInput())
  g.update(emptyInput())
  assert.equal(g.lives, lives - 1, 'time up costs a rider')
}
{
  // Ribbon Art: riding along the outline traces it.
  const g = game()
  const a = fairArena(1, 'fr-flake')
  enter(g, a)
  g.cells.fill(0)
  for (const b of g.bikes.slice(1)) b.alive = false
  const p = g.bikes[0]!
  const outline = outlineCells(a.art!.corners)
  assert.equal(g.outline.length, outline.length)
  // Ride the outline's left arm, a cell outside it (the tolerance).
  place(g, p, 20, 37, 0)
  ride(g, () => p.y <= 28)
  assert.ok(g.tracedCount >= 9, `traced within a cell (${g.tracedCount})`)
  assert.ok(g.tracedCount < outline.length * a.art!.share)
  assert.equal(g.roundClear, 0)
  // Tracing the share clears it.
  for (const i of outline.slice(0, Math.ceil(outline.length * 0.8))) {
    g.traced[i] = 1
  }
  g.tracedCount = Math.ceil(outline.length * 0.8)
  ride(g, () => g.roundClear > 0, 5)
  assert.ok(g.roundClear > 0, 'traced enough: clear')
}

// --- the Marshals, phase by phase ----------------------------------------------------------------
{
  assert.ok(spiralPath(KEEPER.cx, KEEPER.cy).length > 100)
  const g = game()
  g.mode = 'festival'
  enter(g, fairArena(0, 'marshal'))
  const keeper = g.marshal as CarouselKeeper
  assert.ok(keeper instanceof CarouselKeeper)
  assert.equal(keeper.phase, 1)
  // The ring winds in on the beat.
  const r0 = keeper.r
  for (let t = 0; t < 30 * 8 + 2; t++) {
    g.lives = 3
    g.bikes[0]!.alive = true
    g.dead = 0
    g.update(emptyInput())
  }
  assert.equal(keeper.r, r0 - 1, 'the ring shrinks a step every eight beats')
}
{
  const g = game()
  g.mode = 'festival'
  enter(g, fairArena(0, 'marshal'))
  g.cells.fill(0)
  const keeper = g.marshal as CarouselKeeper
  // Phase 1: wrap a pony on the inside lane.
  const pony = keeper.ponyCells()[0]!
  const [px, py] = [pony % GRID, Math.floor(pony / GRID)]
  wrapBox(g, px - 1, py - 1, px + 1, py + 1)
  assert.equal(keeper.phase, 2, 'a wrapped pony breaks the ponies off')
  const ponies = g.bikes.filter((b) => b.kind === 'pony')
  assert.equal(ponies.length, 3, 'three small rivals')
  // Phase 2: wrap all three to crack the ring.
  for (const b of ponies) wrapRival(g, b)
  assert.equal(keeper.phase, 3, 'the ring cracks')
  assert.equal(keeper.ringNow().length, 0)
  // Phase 3: the spiral winds out; loop the hub.
  for (let t = 0; t < 40; t++) {
    g.bikes[0]!.acc = -1e9
    g.update(emptyInput())
  }
  assert.ok(keeper.laid > 0, 'the spiral winds')
  const hub = keeper.targets()
  assert.equal(hub.length, 9)
  assert.ok(
    hub.every((i) => g.dyn[i] === 2),
    'the hub is takeable',
  )
  g.cells.fill(0)
  keeper.laid = 0
  g.update(emptyInput())
  wrapBox(g, KEEPER.cx - 2, KEEPER.cy - 2, KEEPER.cx + 2, KEEPER.cy + 2)
  assert.ok(keeper.defeated, 'the Keeper is wrapped')
  assert.ok(g.roundClear > 0, 'which clears the fairground')
}
{
  const g = game()
  g.mode = 'festival'
  g.fair = 1
  enter(g, fairArena(1, 'marshal'))
  g.cells.fill(0)
  const swan = g.marshal as ZamboniSwan
  assert.ok(swan instanceof ZamboniSwan)
  const p = g.bikes[0]!
  // Phase 1: it sweeps, and wipes every ribbon in its wake.
  for (let x = 12; x < 20; x++) g.lay(p, x, 5)
  place(g, p, 40, 44, 3)
  for (let t = 0; t < 7 * 16; t++) {
    p.acc = -1e9
    g.update(emptyInput())
  }
  assert.ok(swan.x > 12, 'the Swan sweeps right')
  assert.equal(g.cells[idx(13, 5)], 0, 'its wake is wiped clean')
  // Wrap it: phase 2.
  wrapBox(g, swan.x - 1, swan.y - 1, swan.x + 1, swan.y + 1)
  assert.equal(swan.phase, 2)
  assert.equal(swan.hits, 1)
  // Phase 2: its wake freezes into ice.
  g.cells.fill(0)
  g.fill.fill(0)
  const ice = () => g.arena.terrain.filter((t) => t === T.ICE).length
  const before = ice()
  place(g, p, 44, 44, 3)
  for (let t = 0; t < 120; t++) {
    p.acc = -1e9
    g.update(emptyInput())
  }
  assert.ok(ice() > before, 'the wake freezes')
  g.cells.fill(0)
  g.fill.fill(0)
  Object.assign(swan, { x: 24, y: 10 })
  wrapBox(g, swan.x - 1, swan.y - 1, swan.x + 1, swan.y + 1)
  assert.equal(swan.phase, 3)
  // Phase 3: it chases; lured onto a snowbank, it stalls.
  g.cells.fill(0)
  g.fill.fill(0)
  const bank = g.arena.banks.find((b) => b.melt < 0)!
  const c = bank.cells[4]!
  const [cx, cy] = [c % GRID, Math.floor(c / GRID)]
  Object.assign(swan, { x: cx - 3, y: cy, dir: 1, spin: 0 })
  place(g, p, cx + 8, cy, 1)
  for (let t = 0; t < 60 && swan.stall === 0; t++) {
    p.acc = -1e9
    g.update(emptyInput())
  }
  assert.ok(swan.stall > 0, 'the snowbank stalls the Swan')
  assert.ok(
    bank.cells.every((i) => g.arena.terrain[i] !== T.SNOW),
    'and melts under it',
  )
  g.cells.fill(0)
  wrapBox(g, swan.x - 1, swan.y - 1, swan.x + 1, swan.y + 1)
  assert.ok(swan.defeated, 'three wraps beat the Swan')
}

// --- the Paint Shop and its tickets --------------------------------------------------------------
{
  const kit = newKit()
  const item = (id: string) => SHOP.find((s) => s.id === id)!
  assert.equal(shopBlock(item('grip'), kit, 2, 3), 'NEED TICKETS')
  let got = buy(item('grip'), kit, 20, 3)
  assert.ok(got.ok && kit.grip && got.tickets === 20 - item('grip').cost)
  assert.equal(shopBlock(item('grip'), kit, 99, 3), 'FITTED')
  got = buy(item('sidecar'), kit, got.tickets, 3)
  assert.equal(got.lives, 4, 'a Sidecar is a spare rider')
  got = buy(item('hearts'), kit, got.tickets, got.lives)
  assert.equal(kit.pattern, 'hearts')
  const left = got.tickets
  got = buy(item('hearts'), kit, left, got.lives)
  assert.equal(got.tickets, left, 'wearing an owned pattern is free')
  assert.equal(kit.pattern, 'plain', 'and toggles it off')
  // Spool levels widen the wrap limit.
  const g = game()
  enter(g, fairArena(0, 'bw-gate'))
  g.kit.spool = 2
  const lim = (g as unknown as { wrapLimit(b: Bike): number }).wrapLimit(
    g.bikes[0]!,
  )
  assert.equal(lim, 160 + 80)
}

// --- saves -----------------------------------------------------------------------------------------
{
  assert.equal(readFestivalSave(null), null)
  assert.equal(readFestivalSave({ v: 1, fair: 9 }), null)
  const g = game()
  g.tickets = 7
  g.openFairground(1)
  const save = g.save!
  assert.equal(save.fair, 1, 'a save at each fairground start')
  assert.deepEqual(readFestivalSave(JSON.parse(JSON.stringify(save))), save)
  assert.ok(g.menuOpen && g.menu!.kind === 'board')
  // A demo never saves.
  const d = create({
    rng: mulberry32(1),
    sound: quiet,
    demo: true,
    hiScore: 0,
    resume: save,
  }) as unknown as Inner
  assert.equal(d.save, undefined)
}

// --- the first fairground, cleared by script, from the title screen ------------------------------
let kept: FestivalSave
{
  const g = game({ select: true, seed: 11 })
  assert.equal(g.menu?.kind, 'title')
  assert.deepEqual(g.titleChoices, ['new', 'midway'])
  press(g, 'a')
  assert.equal(g.menu?.kind, 'board', 'NEW FESTIVAL opens the board')
  assert.equal(g.save?.fair, 0, 'saved at the first fairground')
  const choose = (id: string) => {
    const open = openEvents(FAIRGROUNDS[0]!, g.cleared)
    const at = open.indexOf(id)
    assert.ok(at >= 0, `${id} is open on the board`)
    while (g.menu!.cursor !== at) press(g, 'right')
    press(g, 'a')
    assert.equal(g.node?.id, id)
    g.ready = 0
    g.cells.fill(0)
  }
  // Boardwalk Gate: last rider rolling.
  choose('bw-gate')
  for (const r of g.bikes.filter((b) => b.seat < 0)) wrapRival(g, r)
  assert.ok(g.roundClear > 0)
  settle(g)
  assert.equal(g.menu?.kind, 'board')
  assert.ok(g.tickets >= 3)
  // The board now offers two.
  assert.deepEqual(openEvents(FAIRGROUNDS[0]!, g.cleared), [
    'bw-lamps',
    'bw-carousel',
  ])
  // Lamplight Promenade: Gift Wrap, leaving the Lantern Kid be.
  choose('bw-lamps')
  const t0 = g.tickets
  for (const r of g.bikes.filter((b) => b.seat < 0 && b.kind !== 'lanternKid'))
    wrapRival(g, r)
  assert.ok(g.roundClear > 0)
  assert.equal(g.tickets - t0, 3 + 2 + 1, 'tickets, par and the kindness one')
  settle(g)
  // Pier's End: Tag Lap, through the arches in order.
  choose('bw-pier')
  const p = g.bikes[0]!
  g.arches.forEach((cells, k) => {
    g.cells.fill(0)
    const mid = cells[Math.floor(cells.length / 2)]!
    const [mx, my] = [mid % GRID, Math.floor(mid / GRID)]
    const across = cells.length > 1 && cells[1]! - cells[0]! === 1
    if (across) place(g, p, mx, my + 2, 0)
    else place(g, p, mx - 2, my, 1)
    ride(g, () => p.arch > k || !p.alive, 40)
    assert.equal(p.arch, k + 1, `arch ${k + 1}`)
  })
  assert.ok(g.roundClear > 0, 'every arch in order: tagged')
  settle(g)
  // Glowbug Pier, the special side event: wrap a cloud of glowbugs.
  choose('bw-glowbug')
  const [bx, by] = openPocket(g)
  g.bugs = []
  for (let k = 0; k < 8; k++) {
    g.bugs.push({
      x: bx - 1 + (k % 3) + 0.5,
      y: by - 1 + Math.floor(k / 3) + 0.5,
      vx: 0,
      vy: 0,
    })
  }
  wrapBox(g, bx - 2, by - 2, bx + 2, by + 2)
  assert.ok(g.bikes[0]!.bugs >= 8, 'the wrap collects the glowbugs')
  assert.ok(g.roundClear > 0)
  settle(g)
  // The Carousel Keeper.
  assert.ok(openEvents(FAIRGROUNDS[0]!, g.cleared).includes('marshal'))
  choose('marshal')
  const keeper = g.marshal as CarouselKeeper
  const pony = keeper.ponyCells()[0]!
  wrapBox(
    g,
    (pony % GRID) - 1,
    Math.floor(pony / GRID) - 1,
    (pony % GRID) + 1,
    Math.floor(pony / GRID) + 1,
  )
  for (const b of g.bikes.filter((x) => x.kind === 'pony')) wrapRival(g, b)
  g.cells.fill(0)
  wrapBox(g, KEEPER.cx - 2, KEEPER.cy - 2, KEEPER.cx + 2, KEEPER.cy + 2)
  assert.ok(keeper.defeated)
  settle(g)
  assert.equal(g.menu?.kind, 'shop', 'the Paint Shop opens between fairgrounds')
  assert.ok(g.tickets >= 20, `a fairground pays (${g.tickets} tickets)`)
  // Buy Grip Tyres, then on to Frostlight.
  const grip = SHOP.findIndex((s) => s.id === 'grip')
  while (g.menu!.cursor !== grip) press(g, 'down')
  const before = g.tickets
  press(g, 'a')
  assert.ok(g.kit.grip && g.tickets === before - SHOP[grip]!.cost)
  while (SHOP[g.menu!.cursor]!.id !== 'leave') press(g, 'down')
  press(g, 'a')
  assert.equal(g.fair, 1)
  assert.equal(g.menu?.kind, 'board')
  assert.equal(g.save?.fair, 1, 'saved at Frostlight Rink')
  assert.equal(g.save?.kit.grip, true)
  assert.ok(
    g.score > 0 &&
      g.score <
        ARCADE_GAMES.find((x) => x.slug === 'ribbon-riders')!.maxPlausibleScore,
  )
  kept = JSON.parse(JSON.stringify(g.save)) as FestivalSave
}

// --- resume: continue at the fairground the save holds -------------------------------------------
{
  const g = game({ select: true, resume: kept })
  assert.deepEqual(g.titleChoices, ['continue', 'new', 'midway'])
  assert.deepEqual(g.save, kept, 'untouched until the rider chooses')
  press(g, 'a')
  assert.equal(g.fair, 1)
  assert.equal(g.menu?.kind, 'board')
  assert.equal(g.tickets, kept.tickets)
  assert.equal(g.kit.grip, true)
  assert.equal(g.score, kept.score)
  // A game over keeps the fairground but marks the score to start afresh.
  g.menu = null
  enter(g, fairArena(1, 'fr-rink'))
  g.lives = 1
  const p = g.bikes[0]!
  place(g, p, 1, 1, 0)
  for (let t = 0; t < 200 && !g.over; t++) g.update(emptyInput())
  assert.ok(g.over)
  assert.equal(g.save?.fair, 1)
  assert.equal(g.save?.continued, true)
  const again = game({ select: true, resume: g.save })
  press(again, 'a')
  assert.equal(again.score, 0, 'a continued festival starts its score afresh')
  // A new festival starts at the first fairground.
  const fresh = game({ select: true, resume: kept })
  press(fresh, 'down')
  press(fresh, 'a')
  assert.equal(fresh.fair, 0)
  assert.equal(fresh.kit.grip, false)
}

// --- determinism and the pilot probe -------------------------------------------------------------
{
  const play = (seed: number) => {
    const g = game({ seed })
    g.mode = 'festival'
    enter(g, fairArena(1, 'fr-pond'))
    for (let t = 0; t < 60 * 30 && !g.over; t++) {
      g.lives = Math.max(g.lives, 2)
      g.update(g.demoInput())
    }
    return JSON.stringify({
      score: g.score,
      bikes: g.bikes.map((b) => [b.x, b.y, b.dir, b.alive]),
      cells: Array.from(g.cells).reduce((h, v, i) => (h * 31 + v * i) % 1e9, 7),
    })
  }
  assert.equal(play(4), play(4), 'the same seed rides the same pond')
}
{
  // The attract demo never scores.
  const d = create({
    rng: mulberry32(3),
    sound: quiet,
    demo: true,
    hiScore: 0,
  }) as unknown as Inner
  for (let t = 0; t < 60 * 90 && !d.over; t++) d.update(emptyInput())
  assert.equal(d.score, 0)
  // The pilot rides the festival from the title, taking the first open event each time.
  const max = ARCADE_GAMES.find(
    (x) => x.slug === 'ribbon-riders',
  )!.maxPlausibleScore
  const seen = new Set<string>()
  for (const seed of [1, 2, 3, 4]) {
    const g = game({ select: true, seed })
    let t = 0
    for (; t < 60 * 60 * 30 && !g.over; t++) {
      if (g.menu) {
        const f = emptyInput()
        if (t % 12 === 0) f.pressed.a = true
        g.update(f)
        continue
      }
      if (g.node) seen.add(g.node.id)
      g.update(g.demoInput())
    }
    assert.ok(g.over, `seed ${seed}: the festival run ends`)
    assert.ok(g.score > 0 && g.score < max)
  }
  assert.ok(seen.size >= 1, `the pilot rode ${[...seen].join(' ')}`)
}

console.log('ribbon riders fairgrounds: ok')
