// /utils/arcade/games/stationSweep.ts
//
// Station Sweep -- the Kind Robots Arcade's Xenophobe riff (conductor
// kr-arcade/t-009 game factory, slice 1 of 4: one deck and one player;
// elevators between decks, split-screen co-op, and critter growth with a
// station-wide timer come in later slices). Mop, the station's cleaning robot,
// sweeps a deck overrun by glitch critters. Egg sacs on the floor hatch
// rollers and biters, sacs on the ceiling drop crawlers, and the deck is clean
// once every sac is popped (or spent) and every critter swept up.
//
// As in the classic, height matters: rollers bowl along the floor under a
// standing shot, so crouch (Down) to sweep low. Crawlers drop and cling,
// draining charge until Mop jumps (Up or B) to shake them. Left/right walk,
// A fires the sweeper beam.

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
const CEILING = 70
const FLOOR = 206
const DECK_W = 1600
const WALK = 1.4
const GRAVITY = 0.25
const JUMP_VY = -4.2
const SHOT_SPEED = 5
const SHOT_LIFE = 34
const FIRE_COOLDOWN = 9
const MAX_HEALTH = 100
const CLEAR_TICKS = 150
const DEATH_TICKS = 110
const START_LIVES = 3
const EXTRA_EVERY = 25_000

export const SWEEP_CURVES = {
  floorSacs: { start: 4, step: 1, limit: 12 },
  ceilingSacs: { start: 2, step: 1, limit: 7 },
  hatchEvery: { start: 420, step: -35, limit: 110 },
  critterSpeed: { start: 1, step: 0.12, limit: 2.1 },
  biterChance: { start: 0.25, step: 0.08, limit: 0.6 },
} as const

type Kind = 'roller' | 'crawler' | 'biter'
type Critter = {
  kind: Kind
  x: number
  y: number
  vx: number
  vy: number
  hp: number
  t: number
  /** Crawlers ride the ceiling until Mop walks under, then drop and cling. */
  onCeiling: boolean
  clinging: boolean
  /** Only a crawler dropping from the ceiling can latch on; shaken off, it stays down. */
  canCling: boolean
}
type Sac = {
  x: number
  ceiling: boolean
  hp: number
  timer: number
  hatches: number
  pulse: number
}
type Shot = { x: number; y: number; vx: number; life: number }
type Spit = { x: number; y: number; vx: number; life: number }
type Kit = { x: number; life: number }
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

const POINTS: Record<Kind, number> = { roller: 100, crawler: 150, biter: 300 }

class StationSweep implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private x = 60
  private y = FLOOR
  private vy = 0
  private onGround = true
  private crouch = false
  private facing: 1 | -1 = 1
  private health = MAX_HEALTH
  private fireCooldown = 0
  private hurt = 0
  private walkPhase = 0
  private camX = 0
  private sacs: Sac[] = []
  private critters: Critter[] = []
  private shots: Shot[] = []
  private spits: Spit[] = []
  private kits: Kit[] = []
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
    this.startDeck(1)
  }

  // --- deck ----------------------------------------------------------------------

  private startDeck(deck: number) {
    this.level = deck
    this.sacs = []
    const place = (count: number, ceiling: boolean) => {
      for (let i = 0; i < count; i++) {
        const x = 220 + ((DECK_W - 300) * (i + 0.3 + this.rng() * 0.4)) / count
        this.sacs.push({
          x,
          ceiling,
          hp: ceiling ? 999 : 3,
          timer: 120 + Math.floor(this.rng() * 240),
          hatches: ceiling ? 2 : 4,
          pulse: 0,
        })
      }
    }
    place(Math.round(levelCurve(deck, SWEEP_CURVES.floorSacs)), false)
    place(Math.round(levelCurve(deck, SWEEP_CURVES.ceilingSacs)), true)
    this.critters = []
    this.shots = []
    this.spits = []
    this.kits = []
    this.x = 60
    this.y = FLOOR
    this.vy = 0
    this.camX = 0
    // A short top-up between decks, not a full repair.
    this.health = Math.min(MAX_HEALTH, this.health + 25)
    this.banner = { text: `DECK ${deck}`, sub: 'SWEEP IT CLEAN', ticks: 100 }
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input

    if (this.clear > 0) {
      if (--this.clear === 0) this.startDeck(this.level + 1)
      return
    }
    if (this.dead > 0) {
      if (--this.dead === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'GAME OVER', ticks: 9999 }
        } else {
          this.health = MAX_HEALTH
          this.critters = this.critters.filter(
            (c) => Math.abs(c.x - this.x) > 120,
          )
          this.spits = []
        }
      }
      return
    }
    if (this.hurt > 0) this.hurt--
    if (this.fireCooldown > 0) this.fireCooldown--

    this.move(controls)
    if (controls.pressed.a || (controls.held.a && this.fireCooldown === 0))
      this.fire()
    this.updateShots()
    this.updateSacs()
    this.updateCritters()
    this.updateSpits()
    this.updateKits()
    if (this.health <= 0) this.down()
    this.checkClean()
    this.camX = Math.max(0, Math.min(DECK_W - W, this.x - W / 2))
  }

  private move(input: InputFrame) {
    this.crouch = this.onGround && input.held.down
    let vx = 0
    if (!this.crouch) {
      if (input.held.left) vx = -WALK
      if (input.held.right) vx = WALK
    }
    if (input.held.left) this.facing = -1
    if (input.held.right) this.facing = 1
    if (vx !== 0) this.walkPhase += 0.2
    this.x = Math.max(12, Math.min(DECK_W - 12, this.x + vx))
    if (this.onGround && (input.pressed.up || input.pressed.b)) {
      this.vy = JUMP_VY
      this.onGround = false
      // A jump shakes off any clinging crawler.
      for (const c of this.critters) {
        if (c.clinging) {
          c.clinging = false
          c.canCling = false
          c.vy = -2
          c.vx = -this.facing * 2
        }
      }
      this.sound.play('blip')
    }
    this.vy += GRAVITY
    this.y += this.vy
    if (this.y >= FLOOR) {
      this.y = FLOOR
      this.vy = 0
      this.onGround = true
    }
  }

  private fire() {
    this.fireCooldown = FIRE_COOLDOWN
    const y = this.crouch ? this.y - 5 : this.y - 15
    this.sound.play('shoot')
    // Point-blank: anything right at the nozzle is swept at once.
    const close = this.critters.find((c) => {
      if (c.onCeiling || c.clinging) return false
      const ahead = (c.x - this.x) * this.facing
      const top = c.y - this.critterHeight(c)
      return ahead > -6 && ahead < 12 && y >= top - 1 && y <= c.y + 1
    })
    if (close) {
      this.burst(close.x, y, 3, '#a5f3fc')
      if (--close.hp <= 0) this.sweep(close)
      return
    }
    this.shots.push({
      x: this.x + this.facing * 9,
      y,
      vx: this.facing * SHOT_SPEED,
      life: SHOT_LIFE,
    })
  }

  private updateShots() {
    for (const s of this.shots) {
      s.x += s.vx
      s.life--
      if (s.x < 0 || s.x > DECK_W) s.life = 0
      if (s.life <= 0) continue
      const critter = this.critters.find((c) => {
        if (c.onCeiling) return false
        const top = c.y - this.critterHeight(c)
        return Math.abs(c.x - s.x) < 7 && s.y >= top - 1 && s.y <= c.y + 1
      })
      if (critter) {
        s.life = 0
        this.burst(s.x, s.y, 3, '#a5f3fc')
        if (--critter.hp <= 0) this.sweep(critter)
        continue
      }
      const sac = this.sacs.find(
        (k) =>
          !k.ceiling && k.hp > 0 && Math.abs(k.x - s.x) < 8 && s.y > FLOOR - 18,
      )
      if (sac) {
        s.life = 0
        sac.hp--
        sac.pulse = 6
        this.sound.play('blip')
        if (sac.hp <= 0) this.popSac(sac)
      }
    }
    this.shots = this.shots.filter((s) => s.life > 0)
  }

  private critterHeight(c: Critter): number {
    return c.kind === 'roller' ? 8 : c.kind === 'crawler' ? 7 : 18
  }

  private sweep(c: Critter) {
    this.critters = this.critters.filter((o) => o !== c)
    this.addScore(POINTS[c.kind] * this.level, c.x, c.y - 20)
    this.burst(c.x, c.y - 6, 10, c.kind === 'biter' ? '#f472b6' : '#a3e635')
    this.sound.play('pop')
  }

  private popSac(sac: Sac) {
    sac.hatches = 0
    this.addScore(200 * this.level, sac.x, FLOOR - 26)
    this.burst(sac.x, FLOOR - 8, 14, '#a3e635')
    this.sound.play('boom')
    if (this.rng() < 0.25) this.kits.push({ x: sac.x, life: 60 * 10 })
  }

  private updateSacs() {
    const every = levelCurve(this.level, SWEEP_CURVES.hatchEvery)
    for (const sac of this.sacs) {
      if (sac.pulse > 0) sac.pulse--
      if (sac.hatches <= 0 || (!sac.ceiling && sac.hp <= 0)) continue
      // Only sacs near Mop hatch, so the far end doesn't fill up unseen.
      if (Math.abs(sac.x - this.x) > W) continue
      if (--sac.timer > 0) continue
      sac.timer = Math.round(every * (0.7 + this.rng() * 0.6))
      sac.hatches--
      this.hatch(sac)
    }
  }

  private hatch(sac: Sac) {
    const speed = levelCurve(this.level, SWEEP_CURVES.critterSpeed)
    if (sac.ceiling) {
      this.critters.push({
        kind: 'crawler',
        x: sac.x,
        y: CEILING + 8,
        vx: 0.4 * speed,
        vy: 0,
        hp: 1,
        t: 0,
        onCeiling: true,
        clinging: false,
        canCling: true,
      })
    } else {
      const biter =
        this.rng() < levelCurve(this.level, SWEEP_CURVES.biterChance)
      const dir = this.x < sac.x ? -1 : 1
      this.critters.push({
        kind: biter ? 'biter' : 'roller',
        x: sac.x + dir * 8,
        y: FLOOR,
        vx: dir * (biter ? 0.5 : 1.3) * speed,
        vy: 0,
        hp: biter ? 3 : 1,
        t: 0,
        onCeiling: false,
        clinging: false,
        canCling: false,
      })
    }
    this.burst(sac.x, sac.ceiling ? CEILING + 6 : FLOOR - 10, 5, '#d9f99d')
    this.sound.play('warn')
  }

  private updateCritters() {
    const speed = levelCurve(this.level, SWEEP_CURVES.critterSpeed)
    for (const c of this.critters) {
      c.t++
      if (c.kind === 'crawler') {
        if (c.clinging) {
          c.x = this.x
          c.y = this.y - 18
          if (c.t % 10 === 0) this.damage(1)
          continue
        }
        if (c.onCeiling) {
          c.x += Math.sign(this.x - c.x) * Math.abs(c.vx)
          // Drop when right above Mop.
          if (Math.abs(c.x - this.x) < 10) {
            c.onCeiling = false
            c.vy = 0
          }
          continue
        }
        c.vy += GRAVITY
        c.x += c.vx
        c.y += c.vy
        if (
          c.canCling &&
          c.y >= this.y - 18 &&
          Math.abs(c.x - this.x) < 9 &&
          this.y - 18 > CEILING
        ) {
          c.clinging = true
          this.sound.play('warn')
          continue
        }
        if (c.y >= FLOOR) {
          c.y = FLOOR
          c.vy = 0
          c.vx = Math.sign(this.x - c.x) * 0.7 * speed
        }
        // On the floor it nibbles at Mop's treads.
        if (c.y >= FLOOR && this.touching(c, 7) && c.t % 30 === 0)
          this.damage(3)
      } else if (c.kind === 'roller') {
        c.x += c.vx
        if (c.x < 8 || c.x > DECK_W - 8) c.vx = -c.vx
        // Rollers turn back toward Mop once they've rolled past.
        if (
          Math.abs(c.x - this.x) > 140 &&
          Math.sign(this.x - c.x) !== Math.sign(c.vx)
        )
          c.vx = -c.vx
        if (this.touching(c, 8)) {
          this.damage(8)
          c.vx = -c.vx * 1.5
          c.x += c.vx * 6
        }
      } else {
        // Biters stalk, then spit when lined up.
        const dist = this.x - c.x
        if (Math.abs(dist) > 50) c.x += Math.sign(dist) * 0.5 * speed
        if (c.t % 110 === 0 && Math.abs(dist) < 150) {
          this.spits.push({
            x: c.x,
            y: FLOOR - 14,
            vx: Math.sign(dist) * 2.2,
            life: 90,
          })
          this.sound.play('blip')
        }
        if (this.touching(c, 18) && c.t % 30 === 0) this.damage(12)
      }
    }
  }

  private touching(c: Critter, height: number): boolean {
    if (Math.abs(c.x - this.x) > 9) return false
    const myTop = this.y - (this.crouch ? 10 : 22)
    return c.y > myTop && c.y - height < this.y
  }

  private updateSpits() {
    for (const s of this.spits) {
      s.x += s.vx
      s.life--
      // A spit flies at waist height: crouch under it.
      if (
        s.life > 0 &&
        Math.abs(s.x - this.x) < 6 &&
        !this.crouch &&
        this.y > FLOOR - 4
      ) {
        s.life = 0
        this.damage(6)
      }
    }
    this.spits = this.spits.filter((s) => s.life > 0)
  }

  private updateKits() {
    for (const k of this.kits) {
      k.life--
      if (Math.abs(k.x - this.x) < 10 && this.y > FLOOR - 6) {
        k.life = 0
        this.health = Math.min(MAX_HEALTH, this.health + 30)
        this.floaters.push({
          x: k.x,
          y: FLOOR - 30,
          text: 'REPAIRED!',
          life: 45,
        })
        this.sound.play('pickup')
      }
    }
    this.kits = this.kits.filter((k) => k.life > 0)
  }

  private damage(amount: number) {
    if (this.dead > 0) return
    this.health -= amount
    this.hurt = 10
    if (amount > 2) this.sound.play('warn')
  }

  private down() {
    if (this.dead > 0) return
    this.lives--
    this.dead = DEATH_TICKS
    for (const c of this.critters) c.clinging = false
    this.critters = this.critters.filter(
      (c) => c.kind !== 'crawler' || c.onCeiling,
    )
    this.burst(this.x, this.y - 10, 18, '#fde68a')
    this.sound.play('die')
    if (this.lives > 0) this.banner = { text: 'MOP NEEDS A REBOOT', ticks: 90 }
  }

  private checkClean() {
    const sacsLeft = this.sacs.some(
      (s) => s.hatches > 0 && (s.ceiling || s.hp > 0),
    )
    if (sacsLeft || this.critters.length) return
    const bonus = 2000 * this.level + Math.max(0, this.health) * 10
    this.addScore(bonus, this.x, this.y - 40)
    this.clear = CLEAR_TICKS
    this.banner = {
      text: 'DECK CLEAN!',
      sub: `BONUS ${bonus}`,
      ticks: CLEAR_TICKS,
    }
    this.sound.play('level')
  }

  // --- scoring and effects ----------------------------------------------------

  private addScore(points: number, x: number, y: number) {
    if (this.demo) return
    this.score += points
    this.floaters.push({ x, y, text: String(points), life: 40 })
    if (this.score >= this.nextExtra) {
      this.lives++
      // Each spare takes longer to earn: 25k, 75k, 175k, 375k...
      this.nextExtra = this.nextExtra * 2 + EXTRA_EVERY
      this.banner = { text: 'SPARE MOP!', ticks: 90 }
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
        vy: Math.sin(a) * s - 0.4,
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
    // A clinging crawler: jump to shake it.
    if (this.critters.some((c) => c.clinging) && this.onGround) {
      frame.pressed.up = true
      return frame
    }
    // A spit coming in: crouch under it.
    if (
      this.spits.some(
        (s) =>
          Math.abs(s.x - this.x) < 40 &&
          Math.sign(this.x - s.x) === Math.sign(s.vx),
      )
    ) {
      held.down = true
      return frame
    }
    // Pick the nearest floor target: a critter first, then a live sac, then a kit if hurt.
    const targets: Array<{ x: number; low: boolean }> = [
      ...this.critters
        .filter((c) => !c.onCeiling && !c.clinging)
        .map((c) => ({ x: c.x, low: c.kind !== 'biter' })),
      ...this.sacs
        .filter((s) => !s.ceiling && s.hp > 0 && s.hatches > 0)
        .map((s) => ({ x: s.x, low: false })),
    ]
    if (this.health < 50 && this.kits.length)
      targets.unshift({ x: this.kits[0]!.x, low: false })
    // With nothing on the floor, walk under a ceiling sac to bring its crawlers down.
    if (!targets.length) {
      const sac = this.sacs.find((s) => s.ceiling && s.hatches > 0)
      if (sac) targets.push({ x: sac.x, low: false })
    }
    const target = targets.sort(
      (a, b) => Math.abs(a.x - this.x) - Math.abs(b.x - this.x),
    )[0]
    if (!target) return frame
    const dist = target.x - this.x
    const dir = dist > 0 ? 1 : -1
    // Too close to aim at: back off a step first.
    if (Math.abs(dist) < 6) {
      if (this.facing > 0) held.left = true
      else held.right = true
      return frame
    }
    if (Math.abs(dist) > 110 || dir !== this.facing) {
      if (dir > 0) held.right = true
      else held.left = true
      return frame
    }
    if (target.low) held.down = true
    held.a = true
    if (Math.abs(dist) > 50) {
      if (dir > 0) held.right = true
      else held.left = true
    }
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    g.fillStyle = '#05030d'
    g.fillRect(0, 0, W, H)
    g.save()
    g.translate(-Math.round(this.camX), 0)
    this.renderDeck(g)
    for (const sac of this.sacs) this.renderSac(g, sac)
    for (const k of this.kits) this.renderKit(g, k)
    for (const c of this.critters) this.renderCritter(g, c)
    for (const s of this.spits) {
      g.fillStyle = '#d946ef'
      g.fillRect(s.x - 2, s.y - 1, 4, 3)
    }
    for (const s of this.shots) {
      g.fillStyle = '#67e8f9'
      g.fillRect(s.x - 4, s.y - 1, 8, 2)
      g.fillStyle = '#ecfeff'
      g.fillRect(s.x - 1, s.y - 1, 3, 2)
    }
    if (this.dead === 0 && !this.over) this.renderMop(g)
    for (const p of this.particles) {
      g.globalAlpha = Math.max(0, p.life / 30)
      g.fillStyle = p.color
      g.fillRect(p.x - 1, p.y - 1, 2, 2)
    }
    g.globalAlpha = 1
    for (const f of this.floaters)
      drawText(g, f.text, f.x, f.y, { align: 'center', color: '#fde68a' })
    g.restore()
    this.renderHud(g)
  }

  private renderDeck(g: CanvasRenderingContext2D) {
    // Ceiling and floor plating, wall panels with portholes onto space.
    g.fillStyle = '#1e293b'
    g.fillRect(0, CEILING - 14, DECK_W, 14)
    g.fillRect(0, FLOOR, DECK_W, H - FLOOR)
    g.fillStyle = '#334155'
    g.fillRect(0, CEILING - 2, DECK_W, 2)
    g.fillRect(0, FLOOR, DECK_W, 3)
    g.fillStyle = '#111827'
    g.fillRect(0, CEILING, DECK_W, FLOOR - CEILING)
    for (let x = 0; x < DECK_W; x += 80) {
      g.fillStyle = '#1f2937'
      g.fillRect(x + 2, CEILING + 4, 76, FLOOR - CEILING - 8)
      g.fillStyle = '#0b1026'
      g.beginPath()
      g.arc(x + 40, CEILING + 46, 14, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#e0e7ff'
      g.fillRect(x + 34 + ((x / 80) % 3) * 4, CEILING + 40, 1, 1)
      g.fillRect(x + 44, CEILING + 50 - ((x / 80) % 2) * 5, 1, 1)
      g.strokeStyle = '#475569'
      g.lineWidth = 2
      g.beginPath()
      g.arc(x + 40, CEILING + 46, 14, 0, Math.PI * 2)
      g.stroke()
      // Pipes and a blinking console light.
      g.fillStyle = '#374151'
      g.fillRect(x, CEILING + 92, 80, 3)
      g.fillStyle =
        (x / 80 + Math.floor(this.tick / 30)) % 3 === 0 ? '#22c55e' : '#14532d'
      g.fillRect(x + 64, CEILING + 80, 4, 3)
    }
    // Floor grating.
    g.fillStyle = '#0f172a'
    for (let x = 0; x < DECK_W; x += 10) g.fillRect(x, FLOOR + 6, 6, 2)
  }

  private renderSac(g: CanvasRenderingContext2D, sac: Sac) {
    const spent = sac.hatches <= 0 || (!sac.ceiling && sac.hp <= 0)
    const wobble = Math.sin(this.tick / 12 + sac.x) * 1
    const y = sac.ceiling ? CEILING + 6 : FLOOR - 8
    if (spent) {
      g.fillStyle = '#3f6212'
      g.fillRect(sac.x - 6, sac.ceiling ? CEILING : FLOOR - 3, 12, 3)
      return
    }
    g.fillStyle = sac.pulse > 0 ? '#ffffff' : '#65a30d'
    g.beginPath()
    g.ellipse(sac.x, y, 7 + wobble, 9 - wobble, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#a3e635'
    g.beginPath()
    g.ellipse(sac.x - 2, y - 2, 2.5, 3.5, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#365314'
    g.fillRect(sac.x - 1, y + 1, 2, 2)
  }

  private renderKit(g: CanvasRenderingContext2D, k: Kit) {
    if (k.life < 90 && Math.floor(this.tick / 5) % 2) return
    g.fillStyle = '#f8fafc'
    g.fillRect(k.x - 5, FLOOR - 9, 10, 8)
    g.fillStyle = '#22c55e'
    g.fillRect(k.x - 1, FLOOR - 8, 2, 6)
    g.fillRect(k.x - 3, FLOOR - 6, 6, 2)
  }

  private renderCritter(g: CanvasRenderingContext2D, c: Critter) {
    const x = c.x
    const y = c.y
    if (c.kind === 'roller') {
      const spin = Math.floor(c.t / 4) % 2
      g.fillStyle = '#84cc16'
      g.beginPath()
      g.arc(x, y - 4, 4, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#ecfccb'
      g.fillRect(x - 2 + spin * 2, y - 6, 2, 2)
      return
    }
    if (c.kind === 'crawler') {
      // A wriggly glitch grub; upside down while it rides the ceiling.
      const flip = c.onCeiling ? -1 : 1
      g.fillStyle = '#c084fc'
      for (let i = 0; i < 4; i++) {
        const wig = Math.sin(c.t / 5 + i) * 1
        g.fillRect(x - 6 + i * 3, y - 4 * flip + wig - (flip > 0 ? 0 : 4), 3, 4)
      }
      g.fillStyle = '#f5f3ff'
      g.fillRect(x + 4, y - 4 * flip - (flip > 0 ? 0 : 4), 2, 2)
      return
    }
    // Biter: a hunched glitch beast with a big jaw.
    const bob = Math.floor(c.t / 10) % 2
    g.fillStyle = '#db2777'
    g.fillRect(x - 7, y - 16 + bob, 14, 14)
    g.fillStyle = '#9d174d'
    g.fillRect(x - 6, y - 4, 3, 4)
    g.fillRect(x + 3, y - 4, 3, 4)
    const face = Math.sign(this.x - x) || 1
    g.fillStyle = '#fef3c7'
    g.fillRect(x + face * 3 - 1, y - 13 + bob, 3, 3)
    g.fillStyle = '#ffffff'
    for (let i = 0; i < 3; i++)
      g.fillRect(x + face * 2 + i * 2 * face - 1, y - 7 + bob, 1, 2)
  }

  private renderMop(g: CanvasRenderingContext2D) {
    const x = Math.round(this.x)
    const y = Math.round(this.y)
    const f = this.facing
    const tall = this.crouch ? 10 : 20
    const flash = this.hurt > 0 && Math.floor(this.tick / 2) % 2
    // Treads, a round body, a dome head with one big eye, and the sweeper nozzle.
    g.fillStyle = '#1f2937'
    g.fillRect(x - 7, y - 4, 14, 4)
    g.fillStyle = '#374151'
    for (let i = 0; i < 4; i++)
      g.fillRect(x - 6 + i * 4 + (Math.floor(this.walkPhase) % 2), y - 3, 2, 2)
    g.fillStyle = flash ? '#ffffff' : '#0ea5e9'
    g.fillRect(x - 6, y - tall, 12, tall - 4)
    g.fillStyle = flash ? '#ffffff' : '#7dd3fc'
    g.beginPath()
    g.arc(x, y - tall, 6, Math.PI, 0)
    g.fill()
    g.fillStyle = '#0f172a'
    g.fillRect(x + f * 2 - 2, y - tall - 3, 4, 3)
    g.fillStyle = '#fde047'
    g.fillRect(x + f * 2 - 1, y - tall - 2, 2, 1)
    const gunY = this.crouch ? y - 5 : y - 15
    g.fillStyle = '#e5e7eb'
    g.fillRect(f > 0 ? x + 5 : x - 10, gunY - 1, 5, 3)
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#0b1026'
    g.fillStyle = '#0b1026'
    g.fillRect(0, 0, W, 50)
    drawText(g, String(this.score).padStart(7, '0'), 6, 6, {
      scale: 2,
      color: '#67e8f9',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 6, 4, {
      align: 'right',
      color: '#f9a8d4',
    })
    drawText(g, `DECK ${this.level}`, W - 6, 13, {
      align: 'right',
      color: '#bef264',
    })
    drawText(g, 'CHARGE', 6, 26, { color: '#bbf7d0' })
    g.fillStyle = '#1f2937'
    g.fillRect(48, 27, 90, 5)
    const frac = Math.max(0, this.health) / MAX_HEALTH
    g.fillStyle = frac > 0.5 ? '#4ade80' : frac > 0.25 ? '#facc15' : '#ef4444'
    g.fillRect(48, 27, 90 * frac, 5)
    for (let i = 0; i < Math.min(this.lives - 1, 5); i++) {
      g.fillStyle = '#0ea5e9'
      g.fillRect(150 + i * 10, 26, 7, 7)
    }
    // Deck map: sacs left (green), critters (pink), Mop (cyan).
    const mapX = 6
    const mapW = W - 12
    g.fillStyle = '#1e293b'
    g.fillRect(mapX, 40, mapW, 4)
    for (const s of this.sacs) {
      if (s.hatches <= 0 || (!s.ceiling && s.hp <= 0)) continue
      g.fillStyle = '#84cc16'
      g.fillRect(mapX + (s.x / DECK_W) * mapW - 1, s.ceiling ? 40 : 42, 2, 2)
    }
    for (const c of this.critters) {
      g.fillStyle = '#f472b6'
      g.fillRect(mapX + (c.x / DECK_W) * mapW, 41, 1, 2)
    }
    g.fillStyle = '#67e8f9'
    g.fillRect(mapX + (this.x / DECK_W) * mapW - 1, 39, 3, 6)
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 110, {
        scale: 2,
        align: 'center',
        color: '#ffffff',
        shadow: '#7c3aed',
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, 130, {
          align: 'center',
          color: '#fde68a',
          shadow,
        })
    }
  }
}

const stationSweep: ArcadeGameModule = {
  create: (options) => new StationSweep(options),
}

export const create = stationSweep.create
export default stationSweep
