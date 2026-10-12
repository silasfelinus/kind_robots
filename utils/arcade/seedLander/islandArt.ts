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
import type { Growth } from './gardens'
import type { Crow, Fluff, Windmill } from './hazards'
import { sailAngles } from './hazards'
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
