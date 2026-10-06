// /utils/arcade/games/burrowBuddy.ts
//
// Burrow Buddy -- the Kind Robots Arcade's Dig Dug riff (conductor kr-arcade/
// t-009 game factory). Buddy, a little robot mole, tunnels through the layers
// of a garden's soil. Grumpy grubs (and, from the second garden, fire-breathing
// beetles) crawl through the tunnels; puff bubbles at them until they swell up
// and float gently away, or dig under a turnip and drop it on a whole group for
// a bonus. Two dropped turnips bring out a veggie bonus at the middle.
//
// Grubs get bored and drift through the soil as ghosts to find Buddy (ghosts
// are harmless until they settle back into a tunnel). The last grub left runs
// for the surface; let it go and the garden is still safe, but pop it for the
// points. Arrows dig, A puffs bubbles (tap or hold to keep puffing).

import { levelCurve } from '../curve'
import { drawText } from '../font'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const T = 16
const COLS = 16
const ROWS = 14
const FY = 20
const W = COLS * T
const H = FY + ROWS * T + 18

const START = { tx: 7, ty: 6 }
const WALK_SPEED = 1 / 9
const DIG_SPEED = 1 / 15
const PUMP_REACH = 3
const PUMP_REPEAT = 12
const POP_AT = 4
const DEFLATE_TICKS = 50
const GHOST_MIN = 70
const START_LIVES = 3
const DEATH_TICKS = 100
const LEVEL_CLEAR_TICKS = 140
const EXTRA_EVERY = 20_000
const DIG_POINTS = 10
const CRUSH_BONUS = [0, 1000, 2500, 4000, 6000, 8000, 10_000, 12_000]

export const BURROW_CURVES = {
  grubs: { start: 3, step: 1, limit: 5 },
  beetles: { start: 0, step: 0.5, limit: 3 },
  /** Enemy speed in tiles per tick. */
  speed: { start: 1 / 22, step: 1 / 300, limit: 1 / 12 },
  /** Ticks before a grub gets bored and ghosts through the soil. */
  ghostEvery: { start: 520, step: -40, limit: 220 },
  turnips: { start: 3, step: 0.34, limit: 5 },
} as const

type Dir = 0 | 1 | 2 | 3
const DX = [0, 1, 0, -1]
const DY = [-1, 0, 1, 0]

type Mover = { tx: number; ty: number; nx: number; ny: number; p: number }
type Enemy = {
  kind: 'grub' | 'beetle'
  m: Mover
  spawn: { tx: number; ty: number }
  facing: Dir
  ghost: boolean
  gx: number
  gy: number
  ghostTicks: number
  ghostTimer: number
  inflate: number
  deflate: number
  fleeing: boolean
  fireCooldown: number
  fireWarn: number
  fire: number
}
type Turnip = {
  tx: number
  ty: number
  state: 'idle' | 'wobble' | 'fall' | 'broken'
  t: number
  drop: number
  crushed: number
}
type Floater = { x: number; y: number; text: string; life: number }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floating = { x: number; y: number; life: number; kind: 'grub' | 'beetle' }

const SOIL = ['#f59e0b', '#d97706', '#b45309', '#92400e']

function centre(tx: number, ty: number) {
  return { x: tx * T + T / 2, y: FY + ty * T + T / 2 }
}

function at(m: Mover) {
  return {
    x: (m.tx + (m.nx - m.tx) * m.p) * T + T / 2,
    y: FY + (m.ty + (m.ny - m.ty) * m.p) * T + T / 2,
  }
}

function moving(m: Mover): boolean {
  return m.nx !== m.tx || m.ny !== m.ty
}

function depthPoints(row: number): number {
  if (row <= 3) return 200
  if (row <= 6) return 300
  if (row <= 9) return 400
  return 500
}

class BurrowBuddy implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private levelTick = 0
  private dug = new Uint8Array(COLS * ROWS)
  private links = new Set<number>()
  private player: Mover = {
    tx: START.tx,
    ty: START.ty,
    nx: START.tx,
    ny: START.ty,
    p: 0,
  }
  private facing: Dir = 2
  private pumpTarget: Enemy | null = null
  private pumpCooldown = 0
  private stream: {
    x0: number
    y0: number
    x1: number
    y1: number
    t: number
  } | null = null
  private enemies: Enemy[] = []
  private turnips: Turnip[] = []
  private dropped = 0
  private veggie: { ticks: number } | null = null
  private dead = 0
  private levelClear = 0
  private nextExtra = EXTRA_EVERY
  private floating: Floating[] = []
  private floaters: Floater[] = []
  private particles: Particle[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startLevel(1)
  }

  // --- the garden -------------------------------------------------------------------

  private key(tx: number, ty: number): number {
    return ty * COLS + tx
  }

  private isDug(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return false
    return ty === 0 || this.dug[this.key(tx, ty)] === 1
  }

  private linkKey(ax: number, ay: number, bx: number, by: number): number {
    const a = this.key(ax, ay)
    const b = this.key(bx, by)
    return Math.min(a, b) * 1000 + Math.max(a, b)
  }

  private linked(ax: number, ay: number, bx: number, by: number): boolean {
    if (ay === 0 && by === 0) return true
    return this.links.has(this.linkKey(ax, ay, bx, by))
  }

  private dig(tx: number, ty: number, fromX: number, fromY: number) {
    if (ty > 0 && !this.dug[this.key(tx, ty)]) {
      this.dug[this.key(tx, ty)] = 1
      this.addScore(DIG_POINTS)
    }
    this.links.add(this.linkKey(fromX, fromY, tx, ty))
  }

  private turnipAt(tx: number, ty: number): Turnip | undefined {
    return this.turnips.find(
      (t) =>
        (t.state === 'idle' || t.state === 'wobble') &&
        t.tx === tx &&
        t.ty === ty,
    )
  }

  private startLevel(level: number) {
    this.level = level
    this.levelTick = 0
    this.dug.fill(0)
    this.links.clear()
    // Buddy's shaft from the surface down to the middle.
    for (let ty = 1; ty <= START.ty; ty++) {
      this.dug[this.key(START.tx, ty)] = 1
      this.links.add(this.linkKey(START.tx, ty - 1, START.tx, ty))
    }
    this.enemies = []
    const grubs = Math.round(levelCurve(level, BURROW_CURVES.grubs))
    const beetles = Math.floor(levelCurve(level, BURROW_CURVES.beetles))
    const kinds: Array<'grub' | 'beetle'> = [
      ...new Array<'grub'>(grubs).fill('grub'),
      ...new Array<'beetle'>(beetles).fill('beetle'),
    ]
    for (const kind of kinds) this.placeEnemy(kind)
    this.turnips = []
    const turnips = Math.round(levelCurve(level, BURROW_CURVES.turnips))
    for (let tries = 0; this.turnips.length < turnips && tries < 200; tries++) {
      const tx = 1 + Math.floor(this.rng() * (COLS - 2))
      const ty = 2 + Math.floor(this.rng() * (ROWS - 5))
      if (this.isDug(tx, ty) || this.isDug(tx, ty + 1)) continue
      if (Math.abs(tx - START.tx) < 2) continue
      if (
        this.turnips.some((t) => Math.abs(t.tx - tx) + Math.abs(t.ty - ty) < 3)
      )
        continue
      this.turnips.push({ tx, ty, state: 'idle', t: 0, drop: 0, crushed: 0 })
    }
    this.dropped = 0
    this.veggie = null
    this.resetPlayer()
    this.banner = {
      text: `GARDEN ${level}`,
      sub: 'PUFF THE GRUMPS AWAY',
      ticks: 90,
    }
  }

  /** A grub's starting burrow: a short dug tunnel away from Buddy. */
  private placeEnemy(kind: 'grub' | 'beetle') {
    for (let tries = 0; tries < 200; tries++) {
      const across = this.rng() < 0.5
      const tx = 1 + Math.floor(this.rng() * (COLS - (across ? 4 : 2)))
      const ty = 3 + Math.floor(this.rng() * (ROWS - (across ? 4 : 6)))
      const cells: Array<[number, number]> = [0, 1, 2].map((i) =>
        across ? [tx + i, ty] : [tx, ty + i],
      )
      const clash = cells.some(
        ([x, y]) =>
          this.isDug(x, y) ||
          this.isDug(x, y - 1) ||
          this.isDug(x, y + 1) ||
          (Math.abs(x - START.tx) < 3 && Math.abs(y - START.ty) < 3),
      )
      if (clash) continue
      cells.forEach(([x, y], i) => {
        this.dug[this.key(x, y)] = 1
        if (i > 0) {
          const [px, py] = cells[i - 1]!
          this.links.add(this.linkKey(px, py, x, y))
        }
      })
      const [sx, sy] = cells[1]!
      this.enemies.push({
        kind,
        m: { tx: sx, ty: sy, nx: sx, ny: sy, p: 0 },
        spawn: { tx: sx, ty: sy },
        facing: across ? 1 : 2,
        ghost: false,
        gx: 0,
        gy: 0,
        ghostTicks: 0,
        ghostTimer: this.ghostDelay(),
        inflate: 0,
        deflate: 0,
        fleeing: false,
        fireCooldown: 200 + Math.floor(this.rng() * 200),
        fireWarn: 0,
        fire: 0,
      })
      return
    }
  }

  private ghostDelay(): number {
    const base = levelCurve(this.level, BURROW_CURVES.ghostEvery)
    return Math.round(base * (0.7 + this.rng() * 0.6))
  }

  private resetPlayer() {
    this.player = {
      tx: START.tx,
      ty: START.ty,
      nx: START.tx,
      ny: START.ty,
      p: 0,
    }
    this.facing = 2
    this.pumpTarget = null
    this.stream = null
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input

    if (this.levelClear > 0) {
      this.updateTurnips()
      if (--this.levelClear === 0) this.startLevel(this.level + 1)
      return
    }
    if (this.enemies.length === 0) {
      // Let a falling turnip land (and pay its bonus) before the garden clears.
      this.updateTurnips()
      if (!this.turnips.some((t) => t.state === 'fall')) this.clearLevel()
      return
    }
    if (this.dead > 0) {
      if (--this.dead === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'GAME OVER', ticks: 9999 }
        } else {
          this.resetPlayer()
          for (const e of this.enemies) this.sendHome(e)
        }
      }
      return
    }
    this.levelTick++
    this.updatePlayer(controls)
    for (const e of [...this.enemies]) this.updateEnemy(e)
    this.updateTurnips()
    this.updateVeggie()
  }

  private updatePlayer(input: InputFrame) {
    if (this.pumpCooldown > 0) this.pumpCooldown--
    if (this.stream && --this.stream.t <= 0) this.stream = null
    const want = this.wanted(input)
    const m = this.player

    if (this.pumpTarget) {
      if (want !== null || !this.enemies.includes(this.pumpTarget)) {
        this.pumpTarget = null
      } else {
        if (input.pressed.a || (input.held.a && this.pumpCooldown === 0)) {
          this.pumpCooldown = PUMP_REPEAT
          this.puff(this.pumpTarget)
        }
        return
      }
    }

    const firing = input.pressed.a || (input.held.a && this.pumpCooldown === 0)
    if (moving(m)) {
      if (want !== null && want === this.reverseOf(m)) {
        ;[m.tx, m.nx] = [m.nx, m.tx]
        ;[m.ty, m.ny] = [m.ny, m.ty]
        m.p = 1 - m.p
        this.facing = want
      }
      m.p +=
        this.isDug(m.nx, m.ny) && this.linked(m.tx, m.ty, m.nx, m.ny)
          ? WALK_SPEED
          : DIG_SPEED
      if (m.p >= 1) {
        this.dig(m.nx, m.ny, m.tx, m.ty)
        const ax = m.nx + (m.nx - m.tx)
        const ay = m.ny + (m.ny - m.ty)
        m.tx = m.nx
        m.ty = m.ny
        m.p = 0
        // Digging right up to a tunnel breaks through the last thin wall.
        if (ay >= 1 && this.isDug(ax, ay) && !this.turnipAt(ax, ay)) {
          this.links.add(this.linkKey(m.tx, m.ty, ax, ay))
        }
      }
    } else if (want !== null && firing) {
      this.facing = want
    } else if (want !== null) {
      this.facing = want
      const nx = m.tx + DX[want]!
      const ny = m.ty + DY[want]!
      const inside = nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS
      if (inside && !this.turnipAt(nx, ny)) {
        m.nx = nx
        m.ny = ny
        m.p = 0
      }
    }

    if (firing) {
      this.pumpCooldown = PUMP_REPEAT
      this.shoot()
    }
  }

  private wanted(input: InputFrame): Dir | null {
    const order: Array<[keyof InputFrame['held'], Dir]> = [
      ['up', 0],
      ['right', 1],
      ['down', 2],
      ['left', 3],
    ]
    for (const [button, dir] of order) if (input.pressed[button]) return dir
    for (const [button, dir] of order) if (input.held[button]) return dir
    return null
  }

  private reverseOf(m: Mover): Dir {
    const dx = m.nx - m.tx
    const dy = m.ny - m.ty
    if (dx > 0) return 3
    if (dx < 0) return 1
    return dy > 0 ? 0 : 2
  }

  /** The tile Buddy is mostly standing on. */
  private playerTile(): { tx: number; ty: number } {
    const m = this.player
    return m.p < 0.5 ? { tx: m.tx, ty: m.ty } : { tx: m.nx, ty: m.ny }
  }

  private enemyPos(e: Enemy) {
    return e.ghost ? { x: e.gx, y: e.gy } : at(e.m)
  }

  // --- bubbles -------------------------------------------------------------------

  private shoot() {
    const from = this.playerTile()
    const start = at(this.player)
    let tx = from.tx
    let ty = from.ty
    let end = { x: start.x, y: start.y }
    for (let step = 0; step < PUMP_REACH; step++) {
      const nx = tx + DX[this.facing]!
      const ny = ty + DY[this.facing]!
      if (!this.isDug(nx, ny) || !this.linked(tx, ty, nx, ny)) break
      tx = nx
      ty = ny
      end = centre(tx, ty)
      const target = this.enemies.find((e) => {
        if (e.inflate === 0 && e.ghost && !e.fleeing) return false
        const p = this.enemyPos(e)
        return Math.abs(p.x - end.x) < 10 && Math.abs(p.y - end.y) < 10
      })
      if (target) {
        this.stream = { x0: start.x, y0: start.y, x1: end.x, y1: end.y, t: 10 }
        this.pumpTarget = target
        this.puff(target)
        return
      }
    }
    this.stream = { x0: start.x, y0: start.y, x1: end.x, y1: end.y, t: 8 }
    this.sound.play('shoot')
  }

  private puff(e: Enemy) {
    e.inflate++
    e.deflate = DEFLATE_TICKS
    e.fireWarn = 0
    e.fire = 0
    this.sound.play('blip')
    if (e.inflate >= POP_AT) this.pop(e)
  }

  private pop(e: Enemy) {
    const p = this.enemyPos(e)
    const row = Math.max(1, Math.round((p.y - FY - T / 2) / T))
    let points = depthPoints(row)
    // A beetle puffed from the side is worth double, as in the classic.
    if (e.kind === 'beetle' && (this.facing === 1 || this.facing === 3)) {
      points *= 2
    }
    this.addScore(points, p.x, p.y - 10)
    this.floating.push({ x: p.x, y: p.y, life: 70, kind: e.kind })
    this.removeEnemy(e)
    this.sound.play('pop')
  }

  private removeEnemy(e: Enemy) {
    this.enemies = this.enemies.filter((other) => other !== e)
    if (this.pumpTarget === e) this.pumpTarget = null
  }

  // --- grubs and beetles ----------------------------------------------------------

  private sendHome(e: Enemy) {
    e.m = {
      tx: e.spawn.tx,
      ty: e.spawn.ty,
      nx: e.spawn.tx,
      ny: e.spawn.ty,
      p: 0,
    }
    e.ghost = false
    e.inflate = 0
    e.fire = 0
    e.fireWarn = 0
    e.ghostTimer = this.ghostDelay()
  }

  private updateEnemy(e: Enemy) {
    if (e.inflate > 0) {
      if (this.pumpTarget !== e && --e.deflate <= 0) {
        e.inflate--
        e.deflate = 40
      }
      return
    }
    // The last grub left makes a run for the surface.
    if (this.enemies.length === 1 && this.levelTick > 300 && !e.fleeing) {
      e.fleeing = true
      this.becomeGhost(e)
    }
    const speed = levelCurve(this.level, BURROW_CURVES.speed)
    if (!e.ghost) e.ghostTimer--
    if (e.ghost) {
      this.drift(e, speed)
    } else {
      this.crawl(e, speed)
      if (e.kind === 'beetle') this.breathe(e)
    }
    if (this.dead === 0) this.touchPlayer(e)
  }

  private becomeGhost(e: Enemy) {
    const p = at(e.m)
    e.ghost = true
    e.gx = p.x
    e.gy = p.y
    e.ghostTicks = 0
  }

  private drift(e: Enemy, speed: number) {
    e.ghostTicks++
    const goal = e.fleeing ? centre(0, 0) : at(this.player)
    const dx = goal.x - e.gx
    const dy = goal.y - e.gy
    const d = Math.hypot(dx, dy) || 1
    const v = speed * T * (e.fleeing ? 1.2 : 0.8)
    e.gx += (dx / d) * v
    e.gy += (dy / d) * v
    if (e.fleeing) {
      if (d < 2) {
        this.removeEnemy(e)
        this.banner = {
          text: 'ONE GOT AWAY',
          sub: 'THE GARDEN IS STILL SAFE',
          ticks: 100,
        }
      }
      return
    }
    // Settle back into a tunnel once the ghost has drifted a while.
    if (e.ghostTicks < GHOST_MIN) return
    const tx = Math.round((e.gx - T / 2) / T)
    const ty = Math.round((e.gy - FY - T / 2) / T)
    const c = centre(tx, ty)
    if (
      ty >= 1 &&
      this.isDug(tx, ty) &&
      Math.hypot(c.x - e.gx, c.y - e.gy) < 3
    ) {
      e.ghost = false
      e.m = { tx, ty, nx: tx, ny: ty, p: 0 }
      e.ghostTimer = this.ghostDelay()
    }
  }

  private crawl(e: Enemy, speed: number) {
    const m = e.m
    if (moving(m)) {
      m.p += speed
      if (m.p >= 1) {
        m.tx = m.nx
        m.ty = m.ny
        m.p = 0
      } else {
        return
      }
    }
    if (e.fireWarn > 0 || e.fire > 0) return
    if (e.ghostTimer <= 0) {
      this.becomeGhost(e)
      return
    }
    const goal = at(this.player)
    const options: Dir[] = []
    for (let d = 0 as Dir; d < 4; d = (d + 1) as Dir) {
      const nx = m.tx + DX[d]!
      const ny = m.ty + DY[d]!
      if (ny < 1 || !this.isDug(nx, ny) || this.turnipAt(nx, ny)) continue
      if (!this.linked(m.tx, m.ty, nx, ny)) continue
      options.push(d)
    }
    if (!options.length) return
    const back = ((e.facing + 2) % 4) as Dir
    const forward =
      options.length > 1 ? options.filter((d) => d !== back) : options
    let choice = forward[0]!
    if (this.rng() < 0.3) {
      choice = forward[Math.floor(this.rng() * forward.length)]!
    } else {
      let best = Infinity
      for (const d of forward) {
        const c = centre(m.tx + DX[d]!, m.ty + DY[d]!)
        const dist = Math.hypot(c.x - goal.x, c.y - goal.y)
        if (dist < best) {
          best = dist
          choice = d
        }
      }
    }
    e.facing = choice
    m.nx = m.tx + DX[choice]!
    m.ny = m.ty + DY[choice]!
  }

  /** Beetles stop, glow, then breathe a short flame along their row. */
  private breathe(e: Enemy) {
    if (e.fire > 0) {
      e.fire--
      return
    }
    if (e.fireWarn > 0) {
      if (--e.fireWarn === 0) {
        e.fire = 30
        this.sound.play('boom')
      }
      return
    }
    if (moving(e.m) || --e.fireCooldown > 0) return
    e.fireCooldown = 240 + Math.floor(this.rng() * 200)
    const p = this.playerTile()
    if (p.ty === e.m.ty && Math.abs(p.tx - e.m.tx) <= 4) {
      e.facing = p.tx > e.m.tx ? 1 : 3
    } else if (e.facing !== 1 && e.facing !== 3) {
      return
    }
    e.fireWarn = 40
    this.sound.play('warn')
  }

  private flameSpan(e: Enemy) {
    const c = at(e.m)
    const dir = e.facing === 1 ? 1 : -1
    const x0 = dir > 0 ? c.x + 6 : c.x - 6 - T * 2
    return { x0, x1: x0 + T * 2, y: c.y }
  }

  private touchPlayer(e: Enemy) {
    const p = at(this.player)
    if (e.fire > 0) {
      const f = this.flameSpan(e)
      if (p.x > f.x0 && p.x < f.x1 && Math.abs(p.y - f.y) < 8) {
        this.die('TOASTED!')
        return
      }
    }
    if (e.ghost) return
    const q = at(e.m)
    if (Math.hypot(p.x - q.x, p.y - q.y) < 11) this.die('CAUGHT!')
  }

  private die(text: string) {
    if (this.dead > 0) return
    this.lives--
    this.dead = DEATH_TICKS
    this.pumpTarget = null
    const p = at(this.player)
    this.burst(p.x, p.y, 16, '#5eead4')
    this.sound.play('die')
    if (this.lives > 0) this.banner = { text, ticks: 80 }
  }

  // --- turnips -------------------------------------------------------------------

  private updateTurnips() {
    for (const t of this.turnips) {
      if (t.state === 'idle') {
        const p = this.playerTile()
        const under = p.tx === t.tx && p.ty === t.ty + 1
        if (this.isDug(t.tx, t.ty + 1) && !under) {
          t.state = 'wobble'
          t.t = 40
        }
      } else if (t.state === 'wobble') {
        if (--t.t <= 0) {
          t.state = 'fall'
          this.sound.play('warn')
        }
      } else if (t.state === 'fall') {
        t.drop += 2
        this.crushUnder(t)
        if (t.drop % T === 0) {
          const row = t.ty + t.drop / T
          if (row + 1 >= ROWS || !this.isDug(t.tx, row + 1)) this.land(t)
        }
      } else if (t.state === 'broken' && t.t > 0) {
        t.t--
      }
    }
    this.turnips = this.turnips.filter((t) => t.state !== 'broken' || t.t > 0)
  }

  private crushUnder(t: Turnip) {
    const x = t.tx * T + T / 2
    const top = FY + t.ty * T + t.drop
    for (const e of [...this.enemies]) {
      const p = this.enemyPos(e)
      if (e.ghost && !e.fleeing) continue
      if (Math.abs(p.x - x) < 10 && p.y > top + 4 && p.y < top + T + 6) {
        t.crushed++
        this.floating.push({ x: p.x, y: p.y, life: 50, kind: e.kind })
        this.removeEnemy(e)
        this.sound.play('pop')
      }
    }
    const p = at(this.player)
    if (
      this.dead === 0 &&
      Math.abs(p.x - x) < 10 &&
      p.y > top + 6 &&
      p.y < top + T + 4
    ) {
      this.die('BONKED BY A TURNIP')
    }
  }

  private land(t: Turnip) {
    t.state = 'broken'
    t.t = 30
    const x = t.tx * T + T / 2
    const y = FY + t.ty * T + t.drop + T / 2
    this.burst(x, y, 10, '#e9d5ff')
    this.sound.play('boom')
    const bonus = CRUSH_BONUS[Math.min(t.crushed, CRUSH_BONUS.length - 1)]!
    if (bonus) this.addScore(bonus, x, y - 12)
    this.dropped++
    if (this.dropped === 2) {
      this.veggie = { ticks: 600 }
      this.banner = {
        text: 'VEGGIE BONUS!',
        sub: 'GRAB IT IN THE MIDDLE',
        ticks: 90,
      }
    }
  }

  private updateVeggie() {
    if (!this.veggie) return
    if (--this.veggie.ticks <= 0) {
      this.veggie = null
      return
    }
    const p = this.playerTile()
    if (p.tx === START.tx && p.ty === START.ty) {
      const c = centre(START.tx, START.ty)
      this.addScore(Math.min(8000, 400 * this.level), c.x, c.y - 12)
      this.veggie = null
      this.sound.play('pickup')
    }
  }

  private clearLevel() {
    this.levelClear = LEVEL_CLEAR_TICKS
    this.pumpTarget = null
    this.banner = {
      text: 'GARDEN SAFE!',
      sub: 'ON TO THE NEXT PATCH',
      ticks: LEVEL_CLEAR_TICKS,
    }
    this.sound.play('level')
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x?: number, y?: number) {
    if (this.demo) return
    this.score += points
    if (x !== undefined && y !== undefined) {
      this.floaters.push({ x, y, text: String(points), life: 40 })
    }
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra += EXTRA_EVERY
      this.banner = { text: 'EXTRA BUDDY!', ticks: 90 }
      this.sound.play('extra')
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 1.5
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 18 + Math.floor(this.rng() * 14),
        color,
      })
    }
  }

  private updateEffects() {
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.4
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
    for (const f of this.floating) {
      f.y -= 0.8
      f.life--
    }
    this.floating = this.floating.filter((f) => f.life > 0)
  }

  // --- attract-mode pilot -----------------------------------------------------

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
    const names = ['up', 'right', 'down', 'left'] as const
    if (this.pumpTarget) {
      held.a = true
      return frame
    }
    const me = this.playerTile()
    // A grub lined up in a tunnel within reach: face it and puff.
    for (let d = 0 as Dir; d < 4; d = (d + 1) as Dir) {
      let tx = me.tx
      let ty = me.ty
      for (let step = 0; step < PUMP_REACH; step++) {
        const nx = tx + DX[d]!
        const ny = ty + DY[d]!
        if (!this.isDug(nx, ny) || !this.linked(tx, ty, nx, ny)) break
        tx = nx
        ty = ny
        const c = centre(tx, ty)
        const hit = this.enemies.some((e) => {
          if (e.ghost && !e.fleeing) return false
          const p = this.enemyPos(e)
          return Math.abs(p.x - c.x) < 10 && Math.abs(p.y - c.y) < 10
        })
        if (hit) {
          held[names[d]] = true
          frame.pressed.a = true
          return frame
        }
      }
    }
    if (moving(this.player)) return frame
    // Otherwise line up with the nearest grub two or three tiles out, then
    // dig toward it to break into its tunnel (and puff next frame).
    const target = this.enemies
      .filter((e) => !e.ghost)
      .map((e) => e.m)
      .sort(
        (a, b) =>
          Math.abs(a.tx - me.tx) +
          Math.abs(a.ty - me.ty) -
          (Math.abs(b.tx - me.tx) + Math.abs(b.ty - me.ty)),
      )[0]
    if (!target) return frame
    const dx = target.tx - me.tx
    const dy = target.ty - me.ty
    const dist = Math.abs(dx) + Math.abs(dy)
    const step = (dir: Dir) => {
      const nx = me.tx + DX[dir]!
      const ny = me.ty + DY[dir]!
      if (nx < 0 || nx >= COLS || ny < 1 || ny >= ROWS) return false
      if (this.turnipAt(nx, ny)) return false
      held[names[dir]] = true
      return true
    }
    if (dist <= 1) {
      step(((this.facing + 2) % 4) as Dir)
      return frame
    }
    if (dx === 0 || dy === 0) {
      const toward: Dir = dx === 0 ? (dy > 0 ? 2 : 0) : dx > 0 ? 1 : 3
      step(toward)
      return frame
    }
    // Close the smaller gap first so the grub ends up in a straight line.
    const alignX = Math.abs(dx) <= Math.abs(dy)
    const first: Dir = alignX ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0
    const second: Dir = alignX ? (dy > 0 ? 2 : 0) : dx > 0 ? 1 : 3
    if (!step(first)) step(second)
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderGarden(g)
    for (const t of this.turnips) this.renderTurnip(g, t)
    if (this.veggie) this.renderVeggie(g)
    for (const e of this.enemies) this.renderEnemy(g, e)
    if (this.stream) this.renderStream(g)
    if (this.dead === 0 && !this.over) this.renderBuddy(g)
    for (const f of this.floating) this.renderFloating(g, f)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 30)
      g.fillStyle = p.color
      g.fillRect(p.x - 1, p.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, { align: 'center', color: '#fef08a' })
    }
    this.renderHud(g)
  }

  private renderGarden(g: CanvasRenderingContext2D) {
    g.fillStyle = '#0b1026'
    g.fillRect(0, 0, W, H)
    // Sky and the surface row.
    g.fillStyle = '#7dd3fc'
    g.fillRect(0, FY, W, T)
    for (let i = 0; i < 8; i++) {
      g.fillStyle = ['#f472b6', '#fde047', '#a78bfa'][i % 3]!
      g.fillRect(10 + i * 32, FY + T - 5, 3, 3)
      g.fillStyle = '#16a34a'
      g.fillRect(11 + i * 32, FY + T - 2, 1, 2)
    }
    // Soil in four layers, pebbled.
    for (let ty = 1; ty < ROWS; ty++) {
      const layer = Math.min(3, Math.floor((ty - 1) / 3.25))
      g.fillStyle = SOIL[layer]!
      g.fillRect(0, FY + ty * T, W, T)
      g.fillStyle = 'rgba(0, 0, 0, 0.18)'
      for (let tx = 0; tx < COLS; tx++) {
        const s = (tx * 7 + ty * 13) % 11
        g.fillRect(tx * T + s, FY + ty * T + ((s * 3) % 12) + 2, 2, 2)
      }
    }
    g.fillStyle = '#22c55e'
    g.fillRect(0, FY + T - 1, W, 2)
    // Tunnels: dug tiles plus the passages between linked neighbours.
    g.fillStyle = '#1c1917'
    for (let ty = 1; ty < ROWS; ty++) {
      for (let tx = 0; tx < COLS; tx++) {
        if (!this.isDug(tx, ty)) continue
        const x = tx * T
        const y = FY + ty * T
        g.fillRect(x + 2, y + 2, T - 4, T - 4)
        if (tx + 1 < COLS && this.linked(tx, ty, tx + 1, ty)) {
          g.fillRect(x + T - 2, y + 2, 4, T - 4)
        }
        if (this.linked(tx, ty, tx, ty - 1)) g.fillRect(x + 2, y - 2, T - 4, 4)
      }
    }
    // Buddy's tunnel in progress.
    const m = this.player
    if (moving(m) && !this.linked(m.tx, m.ty, m.nx, m.ny) && m.ny > 0) {
      const a = centre(m.tx, m.ty)
      const b = at(m)
      g.fillRect(
        Math.min(a.x, b.x) - 6,
        Math.min(a.y, b.y) - 6,
        Math.abs(a.x - b.x) + 12,
        Math.abs(a.y - b.y) + 12,
      )
    }
  }

  private renderTurnip(g: CanvasRenderingContext2D, t: Turnip) {
    const wobble = t.state === 'wobble' ? Math.sin(this.tick) * 1.5 : 0
    const x = t.tx * T + T / 2 + wobble
    const y = FY + t.ty * T + t.drop + T / 2
    if (t.state === 'broken') {
      g.globalAlpha = t.t / 30
    }
    g.fillStyle = '#f5f3ff'
    g.beginPath()
    g.arc(x, y + 2, 6, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#a855f7'
    g.beginPath()
    g.arc(x, y, 6, Math.PI, 0)
    g.fill()
    g.fillStyle = '#22c55e'
    g.fillRect(x - 4, y - 9, 2, 4)
    g.fillRect(x - 1, y - 10, 2, 5)
    g.fillRect(x + 2, y - 9, 2, 4)
    g.globalAlpha = 1
  }

  private renderVeggie(g: CanvasRenderingContext2D) {
    const c = centre(START.tx, START.ty)
    if (this.veggie!.ticks < 120 && Math.floor(this.tick / 6) % 2) return
    g.fillStyle = '#fb923c'
    g.beginPath()
    g.moveTo(c.x - 4, c.y - 4)
    g.lineTo(c.x + 4, c.y - 4)
    g.lineTo(c.x, c.y + 7)
    g.fill()
    g.fillStyle = '#22c55e'
    g.fillRect(c.x - 3, c.y - 8, 2, 4)
    g.fillRect(c.x + 1, c.y - 8, 2, 4)
  }

  private renderEnemy(g: CanvasRenderingContext2D, e: Enemy) {
    const p = this.enemyPos(e)
    if (e.ghost) {
      // Just goggles drifting through the soil.
      g.globalAlpha = 0.85
      g.fillStyle = '#f8fafc'
      g.fillRect(p.x - 6, p.y - 3, 5, 5)
      g.fillRect(p.x + 1, p.y - 3, 5, 5)
      g.fillStyle = '#0f172a'
      g.fillRect(p.x - 4, p.y - 1, 2, 2)
      g.fillRect(p.x + 3, p.y - 1, 2, 2)
      g.globalAlpha = 1
      return
    }
    const r = 6 + e.inflate * 2.2
    const swell = e.inflate > 0
    if (e.kind === 'grub') {
      g.fillStyle = swell ? '#fbcfe8' : '#f472b6'
      g.beginPath()
      g.arc(p.x, p.y, r, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#fde68a'
      g.fillRect(p.x - 5, p.y - 3, 4, 4)
      g.fillRect(p.x + 1, p.y - 3, 4, 4)
      g.fillStyle = '#0f172a'
      g.fillRect(p.x - 4, p.y - 2, 2, 2)
      g.fillRect(p.x + 2, p.y - 2, 2, 2)
      if (!swell) g.fillRect(p.x - 2, p.y + 3, 4, 1)
    } else {
      const glow = e.fireWarn > 0 && Math.floor(this.tick / 4) % 2 === 0
      g.fillStyle = swell ? '#bbf7d0' : glow ? '#fde047' : '#16a34a'
      g.beginPath()
      g.arc(p.x, p.y, r, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#14532d'
      g.fillRect(p.x - 1, p.y - r + 1, 2, r * 2 - 2)
      const ahead = e.facing === 3 ? -1 : 1
      g.fillStyle = '#0f172a'
      g.fillRect(p.x + ahead * (r - 1) - 1, p.y - 5, 2, 4)
      g.fillStyle = '#fef9c3'
      g.fillRect(p.x + ahead * 3 - 1, p.y - 2, 2, 2)
      if (e.fire > 0) {
        const f = this.flameSpan(e)
        for (let x = f.x0; x < f.x1; x += 4) {
          g.fillStyle = (x / 4 + this.tick) % 2 ? '#f97316' : '#facc15'
          const h = 3 + ((x * 3 + this.tick) % 4)
          g.fillRect(x, f.y - h / 2, 4, h)
        }
      }
    }
  }

  private renderFloating(g: CanvasRenderingContext2D, f: Floating) {
    g.globalAlpha = Math.min(1, f.life / 30)
    g.strokeStyle = '#bae6fd'
    g.lineWidth = 1
    g.beginPath()
    g.arc(f.x, f.y, 9, 0, Math.PI * 2)
    g.stroke()
    g.fillStyle = f.kind === 'grub' ? '#fbcfe8' : '#bbf7d0'
    g.beginPath()
    g.arc(f.x, f.y, 5, 0, Math.PI * 2)
    g.fill()
    // A happy little smile on the way up.
    g.fillStyle = '#0f172a'
    g.fillRect(f.x - 2, f.y - 1, 1, 1)
    g.fillRect(f.x + 1, f.y - 1, 1, 1)
    g.fillRect(f.x - 2, f.y + 2, 4, 1)
    g.globalAlpha = 1
  }

  private renderStream(g: CanvasRenderingContext2D) {
    const s = this.stream!
    const steps = Math.max(
      1,
      Math.round(Math.hypot(s.x1 - s.x0, s.y1 - s.y0) / 5),
    )
    for (let i = 1; i <= steps; i++) {
      const f = i / steps
      g.fillStyle = i % 2 ? '#e0f2fe' : '#7dd3fc'
      g.beginPath()
      g.arc(
        s.x0 + (s.x1 - s.x0) * f,
        s.y0 + (s.y1 - s.y0) * f,
        1.5 + (i % 2),
        0,
        Math.PI * 2,
      )
      g.fill()
    }
  }

  private renderBuddy(g: CanvasRenderingContext2D) {
    const p = at(this.player)
    const ahead = { x: DX[this.facing]!, y: DY[this.facing]! }
    g.fillStyle = '#0d9488'
    g.beginPath()
    g.arc(p.x, p.y, 6.5, 0, Math.PI * 2)
    g.fill()
    // Pointed ears and gold headphones.
    g.fillStyle = '#14b8a6'
    g.fillRect(p.x - 6, p.y - 8, 3, 3)
    g.fillRect(p.x + 3, p.y - 8, 3, 3)
    g.fillStyle = '#facc15'
    g.fillRect(p.x - 7, p.y - 2, 2, 4)
    g.fillRect(p.x + 5, p.y - 2, 2, 4)
    // Eyes and a pink nose toward where Buddy is heading.
    g.fillStyle = '#ffffff'
    g.fillRect(p.x + ahead.x * 2 - 3, p.y + ahead.y * 2 - 2, 2, 2)
    g.fillRect(p.x + ahead.x * 2 + 1, p.y + ahead.y * 2 - 2, 2, 2)
    g.fillStyle = '#f472b6'
    g.fillRect(p.x + ahead.x * 6 - 1, p.y + ahead.y * 6 - 1, 3, 3)
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#1e1b4b'
    drawText(g, String(this.score).padStart(6, '0'), 4, 3, {
      scale: 2,
      color: '#fde047',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 4, 3, {
      align: 'right',
      color: '#f9a8d4',
      shadow,
    })
    drawText(g, `GARDEN ${this.level}`, W - 4, 11, {
      align: 'right',
      color: '#bbf7d0',
    })
    const base = FY + ROWS * T + 5
    for (let i = 0; i < Math.min(this.lives - 1, 6); i++) {
      g.fillStyle = '#0d9488'
      g.beginPath()
      g.arc(8 + i * 12, base + 4, 4, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#facc15'
      g.fillRect(4 + i * 12, base + 3, 1, 3)
    }
    for (let i = 0; i < Math.min(this.level, 10); i++) {
      g.fillStyle = ['#f472b6', '#fde047', '#a78bfa', '#4ade80'][i % 4]!
      g.fillRect(W - 10 - i * 9, base + 1, 5, 5)
      g.fillStyle = '#16a34a'
      g.fillRect(W - 8 - i * 9, base + 6, 1, 4)
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, FY + 64, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        shadow: '#7c3aed',
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, FY + 84, {
          align: 'center',
          color: '#fde68a',
          shadow,
        })
      }
    }
  }
}

const burrowBuddy: ArcadeGameModule = {
  create: (options) => new BurrowBuddy(options),
}

export const create = burrowBuddy.create
export default burrowBuddy
