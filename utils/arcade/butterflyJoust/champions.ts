// /utils/arcade/butterflyJoust/champions.ts
//
// The Four Gardens Tourney's champion bouts (conductor kr-arcade/t-048): a boss rider with phases
// at the end of each arena. Each champion runs on the game's dice through a small context the game
// hands it (the riders, the ledges, and what a hit, a hurt or a new rider means), so the bout
// stays inside the seeded 60 Hz simulation, and draws itself from shaded primitives.
//
//   Sir Bumbleton       a bumblebee knight whose long lance wins every level clash: get above
//                       him. At two thirds he calls a bee escort in formation; at one third he
//                       climbs to the ceiling and dives, and his shadow on the ledge is the tell.
//   The Dandelion Duchess floats on a dandelion clock; every bonk blows seed parachutes off it,
//                       and a seed that lands on a ledge sprouts a drifter. Pop them as they fall.
//                       Past half she puffs her cheeks and blows a gust.

import type { ArcadeSoundName } from '../sound'
import {
  INK,
  RAMPS,
  dropShadow,
  glow,
  rgba,
  shadedOrb,
  type Ramp,
} from '../snes'
import { CHAMPIONS, type ChampionId } from './arenas'
import { CEILING, POND_Y, W, onLedge, wrapDx, wrapX, type Ledge } from './field'
import type { RiderKind } from './roster'

/** What a champion sees of a rider. */
export type BoutRider = {
  x: number
  y: number
  vx: number
  vy: number
  facing: number
  invuln: number
  lunge: number
  seat: number
}

/** What a champion may do to the arena. */
export interface BoutCtx {
  rng(): number
  riders(): readonly BoutRider[]
  ledges(): readonly Ledge[]
  /** The rider loses the clash (a butterfly, unless still shimmering in). */
  hurt(r: BoutRider): void
  /** The rider lands a hit: points through the Air Combo, and a bounce up. */
  hit(r: BoutRider, points: number, x: number, y: number): void
  push(r: BoutRider, vx: number, vy: number): void
  spawn(kind: RiderKind, x: number, y: number): void
  burst(x: number, y: number, count: number, colour: string): void
  play(name: ArcadeSoundName): void
  say(text: string, sub?: string): void
}

export interface Champion {
  readonly id: ChampionId
  readonly name: string
  hp: number
  readonly maxHp: number
  x: number
  y: number
  /** Beaten (its leftovers may still be falling: see busy). */
  readonly done: boolean
  /** Something it left in the arena is still in play. */
  busy(): boolean
  update(ctx: BoutCtx): void
  /** A rider touching it or its retinue; true if the rider lost. */
  touch(ctx: BoutCtx, r: BoutRider): boolean
  /** Where the attract pilot should fly against it. */
  goal(r: BoutRider): { x: number; y: number; flee?: boolean }
  /** Its retinue, for the attract pilot to steer round. */
  threats(): readonly { x: number; y: number }[]
  render(g: CanvasRenderingContext2D, tick: number): void
}

function nearestRider(ctx: BoutCtx, x: number, y: number): BoutRider | null {
  let best: BoutRider | null = null
  let d = Infinity
  for (const r of ctx.riders()) {
    const e = Math.abs(wrapDx(x, r.x)) + Math.abs(r.y - y)
    if (e < d) {
      d = e
      best = r
    }
  }
  return best
}

const clampY = (y: number, top = CEILING + 22, bottom = POND_Y - 40) =>
  Math.max(top, Math.min(bottom, y))

// --- Sir Bumbleton ------------------------------------------------------------------------------

type Bee = { x: number; y: number; slot: number }

export const BUMBLETON = {
  hp: 9,
  /** Points a hit, and for a bee. */
  hitPoints: 1000,
  beePoints: 250,
  /** His body's half size, and how far his lance reaches past it. */
  halfW: 18,
  halfH: 13,
  lance: 14,
  stun: 40,
  /** After a hit he wheels away this long. */
  retreat: 150,
  /** How far he hangs back from a rider over him. */
  wary: 70,
  /** His cruising height at the ceiling in his last phase. */
  roof: CEILING + 12,
  /** He flies this far over his prey, and climbs this fast (a flap climbs faster). */
  over: 12,
  climb: 1,
  /** The dive: hover over the mark this long, plunge, then stick in the ledge this long. */
  aim: 100,
  /** The last stretch of the aim, when the mark stops following you. */
  lock: 45,
  dive: 4.6,
  stuck: 130,
} as const

export class Bumbleton implements Champion {
  readonly id = 'bumbleton' as const
  readonly name = CHAMPIONS.bumbleton.name
  hp: number = BUMBLETON.hp
  readonly maxHp: number = BUMBLETON.hp
  x = W / 2
  y = CEILING + 30
  facing = 1
  stun = 0
  t = 0
  mode: 'fly' | 'rise' | 'aim' | 'dive' | 'stuck' = 'fly'
  timer = 0
  mark = { x: W / 2, y: POND_Y }
  /** Wheeling away after a hit: ticks left. */
  retreat = 0
  bees: Bee[] = []
  beeWait = 0
  private lastPhase = 1

  get done() {
    return this.hp <= 0
  }

  phase(): 1 | 2 | 3 {
    return this.hp > 6 ? 1 : this.hp > 3 ? 2 : 3
  }

  busy() {
    return false
  }

  update(ctx: BoutCtx) {
    this.t++
    const phase = this.phase()
    if (phase !== this.lastPhase) {
      this.lastPhase = phase
      if (phase === 2) ctx.say('BEE ESCORT!', 'POP THEM FROM ABOVE')
      if (phase === 3) {
        // The escort peels off: it is just him and the dive now.
        for (const b of this.bees) ctx.burst(b.x, b.y, 6, RAMPS.gold[3])
        this.bees = []
        ctx.say('THE DIVE!', 'WATCH FOR HIS SHADOW')
      }
      this.mode = 'fly'
      this.timer = 0
    }
    if (this.stun > 0) {
      this.stun--
      this.y = clampY(this.y + 0.6)
      this.moveBees()
      return
    }
    const prey = nearestRider(ctx, this.x, this.y)
    if (phase === 3 && this.mode !== 'fly') {
      this.updateDive(ctx, prey)
    } else {
      // Just over his prey, lance first: he wins every level clash, so outclimb him. After a
      // hit he wheels away across the arena before he comes on again; in his last phase he
      // keeps to the ceiling between dives.
      if (prey) {
        const away = this.retreat > 0
        if (away) this.retreat--
        // Wary of a rider over him: he hangs back, so you have to come down and catch him.
        const wary = !away && prey.y < this.y - 8
        const side = Math.sign(wrapDx(prey.x, this.x)) || 1
        const tx = away
          ? wrapX(prey.x + W / 2)
          : wary
            ? wrapX(prey.x + side * BUMBLETON.wary)
            : prey.x
        const dx = wrapDx(this.x, tx)
        this.facing = away ? this.facing : Math.sign(dx) || this.facing
        // Closing in, he slows to line up his lance: the moment to climb over him.
        const near = !away && Math.abs(dx) < 48
        const speed = (away ? 2.4 : near && !wary ? 0.55 : 1.05) + 0.25 * phase
        this.x = wrapX(this.x + Math.max(-speed, Math.min(speed, dx * 0.05)))
        // In his last phase he keeps right up at the ceiling: no getting over him there.
        const top = phase === 3 ? BUMBLETON.roof : CEILING + 22
        const ty = phase === 3 || away ? top : prey.y - BUMBLETON.over
        const climb = BUMBLETON.climb + 0.15 * phase
        this.y = clampY(
          this.y + Math.max(-climb, Math.min(climb, (ty - this.y) * 0.06)),
          top,
        )
      }
      this.y += Math.sin(this.t / 9) * 0.5
      if (phase === 3 && ++this.timer > 70) {
        this.mode = 'rise'
        this.timer = 0
      }
    }
    if (phase === 2) this.updateBees(ctx)
    this.moveBees()
  }

  private updateDive(ctx: BoutCtx, prey: BoutRider | null) {
    this.timer++
    switch (this.mode) {
      case 'rise': {
        // Straight up to the ceiling first.
        this.y = Math.max(BUMBLETON.roof, this.y - 2.2)
        if (this.y <= BUMBLETON.roof && this.timer > 30) {
          this.mode = 'aim'
          this.timer = 0
          this.mark = this.landingUnder(ctx, this.x)
          ctx.play('warn')
        }
        return
      }
      case 'aim': {
        // Along the ceiling over his prey, then trembling still over his mark: his shadow on
        // the ledge below says where he will come down.
        if (prey && this.timer < BUMBLETON.aim - BUMBLETON.lock) {
          this.x = wrapX(
            this.x + Math.max(-2.4, Math.min(2.4, wrapDx(this.x, prey.x))),
          )
          this.mark = this.landingUnder(ctx, this.x)
        }
        if (this.timer > BUMBLETON.aim) {
          this.mode = 'dive'
          this.timer = 0
          ctx.play('boom')
        }
        return
      }
      case 'dive': {
        this.y += BUMBLETON.dive
        if (this.y + BUMBLETON.halfH >= this.mark.y) {
          this.y = this.mark.y - BUMBLETON.halfH
          this.mode = 'stuck'
          this.timer = 0
          ctx.burst(this.x, this.mark.y, 16, RAMPS.earth[3])
          ctx.play('pop')
        }
        return
      }
      case 'stuck': {
        if (this.timer > BUMBLETON.stuck) {
          this.mode = 'fly'
          this.timer = 0
        }
        return
      }
      default:
        return
    }
  }

  /** Where a dive from x lands: the first ledge top below, or just over the pond. */
  private landingUnder(ctx: BoutCtx, x: number): { x: number; y: number } {
    let y = POND_Y - 6
    for (const l of ctx.ledges()) {
      if (onLedge(l, x) && l.y > this.y + 20 && l.y < y) y = l.y
    }
    return { x, y }
  }

  private updateBees(ctx: BoutCtx) {
    if (this.bees.length) return
    if (this.beeWait > 0) {
      this.beeWait--
      return
    }
    // They buzz in from behind him, already in their V.
    for (let slot = 0; slot < 3; slot++) {
      const row = slot === 0 ? 1 : 2
      const side = slot === 0 ? 0 : slot === 1 ? -1 : 1
      this.bees.push({
        x: wrapX(this.x - this.facing * (26 * row + 30)),
        y: this.y + side * 18,
        slot,
      })
    }
    this.beeWait = 360
    ctx.play('warn')
  }

  private moveBees() {
    // A V formation trailing behind the knight.
    for (const b of this.bees) {
      const row = b.slot === 0 ? 1 : 2
      const side = b.slot === 0 ? 0 : b.slot === 1 ? -1 : 1
      const tx = wrapX(this.x - this.facing * (26 * row))
      const ty = this.y + side * 18 + Math.sin((this.t + b.slot * 20) / 7) * 3
      b.x = wrapX(b.x + wrapDx(b.x, tx) * 0.08)
      b.y += (ty - b.y) * 0.08
    }
  }

  touch(ctx: BoutCtx, r: BoutRider): boolean {
    for (let i = this.bees.length - 1; i >= 0; i--) {
      const b = this.bees[i]!
      if (Math.abs(wrapDx(r.x, b.x)) > 13 || Math.abs(b.y - r.y) > 12) continue
      if (b.y - r.y > 5) {
        this.bees.splice(i, 1)
        ctx.hit(r, BUMBLETON.beePoints, b.x, b.y - 10)
        ctx.burst(b.x, b.y, 8, RAMPS.gold[3])
      } else if (r.invuln <= 0) {
        ctx.hurt(r)
        return true
      }
    }
    if (this.stun > 0) return false
    const dx = wrapDx(this.x, r.x)
    // His lance reaches past him on the side he faces.
    const reach =
      Math.sign(dx) === this.facing && this.mode !== 'stuck'
        ? BUMBLETON.halfW + BUMBLETON.lance
        : BUMBLETON.halfW
    if (Math.abs(dx) > reach || Math.abs(r.y - this.y) > BUMBLETON.halfH + 5)
      return false
    if (this.y - r.y > 8) {
      // Over him: only his back counts, and his lance can't reach up.
      if (Math.abs(dx) >= BUMBLETON.halfW + 4 || this.mode === 'dive')
        return false
      this.hp--
      this.stun = BUMBLETON.stun
      this.retreat = BUMBLETON.retreat
      this.mode = 'fly'
      this.timer = 0
      ctx.hit(r, BUMBLETON.hitPoints, this.x, this.y - 22)
      ctx.burst(this.x, this.y, 18, RAMPS.gold[4])
      ctx.play('boom')
      return false
    }
    if (r.invuln > 0) return false
    if (this.mode === 'stuck') {
      // Lance stuck fast in the ledge, he can only shove you off.
      ctx.push(r, Math.sign(dx || 1) * 2.2, -0.5)
      return false
    }
    ctx.hurt(r)
    // A clean win: he wheels off to let the next butterfly in.
    this.retreat = BUMBLETON.retreat
    return true
  }

  threats() {
    return this.bees
  }

  goal(r: BoutRider) {
    if (this.mode === 'rise' || this.mode === 'aim' || this.mode === 'dive') {
      // Out from under the shadow.
      return {
        x: wrapX(this.mark.x + (wrapDx(this.mark.x, r.x) < 0 ? -56 : 56)),
        y: this.mark.y - 44,
        flee: true,
      }
    }
    // Cruising the ceiling in his last phase there is no way over him: keep clear till he sticks.
    if (this.phase() === 3 && this.mode === 'fly')
      return { x: wrapX(this.x + W / 2), y: 200, flee: true }
    return { x: this.x, y: this.y - 16 }
  }

  render(g: CanvasRenderingContext2D, tick: number) {
    if (this.mode === 'aim' || this.mode === 'dive') {
      // The tell: his shadow on the ledge below, darker as he comes.
      const k =
        this.mode === 'dive' ? 1 : Math.min(1, this.timer / BUMBLETON.aim)
      dropShadow(
        g,
        this.mark.x,
        this.mark.y,
        10 + 12 * k,
        2 + 2 * k,
        0.25 + 0.4 * k,
      )
      if (Math.floor(tick / 6) % 2 === 0) {
        g.fillStyle = rgba(RAMPS.ember[3], 0.8)
        g.fillRect(Math.round(this.mark.x) - 1, this.mark.y - 14, 2, 8)
        g.fillRect(Math.round(this.mark.x) - 1, this.mark.y - 4, 2, 2)
      }
    }
    for (const b of this.bees)
      drawBee(g, b.x, b.y, tick + b.slot * 5, this.facing)
    if (this.stun > 0 && Math.floor(tick / 4) % 2 === 0) return
    const shake = this.mode === 'aim' ? Math.sin(tick * 1.3) * 1.5 : 0
    drawKnightBee(
      g,
      this.x + shake,
      this.y,
      this.facing,
      tick,
      this.mode === 'stuck',
    )
    if (this.stun > 0) dizzy(g, this.x, this.y - 22, tick)
  }
}

function dizzy(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  tick: number,
) {
  for (let i = 0; i < 3; i++) {
    const a = tick / 8 + (i * Math.PI * 2) / 3
    g.fillStyle = RAMPS.gold[4]
    g.fillRect(
      Math.round(x + Math.cos(a) * 12),
      Math.round(y + Math.sin(a) * 3),
      2,
      2,
    )
  }
}

const BEE: Ramp = RAMPS.gold

function drawBee(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  tick: number,
  facing: number,
) {
  const up = Math.floor(tick / 3) % 2 === 0
  g.fillStyle = rgba('#ffffff', 0.7)
  g.beginPath()
  g.ellipse(x - facing * 1, y - (up ? 6 : 4), 4, up ? 3 : 2, 0, 0, Math.PI * 2)
  g.fill()
  shadedOrb(g, x, y, 4.5, BEE)
  g.fillStyle = INK
  g.fillRect(Math.round(x) - 1, Math.round(y) - 4, 2, 8)
  g.fillRect(Math.round(x + facing * 3), Math.round(y) - 1, 1, 1)
}

/** Sir Bumbleton: a striped bumblebee knight with a plumed helm and a long lance. */
function drawKnightBee(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: number,
  tick: number,
  stuck: boolean,
) {
  const cx = Math.round(x)
  const cy = Math.round(y)
  const f = facing
  glow(g, cx, cy, 34, RAMPS.gold[3], 0.25)
  // Wings: a fast blur.
  const up = Math.floor(tick / 2) % 2 === 0
  for (const [dx, k] of [
    [-6, 1],
    [2, 0.8],
  ] as const) {
    g.fillStyle = rgba(RAMPS.sky[4], 0.55)
    g.beginPath()
    g.ellipse(
      cx - f * dx,
      cy - (up ? 16 : 11),
      11 * k,
      up ? 7 : 4,
      f * -0.4,
      0,
      Math.PI * 2,
    )
    g.fill()
    g.strokeStyle = rgba(INK, 0.5)
    g.lineWidth = 1
    g.stroke()
  }
  // The lance, couched (stuck: point down in the ledge).
  g.save()
  g.lineCap = 'butt'
  const tipX = stuck
    ? cx + f * 14
    : cx + f * (BUMBLETON.halfW + BUMBLETON.lance + 6)
  const tipY = stuck ? cy + 20 : cy + 2
  for (const [w, c] of [
    [5, INK],
    [3, RAMPS.steel[3]],
    [1, RAMPS.steel[4]],
  ] as const) {
    g.lineWidth = w
    g.strokeStyle = c
    g.beginPath()
    g.moveTo(cx + f * 4, cy + 1)
    g.lineTo(tipX, tipY)
    g.stroke()
  }
  g.restore()
  shadedOrb(g, tipX, tipY, 2.5, RAMPS.gold)
  // The striped body.
  shadedOrb(g, cx - f * 5, cy + 2, 13, BEE)
  g.fillStyle = INK
  for (const sx of [-10, -3, 4]) {
    g.fillRect(cx - f * 5 + f * sx - 1, cy - 9, 3, 21)
  }
  g.fillRect(cx - f * 18, cy + 1, 3, 3)
  // The helmed head.
  shadedOrb(g, cx + f * 8, cy - 6, 8, RAMPS.steel)
  g.fillStyle = INK
  g.fillRect(cx + f * 8 - 1 + f * 2, cy - 7, f > 0 ? 6 : -6, 2)
  g.fillStyle = RAMPS.ember[3]
  g.fillRect(cx + f * 11 - 1, cy - 7, 2, 2)
  // The plume.
  for (let i = 0; i < 5; i++) {
    g.fillStyle = i % 2 ? RAMPS.pink[3] : RAMPS.ember[2]
    g.fillRect(
      cx + f * (6 - i * 3) - 1,
      cy - 15 - Math.round(Math.sin(i / 1.5) * 4),
      3,
      3,
    )
  }
}

// --- the Dandelion Duchess ----------------------------------------------------------------------

type Seed = { x: number; y: number; k: number }

export const DUCHESS = {
  hp: 6,
  hitPoints: 800,
  seedPoints: 200,
  seedsPerHit: 3,
  /** The seeds' slow fall. */
  fall: 0.42,
  stun: 45,
  /** Past half she blows a gust this often, after a cheek-puff tell. */
  gustEvery: 300,
  gustTell: 50,
  gust: 3.2,
} as const

export class Duchess implements Champion {
  readonly id = 'duchess' as const
  readonly name = CHAMPIONS.duchess.name
  hp: number = DUCHESS.hp
  readonly maxHp: number = DUCHESS.hp
  x = W / 2
  y = 100
  t = 0
  stun = 0
  seeds: Seed[] = []
  gust = 0

  get done() {
    return this.hp <= 0
  }

  busy() {
    return this.seeds.length > 0
  }

  radius() {
    return 10 + Math.max(0, this.hp) * 2.5
  }

  update(ctx: BoutCtx) {
    this.t++
    if (this.hp > 0) {
      // A slow figure of eight over the meadow.
      const speed = this.hp <= 3 ? 1.4 : 1
      this.x = wrapX(W / 2 + Math.sin((this.t * speed) / 170) * 150)
      this.y = 104 + Math.sin((this.t * speed) / 85) * 38
      if (this.stun > 0) this.stun--
      if (this.hp <= 3 && ++this.gust >= DUCHESS.gustEvery) {
        this.gust = 0
        for (const r of ctx.riders()) {
          const dx = wrapDx(this.x, r.x)
          if (Math.abs(dx) < 160)
            ctx.push(r, Math.sign(dx || 1) * DUCHESS.gust, -0.5)
        }
        ctx.play('boom')
      }
    }
    for (let i = this.seeds.length - 1; i >= 0; i--) {
      const s = this.seeds[i]!
      const prev = s.y
      s.y += DUCHESS.fall
      s.x = wrapX(s.x + Math.sin((this.t + s.k) / 18) * 0.5)
      const land = ctx
        .ledges()
        .find((l) => onLedge(l, s.x) && prev <= l.y - 4 && s.y >= l.y - 4)
      if (land) {
        // It sprouts into a drifter.
        this.seeds.splice(i, 1)
        ctx.spawn('drifter', s.x, land.y)
        ctx.burst(s.x, land.y - 4, 8, RAMPS.leaf[3])
      } else if (s.y > POND_Y) {
        this.seeds.splice(i, 1)
        ctx.burst(s.x, POND_Y, 6, RAMPS.water[3])
      }
    }
  }

  /** How puffed her cheeks are before a gust (0..1). */
  cheeks(): number {
    if (this.hp > 3) return 0
    const left = DUCHESS.gustEvery - this.gust
    return left < DUCHESS.gustTell ? 1 - left / DUCHESS.gustTell : 0
  }

  touch(ctx: BoutCtx, r: BoutRider): boolean {
    for (let i = this.seeds.length - 1; i >= 0; i--) {
      const s = this.seeds[i]!
      if (Math.abs(wrapDx(r.x, s.x)) < 11 && Math.abs(s.y - r.y) < 11) {
        this.seeds.splice(i, 1)
        ctx.hit(r, DUCHESS.seedPoints, s.x, s.y - 8)
        ctx.burst(s.x, s.y, 6, '#ffffff')
      }
    }
    if (this.hp <= 0 || this.stun > 0) return false
    const dx = wrapDx(this.x, r.x)
    const dy = r.y - this.y
    const reach = this.radius() + 8
    if (dx * dx + dy * dy > reach * reach) return false
    if (dy < -this.radius() * 0.45 && r.vy >= -0.5) {
      // A bonk on the clock: seeds blow off it.
      this.hp--
      this.stun = DUCHESS.stun
      for (let i = 0; i < DUCHESS.seedsPerHit; i++) {
        this.seeds.push({
          x: wrapX(this.x + (i - 1) * 16 + (ctx.rng() - 0.5) * 8),
          y: this.y + 4,
          k: Math.floor(ctx.rng() * 100),
        })
      }
      ctx.hit(r, DUCHESS.hitPoints, this.x, this.y - this.radius() - 10)
      ctx.burst(this.x, this.y, 14, '#ffffff')
      ctx.play('pop')
      if (this.hp === 3) ctx.say('SHE PUFFS HER CHEEKS!', 'A GUST IS COMING')
      return false
    }
    // The clock is soft: a bump from the side or below, and one seed shaken loose.
    ctx.push(r, Math.sign(dx || 1) * 2.4, dy > 0 ? 1.5 : -1)
    if (this.seeds.length < 6 && this.t % 2 === 0) {
      this.seeds.push({ x: this.x, y: this.y + this.radius() * 0.5, k: this.t })
    }
    ctx.play('blip')
    return false
  }

  threats() {
    return []
  }

  goal(r: BoutRider) {
    const seed = this.seeds
      .slice()
      .sort((a, b) => b.y - a.y)
      .find((s) => s.y < POND_Y - 30)
    if (seed && (this.hp <= 0 || Math.abs(wrapDx(r.x, seed.x)) < 150))
      return { x: seed.x, y: seed.y }
    return { x: this.x, y: this.y - this.radius() - 22 }
  }

  render(g: CanvasRenderingContext2D, tick: number) {
    for (const s of this.seeds) drawSeed(g, s.x, s.y, tick + s.k)
    if (this.hp <= 0) return
    const r = this.radius()
    const cx = Math.round(this.x)
    const cy = Math.round(this.y)
    const flash = this.stun > 0 && Math.floor(tick / 3) % 2 === 0
    glow(g, cx, cy, r + 18, '#ffffff', 0.25)
    // The stem below the clock.
    g.fillStyle = INK
    g.fillRect(cx - 2, cy + r - 2, 4, 22)
    g.fillStyle = RAMPS.leaf[2]
    g.fillRect(cx - 1, cy + r - 2, 2, 21)
    // The clock: a ring of tufts round a seed head.
    const tufts = Math.round(10 + this.hp * 3)
    for (let i = 0; i < tufts; i++) {
      const a = (i / tufts) * Math.PI * 2 + tick / 240
      const tx = cx + Math.cos(a) * r * 0.78
      const ty = cy + Math.sin(a) * r * 0.78
      g.strokeStyle = rgba(RAMPS.steel[3], 0.8)
      g.lineWidth = 1
      g.beginPath()
      g.moveTo(cx, cy)
      g.lineTo(tx, ty)
      g.stroke()
      shadedOrb(
        g,
        tx,
        ty,
        Math.max(3, r * 0.26),
        flash ? RAMPS.gold : RAMPS.cream,
        {
          outline: rgba(INK, 0.6),
          glint: false,
        },
      )
    }
    shadedOrb(g, cx, cy, Math.max(4, r * 0.3), RAMPS.earth)
    // The Duchess, riding side-saddle on top, crowned, cheeks puffing before a gust.
    const top = cy - r - 2
    shadedOrb(g, cx, top - 8, 7, RAMPS.purple)
    g.fillStyle = INK
    g.fillRect(cx - 3, top - 10, 2, 3)
    g.fillRect(cx + 2, top - 10, 2, 3)
    const puff = this.cheeks()
    if (puff > 0) {
      shadedOrb(g, cx - 5, top - 6, 2 + puff * 2, RAMPS.pink, { glint: false })
      shadedOrb(g, cx + 5, top - 6, 2 + puff * 2, RAMPS.pink, { glint: false })
    }
    g.fillStyle = INK
    g.fillRect(cx - 6, top - 19, 13, 4)
    g.fillStyle = RAMPS.gold[3]
    g.fillRect(cx - 5, top - 18, 11, 2)
    g.fillRect(cx - 5, top - 21, 2, 3)
    g.fillRect(cx - 1, top - 22, 2, 4)
    g.fillRect(cx + 3, top - 21, 2, 3)
    g.fillStyle = RAMPS.pink[3]
    g.fillRect(cx - 1, top - 18, 2, 1)
    // Antennae.
    g.fillStyle = INK
    g.fillRect(cx - 5, top - 25, 1, 4)
    g.fillRect(cx + 5, top - 25, 1, 4)
  }
}

/** A dandelion seed on its little parachute. */
function drawSeed(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  k: number,
) {
  const cx = Math.round(x)
  const cy = Math.round(y)
  const sway = Math.round(Math.sin(k / 18) * 1.5)
  g.fillStyle = INK
  g.fillRect(cx - 5 + sway, cy - 8, 11, 3)
  g.fillRect(cx - 1, cy - 6, 3, 9)
  g.fillStyle = '#ffffff'
  g.fillRect(cx - 4 + sway, cy - 7, 9, 1)
  for (let i = -4; i <= 4; i += 2) g.fillRect(cx + i + sway, cy - 8, 1, 1)
  g.fillStyle = RAMPS.cream[2]
  g.fillRect(cx, cy - 5, 1, 6)
  g.fillStyle = RAMPS.earth[2]
  g.fillRect(cx - 1, cy + 1, 3, 2)
}

/** A champion for its id, fresh for its bout. */
export function createChampion(id: ChampionId): Champion {
  return id === 'bumbleton' ? new Bumbleton() : new Duchess()
}
