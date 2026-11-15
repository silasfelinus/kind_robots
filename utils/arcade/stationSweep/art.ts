// /utils/arcade/stationSweep/art.ts
//
// Station Sweep's critter and tool art (conductor kr-arcade/t-141). The critters are drawn bigger
// than the launch's 7-18 px: young ones 14-28 px, adults 32 px or more across, with Mop still about
// 26 px tall. Each sprite is laid out in code on a grid of palette letters (a lit oval, shell plates,
// legs, eyes) and turned into a 16-bit pixel sprite with an ink outline by utils/arcade/snes.ts, so
// every stage and tell keeps the cabinet's hand-pixelled look without a page of letter art apiece.
// Sprites face right; the game flips them.

import { INK, RAMPS, pixelSprite, type PixelSprite, type Ramp } from '../snes'
import { FAMILIES, type Family, type Stage } from './critters'
import { TOOLS, type ToolId } from './tools'

/** A sprite under construction: rows of palette letters, '.' clear. */
class Grid {
  readonly cells: string[][]
  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.cells = Array.from({ length: h }, () => Array<string>(w).fill('.'))
  }

  set(x: number, y: number, ch: string) {
    const rx = Math.round(x)
    const ry = Math.round(y)
    if (rx < 0 || ry < 0 || rx >= this.w || ry >= this.h) return
    this.cells[ry]![rx] = ch
  }

  get(x: number, y: number): string {
    return this.cells[y]?.[x] ?? '.'
  }

  /** A lit oval: brightest toward the upper left, its rim in shadow on the lower right. */
  oval(cx: number, cy: number, rx: number, ry: number, letters = 'DdlLH') {
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const nx = (x + 0.5 - cx) / rx
        const ny = (y + 0.5 - cy) / ry
        const r2 = nx * nx + ny * ny
        if (r2 > 1) continue
        const light = (-nx * 0.5 - ny * 0.7) * 0.6 + (1 - r2) * 0.65
        const step =
          r2 > 0.82 && nx + ny > 0.2
            ? 0
            : light < 0.08
              ? 1
              : light < 0.32
                ? 2
                : light < 0.62
                  ? 3
                  : 4
        this.set(x, y, letters[Math.min(letters.length - 1, step)]!)
      }
  }

  rect(x: number, y: number, w: number, h: number, ch: string) {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) this.set(x + i, y + j, ch)
  }

  line(x0: number, y0: number, x1: number, y1: number, ch: string) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
    for (let i = 0; i <= n; i++)
      this.set(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, ch)
  }

  /** An eye: a white 2x2 with its pupil toward the front (right). */
  eye(x: number, y: number, big = false) {
    this.rect(x, y, big ? 3 : 2, 2, 'W')
    this.set(x + (big ? 2 : 1), y + 1, 'k')
    if (big) this.set(x + 2, y, 'k')
  }

  get rows(): string[] {
    return this.cells.map((r) => r.join(''))
  }
}

function palette(ramp: Ramp, accent: Ramp): Record<string, string> {
  return {
    D: ramp[0],
    d: ramp[1],
    l: ramp[2],
    L: ramp[3],
    H: ramp[4],
    a: accent[2],
    A: accent[3],
    k: INK,
    W: '#ffffff',
    m: RAMPS.ember[0],
    M: RAMPS.ember[1],
    t: RAMPS.cream[4],
  }
}

/** Sizes [width, height] by stage, before the outline. */
const SIZES: Record<Family, readonly [number, number][]> = {
  roller: [
    [14, 11],
    [20, 13],
    [32, 28],
  ],
  crawler: [
    [14, 8],
    [22, 12],
    [30, 24],
  ],
  biter: [
    [16, 15],
    [22, 22],
    [32, 34],
  ],
  puffer: [
    [14, 13],
    [22, 20],
    [32, 26],
  ],
  gloop: [
    [14, 10],
    [22, 16],
    [34, 28],
  ],
  mimic: [
    [18, 16],
    [18, 16],
    [18, 16],
  ],
}

function roller(at: Stage, frame: number): string[] {
  const [w, h] = SIZES.roller[at]!
  const g = new Grid(w, h)
  const body = h - 1
  g.oval(w / 2, body / 2, w / 2, body / 2)
  // Shell plates, rolling round a column every other frame.
  for (let x = 2 + frame * 2; x < w - 2; x += 4)
    for (let y = 1; y < body * 0.55; y++)
      if (g.get(x, y) !== '.' && g.get(x, y) !== 'D') g.set(x, y, 'd')
  if (at === 2) {
    // A pale belly and a cross brow.
    g.oval(w * 0.55, body * 0.72, w * 0.28, body * 0.2, 'lLLH')
    g.line(w * 0.62, body * 0.24, w * 0.8, body * 0.3, 'k')
  }
  g.eye(
    Math.round(w * 0.68),
    Math.round(body * (at === 2 ? 0.32 : 0.3)),
    at === 2,
  )
  for (const fx of [0.28, 0.66])
    g.rect(Math.round(w * fx) + frame, h - 1, at === 2 ? 4 : 2, 1, 'D')
  return g.rows
}

function crawler(at: Stage, frame: number): string[] {
  const [w, h] = SIZES.crawler[at]!
  const g = new Grid(w, h)
  if (at < 2) {
    const segs = at === 0 ? 3 : 4
    const r = at === 0 ? 3.4 : 4.4
    const cy = h / 2 - 0.5
    for (let i = 0; i < segs; i++) g.oval(r + i * (r * 1.15), cy, r, cy + 0.5)
    const hx = r + segs * (r * 1.15)
    g.oval(Math.min(w - r, hx), cy, r + 0.6, cy + 0.6)
    g.eye(Math.round(Math.min(w - r, hx)), Math.round(cy - 2))
    for (let i = 0; i < segs; i++)
      g.set(Math.round(r + i * r * 1.15 + (frame ? 1 : -1)), h - 1, 'D')
    return g.rows
  }
  // The web weaver: a round, marked abdomen, a head with three eyes, and eight legs.
  for (let i = 0; i < 4; i++) {
    const hip = 9 + i * 4
    const foot = 2 + i * 8 + (frame && i % 2 ? 2 : 0)
    g.line(hip, 12, (hip + foot) / 2, 6 + (i % 2) * 2, 'd')
    g.line((hip + foot) / 2, 6 + (i % 2) * 2, foot, h - 1, 'D')
  }
  g.oval(11, 10, 9.5, 8.5)
  g.oval(22, 13, 6, 5.5)
  for (const [x, y] of [
    [9, 6],
    [12, 9],
    [9, 12],
    [6, 9],
  ] as const)
    g.set(x, y, 'a')
  g.set(9, 9, 'A')
  g.set(23, 11, 'W')
  g.set(25, 12, 'W')
  g.set(23, 14, 'W')
  g.set(26, 15, 'k')
  return g.rows
}

function biter(at: Stage, frame: number, cheeks: boolean): string[] {
  const [w, h] = SIZES.biter[at]!
  const g = new Grid(w, h)
  const legs = at === 2 ? 5 : at === 1 ? 4 : 3
  const top = at === 2 ? 4 : 0
  const headH = h - legs - top
  if (at === 2)
    for (let x = 4; x < w - 8; x += 6) {
      g.line(x, 4, x + 2, 0, 'a')
      g.line(x + 1, 4, x + 3, 1, 'A')
    }
  g.oval(w / 2, top + headH / 2, w / 2, headH / 2)
  if (cheeks) g.oval(w * 0.72, top + headH * 0.6, w * 0.2, headH * 0.22, 'lLLH')
  // The jaw: a dark mouth with teeth along it.
  const my = top + Math.round(headH * 0.55)
  const mx = Math.round(w * 0.55)
  const mw = w - mx - 1
  g.rect(mx, my, mw, Math.max(2, Math.round(headH * 0.16)), 'm')
  g.rect(mx, my, mw, 1, 'M')
  for (let x = mx; x < mx + mw; x += 2) {
    g.set(x, my, 't')
    g.set(x + 1, my + Math.max(1, Math.round(headH * 0.16)) - 1, 't')
  }
  g.eye(Math.round(w * 0.6), top + Math.round(headH * 0.2), at === 2)
  for (let j = 0; j < legs; j++) {
    const y = h - legs + j
    const step = frame ? 1 : -1
    for (const lx of [0.25, 0.6])
      g.rect(
        Math.round(w * lx) + (j === legs - 1 ? step : 0),
        y,
        at + 2,
        1,
        'D',
      )
  }
  return g.rows
}

function puffer(at: Stage, frame: number, swell: number): string[] {
  const [w0, h0] = SIZES.puffer[at]!
  const w = w0 + swell * 2
  const h = h0 + swell * 2
  const g = new Grid(w, h)
  const orbs: Array<[number, number, number]> =
    at === 2
      ? [
          [10 + swell, 16 + swell, 8 + swell / 2],
          [22 + swell, 15 + swell, 9 + swell / 2],
          [16 + swell, 9 + swell, 8 + swell / 2],
        ]
      : [[w / 2, h / 2, w / 2 - 1.5]]
  for (const [cx, cy, r] of orbs) {
    // Spines round each orb, then the orb.
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + frame * 0.3
      g.set(cx + Math.cos(a) * (r + 1), cy + Math.sin(a) * (r + 1), 'd')
    }
    g.oval(cx, cy, r, r)
    for (let i = 0; i < 3; i++) {
      const a = i * 2.1 + 0.6
      g.set(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5, 'a')
    }
  }
  const [ex, ey, er] = orbs[at === 2 ? 1 : 0]!
  g.eye(Math.round(ex + er * 0.2), Math.round(ey - er * 0.35), at === 2)
  g.rect(Math.round(ex + er * 0.35), Math.round(ey + er * 0.3), 2, 1, 'm')
  return g.rows
}

function gloop(at: Stage, frame: number): string[] {
  const [w0, h0] = SIZES.gloop[at]!
  const w = w0 + frame * 2
  const h = h0 - frame
  const g = new Grid(w, h)
  // A dome: an oval centred on the floor line, so only its top half shows.
  g.oval(w / 2, h, w / 2, h)
  if (at === 2)
    for (const [x, y, r] of [
      [0.3, 0.55, 3],
      [0.62, 0.7, 2],
      [0.45, 0.82, 2],
    ] as const)
      g.oval(w * x, h * y, r, r, 'LLH')
  g.eye(Math.round(w * 0.55), Math.round(h * 0.35), at === 2)
  g.eye(Math.round(w * 0.72), Math.round(h * 0.35), at === 2)
  g.set(Math.round(w * 0.2), h - 1, 'D')
  return g.rows
}

export type CritterSprites = {
  /** Two walk frames. */
  walk: readonly [PixelSprite, PixelSprite]
  /** The tell: puffed cheeks, a swell, a wobble. */
  tell: PixelSprite
}

const ACCENTS: Record<Family, Ramp> = {
  roller: RAMPS.leaf,
  crawler: RAMPS.gold,
  biter: RAMPS.purple,
  puffer: RAMPS.teal,
  gloop: RAMPS.sky,
  mimic: RAMPS.gold,
}

/** A mimic crate: planks, a lid that lifts to show its teeth, and eyes when it blinks awake. */
function mimic(open: boolean, eyes: boolean): string[] {
  const [w, h] = SIZES.mimic[0]!
  const g = new Grid(w, h)
  const lidTop = open ? 0 : 1
  g.rect(0, 4, w, h - 4, 'l')
  for (const y of [8, 12]) g.rect(0, y, w, 1, 'd')
  g.rect(0, 4, 1, h - 4, 'D')
  g.rect(w - 1, 4, 1, h - 4, 'D')
  g.rect(1, 5, w - 2, 1, 'L')
  g.rect(3, 9, 2, 6, 'a')
  g.rect(w - 5, 9, 2, 6, 'a')
  g.rect(0, lidTop, w, 3, 'L')
  g.rect(0, lidTop, w, 1, 'H')
  g.rect(0, lidTop + 2, w, 1, 'd')
  if (open) {
    g.rect(1, 3, w - 2, 1, 'm')
    for (let x = 2; x < w - 2; x += 3) g.set(x, 3, 't')
  }
  if (eyes) {
    g.eye(5, 6)
    g.eye(w - 7, 6)
  }
  return g.rows
}

function build(family: Family, at: Stage): CritterSprites {
  const pal = palette(FAMILIES[family].ramp, ACCENTS[family])
  const make = (rows: string[]) => pixelSprite(rows, pal)
  switch (family) {
    case 'roller':
      return {
        walk: [make(roller(at, 0)), make(roller(at, 1))],
        tell: make(roller(at, 1)),
      }
    case 'crawler':
      return {
        walk: [make(crawler(at, 0)), make(crawler(at, 1))],
        tell: make(crawler(at, 1)),
      }
    case 'biter':
      return {
        walk: [make(biter(at, 0, false)), make(biter(at, 1, false))],
        tell: make(biter(at, 0, true)),
      }
    case 'puffer':
      return {
        walk: [make(puffer(at, 0, 0)), make(puffer(at, 1, 0))],
        tell: make(puffer(at, 0, 2)),
      }
    case 'gloop':
      return {
        walk: [make(gloop(at, 0)), make(gloop(at, 0))],
        tell: make(gloop(at, 1)),
      }
    case 'mimic':
      return {
        walk: [make(mimic(false, false)), make(mimic(true, true))],
        tell: make(mimic(false, true)),
      }
  }
}

/** Every family's sprites, by stage. */
export const CRITTER_SPRITES = Object.fromEntries(
  (Object.keys(FAMILIES) as Family[]).map((f) => [
    f,
    [build(f, 0), build(f, 1), build(f, 2)] as const,
  ]),
) as Record<Family, readonly [CritterSprites, CritterSprites, CritterSprites]>

/** Every pixel but the outline turned white: the hit flash. */
export function flash(sprite: PixelSprite): PixelSprite {
  return {
    width: sprite.width,
    height: sprite.height,
    pixels: sprite.pixels.map((p) => (p && p !== INK ? '#ffffff' : p)),
  }
}

// --- tools -----------------------------------------------------------------------------------------

const TOOL_ROWS: Record<ToolId, string[]> = {
  beam: [
    '.......',
    '.....c.',
    'bbbbbbc',
    'aaaaaab',
    'bbbbbbc',
    '.....c.',
    '.......',
  ],
  wide: [
    '....b.c',
    '...b.c.',
    '..b....',
    'aaaaaab',
    '..b....',
    '...b.c.',
    '....b.c',
  ],
  foam: [
    '..cc...',
    '.cccc..',
    'ccbcc..',
    '.cc.cc.',
    '...cccc',
    '..ccbcc',
    '...cc..',
  ],
  vac: [
    'ddd....',
    'dbbd...',
    'dbbbaaa',
    'dbbd..c',
    'ddd..c.',
    '....c..',
    '...cc..',
  ],
  bubble: [
    '..bbb..',
    '.b...b.',
    'b.c...b',
    'b.....b',
    'b.....b',
    '.b...b.',
    '..bbb..',
  ],
  zap: [
    '....cb.',
    '...cb..',
    '..cb...',
    '.ccccb.',
    '...cb..',
    '..cb...',
    '.cb....',
  ],
  steam: [
    '.c.c.c.',
    'c.c.c..',
    '.ccc...',
    '..d....',
    '..d....',
    '..d....',
    '.ddd...',
  ],
  shield: [
    'aaaaaaa',
    'abbbbba',
    'aaaaaaa',
    '...d...',
    '...d...',
    '...d...',
    '..ddd..',
  ],
}

/** A tool's 7 px badge, for the HUD and the canister. */
export const TOOL_ICONS = Object.fromEntries(
  (Object.keys(TOOLS) as ToolId[]).map((t) => {
    const r = TOOLS[t].ramp
    return [
      t,
      pixelSprite(TOOL_ROWS[t], {
        a: r[2],
        b: r[3],
        c: r[4],
        d: RAMPS.steel[2],
      }),
    ]
  }),
) as Record<ToolId, PixelSprite>

/** The canister a tool drops in: a capsule with a window for the badge. */
export const CANISTER = pixelSprite(
  [
    '..sSSSs..',
    '.sTTTTTs.',
    'sT.....Ss',
    'sT.....Ss',
    'sT.....Ss',
    'sT.....Ss',
    'sT.....Ss',
    '.sSSSSSs.',
    '..qqqqq..',
  ],
  {
    q: RAMPS.steel[0],
    s: RAMPS.steel[1],
    S: RAMPS.steel[2],
    T: RAMPS.steel[3],
  },
)

/** Mop's bin, as a HUD badge. */
export const BIN_ICON = pixelSprite(
  [
    '.ssssss.',
    'sTTTTTTs',
    '.dLLLLd.',
    '.dLllLd.',
    '.dLllLd.',
    '.dLLLLd.',
    '..dddd..',
  ],
  {
    s: RAMPS.steel[1],
    T: RAMPS.steel[3],
    d: RAMPS.leaf[1],
    l: RAMPS.leaf[2],
    L: RAMPS.leaf[3],
  },
)

/** A credit chip, for the HUD and the locker. */
export const CREDIT_ICON = pixelSprite(
  ['.ggg.', 'gGWGg', 'gGGGg', 'gGGGg', '.ggg.'],
  {
    g: RAMPS.gold[2],
    G: RAMPS.gold[3],
    W: '#ffffff',
  },
)
