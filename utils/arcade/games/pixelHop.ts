// /utils/arcade/games/pixelHop.ts
//
// Pixel Hop -- the Kind Robots Arcade's Q*bert riff (conductor kr-arcade/t-009
// game factory, batch 3). Hop a pyramid of tiles diagonally and repaint every
// top to the target colour. Gumballs drop in at the top and bounce down; a
// purple gumball hatches into Boing, a grumpy spring bot who follows you hop by
// hop. Hop off the edge onto a floating disc and it whisks you back to the
// top (and Boing, if he's right behind you, boings off after you). A green
// gumball freezes everyone for a few seconds; a repaint gremlin hops down
// undoing your work until you catch it.
//
// The painting rule tightens every four rounds: one hop paints a tile, then
// two hops (through a halfway colour), then a hop on a finished tile turns it
// back, then both at once. Hopping off the pyramid anywhere but a disc, or
// meeting a gumball or Boing, costs a life.
//
// Arrows hop diagonally, the classic way round: Up hops up-right, Right
// down-right, Down down-left, Left up-left.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 256
const H = 240
const ROWS = 7
const CUBE_W = 28
const ROW_H = 21
const FACE_H = 14
const SIDE_H = 16
const APEX_X = W / 2
const APEX_Y = 44
const HOP_TICKS = 16
const START_LIVES = 3
const ROUND_CLEAR_TICKS = 140
const DEATH_TICKS = 100
const FREEZE_TICKS = 60 * 4
const ROUNDS_PER_LEVEL = 4
const EXTRA_EVERY = 12_000

const PAINT_POINTS = 25
const ROUND_BONUS = 1000
const BOING_LURE_POINTS = 500
const GREMLIN_POINTS = 300
const FREEZE_POINTS = 100

export const HOP_CURVES = {
  /** Ticks between enemy hops (lower is faster). */
  enemyHop: { start: 30, step: -1.5, limit: 16 },
  /** Ticks between new gumballs. */
  dropEvery: { start: 260, step: -14, limit: 110 },
  /** Chance a new arrival is a repaint gremlin. */
  gremlinChance: { start: -0.15, step: 0.05, limit: 0.3 },
} as const

/** Colour schemes per round: tile side colours, start, halfway and target tops. */
const SCHEMES = [
  {
    left: '#1e3a8a',
    right: '#172554',
    start: '#60a5fa',
    mid: '#a78bfa',
    target: '#fde047',
  },
  {
    left: '#365314',
    right: '#1a2e05',
    start: '#a3e635',
    mid: '#2dd4bf',
    target: '#f472b6',
  },
  {
    left: '#7c2d12',
    right: '#431407',
    start: '#fb923c',
    mid: '#facc15',
    target: '#38bdf8',
  },
  {
    left: '#581c87',
    right: '#3b0764',
    start: '#c084fc',
    mid: '#f9a8d4',
    target: '#4ade80',
  },
]

type Cell = { r: number; c: number }
/** Up-right, down-right, down-left, up-left. */
const MOVES: Array<[number, number]> = [
  [-1, 0],
  [1, 1],
  [1, 0],
  [-1, -1],
]
type Hopper = {
  r: number
  c: number
  /** Where the current hop started (and the timer through it). */
  fr: number
  fc: number
  hop: number
  /** Off the pyramid: falling to the bottom of the screen. */
  falling: number
}
type EnemyKind = 'gumball' | 'purple' | 'boing' | 'green' | 'gremlin'
type Enemy = Hopper & { kind: EnemyKind; wait: number }
type Disc = { side: -1 | 1; row: number; used: boolean }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

function onPyramid(r: number, c: number): boolean {
  return r >= 0 && r < ROWS && c >= 0 && c <= r
}

function cubeTop(r: number, c: number): { x: number; y: number } {
  return { x: APEX_X + (c - r / 2) * CUBE_W, y: APEX_Y + r * ROW_H }
}

class PixelHop implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private round = 1
  /** Each tile's paint: 0 start, 1 halfway, 2 target. */
  private paint: number[][] = []
  private me: Hopper = { r: 0, c: 0, fr: 0, fc: 0, hop: 0, falling: 0 }
  private queued = -1
  private riding: { t: number; side: -1 | 1; row: number } | null = null
  private enemies: Enemy[] = []
  private discs: Disc[] = []
  private dropTimer = 120
  private freeze = 0
  private clear = 0
  private dead = 0
  private nextExtra = EXTRA_EVERY
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startRound(1)
  }

  private get scheme() {
    return SCHEMES[(this.round - 1) % SCHEMES.length]!
  }

  /** The painting rule: hops to finish a tile, and whether a finished tile turns back. */
  private get rule(): { hops: 1 | 2; flips: boolean } {
    const tier = (this.level - 1) % 4
    return { hops: tier === 1 || tier === 3 ? 2 : 1, flips: tier >= 2 }
  }

  // --- rounds ------------------------------------------------------------------

  private startRound(round: number) {
    this.round = round
    this.level = 1 + Math.floor((round - 1) / ROUNDS_PER_LEVEL)
    this.paint = Array.from({ length: ROWS }, (_, r) => Array(r + 1).fill(0))
    this.discs = [
      { side: -1, row: 2 + Math.floor(this.rng() * 4), used: false },
      { side: 1, row: 2 + Math.floor(this.rng() * 4), used: false },
    ]
    this.resetPositions()
    const rule = this.rule
    this.banner = {
      text: `LEVEL ${this.level}  ROUND ${((round - 1) % ROUNDS_PER_LEVEL) + 1}`,
      sub:
        rule.hops === 2 && rule.flips
          ? 'TWO HOPS, AND DONE TILES FLIP BACK'
          : rule.hops === 2
            ? 'TWO HOPS PAINT A TILE'
            : rule.flips
              ? 'DONE TILES FLIP BACK'
              : 'HOP EVERY TILE',
      ticks: 100,
    }
  }

  private resetPositions() {
    this.me = { r: 0, c: 0, fr: 0, fc: 0, hop: 0, falling: 0 }
    this.queued = -1
    this.riding = null
    this.enemies = []
    this.dropTimer = 120
    this.freeze = 0
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input
    if (this.clear > 0) {
      if (--this.clear === 0) this.startRound(this.round + 1)
      return
    }
    if (this.dead > 0) {
      if (--this.dead === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'GAME OVER', ticks: 9999 }
        } else {
          // Back on the pyramid where you were (or the top after a fall).
          const r = onPyramid(this.me.r, this.me.c) ? this.me.r : 0
          const c = onPyramid(this.me.r, this.me.c) ? this.me.c : 0
          this.me = { r, c, fr: r, fc: c, hop: 0, falling: 0 }
          this.enemies = []
          this.dropTimer = 90
        }
      }
      return
    }
    this.readInput(controls)
    this.moveMe()
    if (this.freeze > 0) this.freeze--
    else this.moveEnemies()
    this.spawn()
    this.collide()
  }

  private readInput(input: InputFrame) {
    const pressed = input.pressed
    const held = input.held
    const dir =
      pressed.up || held.up
        ? 0
        : pressed.right || held.right
          ? 1
          : pressed.down || held.down
            ? 2
            : pressed.left || held.left
              ? 3
              : -1
    if (dir >= 0) this.queued = dir
  }

  private moveMe() {
    const me = this.me
    if (this.riding) {
      if (--this.riding.t <= 0) {
        this.riding = null
        me.r = 0
        me.c = 0
        me.fr = 0
        me.fc = 0
        me.hop = 0
        this.land()
      }
      return
    }
    if (me.falling > 0) {
      if (--me.falling === 0) this.lose('OFF THE EDGE')
      return
    }
    if (me.hop > 0) {
      if (--me.hop === 0) this.arrive()
      return
    }
    if (this.queued < 0) return
    const [dr, dc] = MOVES[this.queued]!
    this.queued = -1
    me.fr = me.r
    me.fc = me.c
    me.r += dr
    me.c += dc
    me.hop = HOP_TICKS
    this.sound.play('blip')
  }

  /** Landed at the end of a hop: on a tile, onto a disc, or off into the air. */
  private arrive() {
    const me = this.me
    if (onPyramid(me.r, me.c)) {
      this.land()
      return
    }
    // A disc beside the row we just left?
    const side: -1 | 1 = me.c < 0 || me.c < me.r / 2 ? -1 : 1
    const disc = this.discs.find(
      (d) =>
        !d.used && d.side === side && d.row === me.fr && me.r === me.fr - 1,
    )
    if (disc) {
      disc.used = true
      this.riding = { t: 90, side, row: disc.row }
      this.sound.play('extra')
      // Boing, hot on your heels, boings straight off after you.
      for (const e of this.enemies) {
        if (e.kind !== 'boing' || e.hop > 0) continue
        if (Math.abs(e.r - me.fr) + Math.abs(e.c - me.fc) <= 1) {
          e.falling = 50
          const at = cubeTop(e.r, e.c)
          this.addScore(BOING_LURE_POINTS, at.x, at.y - 20)
          this.banner = { text: 'BOING BOINGED OFF!', ticks: 70 }
        }
      }
      return
    }
    me.falling = 50
    this.sound.play('die')
  }

  private land() {
    const { r, c } = this.me
    const rule = this.rule
    const tile = this.paint[r]![c]!
    let next = tile
    if (tile < 2) next = rule.hops === 1 ? 2 : tile + 1
    else if (rule.flips) next = rule.hops === 1 ? 0 : 1
    if (next !== tile) {
      this.paint[r]![c] = next
      if (next > tile) {
        const at = cubeTop(r, c)
        this.addScore(PAINT_POINTS, at.x, at.y - 14)
      }
    }
    if (this.paint.every((row) => row.every((t) => t === 2))) this.roundClear()
  }

  private roundClear() {
    const bonus = ROUND_BONUS + 250 * (this.round - 1)
    const unused = this.discs.filter((d) => !d.used).length
    this.addScore(bonus + unused * 50, W / 2, 120)
    this.clear = ROUND_CLEAR_TICKS
    this.enemies = []
    this.banner = {
      text: 'PYRAMID PAINTED!',
      sub: `BONUS ${bonus}${unused ? `  DISCS ${unused * 50}` : ''}`,
      ticks: ROUND_CLEAR_TICKS,
    }
    this.sound.play('level')
  }

  private spawn() {
    if (--this.dropTimer > 0) return
    this.dropTimer = Math.round(levelCurve(this.round, HOP_CURVES.dropEvery))
    if (this.enemies.length >= 4) return
    const roll = this.rng()
    const hasBoing = this.enemies.some(
      (e) => e.kind === 'boing' || e.kind === 'purple',
    )
    let kind: EnemyKind = 'gumball'
    if (!hasBoing && roll < 0.35) kind = 'purple'
    else if (
      roll <
      0.35 + Math.max(0, levelCurve(this.round, HOP_CURVES.gremlinChance))
    )
      kind = 'gremlin'
    else if (roll > 0.9) kind = 'green'
    // Drops in onto the second row, left or right.
    const c = this.rng() < 0.5 ? 0 : 1
    this.enemies.push({
      kind,
      r: 1,
      c,
      fr: -1,
      fc: 0,
      hop: HOP_TICKS,
      falling: 0,
      wait: 20,
    })
  }

  private moveEnemies() {
    const every = Math.round(levelCurve(this.round, HOP_CURVES.enemyHop))
    for (const e of this.enemies) {
      if (e.falling > 0) {
        e.falling--
        continue
      }
      if (e.hop > 0) {
        if (--e.hop === 0) this.enemyArrive(e)
        continue
      }
      if (--e.wait > 0) continue
      e.wait = every
      const [dr, dc] = this.enemyMove(e)
      e.fr = e.r
      e.fc = e.c
      e.r += dr
      e.c += dc
      e.hop = HOP_TICKS
    }
    this.enemies = this.enemies.filter(
      (e) => !(e.falling === 1 || e.r > ROWS + 2),
    )
  }

  private enemyMove(e: Enemy): [number, number] {
    if (e.kind === 'boing') {
      // Boing hops toward you, the shortest way round.
      let best: [number, number] = MOVES[0]!
      let bestD = Infinity
      for (const [dr, dc] of MOVES) {
        const r = e.r + dr
        const c = e.c + dc
        if (!onPyramid(r, c)) continue
        const d =
          Math.abs(r - this.me.r) +
          Math.abs(c - r / 2 - (this.me.c - this.me.r / 2))
        if (d < bestD) {
          bestD = d
          best = [dr, dc]
        }
      }
      return best
    }
    // Everything else bounces down, left or right at random.
    return this.rng() < 0.5 ? [1, 0] : [1, 1]
  }

  private enemyArrive(e: Enemy) {
    if (!onPyramid(e.r, e.c)) {
      e.falling = 40
      return
    }
    if (e.kind === 'purple' && e.r === ROWS - 1) {
      // At the bottom the purple gumball hatches into Boing.
      e.kind = 'boing'
      this.burst(cubeTop(e.r, e.c).x, cubeTop(e.r, e.c).y, 10, '#c084fc')
      this.sound.play('warn')
    }
    if (e.kind === 'gremlin' && this.paint[e.r]![e.c]! > 0)
      this.paint[e.r]![e.c]!--
  }

  private collide() {
    const me = this.me
    if (this.riding || me.falling > 0) return
    const mine = this.pos(me)
    for (const e of [...this.enemies]) {
      if (e.falling > 0) continue
      const at = this.pos(e)
      if (Math.hypot(at.x - mine.x, at.y - mine.y) > 10) continue
      if (e.kind === 'green') {
        this.enemies = this.enemies.filter((o) => o !== e)
        this.freeze = FREEZE_TICKS
        this.addScore(FREEZE_POINTS, at.x, at.y - 16)
        this.banner = { text: 'FREEZE!', ticks: 60 }
        this.sound.play('pickup')
      } else if (e.kind === 'gremlin') {
        this.enemies = this.enemies.filter((o) => o !== e)
        this.addScore(GREMLIN_POINTS, at.x, at.y - 16)
        this.burst(at.x, at.y, 10, '#86efac')
        this.sound.play('pop')
      } else if (this.freeze === 0) {
        this.lose(e.kind === 'boing' ? 'BOING GOT YOU' : 'BONKED')
        return
      }
    }
  }

  private lose(why: string) {
    this.lives--
    this.dead = DEATH_TICKS
    const at = this.pos(this.me)
    this.burst(at.x, at.y, 16, '#fb923c')
    this.sound.play('die')
    this.banner = { text: '#?%!', sub: why, ticks: DEATH_TICKS }
  }

  /** Screen position of a hopper's feet, arcing through its current hop. */
  private pos(h: Hopper): { x: number; y: number } {
    const to = cubeTop(h.r, h.c)
    if (h.hop <= 0) {
      if (h.falling > 0) return { x: to.x, y: to.y + (50 - h.falling) * 3 }
      return to
    }
    const from = h.fr < 0 ? { x: to.x, y: to.y - 50 } : cubeTop(h.fr, h.fc)
    const t = 1 - h.hop / HOP_TICKS
    return {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t - Math.sin(t * Math.PI) * 14,
    }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    if (points >= 100)
      this.floaters.push({ x, y, text: String(points), life: 40 })
    if (this.score >= this.nextExtra) {
      this.nextExtra += EXTRA_EVERY
      this.lives++
      this.banner = { text: 'EXTRA HOPPER!', ticks: 80 }
      this.sound.play('extra')
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.4 + this.rng() * 1.4
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.5,
        life: 18 + Math.floor(this.rng() * 14),
        color,
      })
    }
  }

  private updateEffects() {
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.4
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  // --- attract-mode pilot -----------------------------------------------------

  /** Where an enemy will be (or is landing) soon: cells to keep clear of. */
  private danger(): Set<string> {
    const cells = new Set<string>()
    for (const e of this.enemies) {
      if (e.falling > 0 || e.kind === 'green' || e.kind === 'gremlin') continue
      cells.add(`${e.r},${e.c}`)
      // Where it might hop next.
      for (const [dr, dc] of e.kind === 'boing' ? MOVES : MOVES.slice(1, 3))
        cells.add(`${e.r + dr},${e.c + dc}`)
    }
    return cells
  }

  private demoInput(): InputFrame {
    const held = {
      up: false,
      down: false,
      left: false,
      right: false,
      a: false,
      b: false,
      start: false,
    }
    const frame: InputFrame = { held, pressed: { ...held } }
    const me = this.me
    if (me.hop > 0 || this.riding || me.falling > 0) return frame
    const keys: Array<keyof typeof held> = ['up', 'right', 'down', 'left']
    const danger = this.danger()
    // Boing right next to us and a disc on this row: take it.
    const boingNear = this.enemies.some(
      (e) =>
        e.kind === 'boing' && Math.abs(e.r - me.r) + Math.abs(e.c - me.c) <= 2,
    )
    if (boingNear) {
      for (const d of this.discs) {
        if (d.used || d.row !== me.r) continue
        if (d.side === -1 && me.c === 0) return this.press(frame, 'left')
        if (d.side === 1 && me.c === me.r) return this.press(frame, 'up')
      }
    }
    // Breadth-first to the nearest tile that still wants paint, avoiding danger.
    const want = (r: number, c: number) => this.paint[r]![c]! < 2
    const start = `${me.r},${me.c}`
    const prev = new Map<string, { from: string; dir: number }>([
      [start, { from: '', dir: -1 }],
    ])
    const queue: Cell[] = [{ r: me.r, c: me.c }]
    let goal: string | null = null
    while (queue.length && !goal) {
      const cur = queue.shift()!
      for (let dir = 0; dir < 4; dir++) {
        const [dr, dc] = MOVES[dir]!
        const r = cur.r + dr
        const c = cur.c + dc
        const key = `${r},${c}`
        if (!onPyramid(r, c) || prev.has(key) || danger.has(key)) continue
        prev.set(key, { from: `${cur.r},${cur.c}`, dir })
        if (want(r, c)) {
          goal = key
          break
        }
        queue.push({ r, c })
      }
    }
    if (!goal) {
      // Nowhere wanted is safe: just step somewhere safe.
      for (let dir = 0; dir < 4; dir++) {
        const [dr, dc] = MOVES[dir]!
        const key = `${me.r + dr},${me.c + dc}`
        if (onPyramid(me.r + dr, me.c + dc) && !danger.has(key))
          return this.press(frame, keys[dir]!)
      }
      return frame
    }
    // Walk back to the first step.
    let step = goal
    while (prev.get(step)!.from !== start) step = prev.get(step)!.from
    return this.press(frame, keys[prev.get(step)!.dir]!)
  }

  private press(frame: InputFrame, key: keyof InputFrame['held']): InputFrame {
    frame.held[key] = true
    frame.pressed[key] = true
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    g.fillStyle = '#0b0a1f'
    g.fillRect(0, 0, W, H)
    // Twinkling pixels in the background.
    for (let i = 0; i < 30; i++) {
      const x = (i * 53) % W
      const y = (i * 37) % H
      g.fillStyle = (i + Math.floor(this.tick / 20)) % 5 ? '#312e81' : '#a5b4fc'
      g.fillRect(x, y, 1, 1)
    }
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c <= r; c++) this.renderCube(g, r, c)
    for (const d of this.discs)
      if (!d.used) this.renderDisc(g, d.side, d.row, false)
    if (this.riding) this.renderRide(g)
    const drawn: Array<{ y: number; draw: () => void }> = []
    for (const e of this.enemies) {
      const at = this.pos(e)
      drawn.push({ y: at.y, draw: () => this.renderEnemy(g, e, at) })
    }
    if (!this.riding && this.dead === 0) {
      const at = this.pos(this.me)
      drawn.push({ y: at.y, draw: () => this.renderMe(g, at) })
    }
    // Things lower on the pyramid draw last (in front).
    for (const d of drawn.sort((a, b) => a.y - b.y)) d.draw()
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 30)
      g.fillStyle = p.color
      g.fillRect(p.x - 1, p.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, { align: 'center', color: '#fde68a' })
    if (this.freeze > 0 && Math.floor(this.tick / 8) % 2) {
      g.fillStyle = 'rgba(165, 243, 252, 0.08)'
      g.fillRect(0, 0, W, H)
    }
    this.renderHud(g)
  }

  private renderCube(g: CanvasRenderingContext2D, r: number, c: number) {
    const { x, y } = cubeTop(r, c)
    const s = this.scheme
    const half = CUBE_W / 2
    const tile = this.paint[r]![c]!
    // Top face.
    g.fillStyle = tile === 2 ? s.target : tile === 1 ? s.mid : s.start
    g.beginPath()
    g.moveTo(x, y - FACE_H / 2)
    g.lineTo(x + half, y)
    g.lineTo(x, y + FACE_H / 2)
    g.lineTo(x - half, y)
    g.closePath()
    g.fill()
    // Left and right sides.
    g.fillStyle = s.left
    g.beginPath()
    g.moveTo(x - half, y)
    g.lineTo(x, y + FACE_H / 2)
    g.lineTo(x, y + FACE_H / 2 + SIDE_H)
    g.lineTo(x - half, y + SIDE_H)
    g.closePath()
    g.fill()
    g.fillStyle = s.right
    g.beginPath()
    g.moveTo(x + half, y)
    g.lineTo(x, y + FACE_H / 2)
    g.lineTo(x, y + FACE_H / 2 + SIDE_H)
    g.lineTo(x + half, y + SIDE_H)
    g.closePath()
    g.fill()
  }

  private discPos(side: -1 | 1, row: number) {
    const edge = cubeTop(row, side < 0 ? 0 : row)
    return { x: edge.x + side * CUBE_W * 0.9, y: edge.y - ROW_H * 0.6 }
  }

  private renderDisc(
    g: CanvasRenderingContext2D,
    side: -1 | 1,
    row: number,
    glow: boolean,
  ) {
    const { x, y } = this.discPos(side, row)
    this.drawDisc(g, x, y, glow)
  }

  private drawDisc(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    glow: boolean,
  ) {
    const colors = ['#f87171', '#facc15', '#4ade80', '#38bdf8']
    g.fillStyle = colors[Math.floor(this.tick / 5) % colors.length]!
    g.beginPath()
    g.ellipse(x, y, 8, 3, 0, 0, Math.PI * 2)
    g.fill()
    if (glow) {
      g.strokeStyle = '#ffffff'
      g.lineWidth = 1
      g.stroke()
    }
  }

  private renderRide(g: CanvasRenderingContext2D) {
    const ride = this.riding!
    const from = this.discPos(ride.side, ride.row)
    const to = { x: APEX_X, y: APEX_Y - 26 }
    const t = 1 - ride.t / 90
    const x = from.x + (to.x - from.x) * t
    const y = from.y + (to.y - from.y) * t
    this.drawDisc(g, x, y, true)
    this.renderMe(g, { x, y: y - 2 })
  }

  private renderMe(g: CanvasRenderingContext2D, at: { x: number; y: number }) {
    const x = Math.round(at.x)
    const y = Math.round(at.y) - 4
    // Pip: a round orange pixel-bot with a snorkel nose and big feet.
    g.fillStyle = '#7c2d12'
    g.fillRect(x - 5, y + 2, 4, 2)
    g.fillRect(x + 1, y + 2, 4, 2)
    g.fillStyle = '#fb923c'
    g.beginPath()
    g.arc(x, y - 4, 6, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#fdba74'
    g.fillRect(x + 3, y - 5, 5, 3)
    g.fillStyle = '#ffffff'
    g.fillRect(x - 3, y - 8, 3, 3)
    g.fillRect(x + 1, y - 8, 3, 3)
    g.fillStyle = '#111827'
    g.fillRect(x - 2, y - 7, 1, 1)
    g.fillRect(x + 2, y - 7, 1, 1)
  }

  private renderEnemy(
    g: CanvasRenderingContext2D,
    e: Enemy,
    at: { x: number; y: number },
  ) {
    const x = Math.round(at.x)
    const y = Math.round(at.y) - 4
    if (e.kind === 'boing') {
      // Boing: a coiled spring with a grumpy purple head.
      g.fillStyle = '#a855f7'
      for (let i = 0; i < 4; i++) g.fillRect(x - 3 + (i % 2), y - i * 3, 6, 2)
      g.beginPath()
      g.arc(x, y - 14, 5, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#ffffff'
      g.fillRect(x - 3, y - 16, 2, 2)
      g.fillRect(x + 1, y - 16, 2, 2)
      g.fillStyle = '#3b0764'
      g.fillRect(x - 3, y - 18, 6, 1)
      return
    }
    if (e.kind === 'gremlin') {
      // The repaint gremlin, dragging a little brush.
      g.fillStyle = '#22c55e'
      g.fillRect(x - 4, y - 8, 8, 8)
      g.fillStyle = '#bbf7d0'
      g.fillRect(x - 3, y - 7, 2, 2)
      g.fillRect(x + 1, y - 7, 2, 2)
      g.fillStyle = '#a16207'
      g.fillRect(x + 4, y - 4, 4, 1)
      g.fillStyle = this.scheme.start
      g.fillRect(x + 7, y - 5, 2, 3)
      return
    }
    const color =
      e.kind === 'purple'
        ? '#a855f7'
        : e.kind === 'green'
          ? '#4ade80'
          : '#ef4444'
    g.fillStyle = color
    g.beginPath()
    g.arc(x, y - 4, 4, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = 'rgba(255, 255, 255, 0.7)'
    g.fillRect(x - 2, y - 6, 2, 2)
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#1e1b4b'
    drawText(g, String(this.score).padStart(6, '0'), 4, 3, {
      scale: 2,
      color: '#fde047',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 4, 2, {
      align: 'right',
      color: '#f9a8d4',
    })
    drawText(g, `LEVEL ${this.level}`, W - 4, 10, {
      align: 'right',
      color: '#a5f3fc',
    })
    // The target colour, so you know what to paint.
    drawText(g, 'PAINT', 4, 20, { color: '#e5e7eb' })
    g.fillStyle = this.scheme.target
    g.fillRect(36, 20, 10, 6)
    for (let i = 0; i < Math.min(this.lives - 1, 5); i++) {
      g.fillStyle = '#fb923c'
      g.beginPath()
      g.arc(W - 10 - i * 10, 24, 3, 0, Math.PI * 2)
      g.fill()
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, H - 44, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        shadow: '#7c3aed',
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, H - 24, {
          align: 'center',
          color: '#fde68a',
          shadow,
        })
    }
  }
}

const pixelHop: ArcadeGameModule = {
  create: (options) => new PixelHop(options),
}

export const create = pixelHop.create
export default pixelHop
