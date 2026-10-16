// /utils/arcade/games/duneDiggerDash.ts
//
// Dune Digger Dash -- the Kind Robots Arcade's tunnel-and-pump riff (conductor kr-arcade/t-009
// game factory, approved pitch 2026-10-11-kr-cabinet-robot-digger-dunes). Dig, a small digger
// robot, burrows through layered sand and inflates wandering sand-sprites with a pump until they
// pop, or drops a loose boulder on them.
//
// Arrows dig and walk, A or B pumps the sprite in front of you (four pumps pop it; it deflates if
// you stop). A sprite you have not inflated hurts, and so does a falling boulder. Dig out from
// under a boulder and it wobbles, then falls. Every round brings more sprites, faster pursuit and
// more boulders; sprites that cannot reach you float through the sand as eyes and dig in nearby.
//
// The rules (the grid, the pump, pops, boulders, the pilot's aim) are small exported functions so
// the engine test can pin each one.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bandedGradient,
  cachedLayer,
  drawSprite,
  dropShadow,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
} from '../snes'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

export const W = 256
export const H = 288
export const TILE = 16
export const COLS = 16
export const ROWS = 18
/** Row 2 is the open surface; rows 0-1 are the HUD; rows 3..17 are sand. */
export const SURFACE_ROW = 2
export const LAST_ROW = ROWS - 1

export const START_LIVES = 3
export const EXTRA_LIFE_AT = 20000
export const INVULN = 100
export const POP_STAGES = 4
export const DEFLATE_TICKS = 80
export const HOSE_TILES = 3
export const PUMP_COOL = 7
export const WOBBLE_TICKS = 50
export const BOULDER_SPEED = 2
export const HURRY_TICKS = 2400
export const DIG_POINTS = 10
export const HIT_RANGE = 10

export const DUNE_CURVES = {
  /** Sand-sprites in a round. */
  sprites: { start: 3, step: 1, limit: 8 },
  /** Boulders loose in the sand. */
  boulders: { start: 3, step: 0.5, limit: 6 },
  /** Sprite speed in pixels per tick (the player walks at 0.9). */
  speed: { start: 0.55, step: 0.06, limit: 1.0 },
  /** Ticks before a sprite floats through the sand as eyes. */
  ghostGap: { start: 720, step: -60, limit: 300 },
} as const

export const PLAYER_SPEED = 0.9
export const GHOST_SPEED = 0.55
export const GHOST_MIN = 130
export const GHOST_MAX = 420

export function spriteCount(level: number): number {
  return Math.round(levelCurve(level, DUNE_CURVES.sprites))
}

export function boulderCount(level: number): number {
  return Math.round(levelCurve(level, DUNE_CURVES.boulders))
}

export function spriteSpeed(level: number): number {
  return levelCurve(level, DUNE_CURVES.speed)
}

export function ghostGap(level: number): number {
  return Math.round(levelCurve(level, DUNE_CURVES.ghostGap))
}

/** The centre of tile column/row `i`, in pixels. */
export function centre(i: number): number {
  return i * TILE + TILE / 2
}

export function tileOf(px: number): number {
  return Math.floor(px / TILE)
}

/** How deep a row is: 0 (shallow) to 3 (deepest), four rows a band. */
export function depthBand(row: number): number {
  return Math.max(0, Math.min(3, Math.floor((row - SURFACE_ROW - 1) / 4)))
}

/** Points for popping a sprite: the deeper it was, the more it pays. */
export function popPoints(row: number): number {
  return 200 + depthBand(row) * 100
}

/** Points when a boulder crushes `n` sprites in one fall. */
export function crushPoints(n: number): number {
  if (n <= 0) return 0
  if (n === 1) return 1000
  if (n === 2) return 2500
  return 4000
}

export function roundBonus(level: number): number {
  return 500 * Math.min(level, 10)
}

export type Dir = { dx: -1 | 0 | 1; dy: -1 | 0 | 1 }
export const DIRS: readonly Dir[] = [
  { dx: 1, dy: 0 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: 0, dy: -1 },
]

export type Grid = {
  /** dug[row][col]: true where the sand is already open. */
  dug: boolean[][]
  /** Tiles a boulder holds (while resting or wobbling). */
  rock: boolean[][]
}

export function newGrid(): Grid {
  const dug = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, () => r <= SURFACE_ROW),
  )
  const rock = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => false),
  )
  return { dug, rock }
}

export function inBounds(c: number, r: number): boolean {
  return c >= 0 && c < COLS && r >= SURFACE_ROW && r <= LAST_ROW
}

/** True when a sprite may walk into tile (c, r): open sand with no boulder in it. */
export function open(grid: Grid, c: number, r: number): boolean {
  return inBounds(c, r) && grid.dug[r]![c]! && !grid.rock[r]![c]!
}

/** True when the player may enter tile (c, r): any sand but a boulder. */
export function walkable(grid: Grid, c: number, r: number): boolean {
  return inBounds(c, r) && !grid.rock[r]![c]!
}

export type Boulder = {
  c: number
  r: number
  state: 'rest' | 'wobble' | 'fall'
  t: number
  /** Pixel centre while falling. */
  y: number
  crushed: number
}

/** A resting boulder wobbles when the tile under it is open (and not held by another boulder). */
export function unsupported(grid: Grid, b: Boulder): boolean {
  const r = b.r + 1
  if (r > LAST_ROW) return false
  return grid.dug[r]![b.c]! && !grid.rock[r]![b.c]!
}

/** The sprite (by lane) a pump from tile (pc, pr) facing `dir` reaches, if any. */
export function pumpTarget<T extends { x: number; y: number }>(
  grid: Grid,
  px: number,
  py: number,
  dir: Dir,
  sprites: readonly T[],
): T | null {
  if (dir.dx === 0 && dir.dy === 0) return null
  let best: T | null = null
  let bestDist = Infinity
  for (const s of sprites) {
    const alongX = dir.dx !== 0
    const cross = alongX ? Math.abs(s.y - py) : Math.abs(s.x - px)
    if (cross > 8) continue
    const along = alongX ? (s.x - px) * dir.dx : (s.y - py) * dir.dy
    if (along < 4 || along > HOSE_TILES * TILE + 6) continue
    // The hose runs through open tunnel only.
    let clear = true
    const steps = Math.floor(along / TILE)
    let c = tileOf(px)
    let r = tileOf(py)
    for (let i = 0; i < steps; i++) {
      c += dir.dx
      r += dir.dy
      if (!open(grid, c, r)) {
        clear = false
        break
      }
    }
    if (clear && along < bestDist) {
      best = s
      bestDist = along
    }
  }
  return best
}

export type Sprite = {
  x: number
  y: number
  dx: number
  dy: number
  acc: number
  stage: number
  deflate: number
  ghost: number
  ghostIn: number
  eyes: boolean
  anim: number
}

/** Build a sprite sitting at tile (c, r). */
export function newSprite(c: number, r: number, level: number): Sprite {
  return {
    x: centre(c),
    y: centre(r),
    dx: 0,
    dy: 0,
    acc: 0,
    stage: 0,
    deflate: 0,
    ghost: 0,
    ghostIn: ghostGap(level),
    eyes: false,
    anim: 0,
  }
}

/** Add a pump to a sprite. Returns true when it pops. */
export function pump(s: Sprite): boolean {
  s.stage++
  s.deflate = DEFLATE_TICKS
  return s.stage >= POP_STAGES
}

/** Tick a sprite's deflate timer: an unpumped sprite loses a stage now and then. */
export function relax(s: Sprite) {
  if (s.stage <= 0) return
  if (--s.deflate <= 0) {
    s.stage--
    s.deflate = s.stage > 0 ? DEFLATE_TICKS : 0
  }
}

export function aligned(x: number, y: number): boolean {
  return x % TILE === TILE / 2 && y % TILE === TILE / 2
}

/**
 * Pick the direction a sprite takes at a tile centre: any open neighbour but straight back (unless
 * it is a dead end), leaning toward the player, with a little wander.
 */
export function chooseDir(
  grid: Grid,
  s: { x: number; y: number; dx: number; dy: number },
  tx: number,
  ty: number,
  rng: () => number,
): Dir {
  const c = tileOf(s.x)
  const r = tileOf(s.y)
  const options = DIRS.filter((d) => open(grid, c + d.dx, r + d.dy))
  if (options.length === 0) return { dx: 0, dy: 0 }
  const forward = options.filter((d) => !(d.dx === -s.dx && d.dy === -s.dy))
  const pool = forward.length > 0 ? forward : options
  if (rng() < 0.18) return pool[Math.floor(rng() * pool.length)]!
  let best = pool[0]!
  let bestCost = Infinity
  for (const d of pool) {
    const nx = centre(c + d.dx)
    const ny = centre(r + d.dy)
    const cost = Math.hypot(nx - tx, ny - ty)
    if (cost < bestCost) {
      best = d
      bestCost = cost
    }
  }
  return best
}

/** Sand tiles a fresh round gives each sprite: a small cave of three open tiles. */
export function buildRound(
  level: number,
  rng: () => number,
): { grid: Grid; sprites: Sprite[]; boulders: Boulder[] } {
  const grid = newGrid()
  const sprites: Sprite[] = []
  const n = spriteCount(level)
  const used: Array<[number, number]> = []
  for (let i = 0; i < n; i++) {
    // Spread caves over the depth bands and across the width.
    const r = 5 + ((i * 3 + Math.floor(rng() * 3)) % 12)
    let c = 1 + Math.floor(rng() * (COLS - 4))
    if (Math.abs(c - 8) < 2) c = c < 8 ? 3 : 12
    for (let k = 0; k < 3; k++) grid.dug[r]![c + k] = true
    used.push([c, r])
    sprites.push(newSprite(c + 1, r, level))
  }
  const boulders: Boulder[] = []
  const want = boulderCount(level)
  let guard = 0
  while (boulders.length < want && guard++ < 400) {
    const r = 4 + Math.floor(rng() * 11)
    const c = Math.floor(rng() * COLS)
    if (grid.dug[r]![c] || grid.rock[r]![c]) continue
    // Keep a boulder off the player's start shaft and out of any cave's reach.
    if (c === 8) continue
    if (grid.dug[r + 1]?.[c]) continue
    if (grid.dug[r - 1]?.[c] && r - 1 > SURFACE_ROW) continue
    grid.rock[r]![c] = true
    boulders.push({ c, r, state: 'rest', t: 0, y: centre(r), crushed: 0 })
  }
  return { grid, sprites, boulders }
}

/** The way the attract pilot heads for a sprite: first into its lane, then along it. */
export function pilotDir(
  px: number,
  py: number,
  tx: number,
  ty: number,
  blocked: (d: Dir) => boolean,
): Dir {
  const ox = tx - px
  const oy = ty - py
  const horizontal: Dir = { dx: ox > 0 ? 1 : -1, dy: 0 }
  const vertical: Dir = { dx: 0, dy: oy > 0 ? 1 : -1 }
  const inLaneX = Math.abs(oy) < 7
  const inLaneY = Math.abs(ox) < 7
  let order: Dir[]
  if (inLaneX) order = [horizontal, vertical]
  else if (inLaneY) order = [vertical, horizontal]
  else {
    order =
      Math.abs(ox) < Math.abs(oy)
        ? [horizontal, vertical]
        : [vertical, horizontal]
  }
  for (const d of order) if (!blocked(d)) return d
  return order[order.length - 1]!
}

// --- art ----------------------------------------------------------------------------------------

const DIG_PALETTE = {
  B: RAMPS.steel[2],
  W: RAMPS.cream[3],
  E: RAMPS.night[1],
  Y: RAMPS.gold[3],
  O: RAMPS.gold[1],
  T: RAMPS.teal[2],
  U: RAMPS.teal[1],
}

const DIG_A = pixelSprite(
  [
    '...YYYY...',
    '..YYOOYY..',
    '..BWWWWB..',
    '..BEWWEB..',
    '..BWWWWB..',
    '.TTTTTTTT.',
    '.TTTYYTTT.',
    '.UTTTTTTU.',
    '..TT..TT..',
    '..BB..BB..',
  ],
  DIG_PALETTE,
)

const DIG_B = pixelSprite(
  [
    '...YYYY...',
    '..YYOOYY..',
    '..BWWWWB..',
    '..BEWWEB..',
    '..BWWWWB..',
    '.TTTTTTTT.',
    '.TTTYYTTT.',
    '.UTTTTTTU.',
    '.TT....TT.',
    '.BB....BB.',
  ],
  DIG_PALETTE,
)

const SPRITE_PALETTE = {
  S: RAMPS.rust[2],
  L: RAMPS.rust[3],
  D: RAMPS.rust[1],
  Y: RAMPS.gold[4],
  K: RAMPS.night[0],
}

const SPRITE_A = pixelSprite(
  [
    '..SSSS..',
    '.SLLSSS.',
    'SLYSSYSS',
    'SSKSSKSS',
    'SSSSSSSS',
    'SDSDDSDS',
    '.SSSSSS.',
    '.D.SS.D.',
  ],
  SPRITE_PALETTE,
)

const SPRITE_B = pixelSprite(
  [
    '..SSSS..',
    '.SLLSSS.',
    'SLYSSYSS',
    'SSKSSKSS',
    'SSSSSSSS',
    'SDSDDSDS',
    '.SSSSSS.',
    '..D..D..',
  ],
  SPRITE_PALETTE,
)

const EYES = pixelSprite(
  ['.YY..YY.', 'YYKYYKYY', '.YY..YY.'],
  { Y: RAMPS.gold[4], K: RAMPS.night[0] },
  { outline: null },
)

const ROCK = pixelSprite(
  [
    '..GGGGGGGG..',
    '.GLLGGGGGGG.',
    'GLLGGGGDGGGG',
    'GLGGGGGGGGDG',
    'GGGGDGGGGGGG',
    'GGGGGGGGGDGG',
    'GDGGGGGGGGGG',
    '.GGGGGDGGGD.',
    '..DDGGGGDD..',
  ],
  {
    G: RAMPS.steel[2],
    L: RAMPS.steel[3],
    D: RAMPS.steel[1],
  },
)

type Dune = {
  sky: readonly [string, string]
  sand: readonly [string, string, string, string]
  grass: string
  pebble: string
}

/** Six dunes, one per round in turn: gold, rose, moonlit blue, ember, oasis-teal and frostglass sand. */
export const DUNES: readonly Dune[] = [
  {
    sky: [RAMPS.sky[2], RAMPS.sky[3]],
    sand: [RAMPS.gold[3], RAMPS.gold[2], RAMPS.rust[3], RAMPS.rust[2]],
    grass: RAMPS.leaf[2],
    pebble: RAMPS.gold[1],
  },
  {
    sky: [RAMPS.pink[2], RAMPS.gold[3]],
    sand: [RAMPS.pink[3], RAMPS.pink[2], RAMPS.purple[2], RAMPS.purple[1]],
    grass: RAMPS.leaf[1],
    pebble: RAMPS.pink[1],
  },
  {
    sky: [RAMPS.night[2], RAMPS.sky[1]],
    sand: [RAMPS.water[3], RAMPS.water[2], RAMPS.sky[1], RAMPS.purple[1]],
    grass: RAMPS.teal[1],
    pebble: RAMPS.water[1],
  },
  {
    sky: [RAMPS.ember[1], RAMPS.rust[3]],
    sand: [RAMPS.ember[3], RAMPS.rust[2], RAMPS.ember[1], RAMPS.ember[0]],
    grass: RAMPS.gold[1],
    pebble: RAMPS.ember[4],
  },
  {
    sky: [RAMPS.teal[3], RAMPS.leaf[3]],
    sand: [RAMPS.leaf[3], RAMPS.teal[2], RAMPS.teal[1], RAMPS.leaf[0]],
    grass: RAMPS.leaf[2],
    pebble: RAMPS.teal[4],
  },
  {
    sky: [RAMPS.steel[3], RAMPS.sky[4]],
    sand: [RAMPS.sky[4], RAMPS.sky[3], RAMPS.steel[2], RAMPS.steel[1]],
    grass: RAMPS.water[3],
    pebble: RAMPS.steel[4],
  },
]

export function duneFor(level: number): number {
  return (Math.max(1, level) - 1) % DUNES.length
}

// --- the cabinet --------------------------------------------------------------------------------

type Floater = { x: number; y: number; text: string; life: number }
type Mode = 'play' | 'dying' | 'cleared'

class DuneDiggerDash implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number
  private tick = 0
  private roundTick = 0

  private mode: Mode = 'play'
  private modeTicks = 0
  private x = centre(8)
  private y = centre(SURFACE_ROW)
  private face: Dir = { dx: 0, dy: 1 }
  private acc = 0
  private stepAnim = 0
  private invuln = 0
  private pumpCool = 0
  private hose = 0
  private hoseLen = 0
  private popped = 0
  private visited = new Set<number>()

  private grid: Grid = newGrid()
  private sprites: Sprite[] = []
  private boulders: Boulder[] = []
  private nextExtra = EXTRA_LIFE_AT
  private banner: { text: string; ticks: number } | null = null
  private floaters: Floater[] = []
  private sparkles = new Sparkles()
  private sparkRng = backdropRng(77)
  private pilotPump = 0

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startRound()
    this.banner = { text: 'ROUND 1', ticks: 70 }
  }

  private startRound() {
    const round = buildRound(this.level, this.rng)
    this.grid = round.grid
    this.sprites = round.sprites
    this.boulders = round.boulders
    this.roundTick = 0
    this.visited.clear()
    this.placeAtStart()
  }

  private placeAtStart() {
    this.x = centre(8)
    this.y = centre(SURFACE_ROW)
    this.face = { dx: 0, dy: 1 }
    this.acc = 0
    this.hose = 0
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.sparkles.update()
    for (const f of this.floaters) {
      f.y -= 0.4
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return

    if (this.mode === 'dying') {
      if (--this.modeTicks <= 0) this.afterDeath()
      return
    }
    if (this.mode === 'cleared') {
      if (--this.modeTicks <= 0) this.nextRound()
      return
    }

    const c = this.demo ? this.pilotInput() : input
    this.roundTick++
    if (this.invuln > 0) this.invuln--
    if (this.pumpCool > 0) this.pumpCool--
    if (this.hose > 0) this.hose--
    this.movePlayer(c)
    if ((c.pressed.a || c.pressed.b) && this.pumpCool === 0) this.firePump()
    this.moveSprites()
    this.moveBoulders()
    if (this.mode !== 'play') return
    this.checkHits()
    if (this.mode !== 'play') return
    if (this.sprites.length === 0) this.clearRound()
  }

  private blockedFor(d: Dir): boolean {
    const nx = this.x + d.dx * (TILE / 2 + 1)
    const ny = this.y + d.dy * (TILE / 2 + 1)
    return !walkable(this.grid, tileOf(nx), tileOf(ny))
  }

  /** The direction the player asks for: when two are held, the one that turns a corner. */
  private wantedDir(c: InputFrame): Dir | null {
    // Prefer the direction that turns the way you are not already going.
    const dirs: Dir[] = []
    if (c.held.left && !c.held.right) dirs.push({ dx: -1, dy: 0 })
    else if (c.held.right && !c.held.left) dirs.push({ dx: 1, dy: 0 })
    if (c.held.up && !c.held.down) dirs.push({ dx: 0, dy: -1 })
    else if (c.held.down && !c.held.up) dirs.push({ dx: 0, dy: 1 })
    if (dirs.length === 2) {
      const sameAxis = (d: Dir) =>
        d.dx !== 0 ? this.face.dx !== 0 : this.face.dy !== 0
      return dirs.find((d) => !sameAxis(d)) ?? dirs[0]!
    }
    return dirs[0] ?? null
  }

  private movePlayer(c: InputFrame) {
    const want = this.wantedDir(c)
    if (!want) return
    this.face = want
    this.acc += PLAYER_SPEED
    while (this.acc >= 1) {
      this.acc -= 1
      this.stepPlayer(want)
    }
    this.digHere()
  }

  /** One pixel toward `d`, easing onto the lane's centre line first. */
  private stepPlayer(d: Dir) {
    const horizontal = d.dx !== 0
    const cross = horizontal ? this.y : this.x
    const off = (cross % TILE) - TILE / 2
    if (off !== 0) {
      // Slide onto the centre line before turning into a new lane.
      const slide = off > 0 ? -1 : 1
      if (horizontal) this.y += slide
      else this.x += slide
      this.stepAnim++
      return
    }
    if (this.blockedFor(d)) return
    const nx = this.x + d.dx
    const ny = this.y + d.dy
    if (nx < TILE / 2 || nx > W - TILE / 2) return
    if (ny < centre(SURFACE_ROW) || ny > centre(LAST_ROW)) return
    this.x = nx
    this.y = ny
    this.stepAnim++
  }

  private digHere() {
    const c = tileOf(this.x)
    const r = tileOf(this.y)
    if (!inBounds(c, r)) return
    // Every new tile you reach pays, dug or already open (the surface included).
    const key = r * COLS + c
    if (!this.visited.has(key)) {
      this.visited.add(key)
      this.addScore(DIG_POINTS, this.x, this.y - 10, '')
    }
    if (this.grid.dug[r]![c]) return
    this.grid.dug[r]![c] = true
    this.sparkles.burst(this.x, this.y, this.sparkRng, {
      count: 3,
      colours: [DUNES[duneFor(this.level)]!.sand[1]],
    })
  }

  private firePump() {
    if (this.face.dx === 0 && this.face.dy === 0) return
    this.pumpCool = PUMP_COOL
    this.hose = 8
    this.hoseLen = HOSE_TILES * TILE
    const target = pumpTarget(
      this.grid,
      this.x,
      this.y,
      this.face,
      this.sprites.filter((s) => !s.eyes),
    )
    if (!target) return
    const lane = this.face.dx !== 0 ? target.x - this.x : target.y - this.y
    this.hoseLen = Math.abs(lane)
    this.sound.play('blip')
    if (pump(target)) {
      this.popSprite(target)
    }
  }

  private popSprite(s: Sprite) {
    this.sprites = this.sprites.filter((o) => o !== s)
    this.popped++
    const row = tileOf(s.y)
    this.sound.play('pop')
    this.addScore(popPoints(row), s.x, s.y - 10, `${popPoints(row)}`)
    this.sparkles.burst(s.x, s.y, this.sparkRng, { count: 12 })
  }

  private moveSprites() {
    const speed =
      spriteSpeed(this.level) * (this.roundTick > HURRY_TICKS ? 1.4 : 1)
    for (const s of this.sprites) {
      s.anim++
      if (s.stage > 0) {
        relax(s)
        continue
      }
      if (s.eyes) {
        this.moveEyes(s)
        continue
      }
      s.ghostIn -= this.roundTick > HURRY_TICKS ? 3 : 1
      if (s.ghostIn <= 0) {
        s.eyes = true
        s.ghost = 0
        s.ghostIn = ghostGap(this.level)
        continue
      }
      s.acc += speed
      while (s.acc >= 1) {
        s.acc -= 1
        if (aligned(s.x, s.y)) {
          const d = chooseDir(this.grid, s, this.x, this.y, this.rng)
          s.dx = d.dx
          s.dy = d.dy
        }
        if (s.dx === 0 && s.dy === 0) continue
        s.x += s.dx
        s.y += s.dy
        if (!open(this.grid, tileOf(s.x), tileOf(s.y)) && !aligned(s.x, s.y)) {
          // Nudged into a boulder or edge mid-tile: stop at the last centre.
          s.x -= s.dx
          s.y -= s.dy
          s.dx = 0
          s.dy = 0
        }
      }
    }
  }

  /** Eyes float straight at the player through the sand, then dig in where they are. */
  private moveEyes(s: Sprite) {
    s.ghost++
    const gx = this.x - s.x
    const gy = this.y - s.y
    s.acc += GHOST_SPEED
    while (s.acc >= 1) {
      s.acc -= 1
      if (Math.abs(gx) > Math.abs(gy)) s.x += gx > 0 ? 1 : -1
      else if (gy !== 0) s.y += gy > 0 ? 1 : -1
      else s.x += gx > 0 ? 1 : -1
    }
    s.x = Math.max(TILE / 2, Math.min(W - TILE / 2, s.x))
    s.y = Math.max(centre(SURFACE_ROW), Math.min(centre(LAST_ROW), s.y))
    const c = tileOf(s.x)
    const r = tileOf(s.y)
    const here = open(this.grid, c, r)
    if ((s.ghost >= GHOST_MIN && here) || s.ghost >= GHOST_MAX) {
      if (this.grid.rock[r]![c]) return
      this.grid.dug[r]![c] = true
      s.x = centre(c)
      s.y = centre(r)
      s.eyes = false
      s.dx = 0
      s.dy = 0
      s.acc = 0
    }
  }

  private moveBoulders() {
    const gone: Boulder[] = []
    for (const b of this.boulders) {
      if (b.state === 'rest') {
        if (unsupported(this.grid, b)) {
          b.state = 'wobble'
          b.t = WOBBLE_TICKS
          this.sound.play('warn')
        }
      } else if (b.state === 'wobble') {
        if (--b.t <= 0) {
          b.state = 'fall'
          b.y = centre(b.r)
          this.grid.rock[b.r]![b.c] = false
          this.grid.dug[b.r]![b.c] = true
        }
      } else {
        b.y += BOULDER_SPEED
        this.crushUnder(b)
        if (b.y >= centre(b.r + 1)) {
          b.r++
          const below = b.r + 1
          const stops =
            below > LAST_ROW ||
            !this.grid.dug[below]![b.c] ||
            this.grid.rock[below]![b.c]
          if (stops) {
            b.y = centre(b.r)
            this.shatter(b)
            gone.push(b)
          }
        }
      }
    }
    if (gone.length > 0)
      this.boulders = this.boulders.filter((b) => !gone.includes(b))
  }

  private crushUnder(b: Boulder) {
    const bx = centre(b.c)
    for (const s of [...this.sprites]) {
      if (Math.abs(s.x - bx) < 11 && Math.abs(s.y - b.y) < 11) {
        this.sprites = this.sprites.filter((o) => o !== s)
        b.crushed++
        this.sparkles.burst(s.x, s.y, this.sparkRng, { count: 8 })
      }
    }
    if (
      this.mode === 'play' &&
      this.invuln === 0 &&
      Math.abs(this.x - bx) < HIT_RANGE &&
      Math.abs(this.y - b.y) < HIT_RANGE
    ) {
      this.lose('CRUSHED')
    }
  }

  private shatter(b: Boulder) {
    this.sound.play('boom')
    this.sparkles.burst(centre(b.c), b.y, this.sparkRng, {
      count: 14,
      colours: [RAMPS.steel[3], RAMPS.steel[2]],
    })
    const pts = crushPoints(b.crushed)
    if (pts > 0) this.addScore(pts, centre(b.c), b.y - 12, `${pts}`)
  }

  private checkHits() {
    if (this.invuln > 0) return
    for (const s of this.sprites) {
      if (s.stage > 0) continue
      if (Math.hypot(s.x - this.x, s.y - this.y) < HIT_RANGE) {
        this.lose('GOT YOU')
        return
      }
    }
  }

  private lose(text: string) {
    this.lives--
    this.mode = 'dying'
    this.modeTicks = 70
    this.banner = { text, ticks: 70 }
    this.sound.play('die')
    this.sparkles.burst(this.x, this.y, this.sparkRng, {
      count: 12,
      colours: [RAMPS.pink[3], RAMPS.gold[3]],
    })
    if (this.lives <= 0) {
      this.lives = 0
      this.over = true
      this.banner = { text: 'GAME OVER', ticks: 9999 }
    }
  }

  private afterDeath() {
    this.mode = 'play'
    this.invuln = INVULN
    this.placeAtStart()
    // The sprites wander back to their caves so the restart is fair.
    for (const s of this.sprites) {
      s.stage = 0
      s.eyes = false
    }
  }

  private clearRound() {
    const bonus = roundBonus(this.level)
    this.mode = 'cleared'
    this.modeTicks = 110
    this.sound.play('level')
    this.addScore(bonus, W / 2, 130, `BONUS ${bonus}`)
    this.banner = { text: 'ROUND CLEAR', ticks: 110 }
  }

  private nextRound() {
    this.level++
    this.mode = 'play'
    this.invuln = INVULN
    this.startRound()
    this.banner = { text: `ROUND ${this.level}`, ticks: 80 }
  }

  private addScore(points: number, x: number, y: number, label: string) {
    if (this.demo || points <= 0) return
    this.score += points
    if (label) this.floaters.push({ x, y, text: label, life: 45 })
    if (this.score >= this.nextExtra) {
      this.nextExtra += EXTRA_LIFE_AT
      this.lives++
      this.sound.play('extra')
      this.banner = { text: 'EXTRA LIFE', ticks: 70 }
    }
  }

  // --- attract-mode pilot -------------------------------------------------------

  private pilotInput(): InputFrame {
    const held = {
      up: false,
      down: false,
      left: false,
      right: false,
      a: false,
      b: false,
      start: false,
    }
    const pressed = { ...held }
    if (this.pilotPump > 0) this.pilotPump--
    const prey = this.sprites.filter((s) => !s.eyes)
    let target: Sprite | null = null
    let best = Infinity
    for (const s of prey) {
      const d = Math.hypot(s.x - this.x, s.y - this.y)
      if (d < best) {
        best = d
        target = s
      }
    }
    if (!target) {
      // Only eyes left: wait on the surface for them.
      return { held, pressed }
    }
    // A sprite inside the hose's reach and in front: stand and pump it.
    const reach = pumpTarget(this.grid, this.x, this.y, this.face, prey)
    if (reach === target || (reach && reach.stage > 0)) {
      if (this.pilotPump === 0) {
        pressed.a = true
        this.pilotPump = PUMP_COOL + 2
      }
      return { held, pressed }
    }
    const d = pilotDir(this.x, this.y, target.x, target.y, (dir) =>
      this.blockedFor(dir),
    )
    if (d.dx > 0) held.right = true
    else if (d.dx < 0) held.left = true
    else if (d.dy > 0) held.down = true
    else held.up = true
    return { held, pressed }
  }

  // --- render ------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    const dune = duneFor(this.level)
    this.renderBackdrop(g, dune)
    this.renderSand(g, dune)
    this.renderBoulders(g)
    this.renderHose(g)
    this.renderSprites(g)
    this.renderPlayer(g)
    this.sparkles.render(g)
    for (const f of this.floaters) {
      drawText(g, f.text, Math.round(f.x), Math.round(f.y), {
        align: 'center',
        color: RAMPS.gold[4],
        outline: INK,
      })
    }
    this.renderHud(g)
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 150, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.rust[1],
      })
    }
  }

  private renderBackdrop(g: CanvasRenderingContext2D, dune: number) {
    const d = DUNES[dune]!
    cachedLayer(g, `dune-digger-dash-bg-${dune}`, W, H, (layer) => {
      bandedGradient(layer, 0, 0, W, TILE * (SURFACE_ROW + 1), [...d.sky], 4)
      // Far dunes behind the surface row.
      const rand = backdropRng(31 + dune)
      layer.fillStyle = rgba(d.sand[2], 0.6)
      for (let x = 0; x < W; x += 2) {
        const h = 6 + Math.round(5 * Math.sin(x / 23 + rand() * 0.2))
        layer.fillRect(x, TILE * (SURFACE_ROW + 1) - h - 8, 2, h)
      }
    })
  }

  private renderSand(g: CanvasRenderingContext2D, dune: number) {
    const d = DUNES[dune]!
    // The sand bands are cached; tunnels are cut out of them each frame.
    cachedLayer(g, `dune-digger-dash-sand-${dune}`, W, H, (layer) => {
      for (let band = 0; band < 4; band++) {
        const top = (SURFACE_ROW + 1 + band * 4) * TILE
        const h = band === 3 ? H - top : 4 * TILE
        layer.fillStyle = d.sand[band]!
        layer.fillRect(0, top, W, h)
        const rand = backdropRng(100 + band + dune * 7)
        for (let i = 0; i < 70; i++) {
          layer.fillStyle = rgba(d.pebble, 0.35)
          layer.fillRect(
            Math.round(rand() * W),
            top + Math.round(rand() * h),
            2,
            1,
          )
        }
        layer.fillStyle = rgba(INK, 0.18)
        layer.fillRect(0, top, W, 1)
      }
      layer.fillStyle = d.grass
      layer.fillRect(0, (SURFACE_ROW + 1) * TILE - 3, W, 3)
    })
    const tunnel = mix(INK, DUNES[dune]!.sand[3], 0.35)
    for (let r = SURFACE_ROW + 1; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!this.grid.dug[r]![c]) continue
        g.fillStyle = tunnel
        g.fillRect(c * TILE, r * TILE, TILE, TILE)
        g.fillStyle = rgba(INK, 0.4)
        g.fillRect(c * TILE, r * TILE, TILE, 1)
        if (r === SURFACE_ROW + 1 || !this.grid.dug[r - 1]![c]) {
          g.fillStyle = rgba(INK, 0.35)
          g.fillRect(c * TILE, r * TILE, TILE, 3)
        }
      }
    }
  }

  private renderBoulders(g: CanvasRenderingContext2D) {
    for (const b of this.boulders) {
      let cx = centre(b.c)
      const cy = b.state === 'fall' ? b.y : centre(b.r)
      if (b.state === 'wobble')
        cx += Math.round(Math.sin(this.tick * 1.3) * 1.5)
      if (b.state !== 'fall') dropShadow(g, cx, cy + 7, 7, 1.5, 0.3)
      drawSprite(g, ROCK, cx, cy, { anchor: 'center' })
    }
  }

  private renderHose(g: CanvasRenderingContext2D) {
    if (this.hose <= 0) return
    const len = Math.min(this.hoseLen, HOSE_TILES * TILE)
    const x0 = this.x + this.face.dx * 6
    const y0 = this.y + this.face.dy * 6
    g.fillStyle = INK
    g.fillRect(
      Math.min(x0, x0 + this.face.dx * len) - 1,
      Math.min(y0, y0 + this.face.dy * len) - 1,
      Math.abs(this.face.dx * len) + 3,
      Math.abs(this.face.dy * len) + 3,
    )
    g.fillStyle = RAMPS.cream[3]
    g.fillRect(
      Math.min(x0, x0 + this.face.dx * len),
      Math.min(y0, y0 + this.face.dy * len),
      Math.abs(this.face.dx * len) + 1,
      Math.abs(this.face.dy * len) + 1,
    )
  }

  private renderSprites(g: CanvasRenderingContext2D) {
    for (const s of this.sprites) {
      if (s.eyes) {
        drawSprite(g, EYES, s.x, s.y, { anchor: 'center' })
        continue
      }
      const frame = Math.floor(s.anim / 8) % 2 === 0 ? SPRITE_A : SPRITE_B
      const scale = s.stage >= 3 ? 3 : s.stage >= 1 ? 2 : 1
      dropShadow(g, s.x, s.y + 6, 5 * scale, 1.5, 0.25)
      const wobble = s.stage >= 3 ? Math.round(Math.sin(this.tick * 1.5)) : 0
      drawSprite(g, frame, s.x + wobble, s.y - (scale - 1) * 2, {
        anchor: 'center',
        scale,
      })
    }
  }

  private renderPlayer(g: CanvasRenderingContext2D) {
    if (this.mode === 'dying' && Math.floor(this.tick / 4) % 2 === 0) return
    if (this.invuln > 0 && Math.floor(this.tick / 3) % 2 === 0) return
    const sprite = Math.floor(this.stepAnim / 6) % 2 === 0 ? DIG_A : DIG_B
    dropShadow(g, this.x, this.y + 6, 6, 1.5)
    drawSprite(g, sprite, this.x, this.y, {
      anchor: 'center',
      flipX: this.face.dx < 0,
    })
  }

  private renderHud(g: CanvasRenderingContext2D) {
    hudPanel(g, 4, 2, 92, 20, RAMPS.rust)
    drawText(g, 'SCORE', 9, 6, { color: RAMPS.rust[4] })
    drawText(g, String(this.score), 91, 13, {
      align: 'right',
      color: '#ffffff',
      outline: INK,
    })
    hudPanel(g, 100, 2, 60, 20, RAMPS.teal)
    drawText(g, 'HI', 105, 6, { color: RAMPS.teal[4] })
    drawText(g, String(Math.max(this.hiScore, this.score)), 155, 13, {
      align: 'right',
      color: '#ffffff',
      outline: INK,
    })
    hudPanel(g, 164, 2, 48, 20, RAMPS.pink)
    for (let i = 0; i < Math.min(this.lives, 4); i++) {
      drawSprite(g, DIG_A, 176 + i * 11, 20, { anchor: 'feet' })
    }
    drawText(g, 'LIVES', 169, 5, { color: RAMPS.pink[4] })
    hudPanel(g, 216, 2, 36, 20, RAMPS.gold)
    drawText(g, 'ROUND', 221, 6, { color: RAMPS.gold[4] })
    drawText(g, String(this.level), 247, 13, {
      align: 'right',
      color: '#ffffff',
      outline: INK,
    })
  }
}

const duneDiggerDash: ArcadeGameModule = {
  create: (options) => new DuneDiggerDash(options),
}

export const create = duneDiggerDash.create
export default duneDiggerDash
