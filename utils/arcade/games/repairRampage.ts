// /utils/arcade/games/repairRampage.ts
//
// Repair Rampage -- the Kind Robots Arcade's Rampage riff, turned around
// (conductor kr-arcade/t-009 game factory). A storm has wrecked the city's
// towers. Bolt, a giant friendly robot, climbs their faces and fixes them
// window by window, rescues kittens stranded on the ledges, and shoos the news
// drones whose flashbulbs dazzle it right off the wall.
//
// Each city has taller, more broken towers and busier drones, and a tower
// with broken windows slowly loses its footing: it wobbles when it's close and
// falls if you dawdle. Walk with left/right, press Up at a tower to grab on,
// climb with the arrows, A fixes the window you're on (or shoos a drone right
// beside you). Dazzles and long falls cost charge; run out and it's game over.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 320
const H = 240
const GROUND = 222
const CELL = 16
const TOWER_COLS = 3
const TOWER_W = TOWER_COLS * CELL + 8
const WALK_SPEED = 1.5
const CLIMB_TICKS = 8
const FIX_COOLDOWN = 8
const MAX_CHARGE = 100
const DAZZLE_COST = 15
const FALL_COST = 10
const COLLAPSE_COST = 20
const WOBBLE_AT = 60 * 10
const FIX_STEADY = 30
const HOLD_GRACE = 60 * 10
/** A fallen tower costs the charge Bolt spends shoring up the rubble. */
const TOWER_DOWN_COST = 25
/** Bolt's charge runs down a point at a time while it works. */
const DRAIN_TICKS = 120
const CLEAR_TICKS = 150

const FIX_POINTS = 100
const SHOO_POINTS = 150
const KITTEN_POINTS = 500

export const RAMPAGE_CURVES = {
  towers: { start: 2, step: 0.5, limit: 4 },
  rows: { start: 6, step: 1, limit: 11 },
  broken: { start: 0.45, step: 0.08, limit: 0.9 },
  /** Seconds a tower holds for each broken window (plus a grace period). */
  holdPerWindow: { start: 2.6, step: -0.15, limit: 1.1 },
  droneEvery: { start: 360, step: -40, limit: 90 },
  droneSpeed: { start: 0.8, step: 0.15, limit: 2.2 },
  maxDrones: { start: 2, step: 0.5, limit: 5 },
} as const

type Tower = {
  x: number
  rows: number
  /** windows[row * TOWER_COLS + col]: true when fixed. Row 0 is the bottom. */
  windows: boolean[]
  stability: number
  maxStability: number
  standing: boolean
  dust: number
}
type Drone = {
  x: number
  y: number
  dir: 1 | -1
  speed: number
  warn: number
  flashed: boolean
  leaving: boolean
}
type Kitten = { tower: number; index: number; ticks: number }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

function windowY(row: number): number {
  return GROUND - (row + 1) * CELL - 4
}

class RepairRampage implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = 1
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private towers: Tower[] = []
  private charge = MAX_CHARGE
  /** Bolt on the street, on a tower's face, or falling. */
  private mode: 'ground' | 'climb' | 'fall' = 'ground'
  private x = 24
  private y = GROUND
  private vy = 0
  private fallFrom = GROUND
  private tower = -1
  private col = 0
  private row = 0
  private climbWait = 0
  private fixCooldown = 0
  private punch = 0
  private facing: 1 | -1 = 1
  private drones: Drone[] = []
  private droneTimer = 240
  private kitten: Kitten | null = null
  private kittenTimer = 400
  private rescued = 0
  private clear = 0
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startCity(1)
  }

  // --- setup -------------------------------------------------------------------

  private startCity(city: number) {
    this.level = city
    const count = Math.floor(levelCurve(city, RAMPAGE_CURVES.towers))
    const tallest = Math.round(levelCurve(city, RAMPAGE_CURVES.rows))
    const broken = levelCurve(city, RAMPAGE_CURVES.broken)
    const perWindow = levelCurve(city, RAMPAGE_CURVES.holdPerWindow) * 60
    const gap = (W - count * TOWER_W) / (count + 1)
    this.towers = []
    for (let i = 0; i < count; i++) {
      const rows = Math.max(4, tallest - Math.floor(this.rng() * 3))
      const windows: boolean[] = []
      for (let w = 0; w < rows * TOWER_COLS; w++) {
        windows.push(this.rng() >= broken)
      }
      // Every tower needs at least a couple of repairs.
      windows[Math.floor(this.rng() * windows.length)] = false
      windows[Math.floor(this.rng() * windows.length)] = false
      const brokenCount = windows.filter((fixed) => !fixed).length
      const stability = Math.round(HOLD_GRACE + brokenCount * perWindow)
      this.towers.push({
        x: Math.round(gap + i * (TOWER_W + gap)),
        rows,
        windows,
        stability,
        maxStability: stability,
        standing: true,
        dust: 0,
      })
    }
    this.mode = 'ground'
    this.x = 12
    this.y = GROUND
    this.tower = -1
    this.drones = []
    this.droneTimer = 240
    this.kitten = null
    this.kittenTimer = 360
    this.banner = { text: `CITY ${city}`, sub: 'FIX EVERY WINDOW', ticks: 100 }
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input

    if (this.clear > 0) {
      if (--this.clear === 0) this.startCity(this.level + 1)
      return
    }
    if (this.fixCooldown > 0) this.fixCooldown--
    if (this.punch > 0) this.punch--
    if (this.tick % DRAIN_TICKS === 0) this.charge--

    if (this.mode === 'ground') this.walk(controls)
    else if (this.mode === 'climb') this.climb(controls)
    else this.fall()

    this.updateTowers()
    this.updateDrones()
    this.updateKitten()
    this.checkClear()
    if (this.charge <= 0 && !this.over) {
      this.over = true
      this.banner = { text: 'OUT OF CHARGE', sub: 'GAME OVER', ticks: 9999 }
      this.sound.play('die')
    }
  }

  private walk(input: InputFrame) {
    if (input.held.left) {
      this.x -= WALK_SPEED
      this.facing = -1
    }
    if (input.held.right) {
      this.x += WALK_SPEED
      this.facing = 1
    }
    this.x = Math.max(10, Math.min(W - 10, this.x))
    if (input.held.up || input.pressed.up) {
      const i = this.towers.findIndex(
        (t) => t.standing && this.x > t.x + 2 && this.x < t.x + TOWER_W - 2,
      )
      if (i >= 0) this.grab(i)
    }
    if (input.pressed.a) this.swing()
  }

  private grab(i: number) {
    const t = this.towers[i]!
    this.mode = 'climb'
    this.tower = i
    this.col = Math.max(
      0,
      Math.min(TOWER_COLS - 1, Math.floor((this.x - t.x - 4) / CELL)),
    )
    this.row = 0
    this.climbWait = CLIMB_TICKS
    this.placeOnTower()
    this.sound.play('blip')
  }

  private placeOnTower() {
    const t = this.towers[this.tower]!
    this.x = t.x + 4 + this.col * CELL + CELL / 2
    this.y = windowY(this.row) + CELL
  }

  private climb(input: InputFrame) {
    const t = this.towers[this.tower]
    if (!t || !t.standing) {
      this.letGo()
      return
    }
    if (this.climbWait > 0) {
      this.climbWait--
    } else {
      let moved = true
      if (input.held.up && this.row < t.rows - 1) this.row++
      else if (input.held.down) {
        if (this.row === 0) {
          this.mode = 'ground'
          this.y = GROUND
          return
        }
        this.row--
      } else if (input.held.left) {
        this.facing = -1
        if (this.col === 0) {
          this.letGo()
          this.x -= 10
          return
        }
        this.col--
      } else if (input.held.right) {
        this.facing = 1
        if (this.col === TOWER_COLS - 1) {
          this.letGo()
          this.x += 10
          return
        }
        this.col++
      } else {
        moved = false
      }
      if (moved) this.climbWait = CLIMB_TICKS
    }
    this.placeOnTower()
    if (input.pressed.a || (input.held.a && this.fixCooldown === 0)) {
      this.swing()
    }
  }

  private letGo() {
    this.mode = 'fall'
    this.vy = 0
    this.fallFrom = this.y
    this.tower = -1
  }

  private fall() {
    this.vy = Math.min(5, this.vy + 0.3)
    this.y += this.vy
    if (this.y < GROUND) return
    this.y = GROUND
    this.mode = 'ground'
    // A long drop rattles Bolt's circuits.
    if (GROUND - this.fallFrom > CELL * 3) {
      this.charge -= FALL_COST
      this.burst(this.x, GROUND, 8, '#94a3b8')
      this.sound.play('boom')
    }
  }

  /** A swing of the wrench: shoo a drone right beside Bolt, or fix a window. */
  private swing() {
    if (this.fixCooldown > 0) return
    this.fixCooldown = FIX_COOLDOWN
    this.punch = 8
    const drone = this.drones.find(
      (d) =>
        !d.leaving &&
        Math.abs(d.x - this.x) < 26 &&
        Math.abs(d.y - (this.y - 14)) < 18,
    )
    if (drone) {
      drone.leaving = true
      drone.dir = drone.x < this.x ? -1 : 1
      drone.warn = 0
      this.addScore(SHOO_POINTS, drone.x, drone.y - 8)
      this.sound.play('pop')
      return
    }
    if (this.mode !== 'climb') return
    const t = this.towers[this.tower]!
    const index = this.row * TOWER_COLS + this.col
    if (t.windows[index]) return
    t.windows[index] = true
    t.stability = Math.min(t.maxStability, t.stability + FIX_STEADY)
    const wx = t.x + 4 + this.col * CELL + CELL / 2
    const wy = windowY(this.row) + CELL / 2
    this.addScore(FIX_POINTS, wx, wy - 8)
    this.burst(wx, wy, 6, '#fde68a')
    this.sound.play('pickup')
    if (this.kitten?.tower === this.tower && this.kitten.index === index) {
      this.kitten = null
      this.rescued++
      this.addScore(KITTEN_POINTS * this.level, wx, wy - 18)
      this.banner = { text: 'KITTEN RESCUED!', ticks: 70 }
      this.sound.play('extra')
    } else if (this.rng() < 0.03) {
      this.charge = Math.min(MAX_CHARGE, this.charge + 12)
      this.floaters.push({ x: wx, y: wy - 18, text: 'CHARGE!', life: 40 })
    }
  }

  // --- towers -------------------------------------------------------------------

  private updateTowers() {
    for (const [i, t] of this.towers.entries()) {
      if (t.dust > 0) t.dust--
      if (!t.standing) continue
      if (t.windows.every(Boolean)) continue
      if (--t.stability > 0) {
        if (t.stability === WOBBLE_AT) {
          this.sound.play('warn')
          this.banner = { text: 'A TOWER IS WOBBLING!', ticks: 80 }
        }
        continue
      }
      // Too long left broken: the tower comes down.
      t.standing = false
      t.dust = 90
      this.burst(t.x + TOWER_W / 2, GROUND - 20, 24, '#cbd5e1')
      this.sound.play('boom')
      this.banner = { text: 'TOWER DOWN!', sub: 'NOBODY HURT', ticks: 90 }
      this.charge -= TOWER_DOWN_COST
      if (this.kitten?.tower === i) this.kitten = null
      if (this.mode === 'climb' && this.tower === i) {
        this.charge -= COLLAPSE_COST
        this.letGo()
      }
    }
  }

  private wobble(t: Tower): number {
    if (!t.standing || t.stability > WOBBLE_AT) return 0
    const strength = 1 - t.stability / WOBBLE_AT
    return Math.sin(this.tick / 3) * (1 + strength * 2)
  }

  private checkClear() {
    if (this.clear > 0) return
    const standing = this.towers.filter((t) => t.standing)
    if (standing.some((t) => !t.windows.every(Boolean))) return
    const bonus = 1000 * standing.length * this.level
    if (bonus) this.addScore(bonus, W / 2, 90)
    // A grateful city tops Bolt up for the next one.
    this.charge = Math.min(MAX_CHARGE, this.charge + 10)
    this.clear = CLEAR_TICKS
    this.drones = []
    this.kitten = null
    this.banner = {
      text: 'CITY REPAIRED!',
      sub: standing.length
        ? `${standing.length} TOWERS STANDING`
        : 'ON TO THE NEXT',
      ticks: CLEAR_TICKS,
    }
    this.sound.play('level')
  }

  // --- drones and kittens ---------------------------------------------------------

  private updateDrones() {
    if (--this.droneTimer <= 0) {
      this.droneTimer = Math.round(
        levelCurve(this.level, RAMPAGE_CURVES.droneEvery),
      )
      if (
        this.drones.length <
        Math.floor(levelCurve(this.level, RAMPAGE_CURVES.maxDrones))
      ) {
        const dir = this.rng() < 0.5 ? 1 : -1
        const row = Math.floor(this.rng() * 8)
        this.drones.push({
          x: dir === 1 ? -12 : W + 12,
          y: Math.max(30, windowY(row) + 4),
          dir,
          speed:
            levelCurve(this.level, RAMPAGE_CURVES.droneSpeed) *
            (0.8 + this.rng() * 0.4),
          warn: 0,
          flashed: false,
          leaving: false,
        })
      }
    }
    for (const d of this.drones) {
      if (d.warn > 0) {
        // Hovering, lining up the shot.
        if (--d.warn === 0) this.flash(d)
        continue
      }
      d.x += d.dir * (d.leaving ? d.speed * 2.5 : d.speed)
      if (d.leaving) d.y -= 0.6
      const sameHeight = Math.abs(d.y - (this.y - 14)) < 14
      const ahead = (this.x - d.x) * d.dir
      if (!d.flashed && !d.leaving && sameHeight && ahead > 20 && ahead < 90) {
        d.warn = 40
        this.sound.play('warn')
      }
    }
    this.drones = this.drones.filter(
      (d) => d.x > -30 && d.x < W + 30 && d.y > -20,
    )
  }

  private flash(d: Drone) {
    d.flashed = true
    this.burst(d.x, d.y, 10, '#ffffff')
    this.sound.play('shoot')
    const sameHeight = Math.abs(d.y - (this.y - 14)) < 16
    const ahead = (this.x - d.x) * d.dir
    if (sameHeight && ahead > 0 && ahead < 110) {
      this.charge -= DAZZLE_COST
      this.floaters.push({
        x: this.x,
        y: this.y - 36,
        text: 'DAZZLED!',
        life: 40,
      })
      if (this.mode === 'climb') this.letGo()
    }
  }

  private updateKitten() {
    if (this.kitten) {
      if (--this.kitten.ticks <= 0) this.kitten = null
      return
    }
    if (--this.kittenTimer > 0) return
    this.kittenTimer = 500 + Math.floor(this.rng() * 300)
    const spots: Array<{ tower: number; index: number }> = []
    this.towers.forEach((t, tower) => {
      if (!t.standing) return
      t.windows.forEach((fixed, index) => {
        if (!fixed && Math.floor(index / TOWER_COLS) >= 2)
          spots.push({ tower, index })
      })
    })
    if (!spots.length) return
    const spot = spots[Math.floor(this.rng() * spots.length)]!
    this.kitten = { ...spot, ticks: 60 * 9 }
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 40 })
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 1.6
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.4,
        life: 18 + Math.floor(this.rng() * 16),
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
    // Shoo a drone that's lining up a shot nearby.
    const threat = this.drones.find(
      (d) =>
        !d.leaving &&
        !d.flashed &&
        Math.abs(d.x - this.x) < 26 &&
        Math.abs(d.y - (this.y - 14)) < 18,
    )
    if (threat && this.fixCooldown === 0) {
      frame.pressed.a = true
      return frame
    }
    const warned = this.drones.find(
      (d) => d.warn > 0 && Math.abs(d.y - (this.y - 14)) < 16,
    )
    if (this.mode === 'climb') {
      const t = this.towers[this.tower]!
      if (warned) {
        // Climb out of the flash's line.
        if (this.row < t.rows - 1) held.up = true
        else held.down = true
        return frame
      }
      const here = this.row * TOWER_COLS + this.col
      if (!t.windows[here]) {
        if (this.fixCooldown === 0) frame.pressed.a = true
        return frame
      }
      // Head for the nearest broken window on this tower.
      let best = -1
      let bestDist = Infinity
      t.windows.forEach((fixed, index) => {
        if (fixed) return
        const r = Math.floor(index / TOWER_COLS)
        const c = index % TOWER_COLS
        const dist = Math.abs(r - this.row) * 1.2 + Math.abs(c - this.col)
        if (dist < bestDist) {
          bestDist = dist
          best = index
        }
      })
      if (best < 0) {
        held.down = true
        return frame
      }
      const r = Math.floor(best / TOWER_COLS)
      const c = best % TOWER_COLS
      if (r > this.row) held.up = true
      else if (r < this.row) held.down = true
      else if (c > this.col) held.right = true
      else if (c < this.col) held.left = true
      return frame
    }
    if (this.mode === 'ground') {
      // Walk to the shakiest tower that still needs work and climb it.
      const target = this.towers
        .filter((t) => t.standing && !t.windows.every(Boolean))
        .sort((a, b) => a.stability - b.stability)[0]
      if (!target) return frame
      const mid = target.x + TOWER_W / 2
      if (Math.abs(mid - this.x) > 6) {
        if (mid > this.x) held.right = true
        else held.left = true
      } else {
        held.up = true
      }
    }
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderSky(g)
    this.towers.forEach((t, i) => this.renderTower(g, t, i))
    this.renderStreet(g)
    for (const d of this.drones) this.renderDrone(g, d)
    this.renderBolt(g)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 30)
      g.fillStyle = p.color
      g.fillRect(p.x - 1, p.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, { align: 'center', color: '#fde68a' })
    }
    this.renderHud(g)
  }

  private renderSky(g: CanvasRenderingContext2D) {
    const sky = g.createLinearGradient(0, 0, 0, GROUND)
    sky.addColorStop(0, '#1e1b4b')
    sky.addColorStop(0.6, '#6d28d9')
    sky.addColorStop(1, '#f472b6')
    g.fillStyle = sky
    g.fillRect(0, 0, W, H)
    // The storm has passed: a faint rainbow behind the skyline.
    const colors = [
      '#ef4444',
      '#f97316',
      '#facc15',
      '#4ade80',
      '#38bdf8',
      '#a78bfa',
    ]
    g.globalAlpha = 0.18
    colors.forEach((c, i) => {
      g.strokeStyle = c
      g.lineWidth = 3
      g.beginPath()
      g.arc(W / 2, GROUND + 40, 190 - i * 3, Math.PI, 0)
      g.stroke()
    })
    g.globalAlpha = 1
  }

  private renderTower(g: CanvasRenderingContext2D, t: Tower, i: number) {
    if (!t.standing) {
      if (t.dust > 0) {
        g.globalAlpha = t.dust / 90
        g.fillStyle = '#cbd5e1'
        g.beginPath()
        g.arc(
          t.x + TOWER_W / 2,
          GROUND - 10,
          30 + (90 - t.dust) / 3,
          Math.PI,
          0,
        )
        g.fill()
        g.globalAlpha = 1
      }
      g.fillStyle = '#64748b'
      g.fillRect(t.x + 4, GROUND - 8, TOWER_W - 8, 8)
      return
    }
    const sway = this.wobble(t)
    const top = windowY(t.rows - 1) - 6
    g.save()
    g.translate(sway, 0)
    g.fillStyle = '#475569'
    g.fillRect(t.x, top, TOWER_W, GROUND - top)
    g.fillStyle = '#64748b'
    g.fillRect(t.x, top, TOWER_W, 3)
    g.fillRect(t.x + TOWER_W / 2 - 1, top - 10, 2, 10)
    g.fillStyle = Math.floor(this.tick / 20) % 2 ? '#f87171' : '#7f1d1d'
    g.fillRect(t.x + TOWER_W / 2 - 1, top - 12, 3, 3)
    for (let row = 0; row < t.rows; row++) {
      for (let col = 0; col < TOWER_COLS; col++) {
        const index = row * TOWER_COLS + col
        const wx = t.x + 4 + col * CELL + 2
        const wy = windowY(row) + 2
        if (t.windows[index]) {
          g.fillStyle = '#fde68a'
          g.fillRect(wx, wy, CELL - 4, CELL - 4)
          g.fillStyle = '#f59e0b'
          g.fillRect(wx + (CELL - 4) / 2 - 0.5, wy, 1, CELL - 4)
        } else {
          g.fillStyle = '#0f172a'
          g.fillRect(wx, wy, CELL - 4, CELL - 4)
          g.strokeStyle = '#cbd5e1'
          g.lineWidth = 1
          g.beginPath()
          g.moveTo(wx + 2, wy + 1)
          g.lineTo(wx + 6, wy + 6)
          g.lineTo(wx + 4, wy + 9)
          g.moveTo(wx + 6, wy + 6)
          g.lineTo(wx + 10, wy + 4)
          g.stroke()
        }
        if (this.kitten?.tower === i && this.kitten.index === index) {
          this.renderKitten(g, wx + (CELL - 4) / 2, wy + CELL - 6)
        }
      }
    }
    if (t.stability <= WOBBLE_AT && !t.windows.every(Boolean)) {
      if (Math.floor(this.tick / 8) % 2 === 0) {
        drawText(g, '!', t.x + TOWER_W / 2, top - 24, {
          align: 'center',
          color: '#fde047',
        })
      }
    }
    g.restore()
  }

  private renderKitten(g: CanvasRenderingContext2D, x: number, y: number) {
    g.fillStyle = '#fb923c'
    g.fillRect(x - 4, y - 4, 8, 6)
    g.fillRect(x - 4, y - 7, 2, 3)
    g.fillRect(x + 2, y - 7, 2, 3)
    g.fillStyle = '#0f172a'
    g.fillRect(x - 2, y - 2, 1, 1)
    g.fillRect(x + 1, y - 2, 1, 1)
    if (Math.floor(this.tick / 30) % 2 === 0) {
      drawText(g, 'MEW', x, y - 16, { align: 'center', color: '#fed7aa' })
    }
  }

  private renderStreet(g: CanvasRenderingContext2D) {
    g.fillStyle = '#334155'
    g.fillRect(0, GROUND, W, H - GROUND)
    g.fillStyle = '#94a3b8'
    for (let x = 6; x < W; x += 28) g.fillRect(x, GROUND + 9, 14, 2)
  }

  private renderDrone(g: CanvasRenderingContext2D, d: Drone) {
    const blink = d.warn > 0 && Math.floor(this.tick / 4) % 2 === 0
    g.fillStyle = '#cbd5e1'
    g.fillRect(d.x - 7, d.y - 2, 14, 4)
    g.fillStyle = '#64748b'
    g.fillRect(d.x - 9, d.y - 5, 5, 2)
    g.fillRect(d.x + 4, d.y - 5, 5, 2)
    g.fillStyle = blink ? '#ffffff' : '#0f172a'
    g.fillRect(d.x + d.dir * 6 - 2, d.y - 1, 4, 3)
    if (d.warn > 0) {
      g.globalAlpha = 0.25
      g.fillStyle = '#fef9c3'
      g.fillRect(d.dir > 0 ? d.x : d.x - 90, d.y - 6, 90, 12)
      g.globalAlpha = 1
    }
  }

  private renderBolt(g: CanvasRenderingContext2D) {
    const x = this.x
    const feet = this.y
    const climbing = this.mode === 'climb'
    // Legs, body, head with a visor, and arms (up when climbing).
    g.fillStyle = '#0f766e'
    g.fillRect(x - 7, feet - 8, 5, 8)
    g.fillRect(x + 2, feet - 8, 5, 8)
    g.fillStyle = '#14b8a6'
    g.fillRect(x - 9, feet - 24, 18, 17)
    g.fillStyle = '#5eead4'
    g.fillRect(x - 7, feet - 34, 14, 10)
    g.fillStyle = '#0f172a'
    g.fillRect(x - 5, feet - 31, 10, 4)
    g.fillStyle = '#fde047'
    g.fillRect(x - 4 + (this.facing > 0 ? 3 : 0), feet - 30, 3, 2)
    g.fillStyle = '#f472b6'
    g.fillRect(x - 1, feet - 18, 3, 3)
    g.fillStyle = '#0d9488'
    if (climbing) {
      g.fillRect(x - 12, feet - 36, 4, 14)
      g.fillRect(x + 8, feet - 36, 4, 14)
    } else {
      g.fillRect(x - 12, feet - 22, 4, 12)
      g.fillRect(x + 8, feet - 22, 4, 12)
    }
    if (this.punch > 0) {
      // The repair wrench, mid-swing.
      g.fillStyle = '#e5e7eb'
      const wx = x + this.facing * 12
      g.fillRect(wx - 2, feet - 26, 4, 8)
      g.fillRect(wx - 4, feet - 28, 8, 3)
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#1e1b4b'
    drawText(g, String(this.score).padStart(7, '0'), 4, 3, {
      scale: 2,
      color: '#fde047',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 4, 3, {
      align: 'right',
      color: '#f9a8d4',
      shadow,
    })
    drawText(g, `CITY ${this.level}`, W - 4, 12, {
      align: 'right',
      color: '#a5f3fc',
    })
    drawText(g, 'CHARGE', 100, 3, { color: '#bbf7d0', shadow })
    g.fillStyle = '#1f2937'
    g.fillRect(100, 12, 70, 5)
    const frac = Math.max(0, this.charge) / MAX_CHARGE
    g.fillStyle = frac > 0.4 ? '#4ade80' : frac > 0.2 ? '#facc15' : '#ef4444'
    g.fillRect(100, 12, 70 * frac, 5)
    if (this.rescued) {
      drawText(g, `KITTENS ${this.rescued}`, 180, 3, {
        color: '#fed7aa',
        shadow,
      })
    }
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 48, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        shadow: '#7c3aed',
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, 68, {
          align: 'center',
          color: '#fde68a',
          shadow,
        })
      }
    }
  }
}

const repairRampage: ArcadeGameModule = {
  create: (options) => new RepairRampage(options),
}

export const create = repairRampage.create
export default repairRampage
