// /utils/arcade/butterflyBlaster/art.ts
//
// Butterfly Blaster's 16-bit art (utils/arcade/snes.ts), drawn at double density for the depth pass
// (conductor kr-arcade/t-055): a single mosquito is about 24 px across with three flap frames, the
// butterfly half again as big as it was, and every pest has a tell you can read on a phone. The
// mosquitoes are cartoon pests with big red eyes; when they are netted they bundle up in a bag and
// float off, and when they are sparkled they bonk apart in a puff.

import { drawText } from '../font'
import {
  INK,
  RAMPS,
  backdropRng,
  bandedGradient,
  drawCloud,
  drawRidge,
  drawSprite,
  drawStars,
  glow,
  mix,
  pixelSprite,
  rgba,
  ridge,
  shadedOrb,
  starField,
} from '../snes'
import type { PixelSprite, Ramp } from '../snes'
import type { Loop, Ribbon } from './lasso'
import type { Pest, Pool } from './pests'
import { NEEDLE, RIPPLE_TICKS, HATCH_TICKS, SKIMMER } from './pests'
import { GROUND, SKY, W } from './sky'
import type { Point } from './sky'
import { SWARM_GNATS, SWARM_RADIUS } from './swarm'
import type { Swarm } from './swarm'
import type { Hut } from './village'
import { HUT_BITES, HUT_COUNT, WINDOW_Y, hutX } from './village'

export const RAINBOW = [
  '#ef4444',
  '#f97316',
  '#facc15',
  '#4ade80',
  '#38bdf8',
  '#a78bfa',
  '#f472b6',
] as const

/** The malaria cloud's sickly green, and the haze a swarm hums in. */
export const SICK: Ramp = [
  '#1a2e05',
  '#3f6212',
  '#65a30d',
  '#a3e635',
  '#ecfccb',
]
/** Moonlit night clouds. */
const DUSK: Ramp = [
  RAMPS.night[0],
  RAMPS.night[2],
  RAMPS.night[3],
  mix(RAMPS.night[4], RAMPS.purple[2], 0.4),
  mix(RAMPS.purple[2], RAMPS.purple[3], 0.5),
]
const FAR_STAR: Ramp = [
  RAMPS.night[2],
  RAMPS.night[3],
  RAMPS.night[4],
  RAMPS.purple[2],
  RAMPS.purple[3],
]
const NIGHT_THATCH = RAMPS.gold.map((c) =>
  mix(c, RAMPS.night[1], 0.62),
) as unknown as Ramp
const NIGHT_MUD = RAMPS.earth.map((c) =>
  mix(c, RAMPS.night[1], 0.55),
) as unknown as Ramp

const SKY_BANDS = [
  RAMPS.night[0],
  RAMPS.night[1],
  RAMPS.night[2],
  RAMPS.purple[0],
  mix(RAMPS.purple[0], RAMPS.pink[0], 0.6),
  mix(RAMPS.pink[0], RAMPS.rust[1], 0.3),
]

const FAR_STARS = starField(41, 150, W, GROUND - 40)
const FAR_RIDGE = ridge(43, W, 28, 4)
const NEAR_RIDGE = ridge(47, W, 14, 3)

/** The milky way: a diagonal band of dust, laid out once. */
const NEBULA = (() => {
  const rand = backdropRng(53)
  const colours = [RAMPS.purple[2], RAMPS.pink[1], RAMPS.night[4], RAMPS.sky[1]]
  return Array.from({ length: 700 }, () => {
    const t = rand()
    const spread = (rand() + rand() + rand() - 1.5) * 34
    return {
      x: Math.floor(t * W),
      y: Math.floor(GROUND - 60 - t * (GROUND - 110) + spread),
      colour: colours[Math.floor(rand() * colours.length)]!,
    }
  })
})()

/** Near stars that twinkle. */
const NEAR_STARS = (() => {
  const rand = backdropRng(37)
  return Array.from({ length: 80 }, () => ({
    x: rand() * W,
    y: rand() * (GROUND - 40),
    big: rand() < 0.15,
    phase: rand() * Math.PI * 2,
  }))
})()

const ACACIAS = [
  { x: 50, h: 28, w: 38 },
  { x: 176, h: 22, w: 30 },
  { x: 302, h: 32, w: 44 },
  { x: 430, h: 24, w: 34 },
]

const FIREFLIES = (() => {
  const rand = backdropRng(59)
  return Array.from({ length: 9 }, () => ({
    x: rand() * W,
    y: GROUND - 8 - rand() * 40,
    phase: rand() * Math.PI * 2,
    speed: 0.6 + rand() * 0.8,
  }))
})()

// --- sprites ---------------------------------------------------------------------------------------

// Aedes mosquitoes: black with white bands, a big red eye, glassy wings, three flap frames.
const SKEETER_PALETTE = {
  a: RAMPS.steel[0],
  w: RAMPS.steel[3],
  t: RAMPS.steel[1],
  T: RAMPS.steel[2],
  e: RAMPS.ember[2],
  E: '#ffffff',
  p: RAMPS.steel[2],
  l: RAMPS.steel[1],
  W: 'rgba(214, 234, 255, 0.72)',
  V: '#ffffff',
}
/** The needle: a lean mosquito in hot ember bands. */
const NEEDLE_PALETTE = {
  ...SKEETER_PALETTE,
  a: RAMPS.ember[0],
  w: RAMPS.ember[3],
  t: RAMPS.ember[1],
  T: RAMPS.ember[2],
  e: RAMPS.gold[4],
  p: RAMPS.rust[3],
  l: RAMPS.ember[1],
}

const SKEETER_BODY = [
  '.aawwaawwaTTTTee',
  'aawwaawwaatttteEe',
  '.aawwaawwa.ttttepppppp',
]
const SKEETER_LEGS = [
  '......l..l..l..l',
  '.....l..l....l...l',
  '....l..l......l...l',
]
const SKEETER_ROWS = [
  [
    '..........VVW',
    '.........VWWWW',
    '........VWWWWW',
    '.........WWWW',
    '..........WW',
    ...SKEETER_BODY,
    ...SKEETER_LEGS,
  ],
  [
    '',
    '',
    '......VVVWWW',
    '.....VWWWWWWWW',
    '........WWWWWWW',
    ...SKEETER_BODY,
    ...SKEETER_LEGS,
  ],
  [
    '',
    '',
    '',
    '',
    '',
    ...SKEETER_BODY.slice(0, 2),
    '.aawwaawwaWWWtepppppp',
    '......lVWWWWl..l',
    '.....l.VWWWW.l...l',
    '....l..l.WW...l...l',
  ],
]
/** A single mosquito, 24 px across: wings up, level, down. */
export const SKEETER = SKEETER_ROWS.map((rows) =>
  pixelSprite(rows, SKEETER_PALETTE),
)
export const NEEDLE_SPRITES = SKEETER_ROWS.map((rows) =>
  pixelSprite(rows, NEEDLE_PALETTE),
)
/** The gnats humming in a swarm, about 16 px across. */
export const GNAT = [
  [
    '......VVW',
    '.....VWWWW',
    'aawwaTTTee',
    '.awwatttEepppp',
    '...l..l..l',
    '..l..l....l',
  ],
  [
    '',
    '....VVWWWW',
    'aawwaTTTee',
    '.awwatttEepppp',
    '...l..l..l',
    '..l..l....l',
  ],
  ['', '', 'aawwaTTTee', '.awwaWWWEepppp', '...lVWWWl', '..l..l....l'],
].map((rows) => pixelSprite(rows, SKEETER_PALETTE))

/** A flap cycle through three frames: up, level, down, level. */
export const flapFrame = (t: number) => [0, 1, 2, 1][Math.floor(t / 3) % 4]!

// The wriggler: a curly larva with a breathing tube, in a bubble of pool water.
const WRIGGLER_PALETTE = {
  h: RAMPS.steel[1],
  H: RAMPS.steel[3],
  s: RAMPS.leaf[1],
  S: RAMPS.leaf[2],
  e: '#ffffff',
  t: RAMPS.steel[2],
}
export const WRIGGLER = [
  ['.hh.', 'hHeh', '.SS.', '..Ss', '.Ss.', 'Ss..', '.Ss.', '..s.', '.t.t'],
  ['.hh.', 'hHeh', '.SS.', '.sS.', '..Ss', '..sS', '.Ss.', '.s..', 't.t.'],
  ['.hh.', 'hHeh', '.SS.', '.SS.', '.Ss.', '.sS.', '.Ss.', '.s..', '.tt.'],
].map((rows) => pixelSprite(rows, WRIGGLER_PALETTE))

// The skimmer: a long-legged, grumpy water skater.
const SKIMMER_PALETTE = {
  b: RAMPS.teal[0],
  B: RAMPS.teal[2],
  h: RAMPS.teal[3],
  e: RAMPS.ember[2],
  l: RAMPS.steel[2],
}
export const SKIMMER_SPRITES = [
  [
    '..........bbBhe',
    '....l....bbBBBBbe',
    '...l.l..bbBBBBBb',
    '..l...lbbbbbbbb..l',
    '.l.....l.......l..l',
    'l.......l.......l..l',
  ],
  [
    '..........bbBhe',
    '.....l...bbBBBBbe',
    '....l.l.bbBBBBBb',
    '...l...lbbbbbbbb.l',
    '..l.....l......l..l',
    '.l.......l....l....l',
  ],
  [
    '..........bbBhe',
    '...l.....bbBBBBbe',
    '..l.l...bbBBBBBb..',
    '.l...l.bbbbbbbb...l',
    'l.....l.......l...l',
    'l......l.......l...l',
  ],
].map((rows) => pixelSprite(rows, SKIMMER_PALETTE))

// AMI, the Anti-Malaria Intelligence: a little robot fairy in a sky-blue dress.
const AMI_PALETTE = {
  g: RAMPS.gold[3],
  G: RAMPS.gold[4],
  H: RAMPS.sky[4],
  h: RAMPS.sky[3],
  s: RAMPS.sky[2],
  f: RAMPS.cream[3],
  c: RAMPS.pink[3],
  k: INK,
  D: RAMPS.sky[2],
  d: RAMPS.sky[1],
  L: RAMPS.sky[3],
  W: 'rgba(191, 233, 255, 0.7)',
}
const AMI_HEAD = [
  '......G......',
  '......g......',
  '....hHHhs....',
  '...hHffffs...',
  '...hfkffks...',
  '...sfcffcs...',
]
const AMI_SPRITES = [
  pixelSprite(
    [
      ...AMI_HEAD,
      'WW...ssss..WW',
      'WWW..dLDd.WWW',
      '.WWWdLDDDdWW.',
      '..WdLDDDDDdW.',
      '...dDDDDDDd..',
      '..dDDDDDDDDd.',
      '...d.d.d.d...',
    ],
    AMI_PALETTE,
  ),
  pixelSprite(
    [
      ...AMI_HEAD,
      '.....ssss....',
      '.W...dLDd...W',
      '.WW.dLDDDd.WW',
      '..WdLDDDDDdW.',
      '...dDDDDDDd..',
      '..dDDDDDDDDd.',
      '...d.d.d.d...',
    ],
    AMI_PALETTE,
  ),
] as const

/** A spare butterfly for the lives box. */
export const LIFE_SPRITE = pixelSprite(
  [
    '.pp...pp.',
    'pPyp.pyPp',
    'pyyyByyyp',
    '.pyyByyp.',
    '..tvBvt..',
    '.tTtBtTt.',
    '.tt...tt.',
  ],
  {
    p: RAMPS.pink[2],
    P: RAMPS.pink[4],
    y: RAMPS.gold[3],
    B: RAMPS.purple[0],
    v: RAMPS.purple[2],
    t: RAMPS.teal[2],
    T: RAMPS.teal[4],
  },
)

// --- the night sky and the village ----------------------------------------------------------------

export function paintNight(k: CanvasRenderingContext2D) {
  bandedGradient(k, 0, 0, W, GROUND, SKY_BANDS, 6)
  k.save()
  k.globalAlpha = 0.18
  for (const [t, colour] of [
    [0.2, RAMPS.pink[1]],
    [0.5, RAMPS.purple[1]],
    [0.8, RAMPS.sky[1]],
  ] as const) {
    glow(k, t * W, GROUND - 60 - t * (GROUND - 110), 90, colour, 1)
  }
  k.restore()
  k.save()
  k.globalAlpha = 0.55
  for (const d of NEBULA) {
    k.fillStyle = d.colour
    k.fillRect(d.x, d.y, 1, 1)
  }
  k.restore()
  drawStars(k, FAR_STARS, 0, FAR_STAR)
  paintMoon(k, W - 46, 46, 16)
  drawRidge(k, FAR_RIDGE, {
    base: GROUND - 16,
    bottom: GROUND,
    width: W,
    step: 4,
    fill: mix(RAMPS.night[2], RAMPS.purple[0], 0.5),
    rim: RAMPS.night[4],
  })
  drawRidge(k, NEAR_RIDGE, {
    base: GROUND - 3,
    bottom: GROUND,
    width: W,
    step: 3,
    fill: RAMPS.night[1],
    rim: RAMPS.night[3],
  })
  for (const tree of ACACIAS) paintAcacia(k, tree.x, tree.h, tree.w)
  bandedGradient(
    k,
    0,
    GROUND,
    W,
    360 - GROUND,
    [NIGHT_MUD[1], NIGHT_MUD[0], RAMPS.night[0]],
    2,
  )
  k.fillStyle = NIGHT_MUD[3]
  k.fillRect(0, GROUND, W, 1)
  for (let i = 0; i < HUT_COUNT; i++) paintHut(k, hutX(i))
}

function paintMoon(
  k: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
) {
  glow(k, x, y, r * 3.2, RAMPS.cream[3], 0.28)
  shadedOrb(k, x, y, r, RAMPS.cream, { glint: false })
  k.save()
  k.beginPath()
  k.arc(x, y, r, 0, Math.PI * 2)
  k.clip()
  k.fillStyle = RAMPS.cream[1]
  for (const [cx, cy, cr] of [
    [-8, 6, 2.5],
    [-11, -2, 1.5],
    [-4, 11, 1.5],
  ] as const) {
    k.beginPath()
    k.arc(x + cx, y + cy, cr, 0, Math.PI * 2)
    k.fill()
  }
  k.fillStyle = mix(RAMPS.night[2], RAMPS.night[3], 0.5)
  k.beginPath()
  k.arc(x + 7, y - 5, r - 2, 0, Math.PI * 2)
  k.fill()
  k.fillStyle = rgba(RAMPS.night[4], 0.35)
  k.fillRect(x + 1, y - 13, 6, 1)
  k.restore()
  k.fillStyle = '#ffffff'
  k.fillRect(x - 13, y + 2, 2, 2)
}

function paintAcacia(
  k: CanvasRenderingContext2D,
  x: number,
  h: number,
  w: number,
) {
  const base = GROUND
  k.fillStyle = INK
  k.fillRect(x - 2, base - h, 4, h)
  k.fillStyle = RAMPS.night[0]
  k.fillRect(x - 1, base - h, 2, h)
  k.fillStyle = INK
  for (let i = 0; i < 6; i++) {
    k.fillRect(x - 3 - i, base - h + 4 - i, 2, 2)
    k.fillRect(x + 1 + i, base - h + 3 - i, 2, 2)
  }
  const crown = (dx: number, dy: number, rw: number, ry: number, c: string) => {
    k.fillStyle = c
    k.beginPath()
    k.ellipse(x + dx, base - h - 4 + dy, rw, ry, 0, 0, Math.PI * 2)
    k.fill()
  }
  crown(0, 0, w / 2 + 1, 4, INK)
  crown(0, 0, w / 2, 3, RAMPS.night[1])
  crown(3, -1, w / 2 - 4, 2, RAMPS.night[2])
  k.fillStyle = RAMPS.night[4]
  k.fillRect(x + 4, base - h - 7, Math.round(w / 2) - 5, 1)
}

function paintHut(k: CanvasRenderingContext2D, cx: number) {
  const x = Math.round(cx)
  const wallTop = GROUND - 14
  k.fillStyle = INK
  k.fillRect(x - 11, wallTop - 1, 22, 16)
  bandedGradient(
    k,
    x - 10,
    wallTop,
    20,
    14,
    [NIGHT_MUD[3], NIGHT_MUD[2], NIGHT_MUD[1]],
    2,
  )
  k.fillStyle = NIGHT_MUD[1]
  k.fillRect(x - 10, wallTop, 4, 14)
  k.fillStyle = NIGHT_MUD[4]
  k.fillRect(x + 9, wallTop, 1, 14)
  k.fillStyle = INK
  k.fillRect(x + 4, wallTop + 6, 4, 8)
  const apex = wallTop - 13
  const roof = (grow: number) => {
    k.beginPath()
    k.moveTo(x - 14 - grow, wallTop + 1 + grow * 0.5)
    k.lineTo(x, apex - grow)
    k.lineTo(x + 14 + grow, wallTop + 1 + grow * 0.5)
    k.closePath()
  }
  k.fillStyle = INK
  roof(1.5)
  k.fill()
  k.save()
  roof(0)
  k.clip()
  bandedGradient(
    k,
    x - 15,
    apex,
    30,
    wallTop - apex + 2,
    [NIGHT_THATCH[3], NIGHT_THATCH[2], NIGHT_THATCH[1]],
    3,
  )
  k.fillStyle = NIGHT_THATCH[0]
  for (let r = apex + 4; r < wallTop; r += 4) k.fillRect(x - 15, r, 30, 1)
  k.fillStyle = rgba(NIGHT_THATCH[0], 0.6)
  k.fillRect(x - 15, apex, 13, wallTop - apex + 2)
  k.restore()
  k.fillStyle = NIGHT_THATCH[4]
  for (let i = 0; i < 12; i++) {
    k.fillRect(x + 1 + i, apex + 1 + Math.round(i * 0.93), 1, 1)
  }
}

export function renderStars(g: CanvasRenderingContext2D, tick: number) {
  for (const star of NEAR_STARS) {
    const twinkle = Math.sin(star.phase + tick / 25)
    const x = Math.round(star.x)
    const y = Math.round(star.y)
    g.fillStyle =
      twinkle > 0.6
        ? RAMPS.sky[4]
        : twinkle > -0.2
          ? RAMPS.sky[3]
          : RAMPS.purple[2]
    g.fillRect(x, y, 1, 1)
    if (star.big && twinkle > 0.7) {
      g.fillStyle = RAMPS.sky[3]
      g.fillRect(x - 1, y, 3, 1)
      g.fillRect(x, y - 1, 1, 3)
    }
  }
}

export function renderDriftingClouds(
  g: CanvasRenderingContext2D,
  tick: number,
) {
  g.save()
  g.globalAlpha = 0.55
  for (const [speed, offset, y, size] of [
    [0.12, 40, 116, 8],
    [0.07, 300, 196, 11],
  ] as const) {
    const span = W + 120
    const x = ((((tick * speed + offset) % span) + span) % span) - 60
    drawCloud(g, x, y, size, DUSK)
  }
  g.restore()
}

/** The huts' windows: lit, flickering after a bite, or dark; and three lamp pips for its health. */
export function renderWindows(
  g: CanvasRenderingContext2D,
  huts: readonly Hut[],
  tick: number,
) {
  huts.forEach((hut, i) => {
    const x = Math.round(hut.x)
    const top = WINDOW_Y - 2
    g.fillStyle = INK
    g.fillRect(x - 4, top - 1, 8, 7)
    const lit = hut.bites < HUT_BITES
    const blink = hut.flicker > 0 && Math.floor(hut.flicker / 4) % 2 === 0
    if (lit && !blink) {
      const flicker = 0.4 + 0.08 * Math.sin(tick / 7 + i * 1.7)
      glow(g, x, top + 2, 22, RAMPS.gold[3], flicker + 0.1)
      g.fillStyle = RAMPS.gold[2]
      g.fillRect(x - 3, top, 6, 5)
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(x - 3, top, 6, 2)
      g.fillStyle = RAMPS.rust[2]
      g.fillRect(x, top, 1, 5)
    } else {
      g.fillStyle = RAMPS.night[2]
      g.fillRect(x - 3, top, 6, 5)
      g.fillStyle = RAMPS.night[3]
      g.fillRect(x - 3, top, 6, 1)
      if (!lit) {
        // Tucked in under the bed nets: a little mesh across the dark window.
        g.fillStyle = rgba(RAMPS.sky[4], 0.45)
        g.fillRect(x - 3, top + 2, 6, 1)
        g.fillRect(x - 1, top, 1, 5)
        g.fillRect(x + 1, top, 1, 5)
      }
    }
    if (hut.flicker > 0) {
      const bob = Math.round(Math.sin(hut.flicker / 3) * 1.5)
      drawText(g, 'BZZ', x, top - 34 + bob, {
        align: 'center',
        color: RAMPS.ember[3],
        outline: INK,
      })
    }
    // The lamp's health: three pips on the ground under the hut.
    for (let b = 0; b < HUT_BITES; b++) {
      const px = x - 6 + b * 5
      g.fillStyle = INK
      g.fillRect(px - 1, GROUND + 3, 4, 4)
      g.fillStyle = b < HUT_BITES - hut.bites ? RAMPS.gold[3] : RAMPS.night[2]
      g.fillRect(px, GROUND + 4, 2, 2)
    }
  })
}

export function renderFireflies(g: CanvasRenderingContext2D, tick: number) {
  g.save()
  g.globalCompositeOperation = 'lighter'
  for (const fly of FIREFLIES) {
    const t = tick / 60
    const on = Math.sin(t * fly.speed * 3 + fly.phase)
    if (on < 0.2) continue
    const x = Math.round(fly.x + Math.sin(t * fly.speed + fly.phase) * 14)
    const y = Math.round(fly.y + Math.cos(t * fly.speed * 1.3) * 5)
    g.globalAlpha = on
    g.fillStyle = rgba(RAMPS.leaf[3], 0.35)
    g.fillRect(x - 1, y - 1, 3, 3)
    g.fillStyle = RAMPS.gold[4]
    g.fillRect(x, y, 1, 1)
  }
  g.restore()
}

/** Dawn coming up over the village: the sky warms from the ground up. */
export function renderDawn(g: CanvasRenderingContext2D, t: number) {
  const k = Math.min(1, t / 90)
  g.save()
  const sky = g.createLinearGradient(0, 0, 0, GROUND)
  sky.addColorStop(0, rgba(RAMPS.sky[1], 0.35 * k))
  sky.addColorStop(0.6, rgba(RAMPS.pink[2], 0.3 * k))
  sky.addColorStop(1, rgba(RAMPS.gold[3], 0.55 * k))
  g.fillStyle = sky
  g.fillRect(0, 0, W, GROUND)
  glow(g, W / 2, GROUND, 140, RAMPS.gold[4], 0.5 * k)
  g.restore()
}

// --- the butterfly ----------------------------------------------------------------------------------

/** The butterfly is drawn this much bigger than its first coat of paint (double density). */
export const BUTTERFLY_SCALE = 1.5

export function renderButterfly(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  flap: number,
  tint: readonly string[] = RAINBOW,
) {
  const open = 0.55 + 0.45 * Math.abs(Math.sin(flap))
  glow(g, x, y, 34, RAMPS.pink[3], 0.32)
  g.save()
  g.translate(x, y)
  g.rotate(angle)
  g.scale(BUTTERFLY_SCALE, BUTTERFLY_SCALE)
  const wings = () => {
    g.beginPath()
    g.ellipse(6, -4, 7, 6, -0.5, 0, Math.PI * 2)
    g.ellipse(5, 5, 5, 4, 0.5, 0, Math.PI * 2)
  }
  for (const side of [-1, 1]) {
    g.save()
    g.scale(side * open, 1)
    g.strokeStyle = INK
    g.lineWidth = 2
    wings()
    g.stroke()
    g.save()
    wings()
    g.clip()
    tint.forEach((colour, i) => {
      g.fillStyle = colour
      g.beginPath()
      g.arc(0, 0, 16 - i * 2, 0, Math.PI * 2)
      g.fill()
    })
    g.fillStyle = rgba(INK, 0.32)
    g.beginPath()
    g.ellipse(5, 7, 6, 4, 0.5, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = rgba('#ffffff', 0.35)
    g.beginPath()
    g.ellipse(7, -8, 5, 2, -0.5, 0, Math.PI * 2)
    g.fill()
    g.restore()
    g.strokeStyle = rgba(INK, 0.55)
    g.lineWidth = 0.7
    g.beginPath()
    g.moveTo(1, -1)
    g.lineTo(11, -8)
    g.moveTo(1, 1)
    g.lineTo(8, 6)
    g.stroke()
    g.fillStyle = INK
    g.beginPath()
    g.arc(9, -6, 1.8, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#ffffff'
    g.beginPath()
    g.arc(9, -6, 1.1, 0, Math.PI * 2)
    g.arc(6, 6, 0.9, 0, Math.PI * 2)
    g.fill()
    g.restore()
  }
  g.fillStyle = INK
  g.beginPath()
  g.ellipse(0, 1, 2.8, 8.5, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = RAMPS.purple[1]
  g.beginPath()
  g.ellipse(0, 1, 1.8, 7.5, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = RAMPS.purple[3]
  g.beginPath()
  g.ellipse(-0.6, 0, 0.8, 5.5, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = INK
  for (const by of [2, 4.5, 7]) g.fillRect(-1.8, by, 3.6, 0.7)
  g.strokeStyle = INK
  g.lineWidth = 1
  g.beginPath()
  g.moveTo(-1, -8)
  g.quadraticCurveTo(-2, -12, -4.5, -13)
  g.moveTo(1, -8)
  g.quadraticCurveTo(2, -12, 4.5, -13)
  g.stroke()
  shadedOrb(g, -4.5, -13, 1.2, RAMPS.gold, { glint: false })
  shadedOrb(g, 4.5, -13, 1.2, RAMPS.gold, { glint: false })
  shadedOrb(g, 0, -7.5, 2.4, RAMPS.purple, { glint: false })
  g.restore()
}

/** The flutter-dash's afterimage: a fading rainbow streak from where the dash began. */
export function renderDashTrail(
  g: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  t: number,
) {
  g.save()
  g.globalAlpha = t
  g.lineCap = 'round'
  RAINBOW.forEach((colour, i) => {
    g.strokeStyle = colour
    g.lineWidth = 7 - i * 0.8
    g.beginPath()
    g.moveTo(from.x, from.y)
    g.lineTo(to.x, to.y)
    g.stroke()
  })
  g.restore()
}

/** AMI's bed net: a shaded hoop with a fine mesh across it. */
export function renderMesh(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  spin: number,
) {
  g.save()
  g.translate(x, y)
  g.fillStyle = rgba(RAMPS.sky[4], 0.12)
  g.beginPath()
  g.arc(0, 0, r, 0, Math.PI * 2)
  g.fill()
  g.save()
  g.clip()
  g.rotate(spin)
  g.lineWidth = 1
  const mesh = (offset: number, colour: string) => {
    g.strokeStyle = colour
    g.beginPath()
    for (let i = -r + 4; i < r; i += 4) {
      g.moveTo(i + offset, -r)
      g.lineTo(i + offset, r)
      g.moveTo(-r, i + offset)
      g.lineTo(r, i + offset)
    }
    g.stroke()
  }
  mesh(0.8, rgba(INK, 0.45))
  mesh(0, rgba(RAMPS.cream[3], 0.75))
  g.restore()
  g.lineWidth = 3
  g.strokeStyle = INK
  g.beginPath()
  g.arc(0, 0, r, 0, Math.PI * 2)
  g.stroke()
  g.lineWidth = 1.5
  g.strokeStyle = RAMPS.cream[1]
  g.beginPath()
  g.arc(0, 0, r, 0, Math.PI * 2)
  g.stroke()
  g.strokeStyle = RAMPS.cream[4]
  g.beginPath()
  g.arc(0, 0, r, Math.PI * 0.95, Math.PI * 1.7)
  g.stroke()
  g.restore()
}

// --- the Rainbow Lasso ------------------------------------------------------------------------------

/** Draw a polyline in unwrapped sky coordinates, with copies for any part across an edge. */
function wrappedCopies(minX: number, maxX: number, minY: number, maxY: number) {
  const out: Point[] = []
  for (const ox of [-W, 0, W]) {
    if (maxX + ox < 0 || minX + ox > W) continue
    for (const oy of [-SKY, 0, SKY]) {
      if (maxY + oy < 0 || minY + oy > SKY) continue
      out.push({ x: ox, y: oy })
    }
  }
  return out
}

/** The ribbon trailing the butterfly. `shift` maps its unwrapped coordinates onto the sky. */
export function renderRibbon(
  g: CanvasRenderingContext2D,
  ribbon: Ribbon,
  shift: Point,
  tick: number,
) {
  const pts = ribbon.points
  if (pts.length < 2) return
  g.save()
  g.lineCap = 'round'
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!
    const b = pts[i]!
    if (b.gap) continue
    const age = 1 - (tick - b.t) / ribbon.life
    if (age <= 0) continue
    const ax = a.x + shift.x
    const ay = a.y + shift.y
    const bx = b.x + shift.x
    const by = b.y + shift.y
    const colour = RAINBOW[Math.floor(b.t / 4) % RAINBOW.length]!
    for (const o of wrappedCopies(
      Math.min(ax, bx),
      Math.max(ax, bx),
      Math.min(ay, by),
      Math.max(ay, by),
    )) {
      g.globalAlpha = Math.min(1, age * 1.4)
      g.strokeStyle = INK
      g.lineWidth = 5
      g.beginPath()
      g.moveTo(ax + o.x, ay + o.y)
      g.lineTo(bx + o.x, by + o.y)
      g.stroke()
      g.strokeStyle = colour
      g.lineWidth = 3
      g.stroke()
      g.strokeStyle = rgba('#ffffff', 0.5)
      g.lineWidth = 1
      g.stroke()
    }
  }
  g.restore()
}

/** A closed loop's flash: a rainbow net thrown over everything inside. */
export function renderLoopFlash(
  g: CanvasRenderingContext2D,
  loop: Loop,
  shift: Point,
  t: number,
) {
  const copies = wrappedCopies(
    loop.minX + shift.x,
    loop.maxX + shift.x,
    loop.minY + shift.y,
    loop.maxY + shift.y,
  )
  g.save()
  for (const o of copies) {
    g.beginPath()
    loop.points.forEach((p, i) => {
      const x = p.x + shift.x + o.x
      const y = p.y + shift.y + o.y
      if (i) g.lineTo(x, y)
      else g.moveTo(x, y)
    })
    g.closePath()
    g.globalAlpha = 0.3 * t
    g.fillStyle = RAMPS.sky[4]
    g.fill()
    g.globalAlpha = t
    g.lineWidth = 4
    g.strokeStyle = RAINBOW[Math.floor((1 - t) * 20) % RAINBOW.length]!
    g.stroke()
    g.save()
    g.clip()
    g.globalAlpha = 0.6 * t
    g.strokeStyle = RAMPS.cream[3]
    g.lineWidth = 1
    g.beginPath()
    const x0 = loop.minX + shift.x + o.x
    const y0 = loop.minY + shift.y + o.y
    const w = loop.maxX - loop.minX
    const h = loop.maxY - loop.minY
    for (let d = -h; d < w; d += 7) {
      g.moveTo(x0 + d, y0)
      g.lineTo(x0 + d + h, y0 + h)
      g.moveTo(x0 + d + h, y0)
      g.lineTo(x0 + d, y0 + h)
    }
    g.stroke()
    g.restore()
  }
  g.restore()
}

/** A bag of netted mosquitoes floating off for AMI to carry far away. */
export function renderBag(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  count: number,
  tick: number,
) {
  const r = Math.min(16, 6 + count * 0.8)
  const sway = Math.sin(tick / 9) * 0.25
  g.save()
  g.translate(x, y)
  g.rotate(sway)
  // The drawstring up to a little balloon of AMI's.
  g.strokeStyle = INK
  g.lineWidth = 1
  g.beginPath()
  g.moveTo(0, -r)
  g.lineTo(0, -r - 10)
  g.stroke()
  shadedOrb(g, 0, -r - 15, 5, RAMPS.sky, { outline: INK })
  for (let i = 0; i < Math.min(count, 6); i++) {
    const a = i * 2.1 + tick / 11
    drawSprite(
      g,
      GNAT[flapFrame(tick + i * 2)]!,
      Math.cos(a) * r * 0.45,
      Math.sin(a) * r * 0.4,
    )
  }
  renderMesh(g, 0, 0, r, tick / 30)
  g.restore()
}

// --- the pests --------------------------------------------------------------------------------------

export function renderSwarm(
  g: CanvasRenderingContext2D,
  swarm: Swarm,
  tick: number,
) {
  const r = SWARM_RADIUS[swarm.size]
  const flip = swarm.vx < 0
  if (swarm.size === 1) {
    if (swarm.sprint) glow(g, swarm.x, swarm.y, 20, RAMPS.ember[3], 0.35)
    drawSprite(
      g,
      SKEETER[flapFrame(tick + Math.floor(swarm.seed))]!,
      swarm.x,
      swarm.y,
      {
        flipX: flip,
      },
    )
    return
  }
  const haze = g.createRadialGradient(
    swarm.x,
    swarm.y,
    r * 0.2,
    swarm.x,
    swarm.y,
    r * 1.2,
  )
  const hue = swarm.mode === 'seek' ? RAMPS.ember[2] : SICK[2]
  haze.addColorStop(0, rgba(hue, 0.22))
  haze.addColorStop(0.7, rgba(SICK[1], 0.12))
  haze.addColorStop(1, rgba(SICK[1], 0))
  g.fillStyle = haze
  g.beginPath()
  g.arc(swarm.x, swarm.y, r * 1.2, 0, Math.PI * 2)
  g.fill()
  const count = SWARM_GNATS[swarm.size]
  for (let i = 0; i < count; i++) {
    const orbit = swarm.seed + i * 2.4 + tick * (0.04 + (i % 3) * 0.015)
    const radius = r * (0.3 + ((i * 37) % 10) / 15)
    const mx =
      swarm.x + Math.cos(orbit) * radius + Math.sin(tick * 0.9 + i) * 1.2
    const my = swarm.y + Math.sin(orbit * 1.3) * radius * 0.75
    drawSprite(g, GNAT[flapFrame(tick + i)]!, mx, my, {
      flipX: Math.cos(orbit + Math.PI / 2) < 0,
    })
  }
}

export function renderPool(
  g: CanvasRenderingContext2D,
  pool: Pool,
  tick: number,
) {
  const x = Math.round(pool.x)
  const y = GROUND + 4
  g.save()
  if (pool.dry) {
    g.fillStyle = INK
    g.beginPath()
    g.ellipse(x, y, pool.w + 1, 4, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = mix(RAMPS.earth[2], RAMPS.night[1], 0.4)
    g.beginPath()
    g.ellipse(x, y, pool.w, 3, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = INK
    g.fillRect(x - 6, y - 1, 5, 1)
    g.fillRect(x + 2, y, 4, 1)
    g.restore()
    return
  }
  g.fillStyle = INK
  g.beginPath()
  g.ellipse(x, y, pool.w + 1, 4.5, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = RAMPS.water[1]
  g.beginPath()
  g.ellipse(x, y, pool.w, 3.5, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = RAMPS.water[2]
  g.fillRect(x - pool.w + 4, y - 2, pool.w * 2 - 8, 1)
  const glint = Math.floor(tick / 20) % 3
  g.fillStyle = RAMPS.water[4]
  g.fillRect(x - 5 + glint * 3, y - 1, 2, 1)
  if (pool.ripple > 0) {
    const k = 1 - pool.ripple / RIPPLE_TICKS
    for (const lag of [0, 0.35]) {
      const t = (k + lag) % 1
      g.strokeStyle = rgba(RAMPS.water[4], 1 - t)
      g.lineWidth = 1
      g.beginPath()
      g.ellipse(x, y, 3 + t * pool.w, 1 + t * 3, 0, 0, Math.PI * 2)
      g.stroke()
    }
    if (pool.ripple < 30 && Math.floor(tick / 4) % 2 === 0) {
      drawText(g, '!', x, y - 16, {
        align: 'center',
        color: RAMPS.water[4],
        outline: INK,
      })
    }
  }
  g.restore()
}

export function renderPest(g: CanvasRenderingContext2D, p: Pest, tick: number) {
  if (p.kind === 'wriggler') {
    // In its bubble of pool water, wobbling; it flashes as it is about to hatch.
    const k = p.t / HATCH_TICKS
    const r = 9 + Math.sin(tick / 5 + p.seed) * 0.8
    const hot = k > 0.75 && Math.floor(tick / 5) % 2 === 0
    glow(g, p.x, p.y, 16, hot ? RAMPS.ember[3] : RAMPS.water[3], 0.35)
    g.save()
    g.fillStyle = rgba(RAMPS.water[2], 0.35)
    g.strokeStyle = rgba(RAMPS.water[4], 0.8)
    g.lineWidth = 1
    g.beginPath()
    g.arc(p.x, p.y, r, 0, Math.PI * 2)
    g.fill()
    g.stroke()
    g.restore()
    drawSprite(g, WRIGGLER[Math.floor(tick / 6 + p.seed) % 3]!, p.x, p.y)
    g.fillStyle = RAMPS.water[4]
    g.fillRect(Math.round(p.x - 4), Math.round(p.y - 6), 2, 1)
    return
  }
  if (p.kind === 'skimmer') {
    const crouch = p.t < SKIMMER.tell ? 2 : 0
    if (crouch) glow(g, p.x, p.y, 14, RAMPS.water[3], 0.4)
    drawSprite(
      g,
      SKIMMER_SPRITES[Math.floor(tick / 5) % 3]!,
      p.x,
      p.y + crouch,
      {
        flipX: p.vx < 0,
      },
    )
    if (crouch && Math.floor(tick / 4) % 2 === 0) {
      g.fillStyle = RAMPS.water[4]
      g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 10, 2, 2)
    }
    return
  }
  // The needle: its red tell and a dotted line where it will dash.
  if (p.state === 'aim') {
    const pulse = 0.4 + 0.3 * Math.sin(tick / 2)
    glow(g, p.x, p.y, 22, RAMPS.ember[2], pulse)
    g.save()
    g.strokeStyle = rgba(RAMPS.ember[3], 0.55)
    g.setLineDash([3, 5])
    g.lineWidth = 1
    g.beginPath()
    g.moveTo(p.x, p.y)
    const reach = NEEDLE.speed * NEEDLE.dash
    g.lineTo(
      p.x + Math.cos(p.heading) * reach,
      p.y + Math.sin(p.heading) * reach,
    )
    g.stroke()
    g.restore()
  } else if (p.state === 'dash') {
    g.save()
    g.strokeStyle = rgba(RAMPS.ember[3], 0.5)
    g.lineWidth = 3
    g.beginPath()
    g.moveTo(p.x, p.y)
    g.lineTo(p.x - p.vx * 4, p.y - p.vy * 4)
    g.stroke()
    g.restore()
  }
  const frame = p.state === 'aim' ? 1 : flapFrame(tick + Math.floor(p.seed))
  drawSprite(g, NEEDLE_SPRITES[frame]!, p.x, p.y, {
    flipX: Math.cos(p.heading) < 0,
  })
}

// --- the malaria cloud and AMI ----------------------------------------------------------------------

const CLOUD_PUFFS: readonly (readonly [number, number, number])[] = [
  [-1.1, 0.25, 0.55],
  [-0.45, -0.15, 0.75],
  [0.35, -0.3, 0.85],
  [1.05, 0.15, 0.6],
  [0, 0.35, 0.7],
]

export function renderCloud(
  g: CanvasRenderingContext2D,
  x: number,
  cy: number,
  small: boolean,
  angry: boolean,
  tick: number,
) {
  const s = small ? 0.75 : 1.2
  const size = 13 * s
  const y = cy + Math.round(Math.sin(tick / 9) * 1.5)
  glow(g, x, y, 34 * s, angry ? RAMPS.ember[2] : SICK[3], 0.3)
  g.fillStyle = INK
  for (const [dx, dy, k] of CLOUD_PUFFS) {
    const r = size * k
    g.beginPath()
    g.arc(x + dx * size, y + dy * size + r * 0.12, r + 1.5, 0, Math.PI * 2)
    g.fill()
  }
  drawCloud(g, x, y, size, SICK)
  g.save()
  g.translate(Math.round(x), Math.round(y))
  g.scale(s, s)
  g.fillStyle = INK
  g.fillRect(-8, -4, 6, 5)
  g.fillRect(2, -4, 6, 5)
  g.fillStyle = SICK[4]
  g.fillRect(-7, -3, 4, 3)
  g.fillRect(3, -3, 4, 3)
  g.fillStyle = RAMPS.ember[2]
  g.fillRect(-5, -2, 2, 2)
  g.fillRect(3, -2, 2, 2)
  g.fillStyle = INK
  g.fillRect(-9, -7, 3, 1)
  g.fillRect(-6, -6, 3, 1)
  g.fillRect(3, -6, 3, 1)
  g.fillRect(6, -7, 3, 1)
  g.fillRect(-5, 5, 10, 2)
  g.fillStyle = SICK[4]
  g.fillRect(-3, 5, 1, 1)
  g.fillRect(2, 5, 1, 1)
  g.restore()
}

export function renderFairy(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: number,
  carrying: boolean,
  tick: number,
) {
  const flutter = Math.floor(tick / 5) % 2
  const wand = { x: x + facing * 9, y: y + 2 }
  glow(g, x, y, 20, RAMPS.sky[3], 0.25)
  drawSprite(g, flutter ? AMI_SPRITES[1] : AMI_SPRITES[0], x, y, {
    flipX: facing < 0,
  })
  const stick = Math.round(Math.min(x + facing * 3, wand.x))
  g.fillStyle = INK
  g.fillRect(stick - 1, Math.round(y + 2), 8, 3)
  g.fillStyle = RAMPS.gold[2]
  g.fillRect(stick, Math.round(y + 3), 6, 1)
  const pulse = 0.55 + 0.25 * Math.sin(tick / 4)
  glow(g, wand.x, wand.y, 10, RAMPS.gold[3], pulse)
  const wx = Math.round(wand.x)
  const wy = Math.round(wand.y)
  g.fillStyle = RAMPS.gold[4]
  g.fillRect(wx - 2, wy, 5, 1)
  g.fillRect(wx, wy - 2, 1, 5)
  g.fillStyle = '#ffffff'
  g.fillRect(wx, wy, 1, 1)
  if (carrying) renderMesh(g, x, y + 15, 6, 0)
}

export function renderNet(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  spin: number,
  tick: number,
) {
  glow(g, x, y, 16, RAMPS.sky[4], 0.35)
  renderMesh(g, x, y, 9, spin)
  const a = tick / 8
  const tx = Math.round(x + Math.cos(a) * 12)
  const ty = Math.round(y + Math.sin(a) * 12)
  g.fillStyle = RAMPS.sky[4]
  g.fillRect(tx - 1, ty, 3, 1)
  g.fillRect(tx, ty - 1, 1, 3)
}

export function renderSparkle(
  g: CanvasRenderingContext2D,
  shot: { x: number; y: number; vx: number; vy: number; hue: number },
  tick: number,
) {
  const colour = RAINBOW[shot.hue % RAINBOW.length]!
  const x = Math.round(shot.x)
  const y = Math.round(shot.y)
  for (let i = 3; i >= 1; i--) {
    g.globalAlpha = 0.18 * (4 - i)
    g.fillStyle = colour
    g.fillRect(
      Math.round(shot.x - shot.vx * i * 0.45),
      Math.round(shot.y - shot.vy * i * 0.45),
      2,
      2,
    )
  }
  g.globalAlpha = 1
  glow(g, x, y, 9, colour, 0.65)
  const diagonal = (tick + shot.hue) % 8 < 4
  g.fillStyle = INK
  g.fillRect(x - 1, y - 1, 3, 3)
  g.fillStyle = colour
  if (diagonal) {
    for (const d of [-2, 2]) {
      g.fillRect(x + d, y + d, 1, 1)
      g.fillRect(x + d, y - d, 1, 1)
    }
    g.fillRect(x - 1, y - 1, 3, 3)
  } else {
    g.fillRect(x - 3, y, 7, 1)
    g.fillRect(x, y - 3, 1, 7)
  }
  g.fillStyle = '#ffffff'
  g.fillRect(x, y, 1, 1)
}

export type { PixelSprite }
