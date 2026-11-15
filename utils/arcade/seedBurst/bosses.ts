// /utils/arcade/seedBurst/bosses.ts
//
// Seed Burst's season bosses (conductor kr-arcade/t-137, depth-pass CABINETS.md section 24):
//
//   Old Bramblebeard (Spring), a walking thorn hedge three tiles wide.
//     1. Strolls the plot dropping bramble hedges behind it; every few steps it stops and roots,
//        and its four root tiles glow: bloom them (three hits).
//     2. Roots in the centre and, after the row rustles (the tell), sprouts a bramble line across
//        that whole row; its roots glow after each sprout (three hits).
//     3. Uproots and charges down lanes after a stomp (the tell); bloom its back as it passes or
//        while it catches its breath (two hits). It settles into a flowering rose bush.
//   Hothouse Hector (Summer), a heating robot that has overheated and taken over the glasshouse.
//     1. Rolls along the top row firing steam down a column once its gauge needle swings to it (the
//        tell); bloom the four valve tiles to vent him.
//     2. Docks at the bottom of the channels and switches them on: ride pods into him on the water
//        while his steam ring (with its own hiss tell) keeps you back (three hits).
//     3. Hops about the plot and lands with a shockwave (a shadow marks the spot); bloom his open
//        boiler hatch after each landing (three hits). He ends up a friendly sprinkler.
//
// A boss owns its moves, its telegraphs and its drawing; the cabinet asks it which tiles are its
// body (solid, and a bump bonks), which are weak, which are about to be dangerous, and tells it
// about every bloom.

import { drawText } from '../font'
import {
  INK,
  RAMPS,
  bevel,
  drawSprite,
  dropShadow,
  glow,
  pixelSprite,
  rgba,
  shadedOrb,
} from '../snes'
import type { PixelSprite } from '../snes'
import type { ArcadeSoundName } from '../sound'
import type { BossKind } from './plots'

const TILE = 16
const HUD_H = 24

export type Tile = { x: number; y: number }

export type BossHost = {
  rng: () => number
  /** Ground a boss can stand on: inside the wall and not stone. */
  ground(x: number, y: number): boolean
  /** Ground with nothing on it: no hedge, pod, gardener or pickup. */
  free(x: number, y: number): boolean
  hedge(x: number, y: number): boolean
  podAt(x: number, y: number): boolean
  /** The tiles of the gardeners in play. */
  gardeners(): Tile[]
  plantHedge(x: number, y: number): void
  clearHedge(x: number, y: number): void
  /** Bonks any gardener on (x, y) who is not protected. */
  bonkAt(x: number, y: number, why: string): void
  setChannels(on: boolean): void
  sound(name: ArcadeSoundName): void
  say(text: string, sub: string): void
}

export interface Boss {
  readonly kind: BossKind
  readonly name: string
  /** Hits still to land, over all phases. */
  readonly hitsLeft: number
  readonly maxHits: number
  readonly phase: number
  /** Beaten and done celebrating: the plot is clear. */
  readonly done: boolean
  update(host: BossHost): void
  /** Solid tiles; touching one bonks. */
  body(): Tile[]
  /** Tiles a bloom must cover to hurt it right now. */
  weak(): Tile[]
  /** Tiles about to be dangerous (the telegraph), for drawing and for the attract pilot. */
  danger(): Tile[]
  /** A bloom of burst `chain` on (x, y). */
  bloom(x: number, y: number, chain: object, host: BossHost): void
  /** Valve tiles still to vent (Hector's first phase). */
  ventsLeft?(): Tile[]
  /** Telegraphs on the ground, drawn under everything that walks. */
  renderUnder(g: CanvasRenderingContext2D, tick: number): void
  render(g: CanvasRenderingContext2D, tick: number): void
}

const DIRS: readonly Tile[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
]
const near = (from: Tile, tiles: Tile[]): Tile | null => {
  let best: Tile | null = null
  let d = Infinity
  for (const t of tiles) {
    const e = Math.abs(t.x - from.x) + Math.abs(t.y - from.y)
    if (e < d) {
      d = e
      best = t
    }
  }
  return best
}
const centre = (t: Tile) => ({
  x: t.x * TILE + TILE / 2,
  y: HUD_H + t.y * TILE + TILE / 2,
})

/** A pulsing telegraph over each tile. */
function markTiles(
  g: CanvasRenderingContext2D,
  tiles: Tile[],
  tick: number,
  colour: string,
) {
  const a = 0.25 + 0.2 * Math.sin(tick / 3)
  g.save()
  for (const t of tiles) {
    const px = t.x * TILE
    const py = HUD_H + t.y * TILE
    g.fillStyle = rgba(colour, a)
    g.fillRect(px + 1, py + 1, TILE - 2, TILE - 2)
    g.fillStyle = rgba(colour, a + 0.3)
    g.fillRect(px + 1, py + 1, TILE - 2, 1)
    g.fillRect(px + 1, py + TILE - 2, TILE - 2, 1)
  }
  g.restore()
}

function glowTiles(g: CanvasRenderingContext2D, tiles: Tile[], tick: number) {
  for (const t of tiles) {
    const c = centre(t)
    glow(g, c.x, c.y, 11, RAMPS.gold[3], 0.45 + 0.25 * Math.sin(tick / 4))
    g.save()
    g.strokeStyle = rgba(RAMPS.gold[4], 0.9)
    g.lineWidth = 1
    g.strokeRect(t.x * TILE + 2.5, HUD_H + t.y * TILE + 2.5, TILE - 5, TILE - 5)
    g.restore()
  }
}

// --- Old Bramblebeard ----------------------------------------------------------------------------

/** A great thorny hedge with a grumpy face and a bramble beard, lit from the upper left. */
function bramblebeardSprite(rose: boolean): PixelSprite {
  const w = 46
  const h = 24
  const clumps: [number, number, number][] = [
    [8, 10, 8],
    [17, 7, 8],
    [28, 7, 8],
    [38, 10, 8],
    [23, 13, 10],
    [12, 16, 7],
    [34, 16, 7],
  ]
  const rows: string[] = []
  for (let y = 0; y < h; y++) {
    let row = ''
    for (let x = 0; x < w; x++) {
      let ch = '.'
      for (const [cx, cy, r] of clumps) {
        const nx = (x + 0.5 - cx) / r
        const ny = (y + 0.5 - cy) / r
        const d = Math.hypot(nx, ny)
        if (d > 1) continue
        const noise = (((x * 37 + y * 61) ^ (x * y * 13)) % 7) / 7 - 0.45
        const lit = -(nx + ny) * 0.6 + (1 - d) * 0.2 + noise * 0.35 - 0.12
        ch =
          lit > 0.6
            ? 'H'
            : lit > 0.2
              ? 'L'
              : lit > -0.2
                ? 'l'
                : lit > -0.5
                  ? 'd'
                  : 'D'
        if (d > 0.86 && (x * 3 + y * 5) % 7 === 0) ch = 't'
        if (rose && lit > 0 && (x * 5 + y * 3) % 9 === 0) ch = 'p'
        if (rose && lit > 0.1 && (x * 7 + y * 2) % 11 === 0) ch = 'P'
      }
      row += ch
    }
    rows.push(row)
  }
  const put = (x: number, y: number, s: string) => {
    const r = rows[y]!
    rows[y] = r.slice(0, x) + s + r.slice(x + s.length)
  }
  if (!rose) {
    // Two cross eyes under heavy brows, and a scraggly bramble beard.
    put(15, 8, 'kkkk')
    put(27, 8, 'kkkk')
    put(16, 9, 'WWk')
    put(27, 9, 'kWW')
    put(16, 10, 'WWW')
    put(27, 10, 'WWW')
    put(20, 13, 'kkkkkk')
    for (let y = 14; y < 21; y++)
      put(18 + ((y * 3) % 3), y, y % 2 ? 'bBbBbBbB' : 'BbBbBbBb')
  } else {
    put(16, 9, 'kk')
    put(28, 9, 'kk')
    put(20, 13, 'k....k')
    put(21, 14, 'kkkk')
  }
  return pixelSprite(rows, {
    H: RAMPS.leaf[4],
    L: RAMPS.leaf[3],
    l: RAMPS.leaf[2],
    d: RAMPS.leaf[1],
    D: RAMPS.leaf[0],
    t: RAMPS.ember[1],
    W: '#ffffff',
    k: INK,
    b: RAMPS.earth[1],
    B: RAMPS.earth[2],
    p: RAMPS.pink[3],
    P: RAMPS.pink[2],
  })
}
const BRAMBLEBEARD = bramblebeardSprite(false)
const ROSE_BUSH = bramblebeardSprite(true)

const BB_HITS = [3, 3, 2] as const
const BB_STEP = 28
const BB_CHARGE_STEP = 8
const BB_ROOT = 150
const BB_ROW_EVERY = 210
const BB_ROW_TELL = 70
const BB_STOMP = 45
const BB_MAX_BRAMBLES = 14
const FLINCH = 45
const WON_TICKS = 150

type BBMode =
  | 'walk'
  | 'root'
  | 'centre'
  | 'wait'
  | 'rustle'
  | 'stomp'
  | 'charge'
  | 'rest'
  | 'won'

export class Bramblebeard implements Boss {
  readonly kind = 'bramblebeard' as const
  readonly name = 'OLD BRAMBLEBEARD'
  readonly maxHits = BB_HITS[0] + BB_HITS[1] + BB_HITS[2]
  phase = 1
  hitsLeft = this.maxHits
  done = false
  private x: number
  private y: number
  private nx: number
  private ny: number
  private p = 0
  private mode: BBMode = 'walk'
  private timer = 60
  private steps = 0
  private phaseHits: number = BB_HITS[0]
  private flinch = 0
  private lastChain: object | null = null
  private brambles = 0
  private row = -1
  private dir: Tile = { x: 1, y: 0 }

  constructor(x: number, y: number) {
    this.x = this.nx = x
    this.y = this.ny = y
  }

  private fits(x: number, y: number, host: BossHost): boolean {
    for (let dx = -1; dx <= 1; dx++)
      if (!host.ground(x + dx, y) || host.podAt(x + dx, y)) return false
    return true
  }

  private here(): Tile {
    return this.p < 0.5 ? { x: this.x, y: this.y } : { x: this.nx, y: this.ny }
  }

  body(): Tile[] {
    if (this.mode === 'won') return []
    const out: Tile[] = []
    for (const at of [
      { x: this.x, y: this.y },
      { x: this.nx, y: this.ny },
    ])
      for (let dx = -1; dx <= 1; dx++)
        if (!out.some((t) => t.x === at.x + dx && t.y === at.y))
          out.push({ x: at.x + dx, y: at.y })
    return out
  }

  private roots(): Tile[] {
    const h = this.here()
    return [
      { x: h.x - 1, y: h.y - 1 },
      { x: h.x + 1, y: h.y - 1 },
      { x: h.x - 1, y: h.y + 1 },
      { x: h.x + 1, y: h.y + 1 },
    ]
  }

  private back(): Tile[] {
    const h = this.here()
    if (this.dir.x) return [{ x: h.x - this.dir.x * 2, y: h.y }]
    return [-1, 0, 1].map((dx) => ({ x: h.x + dx, y: h.y - this.dir.y }))
  }

  weak(): Tile[] {
    if (this.flinch > 0) return []
    if (
      this.mode === 'root' ||
      (this.phase === 2 &&
        this.mode === 'wait' &&
        this.timer > BB_ROW_EVERY - BB_ROOT)
    )
      return this.roots()
    if (this.phase === 3 && (this.mode === 'charge' || this.mode === 'rest'))
      return this.back()
    return []
  }

  danger(): Tile[] {
    if (this.mode === 'rustle') {
      const out: Tile[] = []
      for (let x = 1; x < 14; x++) out.push({ x, y: this.row })
      return out
    }
    if (this.mode === 'stomp' || this.mode === 'charge') {
      const out: Tile[] = []
      const h = this.here()
      for (let r = 1; r < 14; r++) {
        if (this.dir.x) {
          const x = h.x + this.dir.x * (r + 1)
          if (x <= 0 || x >= 14) break
          out.push({ x, y: h.y })
        } else {
          const y = h.y + this.dir.y * r
          if (y <= 0 || y >= 12) break
          for (let dx = -1; dx <= 1; dx++) out.push({ x: h.x + dx, y })
        }
      }
      return out
    }
    return []
  }

  /** Starts a step toward (x + d.x, y + d.y), trampling hedges it walks into. */
  private stepTo(d: Tile, host: BossHost): boolean {
    const tx = this.x + d.x
    const ty = this.y + d.y
    if (!this.fits(tx, ty, host)) return false
    for (let dx = -1; dx <= 1; dx++)
      if (host.hedge(tx + dx, ty)) host.clearHedge(tx + dx, ty)
    this.nx = tx
    this.ny = ty
    this.p = 0
    this.dir = d
    return true
  }

  private arrive(host: BossHost, dropBramble: boolean) {
    const ox = this.x
    const oy = this.y
    this.x = this.nx
    this.y = this.ny
    this.p = 0
    if (!dropBramble || this.brambles >= BB_MAX_BRAMBLES) return
    // Drop a bramble on the tile it just left, if no gardener is right there.
    const t =
      this.dir.x !== 0 ? { x: ox - this.dir.x, y: oy } : { x: ox, y: oy }
    const crowded = host
      .gardeners()
      .some((g) => Math.abs(g.x - t.x) + Math.abs(g.y - t.y) <= 1)
    if (!crowded && host.free(t.x, t.y)) {
      host.plantHedge(t.x, t.y)
      this.brambles++
    }
  }

  update(host: BossHost) {
    if (this.flinch > 0) this.flinch--
    for (const t of this.body())
      host.bonkAt(t.x, t.y, 'PRICKED BY OLD BRAMBLEBEARD')
    const moving = this.nx !== this.x || this.ny !== this.y
    if (this.mode === 'won') {
      if (--this.timer <= 0) this.done = true
      return
    }
    if (this.mode === 'walk' || this.mode === 'centre') {
      if (moving) {
        this.p += 1 / BB_STEP
        if (this.p >= 1) {
          this.arrive(host, this.mode === 'walk')
          this.steps++
          if (this.mode === 'walk' && this.steps % 5 === 0) {
            this.mode = 'root'
            this.timer = BB_ROOT
            host.sound('warn')
          }
        }
        return
      }
      if (this.mode === 'centre' && this.x === 7 && this.y === 6) {
        this.mode = 'wait'
        this.timer = BB_ROW_EVERY
        return
      }
      const goal =
        this.mode === 'centre'
          ? { x: 7, y: 6 }
          : near({ x: this.x, y: this.y }, host.gardeners())
      const ways = [...DIRS]
      const toward = goal
        ? ways
            .slice()
            .sort(
              (a, b) =>
                Math.abs(this.x + a.x - goal.x) +
                Math.abs(this.y + a.y - goal.y) -
                (Math.abs(this.x + b.x - goal.x) +
                  Math.abs(this.y + b.y - goal.y)),
            )
        : ways
      const order =
        this.mode === 'centre' || host.rng() < 0.6
          ? toward
          : [ways[Math.floor(host.rng() * 4)]!, ...toward]
      for (const d of order) if (this.stepTo(d, host)) return
      return
    }
    if (this.mode === 'root') {
      if (--this.timer <= 0) this.mode = 'walk'
      return
    }
    if (this.mode === 'wait') {
      if (--this.timer > 0) return
      // Pick the row of the gardener nearest it (never its own), and rustle it.
      const g = near({ x: this.x, y: this.y }, host.gardeners())
      let row = g ? g.y : 3
      if (row === this.y) row = row > 1 ? row - 1 : row + 1
      this.row = Math.max(1, Math.min(11, row))
      this.mode = 'rustle'
      this.timer = BB_ROW_TELL
      host.sound('warn')
      return
    }
    if (this.mode === 'rustle') {
      if (--this.timer > 0) return
      for (let x = 1; x < 14; x++) {
        host.bonkAt(x, this.row, 'CAUGHT IN A BRAMBLE LINE')
        if (host.free(x, this.row)) host.plantHedge(x, this.row)
      }
      host.sound('boom')
      this.mode = 'wait'
      this.timer = BB_ROW_EVERY
      return
    }
    if (this.mode === 'rest') {
      if (--this.timer > 0) return
      const g = near(this.here(), host.gardeners())
      const dy = g ? g.y - this.y : 0
      const dx = g ? g.x - this.x : 1
      const choices: Tile[] =
        Math.abs(dy) <= 1
          ? [
              { x: Math.sign(dx) || 1, y: 0 },
              { x: 0, y: dy >= 0 ? 1 : -1 },
            ]
          : [
              { x: 0, y: Math.sign(dy) },
              { x: Math.sign(dx) || 1, y: 0 },
            ]
      choices.push({ x: -choices[0]!.x, y: -choices[0]!.y })
      const d = choices.find((c) => this.fits(this.x + c.x, this.y + c.y, host))
      if (!d) {
        this.timer = 30
        return
      }
      this.dir = d
      this.mode = 'stomp'
      this.timer = BB_STOMP
      host.sound('warn')
      return
    }
    if (this.mode === 'stomp') {
      if (--this.timer <= 0) this.mode = 'charge'
      return
    }
    if (this.mode === 'charge') {
      if (moving) {
        this.p += 1 / BB_CHARGE_STEP
        if (this.p >= 1) this.arrive(host, false)
        return
      }
      if (!this.stepTo(this.dir, host)) {
        this.mode = 'rest'
        this.timer = 100
        host.sound('boom')
      }
    }
  }

  bloom(x: number, y: number, chain: object, host: BossHost) {
    if (chain === this.lastChain) return
    if (!this.weak().some((t) => t.x === x && t.y === y)) return
    this.lastChain = chain
    this.flinch = FLINCH
    this.hitsLeft--
    this.phaseHits--
    host.sound('pop')
    if (this.phaseHits > 0) {
      if (this.mode === 'root') this.mode = 'walk'
      return
    }
    if (this.phase === 1) {
      this.phase = 2
      this.phaseHits = BB_HITS[1]
      this.mode = 'centre'
      host.say('HE ROOTS IN THE MIDDLE', 'WATCH FOR THE ROW THAT RUSTLES')
    } else if (this.phase === 2) {
      this.phase = 3
      this.phaseHits = BB_HITS[2]
      this.mode = 'rest'
      this.timer = 60
      host.say('HE UPROOTS!', 'STEP ASIDE AND BLOOM HIS BACK')
    } else {
      this.mode = 'won'
      this.timer = WON_TICKS
      this.nx = this.x
      this.ny = this.y
      this.p = 0
      host.sound('level')
      host.say('A ROSE BUSH!', 'OLD BRAMBLEBEARD IS IN BLOOM')
    }
  }

  renderUnder(g: CanvasRenderingContext2D, tick: number) {
    const danger = this.danger()
    if (danger.length)
      markTiles(
        g,
        danger,
        tick,
        this.mode === 'rustle' ? RAMPS.leaf[3] : RAMPS.ember[2],
      )
    glowTiles(g, this.weak(), tick)
  }

  render(g: CanvasRenderingContext2D, tick: number) {
    const cx = (this.x + (this.nx - this.x) * this.p) * TILE + TILE / 2
    const cy = HUD_H + (this.y + (this.ny - this.y) * this.p) * TILE + TILE / 2
    const won = this.mode === 'won'
    const shake =
      this.mode === 'stomp' || this.mode === 'rustle'
        ? Math.floor(tick / 2) % 2
          ? 1
          : -1
        : 0
    const bob = this.mode === 'walk' ? Math.round(Math.sin(tick / 5)) : 0
    dropShadow(g, cx + 1, cy + 7, 24, 3, 0.4)
    if (this.flinch > 0 && Math.floor(tick / 3) % 2) return
    drawSprite(g, won ? ROSE_BUSH : BRAMBLEBEARD, cx + shake, cy + 8 + bob, {
      anchor: 'feet',
      flipX: this.dir.x < 0,
    })
    if (this.mode === 'stomp')
      drawText(g, '!', cx, cy - 26, {
        align: 'center',
        color: RAMPS.ember[3],
        outline: INK,
      })
  }
}

// --- Hothouse Hector ----------------------------------------------------------------------------

const HECTOR_VENTS = 4
const HECTOR_DOCK = { x: 7, y: 9 }
const HECTOR_TRACK = [4, 10] as const
const HC_STEAM_EVERY = 150
const HC_STEAM_TELL = 60
const HC_STEAM = 36
const HC_RING_EVERY = 200
const HC_RING_TELL = 60
const HC_HOP_TELL = 50
const HC_AIR = 30
const HC_HATCH = 110
const HC_HITS = [3, 3] as const

type HCMode =
  | 'roll'
  | 'gauge'
  | 'steam'
  | 'dock'
  | 'ring-wait'
  | 'ring-tell'
  | 'ring'
  | 'rest'
  | 'hop-tell'
  | 'air'
  | 'hatch'
  | 'won'

export class Hector implements Boss {
  readonly kind = 'hector' as const
  readonly name = 'HOTHOUSE HECTOR'
  readonly maxHits = HECTOR_VENTS + HC_HITS[0] + HC_HITS[1]
  phase = 1
  hitsLeft = this.maxHits
  done = false
  private px: number
  private py: number
  private vx = 0.45
  private mode: HCMode = 'roll'
  private timer = HC_STEAM_EVERY
  private column = -1
  private from = { x: 0, y: 0 }
  private to: Tile = { x: 0, y: 0 }
  private flinch = 0
  private lastChain: object | null = null
  private phaseHits = 0
  /** The valves still to vent (phase 1). */
  private valves: Tile[]

  constructor(x: number, y: number, valves: Tile[]) {
    const c = centre({ x, y })
    this.px = c.x
    this.py = c.y
    this.valves = valves.slice()
  }

  private tile(): Tile {
    return {
      x: Math.round((this.px - TILE / 2) / TILE),
      y: Math.round((this.py - HUD_H - TILE / 2) / TILE),
    }
  }

  body(): Tile[] {
    if (this.mode === 'won' || this.mode === 'air' || this.mode === 'dock')
      return []
    return [this.tile()]
  }

  weak(): Tile[] {
    if (this.flinch > 0 || this.mode === 'won') return []
    if (this.phase === 1) return this.valves.slice()
    if (this.phase === 2 && this.mode !== 'dock') return [this.tile()]
    if (this.phase === 3 && this.mode === 'hatch') return [this.tile()]
    return []
  }

  /** Valves still to vent, for drawing them. */
  ventsLeft(): Tile[] {
    return this.phase === 1 ? this.valves.slice() : []
  }

  private ring(): Tile[] {
    const out: Tile[] = []
    const t = this.tile()
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++)
        if (Math.abs(dx) + Math.abs(dy) <= 2 && (dx || dy))
          out.push({ x: t.x + dx, y: t.y + dy })
    return out
  }

  private columnTiles(host?: BossHost): Tile[] {
    const out: Tile[] = []
    for (let y = 2; y < 12; y++) {
      if (host && !host.ground(this.column, y)) break
      out.push({ x: this.column, y })
    }
    return out
  }

  private landing(): Tile[] {
    return [
      this.to,
      ...DIRS.map((d) => ({ x: this.to.x + d.x, y: this.to.y + d.y })),
    ]
  }

  danger(): Tile[] {
    if (this.mode === 'gauge' || this.mode === 'steam')
      return this.columnTiles()
    if (this.mode === 'ring-tell' || this.mode === 'ring') return this.ring()
    if (this.mode === 'hop-tell' || this.mode === 'air') return this.landing()
    return []
  }

  update(host: BossHost) {
    if (this.flinch > 0) this.flinch--
    for (const t of this.body()) host.bonkAt(t.x, t.y, 'BUMPED HOTHOUSE HECTOR')
    switch (this.mode) {
      case 'won':
        if (--this.timer <= 0) this.done = true
        return
      case 'roll':
      case 'gauge':
      case 'steam': {
        if (this.mode === 'roll') {
          this.px += this.vx
          const lo = HECTOR_TRACK[0] * TILE + TILE / 2
          const hi = HECTOR_TRACK[1] * TILE + TILE / 2
          if (this.px <= lo || this.px >= hi) {
            this.px = Math.max(lo, Math.min(hi, this.px))
            this.vx = -this.vx
          }
          if (--this.timer <= 0) {
            // The gauge needle swings to the column of the nearest gardener (the tell).
            const g = near(this.tile(), host.gardeners())
            let c = g ? g.x : 7
            if (c % 2 === 0) c += c < 7 ? 1 : -1
            this.column = Math.max(1, Math.min(13, c))
            this.mode = 'gauge'
            this.timer = HC_STEAM_TELL
            host.sound('warn')
          }
        } else if (this.mode === 'gauge') {
          if (--this.timer <= 0) {
            this.mode = 'steam'
            this.timer = HC_STEAM
            host.sound('boom')
          }
        } else {
          for (const t of this.columnTiles(host))
            host.bonkAt(t.x, t.y, 'SCALDED BY STEAM')
          if (--this.timer <= 0) {
            this.mode = 'roll'
            this.timer = HC_STEAM_EVERY
          }
        }
        return
      }
      case 'dock': {
        const goal = centre(HECTOR_DOCK)
        const dx = goal.x - this.px
        const dy = goal.y - this.py
        const d = Math.hypot(dx, dy)
        if (d < 1.2) {
          this.px = goal.x
          this.py = goal.y
          this.mode = 'ring-wait'
          this.timer = HC_RING_EVERY
          return
        }
        this.px += (dx / d) * 1.2
        this.py += (dy / d) * 1.2
        return
      }
      case 'ring-wait':
        if (--this.timer <= 0) {
          this.mode = 'ring-tell'
          this.timer = HC_RING_TELL
          host.sound('warn')
        }
        return
      case 'ring-tell':
        if (--this.timer <= 0) {
          this.mode = 'ring'
          this.timer = 30
          host.sound('boom')
        }
        return
      case 'ring':
        for (const t of this.ring()) host.bonkAt(t.x, t.y, 'SCALDED BY STEAM')
        if (--this.timer <= 0) {
          this.mode = 'ring-wait'
          this.timer = HC_RING_EVERY
        }
        return
      case 'rest': {
        if (--this.timer > 0) return
        const g = near(this.tile(), host.gardeners())
        const target = g ?? { x: 7, y: 6 }
        const spots: Tile[] = []
        for (let y = 1; y < 12; y++)
          for (let x = 1; x < 14; x++) {
            const d = Math.abs(x - target.x) + Math.abs(y - target.y)
            if (d >= 2 && d <= 3 && host.ground(x, y) && !host.podAt(x, y))
              spots.push({ x, y })
          }
        if (!spots.length) {
          this.timer = 30
          return
        }
        this.to = spots[Math.floor(host.rng() * spots.length)]!
        this.mode = 'hop-tell'
        this.timer = HC_HOP_TELL
        host.sound('warn')
        return
      }
      case 'hop-tell':
        if (--this.timer <= 0) {
          this.from = { x: this.px, y: this.py }
          this.mode = 'air'
          this.timer = HC_AIR
        }
        return
      case 'air': {
        this.timer--
        const t = 1 - this.timer / HC_AIR
        const goal = centre(this.to)
        this.px = this.from.x + (goal.x - this.from.x) * t
        this.py = this.from.y + (goal.y - this.from.y) * t
        if (this.timer <= 0) {
          for (const l of this.landing()) {
            host.bonkAt(l.x, l.y, 'SHAKEN BY THE SHOCKWAVE')
            if (host.hedge(l.x, l.y)) host.clearHedge(l.x, l.y)
          }
          host.sound('boom')
          this.mode = 'hatch'
          this.timer = HC_HATCH
        }
        return
      }
      case 'hatch':
        if (--this.timer <= 0) {
          this.mode = 'rest'
          this.timer = 40
        }
        return
    }
  }

  bloom(x: number, y: number, chain: object, host: BossHost) {
    if (this.mode === 'won') return
    if (this.phase === 1) {
      const i = this.valves.findIndex((v) => v.x === x && v.y === y)
      if (i < 0) return
      this.valves.splice(i, 1)
      this.hitsLeft--
      host.sound('pop')
      if (this.valves.length) {
        host.say('HISSS!', `${this.valves.length} VALVES TO GO`)
        return
      }
      this.phase = 2
      this.phaseHits = HC_HITS[0]
      this.mode = 'dock'
      host.setChannels(true)
      host.say('THE CHANNELS ARE ON!', 'RIDE PODS DOWN THE WATER INTO HIM')
      return
    }
    if (chain === this.lastChain || this.flinch > 0) return
    if (!this.weak().some((t) => t.x === x && t.y === y)) return
    this.lastChain = chain
    this.flinch = FLINCH
    this.hitsLeft--
    this.phaseHits--
    host.sound('pop')
    if (this.phaseHits > 0) {
      if (this.mode === 'hatch') {
        this.mode = 'rest'
        this.timer = 50
      }
      return
    }
    if (this.phase === 2) {
      this.phase = 3
      this.phaseHits = HC_HITS[1]
      this.mode = 'rest'
      this.timer = 60
      host.setChannels(false)
      host.say('HE STARTS TO HOP!', 'BLOOM HIS HATCH AFTER EACH LANDING')
      return
    }
    this.mode = 'won'
    this.timer = WON_TICKS
    host.sound('level')
    host.say('ALL COOLED DOWN!', 'HECTOR IS A FRIENDLY SPRINKLER NOW')
  }

  renderUnder(g: CanvasRenderingContext2D, tick: number) {
    const danger = this.danger()
    if (danger.length) markTiles(g, danger, tick, RAMPS.ember[2])
    if (this.mode === 'steam' || this.mode === 'ring') {
      g.save()
      g.globalAlpha = 0.6
      for (const t of danger) {
        const c = centre(t)
        for (let i = 0; i < 3; i++)
          shadedOrb(
            g,
            c.x + Math.sin(tick / 3 + i * 2 + t.y) * 4,
            c.y - ((tick + i * 5) % 12),
            3 + i,
            RAMPS.steel,
            { outline: null, glint: false },
          )
      }
      g.restore()
    }
    glowTiles(g, this.weak(), tick)
  }

  render(g: CanvasRenderingContext2D, tick: number) {
    const air = this.mode === 'air'
    const lift = air ? Math.sin((1 - this.timer / HC_AIR) * Math.PI) * 18 : 0
    const x = Math.round(this.px)
    const y = Math.round(this.py - lift)
    dropShadow(g, this.px, this.py + 7, air ? 6 : 9, 2, 0.4)
    if (this.flinch > 0 && Math.floor(tick / 3) % 2) return
    const won = this.mode === 'won'
    const hot = !won && (this.mode === 'gauge' || this.mode === 'ring-tell')
    if (hot) glow(g, x, y, 18, RAMPS.ember[3], 0.4 + 0.2 * Math.sin(tick / 3))
    // Wheels, the boiler, its chimney and the gauge on its front.
    shadedOrb(g, x - 6, y + 7, 3, RAMPS.steel)
    shadedOrb(g, x + 6, y + 7, 3, RAMPS.steel)
    bevel(g, x - 9, y - 8, 18, 15, won ? RAMPS.teal : RAMPS.rust, { depth: 2 })
    bevel(g, x + 2, y - 15, 5, 8, RAMPS.steel, { depth: 1 })
    g.fillStyle = RAMPS.cream[4]
    g.beginPath()
    g.arc(x - 2, y - 2, 5, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = INK
    g.lineWidth = 1
    g.stroke()
    const swing =
      this.mode === 'gauge' || this.mode === 'ring-tell'
        ? Math.sin(tick / 2) * 1.2
        : won
          ? -1.2
          : 0.4
    g.beginPath()
    g.moveTo(x - 2, y - 2)
    g.lineTo(x - 2 + Math.sin(swing) * 4, y - 2 - Math.cos(swing) * 4)
    g.strokeStyle = RAMPS.ember[2]
    g.stroke()
    if (this.mode === 'hatch') {
      // The boiler hatch hangs open: bloom it now.
      g.fillStyle = RAMPS.ember[3]
      g.fillRect(x - 6, y + 2, 12, 4)
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(x - 4, y + 3, 8, 2)
    } else {
      g.fillStyle = RAMPS.rust[1]
      g.fillRect(x - 6, y + 2, 12, 4)
    }
    // Eyes: cross, or cheerful once cooled down.
    g.fillStyle = INK
    g.fillRect(x + 3, y - 5, 2, 2)
    g.fillRect(x + 6, y - 5, 2, 2)
    if (!won) {
      g.fillRect(x + 2, y - 7, 3, 1)
      g.fillRect(x + 6, y - 7, 3, 1)
    }
    // Steam puffs from the chimney (water spray once he is a sprinkler).
    for (let i = 0; i < 3; i++) {
      const t = (tick / 2 + i * 7) % 20
      shadedOrb(
        g,
        x + 4 + Math.sin(t / 3) * 2,
        y - 17 - t,
        2 + t / 8,
        won ? RAMPS.water : RAMPS.steel,
        { outline: null, glint: false },
      )
    }
  }
}

export function makeBoss(kind: BossKind, valves: Tile[]): Boss {
  return kind === 'hector' ? new Hector(7, 1, valves) : new Bramblebeard(7, 6)
}
