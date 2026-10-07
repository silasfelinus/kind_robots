// /utils/arcade/games/zuzuGhostTrail.ts
//
// Zuzu: Ghost Trail -- the Kind Robots Arcade's Ghosts 'n Goblins riff
// (conductor kr-arcade/t-009 game factory, slice 1 of 4: one stage and the
// poncho rule; throwables and pickups, bosses, and stage progression come in
// later slices). Zuzu, the koala ronin, walks a haunted weird-west trail
// through a ghost town at dusk, throwing kunai at restless spirits that claw
// up out of the dirt, storm crows and bone hyenas.
//
// The poncho rule, as in the classic: the first hit knocks Zuzu's poncho and
// kasa off, leaving him in his tunic; a second hit sends him back to the last
// checkpoint. Crates along the trail hide a fresh poncho. Jumps are committed
// once he leaves the ground. Left/right walk, Up or B jumps, A throws kunai.
//
// Zuzu's canon (CAST-PICKS.md, VIDEO-GUARDRAILS.md): short and stocky,
// rust-brown poncho with orange zigzag trim, a wide straw kasa that shades his
// eyes, the katana across his back with the hilt over his right shoulder, and
// never a smile.

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
const GROUND_Y = 208
const STAGE_END = 3520
const CHECKPOINT_X = 1800
const GRAVITY = 0.3
const JUMP_VY = -5.4
const WALK = 1.3
const JUMP_VX = 2
const KUNAI_SPEED = 4.5
const MAX_KUNAI = 3
const THROW_COOLDOWN = 14
const INVULN_TICKS = 100
const DEATH_TICKS = 110
const CLEAR_TICKS = 160
const STAGE_TICKS = 60 * 150
const START_LIVES = 3
const EXTRA_EVERY = 20_000

/** Solid ground runs, with pits between them. */
const GROUND: Array<[number, number]> = [
  [0, 620],
  [664, 1160],
  [1204, 1720],
  [1764, 2420],
  [2466, 2920],
  [2964, 3700],
]
/** Raised boardwalks you can land on from above (and jump up through). */
const BOARDWALKS: Array<{ x: number; y: number; w: number }> = [
  { x: 300, y: 164, w: 96 },
  { x: 900, y: 156, w: 80 },
  { x: 1380, y: 148, w: 112 },
  { x: 2000, y: 160, w: 120 },
  { x: 2590, y: 152, w: 96 },
  { x: 3120, y: 156, w: 104 },
]
/** Tombstones: solid, jump over them. */
const TOMBSTONES = [452, 1010, 1600, 2210, 2760, 3270]
/** Crates: kunai break them open. */
const CRATES: Array<{ x: number; holds: 'poncho' | 'nugget' }> = [
  { x: 820, holds: 'nugget' },
  { x: 1930, holds: 'poncho' },
  { x: 2700, holds: 'poncho' },
  { x: 3340, holds: 'nugget' },
]

export const TRAIL_CURVES = {
  spiritEvery: { start: 150, step: -15, limit: 60 },
  crowEvery: { start: 420, step: -40, limit: 160 },
  hyenaEvery: { start: 520, step: -50, limit: 200 },
  enemySpeed: { start: 1, step: 0.12, limit: 1.7 },
} as const

type Kind = 'spirit' | 'crow' | 'hyena'
type Foe = {
  kind: Kind
  x: number
  y: number
  vx: number
  vy: number
  hp: number
  t: number
  /** Spirits rise out of the dirt, walk, then sink back. */
  phase: 'rise' | 'walk' | 'sink'
  baseY: number
}
type Kunai = { x: number; y: number; vx: number; life: number }
type Crate = { x: number; holds: 'poncho' | 'nugget'; open: boolean }
type Pickup = {
  x: number
  y: number
  vy: number
  kind: 'poncho' | 'nugget'
  life: number
}
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }
type Flying = {
  x: number
  y: number
  vx: number
  vy: number
  spin: number
  life: number
}

function groundAt(x: number): boolean {
  return GROUND.some(([a, b]) => x >= a && x <= b)
}

class ZuzuGhostTrail implements ArcadeGameInstance {
  score = 0
  level = 1
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private x = 40
  private y = GROUND_Y
  private vx = 0
  private vy = 0
  private onGround = true
  private facing: 1 | -1 = 1
  private poncho = true
  private invuln = 0
  private throwCooldown = 0
  private throwPose = 0
  private walkPhase = 0
  private checkpoint = 40
  private dead = 0
  private clear = 0
  private timer = STAGE_TICKS
  private camX = 0
  private foes: Foe[] = []
  private kunai: Kunai[] = []
  private crates: Crate[] = []
  private pickups: Pickup[] = []
  private flying: Flying[] = []
  private spiritTimer = 120
  private crowTimer = 300
  private hyenaTimer = 400
  private nextExtra = EXTRA_EVERY
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private banner: { text: string; sub?: string; ticks: number } | null = null

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startStage(1)
  }

  // --- stage ---------------------------------------------------------------------

  private startStage(lap: number) {
    this.level = lap
    this.checkpoint = 40
    this.crates = CRATES.map((c) => ({ ...c, open: false }))
    this.respawn()
    this.banner = {
      text: 'GHOST TOWN',
      sub: lap > 1 ? `TRAIL ${lap}` : 'THE TRAIL BEGINS',
      ticks: 110,
    }
  }

  private respawn() {
    this.x = this.checkpoint
    // The camera comes back with him (it also bounds how far back he can walk).
    this.camX = Math.max(0, this.x - 120)
    this.y = GROUND_Y
    this.vx = 0
    this.vy = 0
    this.onGround = true
    this.facing = 1
    this.poncho = true
    this.invuln = INVULN_TICKS
    this.timer = STAGE_TICKS
    this.foes = []
    this.kunai = []
    this.pickups = []
    this.spiritTimer = 120
    this.crowTimer = 300
    this.hyenaTimer = 400
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    const controls = this.demo ? this.demoInput() : input

    if (this.clear > 0) {
      if (--this.clear === 0) this.startStage(this.level + 1)
      return
    }
    if (this.dead > 0) {
      if (--this.dead === 0) {
        if (this.lives <= 0) {
          this.over = true
          this.banner = { text: 'GAME OVER', ticks: 9999 }
        } else {
          this.respawn()
        }
      }
      return
    }

    if (this.invuln > 0) this.invuln--
    if (this.throwCooldown > 0) this.throwCooldown--
    if (this.throwPose > 0) this.throwPose--
    if (--this.timer <= 0) {
      this.die('THE DUSK TOOK HIM')
      return
    }

    this.move(controls)
    if (this.dead > 0) return
    if (controls.pressed.a || (controls.held.a && this.throwCooldown === 0))
      this.throw()
    this.spawnFoes()
    this.updateKunai()
    this.updateFoes()
    this.updatePickups()

    if (this.x > CHECKPOINT_X && this.checkpoint < CHECKPOINT_X) {
      this.checkpoint = CHECKPOINT_X
      this.banner = { text: 'CHECKPOINT', ticks: 70 }
      this.sound.play('pickup')
    }
    if (this.x >= STAGE_END) this.stageClear()
    this.camX = Math.max(0, Math.min(STAGE_END + 80 - W, this.x - 120))
  }

  private move(input: InputFrame) {
    if (this.onGround) {
      this.vx = 0
      if (input.held.left) {
        this.vx = -WALK
        this.facing = -1
      }
      if (input.held.right) {
        this.vx = WALK
        this.facing = 1
      }
      if (this.vx !== 0) this.walkPhase += 0.25
      if (
        input.pressed.up ||
        input.pressed.b ||
        ((input.held.up || input.held.b) && this.onGround)
      ) {
        // A committed jump, as in the classic: no steering once in the air.
        this.vy = JUMP_VY
        this.vx = this.vx === 0 ? 0 : Math.sign(this.vx) * JUMP_VX
        this.onGround = false
        this.sound.play('blip')
      }
    }
    const prevY = this.y
    this.vy += GRAVITY
    let nx = this.x + this.vx
    // Tombstones stop him at their faces.
    for (const t of TOMBSTONES) {
      const overlapY = this.y > GROUND_Y - 16
      if (overlapY && nx + 5 > t - 6 && nx - 5 < t + 6) {
        nx = this.x < t ? t - 11 : t + 11
      }
    }
    this.x = Math.max(this.camX + 6, Math.min(STAGE_END + 40, nx))
    this.y += this.vy
    this.onGround = false
    if (this.vy >= 0) {
      // Land on a boardwalk from above, a tombstone top, or the ground.
      for (const b of BOARDWALKS) {
        if (
          this.x > b.x &&
          this.x < b.x + b.w &&
          prevY <= b.y &&
          this.y >= b.y
        ) {
          this.y = b.y
          this.vy = 0
          this.onGround = true
        }
      }
      for (const t of TOMBSTONES) {
        if (
          Math.abs(this.x - t) < 8 &&
          prevY <= GROUND_Y - 16 &&
          this.y >= GROUND_Y - 16
        ) {
          this.y = GROUND_Y - 16
          this.vy = 0
          this.onGround = true
        }
      }
      if (
        !this.onGround &&
        this.y >= GROUND_Y &&
        prevY <= GROUND_Y &&
        groundAt(this.x)
      ) {
        this.y = GROUND_Y
        this.vy = 0
        this.onGround = true
      }
    }
    if (this.y > H + 20) this.die('INTO THE DARK')
  }

  private throw() {
    if (this.kunai.length >= MAX_KUNAI) return
    this.throwCooldown = THROW_COOLDOWN
    this.throwPose = 8
    this.kunai.push({
      x: this.x + this.facing * 8,
      y: this.y - 12,
      vx: this.facing * KUNAI_SPEED,
      life: 70,
    })
    this.sound.play('shoot')
  }

  private spawnFoes() {
    const speed = levelCurve(this.level, TRAIL_CURVES.enemySpeed)
    if (--this.spiritTimer <= 0) {
      this.spiritTimer = Math.round(
        levelCurve(this.level, TRAIL_CURVES.spiritEvery) *
          (0.7 + this.rng() * 0.6),
      )
      const side = this.rng() < 0.7 ? 1 : -1
      const sx = this.x + side * (50 + this.rng() * 90)
      // Spirits never claw up right at a pit's edge (a landing spot).
      if (
        groundAt(sx - 24) &&
        groundAt(sx + 24) &&
        sx < STAGE_END - 40 &&
        !TOMBSTONES.some((t) => Math.abs(t - sx) < 14)
      ) {
        this.foes.push({
          kind: 'spirit',
          x: sx,
          y: GROUND_Y + 14,
          vx: 0,
          vy: 0,
          hp: 1,
          t: 0,
          phase: 'rise',
          baseY: GROUND_Y,
        })
      }
    }
    if (--this.crowTimer <= 0) {
      this.crowTimer = Math.round(
        levelCurve(this.level, TRAIL_CURVES.crowEvery) *
          (0.7 + this.rng() * 0.6),
      )
      const y = 70 + this.rng() * 60
      this.foes.push({
        kind: 'crow',
        x: this.camX + W + 10,
        y,
        vx: -1.4 * speed,
        vy: 0,
        hp: 1,
        t: 0,
        phase: 'walk',
        baseY: y,
      })
    }
    if (--this.hyenaTimer <= 0) {
      this.hyenaTimer = Math.round(
        levelCurve(this.level, TRAIL_CURVES.hyenaEvery) *
          (0.7 + this.rng() * 0.6),
      )
      const hx = this.camX + W + 10
      if (groundAt(hx)) {
        this.foes.push({
          kind: 'hyena',
          x: hx,
          y: GROUND_Y,
          vx: -1.6 * speed,
          vy: 0,
          hp: 2,
          t: 0,
          phase: 'walk',
          baseY: GROUND_Y,
        })
      }
    }
  }

  private updateKunai() {
    for (const k of this.kunai) {
      k.x += k.vx
      k.life--
      if (TOMBSTONES.some((t) => Math.abs(k.x - t) < 6 && k.y > GROUND_Y - 16))
        k.life = 0
      if (k.life <= 0) continue
      // A spirit can be hit once it is mostly out of the dirt.
      const foe = this.foes.find(
        (f) =>
          (f.phase !== 'rise' || f.y < GROUND_Y + 6) &&
          Math.abs(f.x - k.x) < 8 &&
          Math.abs(f.y - 8 - k.y) < 10,
      )
      if (foe) {
        k.life = 0
        foe.hp--
        this.burst(k.x, k.y, 4, '#e5e7eb')
        if (foe.hp <= 0) this.defeat(foe)
        continue
      }
      const crate = this.crates.find(
        (c) => !c.open && Math.abs(c.x - k.x) < 9 && k.y > GROUND_Y - 18,
      )
      if (crate) {
        k.life = 0
        crate.open = true
        this.pickups.push({
          x: crate.x,
          y: GROUND_Y - 10,
          vy: -3,
          kind: crate.holds,
          life: 60 * 8,
        })
        this.burst(crate.x, GROUND_Y - 8, 10, '#a16207')
        this.sound.play('pop')
      }
    }
    this.kunai = this.kunai.filter(
      (k) => k.life > 0 && Math.abs(k.x - this.x) < W,
    )
  }

  private defeat(f: Foe) {
    this.foes = this.foes.filter((o) => o !== f)
    const points = f.kind === 'hyena' ? 300 : f.kind === 'crow' ? 150 : 100
    this.addScore(points, f.x, f.y - 20)
    const color =
      f.kind === 'spirit'
        ? '#a5f3fc'
        : f.kind === 'crow'
          ? '#475569'
          : '#f5f5f4'
    this.burst(f.x, f.y - 8, 10, color)
    this.sound.play('pop')
  }

  private updateFoes() {
    const speed = levelCurve(this.level, TRAIL_CURVES.enemySpeed)
    for (const f of this.foes) {
      f.t++
      if (f.kind === 'spirit') {
        if (f.phase === 'rise') {
          f.y -= 0.5
          if (f.y <= f.baseY) {
            f.y = f.baseY
            f.phase = 'walk'
          }
        } else if (f.phase === 'walk') {
          f.x += Math.sign(this.x - f.x) * 0.5 * speed
          if (!groundAt(f.x)) f.x -= Math.sign(this.x - f.x) * 0.5 * speed
          if (f.t > 60 * 6) f.phase = 'sink'
        } else {
          f.y += 0.4
          if (f.y > f.baseY + 16) f.hp = -99
        }
      } else if (f.kind === 'crow') {
        // Swoops toward Zuzu's height, then away.
        f.x += f.vx
        const target = this.y - 14
        f.y +=
          Math.max(-1, Math.min(1, (target - f.y) * 0.02)) +
          Math.sin(f.t / 10) * 0.6
      } else {
        f.x += f.vx
        f.vy += GRAVITY
        f.y += f.vy
        if (f.y >= GROUND_Y && groundAt(f.x)) {
          f.y = GROUND_Y
          f.vy = 0
          // Leap pits and tombstones.
          const ahead = f.x + Math.sign(f.vx) * 18
          if (
            !groundAt(ahead) ||
            TOMBSTONES.some((t) => Math.abs(t - ahead) < 8)
          )
            f.vy = -5
        }
        if (f.y > H + 20) f.hp = -99
      }
      if (
        f.hp > 0 &&
        f.phase !== 'rise' &&
        Math.abs(f.x - this.x) < 9 &&
        Math.abs(f.y - 8 - (this.y - 10)) < 14
      ) {
        this.hit()
      }
    }
    this.foes = this.foes.filter(
      (f) => f.hp > 0 && f.x > this.camX - 60 && f.x < this.camX + W + 80,
    )
  }

  private updatePickups() {
    for (const p of this.pickups) {
      p.vy += GRAVITY
      p.y = Math.min(GROUND_Y - 6, p.y + p.vy)
      p.life--
      if (Math.abs(p.x - this.x) < 10 && Math.abs(p.y - (this.y - 8)) < 16) {
        p.life = 0
        if (p.kind === 'poncho') {
          this.poncho = true
          this.floaters.push({ x: p.x, y: p.y - 14, text: 'PONCHO!', life: 50 })
          this.sound.play('extra')
        } else {
          this.addScore(500, p.x, p.y - 14)
          this.sound.play('pickup')
        }
      }
    }
    this.pickups = this.pickups.filter((p) => p.life > 0)
  }

  /** The poncho rule: first hit knocks the poncho and kasa off; the next one ends him. */
  private hit() {
    if (this.invuln > 0 || this.dead > 0) return
    if (this.poncho) {
      this.poncho = false
      this.invuln = INVULN_TICKS
      this.flying.push({
        x: this.x,
        y: this.y - 18,
        vx: -this.facing * 1.5,
        vy: -3,
        spin: 0,
        life: 70,
      })
      this.vy = -2.5
      this.vx = -this.facing * 0.6
      this.onGround = false
      this.sound.play('warn')
      return
    }
    this.die('STRUCK DOWN')
  }

  private die(text: string) {
    if (this.dead > 0) return
    this.lives--
    this.dead = DEATH_TICKS
    this.burst(this.x, this.y - 10, 14, '#a16207')
    if (this.poncho)
      this.flying.push({
        x: this.x,
        y: this.y - 18,
        vx: this.facing * 1.2,
        vy: -3.5,
        spin: 0,
        life: 80,
      })
    this.sound.play('die')
    if (this.lives > 0)
      this.banner = { text, sub: 'BACK TO THE CHECKPOINT', ticks: 90 }
  }

  private stageClear() {
    const timeBonus = Math.floor(this.timer / 60) * 50
    const bonus = 5000 * this.level + timeBonus
    this.addScore(bonus, this.x, this.y - 30)
    this.clear = CLEAR_TICKS
    this.foes = []
    this.banner = {
      text: 'TRAIL CLEARED',
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
      this.nextExtra += EXTRA_EVERY
      this.banner = { text: 'ONE MORE LIFE', ticks: 90 }
      this.sound.play('extra')
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 1.6
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.6,
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
    for (const f of this.flying) {
      f.x += f.vx
      f.vy += 0.15
      f.y += f.vy
      f.spin += 0.3
      f.life--
    }
    this.flying = this.flying.filter((f) => f.life > 0)
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
    // Deal with whatever is closest, facing it.
    const near = this.foes
      .filter(
        (f) => f.phase !== 'rise' && Math.abs(f.y - 8 - (this.y - 12)) < 22,
      )
      .sort((a, b) => Math.abs(a.x - this.x) - Math.abs(b.x - this.x))[0]
    if (near && Math.abs(near.x - this.x) < 110) {
      const dir = near.x > this.x ? 1 : -1
      if (dir !== this.facing && this.onGround) {
        if (dir > 0) held.right = true
        else held.left = true
        return frame
      }
      if (this.throwCooldown === 0) frame.pressed.a = true
      if (Math.abs(near.x - this.x) > 30) return frame
    }
    // Break crates on the way.
    const crate = this.crates.find(
      (c) => !c.open && c.x > this.x && c.x - this.x < 90,
    )
    if (crate && this.throwCooldown === 0 && this.facing === 1)
      frame.pressed.a = true
    held.right = true
    if (this.onGround) {
      // Take off close to the edge so the jump clears the whole pit.
      const pit = groundAt(this.x) && !groundAt(this.x + 12)
      const stone =
        TOMBSTONES.some((t) => t - this.x > 0 && t - this.x < 20) &&
        this.y > GROUND_Y - 4
      const crateAhead = this.crates.some(
        (c) => !c.open && c.x - this.x > 0 && c.x - this.x < 16,
      )
      // Hold at a pit's edge (throwing) while something is charging across it.
      const charging = this.foes.some((f) => f.x > this.x && f.x - this.x < 110)
      if (pit && charging) {
        held.right = false
        if (this.throwCooldown === 0) frame.pressed.a = true
        return frame
      }
      if ((pit && this.y >= GROUND_Y - 1) || stone || crateAhead) held.up = true
    }
    return frame
  }

  // --- render -------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderSky(g)
    g.save()
    g.translate(-Math.round(this.camX), 0)
    this.renderTown(g)
    this.renderGround(g)
    for (const c of this.crates) if (!c.open) this.renderCrate(g, c.x)
    for (const p of this.pickups) this.renderPickup(g, p)
    for (const f of this.foes) this.renderFoe(g, f)
    for (const k of this.kunai) {
      g.fillStyle = '#cbd5e1'
      g.fillRect(k.x - 4, k.y - 1, 7, 2)
      g.fillStyle = '#7c2d12'
      g.fillRect(k.x - (k.vx > 0 ? 6 : -3), k.y - 1, 3, 2)
    }
    for (const f of this.flying) this.renderFlyingKasa(g, f)
    if (this.dead === 0 && !this.over) this.renderZuzu(g)
    else if (this.dead > 0) this.renderFallen(g)
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

  private renderSky(g: CanvasRenderingContext2D) {
    const sky = g.createLinearGradient(0, 0, 0, GROUND_Y)
    sky.addColorStop(0, '#0f1b3d')
    sky.addColorStop(0.65, '#3b4a7a')
    sky.addColorStop(1, '#b8743a')
    g.fillStyle = sky
    g.fillRect(0, 0, W, H)
    // A big pale moon, parallax-slow.
    const mx = 250 - ((this.camX * 0.05) % 400)
    g.fillStyle = '#e2e8f0'
    g.beginPath()
    g.arc(mx, 52, 22, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = 'rgba(15, 27, 61, 0.35)'
    g.beginPath()
    g.arc(mx + 7, 48, 18, 0, Math.PI * 2)
    g.fill()
    // Distant mesas.
    g.fillStyle = '#2a2350'
    for (let i = 0; i < 6; i++) {
      const x = ((((i * 140 - this.camX * 0.25) % 840) + 840) % 840) - 120
      g.fillRect(x, 150, 90, 60)
      g.fillRect(x + 12, 138, 60, 14)
    }
  }

  private renderTown(g: CanvasRenderingContext2D) {
    // False-front shacks along the trail, weathered and empty.
    for (let x = 120; x < STAGE_END; x += 260) {
      const h = 46 + ((x / 260) % 3) * 10
      g.fillStyle = '#4a3423'
      g.fillRect(x, GROUND_Y - h, 70, h)
      g.fillStyle = '#5c4030'
      g.fillRect(x - 4, GROUND_Y - h - 12, 78, 14)
      g.fillStyle = '#1c1410'
      g.fillRect(x + 10, GROUND_Y - h + 12, 12, 14)
      g.fillRect(x + 46, GROUND_Y - h + 12, 12, 14)
      g.fillRect(x + 28, GROUND_Y - 24, 14, 24)
      // A swinging shutter.
      g.fillStyle = '#6b4a33'
      g.fillRect(
        x + 46 + Math.sin(this.tick / 30 + x) * 2,
        GROUND_Y - h + 12,
        4,
        14,
      )
    }
    // The mission gate at the trail's end.
    g.fillStyle = '#d6c7a1'
    g.fillRect(STAGE_END, GROUND_Y - 70, 12, 70)
    g.fillRect(STAGE_END + 60, GROUND_Y - 70, 12, 70)
    g.fillRect(STAGE_END - 4, GROUND_Y - 82, 80, 14)
    g.fillStyle = '#a16207'
    g.beginPath()
    g.arc(STAGE_END + 36, GROUND_Y - 92, 7, Math.PI, 0)
    g.fill()
    // Checkpoint lantern.
    g.fillStyle = '#3f2a14'
    g.fillRect(CHECKPOINT_X, GROUND_Y - 40, 3, 40)
    g.fillStyle = this.checkpoint >= CHECKPOINT_X ? '#fbbf24' : '#57534e'
    g.fillRect(CHECKPOINT_X - 3, GROUND_Y - 46, 9, 8)
  }

  private renderGround(g: CanvasRenderingContext2D) {
    for (const [a, b] of GROUND) {
      g.fillStyle = '#7c5a32'
      g.fillRect(a, GROUND_Y, b - a, H - GROUND_Y)
      g.fillStyle = '#a07a45'
      g.fillRect(a, GROUND_Y, b - a, 3)
      g.fillStyle = '#5c4026'
      for (let x = a + 6; x < b; x += 23)
        g.fillRect(x, GROUND_Y + 8 + (x % 3) * 4, 3, 2)
    }
    for (const b of BOARDWALKS) {
      g.fillStyle = '#6b4a2b'
      g.fillRect(b.x, b.y, b.w, 5)
      g.fillStyle = '#3f2a14'
      g.fillRect(b.x + 4, b.y + 5, 3, GROUND_Y - b.y - 5)
      g.fillRect(b.x + b.w - 7, b.y + 5, 3, GROUND_Y - b.y - 5)
      g.fillStyle = '#8b6a43'
      for (let x = b.x; x < b.x + b.w; x += 8) g.fillRect(x, b.y, 1, 5)
    }
    for (const t of TOMBSTONES) {
      g.fillStyle = '#78716c'
      g.fillRect(t - 6, GROUND_Y - 14, 12, 14)
      g.beginPath()
      g.arc(t, GROUND_Y - 14, 6, Math.PI, 0)
      g.fill()
      g.fillStyle = '#44403c'
      g.fillRect(t - 1, GROUND_Y - 16, 2, 8)
      g.fillRect(t - 3, GROUND_Y - 13, 6, 2)
    }
  }

  private renderCrate(g: CanvasRenderingContext2D, x: number) {
    g.fillStyle = '#92400e'
    g.fillRect(x - 8, GROUND_Y - 16, 16, 16)
    g.strokeStyle = '#451a03'
    g.lineWidth = 1
    g.strokeRect(x - 7.5, GROUND_Y - 15.5, 15, 15)
    g.beginPath()
    g.moveTo(x - 7, GROUND_Y - 15)
    g.lineTo(x + 7, GROUND_Y - 1)
    g.stroke()
  }

  private renderPickup(g: CanvasRenderingContext2D, p: Pickup) {
    if (p.life < 90 && Math.floor(this.tick / 5) % 2) return
    if (p.kind === 'poncho') {
      g.fillStyle = '#9a3412'
      g.beginPath()
      g.moveTo(p.x, p.y - 7)
      g.lineTo(p.x + 8, p.y + 5)
      g.lineTo(p.x - 8, p.y + 5)
      g.fill()
      g.fillStyle = '#f97316'
      for (let i = -6; i < 6; i += 4) g.fillRect(p.x + i, p.y + 3, 2, 2)
    } else {
      g.fillStyle = '#facc15'
      g.beginPath()
      g.arc(p.x, p.y, 4, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#fef9c3'
      g.fillRect(p.x - 2, p.y - 2, 2, 2)
    }
  }

  private renderFoe(g: CanvasRenderingContext2D, f: Foe) {
    const x = f.x
    const y = f.y
    if (f.kind === 'spirit') {
      // A restless spirit clawing up out of the dirt: pale, ragged, hollow-eyed.
      g.save()
      g.beginPath()
      g.rect(x - 10, 0, 20, GROUND_Y + 1)
      g.clip()
      g.globalAlpha = f.phase === 'sink' ? 0.6 : 0.85
      g.fillStyle = '#a5f3fc'
      g.beginPath()
      g.moveTo(x - 6, y)
      g.lineTo(x - 6, y - 14)
      g.arc(x, y - 14, 6, Math.PI, 0)
      g.lineTo(x + 6, y)
      g.fill()
      g.fillStyle = '#164e63'
      g.fillRect(x - 3, y - 16, 2, 3)
      g.fillRect(x + 1, y - 16, 2, 3)
      g.fillRect(x - 1, y - 11, 2, 2)
      // Reaching arms.
      g.fillStyle = '#a5f3fc'
      const reach = Math.sin(f.t / 8) * 2
      g.fillRect(x + Math.sign(this.x - x) * 6, y - 12 + reach, 5, 2)
      g.restore()
      return
    }
    if (f.kind === 'crow') {
      const flap = Math.floor(f.t / 6) % 2
      g.fillStyle = '#1e293b'
      g.fillRect(x - 5, y - 3, 10, 6)
      g.fillStyle = '#334155'
      g.beginPath()
      g.moveTo(x - 2, y - 2)
      g.lineTo(x + 2, y - (flap ? 10 : 2))
      g.lineTo(x + 6, y - 2)
      g.fill()
      g.fillStyle = '#facc15'
      g.fillRect(x - 8, y - 1, 3, 2)
      g.fillStyle = '#fef08a'
      g.fillRect(x - 4, y - 2, 1, 1)
      return
    }
    // Bone hyena: a skeletal grin on four quick legs.
    const step = Math.floor(f.t / 5) % 2
    g.fillStyle = '#e7e5e4'
    g.fillRect(x - 8, y - 12, 14, 6)
    g.fillRect(x - 12, y - 15, 6, 6)
    g.fillStyle = '#44403c'
    g.fillRect(x - 11, y - 13, 1, 1)
    g.fillRect(x - 12, y - 11, 4, 1)
    for (let i = 0; i < 4; i++) g.fillRect(x - 6 + i * 3, y - 11, 1, 4)
    g.fillStyle = '#e7e5e4'
    g.fillRect(x - 7, y - 6, 2, 6 - step * 2)
    g.fillRect(x + 3, y - 6, 2, 4 + step * 2)
    g.fillRect(x + 6, y - 13, 4, 2)
  }

  private renderZuzu(g: CanvasRenderingContext2D) {
    if (this.invuln > 0 && Math.floor(this.tick / 4) % 2) return
    const x = Math.round(this.x)
    const y = Math.round(this.y)
    const f = this.facing
    const step =
      this.onGround && this.vx !== 0 ? Math.floor(this.walkPhase) % 2 : 0
    // Short legs in dark brown trousers.
    g.fillStyle = '#3f2a1d'
    g.fillRect(x - 4, y - 5, 3, 5 - step)
    g.fillRect(x + 1, y - 5, 3, 4 + step)
    // Katana across the back, hilt over the right shoulder.
    g.fillStyle = '#1c1917'
    g.fillRect(x - f * 5, y - 22, 2, 6)
    g.fillStyle = '#b91c1c'
    g.fillRect(x - f * 5, y - 23, 2, 2)
    if (this.poncho) {
      // The rust-brown poncho with orange zigzag trim.
      g.fillStyle = '#9a3412'
      g.beginPath()
      g.moveTo(x, y - 18)
      g.lineTo(x + 8, y - 4)
      g.lineTo(x - 8, y - 4)
      g.fill()
      g.fillStyle = '#f97316'
      for (let i = -7; i < 7; i += 3)
        g.fillRect(x + i, y - 6 + (i % 2 === 0 ? 0 : -1), 2, 1)
    } else {
      // Just the dark tunic and orange sash.
      g.fillStyle = '#1e3a8a'
      g.fillRect(x - 5, y - 15, 10, 10)
      g.fillStyle = '#ea580c'
      g.fillRect(x - 5, y - 9, 10, 2)
    }
    // The throwing arm.
    if (this.throwPose > 0) {
      g.fillStyle = '#9ca3af'
      g.fillRect(x + f * 5, y - 14, f * 5, 2)
    }
    // Koala head: grey, big dark nose, round fuzzy ears.
    g.fillStyle = '#9ca3af'
    g.fillRect(x - 5, y - 24, 10, 8)
    g.fillStyle = '#6b7280'
    g.fillRect(x - 8, y - 25, 4, 5)
    g.fillRect(x + 4, y - 25, 4, 5)
    g.fillStyle = '#d1d5db'
    g.fillRect(x - 7, y - 24, 2, 3)
    g.fillRect(x + 5, y - 24, 2, 3)
    g.fillStyle = '#111827'
    g.fillRect(x + f * 2 - 1, y - 20, 3, 3)
    if (this.poncho) {
      // The wide straw kasa, its brim shading his eyes.
      g.fillStyle = '#d6b25e'
      g.beginPath()
      g.moveTo(x - 11, y - 22)
      g.lineTo(x, y - 30)
      g.lineTo(x + 11, y - 22)
      g.fill()
      g.fillStyle = '#a07d32'
      g.fillRect(x - 11, y - 22, 22, 1)
      g.fillStyle = 'rgba(17, 24, 39, 0.5)'
      g.fillRect(x - 5, y - 21, 10, 2)
      // The katana hilt pokes out past the brim, over his right shoulder.
      g.fillStyle = '#1c1917'
      g.fillRect(x - f * 10, y - 27, 2, 6)
      g.fillStyle = '#b91c1c'
      g.fillRect(x - f * 10, y - 28, 2, 2)
    } else {
      // Bare-headed: a serious, level stare.
      g.fillStyle = '#111827'
      g.fillRect(x - 3 + f, y - 22, 2, 1)
      g.fillRect(x + 1 + f, y - 22, 2, 1)
    }
  }

  private renderFlyingKasa(g: CanvasRenderingContext2D, f: Flying) {
    g.save()
    g.translate(f.x, f.y)
    g.rotate(f.spin)
    g.fillStyle = '#d6b25e'
    g.beginPath()
    g.moveTo(-10, 3)
    g.lineTo(0, -4)
    g.lineTo(10, 3)
    g.fill()
    g.fillStyle = '#9a3412'
    g.fillRect(-6, 4, 12, 4)
    g.restore()
  }

  private renderFallen(g: CanvasRenderingContext2D) {
    // Face down in the dust, still serious about it.
    const x = Math.round(this.x)
    const y = Math.min(Math.round(this.y), GROUND_Y)
    if (this.y > GROUND_Y + 4) return
    g.fillStyle = this.poncho ? '#9a3412' : '#1e3a8a'
    g.fillRect(x - 9, y - 5, 16, 5)
    g.fillStyle = '#9ca3af'
    g.fillRect(x + 6, y - 6, 7, 6)
    g.fillStyle = '#6b7280'
    g.fillRect(x + 10, y - 9, 4, 4)
    g.fillStyle = '#3f2a1d'
    g.fillRect(x - 13, y - 3, 5, 3)
  }

  private renderHud(g: CanvasRenderingContext2D) {
    const shadow = '#0f1b3d'
    g.fillStyle = 'rgba(15, 27, 61, 0.7)'
    g.fillRect(0, 0, W, 16)
    drawText(g, String(this.score).padStart(7, '0'), 4, 2, {
      scale: 2,
      color: '#fbbf24',
      shadow,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, W - 4, 1, {
      align: 'right',
      color: '#fca5a5',
    })
    drawText(g, `TRAIL ${this.level}`, W - 4, 9, {
      align: 'right',
      color: '#bfdbfe',
    })
    const seconds = Math.ceil(this.timer / 60)
    drawText(g, `TIME ${seconds}`, 100, 1, {
      color:
        seconds <= 20 && Math.floor(this.tick / 10) % 2 ? '#ef4444' : '#fde68a',
    })
    for (let i = 0; i < Math.min(this.lives - 1, 5); i++) {
      g.fillStyle = '#d6b25e'
      g.beginPath()
      g.moveTo(100 + i * 12, 15)
      g.lineTo(105 + i * 12, 10)
      g.lineTo(110 + i * 12, 15)
      g.fill()
    }
    // Progress along the trail.
    g.fillStyle = '#1f2937'
    g.fillRect(170, 6, 60, 3)
    g.fillStyle = '#fbbf24'
    g.fillRect(170, 6, Math.min(60, (60 * this.x) / STAGE_END), 3)
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, 70, {
        scale: 2,
        align: 'center',
        color: '#fef3c7',
        shadow: '#7c2d12',
      })
      if (this.banner.sub)
        drawText(g, this.banner.sub, W / 2, 90, {
          align: 'center',
          color: '#fde68a',
          shadow,
        })
    }
  }
}

const zuzuGhostTrail: ArcadeGameModule = {
  create: (options) => new ZuzuGhostTrail(options),
}

export const create = zuzuGhostTrail.create
export default zuzuGhostTrail
