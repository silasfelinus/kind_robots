// /utils/arcade/games/sinkSuds.ts
//
// Sink Suds -- the Kind Robots Arcade's riff on the 1982 sink-bubble game
// (conductor kr-arcade/t-009, first game-factory cabinet). You are a soap
// bubble drifting around a robot's kitchen sink. Scrub up crumbs and grease
// to grow; rust mites pop a small bubble but a big one swallows them; scrub
// brushes hunt you and eat the mess too. At full size the drain glows: sail
// down it to clean the next sink. A gives a quick puff of speed.

import { levelCurve } from '../curve'
import { drawText } from '../font'
import {
  INK,
  RAMPS,
  Sparkles,
  backdropRng,
  bevel,
  cachedLayer,
  dropShadow,
  drawSprite,
  gauge,
  glow,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
  shadedOrb,
  vignette,
} from '../snes'
import type {
  ArcadeGameInstance,
  ArcadeGameModule,
  ArcadeGameOptions,
  InputFrame,
} from '../types'

const W = 420
const H = 360
const SINK = { cx: W / 2, cy: H / 2 + 8, rx: 186, ry: 146 }
const DRAIN = { x: SINK.cx, y: SINK.cy, r: 13 }

const ACCEL = 0.09
const FRICTION = 0.965
const MAX_SPEED = 2.3
const PUFF_SPEED = 4.2
const PUFF_COOLDOWN = 70
const START_LIVES = 3
const EXTRA_LIFE_EVERY = 15_000
const MAX_STAGE = 5
const STAGE_RADIUS = [0, 7, 9.5, 12, 14.5, 17]
const GROWTH_PER_STAGE = 8

export const SUDS_CURVES = {
  messStart: { start: 26, step: 4, limit: 50 },
  mites: { start: 2, step: 1, limit: 9 },
  miteSpeed: { start: 0.55, step: 0.06, limit: 1.2 },
  brushes: { start: 0, step: 0.5, limit: 3 },
  brushSpeed: { start: 0.45, step: 0.05, limit: 0.95 },
  dripEvery: { start: 150, step: -10, limit: 50 },
} as const

type Mess = { x: number; y: number; kind: 'crumb' | 'grease'; r: number }
type Mite = { x: number; y: number; vx: number; vy: number; turn: number }
type Brush = { x: number; y: number; angle: number }
type Drip = { x: number; y: number; vy: number; landY: number }
type Pop = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}
type Floater = { x: number; y: number; text: string; life: number }

/** Is (x, y) inside the sink basin, shrunk by `margin` pixels? */
export function insideSink(x: number, y: number, margin = 0): boolean {
  const dx = (x - SINK.cx) / (SINK.rx - margin)
  const dy = (y - SINK.cy) / (SINK.ry - margin)
  return dx * dx + dy * dy <= 1
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

const TILE = 24
const TILE_DARK = [
  '#120a33',
  '#24124f',
  '#3a2479',
  '#5b3fb0',
  '#8f7be0',
] as const

const BOWL_BANDS = Array.from({ length: 6 }, (_, i) =>
  mix(RAMPS.steel[2], '#dfe7f5', i / 5),
)

const SHEEN = [
  'rgba(244, 114, 182, 0.55)',
  'rgba(250, 204, 21, 0.5)',
  'rgba(94, 234, 212, 0.5)',
  'rgba(167, 139, 250, 0.55)',
]

const CAUSTICS = (() => {
  const rand = backdropRng(11)
  return Array.from({ length: 22 }, () => ({
    x: rand() * 1.5 - 0.75,
    y: rand() * 1.5 - 0.75,
    w: 4 + Math.round(rand() * 6),
    phase: rand() * Math.PI * 2,
  }))
})()

const MITE_PALETTE = {
  r: RAMPS.rust[1],
  o: RAMPS.rust[2],
  y: RAMPS.rust[3],
  h: RAMPS.rust[4],
  w: '#ffffff',
  k: INK,
  l: RAMPS.rust[0],
}
const MITE_BODY = [
  '..rrrrr...',
  '.rooyyhr..',
  'rooooyywwr',
  'rooooooowk',
  'roooooooor',
  '.rrooooorr',
  '..rrrrrr..',
]
const MITE_SPRITES = [
  pixelSprite([...MITE_BODY, '.l..l..l..', 'l..l..l...'], MITE_PALETTE),
  pixelSprite([...MITE_BODY, '..l..l..l.', '...l..l..l'], MITE_PALETTE),
] as const

const BRUSH_SPRITE = pixelSprite(
  [
    '..hhhhhhhhhhhhhhhh..',
    '.hTTTTTTTTTTTTTTTTt.',
    '.TTkkkTTTTTTTTkkkTt.',
    '.TTTwkTTTTTTTTwkTTt.',
    '.tTTTTTTTkkTTTTTTtt.',
    '..tttttttttttttttt..',
    '..gGgGgGgGgGgGgGgG..',
    '..GgGgGgGgGgGgGgGg..',
    '..d.d.d.d.d.d.d.d...',
  ],
  {
    h: RAMPS.teal[4],
    T: RAMPS.teal[2],
    t: RAMPS.teal[1],
    k: INK,
    w: '#ffffff',
    g: RAMPS.gold[2],
    G: RAMPS.gold[3],
    d: RAMPS.gold[1],
  },
)

const CRUMB_SPRITE = pixelSprite(['.GY.', 'GYGg', 'gGgd', '.dd.'], {
  Y: RAMPS.gold[4],
  G: RAMPS.gold[3],
  g: RAMPS.gold[2],
  d: RAMPS.gold[1],
})

const CEREAL_SPRITE = pixelSprite(['.PPp.', 'P...p', 'p...d', '.pdd.'], {
  P: RAMPS.pink[3],
  p: RAMPS.pink[2],
  d: RAMPS.pink[1],
})

const DRIP_SPRITE = pixelSprite(
  ['.w.', '.W.', 'WwW', 'WWd', '.d.'],
  { w: RAMPS.water[4], W: RAMPS.water[3], d: RAMPS.water[2] },
  { outline: RAMPS.water[0] },
)

const SOAP_SPRITE = pixelSprite(
  [
    '....ss.....',
    '..ssss.....',
    '....ss.....',
    '...tttt....',
    '...tttt....',
    '.hPPPPPPp..',
    'hPPPPPPPpd.',
    'hPwwwwwPpd.',
    'hPwcwcwPpd.',
    'hPwwcwwPpd.',
    'hPPPPPPPpd.',
    'hPPPPPPPpd.',
    '.pppppppd..',
  ],
  {
    s: RAMPS.steel[3],
    t: RAMPS.teal[2],
    h: RAMPS.pink[4],
    P: RAMPS.pink[2],
    p: RAMPS.pink[1],
    d: RAMPS.pink[0],
    w: RAMPS.cream[3],
    c: RAMPS.teal[3],
  },
)

const PLANT_SPRITE = pixelSprite(
  [
    '.....LL......',
    '..LL.LlL.LL..',
    '.LllLLllLllL.',
    '.Llllllllld..',
    '..dllllllld..',
    '...dlldlld...',
    '....ddddd....',
    '..RRRRRRRRR..',
    '..rrrrrrrrq..',
    '...rrrrrrq...',
    '...rrrrrrq...',
    '....qqqqq....',
  ],
  {
    L: RAMPS.leaf[3],
    l: RAMPS.leaf[2],
    d: RAMPS.leaf[1],
    R: RAMPS.rust[3],
    r: RAMPS.rust[2],
    q: RAMPS.rust[1],
  },
)

const MUG_SPRITE = pixelSprite(
  [
    '.hhhhhhh...',
    'hTTTTTTTt..',
    'hTkTTTkTtTT',
    'hTTTTTTTt.T',
    'hTTkkkTTtTT',
    'hTTTTTTTt..',
    '.ttttttt...',
  ],
  { h: RAMPS.teal[4], T: RAMPS.teal[2], t: RAMPS.teal[1], k: INK },
)

const SPONGE_SPRITE = pixelSprite(
  [
    'LLLLLLLLLLLL',
    'llllllllllld',
    'GGGGGGGGGGGG',
    'GgGgggGgggGd',
    'gggdgggggdgd',
    '.dddddddddd.',
  ],
  {
    L: RAMPS.leaf[3],
    l: RAMPS.leaf[2],
    d: RAMPS.gold[1],
    G: RAMPS.gold[3],
    g: RAMPS.gold[2],
  },
)

class SinkSuds implements ArcadeGameInstance {
  score = 0
  level = 0
  lives = START_LIVES
  over = false

  private rng: () => number
  private sound: ArcadeGameOptions['sound']
  private demo: boolean
  private hiScore: number

  private tick = 0
  private bubble = { x: SINK.cx, y: SINK.cy + 60, vx: 0, vy: 0, wobble: 0 }
  private growth = 0
  private stage = 1
  private puff = 0
  private alive = true
  private respawn = 0
  private invuln = 0
  private mess: Mess[] = []
  private mites: Mite[] = []
  private brushes: Brush[] = []
  private drips: Drip[] = []
  private pops: Pop[] = []
  private floaters: Floater[] = []
  private dripTimer = 0
  private draining = 0
  private overTimer = 0
  private nextExtra = EXTRA_LIFE_EVERY
  private banner: { text: string; sub?: string; ticks: number } | null = null
  // Cosmetic sparkles roll their own dice, so the game's seeded rng is untouched.
  private fx = new Sparkles()
  private fxRng = backdropRng(29)

  constructor(options: ArcadeGameOptions) {
    this.rng = options.rng
    this.sound = options.sound
    this.demo = options.demo
    this.hiScore = options.hiScore
    this.startLevel(1)
  }

  // --- setup ------------------------------------------------------------------

  private spot(
    margin: number,
    awayFrom?: { x: number; y: number },
    minDistance = 0,
  ) {
    for (let attempt = 0; attempt < 80; attempt++) {
      const p = {
        x: SINK.cx + (this.rng() * 2 - 1) * SINK.rx,
        y: SINK.cy + (this.rng() * 2 - 1) * SINK.ry,
      }
      if (!insideSink(p.x, p.y, margin)) continue
      if (dist(p, DRAIN) < 30) continue
      if (awayFrom && dist(p, awayFrom) < minDistance) continue
      return p
    }
    return { x: SINK.cx + 80, y: SINK.cy }
  }

  private addMess(at?: { x: number; y: number }) {
    const p = at ?? this.spot(14)
    const grease = this.rng() < 0.3
    this.mess.push({
      x: p.x,
      y: p.y,
      kind: grease ? 'grease' : 'crumb',
      r: grease ? 5 : 3,
    })
  }

  private startLevel(level: number) {
    this.level = level
    this.stage = 1
    this.growth = 0
    this.mess = []
    this.mites = []
    this.brushes = []
    this.drips = []
    this.draining = 0
    Object.assign(this.bubble, { x: SINK.cx, y: SINK.cy + 70, vx: 0, vy: 0 })
    const count = (spec: { start: number; step: number; limit: number }) =>
      Math.max(0, Math.floor(levelCurve(level, spec)))
    for (let i = 0; i < count(SUDS_CURVES.messStart); i++) this.addMess()
    for (let i = 0; i < count(SUDS_CURVES.mites); i++) {
      const p = this.spot(16, this.bubble, 90)
      this.mites.push({ x: p.x, y: p.y, vx: 0, vy: 0, turn: 0 })
    }
    for (let i = 0; i < count(SUDS_CURVES.brushes); i++) {
      const p = this.spot(24, this.bubble, 140)
      this.brushes.push({ x: p.x, y: p.y, angle: 0 })
    }
    this.dripTimer = Math.round(levelCurve(level, SUDS_CURVES.dripEvery))
    this.invuln = 90
    this.banner = { text: `SINK ${level}`, ticks: 90 }
  }

  private get radius() {
    return STAGE_RADIUS[this.stage]!
  }

  // --- update ------------------------------------------------------------------

  update(input: InputFrame) {
    this.tick++
    this.updateEffects()
    if (this.banner && --this.banner.ticks <= 0) this.banner = null
    if (this.over) return
    if (this.lives <= 0 && !this.alive) {
      if (++this.overTimer > 100) this.over = true
      return
    }
    if (this.draining > 0) {
      // Spiral down the drain, then rinse into the next sink.
      this.draining++
      const t = this.draining / 70
      this.bubble.x = DRAIN.x + Math.cos(this.draining / 4) * 20 * (1 - t)
      this.bubble.y = DRAIN.y + Math.sin(this.draining / 4) * 20 * (1 - t)
      if (this.draining > 70) {
        const left = this.mess.length
        const bonus = Math.max(0, 1000 * this.level - left * 50)
        if (bonus) this.addScore(bonus, SINK.cx, SINK.cy - 40)
        this.startLevel(this.level + 1)
      }
      return
    }
    if (!this.alive) {
      if (--this.respawn <= 0) this.revive()
      return
    }

    const controls = this.demo ? this.demoInput() : input
    this.moveBubble(controls)
    this.moveMites()
    this.moveBrushes()
    this.moveDrips()
    this.collide()
  }

  private moveBubble(input: InputFrame) {
    const b = this.bubble
    let ax = 0
    let ay = 0
    if (input.held.left) ax -= 1
    if (input.held.right) ax += 1
    if (input.held.up) ay -= 1
    if (input.held.down) ay += 1
    const len = Math.hypot(ax, ay)
    if (len) {
      b.vx += (ax / len) * ACCEL
      b.vy += (ay / len) * ACCEL
    }
    if (this.puff > 0) this.puff--
    if (
      input.pressed.a &&
      this.puff === 0 &&
      (len || Math.hypot(b.vx, b.vy) > 0.2)
    ) {
      const dx = len ? ax / len : b.vx / Math.hypot(b.vx, b.vy)
      const dy = len ? ay / len : b.vy / Math.hypot(b.vx, b.vy)
      b.vx = dx * PUFF_SPEED
      b.vy = dy * PUFF_SPEED
      this.puff = PUFF_COOLDOWN
      this.sound.play('blip')
    }
    const speed = Math.hypot(b.vx, b.vy)
    const cap = this.puff > PUFF_COOLDOWN - 15 ? PUFF_SPEED : MAX_SPEED
    if (speed > cap) {
      b.vx *= cap / speed
      b.vy *= cap / speed
    }
    b.vx *= FRICTION
    b.vy *= FRICTION
    b.x += b.vx
    b.y += b.vy
    // Bounce softly off the sink wall.
    if (!insideSink(b.x, b.y, this.radius)) {
      const nx = (b.x - SINK.cx) / (SINK.rx * SINK.rx)
      const ny = (b.y - SINK.cy) / (SINK.ry * SINK.ry)
      const nlen = Math.hypot(nx, ny) || 1
      const ux = nx / nlen
      const uy = ny / nlen
      const dot = b.vx * ux + b.vy * uy
      if (dot > 0) {
        b.vx -= 1.6 * dot * ux
        b.vy -= 1.6 * dot * uy
      }
      while (!insideSink(b.x, b.y, this.radius)) {
        b.x -= ux
        b.y -= uy
      }
    }
    b.wobble += 0.12 + speed * 0.05
    if (this.invuln > 0) this.invuln--
  }

  private moveMites() {
    const speed = levelCurve(this.level, SUDS_CURVES.miteSpeed)
    for (const m of this.mites) {
      if (--m.turn <= 0) {
        // Mites mostly wander, sometimes scuttle toward the nearest crumb.
        const target = this.rng() < 0.4 ? this.nearestMess(m) : null
        const a = target
          ? Math.atan2(target.y - m.y, target.x - m.x)
          : this.rng() * Math.PI * 2
        m.vx = Math.cos(a) * speed
        m.vy = Math.sin(a) * speed
        m.turn = 30 + Math.floor(this.rng() * 50)
      }
      m.x += m.vx
      m.y += m.vy
      if (!insideSink(m.x, m.y, 8)) {
        m.x -= m.vx * 2
        m.y -= m.vy * 2
        m.turn = 0
      }
    }
  }

  private moveBrushes() {
    const speed = levelCurve(this.level, SUDS_CURVES.brushSpeed)
    const b = this.bubble
    for (const br of this.brushes) {
      // Brushes chase the bubble when it is close, otherwise scrub the nearest mess.
      const near = dist(br, b) < 120
      const target = near ? b : (this.nearestMess(br) ?? b)
      const a = Math.atan2(target.y - br.y, target.x - br.x)
      br.angle += 0.08
      br.x += Math.cos(a) * speed
      br.y += Math.sin(a) * speed
      if (!insideSink(br.x, br.y, 14)) {
        br.x -= Math.cos(a) * speed * 2
        br.y -= Math.sin(a) * speed * 2
      }
      const eaten = this.mess.findIndex((m) => dist(m, br) < 12)
      if (eaten >= 0) this.mess.splice(eaten, 1)
    }
  }

  private moveDrips() {
    if (--this.dripTimer <= 0) {
      const land = this.spot(16)
      this.drips.push({
        x: land.x,
        y: SINK.cy - SINK.ry - 20,
        vy: 2.5,
        landY: land.y,
      })
      this.dripTimer = Math.round(levelCurve(this.level, SUDS_CURVES.dripEvery))
    }
    for (const d of this.drips) d.y += d.vy
    const landed = this.drips.filter((d) => d.y >= d.landY)
    for (const d of landed) this.addMess({ x: d.x, y: d.landY })
    this.drips = this.drips.filter((d) => d.y < d.landY)
  }

  private nearestMess(from: { x: number; y: number }): Mess | null {
    let best: Mess | null = null
    let bestDistance = Infinity
    for (const m of this.mess) {
      const d = dist(m, from)
      if (d < bestDistance) {
        bestDistance = d
        best = m
      }
    }
    return best
  }

  private grow(amount: number) {
    if (this.stage >= MAX_STAGE) return
    this.growth += amount
    if (this.growth >= GROWTH_PER_STAGE) {
      this.growth -= GROWTH_PER_STAGE
      this.stage++
      this.sound.play('pickup')
      if (this.stage === MAX_STAGE) {
        this.banner = {
          text: 'FULL OF SUDS!',
          sub: 'SAIL DOWN THE DRAIN',
          ticks: 120,
        }
        this.sound.play('level')
      }
    }
  }

  private collide() {
    const b = this.bubble
    const r = this.radius
    for (let i = this.mess.length - 1; i >= 0; i--) {
      const m = this.mess[i]!
      if (dist(m, b) < r + m.r) {
        this.mess.splice(i, 1)
        this.fx.burst(m.x, m.y, this.fxRng, { count: 4, speed: 1 })
        const points = m.kind === 'grease' ? 25 : 10
        this.addScore(points)
        this.grow(m.kind === 'grease' ? 2 : 1)
        if (this.tick % 2 === 0) this.sound.play('blip')
      }
    }
    if (this.stage >= MAX_STAGE && dist(b, DRAIN) < DRAIN.r + 4) {
      this.draining = 1
      this.sound.play('extra')
      return
    }
    if (this.invuln > 0) return
    for (let i = this.mites.length - 1; i >= 0; i--) {
      const m = this.mites[i]!
      if (dist(m, b) < r + 4) {
        if (this.stage >= 3) {
          this.mites.splice(i, 1)
          this.addScore(100, m.x, m.y)
          this.burst(m.x, m.y, 8, '#b45309')
          this.fx.burst(m.x, m.y, this.fxRng, { count: 10 })
          this.sound.play('pop')
          // A swallowed mite drops a crumb somewhere else: the sink is never quite done.
          this.addMess()
        } else {
          this.popBubble()
          return
        }
      }
    }
    for (const br of this.brushes) {
      if (dist(br, b) < r + 10) {
        this.popBubble()
        return
      }
    }
  }

  private popBubble() {
    this.alive = false
    this.lives--
    this.respawn = 100
    this.burst(this.bubble.x, this.bubble.y, 30, '#e0f2fe')
    this.sound.play('die')
    if (this.lives <= 0) this.banner = { text: 'GAME OVER', ticks: 9999 }
  }

  private revive() {
    Object.assign(this.bubble, { x: SINK.cx, y: SINK.cy + 70, vx: 0, vy: 0 })
    this.stage = Math.max(1, this.stage - 1)
    this.growth = 0
    this.alive = true
    this.invuln = 120
  }

  private addScore(points: number, x?: number, y?: number) {
    if (this.demo) return
    this.score += points
    if (x !== undefined && y !== undefined) {
      this.floaters.push({ x, y, text: String(points), life: 50 })
    }
    if (this.score >= this.nextExtra) {
      this.lives++
      this.nextExtra += EXTRA_LIFE_EVERY
      this.sound.play('extra')
      this.banner = { text: 'EXTRA BUBBLE!', ticks: 90 }
    }
  }

  private burst(x: number, y: number, count: number, color: string) {
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2
      const s = 0.5 + this.rng() * 2
      this.pops.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 25 + Math.floor(this.rng() * 20),
        color,
      })
    }
  }

  private updateEffects() {
    this.fx.update()
    for (const p of this.pops) {
      p.x += p.vx
      p.y += p.vy
      p.vx *= 0.93
      p.vy *= 0.93
      p.life--
    }
    this.pops = this.pops.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.y -= 0.35
      f.life--
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  // --- attract-mode pilot --------------------------------------------------------

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
    const b = this.bubble
    const goal: { x: number; y: number } | null =
      this.stage >= MAX_STAGE ? DRAIN : this.nearestMess(b)
    let steerX = goal ? goal.x - b.x : 0
    let steerY = goal ? goal.y - b.y : 0
    const scale = Math.hypot(steerX, steerY) || 1
    steerX /= scale
    steerY /= scale
    // Shy away from anything that could pop the bubble.
    const threats: Array<{ x: number; y: number }> = [...this.brushes]
    if (this.stage < 3) threats.push(...this.mites)
    for (const t of threats) {
      const d = dist(t, b)
      if (d < 70) {
        steerX += (((b.x - t.x) / d) * (70 - d)) / 25
        steerY += (((b.y - t.y) / d) * (70 - d)) / 25
      }
    }
    const lead = 0.3
    if (steerX < -lead) held.left = true
    if (steerX > lead) held.right = true
    if (steerY < -lead) held.up = true
    if (steerY > lead) held.down = true
    return frame
  }

  // --- render ------------------------------------------------------------------------

  render(g: CanvasRenderingContext2D) {
    this.renderKitchen(g)
    this.renderBasin(g)
    for (const m of this.mess) this.renderMess(g, m)
    for (const d of this.drips) {
      drawSprite(g, DRIP_SPRITE, d.x, d.y)
    }
    for (const m of this.mites) this.renderMite(g, m)
    for (const br of this.brushes) this.renderBrush(g, br)
    for (const p of this.pops) {
      g.globalAlpha = Math.max(0, p.life / 45)
      g.fillStyle = INK
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 3, 3)
      g.fillStyle = p.color
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2)
    }
    g.globalAlpha = 1
    if (
      this.alive &&
      !(this.invuln > 0 && Math.floor(this.invuln / 6) % 2 === 0)
    ) {
      this.renderBubble(g)
    }
    this.fx.render(g)
    for (const f of this.floaters) {
      drawText(g, f.text, f.x, f.y, {
        align: 'center',
        color: RAMPS.gold[3],
        outline: INK,
      })
    }
    vignette(g, W, H, 0.3)
    this.renderHud(g)
  }

  private renderKitchen(g: CanvasRenderingContext2D) {
    // Glazed backsplash tiles, lit from the upper left; painted once.
    cachedLayer(g, 'sink-suds-kitchen', W, H, (k) => {
      k.fillStyle = RAMPS.night[1]
      k.fillRect(0, 0, W, H)
      for (let y = 0; y < H; y += TILE) {
        for (let x = 0; x < W; x += TILE) {
          const ramp = ((x + y) / TILE) % 2 ? RAMPS.purple : TILE_DARK
          bevel(k, x + 1, y + 1, TILE - 2, TILE - 2, ramp, {
            depth: 2,
            outline: null,
          })
          k.fillStyle = rgba(RAMPS.purple[4], 0.35)
          for (let i = 0; i < 6; i++) k.fillRect(x + 4 + i, y + 9 - i, 2, 1)
        }
      }
      // Counter clutter in the corners the basin leaves free.
      drawSprite(k, SOAP_SPRITE, 34, 78, { anchor: 'feet', scale: 2 })
      drawSprite(k, PLANT_SPRITE, W - 36, 80, { anchor: 'feet', scale: 2 })
      drawSprite(k, MUG_SPRITE, 30, H - 30, { anchor: 'feet', scale: 2 })
      drawSprite(k, SPONGE_SPRITE, W - 32, H - 30, { anchor: 'feet', scale: 2 })
    })
    // The chrome faucet at the back of the sink, with a pink and a teal tap.
    const top = SINK.cy - SINK.ry
    bevel(g, SINK.cx - 5, top - 26, 10, 24, RAMPS.steel)
    bevel(g, SINK.cx - 22, top - 31, 44, 8, RAMPS.steel)
    bevel(g, SINK.cx - 3, top - 4, 6, 6, RAMPS.steel, { depth: 1 })
    shadedOrb(g, SINK.cx - 32, top - 24, 6, RAMPS.pink)
    shadedOrb(g, SINK.cx + 32, top - 24, 6, RAMPS.teal)
  }

  private renderBasin(g: CanvasRenderingContext2D) {
    const { cx, cy, rx, ry } = SINK
    const ellipse = (x: number, y: number, ex: number, ey: number) => {
      g.beginPath()
      g.ellipse(x, y, ex, ey, 0, 0, Math.PI * 2)
      g.fill()
    }
    // Steel rim: ink edge, lit upper-left arc, shadowed lower-right arc.
    g.fillStyle = INK
    ellipse(cx, cy, rx + 12, ry + 12)
    g.fillStyle = RAMPS.steel[2]
    ellipse(cx, cy, rx + 10, ry + 10)
    g.lineWidth = 3
    g.strokeStyle = RAMPS.steel[4]
    g.beginPath()
    g.ellipse(cx, cy, rx + 7, ry + 7, 0, Math.PI * 1.02, Math.PI * 1.62)
    g.stroke()
    g.strokeStyle = RAMPS.steel[3]
    g.beginPath()
    g.ellipse(cx, cy, rx + 7, ry + 7, 0, Math.PI * 0.75, Math.PI * 1.02)
    g.ellipse(cx, cy, rx + 7, ry + 7, 0, Math.PI * 1.62, Math.PI * 1.9)
    g.stroke()
    g.strokeStyle = RAMPS.steel[1]
    g.beginPath()
    g.ellipse(cx, cy, rx + 7, ry + 7, 0, Math.PI * 0.05, Math.PI * 0.6)
    g.stroke()
    g.fillStyle = RAMPS.steel[0]
    ellipse(cx, cy, rx + 2, ry + 2)
    // The bowl, shaded in bands toward the light.
    BOWL_BANDS.forEach((colour, i) => {
      const t = i / BOWL_BANDS.length
      g.fillStyle = colour
      ellipse(cx - t * 24, cy - t * 30, rx * (1 - t * 0.6), ry * (1 - t * 0.6))
    })
    // A skin of water with light dancing on it.
    g.save()
    g.beginPath()
    g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    g.clip()
    g.fillStyle = rgba(RAMPS.water[2], 0.16)
    g.fillRect(cx - rx, cy - ry, rx * 2, ry * 2)
    g.fillStyle = rgba(RAMPS.water[4], 0.4)
    for (const c of CAUSTICS) {
      const sway = Math.sin(this.tick / 40 + c.phase)
      g.fillRect(
        Math.round(cx + c.x * rx + sway * 6),
        Math.round(cy + c.y * ry),
        Math.round(c.w + sway * 2),
        1,
      )
    }
    g.restore()
    // The drain: it glows when the bubble is full of suds.
    const ready = this.stage >= MAX_STAGE
    if (ready) {
      glow(
        g,
        DRAIN.x,
        DRAIN.y,
        DRAIN.r + 22,
        RAMPS.gold[3],
        0.45 + 0.25 * Math.sin(this.tick / 6),
      )
    }
    shadedOrb(g, DRAIN.x, DRAIN.y, DRAIN.r + 3, RAMPS.steel, { glint: false })
    g.fillStyle = INK
    g.beginPath()
    g.arc(DRAIN.x, DRAIN.y, DRAIN.r - 1, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = RAMPS.steel[3]
    for (let i = -1; i <= 1; i++) {
      g.fillRect(DRAIN.x - 8, DRAIN.y + i * 5 - 1, 16, 2)
    }
    if (ready) {
      g.fillStyle = RAMPS.gold[4]
      for (let i = 0; i < 4; i++) {
        const a = this.tick / 10 + (i * Math.PI) / 2
        g.fillRect(
          Math.round(DRAIN.x + Math.cos(a) * (DRAIN.r + 6)),
          Math.round(DRAIN.y + Math.sin(a) * (DRAIN.r + 6)),
          2,
          2,
        )
      }
    }
  }

  private renderMess(g: CanvasRenderingContext2D, m: Mess) {
    if (m.kind === 'grease') {
      const tilt = (m.x + m.y) % 3
      g.fillStyle = 'rgba(122, 44, 16, 0.55)'
      g.beginPath()
      g.ellipse(m.x, m.y, 7, 5, tilt, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = 'rgba(194, 84, 27, 0.6)'
      g.beginPath()
      g.ellipse(m.x - 1, m.y - 1, 5, 3, tilt, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = 'rgba(255, 224, 194, 0.8)'
      g.fillRect(Math.round(m.x) - 3, Math.round(m.y) - 2, 2, 1)
    } else {
      const sprite =
        (Math.round(m.x) + Math.round(m.y)) % 2 ? CRUMB_SPRITE : CEREAL_SPRITE
      drawSprite(g, sprite, m.x, m.y)
    }
  }

  private renderMite(g: CanvasRenderingContext2D, m: Mite) {
    const frame = Math.floor(this.tick / 6) % 2
    dropShadow(g, m.x, m.y + 5, 5, 1.5, 0.3)
    drawSprite(g, frame ? MITE_SPRITES[1] : MITE_SPRITES[0], m.x, m.y, {
      flipX: m.vx < 0,
    })
  }

  private renderBrush(g: CanvasRenderingContext2D, br: Brush) {
    const bob = Math.round(Math.sin(br.angle * 2) * 1.5)
    dropShadow(g, br.x, br.y + 9, 11, 2.5, 0.35)
    drawSprite(g, BRUSH_SPRITE, br.x, br.y + bob, {
      flipX: Math.sin(br.angle) < 0,
    })
    // Bristles scrubbing: a few suds flecks under the brush.
    g.fillStyle = RAMPS.water[4]
    const f = Math.floor(this.tick / 4) % 3
    g.fillRect(Math.round(br.x) - 9 + f * 6, Math.round(br.y) + 8, 2, 1)
    g.fillRect(Math.round(br.x) + 5 - f * 4, Math.round(br.y) + 9, 1, 1)
  }

  private renderBubble(g: CanvasRenderingContext2D) {
    const b = this.bubble
    const r =
      this.draining > 0
        ? this.radius * Math.max(0.1, 1 - this.draining / 70)
        : this.radius
    dropShadow(g, b.x + r * 0.35, b.y + r * 0.95, r * 0.8, r * 0.28, 0.3)
    const wob = Math.sin(b.wobble) * 0.08
    g.save()
    g.translate(b.x, b.y)
    g.scale(1 + wob, 1 - wob)
    const film = g.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r)
    film.addColorStop(0, 'rgba(255, 255, 255, 0.85)')
    film.addColorStop(0.5, 'rgba(165, 243, 252, 0.35)')
    film.addColorStop(0.8, 'rgba(244, 114, 182, 0.4)')
    film.addColorStop(1, 'rgba(167, 139, 250, 0.75)')
    g.fillStyle = film
    g.beginPath()
    g.arc(0, 0, r, 0, Math.PI * 2)
    g.fill()
    // A rainbow sheen swirling around the film.
    const spin = this.tick / 18
    g.lineWidth = Math.max(1.5, r / 6)
    SHEEN.forEach((colour, i) => {
      g.strokeStyle = colour
      g.beginPath()
      g.arc(0, 0, r * 0.8, spin + i * 0.45, spin + i * 0.45 + 0.45)
      g.stroke()
    })
    g.lineWidth = 1
    g.strokeStyle = INK
    g.beginPath()
    g.arc(0, 0, r + 0.5, 0, Math.PI * 2)
    g.stroke()
    g.strokeStyle = 'rgba(255, 255, 255, 0.9)'
    g.beginPath()
    g.arc(0, 0, r - 0.5, Math.PI * 0.9, Math.PI * 1.6)
    g.stroke()
    // The window highlight every 16-bit bubble has.
    g.fillStyle = '#ffffff'
    g.fillRect(Math.round(-r * 0.55), Math.round(-r * 0.55), 3, 2)
    g.fillRect(Math.round(-r * 0.6), Math.round(-r * 0.3), 2, 2)
    // A happy little face with shiny eyes and pink cheeks.
    const ex = Math.round(r * 0.3)
    const ey = Math.round(-r * 0.15)
    g.fillStyle = INK
    g.fillRect(-ex - 1, ey, 2, 3)
    g.fillRect(ex - 1, ey, 2, 3)
    g.fillStyle = '#ffffff'
    g.fillRect(-ex - 1, ey, 1, 1)
    g.fillRect(ex - 1, ey, 1, 1)
    g.fillStyle = rgba(RAMPS.pink[2], 0.7)
    g.fillRect(-ex - 4, ey + 4, 3, 1)
    g.fillRect(ex + 2, ey + 4, 3, 1)
    g.strokeStyle = INK
    g.beginPath()
    g.arc(0, r * 0.15, r * 0.25, 0.2, Math.PI - 0.2)
    g.stroke()
    g.restore()
  }

  private renderHud(g: CanvasRenderingContext2D) {
    // Score and high score share one box, clear of the faucet in the middle.
    hudPanel(g, 4, 3, 86, 31)
    drawText(g, String(this.score).padStart(6, '0'), 10, 6, {
      scale: 2,
      color: RAMPS.teal[4],
      shadow: INK,
    })
    drawText(g, `HI ${Math.max(this.hiScore, this.score)}`, 10, 24, {
      color: RAMPS.gold[3],
      outline: INK,
    })
    const lives = Math.min(this.lives, 5)
    if (lives > 0) {
      hudPanel(g, W - 8 - lives * 14, 3, lives * 14 + 4, 20)
      for (let i = 0; i < lives; i++) {
        shadedOrb(g, W - 13 - i * 14, 13, 4.5, RAMPS.water)
      }
    }
    hudPanel(g, 4, H - 19, 58, 15)
    drawText(g, `SINK ${this.level}`, 10, H - 15, {
      color: RAMPS.purple[4],
      outline: INK,
    })
    // Suds meter: how close the bubble is to full size.
    const filled =
      this.stage >= MAX_STAGE
        ? 1
        : (this.stage - 1 + this.growth / GROWTH_PER_STAGE) / (MAX_STAGE - 1)
    hudPanel(g, W - 152, H - 19, 148, 15)
    drawText(g, 'SUDS', W - 146, H - 15, {
      color: RAMPS.teal[4],
      outline: INK,
    })
    gauge(
      g,
      W - 112,
      H - 15,
      102,
      7,
      filled,
      filled >= 1 ? RAMPS.gold : RAMPS.water,
    )
    if (this.banner) {
      drawText(g, this.banner.text, W / 2, H / 2 - 50, {
        scale: 3,
        align: 'center',
        color: '#ffffff',
        outline: INK,
        shadow: RAMPS.teal[1],
      })
      if (this.banner.sub) {
        drawText(g, this.banner.sub, W / 2, H / 2 - 18, {
          scale: 2,
          align: 'center',
          color: RAMPS.gold[3],
          outline: INK,
        })
      }
    }
  }
}

const sinkSuds: ArcadeGameModule = {
  create: (options) => new SinkSuds(options),
}

export const create = sinkSuds.create
export default sinkSuds
