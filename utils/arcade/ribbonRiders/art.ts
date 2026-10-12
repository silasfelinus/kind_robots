// /utils/arcade/ribbonRiders/art.ts
//
// Ribbon Riders' 16-bit art (conductor kr-arcade/t-074), built on utils/arcade/snes.ts: the
// light-bikes (four wheel frames and three leans, in every rider's and rival's colours), the
// pickups' icons, the bow a wrapped rival wears, and the arena floors' palettes.

import {
  INK,
  RAMPS,
  mix,
  pixelSprite,
  type PixelSprite,
  type Ramp,
} from '../snes'
import type { FloorId } from './arenas'
import type { PickupKind } from './pickups'

/** A five-step ramp around one colour: inked shadows, white-hot highlights. */
export function rampOf(hex: string): Ramp {
  return [
    mix(hex, INK, 0.7),
    mix(hex, INK, 0.38),
    hex,
    mix(hex, '#ffffff', 0.45),
    mix(hex, '#ffffff', 0.82),
  ]
}

/** The player's rainbow ribbon, a colour every four cells. */
export const RAINBOW = [
  '#ef4444',
  '#f97316',
  '#facc15',
  '#4ade80',
  '#38bdf8',
  '#a78bfa',
]
export const RAINBOW_RAMPS = RAINBOW.map(rampOf)
/** The Copycat's ribbon: the rainbow run backwards. */
export const MIRROR_RAMPS = [...RAINBOW_RAMPS].reverse()

/** Each seat's bike colour (seat 1 rides gold over the rainbow). */
export const SEAT_COLOURS = ['#f2b52b', '#38bdf8', '#4ade80', '#f472b6']

// --- the bikes ---------------------------------------------------------------------------------

/** A light-bike from above, nose up: headlight, treaded tyres, fairing and the rider's helmet. */
const BIKE = [
  '...ww...',
  '..k12k..',
  '..k21k..',
  '..k12k..',
  '.LBBBBd.',
  '.LBHhBd.',
  '.LBhhBd.',
  '.LBBBBd.',
  '..LBBd..',
  '..k12k..',
  '..k21k..',
  '..k12k..',
  '...ee...',
]
/** Rows of the fairing and rider, which lean into a turn. */
const LEAN_ROWS = [4, 5, 6, 7, 8]

function treads(rows: string[], phase: number): string[] {
  const tone = ['T', 'u', 't', 'u']
  return rows.map((row, y) =>
    row.replace(/[12]/g, (c) => tone[(y + phase + (c === '2' ? 2 : 0)) % 4]!),
  )
}

function lean(rows: string[], by: number): string[] {
  return rows.map((row, y) => {
    if (!LEAN_ROWS.includes(y) || by === 0) return row
    return by > 0 ? `.${row.slice(0, -1)}` : `${row.slice(1)}.`
  })
}

/** Rows to columns: the nose-up art becomes nose-left, still lit from the top left. */
function transpose(rows: readonly string[]): string[] {
  const w = Math.max(...rows.map((r) => r.length))
  return Array.from({ length: w }, (_, x) =>
    rows.map((r) => r[x] ?? '.').join(''),
  )
}

export type BikeArt = {
  ramp: Ramp
  /** [lean + 1][wheel frame], nose up (flip for down). */
  up: PixelSprite[][]
  /** [lean + 1][wheel frame], nose left (flip for right). */
  left: PixelSprite[][]
}

const bikeCache = new Map<string, BikeArt>()

/** A bike in one colour: three leans of four wheel frames, both ways round. */
export function bikeArt(
  colour: string,
  helmet: string = RAMPS.sky[4],
): BikeArt {
  const key = `${colour}|${helmet}`
  const cached = bikeCache.get(key)
  if (cached) return cached
  const ramp = rampOf(colour)
  const palette = {
    w: '#ffffff',
    k: RAMPS.steel[0],
    T: RAMPS.steel[3],
    u: RAMPS.steel[2],
    t: RAMPS.steel[1],
    L: ramp[3],
    B: ramp[2],
    d: ramp[1],
    H: helmet,
    h: RAMPS.night[2],
    e: RAMPS.ember[3],
  }
  const up: PixelSprite[][] = []
  const left: PixelSprite[][] = []
  for (const by of [-1, 0, 1]) {
    const u: PixelSprite[] = []
    const l: PixelSprite[] = []
    for (let phase = 0; phase < 4; phase++) {
      const rows = lean(treads(BIKE, phase), by)
      u.push(pixelSprite(rows, palette))
      l.push(pixelSprite(transpose(rows), palette))
    }
    up.push(u)
    left.push(l)
  }
  const art = { ramp, up, left }
  bikeCache.set(key, art)
  return art
}

// --- the bow and the pickups ----------------------------------------------------------------------

const BOW = [
  '.LL.....LL.',
  'LBBL...LBBL',
  'LBdBL.LBdBL',
  '.LBBBkBBBL.',
  'LBdBL.LBdBL',
  'LBBL.L.LBBL',
  '.LL.LdL.LL.',
  '....Ld.dL..',
]

const bowCache = new Map<string, PixelSprite>()

/** The bow tied on a wrap, in its wrapper's colour. */
export function bowSprite(colour: string): PixelSprite {
  const hit = bowCache.get(colour)
  if (hit) return hit
  const ramp = rampOf(colour)
  const sprite = pixelSprite(BOW, {
    L: ramp[4],
    B: ramp[2],
    d: ramp[1],
    k: ramp[3],
  })
  bowCache.set(colour, sprite)
  return sprite
}

/** A rival tied up in a bow, sitting the round out: a little present. */
const PRESENT = [
  '..LL.LL..',
  '...LkL...',
  'aaaaLaaaa',
  'abbbLbbba',
  'abbbLbbba',
  'LLLLLLLLL',
  'abbbLbbba',
  'abbbLbbbd',
  'adddLdddd',
]

export function presentSprite(colour: string): PixelSprite {
  const key = `present|${colour}`
  const hit = bowCache.get(key)
  if (hit) return hit
  const ramp = rampOf(colour)
  const sprite = pixelSprite(PRESENT, {
    a: ramp[3],
    b: ramp[2],
    d: ramp[1],
    L: RAMPS.gold[3],
    k: RAMPS.gold[4],
  })
  bowCache.set(key, sprite)
  return sprite
}

const ICONS: Record<PickupKind, { rows: string[]; ramp: Ramp }> = {
  snip: {
    ramp: RAMPS.steel,
    rows: [
      'a.....a',
      'ba...ab',
      '.ba.ab.',
      '..bab..',
      '..cec..',
      '.cc.cc.',
      'c.c.c.c',
      '.c...c.',
    ],
  },
  spool: {
    ramp: RAMPS.pink,
    rows: [
      'eeeeeee',
      '.ccccc.',
      '.abbbb.',
      '.ccccc.',
      '.abbbb.',
      '.ccccc.',
      'eeeeeee',
    ],
  },
  eraser: {
    ramp: RAMPS.pink,
    rows: ['...eee.', '..eccce', '.eccccb', 'aaaacbb', 'aaaaab.', 'aaaab..'],
  },
  bow: {
    ramp: RAMPS.ember,
    rows: ['cc...cc', 'cbc.cbc', 'cbbebbc', 'cbc.cbc', 'cc.a.cc', '..a.a..'],
  },
  freeze: {
    ramp: RAMPS.sky,
    rows: [
      '...e...',
      '.c.e.c.',
      '..cec..',
      'eeeeeee',
      '..cec..',
      '.c.e.c.',
      '...e...',
    ],
  },
  spark: {
    ramp: RAMPS.gold,
    rows: [
      '....ee.',
      '...ec..',
      '..ecc..',
      '.ecccc.',
      '...cc..',
      '..cc...',
      '.cc....',
      '.b.....',
    ],
  },
}

const iconCache = new Map<PickupKind, PixelSprite>()

export function pickupIcon(kind: PickupKind): PixelSprite {
  const hit = iconCache.get(kind)
  if (hit) return hit
  const { rows, ramp } = ICONS[kind]
  const sprite = pixelSprite(rows, {
    a: ramp[1],
    b: ramp[2],
    c: ramp[3],
    e: ramp[4],
  })
  iconCache.set(kind, sprite)
  return sprite
}

// --- floors -----------------------------------------------------------------------------------

export type FloorTheme = { face: Ramp; line: Ramp }

export const FLOORS: Record<FloorId, FloorTheme> = {
  dusk: { face: RAMPS.night, line: RAMPS.pink },
  teal: {
    face: ['#031119', '#06222e', '#0a3242', '#104a5e', '#1d6f8a'],
    line: RAMPS.teal,
  },
  violet: {
    face: ['#10051a', '#200a30', '#321148', '#46195f', '#62287f'],
    line: RAMPS.gold,
  },
  pier: {
    face: ['#061428', '#0a2140', '#103058', '#184475', '#245c96'],
    line: RAMPS.sky,
  },
  gold: {
    face: ['#140a06', '#24140c', '#361e12', '#4a2a18', '#683c22'],
    line: RAMPS.gold,
  },
}
