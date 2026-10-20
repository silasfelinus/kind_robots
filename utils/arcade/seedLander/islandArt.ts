// /utils/arcade/seedLander/islandArt.ts
//
// Seed Lander's island art (conductor kr-arcade/t-070), in world units through the camera: the
// living gardens as they grow (sunflower, beanstalk, mushroom, vine), the marker on a bed that
// says what it will grow, petal rings, golden acorns, windmills, dandelion fluff and crow-bots
// with the shadow they mark before a dive. Cosmetic only.

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
import { drawSunflower } from './art'
import { LIGHT, darkAt, fireflyAt, sporeSwell } from './cavern'
import type { CrystalSpec, LanternSpec, LightSource, SporeSpec } from './cavern'
import type { Growth } from './gardens'
import type {
  Crow,
  DripSpec,
  FallSpec,
  Fluff,
  PebbleSpec,
  StormCloudSpec,
  Windmill,
} from './hazards'
import { dripAt, pebbleAt, sailAngles, stormCloudAt } from './hazards'
import type { AcornSpec, RingSpec } from './missions'
import type { Pad, PlantKind } from './terrain'

/** How far through growing a plant is (0..1). */
function grown(age: number, ticks = 70): number {
  const t = Math.min(1, age / ticks)
  return t * t * (3 - 2 * t)
}

/** A planted bed's plant, growing. `pads` finds the perches it made. */
export function drawGrowth(
  g: CanvasRenderingContext2D,
  growth: Growth,
  pad: (id: string) => Pad | undefined,
  tick: number,
) {
  const k = grown(growth.age)
  const { x, y } = growth
  switch (growth.kind) {
    case 'sunflower': {
      const n = 2
      for (let i = 0; i < n; i++)
        drawSunflower(g, x - 7 + i * 14, y - 1, tick + i * 23, 0.4 + 0.6 * k)
      return
    }
    case 'mushroom': {
      // A springy cap over the bed, squashing as it boings.
      const squash = 1 + Math.max(0, Math.sin(tick / 6)) * 0.05
      const r = 15 * k
      if (r < 2) return
      g.fillStyle = INK
      g.fillRect(x - 3, y - 9 * k, 6, 9 * k)
      g.fillStyle = RAMPS.cream[3]
      g.fillRect(x - 2, y - 9 * k, 4, 9 * k)
      g.save()
      g.translate(x, y - 8 * k)
      g.scale(squash, 1 / squash)
      g.fillStyle = INK
      g.beginPath()
      g.ellipse(0, 0, r + 1, r * 0.55 + 1, 0, Math.PI, 0)
      g.fill()
      g.fillStyle = RAMPS.ember[2]
      g.beginPath()
      g.ellipse(0, 0, r, r * 0.55, 0, Math.PI, 0)
      g.fill()
      g.fillStyle = RAMPS.ember[3]
      g.beginPath()
      g.ellipse(-r * 0.25, -r * 0.18, r * 0.5, r * 0.25, 0, Math.PI, 0)
      g.fill()
      g.fillStyle = '#ffffff'
      for (const [sx, sy] of [
        [-0.5, -0.25],
        [0.2, -0.35],
        [0.55, -0.15],
      ] as const)
        g.fillRect(Math.round(sx * r), Math.round(sy * r), 2, 2)
      g.restore()
      return
    }
    case 'beanstalk': {
      const top = pad(growth.made[0] ?? '')
      if (!top) return
      const tx = (top.x0 + top.x1) / 2
      const ty = top.y + 4
      const len = Math.hypot(tx - x, ty - y)
      const steps = Math.max(2, Math.round((len * k) / 4))
      // A twisting stalk from the bed toward the perch, leaves along it.
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * k
        const px = x + (tx - x) * t + Math.sin(t * 9 + 1) * 4 * (1 - t)
        const py = y + (ty - y) * t
        g.fillStyle = INK
        g.fillRect(Math.round(px) - 2, Math.round(py) - 2, 5, 5)
        g.fillStyle = i % 2 ? RAMPS.leaf[2] : RAMPS.leaf[3]
        g.fillRect(Math.round(px) - 1, Math.round(py) - 1, 3, 3)
        if (i % 3 === 1) {
          const side = i % 6 === 1 ? 1 : -1
          g.fillStyle = INK
          g.fillRect(Math.round(px) + side * 2, Math.round(py) - 2, side * 5, 3)
          g.fillStyle = RAMPS.leaf[3]
          g.fillRect(Math.round(px) + side * 3, Math.round(py) - 1, side * 3, 1)
        }
      }
      if (k >= 1) {
        // The perch: a broad leaf the pod can stand on.
        g.fillStyle = INK
        g.fillRect(top.x0 - 1, top.y - 2, top.x1 - top.x0 + 2, 6)
        g.fillStyle = RAMPS.leaf[3]
        g.fillRect(top.x0, top.y - 1, top.x1 - top.x0, 2)
        g.fillStyle = RAMPS.leaf[1]
        g.fillRect(top.x0 + 1, top.y + 1, top.x1 - top.x0 - 2, 2)
      }
      return
    }
    case 'vine': {
      let fx = x
      let fy = y
      growth.made.forEach((id, i) => {
        const rung = pad(id)
        if (!rung || k < (i + 1) / (growth.made.length + 1)) return
        const rx = (rung.x0 + rung.x1) / 2
        g.strokeStyle = INK
        g.lineWidth = 3
        g.beginPath()
        g.moveTo(fx, fy)
        g.quadraticCurveTo((fx + rx) / 2 + 8, (fy + rung.y) / 2, rx, rung.y + 3)
        g.stroke()
        g.strokeStyle = RAMPS.leaf[2]
        g.lineWidth = 1.5
        g.stroke()
        g.fillStyle = INK
        g.fillRect(rung.x0 - 1, rung.y - 2, rung.x1 - rung.x0 + 2, 5)
        g.fillStyle = RAMPS.leaf[3]
        g.fillRect(rung.x0, rung.y - 1, rung.x1 - rung.x0, 2)
        g.fillStyle = RAMPS.pink[3]
        g.fillRect(rx - 1, rung.y - 3, 2, 2)
        fx = rx
        fy = rung.y
      })
      return
    }
    case 'flower':
      return
  }
}

const MARK_RAMP: Record<PlantKind, readonly string[]> = {
  flower: RAMPS.pink,
  sunflower: RAMPS.gold,
  beanstalk: RAMPS.leaf,
  mushroom: RAMPS.ember,
  vine: RAMPS.teal,
}
const MARK_LETTER: Record<PlantKind, string> = {
  flower: '',
  sunflower: '*',
  beanstalk: 'B',
  mushroom: 'M',
  vine: 'V',
}

/** The marker on an unplanted bed saying what it will grow. */
export function drawGrowsMark(
  g: CanvasRenderingContext2D,
  pad: Pad,
  tick: number,
) {
  if (pad.grows === 'flower' || pad.planted) return
  const ramp = MARK_RAMP[pad.grows]
  const x = Math.round((pad.x0 + pad.x1) / 2)
  const y = Math.round(pad.y - 16 + Math.sin(tick / 12) * 1.5)
  g.fillStyle = INK
  g.fillRect(x - 5, y - 5, 11, 11)
  g.fillStyle = ramp[2]!
  g.fillRect(x - 4, y - 4, 9, 9)
  g.fillStyle = ramp[4]!
  g.fillRect(x - 4, y - 4, 9, 1)
  drawText(g, MARK_LETTER[pad.grows], x + 1, y - 3, {
    align: 'center',
    color: INK,
  })
}

/** Petal rings: the next one bright and turning, the rest faint, the passed ones gone. */
export function drawRings(
  g: CanvasRenderingContext2D,
  rings: readonly RingSpec[],
  next: number,
  tick: number,
) {
  rings.forEach((r, i) => {
    if (i < next) return
    const on = i === next
    const n = 10
    if (on) glow(g, r.x, r.y, r.r + 8, RAMPS.pink[3], 0.3)
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + (on ? tick / 40 : 0)
      const px = Math.round(r.x + Math.cos(a) * r.r)
      const py = Math.round(r.y + Math.sin(a) * r.r)
      g.fillStyle = INK
      g.fillRect(px - 2, py - 2, 4, 4)
      g.fillStyle = on
        ? k % 2
          ? RAMPS.pink[3]
          : RAMPS.gold[4]
        : rgba(RAMPS.pink[2], 0.6)
      g.fillRect(px - 1, py - 1, 2, 2)
    }
    if (on)
      drawText(g, `${i + 1}`, r.x, r.y - 3, {
        align: 'center',
        color: '#ffffff',
        outline: INK,
      })
  })
}

const ACORN = pixelSprite(
  ['.ddd.', 'dDDDd', 'GgGgG', 'GgYgG', 'GGgGG', '.GGG.', '..G..'],
  {
    d: RAMPS.earth[1],
    D: RAMPS.earth[2],
    G: RAMPS.gold[2],
    g: RAMPS.gold[3],
    Y: RAMPS.gold[4],
  },
)

/** A golden acorn, bobbing and glinting. */
export function drawAcorn(
  g: CanvasRenderingContext2D,
  a: AcornSpec,
  tick: number,
) {
  const y = a.y + Math.sin(tick / 15) * 2
  glow(g, a.x, y, 12, RAMPS.gold[3], 0.35 + 0.15 * Math.sin(tick / 8))
  drawSprite(g, ACORN, a.x, y)
}

/** A windmill: tower to the ground, sails turning, a creak-light at the top. */
export function drawWindmill(
  g: CanvasRenderingContext2D,
  m: Windmill,
  ground: number,
  tick: number,
) {
  bevel(g, m.x - 4, m.y + 4, 8, ground - m.y - 2, RAMPS.cream, { depth: 1 })
  for (const a of sailAngles(m)) {
    const ex = m.x + Math.cos(a) * m.r
    const ey = m.y + Math.sin(a) * m.r
    g.strokeStyle = INK
    g.lineWidth = 3
    g.beginPath()
    g.moveTo(m.x, m.y)
    g.lineTo(ex, ey)
    g.stroke()
    g.strokeStyle = RAMPS.earth[3]
    g.lineWidth = 1.2
    g.stroke()
    // The sail cloth along the arm's outer two thirds.
    const nx = -Math.sin(a)
    const ny = Math.cos(a)
    g.fillStyle = rgba(RAMPS.cream[3], 0.85)
    g.beginPath()
    g.moveTo(m.x + Math.cos(a) * m.r * 0.3, m.y + Math.sin(a) * m.r * 0.3)
    g.lineTo(ex, ey)
    g.lineTo(ex + nx * 7, ey + ny * 7)
    g.lineTo(
      m.x + Math.cos(a) * m.r * 0.3 + nx * 7,
      m.y + Math.sin(a) * m.r * 0.3 + ny * 7,
    )
    g.closePath()
    g.fill()
    g.strokeStyle = INK
    g.lineWidth = 0.8
    g.stroke()
  }
  shadedOrb(g, m.x, m.y, 5, RAMPS.rust)
  // The creak: a lamp blinks as a sail passes the top.
  const top = sailAngles(m).some(
    (a) =>
      Math.abs(
        Math.atan2(Math.sin(a + Math.PI / 2), Math.cos(a + Math.PI / 2)),
      ) < 0.15,
  )
  if (top)
    glow(g, m.x, m.y - m.r - 4, 6, RAMPS.gold[3], 0.6 + 0.2 * Math.sin(tick))
}

/** Dandelion fluff drifting. */
export function drawFluff(g: CanvasRenderingContext2D, f: Fluff, tick: number) {
  const x = Math.round(f.x)
  const y = Math.round(f.y)
  g.fillStyle = rgba('#ffffff', 0.8)
  g.fillRect(x - 1, y, 3, 1)
  g.fillRect(x, y - 1, 1, 3)
  if ((tick + x) % 20 < 10) g.fillRect(x - 2, y - 2, 1, 1)
  g.fillStyle = RAMPS.cream[2]
  g.fillRect(x, y + 1, 1, 2)
}

/** Fluff stuck to the pod, ringing it. */
export function drawPodFluff(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  count: number,
  tick: number,
) {
  for (let i = 0; i < count; i++) {
    const a = (i / Math.max(1, count)) * Math.PI * 2 + tick / 40
    const px = Math.round(x + Math.cos(a) * 8)
    const py = Math.round(y + Math.sin(a) * 8)
    g.fillStyle = '#ffffff'
    g.fillRect(px - 1, py, 3, 1)
    g.fillRect(px, py - 1, 1, 3)
  }
}

const CROW_FRAMES = [
  pixelSprite(['...KK...', 'K.KkkK.K', 'KKkRkkKK', '..KkkK..', '...KK...'], {
    K: RAMPS.night[2],
    k: RAMPS.steel[1],
    R: RAMPS.ember[2],
  }),
  pixelSprite(['...KK...', '..KkkK..', 'KKkRkkKK', 'K.KkkK.K', '...KK...'], {
    K: RAMPS.night[2],
    k: RAMPS.steel[1],
    R: RAMPS.ember[2],
  }),
]

/** A crow-bot, and while it caws, the shadow it will dive at. */
export function drawCrow(
  g: CanvasRenderingContext2D,
  c: Crow,
  floor: (x: number) => number,
  tick: number,
) {
  if (c.state === 'tell') {
    const sy = floor(c.aimX)
    dropShadow(g, c.aimX, sy + 1, 6, 2, 0.5)
    if (tick % 12 < 8)
      drawText(g, 'CAW!', c.x, c.y - 14, {
        align: 'center',
        color: RAMPS.ember[3],
        outline: INK,
      })
  }
  const frame =
    CROW_FRAMES[Math.floor(tick / (c.state === 'dive' ? 3 : 7)) % 2]!
  drawSprite(g, frame, c.x, c.y, { flipX: c.vx < 0 })
}

/** A waterfall: white water streaming down a column, spray at its foot. */
export function drawFall(
  g: CanvasRenderingContext2D,
  f: FallSpec,
  tick: number,
) {
  const w = f.x1 - f.x0
  g.fillStyle = rgba(RAMPS.sky[4], 0.28)
  g.fillRect(f.x0, f.y0, w, f.y1 - f.y0)
  for (let i = 0; i < Math.floor(w / 3); i++) {
    const x = f.x0 + 1 + i * 3
    const run = 14 + ((i * 7) % 11)
    const off = (tick * (1.6 + (i % 3) * 0.4) + i * 23) % (f.y1 - f.y0 + run)
    const y0 = f.y0 + off - run
    const top = Math.max(f.y0, y0)
    const bottom = Math.min(f.y1, y0 + run)
    if (bottom <= top) continue
    g.fillStyle = i % 2 ? '#ffffff' : RAMPS.sky[4]
    g.fillRect(x, top, 2, bottom - top)
  }
  for (let k = 0; k < 6; k++) {
    const sx = f.x0 + ((k * 13 + tick * 0.7) % (w + 14)) - 7
    const sy = f.y1 - ((tick * 0.5 + k * 5) % 9)
    g.fillStyle = rgba('#ffffff', 0.55)
    g.fillRect(Math.round(sx), Math.round(sy), 2, 1)
  }
  g.fillStyle = rgba('#ffffff', 0.4)
  g.fillRect(f.x0 - 3, f.y1 - 3, w + 6, 3)
}

/** A drip stalactite: a rock tooth with a drop that swells, hangs, then falls. */
export function drawDrip(
  g: CanvasRenderingContext2D,
  d: DripSpec,
  floor: number,
  tick: number,
) {
  g.fillStyle = INK
  g.beginPath()
  g.moveTo(d.x - 6, d.y - 22)
  g.lineTo(d.x + 6, d.y - 22)
  g.lineTo(d.x + 1, d.y + 1)
  g.lineTo(d.x - 1, d.y + 1)
  g.closePath()
  g.fill()
  g.fillStyle = RAMPS.steel[2]
  g.beginPath()
  g.moveTo(d.x - 4, d.y - 22)
  g.lineTo(d.x + 4, d.y - 22)
  g.lineTo(d.x + 0.5, d.y - 2)
  g.lineTo(d.x - 0.5, d.y - 2)
  g.closePath()
  g.fill()
  const v = dripAt(d, tick, floor)
  if (v.state === 'wait') return
  const r = v.state === 'swell' ? 0.8 + v.swell * 1.8 : 2.4
  if (v.state === 'hang' && tick % 6 < 3)
    glow(g, v.x, v.y, 8, RAMPS.sky[4], 0.4)
  g.fillStyle = INK
  g.fillRect(
    Math.round(v.x - r - 0.5),
    Math.round(v.y - r),
    Math.ceil(r * 2 + 1),
    Math.ceil(r * 2 + 1),
  )
  g.fillStyle = v.state === 'fall' ? '#ffffff' : RAMPS.sky[3]
  g.fillRect(
    Math.round(v.x - r + 0.5),
    Math.round(v.y - r + 1),
    Math.max(1, Math.ceil(r * 2 - 1)),
    Math.max(1, Math.ceil(r * 2 - 1)),
  )
}

/** A pebble that wobbles on its slope (the tell) and then rolls down it. */
export function drawPebble(
  g: CanvasRenderingContext2D,
  p: PebbleSpec,
  groundAt: (x: number) => number,
  tick: number,
) {
  const v = pebbleAt(p, tick, groundAt)
  if (!v) return
  const wob = v.rolling ? 0 : Math.sin(tick * 0.9) * 1.2
  shadedOrb(g, v.x + wob, v.y - 1, 4, RAMPS.steel)
  if (!v.rolling && tick % 14 < 7)
    drawText(g, '!', v.x, v.y - 12, {
      align: 'center',
      color: RAMPS.ember[3],
      outline: INK,
    })
  if (v.rolling && tick % 4 < 2) {
    g.fillStyle = rgba(RAMPS.earth[3], 0.6)
    g.fillRect(
      Math.round(v.x - Math.sign(p.x1 - p.x0) * 5),
      Math.round(v.y + 1),
      2,
      1,
    )
  }
}

// --- Firefly Caverns ----------------------------------------------------------------------------

/** A crystal bumper: a faceted gem that glints. */
export function drawCrystal(
  g: CanvasRenderingContext2D,
  c: CrystalSpec,
  tick: number,
) {
  glow(g, c.x, c.y, c.r + 10, RAMPS.teal[3], 0.25 + 0.1 * Math.sin(tick / 20))
  g.fillStyle = INK
  g.beginPath()
  g.moveTo(c.x, c.y - c.r - 1)
  g.lineTo(c.x + c.r + 1, c.y)
  g.lineTo(c.x, c.y + c.r + 1)
  g.lineTo(c.x - c.r - 1, c.y)
  g.closePath()
  g.fill()
  g.fillStyle = RAMPS.teal[2]
  g.beginPath()
  g.moveTo(c.x, c.y - c.r)
  g.lineTo(c.x + c.r, c.y)
  g.lineTo(c.x, c.y + c.r)
  g.lineTo(c.x - c.r, c.y)
  g.closePath()
  g.fill()
  g.fillStyle = RAMPS.teal[4]
  g.fillRect(Math.round(c.x - 1), Math.round(c.y - c.r + 2), 2, 3)
  if (tick % 90 < 6) g.fillRect(Math.round(c.x + 2), Math.round(c.y - 2), 1, 1)
}

/** A spore puffball: it swells (the tell) as the pod nears, and breathes a pink haze. */
export function drawSpore(
  g: CanvasRenderingContext2D,
  s: SporeSpec,
  podX: number,
  podY: number,
  tick: number,
) {
  const swell = sporeSwell(s, podX, podY)
  const r = s.r * (1 + 0.35 * swell) + Math.sin(tick / 14) * 0.5
  glow(g, s.x, s.y, r + 8, RAMPS.pink[3], 0.2 + 0.25 * swell)
  shadedOrb(g, s.x, s.y, r, RAMPS.pink)
  g.fillStyle = INK
  g.fillRect(Math.round(s.x - 3), Math.round(s.y - 1), 1, 2)
  g.fillRect(Math.round(s.x + 2), Math.round(s.y - 1), 1, 2)
  for (let k = 0; k < 4; k++) {
    const a = tick / 30 + k * 1.7
    g.fillStyle = rgba(RAMPS.pink[4], 0.5)
    g.fillRect(
      Math.round(s.x + Math.cos(a) * (r + 3)),
      Math.round(s.y + Math.sin(a) * (r + 3) - swell * 3),
      1,
      1,
    )
  }
}

/** A cave lantern on its post: a dead husk until relit, then a warm glow. */
export function drawLantern(
  g: CanvasRenderingContext2D,
  l: LanternSpec,
  ground: number,
  lit: boolean,
  tick: number,
) {
  g.fillStyle = INK
  g.fillRect(Math.round(l.x) - 1, ground - 16, 3, 16)
  g.fillRect(Math.round(l.x) - 5, ground - 24, 11, 10)
  g.fillStyle = lit ? RAMPS.gold[3] : RAMPS.steel[1]
  g.fillRect(Math.round(l.x) - 4, ground - 23, 9, 8)
  if (lit) {
    g.fillStyle = RAMPS.gold[4]
    g.fillRect(
      Math.round(l.x) - 1,
      ground - 21 + (tick % 20 < 10 ? 0 : 1),
      3,
      4,
    )
    glow(g, l.x, ground - 19, 28, RAMPS.gold[3], 0.45)
  } else if (tick % 60 < 8) {
    // A dim flicker: it wants lighting.
    g.fillStyle = RAMPS.gold[1]
    g.fillRect(Math.round(l.x), ground - 20, 1, 2)
  }
}

/** A firefly: a drifting spark that lights the cave a little. */
export function drawFirefly(
  g: CanvasRenderingContext2D,
  f: { x: number; y: number },
  tick: number,
) {
  const on = tick % 70 < 52
  if (on) glow(g, f.x, f.y, 9, RAMPS.leaf[3], 0.55)
  g.fillStyle = on ? RAMPS.leaf[4] : RAMPS.leaf[2]
  g.fillRect(Math.round(f.x), Math.round(f.y), 1, 1)
}

/** Where a cave's fireflies drift: a few near each stretch of the map, from the tick alone. */
export function fireflies(
  w: number,
  h: number,
  tick: number,
): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = []
  const n = Math.max(4, Math.round(w / 90))
  for (let k = 0; k < n; k++) {
    const hx = ((k + 0.5) / n) * w + ((k * 37) % 23) - 11
    const hy = h * (0.3 + ((k * 53) % 40) / 100)
    out.push(fireflyAt(hx, hy, k, tick))
  }
  return out
}

/**
 * The dark of a cave over the world view: pixel cells that fade from clear near a light to
 * near-black far from every one. Drawn in world units, inside the camera transform.
 */
export function drawDarkness(
  g: CanvasRenderingContext2D,
  view: { x0: number; y0: number; x1: number; y1: number },
  lights: readonly LightSource[],
) {
  const cell = LIGHT.cell
  const x0 = Math.floor(view.x0 / cell) * cell
  const y0 = Math.floor(view.y0 / cell) * cell
  g.fillStyle = '#04021a'
  for (let y = y0; y < view.y1; y += cell) {
    for (let x = x0; x < view.x1; x += cell) {
      const d = darkAt(lights, x + cell / 2, y + cell / 2)
      // Four steps of dark, so the edge reads as pixel art rather than a smooth fade.
      const step = Math.round(d * 4) / 4
      if (step <= 0) continue
      g.globalAlpha = step
      g.fillRect(x, y, cell, cell)
    }
  }
  g.globalAlpha = 1
}

/** A lightning cloud: it darkens and crackles while it charges, then a bolt drops to the ground. */
export function drawStormCloud(
  g: CanvasRenderingContext2D,
  c: StormCloudSpec,
  floor: number,
  tick: number,
) {
  const v = stormCloudAt(c, tick)
  const lit = v.state !== 'rest'
  const puffs = [-12, -4, 5, 13]
  for (const dx of puffs) {
    g.fillStyle = INK
    g.fillRect(c.x + dx - 7, c.y - 9, 14, 12)
  }
  for (const dx of puffs) {
    g.fillStyle = lit ? RAMPS.steel[1] : RAMPS.steel[3]
    g.fillRect(c.x + dx - 6, c.y - 8, 12, 10)
  }
  if (v.state === 'charge') {
    if (tick % 8 < 4)
      glow(g, c.x, c.y, 10 + 12 * v.charge, '#ffffff', 0.35 * v.charge)
    if (tick % 10 < 3) {
      g.fillStyle = '#fff2a0'
      g.fillRect(c.x - 1, c.y + 3, 2, 3)
    }
  }
  if (v.state === 'strike') {
    glow(g, c.x, c.y + 8, 16, '#fff2a0', 0.5)
    let x = c.x
    let y = c.y + 3
    while (y < floor) {
      const nx = c.x + ((Math.floor(y / 6) % 2) * 2 - 1) * 3
      g.fillStyle = INK
      g.fillRect(Math.min(x, nx) - 2, y, 6, 7)
      g.fillStyle = '#fff2a0'
      g.fillRect(Math.min(x, nx) - 1, y, 3, 7)
      x = nx
      y += 6
    }
  }
}
