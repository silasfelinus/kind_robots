// /utils/arcade/sinkSuds/sceneArt.ts
//
// Sink Suds' art for Wash Cycles 2 and 3 and the endings (conductor kr-arcade/t-045): the laundry
// room, the aquarium nook, the garden, the car wash, the town plaza and the palace; their pests
// (lint balls, sock snakes, algae puffs, snails, pufferfish, water striders, leaf boats, wax blobs,
// spinners, the Grime King's minions and drops); the props (leaves, odd socks, the robot car,
// the roller brushes and wax jets); and the clean ending, the true ending and the credits.

import { drawText } from '../font'
import {
  INK,
  RAMPS,
  backdropRng,
  bandedGradient,
  bevel,
  cachedLayer,
  drawSprite,
  glow,
  mix,
  pixelSprite,
  rgba,
  shadedOrb,
} from '../snes'
import type { Ramp } from '../snes'
import { W, H } from './basins'
import type { BasinDef, Point } from './basins'
import { propClear } from './art'

// --- pests --------------------------------------------------------------------------------------

/** A lint ball: a grey fuzzball as big as the crumbs it has rolled up. */
export function renderLint(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  tick: number,
) {
  shadedOrb(g, x, y, r, RAMPS.steel)
  g.fillStyle = RAMPS.steel[4]
  const n = Math.round(r * 1.4)
  for (let i = 0; i < n; i++) {
    const a = i * 2.4 + tick / 30
    g.fillRect(
      Math.round(x + Math.cos(a) * r),
      Math.round(y + Math.sin(a) * r),
      1,
      1,
    )
  }
  g.fillStyle = INK
  g.fillRect(Math.round(x - r * 0.35), Math.round(y - 1), 2, 2)
  g.fillRect(Math.round(x + r * 0.2), Math.round(y - 1), 2, 2)
}

const SOCK_COLOURS: readonly Ramp[] = [
  RAMPS.pink,
  RAMPS.teal,
  RAMPS.gold,
  RAMPS.purple,
  RAMPS.leaf,
  RAMPS.ember,
]

/** One sock: a little L-shape with a striped cuff. */
export function renderSock(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  colour: number,
  angle: number,
  scale = 1,
) {
  const ramp = SOCK_COLOURS[colour % SOCK_COLOURS.length]!
  g.save()
  g.translate(x, y)
  g.rotate(angle)
  g.scale(scale, scale)
  g.fillStyle = INK
  g.fillRect(-5, -8, 9, 13)
  g.fillRect(-5, 2, 13, 7)
  g.fillStyle = ramp[2]
  g.fillRect(-4, -7, 7, 12)
  g.fillRect(-4, 3, 11, 5)
  g.fillStyle = ramp[3]
  g.fillRect(-4, -7, 2, 12)
  g.fillStyle = '#ffffff'
  g.fillRect(-4, -7, 7, 2)
  g.fillStyle = ramp[0]
  g.fillRect(-4, -4, 7, 1)
  g.restore()
}

/** The sock snake: a chain of socks, the head with eyes. */
export function renderSockSnake(
  g: CanvasRenderingContext2D,
  segs: readonly Point[],
  tick: number,
) {
  for (let i = segs.length - 1; i >= 0; i--) {
    const s = segs[i]!
    const next = segs[i - 1] ?? s
    const a = Math.atan2(next.y - s.y, next.x - s.x)
    renderSock(g, s.x, s.y + Math.sin(tick / 6 + i) * 1, i, a + Math.PI / 2)
  }
  const head = segs[0]
  if (!head) return
  g.fillStyle = '#ffffff'
  g.fillRect(Math.round(head.x) - 4, Math.round(head.y) - 4, 3, 3)
  g.fillRect(Math.round(head.x) + 1, Math.round(head.y) - 4, 3, 3)
  g.fillStyle = INK
  g.fillRect(Math.round(head.x) - 3, Math.round(head.y) - 3, 1, 1)
  g.fillRect(Math.round(head.x) + 2, Math.round(head.y) - 3, 1, 1)
  // The tail end flashes: nibble here.
  const tail = segs[segs.length - 1]!
  if (segs.length > 1 && Math.floor(tick / 10) % 2 === 0) {
    g.strokeStyle = RAMPS.gold[4]
    g.beginPath()
    g.arc(tail.x, tail.y, 9, 0, Math.PI * 2)
    g.stroke()
  }
}

/** An algae puff: swelling greener and spikier as it nears its bloom (swell 0..1). */
export function renderAlgae(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  swell: number,
  tick: number,
) {
  const r = 5 + swell * 5
  const ramp: Ramp = [
    RAMPS.leaf[0],
    RAMPS.leaf[1],
    RAMPS.leaf[2],
    RAMPS.leaf[3],
    RAMPS.leaf[4],
  ]
  shadedOrb(g, x, y, r, ramp)
  g.fillStyle = RAMPS.leaf[3]
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + tick / 50
    const spike = r + 1 + swell * 3
    g.fillRect(
      Math.round(x + Math.cos(a) * spike),
      Math.round(y + Math.sin(a) * spike),
      2,
      2,
    )
  }
  if (swell > 0.75 && Math.floor(tick / 5) % 2 === 0)
    glow(g, x, y, r + 10, RAMPS.leaf[3], 0.5)
}

const SNAIL_SPRITE = pixelSprite(
  [
    '.....EEEE.....',
    '...EeeeeeE....',
    '..EeEEEEeeE.k.',
    '..EeEeeEEeE.f.',
    '..EeEeEeEeE.f.',
    '..EeeEEeeeEff.',
    '...EEeeeeEFFF.',
    'ffffffffffffff',
    '.FFFFFFFFFFFF.',
  ],
  {
    E: RAMPS.earth[1],
    e: RAMPS.earth[3],
    f: mix(RAMPS.leaf[2], RAMPS.cream[3], 0.4),
    F: mix(RAMPS.leaf[1], RAMPS.cream[2], 0.4),
    k: INK,
  },
)

export function renderSnail(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  flip: boolean,
  rolled: boolean,
) {
  drawSprite(g, SNAIL_SPRITE, x, y, { flipX: flip, scale: 2, flipY: rolled })
}

const PUFFER_SPRITE = pixelSprite(
  [
    '...YYYY...',
    '.YYYYYYYY.',
    'YYwkYYYYYO',
    'YYkkYYYYOO',
    'YYYYYYmYYO',
    '.yyyyyyyy.',
    '...yyyy...',
  ],
  {
    Y: RAMPS.gold[3],
    y: RAMPS.gold[2],
    w: '#ffffff',
    k: INK,
    O: RAMPS.rust[2],
    m: RAMPS.rust[1],
  },
)

/** A pufferfish: a cheerful fish, a wiggle (the tell), then a spiky ball. */
export function renderPuffer(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  state: 'calm' | 'tell' | 'puffed',
  flip: boolean,
  tick: number,
) {
  if (state === 'puffed') {
    shadedOrb(g, x, y, 13, RAMPS.gold)
    g.fillStyle = RAMPS.rust[1]
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      g.fillRect(
        Math.round(x + Math.cos(a) * 15) - 1,
        Math.round(y + Math.sin(a) * 15) - 1,
        3,
        3,
      )
    }
    g.fillStyle = INK
    g.fillRect(Math.round(x) - 5, Math.round(y) - 3, 3, 3)
    g.fillRect(Math.round(x) + 3, Math.round(y) - 3, 3, 3)
    g.fillRect(Math.round(x) - 2, Math.round(y) + 4, 5, 2)
    return
  }
  const wig = state === 'tell' ? Math.sin(tick) * 2 : 0
  drawSprite(g, PUFFER_SPRITE, x + wig, y, { flipX: flip, scale: 2 })
}

/** A water strider: long legs skating on the surface. */
export function renderStrider(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  tick: number,
) {
  g.save()
  g.translate(x, y)
  g.rotate(angle)
  g.strokeStyle = INK
  g.lineWidth = 1
  const kick = Math.sin(tick / 2) * 2
  for (const side of [-1, 1]) {
    g.beginPath()
    g.moveTo(-2, 0)
    g.lineTo(-10 - kick, side * 10)
    g.moveTo(2, 0)
    g.lineTo(10 + kick, side * 9)
    g.moveTo(0, 0)
    g.lineTo(-2, side * 13)
    g.stroke()
    g.fillStyle = rgba(RAMPS.water[4], 0.7)
    g.fillRect(-11 - kick, side * 10 - 1, 3, 2)
    g.fillRect(9 + kick, side * 9 - 1, 3, 2)
  }
  g.fillStyle = RAMPS.ember[1]
  g.fillRect(-6, -2, 12, 4)
  g.fillStyle = RAMPS.ember[2]
  g.fillRect(-5, -2, 10, 2)
  g.fillStyle = '#ffffff'
  g.fillRect(4, -2, 2, 1)
  g.restore()
}

/** The strider's tell: a line of ripples across the water where it is about to skate. */
export function renderStriderLine(
  g: CanvasRenderingContext2D,
  a: Point,
  b: Point,
  k: number,
  tick: number,
) {
  g.save()
  g.strokeStyle = rgba(RAMPS.ember[3], 0.35 + 0.35 * k)
  g.setLineDash([3, 5])
  g.lineDashOffset = -tick
  g.lineWidth = 2
  g.beginPath()
  g.moveTo(a.x, a.y)
  g.lineTo(b.x, b.y)
  g.stroke()
  g.restore()
  for (const p of [a, b]) {
    g.strokeStyle = rgba(RAMPS.water[4], 0.8)
    g.beginPath()
    g.arc(p.x, p.y, 4 + ((tick / 3) % 8), 0, Math.PI * 2)
    g.stroke()
  }
}

/** A floating leaf (also the leaf boat's hull). */
export function renderLeaf(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  angle: number,
  tone = 0,
) {
  const ramp =
    tone % 3 === 0 ? RAMPS.leaf : tone % 3 === 1 ? RAMPS.gold : RAMPS.rust
  g.save()
  g.translate(x, y)
  g.rotate(angle)
  g.fillStyle = INK
  g.beginPath()
  g.ellipse(0, 0, r + 1, r * 0.55 + 1, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = ramp[2]
  g.beginPath()
  g.ellipse(0, 0, r, r * 0.55, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = ramp[3]
  g.beginPath()
  g.ellipse(-r * 0.15, -r * 0.15, r * 0.6, r * 0.25, 0, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = ramp[1]
  g.beginPath()
  g.moveTo(-r, 0)
  g.lineTo(r, 0)
  g.stroke()
  g.restore()
}

/** A leaf boat: a beetle riding a leaf, its raised leaf-sail sheltering its front. */
export function renderLeafBoat(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  heading: number,
  tick: number,
) {
  renderLeaf(g, x, y, 14, heading, 1)
  const fx = Math.cos(heading)
  const fy = Math.sin(heading)
  shadedOrb(g, x - fx * 2, y - fy * 2 - 2, 5, RAMPS.purple)
  g.fillStyle = '#ffffff'
  g.fillRect(Math.round(x + fx * 2) - 1, Math.round(y + fy * 2) - 4, 2, 2)
  // The shield: a curled leaf held up at the front.
  g.strokeStyle = RAMPS.leaf[3]
  g.lineWidth = 3
  g.beginPath()
  g.arc(x, y - 2, 11, heading - 0.9, heading + 0.9)
  g.stroke()
  g.lineWidth = 1
  g.strokeStyle = RAMPS.leaf[1]
  g.beginPath()
  g.arc(x, y - 2, 13, heading - 0.9, heading + 0.9)
  g.stroke()
  void tick
}

/** A wax blob: glossy and soft, then set hard and grey. */
export function renderWax(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  set: number,
  hard: boolean,
  tick: number,
) {
  const ramp: Ramp = hard
    ? [
        RAMPS.steel[0],
        RAMPS.steel[1],
        RAMPS.steel[2],
        RAMPS.steel[3],
        RAMPS.steel[4],
      ]
    : [RAMPS.pink[0], RAMPS.pink[1], RAMPS.pink[2], RAMPS.pink[3], '#ffffff']
  if (hard) {
    bevel(g, x - 9, y - 7, 18, 14, ramp, { depth: 2 })
    return
  }
  const wob = Math.sin(tick / 9 + x) * 0.08
  g.save()
  g.translate(x, y)
  g.scale(1 + wob, 1 - wob)
  shadedOrb(g, 0, 0, 7, ramp)
  g.restore()
  if (set > 0.7 && Math.floor(tick / 6) % 2 === 0) {
    g.strokeStyle = RAMPS.steel[3]
    g.beginPath()
    g.arc(x, y, 9, 0, Math.PI * 2)
    g.stroke()
  }
}

/** A spinner: a wheel brush rolling and ricocheting. */
export function renderSpinner(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  spin: number,
) {
  shadedOrb(g, x, y, 9, RAMPS.ember)
  g.strokeStyle = RAMPS.gold[3]
  g.lineWidth = 2
  for (let i = 0; i < 4; i++) {
    const a = spin + (i * Math.PI) / 2
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + Math.cos(a) * 11, y + Math.sin(a) * 11)
    g.stroke()
  }
  g.lineWidth = 1
  shadedOrb(g, x, y, 3, RAMPS.steel)
}

/** A grime minion: a little blob of muck with a pointy hat. */
export function renderMinion(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  tick: number,
) {
  const ramp: Ramp = [
    RAMPS.earth[0],
    mix(RAMPS.earth[1], RAMPS.leaf[1], 0.4),
    mix(RAMPS.earth[2], RAMPS.leaf[2], 0.4),
    RAMPS.leaf[3],
    RAMPS.cream[3],
  ]
  shadedOrb(g, x, y + Math.sin(tick / 5 + x) * 1, 6, ramp)
  g.fillStyle = RAMPS.gold[3]
  g.fillRect(Math.round(x) - 2, Math.round(y) - 10, 4, 3)
  g.fillRect(Math.round(x) - 1, Math.round(y) - 12, 2, 2)
  g.fillStyle = '#ffffff'
  g.fillRect(Math.round(x) - 3, Math.round(y) - 2, 2, 2)
  g.fillRect(Math.round(x) + 1, Math.round(y) - 2, 2, 2)
}

/** A grime drop, trying to get back to its king. */
export function renderDrop(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  tick: number,
) {
  const ramp: Ramp = [
    RAMPS.earth[0],
    mix(RAMPS.earth[1], RAMPS.leaf[1], 0.4),
    mix(RAMPS.earth[2], RAMPS.leaf[2], 0.4),
    RAMPS.leaf[3],
    RAMPS.cream[3],
  ]
  const s = 1 + Math.sin(tick / 4 + x) * 0.1
  g.save()
  g.translate(x, y)
  g.scale(s, 2 - s)
  shadedOrb(g, 0, 0, 7, ramp)
  g.restore()
  g.fillStyle = INK
  g.fillRect(Math.round(x) - 3, Math.round(y) - 1, 2, 2)
  g.fillRect(Math.round(x) + 1, Math.round(y) - 1, 2, 2)
}

// --- props --------------------------------------------------------------------------------------

/** The robot car riding through Full Detail, its panels grimy until scrubbed (dirt 1..0 each). */
export function renderCar(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  panels: readonly number[],
  tick: number,
) {
  g.fillStyle = rgba(INK, 0.3)
  g.fillRect(x + 4, y + 6, w, h)
  // Wheels.
  for (const wx of [x + 18, x + w - 18]) {
    shadedOrb(g, wx, y + h, 9, RAMPS.steel)
    g.fillStyle = INK
    const a = tick / 6
    g.fillRect(
      Math.round(wx + Math.cos(a) * 5) - 1,
      Math.round(y + h + Math.sin(a) * 5) - 1,
      2,
      2,
    )
  }
  bevel(g, x, y, w, h, RAMPS.sky, { depth: 3 })
  // Cab with a friendly robot face in the windscreen.
  bevel(g, x + w * 0.3, y - 16, w * 0.4, 18, RAMPS.sky, { depth: 2 })
  g.fillStyle = RAMPS.water[4]
  g.fillRect(Math.round(x + w * 0.34), y - 13, Math.round(w * 0.32), 11)
  g.fillStyle = INK
  g.fillRect(Math.round(x + w * 0.42), y - 10, 3, 3)
  g.fillRect(Math.round(x + w * 0.55), y - 10, 3, 3)
  g.fillRect(Math.round(x + w * 0.45), y - 5, Math.round(w * 0.12), 1)
  // Panels in a 3 x 2 grid.
  const cols = 3
  const pw = (w - 8) / cols
  const ph = (h - 8) / 2
  panels.forEach((dirt, i) => {
    const px = x + 4 + (i % cols) * pw
    const py = y + 4 + Math.floor(i / cols) * ph
    g.fillStyle = dirt <= 0 ? RAMPS.sky[3] : RAMPS.sky[2]
    g.fillRect(
      Math.round(px) + 1,
      Math.round(py) + 1,
      Math.round(pw) - 2,
      Math.round(ph) - 2,
    )
    if (dirt > 0) {
      g.fillStyle = rgba('#5a4030', 0.25 + dirt * 0.6)
      g.fillRect(
        Math.round(px) + 1,
        Math.round(py) + 1,
        Math.round(pw) - 2,
        Math.round(ph) - 2,
      )
      g.fillStyle = rgba('#24160e', dirt * 0.7)
      for (let k = 0; k < 4; k++)
        g.fillRect(
          Math.round(px + 4 + k * 7),
          Math.round(py + 4 + (k % 2) * 6),
          3,
          2,
        )
    } else {
      g.fillStyle = '#ffffff'
      g.fillRect(Math.round(px) + 3, Math.round(py) + 2, 4, 1)
    }
  })
}

/** A car-wash roller: the lane light (the tell) and the roller sweeping the lane. */
export function renderRoller(
  g: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  telling: number,
  rollerX: number | null,
  tick: number,
) {
  if (telling > 0) {
    g.fillStyle = rgba(RAMPS.ember[2], Math.floor(tick / 6) % 2 ? 0.28 : 0.12)
    g.fillRect(x0, y0, x1 - x0, y1 - y0)
    for (let x = x0 + 8; x < x1; x += 24) {
      g.fillStyle = Math.floor(tick / 6) % 2 ? RAMPS.ember[3] : RAMPS.ember[1]
      g.fillRect(x, y0 + 2, 6, 3)
    }
  }
  if (rollerX === null) return
  const h = y1 - y0
  g.fillStyle = rgba(INK, 0.3)
  g.fillRect(rollerX - 10, y0 + 4, 26, h)
  for (let i = 0; i < 5; i++) {
    const stripe = (i + Math.floor(tick / 2)) % 2
    g.fillStyle = stripe ? RAMPS.sky[2] : RAMPS.sky[3]
    g.fillRect(rollerX - 12 + i * 5, y0, 5, h)
  }
  g.fillStyle = RAMPS.steel[3]
  g.fillRect(rollerX - 2, y0 - 2, 4, h + 4)
}

/** A wax jet on the rim: a nozzle that puffs on the beat (puff 0..1). */
export function renderJet(
  g: CanvasRenderingContext2D,
  at: Point,
  toward: Point,
  puff: number,
  warn: boolean,
  tick: number,
) {
  const a = Math.atan2(toward.y - at.y, toward.x - at.x)
  g.save()
  g.translate(at.x, at.y)
  g.rotate(a)
  bevel(
    g,
    -8,
    -5,
    14,
    10,
    warn && Math.floor(tick / 5) % 2 ? RAMPS.gold : RAMPS.steel,
    { depth: 2 },
  )
  if (puff > 0) {
    for (let i = 0; i < 6; i++) {
      g.fillStyle = rgba(RAMPS.cream[4], 0.7 * puff)
      g.beginPath()
      g.arc(
        10 + i * 9 * (1.2 - puff),
        Math.sin(i * 2 + tick / 3) * 3,
        4 + i * 1.2,
        0,
        Math.PI * 2,
      )
      g.fill()
    }
  }
  g.restore()
}

/** A raindrop splash ring. */
export function renderSplash(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  life: number,
) {
  // Wider as it fades; a bloom's long-lived splash never goes negative.
  const r = Math.max(2, 10 - Math.min(life, 20) * 0.4)
  g.strokeStyle = rgba(RAMPS.water[4], Math.min(1, life / 20))
  g.beginPath()
  g.ellipse(x, y, r, r * 0.5, 0, 0, Math.PI * 2)
  g.stroke()
}

/** Falling rain streaks over the whole scene (cosmetic). */
export function renderRain(
  g: CanvasRenderingContext2D,
  tick: number,
  heavy: boolean,
) {
  g.fillStyle = rgba(RAMPS.sky[4], heavy ? 0.45 : 0.3)
  const n = heavy ? 60 : 30
  for (let i = 0; i < n; i++) {
    const x = ((i * 97 + tick * 3) % (W + 40)) - 20
    const y = ((i * 53 + tick * 9) % (H + 20)) - 10
    g.fillRect(Math.round(x), Math.round(y), 1, 6)
  }
}

// --- rooms --------------------------------------------------------------------------------------

function propsAround(
  k: CanvasRenderingContext2D,
  b: BasinDef,
  props: Array<{
    draw: (k: CanvasRenderingContext2D, x: number, y: number) => void
    x: number
    y: number
  }>,
) {
  for (const p of props) if (propClear(b, p.x, p.y)) p.draw(k, p.x, p.y)
}

/** The laundry: blue-grey tiles, a washing-machine front around the drum, a basket and a jug. */
export function renderLaundry(g: CanvasRenderingContext2D, b: BasinDef) {
  cachedLayer(g, `sink-suds-laundry-${b.id}`, W, H, (k) => {
    bandedGradient(k, 0, 0, W, H, [RAMPS.sky[1], RAMPS.night[2]], 6)
    for (let y = 0; y < H; y += 20)
      for (let x = (y / 20) % 2 ? -10 : 0; x < W; x += 20) {
        k.fillStyle = rgba(RAMPS.sky[3], 0.08)
        k.fillRect(x + 1, y + 1, 18, 18)
      }
    // The machine's white front panel and its control strip.
    bevel(
      k,
      34,
      22,
      W - 68,
      H - 30,
      [
        RAMPS.steel[1],
        RAMPS.steel[2],
        RAMPS.steel[3],
        RAMPS.cream[3],
        '#ffffff',
      ],
      { depth: 3 },
    )
    k.fillStyle = RAMPS.steel[1]
    k.fillRect(44, 30, W - 88, 4)
    for (let i = 0; i < 4; i++)
      shadedOrb(k, 70 + i * 14, 34, 3, i % 2 ? RAMPS.leaf : RAMPS.ember)
    propsAround(k, b, [
      {
        x: 18,
        y: H - 16,
        draw: (c, x, y) => {
          bevel(c, x - 12, y - 22, 24, 22, RAMPS.earth, { depth: 2 })
          for (let i = 0; i < 4; i++) {
            c.fillStyle = RAMPS.earth[1]
            c.fillRect(x - 10 + i * 6, y - 20, 2, 18)
          }
        },
      },
    ])
  })
}

/** The aquarium nook: a cosy wallpapered wall with a lamp, behind the tank's wooden stand. */
export function renderAquarium(g: CanvasRenderingContext2D, b: BasinDef) {
  cachedLayer(g, `sink-suds-aquarium-${b.id}`, W, H, (k) => {
    k.fillStyle = mix(RAMPS.purple[1], RAMPS.night[2], 0.4)
    k.fillRect(0, 0, W, H)
    for (let x = 0; x < W; x += 28) {
      k.fillStyle = rgba(RAMPS.purple[3], 0.2)
      k.fillRect(x, 0, 12, H)
      for (let y = 10; y < H; y += 32) {
        k.fillStyle = rgba(RAMPS.gold[3], 0.25)
        k.fillRect(x + 18, y, 3, 3)
      }
    }
    // The wooden stand under the tank.
    bevel(k, 6, H - 22, W - 12, 20, RAMPS.earth, { depth: 2 })
    // A lamp glow at the top left.
    glow(k, 20, 20, 60, RAMPS.gold[3], 0.25)
  })
}

const GARDEN_STARS = (() => {
  const rand = backdropRng(61)
  return Array.from({ length: 24 }, () => ({ x: rand() * W, y: rand() * 70 }))
})()

/** The garden: evening sky, a hedge, flowers in the grass round the birdbath's stone plinth. */
export function renderGarden(g: CanvasRenderingContext2D, b: BasinDef) {
  cachedLayer(g, `sink-suds-garden-${b.id}`, W, H, (k) => {
    bandedGradient(
      k,
      0,
      0,
      W,
      120,
      [RAMPS.purple[1], RAMPS.pink[2], RAMPS.gold[3]],
      4,
    )
    k.fillStyle = '#ffffff'
    for (const s of GARDEN_STARS)
      k.fillRect(Math.round(s.x), Math.round(s.y), 1, 1)
    // The hedge.
    k.fillStyle = RAMPS.leaf[1]
    k.fillRect(0, 80, W, 50)
    for (let x = 0; x < W; x += 14) {
      k.fillStyle = RAMPS.leaf[2]
      k.beginPath()
      k.arc(x + 7, 82 + ((x * 7) % 5), 10, 0, Math.PI * 2)
      k.fill()
    }
    // The lawn.
    bandedGradient(k, 0, 120, W, H - 120, [RAMPS.leaf[2], RAMPS.leaf[1]], 6)
    const rand = backdropRng(67)
    for (let i = 0; i < 70; i++) {
      const x = rand() * W
      const y = 130 + rand() * (H - 140)
      if (!propClear(b, x, y + 14)) continue
      k.fillStyle = [RAMPS.pink[3], RAMPS.gold[4], '#ffffff', RAMPS.purple[3]][
        i % 4
      ]!
      k.fillRect(Math.round(x), Math.round(y), 2, 2)
      k.fillStyle = RAMPS.leaf[3]
      k.fillRect(Math.round(x), Math.round(y) + 2, 1, 3)
    }
  })
}

/** The car-wash bay: concrete, hazard stripes and strip lights. */
export function renderCarWash(g: CanvasRenderingContext2D, b: BasinDef) {
  cachedLayer(g, `sink-suds-carwash-${b.id}`, W, H, (k) => {
    k.fillStyle = RAMPS.night[2]
    k.fillRect(0, 0, W, H)
    for (let y = 0; y < H; y += 30) {
      k.fillStyle = rgba(RAMPS.steel[2], 0.12)
      k.fillRect(0, y, W, 1)
    }
    // Hazard stripes along the top and bottom.
    for (const y of [4, H - 14]) {
      for (let x = -20; x < W; x += 20) {
        k.fillStyle = RAMPS.gold[3]
        k.beginPath()
        k.moveTo(x, y)
        k.lineTo(x + 10, y)
        k.lineTo(x + 20, y + 10)
        k.lineTo(x + 10, y + 10)
        k.fill()
      }
    }
    for (let x = 30; x < W; x += 90) {
      k.fillStyle = RAMPS.sky[4]
      k.fillRect(x, 18, 50, 4)
      glow(k, x + 25, 22, 30, RAMPS.sky[3], 0.25)
    }
  })
}

/** The town plaza at dusk: cobbles, little robot houses with lit windows. */
export function renderPlaza(g: CanvasRenderingContext2D, b: BasinDef) {
  cachedLayer(g, `sink-suds-plaza-${b.id}`, W, H, (k) => {
    bandedGradient(k, 0, 0, W, 70, [RAMPS.night[1], RAMPS.purple[2]], 4)
    drawHouses(k, 0, 60, false, 0)
    // Cobbles.
    k.fillStyle = RAMPS.steel[1]
    k.fillRect(0, 70, W, H - 70)
    for (let y = 72; y < H; y += 10)
      for (let x = (y / 10) % 2 ? -8 : 0; x < W; x += 16) {
        k.fillStyle =
          (x + y) % 3
            ? RAMPS.steel[2]
            : mix(RAMPS.steel[2], RAMPS.earth[2], 0.3)
        k.fillRect(x + 1, y + 1, 14, 8)
      }
  })
}

/** The palace: pink and gold marble with arches. */
export function renderPalace(g: CanvasRenderingContext2D, b: BasinDef) {
  cachedLayer(g, `sink-suds-palace-${b.id}`, W, H, (k) => {
    bandedGradient(
      k,
      0,
      0,
      W,
      H,
      [RAMPS.pink[1], RAMPS.purple[2], RAMPS.pink[1]],
      6,
    )
    for (let x = 0; x < W; x += 70) {
      bevel(k, x + 4, 0, 12, H, RAMPS.gold, { depth: 2 })
      k.strokeStyle = RAMPS.gold[3]
      k.lineWidth = 3
      k.beginPath()
      k.arc(x + 45, 40, 28, Math.PI, 0)
      k.stroke()
      k.lineWidth = 1
    }
    const rand = backdropRng(71)
    for (let i = 0; i < 40; i++) {
      k.fillStyle = rgba('#ffffff', 0.5)
      k.fillRect(Math.round(rand() * W), Math.round(rand() * H), 1, 1)
    }
  })
}

// --- endings ------------------------------------------------------------------------------------

/** A row of little robot houses; with `party`, every window has a robot blowing bubbles. */
function drawHouses(
  g: CanvasRenderingContext2D,
  x0: number,
  ground: number,
  party: boolean,
  tick: number,
) {
  const tones: readonly Ramp[] = [
    RAMPS.teal,
    RAMPS.pink,
    RAMPS.gold,
    RAMPS.purple,
    RAMPS.sky,
  ]
  for (let i = 0; i < 7; i++) {
    const x = x0 + i * 62 - 8
    const h = 40 + ((i * 17) % 22)
    const ramp = tones[i % tones.length]!
    bevel(g, x, ground - h, 54, h, ramp, { depth: 2 })
    g.fillStyle = ramp[1]
    g.beginPath()
    g.moveTo(x - 4, ground - h)
    g.lineTo(x + 27, ground - h - 18)
    g.lineTo(x + 58, ground - h)
    g.fill()
    for (let w = 0; w < 2; w++) {
      const wx = x + 10 + w * 22
      const wy = ground - h + 12
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(wx, wy, 12, 10)
      if (party) {
        // A robot in the window, blowing a bubble.
        g.fillStyle = RAMPS.steel[2]
        g.fillRect(wx + 3, wy + 3, 6, 7)
        g.fillStyle = INK
        g.fillRect(wx + 4, wy + 5, 1, 1)
        g.fillRect(wx + 7, wy + 5, 1, 1)
        const t = (tick + i * 13 + w * 29) % 120
        const by = wy - t * 0.6
        g.strokeStyle = rgba(RAMPS.sky[4], Math.max(0, 1 - t / 120))
        g.beginPath()
        g.arc(wx + 6 + Math.sin(t / 10) * 4, by, 2 + t / 30, 0, Math.PI * 2)
        g.stroke()
      }
    }
  }
}

const CONFETTI = (() => {
  const rand = backdropRng(83)
  return Array.from({ length: 50 }, () => ({
    x: rand() * W,
    y: rand() * H,
    s: 0.5 + rand(),
    c: Math.floor(rand() * 4),
  }))
})()

/** The clean ending: the town's fountains sparkle and the house robots blow bubbles. */
export function renderCleanEnding(g: CanvasRenderingContext2D, t: number) {
  bandedGradient(
    g,
    0,
    0,
    W,
    160,
    [RAMPS.sky[1], RAMPS.sky[2], RAMPS.gold[3]],
    4,
  )
  drawHouses(g, 0, 160, true, t)
  g.fillStyle = RAMPS.steel[2]
  g.fillRect(0, 160, W, H - 160)
  // Three fountains, sparkling.
  for (const fx of [80, 210, 340]) {
    g.fillStyle = RAMPS.steel[3]
    g.beginPath()
    g.ellipse(fx, 220, 44, 14, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = RAMPS.water[3]
    g.beginPath()
    g.ellipse(fx, 218, 38, 10, 0, 0, Math.PI * 2)
    g.fill()
    for (let i = 0; i < 8; i++) {
      const k = ((t * 2 + i * 15) % 60) / 60
      const sx = fx + (i - 3.5) * 5 * k * 2
      const sy = 214 - Math.sin(k * Math.PI) * 50
      g.fillStyle = RAMPS.water[4]
      g.fillRect(Math.round(sx), Math.round(sy), 2, 3)
    }
    glow(g, fx, 200, 30, RAMPS.sky[4], 0.25 + 0.15 * Math.sin(t / 10))
  }
  // Bubbles rising everywhere.
  for (const c of CONFETTI) {
    const y = (c.y - t * c.s + H * 4) % H
    g.strokeStyle = rgba('#ffffff', 0.6)
    g.beginPath()
    g.arc(c.x + Math.sin(t / 30 + c.x) * 6, y, 2 + c.c, 0, Math.PI * 2)
    g.stroke()
  }
}

/** The true ending: the Bubble Bath Palace in rainbow foam, every room behind it shining. */
export function renderTrueEnding(g: CanvasRenderingContext2D, t: number) {
  bandedGradient(
    g,
    0,
    0,
    W,
    H,
    [RAMPS.purple[1], RAMPS.pink[2], RAMPS.gold[3]],
    4,
  )
  const bands = [
    RAMPS.ember[2],
    RAMPS.gold[3],
    RAMPS.leaf[3],
    RAMPS.sky[3],
    RAMPS.purple[3],
  ]
  bands.forEach((c, i) => {
    g.strokeStyle = rgba(c, 0.7)
    g.lineWidth = 6
    g.beginPath()
    g.arc(W / 2, 260, 190 - i * 7, Math.PI, 0)
    g.stroke()
  })
  g.lineWidth = 1
  // The palace.
  bevel(g, 120, 150, 180, 110, RAMPS.pink, { depth: 3 })
  for (const x of [120, 280])
    bevel(g, x - 10, 110, 30, 150, RAMPS.gold, { depth: 2 })
  for (const x of [125, 285]) {
    g.fillStyle = RAMPS.gold[4]
    g.beginPath()
    g.moveTo(x - 15, 110)
    g.lineTo(x + 5, 80)
    g.lineTo(x + 25, 110)
    g.fill()
  }
  g.fillStyle = RAMPS.purple[1]
  g.beginPath()
  g.arc(210, 260, 30, Math.PI, 0)
  g.fill()
  for (const c of CONFETTI) {
    const y = (c.y - t * c.s * 1.4 + H * 4) % H
    g.fillStyle = [RAMPS.pink[3], RAMPS.gold[4], RAMPS.sky[4], '#ffffff'][c.c]!
    g.fillRect(
      Math.round(c.x + Math.sin(t / 20 + c.y) * 8),
      Math.round(y),
      2,
      2,
    )
  }
}

/** The credits rolling up over an ending (`lines` scroll from the bottom, `t` ticks in). */
export function renderCredits(
  g: CanvasRenderingContext2D,
  lines: readonly string[],
  t: number,
  title: string,
) {
  g.fillStyle = rgba(INK, 0.45)
  g.fillRect(0, 0, W, H)
  drawText(g, title, W / 2, 16, {
    scale: 2,
    align: 'center',
    color: RAMPS.gold[4],
    outline: INK,
  })
  const top = H - t * 0.5
  lines.forEach((line, i) => {
    const y = top + i * 14
    if (y < 40 || y > H - 8) return
    const head = line === line.toUpperCase() && line.startsWith('-')
    drawText(
      g,
      head ? line.replace(/-/g, '').trim() : line,
      W / 2,
      Math.round(y),
      {
        align: 'center',
        color: head ? RAMPS.gold[3] : '#ffffff',
        outline: INK,
      },
    )
  })
}
