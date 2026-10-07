// /utils/arcade/games/cocoaCounter.ts
//
// Cocoa Counter -- the Kind Robots Arcade's Tapper riff (conductor
// kr-arcade/t-009 game factory, batch 4). Thirsty robots shuffle up four long
// counters toward the cocoa urns. Pour a mug at an urn and it slides down that
// counter; the first shuffling robot it reaches catches it and is nudged back
// toward the door (out of the door, it leaves happy). A robot that is still
// thirsty drinks up, slides the empty mug back, and shuffles on.
//
// Three things cost a mug-bot (a life): a robot reaching the urns, a full mug
// sliding off the far end with nobody to catch it, and an empty mug sliding off
// the urn end because nobody was there to catch it. Some robots leave a tip on
// the counter; walk down the counter to pick it up. Serve every robot in the
// round to clear it; COCOA_CURVES ramp the crowd, its pace and its thirst.
//
// Up/down hop between counters (always to the urn end), left/right walk along
// one, A pours.

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
const HUD_H = 26
const ROWS = 4
const ROW_GAP = 52
const FIRST_COUNTER = HUD_H + 40
const DOOR_X = 18
const TAP_X = 284
const WALK_SPEED = 1.6
const MUG_SPEED = 2.4
const PUSH_SPEED = 2.2
const LEAVE_SPEED = 1.1
const POUR_TICKS = 10
const DRINK_TICKS = 70
const CATCH_RANGE = 7
const REACH_X = TAP_X - 14
const TIP_CHANCE = 0.22
const TIP_LIFE = 360
const START_LIVES = 3
/** Spills the mop-bot cleans up for free, per life. */
const MOPS = 2
const LOSE_TICKS = 110
const CLEAR_TICKS = 130

const SERVE_POINTS = 50
const DOOR_POINTS = 100
const EMPTY_POINTS = 100
const TIP_POINTS = 250
const ROUND_BONUS = 500

export const COCOA_CURVES = {
  /** Robots to serve in the round. */
  robots: { start: 6, step: 2, limit: 26 },
  /** How fast a robot shuffles while it is stepping. */
  walk: { start: 0.42, step: 0.05, limit: 0.95 },
  /** Ticks between robots walking in. */
  gap: { start: 150, step: -12, limit: 48 },
  /** How far a caught mug nudges a robot back. */
  push: { start: 84, step: -5, limit: 44 },
  /** Empty-mug slide speed. */
  empty: { start: 0.8, step: 0.08, limit: 1.5 },
  /** Chance a robot is still thirsty after a mug (it comes back for more). */
  thirst: { start: 0.25, step: 0.08, limit: 0.7 },
} as const

type RobotState = 'walk' | 'pushed' | 'drink' | 'leave'
type Robot = {
  row: number
  x: number
  state: RobotState
  timer: number
  phase: number
  color: string
  thirsty: boolean
}
type Mug = { row: number; x: number; full: boolean }
type Tip = { row: number; x: number; life: number }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

const ROBOT_COLORS = ['#38bdf8', '#f472b6', '#a3e635', '#facc15', '#c084fc']

const rowY = (row: number) => FIRST_COUNTER + row * ROW_GAP

class CocoaCounter implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private row = 0
  private x = TAP_X
  private pour = 0
  private prevUp = false
  private prevDown = false
  private robots: Robot[] = []
  private mugs: Mug[] = []
  private tips: Tip[] = []
  private mops = MOPS
  /** The first robot after a start or a lost mug heads for your counter. */
  private greet = true
  private toSpawn = 0
  private spawnTimer = 40
  private lose = 0
  private clear = 0
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

  private startRound(round: number) {
    this.level = round
    this.toSpawn = Math.round(levelCurve(round, COCOA_CURVES.robots))
    this.spawnTimer = 30
    this.greet = true
    this.robots = []
    this.mugs = []
    this.tips = []
    this.row = 0
    this.x = TAP_X
    this.banner = {
      text: `ROUND ${round}`,
      sub: `${this.toSpawn} THIRSTY ROBOTS`,
      ticks: 100,
    }
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input
    if (this.lose > 0) {
      if (--this.lose === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'OUT OF MUGS', sub: 'GAME OVER', ticks: 9999 }
        } else this.resetCounters()
      }
      return
    }
    if (this.clear > 0) {
      if (--this.clear === 0) this.startRound(this.level + 1)
      return
    }
    this.move(controls)
    this.spawn()
    this.updateRobots()
    this.updateMugs()
    this.updateTips()
    if (
      this.lose === 0 &&
      this.toSpawn === 0 &&
      this.robots.length === 0 &&
      !this.mugs.some((m) => m.full)
    )
      this.roundClear()
  }

  private move(input: InputFrame) {
    // Hops come from fresh presses of up/down (held edges, so any pad works).
    const up = input.held.up && !this.prevUp
    const down = input.held.down && !this.prevDown
    this.prevUp = input.held.up
    this.prevDown = input.held.down
    if (this.pour > 0) {
      if (--this.pour === 0) {
        this.mugs.push({ row: this.row, x: TAP_X - 8, full: true })
        this.sound.play('shoot')
      }
      return
    }
    if (up || down) {
      this.row = (this.row + (up ? ROWS - 1 : 1)) % ROWS
      this.x = TAP_X
      this.sound.play('blip')
      return
    }
    if (input.held.left) this.x = Math.max(DOOR_X + 14, this.x - WALK_SPEED)
    if (input.held.right) this.x = Math.min(TAP_X, this.x + WALK_SPEED)
    if (input.pressed.a) {
      if (this.x >= TAP_X - 1) this.pour = POUR_TICKS
      else {
        // Away from the urn, A runs straight back to it.
        this.x = TAP_X
      }
    }
  }

  private spawn() {
    if (this.toSpawn <= 0 || --this.spawnTimer > 0) return
    // Pick a counter whose doorway is clear.
    const open = [0, 1, 2, 3].filter(
      (r) => !this.robots.some((b) => b.row === r && b.x < DOOR_X + 26),
    )
    if (open.length === 0) {
      this.spawnTimer = 10
      return
    }
    const row =
      this.greet && open.includes(this.row)
        ? this.row
        : open[Math.floor(this.rng() * open.length)]!
    this.greet = false
    this.robots.push({
      row,
      x: DOOR_X - 2,
      state: 'walk',
      timer: 0,
      phase: Math.floor(this.rng() * 60),
      color: ROBOT_COLORS[Math.floor(this.rng() * ROBOT_COLORS.length)]!,
      thirsty: false,
    })
    this.toSpawn--
    const gap = levelCurve(this.level, COCOA_CURVES.gap)
    this.spawnTimer = Math.round(gap * (0.7 + this.rng() * 0.6))
  }

  private updateRobots() {
    const walk = levelCurve(this.level, COCOA_CURVES.walk)
    for (const robot of this.robots) {
      if (robot.state === 'walk') {
        // Shuffle: step for two thirds of every second, pause for the rest.
        if ((this.tick + robot.phase) % 60 < 40) robot.x += walk
        if (robot.x >= REACH_X) {
          this.loseMug('A ROBOT REACHED THE URN', robot.x, rowY(robot.row))
          return
        }
      } else if (robot.state === 'pushed') {
        robot.x -= PUSH_SPEED
        robot.timer -= PUSH_SPEED
        if (robot.x < DOOR_X) {
          robot.timer = -1
          this.addScore(DOOR_POINTS, DOOR_X + 12, rowY(robot.row) - 26)
          this.burst(DOOR_X + 4, rowY(robot.row) - 10, 8, robot.color)
          this.sound.play('pickup')
        } else if (robot.timer <= 0) {
          robot.state = 'drink'
          robot.timer = DRINK_TICKS
        }
      } else if (robot.state === 'leave') {
        robot.x -= LEAVE_SPEED
      } else if (--robot.timer <= 0) {
        // Done drinking: the empty slides back. A robot that is still thirsty
        // shuffles on; a cosy one strolls home.
        this.mugs.push({ row: robot.row, x: robot.x + 6, full: false })
        robot.state = robot.thirsty ? 'walk' : 'leave'
      }
    }
    this.robots = this.robots.filter(
      (r) => !((r.state === 'pushed' || r.state === 'leave') && r.x < DOOR_X),
    )
  }

  private updateMugs() {
    const empty = levelCurve(this.level, COCOA_CURVES.empty)
    const thirst = levelCurve(this.level, COCOA_CURVES.thirst)
    for (const mug of this.mugs) {
      if (mug.full) {
        mug.x -= MUG_SPEED
        const robot = this.robots.find(
          (r) =>
            r.row === mug.row &&
            r.state === 'walk' &&
            Math.abs(r.x - mug.x) <= CATCH_RANGE,
        )
        if (robot) {
          mug.x = -999
          robot.state = 'pushed'
          robot.timer = levelCurve(this.level, COCOA_CURVES.push)
          robot.thirsty = this.rng() < thirst
          this.addScore(SERVE_POINTS, robot.x, rowY(robot.row) - 28)
          this.sound.play('pop')
          if (this.rng() < TIP_CHANCE)
            this.tips.push({ row: robot.row, x: robot.x, life: TIP_LIFE })
        } else if (mug.x < DOOR_X - 4) {
          if (this.mops > 0) {
            this.mopUp(mug)
            continue
          }
          this.loseMug('A MUG SLID OFF THE END', DOOR_X, rowY(mug.row))
          return
        }
      } else {
        mug.x += empty
        if (mug.row === this.row && Math.abs(mug.x - this.x) <= CATCH_RANGE) {
          mug.x = -999
          this.addScore(EMPTY_POINTS, this.x, rowY(this.row) + 4)
          this.sound.play('blip')
        } else if (mug.x >= TAP_X + 10) {
          this.loseMug('AN EMPTY MUG FELL', TAP_X + 10, rowY(mug.row))
          return
        }
      }
    }
    this.mugs = this.mugs.filter((m) => m.x > -999)
  }

  private updateTips() {
    for (const tip of this.tips) {
      tip.life--
      if (tip.row === this.row && Math.abs(tip.x - this.x) <= CATCH_RANGE) {
        tip.life = 0
        this.addScore(TIP_POINTS, tip.x, rowY(tip.row) - 14)
        this.burst(tip.x, rowY(tip.row) - 2, 8, '#fde047')
        this.sound.play('extra')
      }
    }
    this.tips = this.tips.filter((t) => t.life > 0)
  }

  /** A free spill: the mop-bot by the door cleans it up. */
  private mopUp(mug: Mug) {
    this.mops--
    mug.x = -999
    this.burst(DOOR_X, rowY(mug.row) - 4, 10, '#7c2d12')
    this.sound.play('warn')
    this.banner = {
      text: 'SPLASH!',
      sub: this.mops > 0 ? 'THE MOP-BOT CAN MOP 1 MORE' : 'NO MORE MOPS!',
      ticks: 60,
    }
  }

  private roundClear() {
    const bonus = ROUND_BONUS * this.level
    this.addScore(bonus, W / 2, 110)
    this.clear = CLEAR_TICKS
    this.mugs = []
    this.sound.play('level')
    this.banner = {
      text: 'ROUND CLEAR!',
      sub: `EVERYONE IS COSY  +${bonus}`,
      ticks: CLEAR_TICKS,
    }
  }

  private loseMug(why: string, x: number, y: number) {
    if (this.lose > 0) return
    this.lives--
    this.lose = LOSE_TICKS
    this.burst(x, y - 6, 18, '#92400e')
    this.burst(x, y - 6, 8, '#fef3c7')
    this.sound.play('die')
    this.banner = {
      text: 'OOPS!',
      sub: this.lives > 0 ? `${why}  ${this.lives} LEFT` : why,
      ticks: LOSE_TICKS,
    }
  }

  /** After a lost mug, everyone still waiting walks back in from the door. */
  private resetCounters() {
    this.toSpawn += this.robots.length
    this.robots = []
    this.mugs = []
    this.tips = []
    this.row = 0
    this.x = TAP_X
    this.pour = 0
    this.mops = MOPS
    this.greet = true
    this.spawnTimer = 30
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo || points <= 0) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 50 })
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
        life: 22 + Math.floor(this.rng() * 16),
        color,
      })
    }
  }

  private updateEffects() {
    for (const p of this.particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.04
      p.life--
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.3
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  // --- attract-mode pilot -----------------------------------------------------

  /**
   * Catches the empty mug that will land soonest, otherwise pours for the
   * counter whose robot is closest to the urn and still has no mug coming.
   */
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
    if (this.pour > 0) return frame
    const empty = levelCurve(this.level, COCOA_CURVES.empty)
    let target = -1
    let soonest = Infinity
    for (const mug of this.mugs) {
      if (mug.full) continue
      const eta = (TAP_X - mug.x) / empty
      const hop = this.hopsTo(mug.row) * 2 + 8
      if (eta < hop + 12 && eta < soonest) {
        soonest = eta
        target = mug.row
      }
    }
    if (target < 0) {
      let urgent = -Infinity
      for (let r = 0; r < ROWS; r++) {
        const walking = this.robots.filter(
          (b) => b.row === r && b.state === 'walk',
        )
        const coming = this.mugs.filter((m) => m.row === r && m.full).length
        if (walking.length <= coming) continue
        const lead = Math.max(...walking.map((b) => b.x))
        if (lead > urgent) {
          urgent = lead
          target = r
        }
      }
    }
    if (target < 0) {
      // Nothing to do: pick up a tip on this counter if one is handy.
      const tip = this.tips.find((t) => t.row === this.row)
      if (tip && !this.mugs.some((m) => !m.full)) {
        held.left = tip.x < this.x
        held.right = tip.x > this.x
      } else held.right = true
      return frame
    }
    if (target !== this.row) {
      // Hop on alternate ticks so each one is a fresh press.
      if (!this.prevUp && !this.prevDown) {
        const downHops = (target - this.row + ROWS) % ROWS
        if (downHops <= ROWS / 2) held.down = true
        else held.up = true
      }
      return frame
    }
    if (this.x < TAP_X - 1) {
      held.right = true
      return frame
    }
    const waitingEmpty = this.mugs.some(
      (m) => !m.full && m.row === this.row && TAP_X - m.x < 40,
    )
    if (!waitingEmpty) {
      const walking = this.robots.filter(
        (b) => b.row === this.row && b.state === 'walk',
      ).length
      const coming = this.mugs.filter(
        (m) => m.row === this.row && m.full,
      ).length
      if (walking > coming) {
        held.a = true
        frame.pressed.a = true
      }
    }
    return frame
  }

  private hopsTo(row: number): number {
    const d = Math.abs(row - this.row)
    return Math.min(d, ROWS - d)
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    // A warm cafe: striped wallpaper, a floor, and four long counters.
    g.fillStyle = '#3b1d0f'
    g.fillRect(0, 0, W, H)
    for (let x = 0; x < W; x += 16) {
      g.fillStyle = x % 32 ? '#4a2614' : '#552d18'
      g.fillRect(x, HUD_H, 16, H - HUD_H)
    }
    for (let r = 0; r < ROWS; r++) this.renderCounter(g, r)
    for (const robot of this.robots) this.renderRobot(g, robot)
    for (const tip of this.tips) {
      if (tip.life < 90 && Math.floor(tip.life / 6) % 2) continue
      g.fillStyle = '#fde047'
      g.beginPath()
      g.arc(tip.x, rowY(tip.row) - 3, 3, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#a16207'
      g.fillRect(tip.x - 1, rowY(tip.row) - 4, 2, 2)
    }
    for (const mug of this.mugs)
      this.renderMug(g, mug.x, rowY(mug.row), mug.full)
    if (this.lose === 0 || Math.floor(this.lose / 6) % 2)
      this.renderBartender(g)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 30)
      g.fillStyle = p.color
      g.fillRect(p.x - 1, p.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: '#fef3c7',
        shadow: '#431407',
      })
    this.renderHud(g)
  }

  private renderCounter(g: CanvasRenderingContext2D, row: number) {
    const y = rowY(row)
    // The doorway the robots walk in from.
    g.fillStyle = '#1c0d05'
    g.fillRect(0, y - 26, DOOR_X - 4, 26)
    g.fillStyle = '#fbbf24'
    g.fillRect(DOOR_X - 5, y - 26, 2, 26)
    // The counter top and its front panel.
    g.fillStyle = '#b45309'
    g.fillRect(DOOR_X - 4, y, TAP_X - DOOR_X + 18, 3)
    g.fillStyle = '#78350f'
    g.fillRect(DOOR_X - 4, y + 3, TAP_X - DOOR_X + 18, 6)
    g.fillStyle = '#92400e'
    for (let x = DOOR_X; x < TAP_X + 10; x += 12) g.fillRect(x, y + 4, 1, 4)
    // The cocoa urn on the right wall.
    const urnX = TAP_X + 18
    g.fillStyle = '#d6d3d1'
    g.fillRect(urnX, y - 22, 12, 20)
    g.fillStyle = '#a8a29e'
    g.fillRect(urnX - 1, y - 24, 14, 3)
    g.fillStyle = '#92400e'
    g.fillRect(urnX + 3, y - 16, 6, 6)
    g.fillStyle = '#78716c'
    g.fillRect(urnX - 4, y - 8, 5, 2)
    // Steam.
    if (Math.floor((this.tick + row * 13) / 10) % 3 !== 0) {
      g.fillStyle = 'rgba(255, 255, 255, 0.35)'
      const s = (this.tick / 8 + row) % 6
      g.fillRect(urnX + 4, y - 30 - s, 2, 3)
      g.fillRect(urnX + 7, y - 33 - ((s + 3) % 6), 2, 3)
    }
  }

  private renderRobot(g: CanvasRenderingContext2D, robot: Robot) {
    const y = rowY(robot.row)
    const bob =
      robot.state === 'walk' && (this.tick + robot.phase) % 60 < 40
        ? Math.floor((this.tick + robot.phase) / 8) % 2
        : 0
    const x = Math.round(robot.x)
    g.fillStyle = robot.color
    g.fillRect(x - 6, y - 18 - bob, 12, 12)
    g.fillStyle = '#e2e8f0'
    g.fillRect(x - 5, y - 6, 10, 6)
    g.fillStyle = '#1e293b'
    g.fillRect(x - 4, y - 15 - bob, 3, 3)
    g.fillRect(x + 1, y - 15 - bob, 3, 3)
    // Antenna.
    g.fillStyle = '#94a3b8'
    g.fillRect(x, y - 23 - bob, 1, 5)
    g.fillStyle = robot.state === 'pushed' ? '#fde047' : '#f87171'
    g.fillRect(x - 1, y - 25 - bob, 3, 2)
    if (robot.state === 'drink') {
      // Mug up, eyes happy.
      this.renderMug(g, x + 5, y - 10, robot.timer > DRINK_TICKS / 3)
      g.fillStyle = robot.color
      g.fillRect(x - 4, y - 15, 3, 1)
      g.fillRect(x + 1, y - 15, 3, 1)
    } else if (robot.state === 'pushed') {
      this.renderMug(g, x + 5, y - 4, true)
    } else if (robot.state === 'leave') {
      g.fillStyle = robot.color
      g.fillRect(x - 4, y - 15, 3, 1)
      g.fillRect(x + 1, y - 15, 3, 1)
    } else {
      // A little thirsty grumble mark.
      if (robot.x > REACH_X - 60 && Math.floor(this.tick / 10) % 2)
        drawText(g, '!', x + 8, y - 26, { color: '#fca5a5' })
    }
  }

  private renderMug(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    full: boolean,
  ) {
    const mx = Math.round(x) - 3
    const my = Math.round(y) - 7
    g.fillStyle = '#f5f5f4'
    g.fillRect(mx, my, 6, 7)
    g.fillRect(mx + 6, my + 2, 2, 3)
    g.fillStyle = full ? '#7c2d12' : '#d6d3d1'
    g.fillRect(mx + 1, my + 1, 4, full ? 2 : 1)
    if (full) {
      g.fillStyle = '#fef3c7'
      g.fillRect(mx + 1, my, 4, 1)
    }
  }

  private renderBartender(g: CanvasRenderingContext2D) {
    const y = rowY(this.row) - 20
    const x = Math.round(this.x)
    // The mug-bot works its counter from the urn end.
    g.fillStyle = '#e2e8f0'
    g.fillRect(x - 6, y, 12, 12)
    g.fillStyle = '#f97316'
    g.fillRect(x - 5, y + 6, 10, 8)
    g.fillStyle = '#0f172a'
    g.fillRect(x - 4, y + 3, 2, 2)
    g.fillRect(x + 2, y + 3, 2, 2)
    g.fillStyle = '#64748b'
    g.fillRect(x - 5, y + 14, 3, 3)
    g.fillRect(x + 2, y + 14, 3, 3)
    if (this.pour > 0) {
      g.fillStyle = '#7c2d12'
      g.fillRect(TAP_X + 15, rowY(this.row) - 6, 2, 4)
      this.renderMug(g, TAP_X + 10, rowY(this.row), this.pour < POUR_TICKS / 2)
    }
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#431407'
    g.fillStyle = 'rgba(28, 13, 5, 0.9)'
    g.fillRect(0, 0, W, HUD_H)
    drawText(g, String(this.score).padStart(6, '0'), 4, 3, {
      scale: 2,
      color: '#fde047',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 4, 2, {
      align: 'right',
      color: '#f9a8d4',
    })
    drawText(g, `ROUND ${this.level}`, W - 4, 10, {
      align: 'right',
      color: '#fdba74',
    })
    const waiting = this.toSpawn + this.robots.length
    drawText(g, `THIRSTY ${waiting}`, 96, 3, { color: '#fef3c7' })
    drawText(g, `MOPS ${this.mops}`, 96, 13, {
      color: this.mops > 0 ? '#a5f3fc' : '#fca5a5',
    })
    // Spare mug-bots.
    for (let i = 0; i < Math.min(this.lives - 1, 4); i++)
      this.renderMug(g, 156 + i * 10, 21, true)
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 96, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        shadow: '#431407',
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, 116, {
          align: 'center',
          color: '#fef3c7',
          shadow: '#431407',
        })
    }
  }
}

const cocoaCounter: ArcadeGameModule = {
  create: (options) => new CocoaCounter(options),
}

export const create = cocoaCounter.create
export default cocoaCounter
