// /utils/arcade/butterflyJoust/finalChampions.ts
//
// The later champion bouts of the Four Gardens Tourney (conductor kr-arcade/t-049), on the same
// BoutCtx as Sir Bumbleton and the Dandelion Duchess (champions.ts):
//
//   Old Thunderhead        a storm cloud with one great eye. The eye opens only between lightning
//                          strikes, and a level, lance-first bonk to the open eye is the only hit:
//                          the Thundercap's check, made into a bout. His bolts come straight down,
//                          and the brows spark first. Past half he brings the rain.
//   The Scarecrow Kite     a patchwork kite flown by three moth riders on strings. Bonk a rider from
//                          above to cut its string; with each string gone the kite dives harder
//                          (it shakes first). With all three cut, it tumbles into the leaves.
//   The Frost Moth Queen   her wingbeats freeze the ledges one after another (a snowflake marks the
//                          next). At two thirds she shatters the frozen pond; at one third she keeps
//                          to the top of the sky, where a flap ices your wings: ride a lantern up.
//   The Mirror Moth        your own butterfly in silver. First it rides your moves a second late,
//                          then it splits into two mirrors (one a second late, one flipped), and at
//                          last it flies against you on equal terms, lance and lunge and all.

import {
  INK,
  RAMPS,
  drawSprite,
  dropShadow,
  glow,
  rgba,
  shadedOrb,
} from '../snes'
import { MIRROR_FRAMES, RIDER_FRAMES, drawThunderhead } from './art'
import { CHAMPIONS } from './arenas'
import {
  clampY,
  dizzy,
  nearestRider,
  type BoutCtx,
  type BoutRider,
  type Champion,
} from './champions'
import { CEILING, POND_Y, W, wrapDx, wrapX } from './field'

// --- Old Thunderhead ------------------------------------------------------------------------

export const THUNDERHEAD = {
  hp: 5,
  size: 1.8,
  /** The bolt, the eye open (shorter as he weakens), the eye shut while the next bolt charges. */
  flash: 40,
  open: 96,
  openStep: 10,
  shut: 80,
  /** The eye's hit box and the cloud's. */
  eyeW: 30,
  eyeH: 20,
  bodyW: 40,
  bodyH: 30,
  hitPoints: 1500,
  stun: 40,
} as const

export class Thunderhead implements Champion {
  readonly id = 'thunderhead' as const
  readonly name = CHAMPIONS.thunderhead.name
  hp: number = THUNDERHEAD.hp
  readonly maxHp: number = THUNDERHEAD.hp
  x = W / 2
  y = 100
  t = 0
  mode: 'shut' | 'flash' | 'open' = 'shut'
  timer = 0
  stun = 0
  raining = false
  look = { dx: 0, dy: 0 }
  /** Past half, a second bolt aimed where you were when the charge began (marked first). */
  aim: number | null = null

  get done() {
    return this.hp <= 0
  }

  busy() {
    return false
  }

  openFor(): number {
    return THUNDERHEAD.open - (this.maxHp - this.hp) * THUNDERHEAD.openStep
  }

  update(ctx: BoutCtx) {
    this.t++
    if (this.stun > 0) this.stun--
    const prey = nearestRider(ctx, this.x, this.y)
    if (prey) {
      this.look = {
        dx: wrapDx(this.x, prey.x) / 20,
        dy: (prey.y - this.y) / 20,
      }
    }
    if (!this.raining && this.hp <= 3) {
      this.raining = true
      ctx.rain(true)
      ctx.say('HE BRINGS THE RAIN!', 'A RAINBOW DRIES YOUR WINGS')
    }
    this.timer++
    if (
      this.mode === 'shut' &&
      this.timer === THUNDERHEAD.shut - 40 &&
      this.hp <= 2 &&
      prey
    )
      this.aim = prey.x
    if (this.mode === 'shut' && this.timer > THUNDERHEAD.shut) {
      this.mode = 'flash'
      this.timer = 0
      ctx.strike(this.x, this.y + 24)
      if (this.aim !== null) ctx.strike(this.aim, CEILING)
      this.aim = null
      ctx.play('boom')
    } else if (this.mode === 'flash' && this.timer > THUNDERHEAD.flash) {
      this.mode = 'open'
      this.timer = 0
    } else if (this.mode === 'open' && this.timer > this.openFor()) {
      this.mode = 'shut'
      this.timer = 0
    }
    if (!prey || this.mode === 'flash') return
    // He drifts over his prey, slow while his eye is open.
    const speed = this.mode === 'open' ? 0.45 : 0.95
    const dx = wrapDx(this.x, prey.x)
    this.x = wrapX(this.x + Math.max(-speed, Math.min(speed, dx * 0.04)))
    const ty = clampY(prey.y - 46, CEILING + 40, 210)
    this.y += Math.max(-0.7, Math.min(0.7, (ty - this.y) * 0.03))
    this.y += Math.sin(this.t / 14) * 0.3
  }

  touch(ctx: BoutCtx, r: BoutRider): boolean {
    const dx = wrapDx(this.x, r.x)
    const dy = r.y - this.y
    if (Math.abs(dx) > THUNDERHEAD.bodyW || Math.abs(dy) > THUNDERHEAD.bodyH)
      return false
    const lanceFirst = Math.sign(-dx) === r.facing || r.lunge > 0
    const open = this.mode === 'open' && this.stun === 0
    if (open && Math.abs(dy) < THUNDERHEAD.eyeH && lanceFirst) {
      this.hp--
      this.stun = THUNDERHEAD.stun
      this.mode = 'shut'
      this.timer = 0
      ctx.hit(r, THUNDERHEAD.hitPoints, this.x, this.y - 40)
      ctx.push(r, Math.sign(dx || 1) * 2.6, -1.5)
      ctx.burst(this.x, this.y, 24, RAMPS.sky[4])
      ctx.play('boom')
      return false
    }
    if (open) {
      // While his eye is open he is only cloud: anything but the eye just bumps you off.
      ctx.push(r, Math.sign(dx || 1) * 2.4, dy < 0 ? -1.5 : 1.5)
      return false
    }
    if (r.invuln > 0) return false
    ctx.hurt(r)
    return true
  }

  goal(r: BoutRider) {
    const side = Math.sign(wrapDx(this.x, r.x)) || 1
    if (this.aim !== null && Math.abs(wrapDx(this.aim, r.x)) < 40)
      return {
        x: wrapX(this.aim + (wrapDx(this.aim, r.x) < 0 ? -70 : 70)),
        y: r.y,
        flee: true,
      }
    const left = this.openFor() - this.timer
    if (this.mode === 'open' && left > 26 && this.stun === 0)
      return { x: this.x, y: this.y }
    return { x: wrapX(this.x + side * 64), y: this.y, flee: true }
  }

  threats() {
    return [{ x: this.x, y: this.y }]
  }

  render(g: CanvasRenderingContext2D, tick: number) {
    if (this.mode === 'shut' && this.timer > THUNDERHEAD.shut - 30) {
      // The bolt's tell: a flicker on whatever lies below him.
      g.fillStyle = rgba(RAMPS.gold[4], Math.floor(tick / 3) % 2 ? 0.5 : 0.15)
      g.fillRect(
        Math.round(this.x) - 6,
        Math.round(this.y) + 30,
        12,
        POND_Y - this.y - 30,
      )
    }
    if (this.aim !== null && Math.floor(tick / 3) % 2 === 0) {
      // The aimed bolt's mark: a flickering column from the top of the sky.
      g.fillStyle = rgba(RAMPS.gold[4], 0.4)
      g.fillRect(Math.round(this.aim) - 6, CEILING, 12, POND_Y - CEILING)
    }
    const charge = this.mode === 'shut' ? this.timer / THUNDERHEAD.shut : 0
    const shown = this.stun > 0 ? 'shut' : this.mode
    this.wrap((x) =>
      drawThunderhead(
        g,
        x,
        this.y,
        shown,
        tick,
        this.look,
        charge,
        THUNDERHEAD.size,
      ),
    )
    if (this.stun > 0) dizzy(g, this.x, this.y - 36, tick)
  }

  private wrap(draw: (x: number) => void) {
    draw(this.x)
    if (this.x < 50) draw(this.x + W)
    if (this.x > W - 50) draw(this.x - W)
  }
}

// --- The Scarecrow Kite ---------------------------------------------------------------------

type KiteRider = {
  slot: number
  x: number
  y: number
  alive: boolean
  facing: number
}

export const KITE = {
  hp: 3,
  hitPoints: 1500,
  /** How long its strings are, and how far apart its riders hang. */
  string: 62,
  spread: 36,
  /** Between dives (less with each string cut), and the shake before one. */
  every: 270,
  everyStep: 60,
  tell: 45,
  dive: 2.3,
  diveStep: 0.6,
  halfW: 22,
  halfH: 26,
} as const

export class ScarecrowKite implements Champion {
  readonly id = 'kite' as const
  readonly name = CHAMPIONS.kite.name
  hp: number = KITE.hp
  readonly maxHp: number = KITE.hp
  x = W / 2
  y = 66
  t = 0
  mode: 'sail' | 'tell' | 'dive' | 'climb' | 'tumble' = 'sail'
  timer = 0
  wait: number = KITE.every
  vx = 0
  vy = 0
  spin = 0
  riders: KiteRider[] = [0, 1, 2].map((slot) => ({
    slot,
    x: W / 2,
    y: 140,
    alive: true,
    facing: 1,
  }))

  get done() {
    return this.hp <= 0
  }

  busy() {
    return this.mode === 'tumble' && this.y < POND_Y - 10
  }

  update(ctx: BoutCtx) {
    this.t++
    this.timer++
    const prey = nearestRider(ctx, this.x, this.y)
    const cut = KITE.hp - this.hp
    switch (this.mode) {
      case 'sail': {
        // Riding the wind back and forth over the orchard.
        const tx = wrapX(W / 2 + Math.sin(this.t / 160) * 150)
        this.x = wrapX(
          this.x + Math.max(-1.2, Math.min(1.2, wrapDx(this.x, tx) * 0.05)),
        )
        const ty = 64 + Math.sin(this.t / 70) * 10
        this.y += (ty - this.y) * 0.05
        if (--this.wait <= 0 && prey) {
          this.mode = 'tell'
          this.timer = 0
          ctx.play('warn')
        }
        break
      }
      case 'tell':
        if (this.timer > KITE.tell && prey) {
          this.mode = 'dive'
          this.timer = 0
          const dx = wrapDx(this.x, prey.x)
          const dy = Math.max(30, prey.y - this.y)
          const len = Math.hypot(dx, dy) || 1
          const speed = KITE.dive + KITE.diveStep * cut
          this.vx = (dx / len) * speed
          this.vy = (dy / len) * speed
        } else if (!prey) this.mode = 'sail'
        break
      case 'dive':
        this.x = wrapX(this.x + this.vx)
        this.y += this.vy
        if (this.y > POND_Y - 70 || this.timer > 90) {
          this.mode = 'climb'
          this.timer = 0
        }
        break
      case 'climb':
        this.y -= 1.3
        if (this.y <= 66) {
          this.mode = 'sail'
          this.wait = KITE.every - KITE.everyStep * cut
        }
        break
      case 'tumble':
        this.vy = Math.min(3, this.vy + 0.08)
        this.y += this.vy
        this.x = wrapX(this.x + this.vx)
        this.spin += 0.15
        break
    }
    // The riders hang on their strings below, swinging, lances toward their prey.
    for (const r of this.riders) {
      if (!r.alive) continue
      const swing = Math.sin(this.t / 28 + r.slot * 2) * 8
      r.x = wrapX(this.x + (r.slot - 1) * KITE.spread + swing)
      r.y = this.y + KITE.string + (r.slot === 1 ? 14 : 0)
      if (prey) r.facing = Math.sign(wrapDx(r.x, prey.x)) || r.facing
    }
  }

  touch(ctx: BoutCtx, r: BoutRider): boolean {
    if (this.hp <= 0) return false
    for (const k of this.riders) {
      if (!k.alive) continue
      const dx = wrapDx(r.x, k.x)
      const dy = k.y - r.y
      if (Math.abs(dx) > 16 || Math.abs(dy) > 14) continue
      if (dy > 5) {
        // Bonked from above: its string is cut and it flutters off.
        k.alive = false
        this.hp--
        ctx.hit(r, KITE.hitPoints, k.x, k.y - 14)
        ctx.burst(k.x, k.y, 14, RAMPS.rust[3])
        ctx.play('shoot')
        if (this.hp <= 0) {
          this.mode = 'tumble'
          this.vy = -1
          this.vx = Math.sign(dx || 1) * 0.6
          ctx.say('IT TUMBLES!', 'INTO THE LEAVES')
        } else ctx.say('STRING CUT!', `${this.hp} TO GO, IT DIVES HARDER`)
        return false
      }
      if (Math.abs(dy) < 6) {
        ctx.push(r, -Math.sign(dx || 1) * 2, 0)
        continue
      }
      if (r.invuln > 0) continue
      ctx.hurt(r)
      return true
    }
    const dx = wrapDx(this.x, r.x)
    const dy = r.y - this.y
    if (Math.abs(dx) > KITE.halfW || Math.abs(dy) > KITE.halfH) return false
    if (this.mode === 'dive' && r.invuln <= 0) {
      ctx.hurt(r)
      return true
    }
    // Sailing, the kite is only cloth: it bumps you away.
    ctx.push(r, Math.sign(dx || 1) * 2, dy < 0 ? -2 : 1.5)
    return false
  }

  goal(r: BoutRider) {
    if (this.mode === 'tell' || this.mode === 'dive')
      return {
        x: wrapX(this.x + (wrapDx(this.x, r.x) < 0 ? -110 : 110)),
        y: r.y,
        flee: true,
      }
    let best: KiteRider | null = null
    for (const k of this.riders)
      if (
        k.alive &&
        (!best || Math.abs(wrapDx(r.x, k.x)) < Math.abs(wrapDx(r.x, best.x)))
      )
        best = k
    return best ? { x: best.x, y: best.y - 18 } : { x: this.x, y: this.y }
  }

  threats() {
    return this.riders.filter((k) => k.alive)
  }

  render(g: CanvasRenderingContext2D, tick: number) {
    const shake = this.mode === 'tell' ? Math.sin(tick * 1.6) * 2 : 0
    const kx = this.x + shake
    // The strings.
    for (const k of this.riders) {
      if (!k.alive) continue
      g.strokeStyle = rgba(RAMPS.cream[4], 0.8)
      g.lineWidth = 1
      g.beginPath()
      g.moveTo(kx, this.y + 20)
      g.quadraticCurveTo(
        kx + (k.x - kx) * 0.3,
        (this.y + k.y) / 2 + 8,
        k.x,
        k.y - 8,
      )
      g.stroke()
    }
    // The tail of bows.
    for (let i = 1; i <= 5; i++) {
      const tx = kx - i * 6 + Math.sin(tick / 8 + i) * 4
      const ty = this.y + 26 + i * 9
      g.fillStyle = INK
      g.fillRect(Math.round(tx) - 4, Math.round(ty) - 2, 9, 5)
      g.fillStyle = i % 2 ? RAMPS.ember[2] : RAMPS.gold[2]
      g.fillRect(Math.round(tx) - 3, Math.round(ty) - 1, 3, 3)
      g.fillRect(Math.round(tx) + 1, Math.round(ty) - 1, 3, 3)
    }
    g.save()
    g.translate(Math.round(kx), Math.round(this.y))
    g.rotate(this.spin)
    // The patchwork diamond.
    const quad = (c: string, pts: readonly [number, number][]) => {
      g.fillStyle = c
      g.beginPath()
      pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)))
      g.closePath()
      g.fill()
    }
    quad(INK, [
      [0, -30],
      [24, -4],
      [0, 28],
      [-24, -4],
    ])
    quad(RAMPS.gold[2], [
      [0, -27],
      [0, -4],
      [-21, -4],
    ])
    quad(RAMPS.rust[2], [
      [0, -27],
      [21, -4],
      [0, -4],
    ])
    quad(RAMPS.leaf[2], [
      [-21, -4],
      [0, -4],
      [0, 25],
    ])
    quad(RAMPS.earth[3], [
      [0, -4],
      [21, -4],
      [0, 25],
    ])
    // The scarecrow face: button eyes and a stitched grin.
    shadedOrb(g, -7, -6, 3, RAMPS.night, { glint: true })
    shadedOrb(g, 7, -6, 3, RAMPS.night, { glint: true })
    g.fillStyle = INK
    for (let i = -8; i <= 8; i += 4) g.fillRect(i, 4 + Math.abs(i) / 4, 3, 1)
    for (let i = -6; i <= 6; i += 4) g.fillRect(i, 3, 1, 3)
    g.restore()
    for (const k of this.riders) {
      if (!k.alive) continue
      const frames = RIDER_FRAMES.hunter
      drawSprite(
        g,
        frames[Math.floor(tick / 8) % 2]!,
        Math.round(k.x) - 16,
        Math.round(k.y) - 17,
        {
          anchor: 'topleft',
          flipX: k.facing < 0,
        },
      )
    }
  }
}

// --- The Frost Moth Queen -------------------------------------------------------------------

export const QUEEN = {
  hp: 6,
  hitPoints: 1500,
  /** Between frozen ledges (less each phase), and the snowflake's warning before one. */
  every: 120,
  everyStep: 20,
  tell: 45,
  /** In her last phase she keeps this high, and a flap above `veil` ices the wings. */
  top: CEILING + 40,
  veil: 160,
  halfW: 22,
  halfH: 13,
  stun: 40,
  loft: 200,
} as const

export class FrostQueen implements Champion {
  readonly id = 'queen' as const
  readonly name = CHAMPIONS.queen.name
  hp: number = QUEEN.hp
  readonly maxHp: number = QUEEN.hp
  x = W / 2
  y = 110
  t = 0
  stun = 0
  wait: number = QUEEN.every
  /** The ledge her next wingbeat freezes, marked by a snowflake. */
  marked: number | null = null
  markTime = 0
  next = 1
  /** Fluttering high after a hit: ticks left. */
  lofted = 0
  private lastPhase = 1

  get done() {
    return this.hp <= 0
  }

  busy() {
    return false
  }

  phase(): 1 | 2 | 3 {
    return this.hp > 4 ? 1 : this.hp > 2 ? 2 : 3
  }

  update(ctx: BoutCtx) {
    this.t++
    if (this.stun > 0) this.stun--
    const phase = this.phase()
    if (phase !== this.lastPhase) {
      this.lastPhase = phase
      if (phase === 2) {
        ctx.shatter()
        ctx.say('THE POND SHATTERS!', 'NOWHERE TO LAND BELOW')
        ctx.play('boom')
      }
      if (phase === 3) {
        ctx.veil(QUEEN.veil)
        ctx.lanternRush(true)
        ctx.say('SHE FLIES TO THE STARS', 'RIDE A LANTERN UP TO HER')
      }
    }
    const prey = nearestRider(ctx, this.x, this.y)
    if (phase === 3) {
      // High in the sky she sweeps slowly back and forth. A lantern's rider draws her near,
      // hanging just off to the side; once you are lifted above her she comes in to fight.
      const lit = prey && prey.y < QUEEN.veil - 10
      const side = prey ? Math.sign(wrapDx(prey.x, this.x)) || 1 : 1
      const tx =
        lit && prey
          ? prey.y < this.y - 8
            ? prey.x
            : wrapX(prey.x + side * 44)
          : wrapX(W / 2 + Math.sin(this.t / 220) * 170)
      this.x = wrapX(this.x + Math.max(-0.7, Math.min(0.7, wrapDx(this.x, tx))))
    } else if (prey) {
      const dx = wrapDx(this.x, prey.x)
      this.x = wrapX(this.x + Math.max(-0.8, Math.min(0.8, dx * 0.03)))
    }
    // After a hit she flutters up out of reach for a while.
    if (this.lofted > 0) this.lofted--
    const ty =
      phase === 3 || this.lofted > 0
        ? QUEEN.top
        : 96 + Math.sin(this.t / 60) * 34
    this.y += Math.max(-1, Math.min(1, (ty - this.y) * 0.05))
    // Her wingbeats freeze the ledges one after another.
    const ledges = ctx.perches()
    if (this.marked !== null) {
      if (++this.markTime > QUEEN.tell) {
        ctx.freeze(this.marked)
        ctx.play('pop')
        this.marked = null
        this.wait = QUEEN.every - QUEEN.everyStep * (phase - 1)
      }
    } else if (--this.wait <= 0 && ledges.length) {
      this.marked = this.next % ledges.length
      this.next++
      this.markTime = 0
    }
  }

  touch(ctx: BoutCtx, r: BoutRider): boolean {
    // Stunned, or fluttering up out of reach, she can't be touched.
    if (this.hp <= 0 || this.stun > 0 || this.lofted > 0) return false
    const dx = wrapDx(this.x, r.x)
    const dy = this.y - r.y
    if (Math.abs(dx) > QUEEN.halfW + 6 || Math.abs(dy) > QUEEN.halfH + 8)
      return false
    if (dy > 8) {
      this.hp--
      this.stun = QUEEN.stun
      this.lofted = QUEEN.loft
      ctx.hit(r, QUEEN.hitPoints, this.x, this.y - 24)
      ctx.burst(this.x, this.y, 20, RAMPS.sky[4])
      ctx.play('boom')
      return false
    }
    if (r.invuln > 0) return false
    if (this.phase() === 3 && dy < 0) {
      // Up at the stars her frost veil is the weapon: from below you only bump off her.
      ctx.push(r, Math.sign(-dx || 1) * 1.5, 2)
      return false
    }
    ctx.hurt(r)
    return true
  }

  goal(r: BoutRider) {
    void r
    return { x: this.x, y: this.y - 16 }
  }

  threats() {
    return []
  }

  /** The ledge marked for freezing, for the arena to draw its snowflake. */
  mark(): number | null {
    return this.marked
  }

  render(g: CanvasRenderingContext2D, tick: number) {
    if (this.stun > 0 && Math.floor(tick / 4) % 2 === 0) return
    const cx = Math.round(this.x)
    const cy = Math.round(this.y)
    const beat = Math.sin(tick / 6)
    glow(g, cx, cy, 46, RAMPS.sky[3], 0.35)
    // Four great icy wings.
    for (const side of [-1, 1]) {
      for (const [dy, rx, ry] of [
        [-6, 24, 12],
        [8, 16, 9],
      ] as const) {
        g.fillStyle = INK
        g.beginPath()
        g.ellipse(
          cx + side * (rx - 2),
          cy + dy - beat * 3,
          rx + 1,
          ry + 1,
          side * 0.35,
          0,
          Math.PI * 2,
        )
        g.fill()
        g.fillStyle = rgba(RAMPS.sky[4], 0.92)
        g.beginPath()
        g.ellipse(
          cx + side * (rx - 2),
          cy + dy - beat * 3,
          rx,
          ry,
          side * 0.35,
          0,
          Math.PI * 2,
        )
        g.fill()
        g.fillStyle = rgba(RAMPS.water[3], 0.7)
        g.beginPath()
        g.ellipse(
          cx + side * (rx + 2),
          cy + dy - beat * 3,
          rx * 0.5,
          ry * 0.5,
          side * 0.35,
          0,
          Math.PI * 2,
        )
        g.fill()
      }
    }
    // Her body and crowned head.
    shadedOrb(g, cx, cy + 2, 7, RAMPS.steel)
    shadedOrb(g, cx, cy - 8, 6, RAMPS.sky)
    g.fillStyle = INK
    g.fillRect(cx - 3, cy - 9, 2, 2)
    g.fillRect(cx + 2, cy - 9, 2, 2)
    g.fillStyle = INK
    g.fillRect(cx - 6, cy - 18, 13, 5)
    g.fillStyle = RAMPS.sky[4]
    g.fillRect(cx - 5, cy - 17, 11, 3)
    g.fillRect(cx - 5, cy - 20, 2, 3)
    g.fillRect(cx - 1, cy - 22, 2, 5)
    g.fillRect(cx + 3, cy - 20, 2, 3)
    // Snow falling from her wings.
    g.fillStyle = '#ffffff'
    for (let i = 0; i < 6; i++) {
      const sy = (tick * 0.8 + i * 13) % 40
      g.fillRect(cx - 24 + i * 9, cy + 10 + Math.round(sy), 1, 1)
    }
  }
}

// --- The Mirror Moth ------------------------------------------------------------------------

type Mirror = {
  x: number
  y: number
  vx: number
  vy: number
  facing: number
  flap: number
  lunge: number
  cool: number
  flapCool: number
}

export const MIRROR = {
  hp: 9,
  hitPoints: 2000,
  /** It rides your moves this far behind (and the flipped twin half as far). */
  delay: 60,
  stun: 45,
  /** On equal terms: your flap, your speed, your lunge. */
  flap: 1.9,
  maxRise: -3.2,
  airMax: 2.2,
  lunge: 4.4,
  lungeTicks: 16,
  lungeCool: 150,
  flapGap: 12,
  /** After it wins a clash it wheels away this long. */
  retreat: 110,
} as const

export class MirrorMoth implements Champion {
  readonly id = 'mirror' as const
  readonly name = CHAMPIONS.mirror.name
  hp: number = MIRROR.hp
  readonly maxHp: number = MIRROR.hp
  x = W / 2
  y = 120
  t = 0
  stun = 0
  bodies: Mirror[] = [this.body(W / 2, 120)]
  private lastPhase = 1

  get done() {
    return this.hp <= 0
  }

  busy() {
    return false
  }

  phase(): 1 | 2 | 3 {
    return this.hp > 6 ? 1 : this.hp > 3 ? 2 : 3
  }

  /** Wheeling away after it wins a clash: ticks left. */
  retreat = 0

  private body(x: number, y: number): Mirror {
    return {
      x,
      y,
      vx: 0,
      vy: 0,
      facing: 1,
      flap: 0,
      lunge: 0,
      cool: 60,
      flapCool: 0,
    }
  }

  update(ctx: BoutCtx) {
    this.t++
    if (this.stun > 0) this.stun--
    const phase = this.phase()
    if (phase !== this.lastPhase) {
      this.lastPhase = phase
      if (phase === 2) {
        this.bodies = [
          this.bodies[0]!,
          this.body(W - this.bodies[0]!.x, this.bodies[0]!.y),
        ]
        ctx.say('IT SPLITS IN TWO!', 'ONE LATE, ONE FLIPPED')
      } else {
        this.bodies = [this.bodies[0]!]
        ctx.say('EQUAL TERMS!', 'YOUR LANCE, YOUR LUNGE')
      }
      ctx.play('warn')
    }
    const prey = nearestRider(ctx, this.x, this.y)
    if (!prey) return
    if (phase < 3) {
      const late = ctx.history(prey.seat, MIRROR.delay)
      const b = this.bodies[0]!
      if (late) this.follow(b, late.x, late.y, late.facing)
      if (phase === 2) {
        const half = ctx.history(prey.seat, MIRROR.delay / 2)
        if (half) this.follow(this.bodies[1]!, W - half.x, half.y, -half.facing)
      }
    } else this.duel(this.bodies[0]!, prey)
    this.x = this.bodies[0]!.x
    this.y = this.bodies[0]!.y
  }

  /** Glide to where you were: it keeps to your path, a step behind. */
  private follow(b: Mirror, x: number, y: number, facing: number) {
    b.x = wrapX(b.x + Math.max(-3, Math.min(3, wrapDx(b.x, x))))
    b.y += Math.max(-3.2, Math.min(3, y - b.y))
    b.facing = facing
    if (b.flap > 0) b.flap--
    if (y < b.y - 1) b.flap = 8
  }

  /** The last phase: it flies like you, tries to get over you, and lunges when level. */
  private duel(b: Mirror, prey: BoutRider) {
    if (b.flap > 0) b.flap--
    if (b.flapCool > 0) b.flapCool--
    if (b.cool > 0) b.cool--
    let dx = wrapDx(b.x, prey.x)
    // Pinned under a rider hugging the ceiling, it wheels off and comes again.
    if (prey.y < CEILING + 30 && this.retreat === 0 && Math.abs(dx) < 60)
      this.retreat = 60
    if (this.retreat > 0) {
      this.retreat--
      dx = -dx
    }
    if (b.lunge > 0) {
      b.lunge--
      b.vx = b.facing * MIRROR.lunge
    } else {
      b.facing = Math.sign(dx) || b.facing
      b.vx = Math.max(
        -MIRROR.airMax,
        Math.min(MIRROR.airMax, b.vx + b.facing * 0.07),
      )
      if (
        this.retreat === 0 &&
        Math.abs(prey.y - b.y) < 6 &&
        Math.abs(dx) < 90 &&
        b.cool === 0
      ) {
        b.lunge = MIRROR.lungeTicks
        b.cool = MIRROR.lungeCool
      }
    }
    b.vy = Math.min(3, b.vy + 0.1)
    if (b.y > prey.y - 16 && b.flapCool === 0) {
      b.vy = Math.max(MIRROR.maxRise, b.vy - MIRROR.flap)
      b.flap = 8
      b.flapCool = MIRROR.flapGap
    }
    b.x = wrapX(b.x + b.vx)
    b.y = clampY(b.y + b.vy, CEILING + 22, POND_Y - 30)
  }

  touch(ctx: BoutCtx, r: BoutRider): boolean {
    if (this.hp <= 0 || this.stun > 0) return false
    for (const b of this.bodies) {
      const dx = wrapDx(r.x, b.x)
      const dy = b.y - r.y
      if (Math.abs(dx) > 16 || Math.abs(dy) > 14) continue
      let win: boolean | null
      if (Math.abs(dy) < 6) {
        win =
          r.lunge > 0 && b.lunge === 0
            ? true
            : b.lunge > 0 && r.lunge === 0
              ? false
              : null
      } else win = dy > 0
      if (win === null) {
        ctx.push(r, -Math.sign(dx || 1) * 2, 0)
        b.vx = Math.sign(dx || 1) * 2
        continue
      }
      if (win) {
        this.hp--
        this.stun = MIRROR.stun
        ctx.hit(r, MIRROR.hitPoints, b.x, b.y - 18)
        ctx.burst(b.x, b.y, 22, '#ffffff')
        ctx.play('boom')
        return false
      }
      if (r.invuln > 0) continue
      ctx.hurt(r)
      this.retreat = MIRROR.retreat
      return true
    }
    return false
  }

  goal(r: BoutRider) {
    let best = this.bodies[0]!
    for (const b of this.bodies)
      if (Math.abs(wrapDx(r.x, b.x)) < Math.abs(wrapDx(r.x, best.x))) best = b
    // Up at the ceiling there is no getting over it: lure it down first.
    if (best.y < CEILING + 30)
      return { x: wrapX(best.x + 90), y: 210, flee: true }
    return { x: best.x, y: best.y - 20 }
  }

  threats() {
    return this.bodies
  }

  render(g: CanvasRenderingContext2D, tick: number) {
    for (const b of this.bodies) {
      if (this.stun > 0 && Math.floor(tick / 4) % 2 === 0) continue
      glow(g, b.x, b.y - 4, 24, RAMPS.purple[3], 0.35)
      dropShadow(g, b.x, b.y + 30, 8, 2, 0.2)
      const up = b.flap > 4 || Math.floor(tick / 8) % 2 === 0
      // The silver shimmers now and then: the sprite again, added on top of itself.
      const shine = Math.sin(tick / 14 + b.x / 40)
      // Drawn again across the wrap when it is half off one edge.
      const xs = [
        b.x,
        ...(b.x < 16 ? [b.x + W] : b.x > W - 16 ? [b.x - W] : []),
      ]
      for (const x of xs) {
        const left = Math.round(x) - 16
        const top = Math.round(b.y) - 17
        const frame = MIRROR_FRAMES[up ? 0 : 1]
        drawSprite(g, frame, left, top, {
          anchor: 'topleft',
          flipX: b.facing < 0,
          alpha: 0.9,
        })
        if (shine > 0.6) {
          g.save()
          g.globalCompositeOperation = 'lighter'
          drawSprite(g, frame, left, top, {
            anchor: 'topleft',
            flipX: b.facing < 0,
            alpha: (shine - 0.6) * 0.8,
          })
          g.restore()
        }
      }
    }
  }
}
