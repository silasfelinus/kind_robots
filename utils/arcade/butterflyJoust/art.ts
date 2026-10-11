// /utils/arcade/butterflyJoust/art.ts
//
// Butterfly Joust's sprites, built on utils/arcade/snes.ts: the robot riders on their butterflies
// (one look per seat of the Jousting Party), the grumpy moth riders by tier, the carrier moth,
// cocoons, and the pond frog and Thundercap drawn from shaded primitives.

import {
  INK,
  RAMPS,
  drawCloud,
  glow,
  pixelSprite,
  rgba,
  shadedOrb,
  type PixelSprite,
  type Ramp,
} from '../snes'

// --- 16-bit art (utils/arcade/snes.ts) -------------------------------------------

/** Lay stamps of palette letters over a blank grid, later stamps on top ('.' is clear). */
export function compose(
  w: number,
  h: number,
  stamps: readonly (readonly [number, number, readonly string[]])[],
): string[] {
  const grid = Array.from({ length: h }, () => new Array<string>(w).fill('.'))
  for (const [x, y, rows] of stamps) {
    rows.forEach((row, dy) => {
      const line = grid[y + dy]
      if (!line) return
      for (let dx = 0; dx < row.length; dx++) {
        const ch = row[dx]!
        if (ch !== '.' && x + dx >= 0 && x + dx < w) line[x + dx] = ch
      }
    })
  }
  return grid.map((line) => line.join(''))
}

// Butterfly + rider, facing right on a 30x28 grid: (col 15, row 16) is the rider's (x, y), so
// the mount's feet (row 23) stand on the ledge. Wings: A leading-edge light, B outer band,
// C middle band, D inner band, E trailing shadow, s eye spot. Mount: h light, m body, M stripe,
// n shadow, H head, e eye, k antennae. Rider: r light, R base, t shadow, y eye, w glint,
// S chest, b brow. Lance: L l T.
const FOREWING_UP = [
  '...AAAA.......',
  '..ABBBBA......',
  '.ABBBBBBA.....',
  '.ABBsBBBBA....',
  'ABBsssBBBBA...',
  'ABBBsBBCCCBA..',
  'ABBBBCCCCCCBA.',
  '.EBBCCCCCCCCB.',
  '.EBCCCCDDDCCB.',
  '..ECCCDDDDDCB.',
  '..ECCDDDDDDDC.',
  '...ECDDDDDDDC.',
  '....EDDDDDDD..',
  '.....EDDDDDD..',
  '......EEDDDD..',
  '........EEDD..',
  '.........EDD..',
  '..........DD..',
]
const HINDWING_UP = [
  '..AAA....',
  '.ABBBA...',
  'ABCCCBA..',
  'ACCsCCBA.',
  'ECCCCDDB.',
  '.ECDDDDDA',
  '..EEDDDDD',
  '....EEDDD',
  '......EDD',
]
const FOREWING_DOWN = [
  '...........AA..',
  '........AABBBA.',
  '.....AABBBCCCB.',
  '..AABBBCCCDDDD.',
  '.ABBsBCCCDDDDD.',
  'ABBsssCCDDDDD..',
  'ABBBsCCDDDDE...',
  '.EBBCCDDDEE....',
  '..EEBCDEE......',
  '....EEE........',
]
const MOUNT = [
  '......................k.',
  '.....................k.k',
  '....................k...',
  '...................k....',
  '..hhhhhhhhhhhhhhhhHHH...',
  '.hmmMmmMmmMhhhhmmmHHeH..',
  'hmmMmmMmmMmmmmmmmmHHHH..',
  '.nnnnnnnnnnnnnnnnnnnn...',
  '...n.n.n.......n..n.....',
]
const PLAYER_RIDER = [
  '.r...r...',
  '.rR..rR..',
  '.rRRRRRr.',
  'rRRRRRRRt',
  'rRRRRyyRt',
  'rRRRRywRt',
  'rRRRRRRRt',
  '.tttttttt',
  '..rRRRRt.',
  '..rRSSRt.',
  '..rRSSRRR',
  '..rRRRRt.',
  '..tttttt.',
]
const MOTH_RIDER = [
  'k.....k..',
  '.k...k...',
  '.rRRRRRr.',
  'rRRRRRRRt',
  'rRRRbbbRt',
  'rRRRRyyRt',
  'rRRRRRRRt',
  '.tttttttt',
  '..rRRRRt.',
  '..rRSSRt.',
  '..rRSSRRR',
  '..rRRRRt.',
  '..tttttt.',
]
const LANCE = ['LLLLLLLLT', 'lllllllT.']

export type Frames = readonly [PixelSprite, PixelSprite]

function riderPalette(
  wing: readonly [string, string, string, string, string, string],
  body: Ramp,
  eye: string,
  chest: string,
  mount: readonly [string, string, string, string, string, string, string],
): Record<string, string> {
  return {
    A: wing[0],
    B: wing[1],
    C: wing[2],
    D: wing[3],
    E: wing[4],
    s: wing[5],
    h: mount[0],
    m: mount[1],
    M: mount[2],
    n: mount[3],
    H: mount[4],
    e: mount[5],
    k: mount[6],
    r: body[3],
    R: body[2],
    t: body[1],
    y: eye,
    w: '#ffffff',
    S: chest,
    b: INK,
    L: RAMPS.steel[4],
    l: RAMPS.steel[2],
    T: RAMPS.gold[3],
  }
}

/** [wings up, wings down (the near wing sweeps in front of the mount)], facing right. */
function riderFrames(
  rider: readonly string[],
  palette: Record<string, string>,
): Frames {
  const up = compose(30, 28, [
    [0, 11, HINDWING_UP],
    [3, 1, FOREWING_UP],
    [3, 15, MOUNT],
    [12, 6, rider],
    [20, 15, LANCE],
  ])
  const down = compose(30, 28, [
    [3, 15, MOUNT],
    [0, 18, FOREWING_DOWN],
    [12, 6, rider],
    [20, 15, LANCE],
  ])
  return [pixelSprite(up, palette), pixelSprite(down, palette)]
}

type Wings = readonly [string, string, string, string, string, string]
type MountColours = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
]

/** The wing patterns: the rainbow, the morpho, the monarch and the swallowtail. */
export const WING_SETS = {
  rainbow: [
    RAMPS.pink[4],
    RAMPS.pink[2],
    RAMPS.gold[2],
    RAMPS.teal[2],
    RAMPS.purple[1],
    RAMPS.gold[4],
  ],
  morpho: [
    RAMPS.sky[4],
    RAMPS.sky[2],
    RAMPS.water[3],
    RAMPS.sky[1],
    RAMPS.night[2],
    RAMPS.teal[4],
  ],
  monarch: [
    RAMPS.gold[4],
    RAMPS.rust[3],
    RAMPS.rust[2],
    RAMPS.gold[2],
    RAMPS.night[1],
    RAMPS.cream[4],
  ],
  swallowtail: [
    RAMPS.cream[4],
    RAMPS.gold[3],
    RAMPS.gold[2],
    RAMPS.leaf[3],
    RAMPS.night[2],
    RAMPS.sky[3],
  ],
} as const satisfies Record<string, Wings>
export type WingSet = keyof typeof WING_SETS

function mountOf(ramp: Ramp, accent: string): MountColours {
  return [
    ramp[3],
    RAMPS.night[3],
    accent,
    RAMPS.night[1],
    ramp[2],
    '#ffffff',
    accent,
  ]
}

/** A seat of the Jousting Party: its robot, its butterfly and its HUD colour. */
export type SeatLook = {
  name: string
  body: Ramp
  wings: WingSet
  mount: MountColours
  /** The colour its label, score and cocoon wear. */
  ramp: Ramp
}

export const SEAT_LOOKS: readonly SeatLook[] = [
  {
    name: 'P1',
    body: RAMPS.teal,
    wings: 'rainbow',
    mount: mountOf(RAMPS.purple, RAMPS.gold[3]),
    ramp: RAMPS.teal,
  },
  {
    name: 'P2',
    body: RAMPS.pink,
    wings: 'morpho',
    mount: mountOf(RAMPS.teal, RAMPS.pink[3]),
    ramp: RAMPS.pink,
  },
  {
    name: 'P3',
    body: RAMPS.gold,
    wings: 'monarch',
    mount: mountOf(RAMPS.sky, RAMPS.gold[4]),
    ramp: RAMPS.gold,
  },
  {
    name: 'P4',
    body: RAMPS.leaf,
    wings: 'swallowtail',
    mount: mountOf(RAMPS.pink, RAMPS.leaf[4]),
    ramp: RAMPS.leaf,
  },
]

const frameCache = new Map<string, Frames>()

/** A seat's rider on a butterfly with these wings (built once, then kept). */
export function seatFrames(seat: number, wings?: WingSet): Frames {
  const look = SEAT_LOOKS[seat % SEAT_LOOKS.length]!
  const set = wings ?? look.wings
  const key = `${seat}:${set}`
  let frames = frameCache.get(key)
  if (!frames) {
    frames = riderFrames(
      PLAYER_RIDER,
      riderPalette(
        WING_SETS[set],
        look.body,
        RAMPS.gold[4],
        look.body === RAMPS.gold ? RAMPS.rust[3] : RAMPS.gold[3],
        look.mount,
      ),
    )
    frameCache.set(key, frames)
  }
  return frames
}

const MOTH_MOUNT = [
  RAMPS.night[4],
  RAMPS.night[2],
  RAMPS.steel[1],
  RAMPS.night[0],
  RAMPS.night[3],
  RAMPS.ember[3],
  RAMPS.steel[2],
] as const

/** Moth riders by tier: drifter (red), hunter (violet), shadow (slate with red eye spots). */
export const RIVAL_FRAMES: readonly Frames[] = [
  riderFrames(
    MOTH_RIDER,
    riderPalette(
      [
        RAMPS.rust[4],
        RAMPS.ember[2],
        RAMPS.rust[3],
        RAMPS.ember[1],
        RAMPS.ember[0],
        RAMPS.gold[3],
      ],
      RAMPS.pink,
      RAMPS.ember[2],
      RAMPS.pink[4],
      MOTH_MOUNT,
    ),
  ),
  riderFrames(
    MOTH_RIDER,
    riderPalette(
      [
        RAMPS.purple[4],
        RAMPS.purple[2],
        RAMPS.purple[3],
        RAMPS.purple[1],
        RAMPS.purple[0],
        RAMPS.pink[3],
      ],
      RAMPS.purple,
      RAMPS.ember[2],
      RAMPS.purple[4],
      MOTH_MOUNT,
    ),
  ),
  riderFrames(
    MOTH_RIDER,
    riderPalette(
      [
        RAMPS.steel[3],
        RAMPS.steel[1],
        RAMPS.steel[2],
        RAMPS.night[2],
        RAMPS.night[0],
        RAMPS.ember[2],
      ],
      RAMPS.steel,
      RAMPS.ember[3],
      RAMPS.steel[4],
      MOTH_MOUNT,
    ),
  ),
]

/** The carrier: a riderless dusty moth that whistles in to fetch a cocoon. */
export const CARRIER_FRAMES: Frames = (() => {
  const palette = riderPalette(
    [
      RAMPS.cream[3],
      RAMPS.earth[3],
      RAMPS.cream[2],
      RAMPS.earth[2],
      RAMPS.earth[1],
      RAMPS.sky[3],
    ],
    RAMPS.earth,
    RAMPS.ember[2],
    RAMPS.earth[4],
    [
      RAMPS.cream[3],
      RAMPS.earth[2],
      RAMPS.cream[1],
      RAMPS.earth[0],
      RAMPS.earth[3],
      RAMPS.ember[3],
      RAMPS.earth[3],
    ],
  )
  const up = compose(30, 28, [
    [0, 11, HINDWING_UP],
    [3, 1, FOREWING_UP],
    [3, 15, MOUNT],
  ])
  const down = compose(30, 28, [
    [3, 15, MOUNT],
    [0, 18, FOREWING_DOWN],
  ])
  return [pixelSprite(up, palette), pixelSprite(down, palette)]
})()

/** A little front-view butterfly for the lives box, in a seat's wings. */
export function lifeSprite(wings: Wings): PixelSprite {
  return pixelSprite(
    [
      '.AA...AA.',
      'ABBA.ABBA',
      'ABCCmCCBA',
      '.BCDmDCB.',
      '..DDmDD..',
      '.EDE.EDE.',
      '.EE...EE.',
    ],
    {
      A: wings[0],
      B: wings[1],
      C: wings[2],
      D: wings[3],
      E: wings[4],
      m: RAMPS.night[3],
    },
  )
}
export const LIFE_SPRITE = lifeSprite(WING_SETS.rainbow)

const COCOON_ROWS = [
  '...cc...',
  '..hccd..',
  '.hcCCcd.',
  '.hccccd.',
  'hcCCcccd',
  'hccccccd',
  'hccCCccd',
  '.hccccd.',
  '.hcCCcd.',
  '..cccd..',
  '...dd...',
]
/** The same cocoon with its top half leaning a pixel right (flip for left): a wiggle, not a rotation. */
const COCOON_LEAN_ROWS = COCOON_ROWS.map((row, i) =>
  i < 5 ? `.${row}` : `${row}.`,
)
export function cocoonSprites(ramp: Ramp): readonly [PixelSprite, PixelSprite] {
  const palette = { h: ramp[4], c: ramp[3], C: ramp[2], d: ramp[1] }
  return [
    pixelSprite(COCOON_ROWS, palette),
    pixelSprite(COCOON_LEAN_ROWS, palette),
  ]
}
export const COCOON_SPRITES = cocoonSprites(RAMPS.leaf)
export const COCOON_WARN_SPRITES = cocoonSprites(RAMPS.gold)

// --- the Thundercap --------------------------------------------------------------------------

const STORM_RAMP: Ramp = ['#0a0818', '#1a1433', '#2c2650', '#46427a', '#6e6aa4']
const STORM_FLASH: Ramp = [
  '#1a1433',
  '#3b3a6a',
  '#6a6ea0',
  '#a8b0dc',
  '#e6eaff',
]
/** drawCloud's puffs, so the storm can wear an ink silhouette under them. */
const STORM_PUFFS: readonly (readonly [number, number, number])[] = [
  [-1.1, 0.25, 0.55],
  [-0.45, -0.15, 0.75],
  [0.35, -0.3, 0.85],
  [1.05, 0.15, 0.6],
  [0, 0.35, 0.7],
]

/** A storm cloud: drawCloud's shaded puffs over an ink outline, so it reads as an actor. */
export function stormCloud(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  ramp: Ramp,
) {
  g.fillStyle = INK
  for (const [dx, dy, k] of STORM_PUFFS) {
    const r = size * k
    g.beginPath()
    g.arc(x + dx * size, y + dy * size + r * 0.12, r + 1.5, 0, Math.PI * 2)
    g.fill()
  }
  drawCloud(g, x, y, size, ramp)
}

/** A forked bolt from (x, y) downward: ink, gold and a white core. */
export function drawBolt(
  g: CanvasRenderingContext2D,
  path: readonly (readonly [number, number])[],
) {
  g.save()
  g.lineJoin = 'miter'
  const strokes: [number, string][] = [
    [4, INK],
    [2, RAMPS.gold[3]],
    [1, '#ffffff'],
  ]
  for (const [width, colour] of strokes) {
    g.lineWidth = width
    g.strokeStyle = colour
    g.beginPath()
    path.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)))
    g.stroke()
  }
  g.restore()
}

/**
 * The Thundercap: a scowling storm cloud with one big eye. While it flashes the eye is squeezed
 * shut over a bolt; between flashes the eye opens and looks at its prey (the only time a bonk
 * pops it); as the next flash charges, the eye shuts and the brows spark.
 */
export function drawThundercap(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  phase: 'flash' | 'open' | 'shut',
  tick: number,
  look: { dx: number; dy: number },
  charge = 0,
) {
  const flash = phase === 'flash'
  const cx = Math.round(x)
  const cy = Math.round(y)
  glow(
    g,
    cx,
    cy,
    44,
    flash ? RAMPS.gold[3] : RAMPS.purple[2],
    flash ? 0.5 : 0.28,
  )
  // Rain streaking out of its belly.
  g.fillStyle = rgba(RAMPS.water[3], 0.75)
  for (let i = 0; i < 7; i++) {
    const ry = (tick * 1.5 + i * 11) % 18
    g.fillRect(Math.round(x - 18 + i * 6), Math.round(y + 10 + ry), 1, 3)
  }
  stormCloud(g, x, y, 15, flash ? STORM_FLASH : STORM_RAMP)
  // Angry brows meeting over the one eye.
  g.fillStyle = INK
  for (let i = 0; i < 4; i++) {
    g.fillRect(cx - 12 + i * 2, cy - 10 + i, 2, 2)
    g.fillRect(cx + 10 - i * 2, cy - 10 + i, 2, 2)
  }
  if (phase === 'open') {
    // The open eye: the target.
    glow(g, cx, cy - 1, 16, RAMPS.gold[4], 0.55)
    g.fillStyle = INK
    g.fillRect(cx - 8, cy - 6, 16, 11)
    g.fillRect(cx - 9, cy - 4, 18, 7)
    g.fillStyle = '#ffffff'
    g.fillRect(cx - 7, cy - 5, 14, 9)
    g.fillRect(cx - 8, cy - 3, 16, 5)
    const px = cx + Math.round(Math.max(-3, Math.min(3, look.dx)))
    const py = cy + Math.round(Math.max(-2, Math.min(2, look.dy)))
    g.fillStyle = RAMPS.gold[2]
    g.fillRect(px - 3, py - 3, 6, 6)
    g.fillStyle = INK
    g.fillRect(px - 1, py - 2, 3, 4)
    g.fillStyle = '#ffffff'
    g.fillRect(px - 2, py - 2, 1, 1)
  } else {
    // Squeezed shut, lashes down; sparks on the brows as the flash charges.
    g.fillStyle = INK
    g.fillRect(cx - 8, cy - 1, 16, 2)
    for (let i = -6; i <= 6; i += 4) g.fillRect(cx + i, cy + 1, 1, 2)
    if (!flash && charge > 0.5 && Math.floor(tick / 3) % 2 === 0) {
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(cx - 13, cy - 11, 2, 1)
      g.fillRect(cx + 11, cy - 11, 2, 1)
      g.fillRect(cx - 1, cy - 14, 2, 2)
    }
  }
  // A scowl under the eye.
  g.fillStyle = INK
  g.fillRect(cx - 4, cy + 7, 8, 1)
  g.fillRect(cx - 5, cy + 8, 1, 1)
  g.fillRect(cx + 4, cy + 8, 1, 1)
  if (flash) {
    glow(g, cx - 1, cy + 22, 22, RAMPS.gold[4], 0.7)
    drawBolt(g, [
      [x, y + 11],
      [x - 4, y + 19],
      [x + 2, y + 19],
      [x - 3, y + 30],
    ])
  }
}

// --- the Pond Frog -----------------------------------------------------------------------------

const FROG = RAMPS.leaf

/** Bubbles rising where the frog lurks: the first tell. */
export function drawFrogBubbles(
  g: CanvasRenderingContext2D,
  x: number,
  pondY: number,
  t: number,
) {
  for (let i = 0; i < 4; i++) {
    const age = (t * 0.6 + i * 9) % 30
    const bx = Math.round(x + Math.sin(i * 2.1 + t / 7) * 7)
    const by = Math.round(pondY + 8 - age * 0.45)
    const r = 1 + (i % 2)
    g.fillStyle = INK
    g.fillRect(bx - r - 1, by - r, r * 2 + 2, r * 2)
    g.fillRect(bx - r, by - r - 1, r * 2, r * 2 + 2)
    g.fillStyle = RAMPS.water[4]
    g.fillRect(bx - r, by - r, r * 2, r * 2)
    g.fillStyle = '#ffffff'
    g.fillRect(bx - r, by - r, 1, 1)
  }
}

/**
 * The frog's head: `rise` 0..1 how far it has surfaced (0 just the eyes' tops, 1 the eyes and
 * the top of its head), looking toward `lookX`. With `mouth` it opens its wide mouth.
 */
export function drawFrog(
  g: CanvasRenderingContext2D,
  x: number,
  pondY: number,
  rise: number,
  lookX: number,
  mouth = false,
) {
  const top = Math.round(pondY + 6 - rise * 14)
  const cx = Math.round(x)
  // The head: a broad dome breaking the water.
  if (rise > 0.5) {
    g.fillStyle = INK
    g.beginPath()
    g.ellipse(cx, top + 12, 19, 10, 0, Math.PI, 0)
    g.fill()
    g.fillStyle = FROG[2]
    g.beginPath()
    g.ellipse(cx, top + 12, 18, 9, 0, Math.PI, 0)
    g.fill()
    g.fillStyle = FROG[3]
    g.beginPath()
    g.ellipse(cx - 3, top + 11, 12, 5, 0, Math.PI, 0)
    g.fill()
    if (mouth) {
      g.fillStyle = INK
      g.fillRect(cx - 10, top + 9, 20, 3)
      g.fillStyle = RAMPS.pink[1]
      g.fillRect(cx - 8, top + 10, 16, 2)
    } else {
      g.fillStyle = FROG[0]
      g.fillRect(cx - 9, top + 10, 18, 1)
    }
  }
  // Two eye domes with pupils that follow the prey.
  const look = Math.max(-1, Math.min(1, (lookX - x) / 30))
  for (const side of [-1, 1]) {
    const ex = cx + side * 9
    shadedOrb(g, ex, top + 3, 5, FROG)
    g.fillStyle = '#ffffff'
    g.fillRect(ex - 3, top + 1, 6, 4)
    g.fillStyle = INK
    g.fillRect(Math.round(ex - 1 + look * 2), top + 1, 2, 4)
    // A heavy lid: the frog is all business.
    g.fillStyle = FROG[1]
    g.fillRect(ex - 4, top - 1, 8, 2)
  }
  // Water lapping over its chin.
  g.fillStyle = RAMPS.water[3]
  g.fillRect(cx - 21, pondY, 42, 1)
  g.fillStyle = RAMPS.water[4]
  g.fillRect(cx - 16, pondY + 1, 6, 1)
  g.fillRect(cx + 9, pondY + 1, 7, 1)
}

/** The tongue from the frog's mouth to (tx, ty), with its sticky round tip. */
export function drawTongue(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  tx: number,
  ty: number,
) {
  g.save()
  g.lineCap = 'round'
  const strokes: [number, string][] = [
    [6, INK],
    [4, RAMPS.pink[2]],
    [1, RAMPS.pink[3]],
  ]
  for (const [width, colour] of strokes) {
    g.lineWidth = width
    g.strokeStyle = colour
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(tx, ty)
    g.stroke()
  }
  g.restore()
  shadedOrb(g, tx, ty, 4, RAMPS.pink)
}
