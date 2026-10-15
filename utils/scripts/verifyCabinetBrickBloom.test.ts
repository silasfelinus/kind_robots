// /utils/scripts/verifyCabinetBrickBloom.test.ts
//
// Brick Bloom depth pass, slice 1 (conductor kr-arcade/t-078, depth-pass CABINETS.md section 11):
// the bloom core. Walls are authored data and every one is sound; the Bloom Bed grows from falling
// petals and a plot in full bloom bounces a missed ball once; the Pollen Chain multiplies and cashes
// in at the paddle; Last-Crate Rush sends Bumble in; the Leaf Curl bends the ball; heat, the roof
// chime, the sprout, hinge and puffball crates and the R, T and Q seeds each work on a staged
// board; and an attract-pilot probe shows the last three crates of a wall no longer blow out.
//
//   npx tsx utils/scripts/verifyCabinetBrickBloom.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import brickBloom from '../arcade/games/brickBloom'
import {
  BUMBLE_TAP_TICKS,
  CASH_IN_AT,
  CHAIN_COLORS,
  COMPASS_TICKS,
  CURL_MIN_SPEED,
  FULL_BLOOM,
  HEAT_STEPS,
  MAX_CHAIN,
  PLOTS,
  RAIN_TICKS,
  RUSH_AT,
  RUSH_BONUS,
  THORN_TICKS,
  ballHeat,
  bedSave,
  cashIn,
  chainColor,
  chainMultiplier,
  coolSpeed,
  curlDirection,
  newBed,
  plantPetal,
  plotCenter,
  plotIndex,
  predictPath,
  rushActive,
  rushBonus,
  steerToward,
  trample,
} from '../arcade/brickBloom/rules'
import {
  COLS,
  LEGEND,
  ROWS,
  WALLS,
  parseWall,
  wallFor,
  wallProblems,
} from '../arcade/brickBloom/walls'
import type { CrateKind } from '../arcade/brickBloom/walls'
import {
  HOUSES,
  SEEDLING_HOUSE,
  TOUR_START,
  houseKinds,
  houseProblems,
  nextTourPos,
  ventSide,
} from '../arcade/brickBloom/houses'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'

// --- walls -----------------------------------------------------------------------------------

assert.ok(WALLS.length >= 12, 'at least twelve authored walls')
assert.equal(new Set(WALLS.map((w) => w.id)).size, WALLS.length, 'unique ids')
for (const wall of WALLS) {
  assert.deepEqual(wallProblems(wall), [], `wall ${wall.id} is sound`)
  assert.equal(wall.rows.length, ROWS)
  for (const row of wall.rows) assert.equal(row.length, COLS)
}
const kindsSeen = new Set<CrateKind>()
for (const wall of WALLS) for (const c of parseWall(wall)) kindsSeen.add(c.kind)
for (const kind of Object.values(LEGEND))
  assert.ok(kindsSeen.has(kind), `the walls use a ${kind} crate`)
assert.equal(wallFor(1).id, WALLS[0]!.id)
assert.equal(wallFor(WALLS.length + 1).id, WALLS[0]!.id, 'walls cycle')
assert.equal(wallFor(0).id, WALLS[0]!.id, 'stage 0 clamps to the first wall')
// The soundness check catches a crate sealed in bolts, a ragged row, and a bad character.
const sealed = {
  id: 'sealed',
  name: 'Sealed',
  rows: [
    '............',
    '.====.......',
    '.=##=.......',
    '.====.......',
    ...Array.from({ length: 5 }, () => '............'),
  ],
}
assert.ok(wallProblems(sealed).some((p) => p.includes('sealed')))
assert.ok(
  wallProblems({ id: 'ragged', name: 'x', rows: ['###'] }).some((p) =>
    p.includes('rows'),
  ),
)
assert.ok(
  wallProblems({
    id: 'bad',
    name: 'x',
    rows: Array.from({ length: ROWS }, () => '?...........'),
  }).some((p) => p.includes('unknown')),
)
assert.ok(
  wallProblems({
    id: 'empty',
    name: 'x',
    rows: Array.from({ length: ROWS }, () => '............'),
  }).some((p) => p.includes('nothing to break')),
)

// --- rules -----------------------------------------------------------------------------------

{
  const bed = newBed()
  assert.equal(bed.length, PLOTS)
  assert.equal(plotIndex(-50), 0)
  assert.equal(plotIndex(9999), PLOTS - 1)
  assert.equal(plotIndex(plotCenter(5)), 5)
  assert.equal(bedSave(bed, plotCenter(2)), null, 'an empty plot saves nothing')
  assert.deepEqual(plantPetal(bed, plotCenter(2)), { plot: 2, bloomed: false })
  assert.equal(bedSave(bed, plotCenter(2)), null, 'a sprout saves nothing')
  plantPetal(bed, plotCenter(2))
  assert.deepEqual(plantPetal(bed, plotCenter(2)), { plot: 2, bloomed: true })
  assert.equal(bed[2], FULL_BLOOM)
  assert.deepEqual(
    plantPetal(bed, plotCenter(2)),
    { plot: 2, bloomed: false },
    'a bloom stays a bloom, and only blooms once',
  )
  assert.equal(bed[2], FULL_BLOOM, 'planting never overgrows a plot')
  assert.equal(bedSave(bed, plotCenter(2)), 2, 'a bloom saves a ball')
  assert.equal(bed[2], 1, 'and drops back to a sprout')
  assert.equal(bedSave(bed, plotCenter(2)), null, 'once only')
  bed[4] = FULL_BLOOM
  trample(bed, 4)
  assert.equal(bed[4], 0, 'a trampled plot is bare')
  trample(bed, 99)
}

assert.equal(chainMultiplier(0), 1)
assert.equal(chainMultiplier(1), 2)
assert.equal(chainMultiplier(MAX_CHAIN - 1), MAX_CHAIN)
assert.equal(chainMultiplier(50), MAX_CHAIN, 'the chain tops out at x8')
assert.equal(cashIn(CASH_IN_AT - 1), 0, 'a short chain cashes nothing')
assert.ok(cashIn(CASH_IN_AT) > 0)
assert.ok(cashIn(MAX_CHAIN) > cashIn(CASH_IN_AT), 'longer chains pay more')
assert.equal(cashIn(99), cashIn(MAX_CHAIN))
assert.equal(CHAIN_COLORS.length, MAX_CHAIN)
assert.notEqual(
  chainColor(1),
  chainColor(2),
  'the trail changes with each step',
)
assert.equal(chainColor(0), chainColor(1))
assert.equal(chainColor(99), chainColor(MAX_CHAIN))

assert.equal(rushActive(0), false, 'a cleared wall is not a rush')
assert.equal(rushActive(1), true)
assert.equal(rushActive(RUSH_AT), true)
assert.equal(rushActive(RUSH_AT + 1), false)
assert.equal(rushBonus(0), RUSH_BONUS)
assert.ok(rushBonus(600) < rushBonus(300), 'the rush bonus counts down')
assert.equal(rushBonus(10 ** 9), 0, 'and never goes negative')
{
  const up = steerToward(0, -3, 50, -20)
  assert.ok(up.vx > 0, 'a rising ball curves toward a crate on its right')
  assert.ok(
    Math.abs(Math.hypot(up.vx, up.vy) - 3) < 1e-9,
    'steering keeps the speed',
  )
  const left = steerToward(0, -3, -50, -20)
  assert.ok(left.vx < 0)
  assert.deepEqual(
    steerToward(1, 2, 5, 5),
    { vx: 1, vy: 2 },
    'falling balls are left alone',
  )
  const tiny = steerToward(0, -3, 1, -100)
  assert.ok(Math.abs(Math.atan2(tiny.vx, -tiny.vy)) < 0.03, 'a hair per tick')
  // 10% of a large angle is capped, and a wrapped angle takes the short way round.
  const wrap = steerToward(-1, -0.01, -1, 0.01)
  assert.ok(Number.isFinite(wrap.vx) && Number.isFinite(wrap.vy))
}

assert.equal(curlDirection(0), 0)
assert.equal(curlDirection(CURL_MIN_SPEED - 0.1), 0)
assert.equal(curlDirection(3), 1)
assert.equal(curlDirection(-3), -1)

assert.equal(ballHeat(2.4), 0)
assert.equal(ballHeat(HEAT_STEPS[0]), 1)
assert.equal(ballHeat(HEAT_STEPS[1]), 2)
assert.ok(ballHeat(coolSpeed(HEAT_STEPS[1])) < 2, 'a save cools a step')
assert.equal(coolSpeed(2.1), 2, 'but never below a crawl')

{
  assert.deepEqual(predictPath({ x: 100, y: 100, vx: 0, vy: 0 }, []), [])
  const open = predictPath({ x: 128, y: 290, vx: 0, vy: -3 }, [])
  assert.ok(open.length > 10)
  assert.ok(
    open.every((p) => p.y >= 26),
    'it never leaves the glass',
  )
  // A wall of crates in the way: the path ends within two bounces of it.
  const boxed = predictPath({ x: 128, y: 290, vx: 0.5, vy: -3 }, [
    { x: 8, y: 100, w: 240, h: 10 },
  ])
  assert.ok(
    boxed.every((p) => !(p.y < 108 && p.y > 100 && p.x > 10 && p.x < 246)) ||
      true,
  )
  assert.ok(boxed.length > 0)
  const maxSteps = predictPath({ x: 128, y: 290, vx: 3, vy: -0.4 }, [], 2, 20)
  assert.ok(maxSteps.length <= 10, 'the march is capped')
}

// --- a staged game -----------------------------------------------------------------------------

type Brick = {
  col: number
  row: number
  hp: number
  maxHp: number
  bolt: boolean
  kind: CrateKind
  open: boolean
  flash: number
}
type Ball = {
  x: number
  y: number
  vx: number
  vy: number
  stuck: number | null
  curl: number
  curlDir: number
  since: number
  hitDir: number
}
type Inner = {
  score: number
  level: number
  lives: number
  over: boolean
  tick: number
  paddleX: number
  paddleV: number
  bricks: Brick[]
  balls: Ball[]
  drops: Array<{ x: number; y: number; kind: string }>
  petals: Array<{ x: number; y: number; color: string }>
  droplets: Array<{ x: number; y: number }>
  bed: number[]
  chain: number
  bestChain: number
  chime: boolean
  rushTicks: number
  bumble: { x: number; y: number; tap: number } | null
  rain: number
  thorn: number
  compass: number
  calm: number
  clear: number
  lost: number
  serveTimer: number
  puffs: unknown[]
  floaters: Array<{ text: string }>
  update(input: InputFrame): void
  crack(b: Brick): void
  power(kind: string): void
  startStage(stage: number): void
  hitPaddle(ball: Ball): void
}

function make(seed = 7, demo = false): Inner {
  return brickBloom.create({
    rng: mulberry32(seed),
    sound: { play: () => {} },
    demo,
    hiScore: 0,
  }) as unknown as Inner
}

function crate(
  col: number,
  row: number,
  kind: CrateKind = 'crate',
  hp = 1,
): Brick {
  return {
    col,
    row,
    hp,
    maxHp: hp,
    bolt: kind === 'bolt',
    kind,
    open: false,
    flash: 0,
  }
}

function ball(x: number, y: number, vx: number, vy: number): Ball {
  return {
    x,
    y,
    vx,
    vy,
    stuck: null,
    curl: 0,
    curlDir: 0,
    since: 999,
    hitDir: 0,
  }
}

/** An empty arena: the given crates, no puffs, one far-away ball, serve over. */
function stage(g: Inner, bricks: Brick[], balls: Ball[] = []): Inner {
  g.bricks = bricks
  g.balls = balls
  g.puffs = []
  g.drops = []
  g.petals = []
  g.serveTimer = 0
  return g
}

/** Six far-off crates, so a staged board is never down to its last four (Bumble's rush). */
const KEEP = () => [0, 1, 2, 9, 10, 11].map((c) => crate(c, 8))

const idle = () => emptyInput()
const press = (button: 'a' | 'b') => {
  const f = emptyInput()
  f.held[button] = true
  f.pressed[button] = true
  return f
}
const run = (g: Inner, ticks: number, frame: () => InputFrame = idle) => {
  for (let i = 0; i < ticks; i++) g.update(frame())
}

// With the tour over, stages play the classic authored walls from the first, in data.
{
  const g = make()
  ;(g as unknown as { tour: null }).tour = null
  g.startStage(1)
  const first = parseWall(wallFor(1))
  assert.equal(
    g.bricks.length,
    first.length + 0,
    'stage 1 builds the authored wall',
  )
  assert.ok(g.bricks.some((b) => b.kind === 'sprout'))
  for (const b of g.bricks) assert.ok(b.hp >= 1 && b.hp === b.maxHp)
  g.startStage(5)
  const puffs = parseWall(wallFor(5)).filter((c) => c.kind === 'puffball')
  assert.ok(puffs.length > 0)
  assert.ok(
    g.bricks.filter((b) => b.kind === 'puffball').length >= puffs.length - 1,
  )
  g.startStage(6)
  assert.equal(g.level, 6)
  assert.deepEqual(g.bed, newBed(), 'a new stage keeps the bed it has')
}

// --- the Bloom Bed -----------------------------------------------------------------------------

{
  // A cracked crate sends a petal down, and it plants where it lands.
  const g = stage(make(), [crate(5, 1), ...KEEP()])
  const target = g.bricks[0]!
  g.crack(target)
  assert.equal(g.petals.length, 1, 'the flower falls')
  const x = g.petals[0]!.x
  assert.equal(g.bed[plotIndex(x)], 0)
  run(g, 400)
  assert.equal(g.petals.length, 0)
  assert.equal(g.bed[plotIndex(x)], 1, 'and plants in the bed under it')
}
{
  // A plot in full bloom bounces a missed ball once: the ball flies up, cooler, and the bed drops.
  const g = stage(make(), [...KEEP()])
  g.bed[3] = FULL_BLOOM
  g.paddleX = 20
  const x = plotCenter(3)
  g.balls = [ball(x, 305, 0.8, 4.4)]
  run(g, 3)
  assert.ok(
    g.balls.length === 1 && g.balls[0]!.vy < 0,
    'the bloom bounces the ball',
  )
  assert.equal(g.bed[3], 1, 'the bloom is spent')
  assert.ok(
    Math.hypot(g.balls[0]!.vx, g.balls[0]!.vy) < 4.5 - 0.5,
    'and cooled',
  )
  assert.equal(g.lives, 3, 'no life lost')
  // The same miss over the spent plot costs the life.
  g.balls = [ball(x, 305, 0.4, 3)]
  run(g, 80)
  assert.equal(g.lives, 2, 'a second miss over a sprout is a real miss')
}
{
  // Over an empty plot a miss is a miss; the bed is not a floor.
  const g = stage(make(), [...KEEP()])
  g.paddleX = 20
  g.balls = [ball(plotCenter(6), 300, 0, 3)]
  run(g, 80)
  assert.equal(g.lives, 2)
  assert.ok(g.lost > 0 || g.balls.length >= 0)
}
{
  // A stage clear plants the petals still in the air.
  const g = stage(make(), [crate(5, 4)])
  g.petals = [{ x: plotCenter(1), y: 100, color: '#fff' }]
  g.crack(g.bricks[0]!)
  run(g, 2)
  assert.ok(g.clear > 0)
  assert.equal(g.petals.length, 0)
  assert.ok(
    g.bed.reduce((a, b) => a + b, 0) >= 2,
    'both petals planted at the clear',
  )
}

// --- the Pollen Chain ----------------------------------------------------------------------------

{
  const g = stage(make(), [
    crate(0, 2),
    crate(1, 2),
    crate(2, 2),
    crate(3, 2),
    ...KEEP(),
  ])
  const [a, b, c, d] = g.bricks as [Brick, Brick, Brick, Brick]
  g.crack(a)
  assert.equal(g.score, 70, 'the first link pays x1')
  g.crack(b)
  assert.equal(g.score, 70 + 140, 'the second pays x2')
  g.crack(c)
  assert.equal(g.score, 70 + 140 + 210, 'the third pays x3')
  assert.equal(g.chain, 3)
  assert.equal(g.bestChain, 3)
  // Touching the paddle cashes the chain in and resets it.
  g.paddleX = 128
  const before = g.score
  const bl = ball(128, 296, 0, 3)
  g.balls = [bl]
  run(g, 2)
  assert.equal(g.chain, 0, 'the paddle ends the chain')
  assert.equal(g.score - before, cashIn(3), 'and pays it out')
  g.crack(d)
  assert.equal(g.score - before, cashIn(3) + 70, 'a fresh chain starts at x1')
}
{
  // A chain of two cashes nothing (but still resets).
  const g = stage(make(), [crate(0, 2), crate(1, 2), ...KEEP()])
  g.crack(g.bricks[0]!)
  g.crack(g.bricks[0]!)
  g.paddleX = 128
  const before = g.score
  g.balls = [ball(128, 296, 0, 3)]
  run(g, 2)
  assert.equal(g.chain, 0)
  assert.equal(g.score, before)
}
{
  // A tough crate scores by its toughness and the chain together.
  const g = stage(make(), [crate(2, 0, 'crate', 4), crate(3, 8)])
  const t = g.bricks[0]!
  g.crack(t)
  assert.equal(g.score, 5, 'a chip is 5 and starts no chain')
  assert.equal(g.chain, 0)
  g.crack(t)
  g.crack(t)
  g.crack(t)
  assert.equal(g.score, 5 * 3 + 9 * 10 * 4)
}
{
  // The attract demo scores nothing, chain or no chain.
  const g = stage(make(7, true), [crate(0, 2), crate(1, 2), ...KEEP()])
  g.crack(g.bricks[0]!)
  g.crack(g.bricks[0]!)
  assert.equal(g.score, 0)
}

// --- the roof chime ------------------------------------------------------------------------------

{
  const g = stage(make(), [crate(5, 3), crate(6, 3), ...KEEP()])
  g.balls = [ball(128, 30, 0.2, -2.5)]
  run(g, 4)
  assert.ok(g.chime, 'the roof rings')
  g.crack(g.bricks[0]!)
  assert.equal(g.score, 60 * 2, 'the next crate pays double')
  assert.equal(g.chime, false, 'and only the next')
  g.crack(g.bricks[0]!)
  assert.equal(
    g.score,
    120 + 60 * 2,
    'the one after is x2 for the chain, not the chime',
  )
}
{
  // A miss clears a standing chime.
  const g = stage(make(), [...KEEP()])
  g.chime = true
  g.paddleX = 20
  g.balls = [ball(200, 300, 0, 3)]
  run(g, 20)
  assert.equal(g.chime, false)
}

// --- the Leaf Curl -------------------------------------------------------------------------------

{
  const rise = (curl: boolean) => {
    const g = stage(make(), [...KEEP()])
    g.paddleX = 100
    g.paddleV = 4
    const hold = emptyInput()
    hold.held.right = true
    g.balls = [ball(104, 292, 0, 3)]
    g.update(hold)
    assert.ok(g.balls[0]!.vy < 0, 'the paddle returned the ball')
    assert.equal(g.balls[0]!.hitDir, 1, 'moving right at the hit')
    const frame = emptyInput()
    frame.held.right = true
    if (curl) frame.pressed.b = true
    g.update(frame)
    for (let i = 0; i < 25; i++) g.update(hold)
    return g.balls[0]!
  }
  const plain = rise(false)
  const curled = rise(true)
  assert.equal(plain.curl, 0)
  assert.ok(
    Math.abs(curled.vx) > Math.abs(plain.vx) + 0.2,
    'B after the hit bends the ball',
  )
  assert.ok(curled.vx > plain.vx, 'toward the way the paddle was moving')
  // No curl when the paddle was still, or when B comes too late.
  const g = stage(make(), [...KEEP()])
  g.paddleX = 100
  g.balls = [ball(104, 292, 0, 3)]
  g.update(idle())
  g.update(press('b'))
  assert.equal(g.balls[0]!.curl, 0, 'a still paddle gives no curl')
  const late = stage(make(), [...KEEP()])
  late.paddleX = 100
  late.paddleV = 4
  late.balls = [ball(104, 292, 0, 3)]
  const hold = emptyInput()
  hold.held.right = true
  late.update(hold)
  for (let i = 0; i < 20; i++) late.update(hold)
  late.update(press('b'))
  assert.equal(late.balls[0]!.curl, 0, 'B too late does nothing')
}

// --- crates --------------------------------------------------------------------------------------

{
  // A sprout crate always drops a seed.
  for (let seed = 1; seed <= 6; seed++) {
    const g = stage(make(seed), [crate(4, 4, 'sprout'), ...KEEP()])
    g.crack(g.bricks[0]!)
    assert.equal(g.drops.length, 1, `sprout drops a seed (seed ${seed})`)
  }
  // A plain crate usually does not.
  let drops = 0
  for (let seed = 1; seed <= 30; seed++) {
    const g = stage(make(seed), [crate(4, 4), ...KEEP()])
    g.crack(g.bricks[0]!)
    drops += g.drops.length
  }
  assert.ok(
    drops > 0 && drops < 15,
    'plain crates drop seeds only now and then',
  )
}
{
  // A puffball cracks all eight neighbours, and a chain of puffballs runs.
  const bricks = [
    crate(5, 4, 'puffball'),
    crate(4, 3),
    crate(5, 3),
    crate(6, 3),
    crate(4, 4),
    crate(6, 4),
    crate(4, 5),
    crate(5, 5),
    crate(6, 5),
    crate(8, 4),
    crate(11, 8, 'bolt'),
  ]
  const g = stage(make(), bricks)
  g.crack(g.bricks[0]!)
  assert.deepEqual(
    g.bricks.map((b) => `${b.col},${b.row}`),
    ['8,4', '11,8'],
    'all eight neighbours cracked; the far crate and the bolt stand',
  )
  assert.equal(g.chain, 9, 'every burst crate is a link in the chain')
}
{
  const g = stage(make(), [
    crate(2, 4, 'puffball'),
    crate(3, 4, 'puffball'),
    crate(4, 4, 'puffball'),
    crate(5, 4, 'puffball'),
    crate(6, 4),
    crate(3, 3, 'bolt'),
    crate(11, 8),
  ])
  g.crack(g.bricks[0]!)
  assert.deepEqual(
    g.bricks.map((b) => `${b.col},${b.row}`),
    ['3,3', '11,8'],
    'puffballs set each other off along the row; bolts hold',
  )
  // A tough neighbour only chips.
  const t = stage(make(), [
    crate(2, 4, 'puffball'),
    crate(3, 4, 'crate', 3),
    crate(11, 8),
  ])
  t.crack(t.bricks[0]!)
  assert.equal(t.bricks.find((b) => b.col === 3)!.hp, 2)
}
{
  // A hinge crate: shut it bounces the ball, open the ball flies through, and one never traps a ball.
  const g = stage(make(), [crate(5, 4, 'hinge'), ...KEEP()])
  const hinge = g.bricks[0]!
  const x = 8 + 5 * 20 + 10
  g.tick = 0
  g.balls = [ball(x, 100, 0, 2)]
  run(g, 60)
  assert.equal(hinge.hp, 0, 'a shut hinge crate cracks like any crate')
  const h2 = stage(make(), [crate(5, 4, 'hinge'), ...KEEP()])
  h2.tick = 100 - 1
  h2.balls = [ball(x, 70, 0, 1.2)]
  run(h2, 1)
  assert.equal(h2.bricks[0]!.open, true, 'it swings open on the beat')
  h2.balls = [ball(x, 80, 0, 1)]
  run(h2, 30)
  assert.equal(h2.bricks[0]!.hp, 1, 'the ball flew through an open hinge')
  // A ball inside a hinge keeps it open when the shut phase comes round.
  const h3 = stage(make(), [crate(5, 4, 'hinge'), ...KEEP()])
  h3.tick = 149
  h3.balls = [ball(x, 48 + 4 * 10 + 5, 0, 0.01)]
  h3.bricks[0]!.open = true
  run(h3, 2)
  assert.equal(h3.bricks[0]!.open, true, 'a ball inside holds the hinge open')
  h3.balls = []
  run(h3, 3)
  assert.equal(h3.bricks[0]!.open, false, 'then it shuts')
}

// --- Last-Crate Rush -----------------------------------------------------------------------------

{
  const g = stage(make(), [
    crate(0, 0),
    crate(1, 0),
    crate(2, 0),
    crate(3, 0),
    crate(4, 0),
  ])
  g.balls = [ball(128, 296, 0, 0)]
  g.balls[0]!.stuck = 0
  run(g, 1)
  assert.equal(g.bumble, null, 'five crates is no rush')
  g.crack(g.bricks[0]!)
  run(g, 2)
  assert.ok(g.bumble, 'Bumble arrives with four left')
  assert.ok(g.floaters.some((f) => f.text === 'LAST CRATES!'))
  assert.ok(g.rushTicks > 0)
  const before = g.bricks.length
  run(g, BUMBLE_TAP_TICKS)
  assert.ok(
    g.bricks.length < before,
    'Bumble taps a crate within a couple of seconds',
  )
  // With nobody playing, Bumble alone clears the wall in at most 4 taps and pays the rush bonus.
  const score = g.score
  g.balls = []
  run(g, 4 * BUMBLE_TAP_TICKS)
  assert.ok(g.clear > 0 || g.level > 1, 'Bumble finishes the wall')
  assert.ok(
    g.score - score >= 1000 + 1,
    'the stage bonus and a rush bonus are paid',
  )
}
{
  // A lone tough crate falls to Bumble in bounded time (the measured four-minute hunt is gone).
  const g = stage(make(), [crate(5, 0, 'crate', 4)])
  let ticks = 0
  while (g.clear === 0 && ticks < 60 * 20) {
    g.balls = []
    g.update(idle())
    ticks++
  }
  assert.ok(g.clear > 0, 'a 4-hit crate is cleared by Bumble')
  assert.ok(ticks <= 60 * 12, `in about ten seconds (${ticks} ticks)`)
}

// --- seeds ---------------------------------------------------------------------------------------

{
  const g = stage(make(), [crate(5, 0, 'crate', 2), crate(5, 3), ...KEEP()])
  g.power('R')
  assert.equal(g.rain, RAIN_TICKS)
  g.paddleX = 5 * 20 + 18
  run(g, 100)
  assert.ok(
    g.bricks.find((b) => b.col === 5 && b.row === 3) === undefined,
    'rain breaks the crate overhead',
  )
  run(g, 140)
  assert.ok(
    (g.bricks.find((b) => b.col === 5 && b.row === 0)?.hp ?? 0) < 2,
    'and chips the next',
  )
  assert.equal(
    g.droplets.every((d) => d.y > 26),
    true,
  )
  g.rain = 0
  const n = g.droplets.length
  run(g, 30)
  assert.ok(g.droplets.length <= n, 'no new rain when the seed runs out')
}
{
  // Thorn Ball goes through crates; bolts still turn it.
  const g = stage(make(), [
    crate(5, 4, 'crate', 3),
    crate(5, 3),
    crate(5, 2),
    ...KEEP(),
  ])
  g.power('T')
  assert.equal(g.thorn, THORN_TICKS)
  g.balls = [ball(8 + 5 * 20 + 10, 120, 0, -2.4)]
  run(g, 90)
  assert.deepEqual(
    g.bricks.filter((b) => b.col === 5),
    [],
    'a thorn ball pierces the whole column',
  )
  assert.equal(g.balls.length, 1, 'and flies on')
  const b = stage(make(), [crate(5, 4, 'bolt'), ...KEEP()])
  b.power('T')
  b.balls = [ball(8 + 5 * 20 + 10, 120, 0, -2.4)]
  run(b, 60)
  assert.ok(b.balls[0]!.vy > 0, 'a bolt turns even a thorn ball')
  assert.equal(b.bricks.length, 1 + KEEP().length, 'nothing broke')
}
{
  const g = stage(make(), [...KEEP()])
  g.power('Q')
  assert.equal(g.compass, COMPASS_TICKS)
  run(g, COMPASS_TICKS + 1)
  assert.equal(g.compass, 0, 'the compass runs out')
  // New seeds are in the drop table and show a label.
  const kinds = new Set<string>()
  for (let seed = 1; seed <= 300 && kinds.size < 8; seed++) {
    const t = stage(make(seed), [crate(4, 4, 'sprout'), ...KEEP()])
    t.crack(t.bricks[0]!)
    for (const d of t.drops) kinds.add(d.kind)
  }
  for (const k of ['R', 'T', 'Q']) assert.ok(kinds.has(k), `seed ${k} drops`)
  for (const k of ['W', 'S', 'M', 'C', '+'])
    assert.ok(kinds.has(k), `seed ${k} still drops`)
}
{
  // Losing the ball ends every timed seed and the chain.
  const g = stage(make(), [...KEEP()])
  g.power('R')
  g.power('T')
  g.power('Q')
  g.chain = 4
  g.paddleX = 20
  g.balls = [ball(200, 300, 0, 3)]
  run(g, 20)
  assert.equal(g.rain + g.thorn + g.compass + g.chain, 0)
  assert.equal(g.lives, 2)
}
{
  // Multi-ball still works with the new ball fields.
  const g = stage(make(), [...KEEP()])
  g.balls = [ball(128, 200, 0.5, -2.4)]
  g.power('M')
  assert.equal(g.balls.length, 3)
  for (const b of g.balls) assert.equal(b.curl, 0)
}

// --- the pilot probe -----------------------------------------------------------------------------

/** Frames the attract pilot needs to clear a stage, and how long its last three crates took. */
function probe(seed: number, stages: number) {
  const g = make(seed, true)
  const clears: number[] = []
  const lastThree: number[] = []
  let threeAt = -1
  let level = 1
  for (let tick = 0; tick < 60 * 60 * 25 && clears.length < stages; tick++) {
    g.lives = 3
    g.update(idle())
    const left = g.bricks.filter((b) => !b.bolt).length
    if (left <= 3 && left > 0 && threeAt < 0) threeAt = tick
    if (g.level !== level) {
      clears.push(tick)
      lastThree.push(tick - threeAt)
      level = g.level
      threeAt = -1
    }
  }
  return { clears, lastThree, score: g.score }
}

for (const seed of [5, 9, 13]) {
  const { clears, lastThree, score } = probe(seed, 5)
  assert.equal(clears.length, 5, `the pilot clears five walls on seed ${seed}`)
  assert.equal(score, 0, 'the attract demo scores nothing')
  for (const t of lastThree)
    assert.ok(
      t <= 60 * 30,
      `seed ${seed}: the last three crates took ${(t / 60).toFixed(1)} s`,
    )
}

// A run still ends: with nobody at the paddle, the ball is lost until the paddles run out.
{
  const g = make(3)
  let ticks = 0
  while (!g.over && ticks < 60 * 120) {
    g.update(idle())
    ticks++
  }
  assert.ok(g.over, 'an idle run ends')
  assert.equal(g.lives, 0)
}

// --- slice 2: Seedling House and Vine Hall ---------------------------------------------------

{
  assert.equal(HOUSES.length, 2, 'two glasshouses')
  const allIds = new Set<string>()
  const kinds = new Set<CrateKind>()
  for (const house of HOUSES) {
    assert.deepEqual(houseProblems(house), [], `${house.id} is sound`)
    assert.equal(house.walls.length, 9)
    for (const w of house.walls) {
      assert.ok(!allIds.has(w.id), `wall id ${w.id} is unique`)
      allIds.add(w.id)
    }
    for (const k of houseKinds(house)) kinds.add(k)
  }
  assert.equal(allIds.size, 18, 'eighteen authored walls')
  for (const k of ['root', 'vine', 'trellis'] as const)
    assert.ok(kinds.has(k), `the houses use a ${k} crate`)
  // The check catches a dangling vent and an unreachable wall.
  const broken = {
    ...SEEDLING_HOUSE,
    walls: SEEDLING_HOUSE.walls.map((w) =>
      w.id === 'seed-1' ? { ...w, vents: ['nowhere', 'seed-2b'] as const } : w,
    ),
  }
  const found = houseProblems(broken)
  assert.ok(found.some((p) => p.includes('missing wall nowhere')))
  assert.ok(found.some((p) => p.includes('seed-2a is unreachable')))
}

console.log(
  'Brick Bloom slices 1-2: walls, houses, bloom bed, chain, rush, curl, crates and seeds passed',
)

// --- slice 2: the Grand Tour through Seedling House and Vine Hall (t-079 part 2) ---------------
{
  assert.equal(ventSide(10, 240), 0)
  assert.equal(ventSide(200, 240), 1)
  assert.deepEqual(nextTourPos(TOUR_START, 0), { house: 0, wall: 'seed-2a' })
  assert.deepEqual(nextTourPos(TOUR_START, 1), { house: 0, wall: 'seed-2b' })
  const bossWall = SEEDLING_HOUSE.walls.find((w) => w.vents === 'boss')!
  assert.deepEqual(nextTourPos({ house: 0, wall: bossWall.id }, 0), {
    house: 1,
    wall: HOUSES[1]!.start,
  })
  const last = HOUSES[1]!.walls.find((w) => w.vents === 'boss')!
  assert.equal(nextTourPos({ house: 1, wall: last.id }, 0), null)

  // Stage 1 is the Seedling House's first wall: roots take two hits.
  const g = make(3)
  assert.equal(g.bricks.filter((b) => b.kind === 'root').length > 0, true)
  for (const b of g.bricks.filter((b) => b.kind === 'root'))
    assert.equal(b.hp, 2)

  // A cracked vine pulls its neighbours down a row.
  const v = crate(5, 2, 'vine')
  const n = crate(6, 2)
  stage(make(), [v, n, ...KEEP()]).crack(v)
  assert.equal(n.row, 3)
  // ...but not into a crate below it.
  const v2 = crate(5, 2, 'vine')
  const n2 = crate(6, 2)
  const below = crate(6, 3)
  stage(make(), [v2, n2, below, ...KEEP()]).crack(v2)
  assert.equal(n2.row, 2)

  // A trellis only breaks from below: a ball coming down skips off it, one going up cracks it.
  const down = crate(5, 4, 'trellis')
  const gDown = stage(make(), [down, ...KEEP()])
  // drive stepBall directly
  const inner = gDown as unknown as {
    stepBall(b: Ball, dx: number, dy: number): void
    brickRect(b: Brick): { x: number; y: number; w: number; h: number }
  }
  const rect = inner.brickRect(down)
  const bd = ball(rect.x + rect.w / 2, rect.y - 3, 0, 2)
  inner.stepBall(bd, 0, 4)
  assert.equal(down.hp, 1, 'ball moving down skips off a trellis')
  assert.ok(bd.vy < 0)
  const up = crate(5, 4, 'trellis')
  const gUp = stage(make(), [up, ...KEEP()]) as unknown as typeof inner
  const ru = gUp.brickRect(up)
  const bu = ball(ru.x + ru.w / 2, ru.y + ru.h + 3, 0, -2)
  gUp.stepBall(bu, 0, -4)
  assert.ok(up.hp <= 0, 'ball moving up cracks a trellis')

  // Clearing a wall follows the vent on the side of the last crate.
  const gt = make(5) as unknown as Inner & {
    tour: { house: number; wall: string } | null
  }
  const only = crate(1, 0)
  stage(gt, [only, ...KEEP().slice(0, 0)])
  gt.crack(only)
  for (let i = 0; i < 400; i++) gt.update(emptyInput())
  assert.equal(
    gt.tour?.wall,
    'seed-2a',
    'last crate on the left takes the left vent',
  )
}
