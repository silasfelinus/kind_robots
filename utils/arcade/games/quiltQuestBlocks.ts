// /utils/arcade/games/quiltQuestBlocks.ts
//
// Quilt Quest's content as data (conductor kr-arcade/t-127, depth slice 1): the authored
// pictures hidden under the blank cloth, the frame shapes and pre-sewn islands, the power-up
// buttons, the seam combos and Endless Quilting's ladder of foes. quiltQuest.ts reads these;
// nothing here touches the game's rng.

export const QUILT_COLS = 61
export const QUILT_ROWS = 51

/** The six fabric ramps, in the order quiltQuest.ts lists FABRICS. */
export const FABRIC_NAMES = [
  'pink',
  'gold',
  'teal',
  'purple',
  'leaf',
  'rust',
] as const
export type FabricName = (typeof FABRIC_NAMES)[number]
export type Shade = 0 | 1 | 2 | 3 | 4

/** A picture cell: 1 + fabric * 5 + shade, or INK_CELL for an inked line. */
export const INK_CELL = 255

/**
 * One brush stroke of an authored picture, in picture cells (61 x 51). A shape with no `shade`
 * is shaded like a lit ball across its own bounds (upper left bright); `outline` inks its rim.
 */
export type PictureShape =
  | {
      kind: 'rect'
      x: number
      y: number
      w: number
      h: number
      fabric: FabricName | 'ink'
      shade?: Shade
      outline?: boolean
    }
  | {
      kind: 'ellipse'
      cx: number
      cy: number
      rx: number
      ry: number
      fabric: FabricName | 'ink'
      shade?: Shade
      outline?: boolean
    }
  | {
      kind: 'poly'
      points: ReadonlyArray<readonly [number, number]>
      fabric: FabricName | 'ink'
      shade?: Shade
      outline?: boolean
    }
  | {
      kind: 'line'
      from: readonly [number, number]
      to: readonly [number, number]
      width: number
      fabric: FabricName | 'ink'
      shade?: Shade
    }
  | {
      kind: 'checks'
      x: number
      y: number
      w: number
      h: number
      size: number
      fabric: FabricName
      shades: readonly [Shade, Shade]
    }
  | {
      kind: 'dots'
      points: ReadonlyArray<readonly [number, number]>
      fabric: FabricName | 'ink'
      shade?: Shade
    }

export type QuiltPicture = {
  id: string
  /** Shown when the block is finished. */
  name: string
  theme: 'flowers-and-fruit'
  /** The background, in even bands from the top. */
  sky: { fabric: FabricName; shades: readonly Shade[] }
  shapes: readonly PictureShape[]
  /** The marked feature: reveal all of it in one patch for Picture Perfect. */
  feature: { name: string; x: number; y: number; w: number; h: number }
}

const petals = (
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  count: number,
): Array<[number, number]> => {
  const pts: Array<[number, number]> = []
  for (let i = 0; i < count * 2; i++) {
    const a = (i / (count * 2)) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 === 0 ? outer : inner
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  return pts
}

const tulip = (cx: number, cy: number, fabric: FabricName): PictureShape[] => [
  {
    kind: 'line',
    from: [cx, cy + 6],
    to: [cx, 44],
    width: 2,
    fabric: 'leaf',
    shade: 1,
  },
  {
    kind: 'poly',
    points: [
      [cx - 6, cy - 5],
      [cx - 3, cy - 1],
      [cx, cy - 7],
      [cx + 3, cy - 1],
      [cx + 6, cy - 5],
      [cx + 6, cy + 3],
      [cx, cy + 8],
      [cx - 6, cy + 3],
    ],
    fabric,
    outline: true,
  },
]

/** Circle 1's pool, Flowers and fruit: every block hides one of these. */
export const QUILT_PICTURES: readonly QuiltPicture[] = [
  {
    id: 'sunflower',
    name: 'SMILING SUNFLOWER',
    theme: 'flowers-and-fruit',
    sky: { fabric: 'teal', shades: [4, 4, 3, 3, 3, 2] },
    shapes: [
      { kind: 'ellipse', cx: 9, cy: 8, rx: 5, ry: 5, fabric: 'gold' },
      {
        kind: 'ellipse',
        cx: 46,
        cy: 8,
        rx: 8,
        ry: 3,
        fabric: 'pink',
        shade: 4,
      },
      {
        kind: 'ellipse',
        cx: 52,
        cy: 6,
        rx: 5,
        ry: 3,
        fabric: 'pink',
        shade: 4,
      },
      { kind: 'rect', x: 0, y: 42, w: 61, h: 9, fabric: 'leaf', shade: 2 },
      { kind: 'rect', x: 0, y: 42, w: 61, h: 1, fabric: 'leaf', shade: 3 },
      {
        kind: 'line',
        from: [30, 26],
        to: [30, 45],
        width: 3,
        fabric: 'leaf',
        shade: 1,
      },
      {
        kind: 'ellipse',
        cx: 23,
        cy: 36,
        rx: 6,
        ry: 2.5,
        fabric: 'leaf',
        outline: true,
      },
      {
        kind: 'ellipse',
        cx: 37,
        cy: 33,
        rx: 6,
        ry: 2.5,
        fabric: 'leaf',
        outline: true,
      },
      {
        kind: 'poly',
        points: petals(30, 19, 15, 9, 12),
        fabric: 'gold',
        shade: 3,
        outline: true,
      },
      {
        kind: 'ellipse',
        cx: 30,
        cy: 19,
        rx: 10,
        ry: 10,
        fabric: 'gold',
        shade: 2,
      },
      {
        kind: 'ellipse',
        cx: 30,
        cy: 19,
        rx: 7,
        ry: 7,
        fabric: 'rust',
        outline: true,
      },
      {
        kind: 'dots',
        points: [
          [28, 17],
          [32, 17],
          [27, 21],
          [28, 22],
          [29, 22],
          [30, 22],
          [31, 22],
          [32, 22],
          [33, 21],
        ],
        fabric: 'ink',
      },
      {
        kind: 'dots',
        points: [
          [26, 19],
          [34, 19],
        ],
        fabric: 'pink',
        shade: 3,
      },
    ],
    feature: { name: 'THE FACE', x: 23, y: 12, w: 15, h: 15 },
  },
  {
    id: 'cherries',
    name: 'CHERRY PAIR',
    theme: 'flowers-and-fruit',
    sky: { fabric: 'purple', shades: [3, 3, 2, 2] },
    shapes: [
      {
        kind: 'checks',
        x: 0,
        y: 40,
        w: 61,
        h: 11,
        size: 3,
        fabric: 'pink',
        shades: [4, 3],
      },
      {
        kind: 'line',
        from: [24, 28],
        to: [33, 9],
        width: 1.5,
        fabric: 'leaf',
        shade: 1,
      },
      {
        kind: 'line',
        from: [40, 29],
        to: [33, 9],
        width: 1.5,
        fabric: 'leaf',
        shade: 1,
      },
      {
        kind: 'ellipse',
        cx: 40,
        cy: 9,
        rx: 7,
        ry: 3,
        fabric: 'leaf',
        outline: true,
      },
      {
        kind: 'ellipse',
        cx: 24,
        cy: 33,
        rx: 8,
        ry: 8,
        fabric: 'pink',
        outline: true,
      },
      {
        kind: 'ellipse',
        cx: 40,
        cy: 35,
        rx: 8,
        ry: 8,
        fabric: 'rust',
        outline: true,
      },
      {
        kind: 'dots',
        points: [
          [22, 32],
          [26, 32],
          [23, 35],
          [24, 36],
          [25, 35],
          [38, 34],
          [42, 34],
          [39, 37],
          [40, 38],
          [41, 37],
        ],
        fabric: 'ink',
      },
    ],
    feature: { name: 'THE BIG CHERRY', x: 31, y: 26, w: 18, h: 18 },
  },
  {
    id: 'strawberry',
    name: 'STRAWBERRY HUG',
    theme: 'flowers-and-fruit',
    sky: { fabric: 'gold', shades: [4, 4, 3, 3] },
    shapes: [
      {
        kind: 'checks',
        x: 0,
        y: 44,
        w: 61,
        h: 7,
        size: 2,
        fabric: 'teal',
        shades: [3, 2],
      },
      {
        kind: 'poly',
        points: [
          [15, 20],
          [20, 14],
          [30, 12],
          [40, 14],
          [45, 20],
          [44, 28],
          [38, 38],
          [30, 46],
          [22, 38],
          [16, 28],
        ],
        fabric: 'pink',
        outline: true,
      },
      {
        kind: 'dots',
        points: [
          [21, 20],
          [27, 18],
          [34, 18],
          [40, 21],
          [19, 26],
          [25, 24],
          [37, 25],
          [42, 27],
          [23, 31],
          [29, 34],
          [35, 32],
          [26, 38],
          [33, 39],
          [30, 43],
        ],
        fabric: 'gold',
        shade: 4,
      },
      {
        kind: 'poly',
        points: [
          [21, 14],
          [26, 8],
          [29, 12],
          [31, 4],
          [33, 12],
          [36, 8],
          [40, 14],
          [30, 17],
        ],
        fabric: 'leaf',
        outline: true,
      },
      {
        kind: 'dots',
        points: [
          [27, 26],
          [33, 26],
          [28, 29],
          [29, 30],
          [30, 30],
          [31, 30],
          [32, 29],
        ],
        fabric: 'ink',
      },
    ],
    feature: { name: 'THE LEAFY CROWN', x: 21, y: 4, w: 20, h: 14 },
  },
  {
    id: 'tulips',
    name: 'TULIP TRIO',
    theme: 'flowers-and-fruit',
    sky: { fabric: 'teal', shades: [4, 3, 3, 2, 2] },
    shapes: [
      { kind: 'rect', x: 0, y: 43, w: 61, h: 8, fabric: 'leaf', shade: 2 },
      { kind: 'rect', x: 0, y: 43, w: 61, h: 1, fabric: 'leaf', shade: 3 },
      ...tulip(14, 22, 'pink'),
      ...tulip(30, 15, 'gold'),
      ...tulip(46, 22, 'purple'),
      {
        kind: 'ellipse',
        cx: 22,
        cy: 38,
        rx: 5,
        ry: 2,
        fabric: 'leaf',
        outline: true,
      },
      {
        kind: 'ellipse',
        cx: 38,
        cy: 36,
        rx: 5,
        ry: 2,
        fabric: 'leaf',
        outline: true,
      },
    ],
    feature: { name: 'THE MIDDLE TULIP', x: 23, y: 7, w: 15, h: 17 },
  },
  {
    id: 'lemon',
    name: 'LEMON SLICE',
    theme: 'flowers-and-fruit',
    sky: { fabric: 'pink', shades: [4, 3, 3, 2] },
    shapes: [
      {
        kind: 'checks',
        x: 0,
        y: 41,
        w: 61,
        h: 10,
        size: 3,
        fabric: 'purple',
        shades: [3, 4],
      },
      {
        kind: 'ellipse',
        cx: 30,
        cy: 24,
        rx: 16,
        ry: 16,
        fabric: 'gold',
        outline: true,
      },
      {
        kind: 'ellipse',
        cx: 30,
        cy: 24,
        rx: 13,
        ry: 13,
        fabric: 'gold',
        shade: 4,
      },
      {
        kind: 'ellipse',
        cx: 30,
        cy: 24,
        rx: 11.5,
        ry: 11.5,
        fabric: 'gold',
        shade: 3,
      },
      ...[0, 1, 2, 3, 4, 5, 6, 7].map((i): PictureShape => ({
        kind: 'line',
        from: [30, 24],
        to: [
          30 + Math.cos((i / 8) * Math.PI * 2) * 12,
          24 + Math.sin((i / 8) * Math.PI * 2) * 12,
        ],
        width: 1.2,
        fabric: 'gold',
        shade: 4,
      })),
      {
        kind: 'ellipse',
        cx: 30,
        cy: 24,
        rx: 2,
        ry: 2,
        fabric: 'gold',
        shade: 4,
      },
    ],
    feature: { name: 'THE SLICE', x: 21, y: 15, w: 19, h: 19 },
  },
  {
    id: 'gardener',
    name: 'ROBOT GARDENER',
    theme: 'flowers-and-fruit',
    sky: { fabric: 'teal', shades: [4, 4, 3, 3, 2] },
    shapes: [
      { kind: 'rect', x: 0, y: 42, w: 61, h: 9, fabric: 'leaf', shade: 2 },
      { kind: 'rect', x: 0, y: 42, w: 61, h: 1, fabric: 'leaf', shade: 3 },
      {
        kind: 'line',
        from: [19, 13],
        to: [19, 7],
        width: 1,
        fabric: 'purple',
        shade: 1,
      },
      { kind: 'ellipse', cx: 19, cy: 6, rx: 2, ry: 2, fabric: 'gold' },
      {
        kind: 'rect',
        x: 13,
        y: 13,
        w: 13,
        h: 10,
        fabric: 'purple',
        outline: true,
      },
      {
        kind: 'rect',
        x: 12,
        y: 24,
        w: 15,
        h: 15,
        fabric: 'purple',
        outline: true,
      },
      { kind: 'rect', x: 14, y: 39, w: 3, h: 4, fabric: 'purple', shade: 1 },
      { kind: 'rect', x: 22, y: 39, w: 3, h: 4, fabric: 'purple', shade: 1 },
      {
        kind: 'dots',
        points: [
          [16, 16],
          [17, 16],
          [22, 16],
          [23, 16],
        ],
        fabric: 'gold',
        shade: 4,
      },
      {
        kind: 'dots',
        points: [
          [17, 19],
          [18, 20],
          [19, 20],
          [20, 20],
          [21, 19],
        ],
        fabric: 'ink',
      },
      { kind: 'ellipse', cx: 19, cy: 31, rx: 3, ry: 3, fabric: 'pink' },
      {
        kind: 'poly',
        points: [
          [28, 24],
          [36, 24],
          [37, 32],
          [27, 32],
        ],
        fabric: 'rust',
        outline: true,
      },
      {
        kind: 'line',
        from: [36, 26],
        to: [42, 21],
        width: 1.5,
        fabric: 'rust',
        shade: 2,
      },
      {
        kind: 'dots',
        points: [
          [43, 24],
          [44, 27],
          [42, 29],
          [45, 31],
          [43, 33],
        ],
        fabric: 'teal',
        shade: 1,
      },
      {
        kind: 'line',
        from: [47, 30],
        to: [47, 43],
        width: 1.5,
        fabric: 'leaf',
        shade: 1,
      },
      {
        kind: 'ellipse',
        cx: 51,
        cy: 37,
        rx: 4,
        ry: 1.6,
        fabric: 'leaf',
        outline: true,
      },
      {
        kind: 'poly',
        points: petals(47, 27, 6, 3.5, 6),
        fabric: 'pink',
        outline: true,
      },
      { kind: 'ellipse', cx: 47, cy: 27, rx: 2, ry: 2, fabric: 'gold' },
    ],
    feature: { name: 'THE ROBOT', x: 12, y: 12, w: 15, h: 12 },
  },
]

const fabricIndex = (fabric: FabricName) => FABRIC_NAMES.indexOf(fabric)
const code = (fabric: FabricName | 'ink', shade: Shade) =>
  fabric === 'ink' ? INK_CELL : 1 + fabricIndex(fabric) * 5 + shade

function covers(shape: PictureShape, x: number, y: number): boolean {
  const px = x + 0.5
  const py = y + 0.5
  switch (shape.kind) {
    case 'rect':
    case 'checks':
      return (
        x >= shape.x &&
        x < shape.x + shape.w &&
        y >= shape.y &&
        y < shape.y + shape.h
      )
    case 'ellipse': {
      const dx = (px - shape.cx - 0.5) / shape.rx
      const dy = (py - shape.cy - 0.5) / shape.ry
      return dx * dx + dy * dy <= 1
    }
    case 'poly': {
      let inside = false
      const pts = shape.points
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i]!
        const [xj, yj] = pts[j]!
        if (
          yi > py !== yj > py &&
          px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
        )
          inside = !inside
      }
      return inside
    }
    case 'line': {
      const [ax, ay] = shape.from
      const [bx, by] = shape.to
      const vx = bx - ax
      const vy = by - ay
      const len = vx * vx + vy * vy || 1
      const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / len))
      return Math.hypot(x - ax - vx * t, y - ay - vy * t) <= shape.width / 2
    }
    case 'dots':
      return shape.points.some(([dx, dy]) => dx === x && dy === y)
  }
}

/** A lit-ball shade for a cell inside a shape's bounds, light from the upper left. */
function orbShade(
  x: number,
  y: number,
  box: { x0: number; y0: number; x1: number; y1: number },
): Shade {
  const nx = ((x + 0.5 - box.x0) / Math.max(1, box.x1 - box.x0)) * 2 - 1
  const ny = ((y + 0.5 - box.y0) / Math.max(1, box.y1 - box.y0)) * 2 - 1
  const nz = Math.sqrt(Math.max(0, 1 - Math.min(1, nx * nx + ny * ny)))
  const light = -0.5 * nx - 0.6 * ny + 0.62 * nz
  return Math.max(1, Math.min(4, Math.round(light * 2 + 1.6))) as Shade
}

const pictureCache = new Map<string, Uint8Array>()

/**
 * A picture painted into its 61 x 51 cells: each holds 1 + fabric * 5 + shade, or INK_CELL.
 * Painted once and cached; the same picture always paints the same cells.
 */
export function paintPicture(picture: QuiltPicture): Uint8Array {
  const cached = pictureCache.get(picture.id)
  if (cached) return cached
  const W = QUILT_COLS
  const H = QUILT_ROWS
  const out = new Uint8Array(W * H)
  const bands = picture.sky.shades
  for (let y = 0; y < H; y++) {
    const band = Math.min(bands.length - 1, Math.floor((y / H) * bands.length))
    for (let x = 0; x < W; x++)
      out[y * W + x] = code(picture.sky.fabric, bands[band]!)
  }
  const mask = new Uint8Array(W * H)
  for (const shape of picture.shapes) {
    mask.fill(0)
    const box = { x0: W, y0: H, x1: 0, y1: 0 }
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (covers(shape, x, y)) {
          mask[y * W + x] = 1
          box.x0 = Math.min(box.x0, x)
          box.y0 = Math.min(box.y0, y)
          box.x1 = Math.max(box.x1, x + 1)
          box.y1 = Math.max(box.y1, y + 1)
        }
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (!mask[y * W + x]) continue
        if (shape.kind === 'checks') {
          const odd =
            (Math.floor((x - shape.x) / shape.size) +
              Math.floor((y - shape.y) / shape.size)) %
            2
          out[y * W + x] = code(shape.fabric, shape.shades[odd]!)
          continue
        }
        out[y * W + x] = code(shape.fabric, shape.shade ?? orbShade(x, y, box))
      }
    if ('outline' in shape && shape.outline)
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          if (!mask[y * W + x]) continue
          const rim =
            x === 0 ||
            y === 0 ||
            x === W - 1 ||
            y === H - 1 ||
            !mask[y * W + x - 1] ||
            !mask[y * W + x + 1] ||
            !mask[(y - 1) * W + x] ||
            !mask[(y + 1) * W + x]
          if (rim) out[y * W + x] = INK_CELL
        }
  }
  pictureCache.set(picture.id, out)
  return out
}

/** Decode a picture cell into its fabric (0..5) and shade, or null for ink. */
export function pictureInk(
  value: number,
): { fabric: number; shade: Shade } | null {
  if (value === INK_CELL || value === 0) return null
  const v = value - 1
  return { fabric: Math.floor(v / 5), shade: (v % 5) as Shade }
}

// --- frames and islands ---------------------------------------------------------------------------

export type FrameShape = 'rect' | 'hoop' | 'oval' | 'hex' | 'heart' | 'star'

/** A pre-sewn island in the cloth: a button, a pin or an appliqué heart to sew around. */
export type QuiltIsland = {
  kind: 'button' | 'pin' | 'applique'
  c: number
  r: number
  size: number
}

export type QuiltFrame = {
  id: string
  name: string
  shape: FrameShape
  islands: readonly QuiltIsland[]
}

/** Whether a cell lies inside a frame's shape (the cloth stretched in it). */
export function insideFrame(shape: FrameShape, c: number, r: number): boolean {
  const dx = c - (QUILT_COLS - 1) / 2
  const dy = r - (QUILT_ROWS - 1) / 2
  switch (shape) {
    case 'rect':
      return true
    case 'hoop':
      return (dx / 25.6) ** 2 + (dy / 25.6) ** 2 <= 1
    case 'oval':
      return (dx / 30.6) ** 2 + (dy / 25.6) ** 2 <= 1
    case 'hex':
      return Math.abs(dx) <= 30.5 - (15 * Math.abs(dy)) / 25
    case 'heart': {
      const x = dx / 25
      const y = 1.22 - (r * 2.3) / (QUILT_ROWS - 1)
      return (x * x + y * y - 1) ** 3 - x * x * y ** 3 <= 0
    }
    case 'star':
      return covers(
        { kind: 'poly', points: STAR_FRAME, fabric: 'ink' },
        c - 0.5,
        r - 0.5,
      )
  }
}

/** The Lucky Star frame's rim: five fat points round the cloth's middle. */
const STAR_FRAME = petals(30, 27.5, 27, 15, 5)

/** The cells an island covers. */
export function islandCells(island: QuiltIsland): Array<[number, number]> {
  const cells: Array<[number, number]> = []
  const s = island.size
  for (let r = island.r - s - 1; r <= island.r + s + 1; r++)
    for (let c = island.c - s - 1; c <= island.c + s + 1; c++) {
      const dx = c - island.c
      const dy = r - island.r
      let hit: boolean
      if (island.kind === 'button') hit = dx * dx + dy * dy <= s * s + 0.5
      else if (island.kind === 'pin') hit = Math.abs(dx) + Math.abs(dy) <= s
      else {
        const x = dx / (s + 0.5)
        const y = -(dy - 0.5) / (s + 0.5)
        hit = (x * x + y * y - 1) ** 3 - x * x * y ** 3 <= 0
      }
      if (hit) cells.push([c, r])
    }
  return cells
}

/** The frames Endless Quilting draws from: today's rectangle first, then the shapes. */
export const QUILT_FRAMES: readonly QuiltFrame[] = [
  { id: 'parlour', name: 'PATCHWORK PARLOUR', shape: 'rect', islands: [] },
  {
    id: 'parlour-applique',
    name: 'APPLIQUE PARLOUR',
    shape: 'rect',
    islands: [
      { kind: 'applique', c: 17, r: 16, size: 3 },
      { kind: 'applique', c: 43, r: 34, size: 3 },
    ],
  },
  {
    id: 'round-hoop',
    name: 'ROUND HOOP',
    shape: 'hoop',
    islands: [
      { kind: 'pin', c: 30, r: 12, size: 1 },
      { kind: 'pin', c: 30, r: 38, size: 1 },
    ],
  },
  {
    id: 'button-hex',
    name: 'BUTTON HEXAGON',
    shape: 'hex',
    islands: [
      { kind: 'button', c: 18, r: 25, size: 3 },
      { kind: 'button', c: 42, r: 25, size: 3 },
    ],
  },
  {
    id: 'oval-hoop',
    name: 'OVAL HOOP',
    shape: 'oval',
    islands: [
      { kind: 'pin', c: 14, r: 25, size: 1 },
      { kind: 'pin', c: 46, r: 25, size: 1 },
      { kind: 'button', c: 30, r: 40, size: 2 },
    ],
  },
  {
    id: 'sweetheart',
    name: 'SWEETHEART',
    shape: 'heart',
    islands: [{ kind: 'applique', c: 30, r: 33, size: 3 }],
  },
  {
    id: 'lucky-star',
    name: 'LUCKY STAR',
    shape: 'star',
    islands: [{ kind: 'button', c: 30, r: 30, size: 2 }],
  },
]

// --- power-up buttons -------------------------------------------------------------------------------

export type PowerUpKind = 'thimble' | 'treadle' | 'spool' | 'pause' | 'magnet'

/** The buttons hidden in the cloth: enclose one to claim it. `ticks` is how long it lasts. */
export const POWER_UPS: Readonly<
  Record<
    PowerUpKind,
    { name: string; tip: string; ticks: number; weight: number }
  >
> = {
  thimble: { name: 'THIMBLE', tip: 'FORGIVES ONE SNAP', ticks: 0, weight: 2 },
  treadle: {
    name: 'TREADLE',
    tip: 'NEEDLE GOES FASTER',
    ticks: 900,
    weight: 2,
  },
  spool: { name: 'SPOOL', tip: 'STITCH CLOCK REFILLED', ticks: 0, weight: 3 },
  pause: { name: 'PAUSE PIN', tip: 'EVERY FOE FROZEN', ticks: 240, weight: 2 },
  magnet: { name: 'MAGNET', tip: 'SPARKS PULLED AWAY', ticks: 360, weight: 2 },
}
export const POWER_UP_KINDS = Object.keys(POWER_UPS) as PowerUpKind[]
/** At most this many thimbles ride along at once. */
export const MAX_THIMBLES = 2
/** The treadle's speed-up. */
export const TREADLE_SPEED = 1.5

/** Pick a power-up kind from a roll in [0, 1), by weight. */
export function pickPowerUp(roll: number): PowerUpKind {
  const total = POWER_UP_KINDS.reduce((n, k) => n + POWER_UPS[k].weight, 0)
  let at = roll * total
  for (const kind of POWER_UP_KINDS) {
    at -= POWER_UPS[kind].weight
    if (at < 0) return kind
  }
  return POWER_UP_KINDS[POWER_UP_KINDS.length - 1]!
}

// --- seam combos ------------------------------------------------------------------------------------

export const SEAM_COMBOS = {
  /** Claim this share of the cloth (percent) or more in one stitch. */
  bigBlock: { name: 'BIG BLOCK', minShare: 10, points: 2000 },
  /** Claim an exact square patch, at least this many cells a side. */
  squareSeam: { name: 'SQUARE SEAM', minSide: 5, points: 1500 },
  /** Reveal the picture's marked feature in one patch. */
  picturePerfect: { name: 'PICTURE PERFECT', points: 2500 },
} as const

/** A small foe boxed into a patch under this share of the cloth (percent) is wrapped in a bow. */
export const WRAP_SHARE = 3
export const WRAP_POINTS = 1000

// --- Endless Quilting's ladder ----------------------------------------------------------------------

export type LadderFoe = 'tangle' | 'tanglet' | 'twins' | 'wildfire'

/** A new foe every two quilts; once the roster is out, every two quilts the cloth heats up. */
export const ENDLESS_LADDER: ReadonlyArray<{
  quilt: number
  foe: LadderFoe
  name: string
  tip: string
}> = [
  {
    quilt: 1,
    foe: 'tangle',
    name: 'TANGLE SPRITE',
    tip: 'KEEP YOUR THREAD CLEAR',
  },
  {
    quilt: 3,
    foe: 'tanglet',
    name: 'TANGLETS',
    tip: 'WRAP ONE IN A SMALL BOX',
  },
  { quilt: 5, foe: 'twins', name: 'TWIN TANGLES', tip: 'SPLIT THEM FOR X2' },
  {
    quilt: 7,
    foe: 'wildfire',
    name: 'WILDFIRE SPARK',
    tip: 'IT RUNS ONTO THREAD',
  },
]

/** Ticks of stitch clock: 30 s at quilt 1, a second less each quilt, never under 20 s. */
export const STITCH_CLOCK = { start: 1800, step: -60, limit: 1200 } as const
/** Heat takes a further second off per step, down to this floor. */
export const STITCH_CLOCK_FLOOR = 840

export type LadderStep = (typeof ENDLESS_LADDER)[number]

export type QuiltBlock = {
  quilt: number
  picture: QuiltPicture
  frame: QuiltFrame
  /** Big tangle sprites (a twin pair counts as two). */
  tangles: number
  twins: boolean
  tanglets: number
  /** Sparks that are always wildfire. */
  wildSparks: number
  /** Power-up buttons hidden in the cloth. */
  buttons: number
  clockTicks: number
  /** Escalation steps once the roster is complete. */
  heat: number
  /** The foe met for the first time on this quilt. */
  unlock: LadderStep | null
}

const unlocked = (quilt: number, foe: LadderFoe) =>
  ENDLESS_LADDER.some((s) => s.foe === foe && quilt >= s.quilt)

/** Endless Quilting's block for a quilt number: its content and foe mix, no dice. */
export function endlessBlock(quilt: number): QuiltBlock {
  const q = Math.max(1, Math.floor(quilt))
  const last = ENDLESS_LADDER[ENDLESS_LADDER.length - 1]!.quilt
  const heat = Math.max(0, Math.floor((q - last) / 2))
  const twins = unlocked(q, 'twins')
  const frame =
    q <= 2
      ? QUILT_FRAMES[0]!
      : q <= 4
        ? QUILT_FRAMES[1]!
        : QUILT_FRAMES[(q - 5) % QUILT_FRAMES.length]!
  const clock = Math.max(
    STITCH_CLOCK.limit,
    STITCH_CLOCK.start + STITCH_CLOCK.step * (q - 1),
  )
  return {
    quilt: q,
    picture: QUILT_PICTURES[(q - 1) % QUILT_PICTURES.length]!,
    frame,
    tangles: (twins ? 2 : 1) + (heat >= 3 ? 1 : 0),
    twins,
    tanglets: unlocked(q, 'tanglet')
      ? Math.min(4, (q >= 4 ? 2 : 1) + Math.floor(heat / 2))
      : 0,
    wildSparks: unlocked(q, 'wildfire') ? (heat >= 2 ? 2 : 1) : 0,
    buttons: q === 1 ? 1 : Math.min(3, 2 + Math.floor(heat / 3)),
    clockTicks: Math.max(STITCH_CLOCK_FLOOR, clock - heat * 60),
    heat,
    unlock: ENDLESS_LADDER.find((s) => s.quilt === q) ?? null,
  }
}
