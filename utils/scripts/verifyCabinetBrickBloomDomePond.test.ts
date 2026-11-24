// /utils/scripts/verifyCabinetBrickBloomDomePond.test.ts
//
// Brick Bloom depth pass, slice 3 (conductor kr-arcade/t-080, depth-pass CABINETS.md section 11):
// the Cactus Dome and the Lily Pond House. Prickle, sand-timer, lily-pad and bubble crates and the
// under-water ball; the tumbleweed, shell beetle, frog bot and mirror bug; the V (Vent) and D (Duo
// Paddle) seeds; Sunny Saguaro and Queen Koi; golden seeds 3-4. Ends with a pilot probe: the
// attract demo walks both houses past both bosses scoring 0, and runs still end. Also pins the
// floating-text fix: popups never print over each other or off the glass.
//
//   npx tsx utils/scripts/verifyCabinetBrickBloomDomePond.test.ts
import assert from 'node:assert/strict'
import brickBloom from '../arcade/games/brickBloom'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import {
  BOSS_SPECS,
  CROWN_SHUT,
  LEAP_TICKS,
  armKnock,
  armTips,
  armTouches,
  bossOpen,
  bossSolid,
  crownCount,
  crownOpen,
  hitBoss,
  ofPhase,
  spawnBoss,
  stepBoss,
  whirling,
} from '../arcade/brickBloom/bosses'
import type { Boss } from '../arcade/brickBloom/bosses'
import {
  BUMPER_R,
  LILY_DRIFT,
  PRICKLE_OVER,
  SAND_OPEN,
  SAND_RUN,
  WATER_BOTTOM,
  WATER_DRAG,
  WATER_TOP,
  bumperBounce,
  driftToward,
  inWater,
  lilyGoal,
  prickled,
  sandLeft,
  sandOpen,
  spawnBumper,
} from '../arcade/brickBloom/crates'
import {
  BEETLE_LANE,
  FROG_PUFF,
  FROG_WAIT,
  GHOST_LIFE,
  MIRROR_EVERY,
  MIRROR_SHIMMER,
  TUMBLE_TELL,
  beetleBonk,
  pestsOf,
  spawnBeetle,
  spawnFrog,
  spawnMirror,
  spawnTumbleweed,
  splitGhost,
  stepFrog,
  stepGhost,
  stepMirror,
  stepTumbleweed,
} from '../arcade/brickBloom/pests'
import {
  CACTUS_DOME,
  HOUSES,
  HOUSE_LEGEND,
  LILY_POND,
  houseKinds,
  houseProblems,
  houseWall,
  lilyRowProblems,
} from '../arcade/brickBloom/houses'
import { VAULTS, resumable } from '../arcade/brickBloom/bench'
import type { BloomSave } from '../arcade/brickBloom/bench'
import { HOUSE_CARDS, richRoute } from '../arcade/brickBloom/map'
import { FULL_BLOOM, LEFT, RIGHT } from '../arcade/brickBloom/rules'
import { COLS, parseWall } from '../arcade/brickBloom/walls'
import type { CrateKind } from '../arcade/brickBloom/walls'
import { ARCADE_GAMES } from '../arcade/games'

// --- the two houses as data ------------------------------------------------------------------

assert.equal(HOUSES[2], CACTUS_DOME)
assert.equal(HOUSES[3], LILY_POND)
for (const [house, kinds] of [
  [CACTUS_DOME, ['prickle', 'sand', 'puffball']],
  [LILY_POND, ['lily', 'bubble']],
] as const) {
  assert.deepEqual(houseProblems(house), [], `${house.id} is sound`)
  assert.equal(house.walls.length, 9)
  const used = houseKinds(house)
  for (const k of kinds) assert.ok(used.has(k), `${house.id} uses ${k} crates`)
  assert.ok(HOUSE_CARDS[house.id], `${house.id} has a title card`)
  const v = VAULTS[house.id]!
  assert.ok(
    richRoute(house).includes(v.wall),
    `${house.id}: vault on the rich route`,
  )
  assert.notEqual(houseWall(house, v.wall)!.rows[v.row]![v.col], '.')
}
assert.equal(BOSS_SPECS['sunny-saguaro'].name, 'SUNNY SAGUARO')
assert.equal(BOSS_SPECS['queen-koi'].name, 'QUEEN KOI')
assert.ok(
  lilyRowProblems({ id: 'x', name: 'x', rows: ['ll##........'] }).length > 0,
  'a lily pad never shares its drifting row with another crate',
)
for (const w of LILY_POND.walls)
  assert.ok(
    parseWall(w, HOUSE_LEGEND).some((c) => c.kind === 'lily' && c.row >= 6),
    `${w.id}: its lily pads float on the water rows`,
  )

// --- the crates and the water ------------------------------------------------------------------

assert.equal(prickled(3, 4), 3 + 0.3)
assert.equal(
  prickled(4.7, 4),
  4 + PRICKLE_OVER,
  'a prickle pushes past the cap, a little',
)
assert.equal(sandOpen(0, 0), false, 'sand runs first')
assert.equal(sandOpen(SAND_RUN, 0), true, 'then the timer flips')
assert.equal(sandOpen(SAND_RUN + SAND_OPEN, 0), false, 'and runs again')
assert.equal(sandLeft(0, 0), 1)
assert.ok(sandLeft(SAND_RUN / 2, 0) > 0.4 && sandLeft(SAND_RUN / 2, 0) < 0.6)
assert.ok(inWater(WATER_TOP + 1) && inWater(WATER_BOTTOM - 1))
assert.ok(!inWater(WATER_TOP - 2) && !inWater(296), 'the paddle stays dry')
for (let t = 0; t < 4000; t += 37) {
  const dx = lilyGoal(6, t, 1, 9, 20)
  assert.ok(LEFT + 1 * 20 + dx >= LEFT - 1e-9, 'pads never drift off the left')
  assert.ok(LEFT + 9 * 20 + dx + 20 <= RIGHT + 1e-9, 'or off the right')
}
assert.equal(driftToward(0, 100), LILY_DRIFT, 'the current is gentle')
{
  const b = spawnBumper(100, 100)
  const v = bumperBounce(
    b,
    { x: 100 + BUMPER_R, y: 100, vx: -2, vy: 0 },
    2.5,
    5,
  )
  assert.ok(v && v.vx > 0, 'a bumper springs the ball straight away')
  assert.equal(
    bumperBounce(b, { x: 100 + BUMPER_R, y: 100, vx: -2, vy: 0 }, 2.5, 5),
    null,
    'then rings for a moment',
  )
}

// --- the pests -------------------------------------------------------------------------------

assert.deepEqual(pestsOf(2, 'cactus-1'), {
  tumbleweed: true,
  beetle: false,
  frog: false,
  mirror: false,
})
assert.deepEqual(pestsOf(3, 'lily-3a'), {
  tumbleweed: false,
  beetle: false,
  frog: true,
  mirror: true,
})
assert.equal(pestsOf(0, 'seed-3a').tumbleweed, false)
{
  const t = spawnTumbleweed(true)
  const x0 = t.x
  for (let i = 0; i < TUMBLE_TELL; i++) stepTumbleweed(t)
  assert.equal(t.x, x0, 'the dust puff tells before it rolls')
  stepTumbleweed(t)
  assert.ok(t.x > x0, 'then it rolls along the bed')
  let gone = false
  for (let i = 0; i < 2000 && !gone; i++) gone = stepTumbleweed(t)
  assert.ok(gone, 'and off the far side')
}
{
  const b = spawnBeetle(true)
  assert.equal(b.dir, 1)
  assert.equal(beetleBonk(b, b.x - 6), 'pop', 'banked in behind: pop')
  assert.equal(beetleBonk(b, b.x + 6), 'armour', 'from the front: armour')
  assert.equal(beetleBonk(b, b.x), 'armour', 'straight down on the shell')
  assert.equal(b.y, BEETLE_LANE)
}
{
  const f = spawnFrog(120)
  const seed = { x: 150, y: 140 }
  const events: string[] = []
  for (let t = 0; t < FROG_WAIT + FROG_PUFF + 2; t++) {
    const e = stepFrog(f, seed, mulberry32(1))
    if (e !== 'none') events.push(e)
  }
  assert.deepEqual(
    events.slice(0, 2),
    ['puff', 'tongue'],
    'it puffs, then licks',
  )
  assert.equal(f.tx, seed.x, 'the tongue reaches the seed')
  const far = spawnFrog(20)
  for (let t = 0; t < FROG_WAIT + FROG_PUFF; t++)
    stepFrog(far, { x: 240, y: 290 }, mulberry32(1))
  assert.notEqual(far.tx, 240, 'a seed out of reach is safe')
}
{
  const m = spawnMirror(0)
  let split = -1
  for (let t = 1; t < MIRROR_EVERY + MIRROR_SHIMMER + 2 && split < 0; t++)
    if (stepMirror(m)) split = t
  assert.equal(split, MIRROR_EVERY + MIRROR_SHIMMER, 'it shimmers, then splits')
  const ghost = splitGhost({ x: 100, y: 200, vx: 0, vy: 2 })
  assert.ok(Math.abs(Math.hypot(ghost.vx, ghost.vy) - 2) < 1e-9)
  const g2 = { ...ghost, x: 128, y: 292, vx: 0, vy: 2 }
  stepGhost(g2, 128, 18, 296)
  assert.ok(g2.vy < 0, 'a ghost bounces off the paddle too, to fool you')
  let lasts = 0
  const g3 = { ...ghost, x: 128, y: 100, vx: 1, vy: 0.3 }
  while (stepGhost(g3, 0, 1, 296) && lasts < 1000) lasts++
  assert.ok(lasts < GHOST_LIFE, 'and fades within four seconds')
}

// --- Sunny Saguaro and Queen Koi as pure steps ---------------------------------------------------

{
  const rng = mulberry32(2)
  const s = spawnBoss('sunny-saguaro')
  assert.equal(s.phase, 1)
  assert.equal(crownOpen(s), false)
  assert.equal(crownCount(s), 3, 'the crown counts 3...')
  assert.equal(hitBoss(s), 'shielded', 'shut, he shrugs the ball off')
  for (let i = 0; i < CROWN_SHUT[0] - 1; i++) stepBoss(s, 128, rng)
  assert.equal(crownCount(s), 1, '...2, 1...')
  stepBoss(s, 128, rng)
  assert.equal(crownOpen(s), true, '...and blooms')
  assert.equal(bossOpen(s), true)
  assert.equal(hitBoss(s), 'hit')
  // His arms reach out and knock a ball away from his trunk.
  const tip = armTips(s)[0]!
  assert.ok(armTouches(s, tip.x, tip.y, 2.5))
  assert.ok(!armTouches(s, s.x, 300, 2.5))
  const v = armKnock(s, { x: tip.x, y: tip.y, vx: -1, vy: -2 })
  assert.ok(Math.abs(Math.hypot(v.vx, v.vy) - Math.hypot(1, 2)) < 1e-9)
  assert.ok(s.knock > 0, 'a knock waits before the next')
  // Phase 2: a prickle ball is lobbed up, then falls to the paddle's line.
  s.phase = 2
  s.timer = 1
  let lob: Boss['shots'][number] | undefined
  for (let t = 0; t < 400 && !lob; t++) {
    stepBoss(s, 128, rng)
    lob = s.shots.find((x) => x.kind === 'prickle')
  }
  assert.ok(lob && lob.vy < 0, 'lobbed upward')
  let landed = false
  for (let t = 0; t < 400 && !landed; t++) {
    stepBoss(s, 128, rng)
    if (lob!.y >= 290) landed = true
  }
  assert.ok(landed, 'and comes down to be caught')
  assert.ok(lob!.x > LEFT && lob!.x < RIGHT)
}
{
  const rng = mulberry32(4)
  const k = spawnBoss('queen-koi')
  assert.equal(bossSolid(k), false, 'under the pads she is out of reach')
  assert.equal(hitBoss(k), 'shielded')
  let leapt = false
  let ripples = 0
  for (let t = 0; t < 600 && !leapt; t++) {
    stepBoss(k, 128, rng)
    if (k.tell > 0) ripples++
    leapt = k.leap > 0
  }
  assert.ok(leapt && ripples >= 30, 'ripples, then she leaps')
  assert.equal(bossSolid(k), true)
  let top = k.y
  for (let t = 0; t < LEAP_TICKS / 2; t++) {
    stepBoss(k, 128, rng)
    top = Math.min(top, k.y)
  }
  assert.ok(top < WATER_TOP - 20, 'high out of the water')
  assert.equal(hitBoss(k), 'hit', 'hit her as she leaps')
  k.phase = 2
  k.hurt = 0
  const flips = k.flips
  for (let t = 0; t < LEAP_TICKS + 2; t++) stepBoss(k, 128, rng)
  assert.equal(k.flips, flips + 1, 'phase 2: her splash-down flips the pads')
  k.phase = 3
  stepBoss(k, 128, rng)
  assert.equal(whirling(k), true, 'phase 3: the whirlpool')
  let rests = false
  for (let t = 0; t < 700; t++) {
    stepBoss(k, 128, rng)
    if (!whirling(k)) rests = true
  }
  assert.ok(rests, 'which rests between stirs')
}

// --- the cabinet ---------------------------------------------------------------------------

type Brick = {
  col: number
  row: number
  hp: number
  maxHp: number
  bolt: boolean
  kind: CrateKind
  open: boolean
  flash: number
  guard?: boolean
  vault?: boolean
  dx?: number
  sand?: number
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
  save: BloomSave | null | undefined
  tour: { house: number; wall: string } | null
  boss: Boss | null
  bench: { house: number } | null
  card: { ticks: number } | null
  bricks: Brick[]
  balls: Ball[]
  bed: number[]
  drops: Array<{ x: number; y: number; kind: string }>
  paddleX: number
  paddleV: number
  clear: number
  lastCrackX: number
  tumble: { x: number; tell: number } | null
  tumbleTimer: number
  beetle: { x: number; y: number; dir: number } | null
  frog: { x: number; y: number; puff: number } | null
  mirror: { x: number; y: number; t: number; shimmer: number } | null
  ghosts: unknown[]
  bumpers: unknown[]
  vent: { side: 0 | 1; ticks: number } | null
  duo: number
  duoX: number
  floaters: Array<{ x: number; y: number; text: string }>
  serveTimer: number
  puffs: unknown[]
  readonly seedPool: readonly string[]
  update(input: InputFrame): void
  render(g: CanvasRenderingContext2D): void
  crack(b: Brick): void
  power(kind: string): void
  float(f: { x: number; y: number; text: string; life: number }): void
  startStage(stage: number): void
  stepBall(b: Ball, dx: number, dy: number): void
  brickRect(b: Brick): { x: number; y: number; w: number; h: number }
}

function make(seed = 7, demo = false): Inner {
  return brickBloom.create({
    rng: mulberry32(seed),
    sound: { play: () => {} },
    demo,
    hiScore: 0,
  }) as unknown as Inner
}
const idle = () => emptyInput()
const run = (g: Inner, n: number, f: () => InputFrame = idle) => {
  for (let i = 0; i < n; i++) g.update(f())
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
const crate = (col: number, row: number, kind: CrateKind = 'crate'): Brick => ({
  col,
  row,
  hp: 1,
  maxHp: 1,
  bolt: false,
  kind,
  open: false,
  flash: 0,
})
/** Six far-off crates, so a staged board is never down to its last few (Bumble's rush). */
const KEEP = () => [0, 1, 2, 9, 10, 11].map((c) => crate(c, 0))
/** A wall of the given house, staged with only these crates and nothing else moving. */
function at(house: number, wall: string, bricks?: Brick[], seed = 7): Inner {
  const g = make(seed)
  g.tour = { house, wall }
  g.startStage(13 + house)
  if (bricks) g.bricks = bricks
  g.puffs = []
  g.serveTimer = 0
  return g
}
function clearTo(g: Inner) {
  for (const b of [...g.bricks]) {
    if (b.bolt) continue
    b.hp = 1
    b.sand = SAND_RUN
    g.crack(b)
  }
  run(g, 1)
  run(g, 160)
  if (g.card) run(g, g.card.ticks + 1)
}

{
  // Floating words: kept on the glass, and lifted clear of any word already there.
  const g = make()
  g.floaters.length = 0
  g.float({ x: 252, y: 100, text: '300', life: 30 })
  g.float({ x: 250, y: 102, text: '2 LEFT', life: 30 })
  const [a, b] = g.floaters
  assert.ok(
    a!.x + (a!.text.length * 6) / 2 <= 256,
    'the popup stays whole on screen',
  )
  assert.ok(b!.x + (b!.text.length * 6) / 2 <= 256)
  assert.ok(Math.abs(a!.y - b!.y) >= 9, 'and the label lifts clear of it')
}
{
  // Sand timers: unbreakable while the sand runs, crackable once flipped.
  const sand = crate(5, 4, 'sand')
  sand.sand = 0
  const g = at(2, 'cactus-2a', [sand, ...KEEP()])
  g.tick = 10
  g.crack(sand)
  assert.equal(sand.hp, 1, 'the sand still runs')
  g.tick = SAND_RUN + 5
  g.crack(sand)
  assert.ok(!g.bricks.includes(sand), 'flipped, it cracks')
}
{
  // A prickle crate speeds every ball up.
  const p = crate(5, 4, 'prickle')
  const g = at(2, 'cactus-2b', [p, ...KEEP()])
  g.balls = [ball(30, 200, 0, -2.5), ball(60, 200, 0, -2.5)]
  g.crack(p)
  for (const b of g.balls) assert.ok(Math.hypot(b.vx, b.vy) > 2.75)
}
{
  // A bubble crate pops into a bumper that springs the ball away.
  const bub = crate(5, 4, 'bubble')
  const g = at(3, 'lily-2b', [bub, ...KEEP()])
  g.crack(bub)
  assert.equal(g.bumpers.length, 1)
  const r = g.brickRect(bub)
  const b = ball(r.x + r.w / 2 + 6, r.y + r.h / 2, -2, 0.2)
  g.balls = [b]
  g.stepBall(b, -1, 0)
  assert.ok(b.vx > 0, 'sprung back')
  run(g, 300)
  assert.equal(g.bumpers.length, 0, 'the bumper bursts after a few seconds')
}
{
  // Lily rows drift together on the current and never leave the glass.
  const g = at(3, 'lily-3b')
  g.balls = [ball(30, 60, 0.01, -2.5)]
  const pads = g.bricks.filter((b) => b.kind === 'lily')
  assert.ok(pads.length >= 8)
  const seen = new Set<number>()
  for (let t = 0; t < 900; t++) {
    g.update(idle())
    g.lives = 3
    const row = g.bricks.filter((b) => b.kind === 'lily' && b.row === 6)
    const dxs = new Set(row.map((b) => b.dx ?? 0))
    assert.ok(dxs.size <= 1, 'one row, one drift')
    for (const p of row) {
      const r = g.brickRect(p)
      assert.ok(r.x >= LEFT - 1e-6 && r.x + r.w <= RIGHT + 1e-6)
      seen.add(Math.round(p.dx ?? 0))
    }
    if (g.clear) break
  }
  assert.ok(seen.size > 5, 'the pads really drift')
}
{
  // Under the water the ball moves slow; above it, at full speed.
  const g = at(3, 'lily-1', [...KEEP()])
  const wet = ball(128, 150, 0, 2.5)
  const dry = ball(60, 240, 0, 2.5)
  g.balls = [wet, dry]
  g.paddleX = 220
  run(g, 1)
  assert.ok(Math.abs(wet.y - 150 - 2.5 * WATER_DRAG) < 0.05, 'slow and floaty')
  assert.ok(Math.abs(dry.y - 240 - 2.5) < 0.05)
  const dome = at(2, 'cactus-1', [...KEEP()])
  const notWet = ball(128, 150, 0, 2.5)
  dome.balls = [notWet]
  run(dome, 1)
  assert.ok(Math.abs(notWet.y - 152.5) < 0.05, 'the Dome has no pond')
}
{
  // A tumbleweed flattens the bloom it rolls over; the paddle rolling onto it bonks it.
  const g = at(2, 'cactus-3a', [...KEEP()])
  g.balls = [ball(30, 60, 0.01, -2.5)]
  g.bed = [FULL_BLOOM, FULL_BLOOM, 0, 0, 0, 0, 0, 0]
  g.tumble = { ...spawnTumbleweed(true), tell: 0 }
  g.paddleX = 220
  run(g, 50)
  assert.ok(g.bed[0]! < 2, 'flattened')
  const score = g.score
  g.paddleX = g.tumble!.x + 10
  run(g, 1)
  assert.equal(g.tumble, null, 'bonked by the paddle')
  assert.ok(g.score > score)
  // The next one comes with its dust-puff tell.
  g.tumbleTimer = 1
  run(g, 1)
  const next = g.tumble as Inner['tumble']
  assert.ok(next && next.tell > 0)
}
{
  // The shell beetle: armoured in front, popped from behind.
  const g = at(2, 'cactus-3b', [...KEEP()])
  g.beetle = { x: 128, y: BEETLE_LANE, dir: 1, flash: 0 } as Inner['beetle'] & {
    flash: number
  }
  const front = ball(134, BEETLE_LANE + 9, 0, -2)
  g.stepBall(front, 0, -2)
  assert.ok(g.beetle, 'the front armour clangs')
  assert.ok(front.vy > 0)
  ;(g.beetle as unknown as { flash: number }).flash = 0
  const behind = ball(120, BEETLE_LANE + 9, 0, -2)
  g.stepBall(behind, 0, -2)
  assert.equal(g.beetle, null, 'banked in behind, it pops')
}
{
  // The frog bot tongues a falling seed; bonked while it puffs, it pops.
  const g = at(3, 'lily-2a', [...KEEP()])
  g.balls = [ball(30, 60, 0.01, -2.5)]
  const frog = g.frog!
  ;(frog as unknown as { wait: number }).wait = 1
  g.drops = [{ x: frog.x + 20, y: frog.y + 30, kind: 'W' }]
  for (let t = 0; t < FROG_PUFF + 3; t++) {
    g.update(idle())
    // Hold the seed in the frog's reach while it puffs.
    if (g.drops[0]) g.drops[0].y = frog.y + 30
  }
  assert.equal(g.drops.length, 0, 'GULP: the seed is gone')
  frog.puff = 30
  const b = ball(frog.x, frog.y + 8, 0, -2)
  g.stepBall(b, 0, -2)
  assert.equal(g.frog, null, 'bonked while puffing')
}
{
  // The mirror bug splits a ghost ball; the ghost cracks nothing.
  const g = at(3, 'lily-3a', [...KEEP()])
  const m = g.mirror!
  m.t = MIRROR_EVERY - 1
  // Far from the bug's path at this point of its figure-eight, so the ball doesn't pop it.
  g.balls = [ball(230, 60, 0, -1)]
  run(g, MIRROR_SHIMMER + 2)
  assert.equal(g.ghosts.length, 1, 'a ghost ball')
  const crates = g.bricks.length
  run(g, 100)
  assert.equal(g.bricks.length >= crates - 1, true)
  const lives = g.lives
  g.balls = [ball(30, 60, 0.01, -2.5)]
  run(g, 250)
  assert.equal(g.ghosts.length, 0, 'it fades')
  assert.equal(g.lives, lives, 'and losing it costs nothing')
}
{
  // The Vent seed: fly the ball out of the hatch and the wall is skipped, by that side's vent.
  const g = at(2, 'cactus-1', [...KEEP()])
  g.power('V')
  assert.ok(g.vent)
  g.vent!.side = 1
  const b = ball(RIGHT - 4, 170, 3, -1)
  g.balls = [b]
  g.stepBall(b, 3, -1)
  assert.ok(g.clear > 0, 'vented: the wall blooms')
  run(g, 160)
  assert.equal(
    g.tour?.wall,
    'cactus-2b',
    'out of the right vent, onto the right route',
  )
  // No vents at a boss.
  const boss = at(2, 'cactus-5a')
  clearTo(boss)
  assert.equal(boss.boss?.id, 'sunny-saguaro')
  boss.power('V')
  assert.equal(boss.vent, null)
}
{
  // The Duo Paddle: a helper paddle bot hovering above yours bounces a falling ball back.
  const g = at(3, 'lily-1', [...KEEP()])
  g.power('D')
  assert.ok(g.duo > 0)
  g.duoX = 128
  const b = ball(128, 246, 0, 3)
  g.stepBall(b, 0, 3)
  assert.ok(b.vy < 0, 'bounced up off the duo')
}
{
  // V and D join the seeds in their own houses, and never fall in the first two.
  assert.ok(!at(0, 'seed-1').seedPool.includes('V'))
  assert.ok(!at(1, 'vine-1').seedPool.includes('D'))
  assert.ok(at(2, 'cactus-1').seedPool.includes('V'))
  assert.ok(!at(2, 'cactus-1').seedPool.includes('D'))
  const pond = at(3, 'lily-1').seedPool
  assert.ok(pond.includes('V') && pond.includes('D'))
}
{
  // Golden seeds 3 and 4 sit in their vaults.
  for (const [house, wall] of [
    [2, 'cactus-4b'],
    [3, 'lily-4b'],
  ] as const)
    assert.ok(
      at(house, wall).bricks.some((b) => b.vault),
      `${wall} has a vault`,
    )
}
{
  // Sunny Saguaro in the cabinet: hit him in bloom, catch a prickle ball for an extra ball.
  const g = at(2, 'cactus-5b')
  clearTo(g)
  const s = g.boss!
  assert.equal(s.id, 'sunny-saguaro')
  assert.equal(g.tumble, null, 'no pests at a boss')
  g.lives = 9
  s.crown = 0
  s.knock = 99
  let hit = ball(s.x, s.y + s.h / 2 + 3, 0, -3)
  g.balls = [hit]
  g.stepBall(hit, 0, -3)
  assert.equal(
    s.hits,
    BOSS_SPECS['sunny-saguaro'].hits[0],
    'shut crown: no hit',
  )
  s.phase = 2
  s.hits = 3
  g.paddleX = 128
  g.balls = [ball(30, 60, 0.01, -2.5)]
  s.shots = [{ kind: 'prickle', x: 128, y: 293, vx: 0, vy: 1 }]
  s.timer = 999
  run(g, 3)
  assert.equal(
    g.balls.length,
    2,
    'a caught prickle ball splits off as an extra ball',
  )
  for (let n = 0; n < 40 && !s.defeated; n++) {
    s.hurt = 0
    s.crown = ofPhase(CROWN_SHUT, s.phase)
    s.knock = 99
    s.shots = []
    hit = ball(s.x, s.y + s.h / 2 + 3, 0, -3)
    g.balls = [hit]
    g.stepBall(hit, 0, -3)
  }
  assert.ok(s.defeated, 'Sunny Saguaro is sunny again')
  run(g, 170)
  assert.equal(g.bench?.house, 3, 'the bench opens before the Lily Pond House')
  assert.equal(g.save?.house, 3)
}
{
  // Queen Koi in the cabinet: the pads flip at her splash-down; the whirlpool turns the ball.
  const g = at(3, 'lily-5a')
  clearTo(g)
  const k = g.boss!
  assert.equal(k.id, 'queen-koi')
  g.lives = 9
  const pads = g.bricks.filter((b) => b.kind === 'lily')
  const cols = pads.map((p) => p.col)
  k.phase = 2
  k.hits = 3
  k.flips++
  g.balls = [ball(30, 60, 0.01, -2.5)]
  run(g, 1)
  assert.deepEqual(
    pads.map((p) => p.col),
    cols.map((c) => COLS - 1 - c),
    'the pads flip end for end',
  )
  k.phase = 3
  k.hits = 4
  k.whirl = 0
  const b = ball(60, 140, 0.3, 2.5)
  g.balls = [b, ball(30, 60, 0.01, -2.5)]
  const before = Math.atan2(b.vy, b.vx)
  run(g, 10)
  assert.ok(
    Math.abs(Math.atan2(b.vy, b.vx) - before) > 0.1,
    'the whirlpool turns it',
  )
  for (let n = 0; n < 40 && !k.defeated; n++) {
    k.hurt = 0
    k.leap = 40
    k.y = 90
    k.shots = []
    const up = ball(k.x, k.y + k.h / 2 + 3, 0, -3)
    g.balls = [up]
    g.stepBall(up, 0, -3)
  }
  assert.ok(k.defeated, 'Queen Koi is cheered up')
  run(g, 170)
  assert.deepEqual(g.tour, { house: 4, wall: HOUSES[4]!.start })
  assert.equal(g.bench?.house, 4, 'the Night Bloom House opens')
  assert.equal(g.save?.house, 4)
  assert.equal(resumable(g.save ?? null), true)
}

// --- drawing every new thing ------------------------------------------------------------------

function stubContext(): CanvasRenderingContext2D {
  const gradient = { addColorStop: () => {} }
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'createLinearGradient' || prop === 'createRadialGradient')
          return () => gradient
        if (prop === 'getTransform') return () => ({ a: 1 })
        return () => {}
      },
      set: () => true,
    },
  ) as CanvasRenderingContext2D
}
{
  const ctx = stubContext()
  for (const [house, wall] of [
    [2, 'cactus-3a'],
    [3, 'lily-3a'],
  ] as const) {
    const g = at(house, wall)
    g.power('V')
    g.power('D')
    run(g, 400)
    g.render(ctx)
    clearTo(g)
    run(g, 200)
    g.render(ctx)
  }
}

// --- the pilot probe ---------------------------------------------------------------------------

{
  // The attract demo walks the Cactus Dome and the Lily Pond House, cheers up both bosses, and
  // never scores.
  const g = make(9, true)
  g.tour = { house: 2, wall: 'cactus-1' }
  g.startStage(13)
  const met = new Set<string>()
  for (let t = 0; t < 60 * 60 * 50 && g.tour; t++) {
    g.lives = 3
    g.update(idle())
    if (g.boss) met.add(g.boss.id)
  }
  assert.ok(
    met.has('sunny-saguaro') && met.has('queen-koi'),
    'the demo meets both bosses',
  )
  assert.equal(g.tour, null, 'and walks out past Queen Koi')
  assert.equal(g.score, 0, 'the attract demo scores nothing')
  assert.equal(g.save, undefined)
}
{
  // A run still ends, in the pond too: nobody at the paddle loses every ball.
  const g = at(3, 'lily-2a', undefined, 3)
  let ticks = 0
  while (!g.over && ticks < 60 * 180) {
    g.update(idle())
    ticks++
  }
  assert.ok(g.over, 'an idle run in the pond ends')
  const meta = ARCADE_GAMES.find((m) => m.slug === 'brick-bloom')!
  assert.ok(g.score <= meta.maxPlausibleScore)
}

console.log(
  'Brick Bloom Cactus Dome and Lily Pond House: crates, water, pests, V and D, Saguaro, Koi, golden seeds 3-4 and pilot probe passed',
)
