// /utils/arcade/cableCrawler/art.ts
//
// Cable Crawler's 16-bit art (utils/arcade/snes.ts; conductor kr-arcade/t-064): the plug head and
// its shaded cable, each component's spark set and board, the sockets, the glitches, the bosses
// and the reel the cable unspools from. Every sprite is original pixel art written as rows of
// palette letters.

import {
  INK,
  RAMPS,
  type PixelSprite,
  bandedGradient,
  mix,
  pixelSprite,
  rgba,
} from '../snes'
import type { ComponentLook, SparkSet } from './components'
import { COLS, ROWS, cellKey } from './mazes'

export const TILE = 10
export const BOARD_W = COLS * TILE
export const BOARD_H = ROWS * TILE

// --- the plug and its cable ---------------------------------------------------------------------

/** The cable's insulation, top (lit) row to bottom (shadow) row across its 6px width. */
export const TUBE = [
  RAMPS.steel[3],
  RAMPS.steel[4],
  RAMPS.steel[3],
  RAMPS.sky[3],
  RAMPS.steel[2],
  RAMPS.steel[1],
] as const
/** The same rows while an energy pulse runs through: the core lights up. */
export const TUBE_LIT = [
  RAMPS.steel[3],
  RAMPS.steel[4],
  RAMPS.sky[4],
  '#ffffff',
  RAMPS.sky[3],
  RAMPS.steel[1],
] as const
/** The rows while a surge runs the whole length: the cable glows gold. */
export const TUBE_SURGE = [
  RAMPS.gold[3],
  RAMPS.gold[4],
  '#ffffff',
  RAMPS.gold[4],
  RAMPS.gold[2],
  RAMPS.gold[1],
] as const

export const PLUG_PALETTE = {
  H: RAMPS.steel[4],
  L: RAMPS.steel[3],
  B: RAMPS.steel[2],
  S: RAMPS.steel[1],
  k: INK,
  w: '#ffffff',
  p: RAMPS.pink[3],
  r: RAMPS.pink[2],
  G: RAMPS.gold[2],
  y: RAMPS.gold[4],
  d: RAMPS.gold[1],
  c: RAMPS.teal[4],
}

/** The plug's 8x8 housing: a little face that chomps (mouth open on the second frame). */
function plugHousing(open: boolean): string[] {
  return [
    '.HHHHHH.',
    'HLLLLLLB',
    'HLwkLwkB',
    'HLkkLkkB',
    open ? 'HpLkkLpB' : 'HpLLLLpB',
    open ? 'HLLrrLLB' : 'HLLkkLLB',
    'BBBBBBBS',
    '.SSSSSS.',
  ]
}

export type Facing = 'side' | 'up' | 'down'

/**
 * The plug head for a facing, its gold prongs pointing the way it crawls. On the chomp frame a
 * spark jumps between the prong tips. Left is the side art mirrored; nothing is rotated.
 */
function plugRows(facing: Facing, open: boolean): string[] {
  const housing = plugHousing(open)
  if (facing === 'side') {
    const prongs = [
      '...',
      'Gyy',
      'Gdd',
      open ? '..c' : '...',
      open ? '..c' : '...',
      'Gyy',
      'Gdd',
      '...',
    ]
    return housing.map((row, i) => row + prongs[i]!)
  }
  const tip = open ? '.ydccyd.' : '.yd..yd.'
  if (facing === 'up') return [tip, '.yd..yd.', '.GG..GG.', ...housing]
  return [...housing, '.GG..GG.', '.yd..yd.', tip]
}

export const PLUG: Record<Facing, readonly [PixelSprite, PixelSprite]> = {
  side: [
    pixelSprite(plugRows('side', false), PLUG_PALETTE),
    pixelSprite(plugRows('side', true), PLUG_PALETTE),
  ],
  up: [
    pixelSprite(plugRows('up', false), PLUG_PALETTE),
    pixelSprite(plugRows('up', true), PLUG_PALETTE),
  ],
  down: [
    pixelSprite(plugRows('down', false), PLUG_PALETTE),
    pixelSprite(plugRows('down', true), PLUG_PALETTE),
  ],
}

/**
 * The cable's elbow at a bend, for each pair of directions it bends between (`hx` the side its
 * horizontal run leaves by, `vy` the vertical one). Each pixel takes the shading of the run it
 * sits nearer, so the lit edge carries round the bend in a mitre, and the outer corner is inked
 * off to round it.
 */
function elbowRows(hx: number, vy: number): string[] {
  const rows: string[] = []
  for (let r = 0; r < 6; r++) {
    let row = ''
    for (let c = 0; c < 6; c++) {
      const outer = c === (hx > 0 ? 0 : 5) && r === (vy > 0 ? 0 : 5)
      const toSide = hx > 0 ? 5 - c : c
      const toEnd = vy > 0 ? 5 - r : r
      row += outer ? 'k' : String(toSide < toEnd ? r : c)
    }
    rows.push(row)
  }
  return rows
}

function elbowSprites(tube: readonly string[]) {
  const palette: Record<string, string> = { k: INK }
  tube.forEach((colour, i) => (palette[String(i)] = colour))
  const make = (hx: number, vy: number) =>
    pixelSprite(elbowRows(hx, vy), palette, { outline: null })
  return {
    '1,1': make(1, 1),
    '1,-1': make(1, -1),
    '-1,1': make(-1, 1),
    '-1,-1': make(-1, -1),
  } as Record<string, PixelSprite>
}

export const ELBOWS = elbowSprites(TUBE)
export const ELBOWS_LIT = elbowSprites(TUBE_LIT)
export const ELBOWS_SURGE = elbowSprites(TUBE_SURGE)

/** A spare cable for the HUD: a tiny plug. */
export const LIFE_SPRITE = pixelSprite(
  ['.HHH...', 'HLLLBGy', 'HkLkB..', 'HLLLBGy', '.SSS...'],
  PLUG_PALETTE,
)

/** The reel the cable unspools from at the start of a maze. */
export const REEL_SPRITE = pixelSprite(
  [
    '..BBBBB..',
    '.BLLLLLB.',
    'BLsHsHsLB',
    'BLHsHsHLB',
    'BLsHkHsLB',
    'BLHsHsHLB',
    'BLsHsHsLB',
    '.BLLLLLB.',
    '..BBBBB..',
  ],
  {
    B: RAMPS.rust[1],
    L: RAMPS.rust[2],
    H: RAMPS.steel[3],
    s: RAMPS.steel[2],
    k: INK,
  },
)

// --- sparks, golden bytes and sockets ------------------------------------------------------------

const BOLT_PALETTE = {
  w: '#ffffff',
  H: RAMPS.gold[4],
  Y: RAMPS.gold[3],
  G: RAMPS.gold[2],
  d: RAMPS.gold[1],
}
/** The Power Strip's sparks: a little lightning bolt, and its twinkle with a white-hot core. */
const BOLT_SPRITES = [
  pixelSprite(['..HY', '.HY.', 'HYGG', '.GY.', '.Gd.', 'Gd..'], BOLT_PALETTE),
  pixelSprite(['..Hw', '.Hw.', 'HwwY', '.wY.', '.Yd.', 'Yd..'], BOLT_PALETTE),
] as const

export const SPARK_SPRITES: Record<
  SparkSet,
  readonly [PixelSprite, PixelSprite]
> = {
  bolt: BOLT_SPRITES,
}

/** A mimic spark's twinkle: the same shape, but its core flushes pink and two eyes open. */
const MIMIC_PALETTE = {
  ...BOLT_PALETTE,
  w: RAMPS.pink[4],
  Y: RAMPS.pink[3],
  k: INK,
}
export const MIMIC_TWINKLE: Record<SparkSet, PixelSprite> = {
  bolt: pixelSprite(
    ['..Hw', '.kk.', 'HwwY', '.wY.', '.Yd.', 'Yd..'],
    MIMIC_PALETTE,
  ),
}

const BYTE_PALETTE = {
  ...BOLT_PALETTE,
  D: RAMPS.gold[0],
  s: RAMPS.steel[3],
  S: RAMPS.steel[1],
  k: INK,
}
/** The golden byte: a gold-plated chip on silver legs that spins, full face then edge-on. */
export const BYTE_SPRITES = [
  pixelSprite(
    [
      '.s.s.s.s.',
      'HHHYYYYGd',
      'HwwYkYkGd',
      'HwYYkYkGd',
      'YYkYYYYGd',
      'YYYGGGGdD',
      '.S.S.S.S.',
    ],
    BYTE_PALETTE,
  ),
  pixelSprite(
    [
      '...s.s...',
      '...HYG...',
      '...wYG...',
      '...YYd...',
      '...YGd...',
      '...GdD...',
      '...S.S...',
    ],
    BYTE_PALETTE,
  ),
] as const

const SOCKET_PALETTE = {
  P: RAMPS.cream[3],
  L: RAMPS.cream[4],
  M: RAMPS.cream[2],
  D: RAMPS.cream[1],
  k: INK,
  s: RAMPS.night[0],
}
/** A socket: a wall-plate outlet with two slots and a round earth hole, set into the floor. */
export const SOCKET_SPRITE = pixelSprite(
  ['LLLLLLP', 'LPPPPPM', 'LPsPsPM', 'LPsPsPM', 'LPPPPPM', 'LPPsPPM', 'PMMMMMD'],
  SOCKET_PALETTE,
)

// --- glitches -------------------------------------------------------------------------------------

const BUG_PALETTE = {
  B: RAMPS.sky[1],
  b: RAMPS.sky[2],
  L: RAMPS.sky[3],
  H: RAMPS.sky[4],
  w: '#ffffff',
  k: INK,
  y: RAMPS.gold[4],
}
/** A static bug: a fuzzy blue beetle with crackling antennae, legs scuttling. */
export const BUG_SPRITES = [
  pixelSprite(
    [
      'y.....y',
      '.y...y.',
      '..LHL..',
      '.LwkwL.',
      'bLLLLLb',
      '.bBbBb.',
      'b.b.b.b',
    ],
    BUG_PALETTE,
  ),
  pixelSprite(
    [
      '.y...y.',
      '.y...y.',
      '..LHL..',
      '.LwkwL.',
      'bLLLLLb',
      '.bBbBb.',
      '.b.b.b.',
    ],
    BUG_PALETTE,
  ),
] as const

const BUNNY_PALETTE = {
  D: RAMPS.steel[1],
  M: RAMPS.steel[2],
  L: RAMPS.steel[3],
  H: RAMPS.steel[4],
  k: INK,
  p: RAMPS.pink[3],
}
/** A dust bunny: a grey fluffball with ears, sleepy eyes and a pink nose; it wobbles. */
export const BUNNY_SPRITES = [
  pixelSprite(
    [
      '.L...L.',
      '.LH.HL.',
      'LHHHHHL',
      'LkHHHkM',
      'MHHpHHM',
      'MMLLLMD',
      '.DMDMD.',
    ],
    BUNNY_PALETTE,
  ),
  pixelSprite(
    [
      'L.....L',
      '.LH.HL.',
      'LHHHHHL',
      'LkHHHkM',
      'MHHpHHM',
      'MMLLLMD',
      '.DMDMD.',
    ],
    BUNNY_PALETTE,
  ),
] as const

/** A rebooted glitch: a little power symbol that spins up. */
export const REBOOT_SPRITE = pixelSprite(
  ['..w..', '.ww.w', 'w.w.w', 'w...w', '.www.'],
  { w: RAMPS.teal[4] },
)

// --- bosses ----------------------------------------------------------------------------------------

/** The Surge Protector's shell by phase: a glass fuse that runs green, then gold, then red. */
const FUSE_GLASS = [RAMPS.leaf, RAMPS.gold, RAMPS.ember] as const

function fuseBeetle(phase: number, frame: number): PixelSprite {
  const glass = FUSE_GLASS[Math.min(2, Math.max(0, phase - 1))]!
  const legs = frame
    ? ['k..k..k..k..k', '.k..k...k..k.']
    : ['.k..k...k..k.', 'k..k.....k..k']
  return pixelSprite(
    [
      '....HH.HH....',
      '...H..w..H...',
      '..SSSSSSSSS..',
      '.SCCCCCCCCCS.',
      'SCwgLLLLLggCS',
      'SCgLwwLLLLgCS',
      'SCgLLkLLkLgCS',
      'SCggLLLLLggCS',
      '.SCCCCCCCCCS.',
      '..SSSSSSSSS..',
      ...legs,
    ],
    {
      H: RAMPS.gold[4],
      w: '#ffffff',
      S: RAMPS.steel[1],
      C: RAMPS.steel[3],
      g: glass[1],
      L: glass[3],
      k: INK,
    },
  )
}

export const FUSE_BEETLE = [1, 2, 3].map((phase) => [
  fuseBeetle(phase, 0),
  fuseBeetle(phase, 1),
]) as readonly (readonly [PixelSprite, PixelSprite])[]

// --- the board ---------------------------------------------------------------------------------------

/**
 * A component's static board, painted once per maze: a banded board etched with faint traces
 * down the middle of every corridor and a solder pad on every other cell, shadows the walls cast
 * down and right, and the walls as raised slabs, lit on their top and left edges and shadowed on
 * their bottom and right, outlined in ink. The Power Strip's slabs are cream plastic, with an
 * outlet's slots and a screw here and there.
 */
export function paintBoard(
  k: CanvasRenderingContext2D,
  walls: readonly boolean[],
  look: ComponentLook,
) {
  const ramp = look.wall
  const isWall = (x: number, y: number) =>
    x < 0 || y < 0 || x >= COLS || y >= ROWS || walls[cellKey(x, y)] === true
  bandedGradient(k, 0, 0, BOARD_W, BOARD_H, look.floor, 4)
  const pad = mix(look.trace, look.floor[1], 0.3)

  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) {
      if (isWall(x, y)) continue
      const cx = x * TILE + TILE / 2
      const cy = y * TILE + TILE / 2
      k.fillStyle = look.trace
      if (!isWall(x + 1, y)) k.fillRect(cx, cy - 1, TILE, 2)
      if (!isWall(x, y + 1)) k.fillRect(cx - 1, cy, 2, TILE)
      if ((x + y) % 2 === 0) {
        k.fillStyle = pad
        k.fillRect(cx - 2, cy - 2, 4, 4)
        k.fillStyle = look.floor[3]
        k.fillRect(cx - 1, cy - 1, 2, 2)
      }
    }

  k.fillStyle = rgba(INK, 0.45)
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) {
      if (isWall(x, y)) continue
      const px = x * TILE
      const py = y * TILE
      if (isWall(x, y - 1)) k.fillRect(px, py, TILE, 2)
      if (isWall(x - 1, y))
        k.fillRect(
          px,
          py + (isWall(x, y - 1) ? 2 : 0),
          2,
          TILE - (isWall(x, y - 1) ? 2 : 0),
        )
    }

  const face = ramp[2]
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) {
      if (!isWall(x, y)) continue
      const px = x * TILE
      const py = y * TILE
      const up = !isWall(x, y - 1)
      const down = !isWall(x, y + 1)
      const left = !isWall(x - 1, y)
      const right = !isWall(x + 1, y)
      k.fillStyle = face
      k.fillRect(px, py, TILE, TILE)
      k.fillStyle = ramp[0]
      if (down) k.fillRect(px, py + TILE - 3, TILE, 2)
      k.fillStyle = ramp[1]
      if (right) k.fillRect(px + TILE - 3, py, 2, TILE - (down ? 3 : 0))
      if (up) {
        k.fillStyle = ramp[4]
        k.fillRect(px, py + 1, TILE, 1)
        k.fillStyle = ramp[3]
        k.fillRect(px, py + 2, TILE, 1)
      }
      if (left) {
        k.fillStyle = ramp[3]
        k.fillRect(
          px + 1,
          py + (up ? 1 : 0),
          1,
          TILE - (up ? 1 : 0) - (down ? 3 : 0),
        )
      }
      if (!up && !left && !isWall(x - 1, y - 1)) {
        k.fillStyle = ramp[4]
        k.fillRect(px, py, 2, 1)
        k.fillRect(px, py, 1, 2)
      }
      if (!down && !right && !isWall(x + 1, y + 1)) {
        k.fillStyle = ramp[0]
        k.fillRect(px + TILE - 3, py + TILE - 3, 3, 3)
      }
      k.fillStyle = INK
      if (up) k.fillRect(px, py, TILE, 1)
      if (down) k.fillRect(px, py + TILE - 1, TILE, 1)
      if (left) k.fillRect(px, py, 1, TILE)
      if (right) k.fillRect(px + TILE - 1, py, 1, TILE)
      if (!up && !left && !isWall(x - 1, y - 1)) k.fillRect(px, py, 1, 1)
      if (!up && !right && !isWall(x + 1, y - 1))
        k.fillRect(px + TILE - 1, py, 1, 1)
      if (!down && !left && !isWall(x - 1, y + 1))
        k.fillRect(px, py + TILE - 1, 1, 1)
      if (!down && !right && !isWall(x + 1, y + 1))
        k.fillRect(px + TILE - 1, py + TILE - 1, 1, 1)
      const corner = (cx: number, cy: number) => {
        k.fillStyle = look.floor[1]
        k.fillRect(cx, cy, 1, 1)
      }
      if (up && left) corner(px, py)
      if (up && right) corner(px + TILE - 1, py)
      if (down && left) corner(px, py + TILE - 1)
      if (down && right) corner(px + TILE - 1, py + TILE - 1)
      const frameCell = x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1
      const hash = (x * 7 + y * 13) % 11
      if (!frameCell && !up && !down && hash < 3) {
        // An outlet's two slots, pressed into the plastic.
        k.fillStyle = ramp[0]
        k.fillRect(px + 3, py + 3, 1, 3)
        k.fillRect(px + 6, py + 3, 1, 3)
        k.fillStyle = ramp[4]
        k.fillRect(px + 4, py + 3, 1, 3)
        k.fillRect(px + 7, py + 3, 1, 3)
      } else if (frameCell && (x * 5 + y * 3) % 7 === 0) {
        // A screw head in the chassis.
        k.fillStyle = INK
        k.fillRect(px + 3, py + 3, 4, 4)
        k.fillStyle = RAMPS.steel[3]
        k.fillRect(px + 4, py + 4, 2, 2)
        k.fillStyle = RAMPS.steel[1]
        k.fillRect(px + 4, py + 5, 2, 1)
      }
    }
}

/** An offscreen canvas the board's size, or null headless. */
export function boardCanvas(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = BOARD_W
  canvas.height = BOARD_H
  return canvas
}

const glowStamps = new Map<string, HTMLCanvasElement | null>()

/**
 * A soft additive glow baked once to an offscreen canvas, for lights drawn by the hundred (every
 * spark, every lit cable segment). Null headless, where the glow is simply skipped.
 */
export function glowStamp(
  colour: string,
  r: number,
  alpha: number,
): HTMLCanvasElement | null {
  const id = `${colour}:${r}:${alpha}`
  let stamp = glowStamps.get(id)
  if (stamp === undefined) {
    stamp = null
    if (typeof document !== 'undefined') {
      const size = Math.ceil(r * 8)
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = size
      const sg = canvas.getContext('2d')
      if (sg) {
        const grad = sg.createRadialGradient(
          size / 2,
          size / 2,
          0,
          size / 2,
          size / 2,
          size / 2,
        )
        grad.addColorStop(0, rgba(colour, alpha))
        grad.addColorStop(1, rgba(colour, 0))
        sg.fillStyle = grad
        sg.fillRect(0, 0, size, size)
        stamp = canvas
      }
    }
    glowStamps.set(id, stamp)
  }
  return stamp
}
