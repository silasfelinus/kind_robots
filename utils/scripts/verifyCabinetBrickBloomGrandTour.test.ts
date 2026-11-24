// /utils/scripts/verifyCabinetBrickBloomGrandTour.test.ts
//
// Brick Bloom depth pass, slice 2 (conductor kr-arcade/t-079, depth-pass CABINETS.md section 11):
// the rest of the Seedling House and Vine Hall tour. Mister Mulch and the Tangle Rose with their
// three phases, the Potting Bench, golden seeds 1-2 in their vault crates, the house map and title
// cards, and save/resume at each glasshouse through utils/arcade/saves.ts. Ends with a pilot probe:
// the attract demo still scores 0 and cheers Mister Mulch up, and runs still end.
//
//   npx tsx utils/scripts/verifyCabinetBrickBloomGrandTour.test.ts
import assert from 'node:assert/strict'
import brickBloom from '../arcade/games/brickBloom'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import {
  BOSS_SPECS,
  HURT_TICKS,
  bossHealth,
  bossOf,
  hitBoss,
  newSweep,
  openBoss,
  spawnBoss,
  stepBoss,
  sweepCellAt,
} from '../arcade/brickBloom/bosses'
import type { Boss } from '../arcade/brickBloom/bosses'
import {
  BENCH_ITEMS,
  PETALS,
  VAULTS,
  VAULT_HITS,
  buy,
  emptyKit,
  freshSave,
  readBloomSave,
  resumable,
  vaultAt,
} from '../arcade/brickBloom/bench'
import type { BloomSave } from '../arcade/brickBloom/bench'
import { HOUSE_CARDS, houseMap, richRoute } from '../arcade/brickBloom/map'
import { HOUSES, houseWall } from '../arcade/brickBloom/houses'
import { FULL_BLOOM, LEFT } from '../arcade/brickBloom/rules'
import { COLS } from '../arcade/brickBloom/walls'
import { MAX_SAVE_BYTES, sanitizeSaves, withSave } from '../arcade/saves'
import { ARCADE_GAMES } from '../arcade/games'

// --- the bosses as data and pure steps -------------------------------------------------------

assert.equal(bossOf(0), 'mister-mulch')
assert.equal(bossOf(1), 'tangle-rose')
assert.equal(bossOf(2), 'sunny-saguaro', 'slice 3: the Cactus Dome boss')
assert.equal(bossOf(3), 'queen-koi', 'slice 3: the Lily Pond House boss')
assert.equal(bossOf(4), 'gloom-bloom', 'the Night Bloom House boss')
for (const id of ['mister-mulch', 'tangle-rose'] as const) {
  const spec = BOSS_SPECS[id]
  const guards = spec.cells.filter((c) => c.guard)
  assert.ok(guards.length >= 3, `${id} has guards to crack in phase 1`)
  for (const c of spec.cells) {
    assert.ok(c.col >= 0 && c.col < COLS && c.row >= 0 && c.row < 9)
    assert.ok(c.hp >= 1)
  }
  assert.equal(spec.phases.length, 3, `${id}: three phase banners`)
}
assert.equal(
  BOSS_SPECS['tangle-rose'].cells.filter((c) => c.guard).length,
  3,
  'the Tangle Rose is fed by three roots',
)
{
  // Phase 1 is a shield; the guards down open phase 2; hits run phase 2 into 3, then the cheer.
  const b = spawnBoss('mister-mulch')
  assert.equal(b.phase, 1)
  assert.equal(hitBoss(b), 'shielded', 'phase 1: the plates shield his face')
  assert.equal(bossHealth(b), 1)
  openBoss(b)
  assert.equal(b.phase, 2)
  b.hurt = 0
  const [p1, p2, p3] = BOSS_SPECS['mister-mulch'].hits
  assert.equal(p1, 0, 'his first phase is won on the plates, not hits')
  assert.equal(hitBoss(b), 'hit')
  assert.equal(b.hurt, HURT_TICKS)
  assert.equal(hitBoss(b), 'none', 'no double hit inside the hurt flash')
  for (let i = 1; i < p2 - 1; i++) {
    b.hurt = 0
    assert.equal(hitBoss(b), 'hit')
  }
  b.hurt = 0
  assert.equal(hitBoss(b), 'phase', 'the last phase-2 hit opens phase 3')
  assert.equal(b.phase, 3)
  assert.equal(b.hits, p3)
  assert.ok(bossHealth(b) < 1 && bossHealth(b) > 0)
  for (let i = 0; i < p3 - 1; i++) {
    b.hurt = 0
    assert.equal(hitBoss(b), 'hit')
  }
  b.hurt = 0
  assert.equal(hitBoss(b), 'defeated')
  assert.equal(b.defeated, true)
  assert.equal(bossHealth(b), 0)
  assert.equal(hitBoss(b), 'none')
}
/** Run a boss until it has fired, returning how many ticks the tell lasted before the shots. */
function untilFired(b: Boss, rng: () => number): number {
  let telling = 0
  for (let t = 0; t < 1200; t++) {
    const before = b.shots.length + b.sweeps.length
    stepBoss(b, 128, rng)
    if (b.tell > 0) telling++
    if (b.shots.length + b.sweeps.length > before) return telling
  }
  return -1
}
{
  // Mister Mulch telegraphs (the dribble), then drops a clod; in phase 3 he lowers and sweeps.
  const rng = mulberry32(3)
  const b = spawnBoss('mister-mulch')
  for (let t = 0; t < 400; t++) stepBoss(b, 128, rng)
  assert.equal(b.shots.length, 0, 'phase 1: no clods yet')
  openBoss(b)
  const tell = untilFired(b, rng)
  assert.ok(tell >= 30, `a clod is telegraphed (${tell} ticks)`)
  assert.equal(b.shots[0]!.kind, 'clod')
  b.phase = 3
  const xs: number[] = []
  for (let t = 0; t < 600; t++) {
    stepBoss(b, 128, rng)
    xs.push(b.x)
  }
  assert.ok(b.y > 90, 'phase 3: he lowers on his chains')
  assert.ok(
    Math.max(...xs) - Math.min(...xs) > 100,
    'phase 3: he sweeps side to side',
  )
  for (let i = 1; i < xs.length; i++)
    assert.ok(Math.abs(xs[i]! - xs[i - 1]!) <= 1.6 + 1e-9, 'never jumps')
}
{
  // The Tangle Rose: a telegraphed fan of five petals, then vine walls that creep down.
  const rng = mulberry32(5)
  const b = spawnBoss('tangle-rose')
  openBoss(b)
  const tell = untilFired(b, rng)
  assert.ok(tell >= 30)
  assert.equal(b.shots.filter((s) => s.kind === 'petal').length, 5)
  assert.ok(
    b.shots.every((s) => s.vy > 0),
    'petals rain down',
  )
  b.shots = []
  b.phase = 3
  b.timer = 1
  untilFired(b, rng)
  assert.equal(b.sweeps.length, 1, 'phase 3: a vine wall')
  const y0 = b.sweeps[0]!.y
  stepBoss(b, 128, rng)
  assert.ok(b.sweeps[0]!.y > y0, 'and it sweeps down the screen')
}
for (let seed = 1; seed < 40; seed++) {
  const s = newSweep(mulberry32(seed), 100)
  const gaps = s.cells.map((on, c) => (on ? -1 : c)).filter((c) => c >= 0)
  assert.equal(gaps.length, 3, 'three gaps to aim through')
  for (let i = 1; i < gaps.length; i++)
    assert.ok(gaps[i]! - gaps[i - 1]! > 1, 'gaps never touch')
}
{
  const s = { y: 100, cells: Array.from({ length: COLS }, (_, c) => c !== 4) }
  const mid = (c: number) => LEFT + (c + 0.5) * ((256 - 16) / COLS)
  assert.equal(sweepCellAt(s, mid(2), 104, 2.5), 2)
  assert.equal(sweepCellAt(s, mid(4), 104, 2.5), -1, 'the gap lets it by')
  assert.equal(sweepCellAt(s, mid(2), 80, 2.5), -1)
}

// --- the bench, the vaults and the map ------------------------------------------------------

assert.equal(BENCH_ITEMS.length, 5, 'five things on the Potting Bench')
{
  const kit = emptyKit()
  assert.equal(buy(10, kit, false, 'wide', 'W'), null, 'too few petals')
  const sold = buy(200, kit, false, 'seed', 'R')!
  assert.equal(sold.kit.seed, 'R')
  assert.equal(sold.purse, 200 - BENCH_ITEMS[0]!.price)
  assert.equal(
    buy(sold.purse, sold.kit, false, 'seed', 'W'),
    null,
    'one starter seed',
  )
  const wide = buy(500, kit, false, 'wide', 'W')!
  assert.equal(wide.wide, true)
  assert.equal(buy(500, kit, true, 'wide', 'W'), null, 'the wide paddle lasts')
}
for (const [i, house] of HOUSES.entries()) {
  const v = VAULTS[house.id]!
  const wall = houseWall(house, v.wall)!
  assert.ok(wall, `${house.id}: the vault wall exists`)
  assert.ok(
    wall.rows[v.row]![v.col] !== '.',
    `${house.id}: the vault sits on a crate`,
  )
  assert.deepEqual(vaultAt(i, v.wall), { col: v.col, row: v.row })
  assert.equal(vaultAt(i, house.start), null)
  assert.ok(
    richRoute(house).includes(v.wall),
    `${house.id}: the golden seed is on the rich route`,
  )
  const map = houseMap(house, 256, 80, 260)
  assert.equal(map.nodes.length, 9, 'every wall is on the map')
  assert.equal(new Set(map.nodes.map((n) => `${n.x},${n.y}`)).size, 9)
  assert.equal(map.nodes.find((n) => n.id === house.start)!.tier, 0)
  assert.ok(map.boss.y < Math.min(...map.nodes.map((n) => n.y)))
  assert.equal(map.edges.length, 14, 'two vents out of each of seven walls')
  assert.ok(HOUSE_CARDS[house.id], `${house.id} has a title card`)
}

// --- the saved tour ---------------------------------------------------------------------------

assert.equal(readBloomSave(null), null)
assert.equal(readBloomSave({ v: 2 }), null)
assert.equal(readBloomSave({ ...freshSave(), score: -5 }), null)
assert.equal(readBloomSave({ ...freshSave(), house: 7 }), null)
{
  const s = readBloomSave({
    ...freshSave(['seedling', 'nowhere', 'seedling']),
    house: 1,
    stage: 7,
    kit: { seed: 'M', plots: true, bumble: 'yes' },
    petals: 10 ** 9,
  })!
  assert.deepEqual(s.golden, ['seedling'], 'unknown golden seeds are dropped')
  assert.equal(s.kit.seed, null, 'multi-ball is no starter seed')
  assert.equal(s.kit.plots, true)
  assert.equal(s.kit.bumble, false)
  assert.equal(s.petals, 0)
  assert.equal(resumable(s), true)
  assert.equal(resumable({ ...s, house: 0 }), false)
  assert.equal(resumable({ ...s, house: HOUSES.length }), false)
  assert.ok(JSON.stringify(s).length < MAX_SAVE_BYTES)
  const stored = sanitizeSaves(withSave({}, 'brick-bloom', s))
  assert.deepEqual(stored['brick-bloom'], s, 'the arcade store keeps it')
}

// --- the cabinet ------------------------------------------------------------------------------

type Brick = {
  col: number
  row: number
  hp: number
  maxHp: number
  bolt: boolean
  kind: string
  open: boolean
  flash: number
  guard?: boolean
  vault?: boolean
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
  save: BloomSave | null | undefined
  menuOpen: boolean
  tour: { house: number; wall: string } | null
  boss: Boss | null
  bricks: Brick[]
  balls: Ball[]
  bed: number[]
  paddleX: number
  paddleV: number
  purse: number
  roomy: boolean
  kit: { seed: string | null; plots: boolean; bumble: boolean; hint: boolean }
  golden: Set<string>
  goldenDrop: { x: number; y: number; house: string } | null
  muddy: number
  stung: number
  wide: number
  sticky: number
  rain: number
  bumble: unknown
  clear: number
  lost: number
  card: { kind: string; ticks: number } | null
  bench: { house: number; cursor: number; seed: number } | null
  offer: BloomSave | null
  path: string[]
  serveTimer: number
  puffs: unknown[]
  drops: unknown[]
  update(input: InputFrame): void
  render(g: CanvasRenderingContext2D): void
  crack(b: Brick): void
  startStage(stage: number): void
  stepBall(b: Ball, dx: number, dy: number): void
  brickRect(b: Brick): { x: number; y: number; w: number; h: number }
  readonly paddleW: number
}

function make(
  opts: {
    seed?: number
    demo?: boolean
    resume?: unknown
    select?: boolean
  } = {},
): Inner {
  return brickBloom.create({
    rng: mulberry32(opts.seed ?? 7),
    sound: { play: () => {} },
    demo: opts.demo ?? false,
    hiScore: 0,
    resume: opts.resume,
    selectScreen: opts.select,
  }) as unknown as Inner
}

const idle = () => emptyInput()
const tap = (button: keyof InputFrame['held']) => {
  const f = emptyInput()
  f.held[button] = true
  f.pressed[button] = true
  return f
}
const hold = (button: keyof InputFrame['held']) => {
  const f = emptyInput()
  f.held[button] = true
  return f
}
const run = (g: Inner, ticks: number, frame: () => InputFrame = idle) => {
  for (let i = 0; i < ticks; i++) g.update(frame())
}
const ball = (x: number, y: number, vx: number, vy: number): Ball => ({
  x,
  y,
  vx,
  vy,
  stuck: null,
  curl: 0,
  curlDir: 0,
  since: 999,
  hitDir: 0,
})
/** Crack every crate on the board and let the clear, its map card and the next wall begin. */
function clearWall(g: Inner, side: 'left' | 'right' = 'left') {
  const keep = [...g.bricks].sort((a, b) =>
    side === 'left' ? b.col - a.col : a.col - b.col,
  )
  for (const b of keep) {
    if (b.bolt) continue
    b.hp = 1
    // The ring shields its crate: let go of it first.
    ;(g as unknown as { ring: null }).ring = null
    g.crack(b)
  }
  g.goldenDrop = null
  run(g, 1)
  assert.ok(g.clear > 0, 'the wall blooms')
  run(g, 160)
  if (g.card) run(g, g.card.ticks + 1)
}

{
  // A boss vent wall leads to the house boss, not straight to the next house.
  const g = make()
  g.tour = { house: 0, wall: 'seed-5a' }
  g.startStage(5)
  clearWall(g)
  assert.ok(g.boss, 'Mister Mulch hangs at the end of the Seedling House')
  assert.equal(g.boss!.id, 'mister-mulch')
  assert.equal(g.level, 6)
  assert.equal(g.tour?.house, 0)
  assert.equal(g.bricks.filter((b) => b.guard).length, 6, 'six face plates')
  assert.equal(g.puffs.length, 0, 'no gloom puffs at a boss')

  // Phase 1: the face is plated; the plates crack open phase 2.
  g.serveTimer = 0
  run(g, 60)
  for (const b of g.bricks.filter((b) => b.guard)) {
    b.hp = 1
    g.crack(b)
  }
  g.lives = 9
  run(g, 1)
  assert.equal(g.boss!.phase, 2)
  assert.equal(g.bumble, null, 'Bumble never rushes a boss')

  // A clod on a still paddle makes it sluggish; a swat while moving sends it off.
  g.balls = [ball(30, 200, 0, -0.01)]
  g.paddleX = 128
  g.paddleV = 0
  g.boss!.shots = [{ kind: 'clod', x: 128, y: 292, vx: 0, vy: 2 }]
  g.boss!.tell = 0
  g.boss!.timer = 999
  run(g, 4)
  assert.ok(g.muddy > 0, 'a clod makes the paddle muddy')
  const start = g.paddleX
  run(g, 20, () => hold('right'))
  const muddyRun = g.paddleX - start
  g.muddy = 0
  g.paddleX = 128
  g.paddleV = 0
  const start2 = g.paddleX
  run(g, 20, () => hold('right'))
  assert.ok(
    g.paddleX - start2 > muddyRun * 1.5,
    'the paddle runs slower while muddy',
  )
  g.paddleX = 128
  g.paddleV = 4
  g.boss!.shots = [{ kind: 'clod', x: 128, y: 293, vx: 0, vy: 2 }]
  const before = g.score
  g.update(hold('right'))
  assert.equal(g.muddy, 0, 'a swat while moving keeps the paddle clean')
  assert.ok(g.score > before)

  // The ball bonks him: face hits through phase 2 and phase 3, then he sneezes flowers.
  g.bed = [0, 0, 0, 0, 0, 0, 0, 0]
  const scoreBefore = g.score
  const pursed = g.purse
  for (let guard = 0; guard < 40 && !g.boss!.defeated; guard++) {
    const boss = g.boss!
    boss.hurt = 0
    boss.shots = []
    const b = ball(boss.x, boss.y + boss.h / 2 + 3, 0, -3)
    g.balls = [b]
    g.stepBall(b, 0, -3)
  }
  assert.equal(g.boss!.defeated, true, 'Mister Mulch is cheered up')
  run(g, 1)
  assert.ok(g.clear > 0)
  assert.ok(g.score - scoreBefore >= BOSS_SPECS['mister-mulch'].score)
  assert.ok(g.purse - pursed >= PETALS.boss)
  assert.ok(
    g.bed.every((p) => p >= 2),
    'the sneeze shower plants the whole bed',
  )
  run(g, 160)
  assert.ok(g.bench, 'the Potting Bench opens between houses')
  assert.equal(g.menuOpen, true)
  assert.equal(g.bench!.house, 1)
  assert.equal(g.save?.house, 1, 'the tour saved at the next glasshouse')
  assert.equal(g.save?.stage, 7)

  // At the bench: not enough petals says so; with petals, buy the lot that fits.
  g.purse = 20
  run(g, 25)
  g.update(tap('a'))
  assert.equal(g.kit.seed, null, 'twenty petals buy no starter seed')
  g.purse = 400
  g.update(tap('right'))
  g.update(tap('a'))
  assert.equal(g.kit.seed, 'S', 'the starter seed picked with left/right')
  for (const _ of [1, 2, 3, 4]) {
    g.update(tap('down'))
    g.update(tap('a'))
  }
  assert.equal(g.roomy, true)
  assert.deepEqual(
    { plots: g.kit.plots, bumble: g.kit.bumble, hint: g.kit.hint },
    { plots: true, bumble: true, hint: true },
  )
  assert.equal(g.purse, 400 - BENCH_ITEMS.reduce((s, i) => s + i.price, 0))
  g.bed = [0, 0, 0, 0, 0, 0, 0, 0]
  g.update(tap('down'))
  g.update(tap('a'))
  assert.equal(g.bench, null, 'on to Vine Hall')
  assert.equal(g.tour?.house, 1)
  assert.equal(g.tour?.wall, 'vine-1')
  assert.equal(g.card?.kind, 'house', 'the Vine Hall title card')
  assert.equal(g.bed[3], FULL_BLOOM, 'two plots start in bloom')
  assert.equal(g.bed[4], FULL_BLOOM)
  assert.equal(g.save?.house, 1)
  assert.equal(g.save?.kit.hint, true, 'the save keeps the kit')
  run(g, 25)
  g.update(tap('a'))
  assert.equal(g.card, null, 'A skips the card')
  assert.ok(g.sticky > 0, 'the starter seed works on every wall of the house')
  g.wide = 600
  assert.equal(g.paddleW, 56)
  g.wide = 0
  assert.equal(g.paddleW, 44, 'the wider base paddle')
  // The Bumble pass: Bumble comes for the last six.
  g.bricks = g.bricks.filter((b) => !b.bolt).slice(0, 6)
  ;(g as unknown as { ring: null }).ring = null
  g.balls = [ball(30, 200, 0, -1)]
  run(g, 2)
  assert.ok(g.bumble, 'six crates left brings Bumble with a pass')

  // Through Vine Hall to the Tangle Rose, cheer her up, and the tour runs on.
  g.tour = { house: 1, wall: 'vine-5a' }
  g.startStage(g.level + 1)
  clearWall(g)
  assert.equal(g.boss?.id, 'tangle-rose')
  assert.equal(g.bricks.filter((b) => b.guard).length, 3)
  assert.ok(
    g.bricks.filter((b) => b.guard).every((b) => b.hp === 3),
    'the roots take three cracks each',
  )
  g.serveTimer = 0
  run(g, 30)
  for (const b of g.bricks.filter((b) => b.guard)) {
    b.hp = 1
    g.crack(b)
  }
  run(g, 1)
  assert.equal(g.boss!.phase, 2)
  // A petal stings the paddle still for a moment and costs no life.
  const lives = g.lives
  g.paddleX = 128
  g.paddleV = 0
  g.balls = [ball(30, 200, 0, -0.01)]
  g.boss!.shots = [{ kind: 'petal', x: 128, y: 292, vx: 0, vy: 2 }]
  g.boss!.timer = 999
  run(g, 3)
  assert.ok(g.stung > 0)
  const stuck = g.paddleX
  run(g, 10, () => hold('right'))
  assert.equal(g.paddleX, stuck, 'stung still')
  assert.equal(g.lives, lives, 'a sting never costs a life')
  for (let guard = 0; guard < 40 && !g.boss!.defeated; guard++) {
    const boss = g.boss!
    boss.hurt = 0
    boss.shots = []
    boss.sweeps = []
    const b = ball(boss.x, boss.y + boss.h / 2 + 3, 0, -3)
    g.balls = [b]
    g.stepBall(b, 0, -3)
  }
  assert.equal(g.boss!.defeated, true)
  run(g, 170)
  // Slice 3: past the Tangle Rose the bench opens before the Cactus Dome, and the tour saves.
  const bench = g.bench as Inner['bench']
  assert.ok(bench, 'the bench opens before the Cactus Dome')
  assert.equal(bench.house, 2)
  assert.equal(g.boss, null)
  assert.equal(g.save?.house, 2, 'saved at the Cactus Dome')
  assert.equal(resumable(g.save ?? null), true)
}
{
  // Vine walls crack where the ball meets them, and the gaps let it through.
  const g = make()
  g.tour = { house: 1, wall: 'vine-5b' }
  g.startStage(11)
  clearWall(g)
  const boss = g.boss!
  openBoss(boss)
  boss.sweeps = [
    { y: 150, cells: Array.from({ length: COLS }, (_, c) => c !== 5) },
  ]
  const mid = (c: number) => LEFT + (c + 0.5) * 20
  const hit = ball(mid(2), 162, 0, -3)
  g.stepBall(hit, 0, -3)
  g.stepBall(hit, 0, -3)
  assert.equal(boss.sweeps[0]!.cells[2], false, 'the segment cracks')
  assert.ok(hit.vy > 0, 'and bounces the ball')
  const through = ball(mid(5), 162, 0, -3)
  for (let i = 0; i < 6; i++) g.stepBall(through, 0, -3)
  assert.ok(through.vy < 0 && through.y < 150, 'a gap lets it by')
}
{
  // The golden seed: a vault crate on the rich route takes three cracks and drops it.
  const g = make()
  g.tour = { house: 0, wall: 'seed-4b' }
  g.startStage(4)
  const vault = g.bricks.find((b) => b.vault)!
  assert.ok(vault, 'Sprout Stairs hides the vault')
  assert.equal(vault.hp, VAULT_HITS)
  for (let i = 0; i < VAULT_HITS; i++) g.crack(vault)
  assert.ok(g.goldenDrop, 'out falls a golden seed')
  g.goldenDrop!.x = g.paddleX
  g.goldenDrop!.y = 290
  g.balls = [ball(30, 200, 0, -1)]
  run(g, 3)
  assert.equal(g.goldenDrop, null)
  assert.ok(g.golden.has('seedling'), 'caught and kept')
  assert.deepEqual(g.save?.golden, ['seedling'], 'saved the moment it lands')
  // Cracked again on a later run, the vault pays petals instead.
  g.startStage(4)
  const again = g.bricks.find((b) => b.vault)!
  const purse = g.purse
  for (let i = 0; i < VAULT_HITS; i++) g.crack(again)
  assert.equal(g.goldenDrop, null)
  assert.ok(g.purse - purse >= PETALS.vault)
}
{
  // A golden seed still falling when the wall blooms: Bumble catches it.
  const g = make()
  g.tour = { house: 1, wall: 'vine-5b' }
  g.startStage(10)
  const vault = g.bricks.find((b) => b.vault)!
  g.bricks = [vault]
  ;(g as unknown as { ring: null }).ring = null
  vault.hp = 1
  g.crack(vault)
  assert.ok(g.goldenDrop)
  g.balls = [ball(30, 200, 0, -1)]
  run(g, 2)
  assert.ok(g.golden.has('vine-hall'), 'Bumble caught it at the bloom')
}
{
  // The house map card follows each wall; the path climbs it.
  const g = make({ seed: 4 })
  clearWall(g, 'right')
  assert.equal(g.tour?.wall, 'seed-2b')
  assert.deepEqual(g.path, ['seed-1', 'seed-2b'])
  const g2 = make({ seed: 4 })
  g2.bricks = [g2.bricks[0]!]
  g2.crack(g2.bricks[0]!)
  run(g2, 151)
  assert.equal(g2.card?.kind, 'map', 'the map shows between walls')
  const level = g2.level
  run(g2, 10, () => tap('a'))
  assert.ok(g2.card, 'too soon to skip')
  run(g2, 20)
  g2.update(tap('a'))
  assert.equal(g2.card, null)
  assert.equal(g2.level, level)
}
{
  // A real game opens on the Seedling House title card; tests and demos start at once.
  assert.equal(make({ select: true }).card?.kind, 'house')
  assert.equal(make().card, null)
  assert.equal(make({ demo: true, select: true }).card, null)
}
{
  // Resume: a save at Vine Hall's bench is offered; A continues it there.
  const kept: BloomSave = {
    ...freshSave(['seedling']),
    house: 1,
    stage: 7,
    score: 42_000,
    lives: 4,
    petals: 90,
    wide: true,
  }
  const g = make({ resume: kept, select: true })
  assert.ok(g.offer, 'the saved tour is offered')
  assert.equal(g.menuOpen, true)
  g.update(tap('a'))
  assert.equal(g.offer, null)
  assert.ok(g.bench, 'back at the Potting Bench')
  assert.equal(g.score, 42_000)
  assert.equal(g.lives, 4)
  assert.equal(g.purse, 90)
  assert.equal(g.roomy, true)
  assert.ok(g.golden.has('seedling'))
  run(g, 25)
  g.update(tap('b'))
  assert.equal(g.tour?.house, 1)
  assert.equal(g.level, 7, 'Vine Hall opens at the saved stage')

  // B starts a new tour; the golden seeds stay.
  const fresh = make({ resume: kept, select: true })
  fresh.update(tap('b'))
  assert.equal(fresh.offer, null)
  assert.equal(fresh.score, 0)
  assert.equal(fresh.tour?.house, 0)
  assert.deepEqual(fresh.save?.golden, ['seedling'])
  assert.equal(fresh.save?.house, 0)

  // A game over keeps the glasshouse as a continue, never the score.
  const lost = make({ resume: kept })
  lost.update(tap('a'))
  run(lost, 25)
  lost.update(tap('b'))
  lost.lives = 1
  if (lost.card) run(lost, 300)
  for (let t = 0; t < 60 * 60 && !lost.over; t++) lost.update(idle())
  assert.ok(lost.over)
  assert.equal(lost.save?.continued, true)
  const cont = make({ resume: lost.save })
  cont.update(tap('a'))
  assert.equal(cont.score, 0, 'a continue starts from zero')
  assert.equal(cont.lives, 3)

  // Demos never read or write a save; garbage is ignored.
  const demo = make({ demo: true, resume: kept })
  assert.equal(demo.offer, null)
  assert.equal(demo.save, undefined)
  assert.equal(make({ resume: { v: 9 } }).offer, null)
  assert.equal(make().save, undefined, 'a fresh game keeps no save yet')
}

// --- drawing every new screen ------------------------------------------------------------------

function stubContext(): CanvasRenderingContext2D {
  const gradient = { addColorStop: () => {} }
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'createLinearGradient' || prop === 'createRadialGradient')
          return () => gradient
        if (prop === 'getTransform') return () => ({ a: 1 })
        if (prop === 'measureText') return () => ({ width: 6 })
        return () => {}
      },
      set: () => true,
    },
  ) as CanvasRenderingContext2D
}
{
  const g = make({ select: true })
  const ctx = stubContext()
  g.render(ctx)
  run(g, 300)
  g.tour = { house: 1, wall: 'vine-5a' }
  g.startStage(11)
  clearWall(g)
  openBoss(g.boss!)
  g.boss!.phase = 3
  g.boss!.sweeps = [newSweep(mulberry32(1), 120)]
  g.boss!.shots = [{ kind: 'petal', x: 100, y: 200, vx: 0, vy: 1 }]
  g.goldenDrop = { x: 100, y: 200, house: 'vine-hall' }
  g.render(ctx)
  const s = make({ resume: { ...freshSave(), house: 1, stage: 7 } })
  s.render(ctx)
  s.update(tap('a'))
  s.render(ctx)
}

// --- the pilot probe ---------------------------------------------------------------------------

{
  // The attract demo walks the Seedling House, cheers Mister Mulch up, visits the bench by itself,
  // and never scores.
  const g = make({ seed: 9, demo: true })
  let metMulch = false
  let cheered = false
  for (let t = 0; t < 60 * 60 * 14 && !cheered; t++) {
    g.lives = 3
    g.update(idle())
    if (g.boss?.id === 'mister-mulch') metMulch = true
    if (metMulch && g.tour?.house === 1 && !g.bench) cheered = true
  }
  assert.ok(metMulch, 'the demo reaches Mister Mulch')
  assert.ok(cheered, 'and cheers him up, past the bench')
  assert.equal(g.score, 0, 'the attract demo scores nothing')
  assert.equal(g.save, undefined, 'and saves nothing')
}
{
  // A run still ends, even at a boss: nobody at the paddle loses every ball.
  const g = make({ seed: 3 })
  g.tour = { house: 0, wall: 'seed-5b' }
  g.startStage(5)
  clearWall(g)
  assert.ok(g.boss)
  let ticks = 0
  while (!g.over && ticks < 60 * 120) {
    g.update(idle())
    ticks++
  }
  assert.ok(g.over, 'an idle boss fight ends')
  const meta = ARCADE_GAMES.find((m) => m.slug === 'brick-bloom')!
  assert.ok(g.score <= meta.maxPlausibleScore)
}

console.log(
  'Brick Bloom Grand Tour: bosses, bench, golden seeds, map, cards, saves and pilot probe passed',
)
