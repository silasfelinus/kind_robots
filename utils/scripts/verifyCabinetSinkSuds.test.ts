// Sink Suds depth pass, slice 1 (conductor kr-arcade/t-043): basins as data with a physics hook
// per shape, the grime layer and its clean percentage, growth spent on soap shots, trapping and
// chains, beatable brushes, the sponge and the Drain Gremlin. Each rule is pinned on a staged
// basin; a pilot probe shows runs still end.
//
//   npx tsx utils/scripts/verifyCabinetSinkSuds.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import {
  BASINS,
  BASIN_PLAYLIST,
  CHAIN_TICKS,
  GROWTH_PER_STAGE,
  MAX_STAGE,
  SHOT_STAGE,
  TRAP_POINTS,
  basinForLevel,
  create,
} from '../arcade/games/sinkSuds'
import type { Bubble, Pest } from '../arcade/games/sinkSuds'
import {
  basinBounds,
  carry,
  clearPath,
  dialAt,
  flowAt,
  insideBasin,
  keepInside,
  laneDir,
} from '../arcade/sinkSuds/basins'
import { CELL, Grime, SQUEAKY } from '../arcade/sinkSuds/grime'
import { GURGLE_TICKS, PESTS, TIP_TICKS } from '../arcade/sinkSuds/pests'

type Inner = {
  score: number
  level: number
  lives: number
  over: boolean
  tick: number
  bubbles: Bubble[]
  pests: Pest[]
  mess: Array<{ x: number; y: number; kind: string; r: number }>
  shots: Array<{ x: number; y: number; vx: number; vy: number; life: number }>
  grime: Grime
  chain: number
  chainTimer: number
  draining: number
  basin: (typeof BASINS)[keyof typeof BASINS]
  update(input: InputFrame): void
  demoInput(): InputFrame
  startLevel(level: number): void
}

const quiet = { play: () => {} }
function game(seed = 1, demo = false): Inner {
  const g = create({
    rng: mulberry32(seed),
    sound: quiet,
    demo,
    hiScore: 0,
  }) as unknown as Inner & { menu: unknown }
  // Straight into the campaign, past the mode menu (slice 4 has its own menu tests).
  g.menu = null
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
/** A basin cleared of pests and mess, so one rule can be staged. */
function staged(level = 1, seed = 1): Inner {
  const g = game(seed)
  if (level !== 1) g.startLevel(level)
  g.pests = []
  g.mess = []
  const b = g.bubbles[0]!
  b.invuln = 0
  return g
}
function pest(
  kind: Pest['kind'],
  x: number,
  y: number,
  extra: Partial<Pest> = {},
): Pest {
  return {
    kind,
    x,
    y,
    vx: 0,
    vy: 0,
    heading: 0,
    turn: 999,
    t: 0,
    state: 'roam',
    trap: 0,
    target: null,
    size: kind === 'lint' ? 5 : 0,
    segs: [],
    ...extra,
  }
}

// --- basins as data ------------------------------------------------------------------------------
{
  const shapes = new Set(Object.values(BASINS).map((b) => b.shape))
  assert.deepEqual(
    [...shapes].filter((x) => x !== 'bowl').sort(),
    ['conveyor', 'double', 'drum', 'oval', 'tank', 'tub'],
    "six basin shapes (plus the later rooms' bowls)",
  )
  assert.equal(
    new Set(BASIN_PLAYLIST).size,
    6,
    'the playlist visits every shape',
  )
  for (const b of Object.values(BASINS)) {
    assert.ok(
      insideBasin(b, b.start.x, b.start.y, 18),
      `${b.id}: the bubble starts in the water`,
    )
    assert.ok(
      insideBasin(b, b.drain.x, b.drain.y, 10),
      `${b.id}: the drain is in the water`,
    )
    const box = basinBounds(b)
    assert.ok(
      box.x0 >= 0 && box.y0 >= 0 && box.x1 <= 420 && box.y1 <= 360,
      `${b.id} fits`,
    )
    // A body pushed through the wall comes back inside, with its outward speed reflected.
    const body = { x: box.x1 + 30, y: (box.y0 + box.y1) / 2, vx: 2, vy: 0 }
    assert.ok(keepInside(b, body, 10))
    assert.ok(insideBasin(b, body.x, body.y, 10), `${b.id}: pushed back in`)
    assert.ok(body.vx <= 0, `${b.id}: bounced off the wall`)
  }
  // The double sink: two bowls, a divider between them, and an overflow gap that a full bubble fits.
  const d = BASINS.double
  assert.ok(!insideBasin(d, 210, 100), 'the divider is dry')
  assert.ok(
    insideBasin(d, 210, 184, 17),
    'a full bubble fits through the overflow gap',
  )
  assert.ok(
    !clearPath(d, { x: 112, y: 100 }, { x: 308, y: 100 }, 12),
    'no straight way over the divider',
  )
  assert.ok(
    clearPath(d, { x: 112, y: 184 }, { x: 308, y: 184 }, 17),
    'straight through the gap',
  )
  for (let x = 120; x <= 300; x += 3)
    assert.ok(insideBasin(d, x, 184, 17), `no pinch in the gap at x=${x}`)
  // Each shape's physics hook.
  const tub = flowAt(BASINS.tub, 200, 192, 0)
  assert.ok(tub.x > 0 && tub.y === 0, 'the faucet current runs along the tub')
  const spun = flowAt(BASINS.drum, 210 + 100, 192, 1)
  assert.ok(
    spun.y > 0 && Math.abs(spun.y) > Math.abs(spun.x),
    'the drum pushes round its rim',
  )
  assert.ok(
    flowAt(BASINS.drum, 210 + 140, 192, 1).y > spun.y,
    'faster near the rim',
  )
  const reversed = flowAt(BASINS.drum, 210 + 100, 192, -1)
  assert.ok(reversed.y < 0, 'the dial can run it backwards')
  assert.ok(
    flowAt(BASINS.tank, 210, 200, 0, 5).y <
      flowAt(BASINS.tank, 210, 200, 0, 1).y,
    'big bubbles float harder',
  )
  assert.ok(
    flowAt(BASINS.tank, 210, 200, 0).y < 0,
    'the tank floats the bubble up',
  )
  const belt = BASINS.conveyor.physics
  assert.ok(belt.kind === 'conveyor')
  assert.equal(laneDir(belt, belt.top + 5), 1)
  assert.equal(
    laneDir(belt, belt.top + (belt.bottom - belt.top) / belt.lanes + 5),
    -1,
    'lanes alternate',
  )
  assert.deepEqual(
    flowAt(BASINS.oval, 200, 200, 3),
    { x: 0, y: 0 },
    'the kitchen sink is still',
  )
  // Resting crumbs ride the drum round and the belts along (wrapping off the end).
  const crumb = carry(BASINS.drum, { x: 310, y: 192 }, 1)
  assert.ok(
    crumb.y > 192 &&
      Math.abs(Math.hypot(crumb.x - 210, crumb.y - 192) - 100) < 0.01,
  )
  const edge = carry(BASINS.conveyor, { x: 390, y: belt.top + 5 }, 0)
  assert.ok(edge.x < 60, 'off the end of the belt and back round')
  // The dial shows the next setting before the drum changes.
  const spin = BASINS.drum.physics
  assert.ok(spin.kind === 'spin')
  assert.equal(dialAt(spin, 0).telling, false)
  const tell = dialAt(spin, spin.every - 10)
  assert.ok(tell.telling && tell.next === spin.dial[1])
  // The endless sink walks the playlist.
  assert.equal(basinForLevel(1).id, 'oval')
  assert.equal(basinForLevel(2).id, 'double')
  assert.equal(basinForLevel(7).id, 'oval')
}

// --- the grime layer and the clean percentage -----------------------------------------------------
{
  const grime = new Grime(BASINS.oval)
  assert.equal(grime.clean, 0)
  assert.equal(grime.percent, 0)
  assert.ok(grime.total > 1500, 'the oval is a big grimy basin')
  const done = grime.scrub(210, 188, 12)
  // Cells whose centres lie within 12 px: a disc of about pi * (12/6)^2 cells.
  assert.ok(done >= 9 && done <= 16, `scrubbed ${done}`)
  assert.equal(grime.clean, done)
  assert.equal(grime.scrub(210, 188, 12), 0, 'a clean cell stays clean')
  assert.equal(
    grime.fresh.length,
    done,
    'the renderer hears about each cleaned cell',
  )
  assert.ok(!grime.isDirty(210, 188) && grime.isDirty(100, 188))
  const near = grime.nearestDirty(210, 188)!
  assert.ok(near && Math.hypot(near.x - 210, near.y - 188) <= 12 + CELL)
  const soiled = grime.soil(210, 188, 4)
  assert.ok(soiled >= 1 && soiled <= 4, 'a drip lands grime back')
  assert.equal(grime.clean, done - soiled)
  assert.equal(grime.dirtied.length, soiled)
  // Scrub the whole basin: 100 percent, past Squeaky Clean.
  for (let y = 0; y < 360; y += 4)
    for (let x = 0; x < 420; x += 4) grime.scrub(x, y, 6)
  assert.equal(grime.percent, 100)
  assert.ok(grime.percent >= SQUEAKY)
  // Thicker grime takes more passes.
  const thick = new Grime(BASINS.oval, 2)
  assert.equal(
    thick.scrub(210, 188, 12),
    0,
    'the first pass only loosens thick grime',
  )
  assert.ok(thick.scrub(210, 188, 12) > 0)
}

// --- rolling scrubs the basin and feeds the bubble ----------------------------------------------
{
  const g = staged()
  const b = g.bubbles[0]!
  for (let t = 0; t < 60 * 6; t++) g.update(press(t % 120 < 60 ? 'left' : 'up'))
  assert.ok(g.grime.percent > 0, 'the bubble scrubbed a path')
  assert.ok(g.score >= g.grime.clean - 1, 'a point a cell')
  assert.ok(b.stage > 1 || b.growth > 0, 'grime feeds the bubble')
}

// --- size as ammunition: the soap shot ---------------------------------------------------------
{
  const g = staged()
  const b = g.bubbles[0]!
  b.stage = 2
  g.update(press('b'))
  assert.equal(g.shots.length, 0, 'no shot below stage 3')
  assert.equal(b.stage, 2)
  b.stage = SHOT_STAGE
  b.growth = 5
  b.faceX = 1
  b.faceY = 0
  g.update(press('b'))
  assert.equal(g.shots.length, 1, 'B blows a soap shot')
  assert.equal(b.stage, SHOT_STAGE - 1, 'it costs a stage')
  assert.equal(b.growth, 5, 'the partial growth is kept')
  assert.ok(g.shots[0]!.vx > 0, 'it floats the way the bubble faces')
  g.update(press('b'))
  assert.equal(g.shots.length, 1, 'never below stage 2')
  // A shot that meets nothing pops at the wall.
  for (let t = 0; t < 200; t++) g.update(emptyInput())
  assert.equal(g.shots.length, 0)
}

// --- trapping and chains -----------------------------------------------------------------------
{
  const g = staged()
  const b = g.bubbles[0]!
  b.x = 120
  b.y = 188
  b.stage = MAX_STAGE
  b.faceX = 1
  b.faceY = 0
  const brush = pest('brush', 200, 188, { heading: Math.PI })
  g.pests = [brush]
  g.update(press('b'))
  for (let t = 0; t < 40 && !brush.trap; t++) g.update(emptyInput())
  assert.equal(brush.trap, 1, 'the shot traps the brush on a chain of one')
  assert.equal(g.shots.length, 0, 'the shot is spent')
  // A trapped pest is harmless and floats to the drain for 300 x its chain.
  b.x = brush.x
  b.y = brush.y + 2
  const before = g.score
  const lives = g.lives
  let t = 0
  for (; t < 60 * 10 && g.pests.length; t++) g.update(emptyInput())
  assert.equal(g.pests.length, 0, 'down the drain it goes')
  assert.equal(g.lives, lives, 'a trapped brush never pops the bubble')
  assert.ok(g.score - before >= TRAP_POINTS, 'it pays at the drain')
  // Chains: each eat within a second of the last steps x2, x3, x4.
  const c = staged()
  const cb = c.bubbles[0]!
  c.mess = [0, 1, 2, 3, 4].map((i) => ({
    x: 80 + i * 40,
    y: 188,
    kind: 'crumb',
    r: 3,
  }))
  const chains: number[] = []
  const gains: number[] = []
  for (let i = 0; i < 5; i++) {
    // Park on a scrubbed spot first, so only the crumb pays.
    cb.x = 80 + i * 40
    cb.y = 188
    cb.vx = 0
    cb.vy = 0
    c.grime.scrub(cb.x, cb.y, 20)
    const last = c.score
    c.update(emptyInput())
    gains.push(c.score - last)
    chains.push(c.chain)
  }
  assert.deepEqual(chains, [1, 2, 3, 4, 4], 'x2, x3, x4, then capped')
  assert.deepEqual(gains, [10, 20, 30, 40, 40], 'each crumb pays its chain')
  for (let i = 0; i <= CHAIN_TICKS; i++) c.update(emptyInput())
  assert.equal(c.chain, 0, 'a second without eating ends the chain')
  // Trapping counts toward the chain too.
  const tg = staged()
  const tb = tg.bubbles[0]!
  tg.chain = 2
  tg.chainTimer = 30
  tb.stage = 4
  tb.faceX = 1
  tb.faceY = 0
  const mite = pest('mite', tb.x + 20, tb.y)
  tg.pests = [mite]
  tg.update(press('b'))
  for (let i = 0; i < 20 && !mite.trap; i++) tg.update(emptyInput())
  assert.equal(mite.trap, 3, 'trapped on the third link')
}

// --- beatable brushes ---------------------------------------------------------------------------
{
  // From behind at full size: tipped, stunned and worth points.
  const g = staged()
  const b = g.bubbles[0]!
  b.stage = MAX_STAGE
  b.x = 150
  b.y = 188
  const brush = pest('brush', 150 + 24, 188, { heading: 0 })
  g.pests = [brush]
  const before = g.score
  g.update(emptyInput())
  assert.equal(brush.state, 'tipped', 'bumped from behind, over it goes')
  assert.equal(brush.t, TIP_TICKS - 0)
  assert.ok(g.score - before >= PESTS.brush.points)
  assert.equal(b.stage, MAX_STAGE, 'no harm done')
  for (let t = 0; t < TIP_TICKS + 2; t++) g.update(emptyInput())
  assert.equal(brush.state, 'roam', 'it rights itself after four seconds')
  // From the front, a full bubble splashes down two stages; a small one pops.
  const f = staged()
  const fb = f.bubbles[0]!
  fb.stage = MAX_STAGE
  fb.x = 150
  fb.y = 188
  f.pests = [pest('brush', 150 + 24, 188, { heading: Math.PI })]
  f.update(emptyInput())
  assert.equal(fb.stage, 3, 'a hit is a two-stage splash')
  assert.ok(fb.alive && f.lives === 3)
  fb.invuln = 0
  fb.stage = 2
  fb.x = f.pests[0]!.x - 10
  fb.y = f.pests[0]!.y
  f.update(emptyInput())
  assert.equal(fb.alive, false, 'a small bubble pops')
  assert.equal(f.lives, 2)
  // Brushes scrub grime and eat the mess when no bubble is near.
  const r = staged()
  r.bubbles[0]!.x = 60
  r.bubbles[0]!.y = 188
  r.pests = [pest('brush', 330, 188, { heading: Math.PI })]
  const food = { x: 300, y: 188, kind: 'crumb', r: 3 }
  r.mess = [food]
  for (let t = 0; t < 200; t++) r.update(emptyInput())
  assert.ok(!r.mess.includes(food), 'the brush ate the crumb')
  assert.ok(!r.grime.isDirty(310, 188), 'and scrubbed its path')
}

// --- the sponge soaks, never pops --------------------------------------------------------------
{
  const g = staged()
  const b = g.bubbles[0]!
  b.stage = 4
  g.pests = [pest('sponge', b.x + 12, b.y)]
  g.update(emptyInput())
  assert.equal(b.stage, 3, 'soaked down a stage')
  assert.ok(b.alive)
  b.invuln = 0
  b.stage = 1
  g.pests[0]!.x = b.x + 8
  g.pests[0]!.y = b.y
  g.update(emptyInput())
  assert.ok(b.alive, 'even a small bubble survives a sponge')
  assert.equal(g.lives, 3)
}

// --- the Drain Gremlin -----------------------------------------------------------------------
{
  const g = staged()
  const b = g.bubbles[0]!
  const gr = pest('gremlin', g.basin.drain.x, g.basin.drain.y, {
    state: 'hidden',
    t: 5,
  })
  g.pests = [gr]
  b.stage = 4
  b.x = g.basin.drain.x
  b.y = g.basin.drain.y
  for (let t = 0; t < 6; t++) g.update(emptyInput())
  assert.equal(gr.state, 'gurgle', 'the drain gurgles first')
  b.x = g.basin.drain.x + 4
  b.y = g.basin.drain.y + 2
  b.vx = 0
  b.vy = 0
  for (let t = 0; t < GURGLE_TICKS + 2 && gr.state === 'gurgle'; t++) {
    b.x = g.basin.drain.x + 4
    b.y = g.basin.drain.y + 2
    g.update(emptyInput())
  }
  assert.equal(gr.state, 'out', 'out it pops')
  assert.equal(b.stage, 2, 'loitering over the drain costs a splash')
  // It darts about, then goes home and hides again.
  b.x = 60
  b.y = 188
  b.invuln = 9999
  let home = false
  for (let t = 0; t < 60 * 12 && !home; t++) {
    g.update(emptyInput())
    home = gr.state === 'hidden'
  }
  assert.ok(home, 'back down the drain')
}

// --- the drain and Squeaky Clean ----------------------------------------------------------------
{
  const g = staged()
  const b = g.bubbles[0]!
  for (let y = 0; y < 360; y += 4)
    for (let x = 0; x < 420; x += 4) g.grime.scrub(x, y, 6)
  b.stage = MAX_STAGE
  b.x = g.basin.drain.x
  b.y = g.basin.drain.y + 8
  const before = g.score
  for (let t = 0; t < 90 && g.level === 1; t++) g.update(emptyInput())
  assert.equal(g.level, 2, 'down the drain to the next basin')
  assert.ok(
    g.score - before >= 1000 + 100 * 20 + 5000,
    'level, clean and Squeaky Clean bonuses',
  )
  assert.equal(g.basin.id, 'double')
  assert.equal(g.grime.clean, 0, 'a fresh, grimy basin')
}

// --- determinism, the demo, and the pilot probe -------------------------------------------------
{
  const run = (seed: number) => {
    const g = game(seed)
    for (let t = 0; t < 60 * 60 && !g.over; t++) g.update(g.demoInput())
    return [g.score, g.level, g.lives, g.grime.clean, g.bubbles[0]!.x]
  }
  assert.deepEqual(run(4), run(4), 'the same seed plays the same game')
  const demo = game(4, true)
  for (let t = 0; t < 60 * 90; t++) demo.update(emptyInput())
  assert.equal(demo.score, 0, 'the attract demo scores nothing')
  assert.ok(demo.grime.clean > 0, 'but it does wash')
  // The pilot, with the game's real three lives, plays through basins and still runs out.
  for (const seed of [1, 2, 3]) {
    const g = game(seed)
    let t = 0
    for (; t < 60 * 60 * 20 && !g.over; t++) g.update(g.demoInput())
    assert.ok(g.over, `seed ${seed}: the run ends`)
    assert.ok(g.level >= 3, `seed ${seed}: reached basin ${g.level}`)
    assert.ok(g.score > 0 && g.score < 10_000_000)
  }
  assert.equal(GROWTH_PER_STAGE > 0, true)
}

console.log('verifyCabinetSinkSuds: ok')
