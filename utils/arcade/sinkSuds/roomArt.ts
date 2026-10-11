// /utils/arcade/sinkSuds/roomArt.ts
//
// Sink Suds' room art (conductor kr-arcade/t-044): the bathroom, the Wash Cycle 1 pests (scum
// slug, loofah, mini-brush), rubber ducks, Dish Stack's plates, shampoo slicks, the drying
// rack's shadows, the power-ups and soap bars that float up out of the drain, and the Soap Shop.

import { drawText } from '../font'
import {
  INK,
  RAMPS,
  bevel,
  cachedLayer,
  drawSprite,
  hudPanel,
  mix,
  pixelSprite,
  rgba,
  shadedOrb,
} from '../snes'
import type { PixelSprite } from '../snes'
import { W, H } from './basins'
import type { BasinDef } from './basins'
import { propClear } from './art'
import type { Box } from './rooms'
import type { PowerKind, ShopItem } from './shop'

// --- pests --------------------------------------------------------------------------------------

const SLUG_PALETTE = {
  S: mix(RAMPS.leaf[2], RAMPS.steel[2], 0.45),
  s: mix(RAMPS.leaf[1], RAMPS.steel[1], 0.45),
  h: mix(RAMPS.leaf[3], RAMPS.cream[3], 0.4),
  k: INK,
  w: '#ffffff',
}
export const SLUG_SPRITES = [
  pixelSprite(
    [
      '..k.....k...',
      '..h.....h...',
      '...h...h....',
      '..SSSSSSSS..',
      '.SsSwkSwkSs.',
      'SShSSSSSSSSs',
      '.ssssssssss.',
    ],
    SLUG_PALETTE,
  ),
  pixelSprite(
    [
      '...k.....k..',
      '...h.....h..',
      '...h....h...',
      '..SSSSSSSS..',
      '.SsSwkSwkSs.',
      'SShSSSSSSSs.',
      'sssssssssss.',
    ],
    SLUG_PALETTE,
  ),
] as const

export const LOOFAH_SPRITE = pixelSprite(
  [
    '.....cCcCcC.......',
    '...cCcCcCcCcCc....',
    '..CcCcCcCcCcCcC...',
    '.cCcwwCcCcwwCcCc..',
    '.CcCwkcCcCwkcCcC..',
    'cCcCcCcCcCcCcCcCc.',
    'CcCcCcCmmmCcCcCcC.',
    'cCcCcCcCcCcCcCcCc.',
    '.CcCcCcCcCcCcCcC..',
    '.cCcCcCcCcCcCcCc..',
    '..dCdCdCdCdCdCd...',
    '....ddddddddd.....',
  ],
  {
    C: RAMPS.cream[3],
    c: RAMPS.cream[2],
    d: RAMPS.cream[1],
    w: '#ffffff',
    k: INK,
    m: RAMPS.rust[2],
  },
)

export const MINIBRUSH_SPRITE = pixelSprite(
  ['.hhhhhhhh.', 'hTkTTTTkTt', 'tTTTTTTTtt', '.gGgGgGgG.', '.d.d.d.d..'],
  {
    h: RAMPS.teal[4],
    T: RAMPS.teal[2],
    t: RAMPS.teal[1],
    k: INK,
    g: RAMPS.gold[2],
    G: RAMPS.gold[3],
    d: RAMPS.gold[1],
  },
)

export const DUCK_SPRITE = pixelSprite(
  [
    '...YYY.....',
    '..YhYYY....',
    '..YkYYYOO..',
    '..YYYYYOo..',
    '...YYY.....',
    'YYYhhYYYY..',
    'YyYYYYYYYY.',
    '.yYYYYYYy..',
    '..yyyyyy...',
  ],
  {
    Y: RAMPS.gold[3],
    y: RAMPS.gold[2],
    h: RAMPS.gold[4],
    k: INK,
    O: RAMPS.rust[3],
    o: RAMPS.rust[2],
  },
)

// --- props in the water -------------------------------------------------------------------------

/** A floating rubber duck: a bumper, or one of the Round-up's ducks (penned ones wear a ribbon). */
export function renderDuck(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  tick: number,
  penned = false,
  flip = false,
) {
  const bob = Math.round(Math.sin(tick / 14 + x) * 1)
  g.fillStyle = rgba(RAMPS.water[4], 0.5)
  g.beginPath()
  g.ellipse(x, y + 10, 14, 3, 0, 0, Math.PI * 2)
  g.fill()
  drawSprite(g, DUCK_SPRITE, x, y + bob, { flipX: flip, scale: 2 })
  if (penned) {
    // A pink ribbon round its neck.
    g.fillStyle = RAMPS.pink[3]
    g.fillRect(Math.round(x) - 5, Math.round(y) - 3 + bob, 8, 2)
  }
}

/** One of Dish Stack's plates, its grime fading as it is scrubbed (dirt 1..0). */
export function renderPlate(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  dirt: number,
  seed: number,
) {
  g.fillStyle = rgba(INK, 0.25)
  g.beginPath()
  g.ellipse(x + 3, y + 4, r, r * 0.9, 0, 0, Math.PI * 2)
  g.fill()
  shadedOrb(g, x, y, r, RAMPS.cream, { glint: false })
  g.fillStyle = RAMPS.cream[4]
  g.beginPath()
  g.arc(x - 1, y - 1, r * 0.66, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = RAMPS.sky[3]
  g.lineWidth = 2
  g.beginPath()
  g.arc(x, y, r * 0.8, 0, Math.PI * 2)
  g.stroke()
  g.lineWidth = 1
  if (dirt <= 0) {
    g.fillStyle = '#ffffff'
    g.fillRect(Math.round(x - r * 0.4), Math.round(y - r * 0.5), 3, 2)
    return
  }
  // Grime blotches, fewer the cleaner it gets.
  const spots = Math.ceil(dirt * 7)
  for (let i = 0; i < spots; i++) {
    const h = ((seed + 1) * 2654435761 * (i + 3)) >>> 0
    const a = ((h % 628) / 100) * 1
    const d = ((h >> 10) % 100) / 100
    g.fillStyle = rgba(i % 2 ? '#6b5a34' : '#7a4a20', 0.75)
    g.beginPath()
    g.arc(
      x + Math.cos(a) * d * r * 0.7,
      y + Math.sin(a) * d * r * 0.7,
      2 + ((h >> 4) % 3),
      0,
      Math.PI * 2,
    )
    g.fill()
  }
}

/** A shampoo slick: a glossy pink fast lane with arrows. */
export function renderSlick(g: CanvasRenderingContext2D, s: Box, tick: number) {
  g.fillStyle = rgba(RAMPS.pink[3], 0.35)
  g.fillRect(s.x, s.y, s.w, s.h)
  g.fillStyle = rgba(RAMPS.pink[4], 0.6)
  g.fillRect(s.x, s.y, s.w, 1)
  g.fillStyle = rgba('#ffffff', 0.55)
  for (let x = s.x + ((tick / 2) % 20); x < s.x + s.w - 6; x += 20) {
    g.fillRect(Math.round(x), s.y + s.h / 2 - 1, 6, 2)
    g.fillRect(Math.round(x) + 6, s.y + s.h / 2 - 2, 1, 4)
  }
}

/** The drying rack overhead: its bars' shadows hide whatever lies under them. */
export function renderRack(
  g: CanvasRenderingContext2D,
  shadows: readonly Box[],
) {
  for (const s of shadows) {
    g.fillStyle = rgba(RAMPS.night[0], 0.82)
    g.fillRect(s.x, s.y, s.w, s.h)
    g.fillStyle = rgba(RAMPS.night[0], 0.4)
    g.fillRect(s.x - 2, s.y, 2, s.h)
    g.fillRect(s.x + s.w, s.y, 2, s.h)
  }
  // The rack's top rail in the foreground.
  const x0 = shadows[0]!.x - 10
  const x1 =
    shadows[shadows.length - 1]!.x + shadows[shadows.length - 1]!.w + 10
  bevel(g, x0, shadows[0]!.y - 8, x1 - x0, 6, RAMPS.steel, { depth: 1 })
}

/** A blob of scum slug trail. */
export function renderTrail(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  life: number,
) {
  g.fillStyle = rgba(
    mix(RAMPS.leaf[3], RAMPS.cream[3], 0.4),
    Math.min(0.55, life / 200),
  )
  g.beginPath()
  g.ellipse(x, y, 5, 3.5, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = rgba('#ffffff', Math.min(0.5, life / 300))
  g.fillRect(Math.round(x) - 2, Math.round(y) - 1, 2, 1)
}

// --- power-ups ----------------------------------------------------------------------------------

const ICONS: Record<PowerKind | 'soap', PixelSprite> = {
  duck: pixelSprite(['.YY....', 'YkYO...', '.YY....', 'YYYYYY.', '.yyyyy.'], {
    Y: RAMPS.gold[3],
    y: RAMPS.gold[2],
    k: INK,
    O: RAMPS.rust[3],
  }),
  lemon: pixelSprite(['..YYY..', '.YyYyY.', 'YyWyWyY', '.YyYyY.', '..YYY..'], {
    Y: RAMPS.gold[3],
    y: RAMPS.gold[4],
    W: '#ffffff',
  }),
  supersuds: pixelSprite(
    ['...W...', '..WWW..', 'WWWWWWW', '.WWWWW.', '.WW.WW.'],
    {
      W: RAMPS.sky[4],
    },
  ),
  squeegee: pixelSprite(
    ['KKKKKKK', 'RRRRRRR', '...B...', '...B...', '...B...'],
    {
      K: INK,
      R: RAMPS.ember[2],
      B: RAMPS.steel[3],
    },
  ),
  bathbomb: pixelSprite(['.PPPP.', 'PpPPWP', 'PPpPPP', 'PPPpPP', '.PPPP.'], {
    P: RAMPS.pink[3],
    p: RAMPS.purple[3],
    W: '#ffffff',
  }),
  magnet: pixelSprite(['RR.RR', 'RR.RR', 'RR.RR', 'RRRRR', '.RRR.'], {
    R: RAMPS.ember[2],
  }),
  soap: pixelSprite(['.PPPPPP.', 'PWWPPPPp', 'PPPPPPPp', '.pppppp.'], {
    P: RAMPS.pink[3],
    p: RAMPS.pink[1],
    W: '#ffffff',
  }),
}

/** A power-up or a soap bar floating up out of the drain, in its own little bubble. */
export function renderFloat(
  g: CanvasRenderingContext2D,
  kind: PowerKind | 'soap',
  x: number,
  y: number,
  tick: number,
  life: number,
) {
  if (life < 120 && Math.floor(tick / 5) % 2 === 0) return
  const bob = Math.sin(tick / 12 + x) * 1.5
  g.fillStyle = rgba(kind === 'soap' ? RAMPS.pink[4] : RAMPS.gold[4], 0.3)
  g.beginPath()
  g.arc(x, y + bob, 10, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = kind === 'soap' ? RAMPS.pink[3] : RAMPS.gold[3]
  g.beginPath()
  g.arc(x, y + bob, 10, 0, Math.PI * 2)
  g.stroke()
  drawSprite(g, ICONS[kind], x, y + bob)
  g.fillStyle = '#ffffff'
  g.fillRect(Math.round(x - 6), Math.round(y + bob - 6), 2, 2)
}

export function renderIcon(
  g: CanvasRenderingContext2D,
  kind: PowerKind | 'soap',
  x: number,
  y: number,
  scale = 1,
) {
  drawSprite(g, ICONS[kind], x, y, { scale })
}

/** The bodyguard duck circling the bubble. */
export function renderGuard(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  tick: number,
) {
  drawSprite(g, DUCK_SPRITE, x, y + Math.sin(tick / 6), {
    flipX: Math.sin(tick / 20) < 0,
  })
}

// --- the bathroom -------------------------------------------------------------------------------

const BOTTLE = pixelSprite(
  [
    '..ww..',
    '..ww..',
    '.TTTT.',
    'TttttT',
    'TwwwwT',
    'TwpwwT',
    'TwwwwT',
    'TttttT',
    '.TTTT.',
  ],
  {
    w: RAMPS.cream[4],
    T: RAMPS.purple[2],
    t: RAMPS.purple[3],
    p: RAMPS.pink[2],
  },
)
const CUP = pixelSprite(
  ['.G.P...', '.G.P.Y.', '.G.P.Y.', 'TTTTTTT', 'TtttttT', 'TtttttT', '.TTTTT.'],
  {
    G: RAMPS.leaf[3],
    P: RAMPS.pink[3],
    Y: RAMPS.gold[3],
    T: RAMPS.teal[2],
    t: RAMPS.teal[3],
  },
)

/** Bathroom tiles, a towel rail and shelf clutter, kept clear of this basin's rim. */
export function renderBathroom(g: CanvasRenderingContext2D, b: BasinDef) {
  cachedLayer(g, `sink-suds-bath-${b.id}`, W, H, (k) => {
    k.fillStyle = RAMPS.teal[0]
    k.fillRect(0, 0, W, H)
    const T = 16
    for (let y = 0; y < H; y += T) {
      for (let x = 0; x < W; x += T) {
        const light = (x / T + y / T) % 2 === 0
        const ramp = light
          ? ([
              RAMPS.teal[1],
              RAMPS.teal[2],
              mix(RAMPS.teal[2], RAMPS.cream[3], 0.4),
              mix(RAMPS.teal[3], '#ffffff', 0.3),
              '#ffffff',
            ] as const)
          : ([
              RAMPS.teal[0],
              RAMPS.teal[1],
              RAMPS.teal[2],
              RAMPS.teal[3],
              RAMPS.teal[4],
            ] as const)
        bevel(k, x + 1, y + 1, T - 2, T - 2, ramp, { depth: 1, outline: null })
      }
    }
    // A wainscot band low on the wall.
    k.fillStyle = RAMPS.cream[2]
    k.fillRect(0, H - 54, W, 4)
    k.fillStyle = RAMPS.cream[1]
    k.fillRect(0, H - 50, W, 2)
    // The towel rail with a striped towel.
    bevel(k, 120, 20, 180, 4, RAMPS.gold, { depth: 1 })
    for (let i = 0; i < 6; i++) {
      k.fillStyle = i % 2 ? RAMPS.pink[2] : RAMPS.pink[3]
      k.fillRect(150, 24 + i * 4, 60, 4)
    }
    k.fillStyle = RAMPS.pink[1]
    k.fillRect(150, 48, 60, 2)
    const props: Array<{ s: PixelSprite; x: number; y: number }> = [
      { s: BOTTLE, x: 30, y: 74 },
      { s: CUP, x: W - 30, y: 76 },
      { s: DUCK_SPRITE, x: 30, y: H - 28 },
      { s: BOTTLE, x: W - 30, y: H - 28 },
    ]
    for (const p of props)
      if (propClear(b, p.x, p.y))
        drawSprite(k, p.s, p.x, p.y, { anchor: 'feet', scale: 2 })
  })
}

// --- the Soap Shop ------------------------------------------------------------------------------

export type ShopView = {
  items: readonly ShopItem[]
  cursor: number
  bars: number
  owned: (item: ShopItem) => boolean
  wearing: (item: ShopItem) => boolean
  message: string
  golden: number
  goldenTotal: number
  tick: number
}

/** The Soap Shop: a shelf of upgrades bought with soap bars, between rooms. */
export function renderShop(g: CanvasRenderingContext2D, v: ShopView) {
  g.fillStyle = rgba(INK, 0.78)
  g.fillRect(0, 0, W, H)
  hudPanel(g, 30, 18, W - 60, H - 36, RAMPS.pink)
  drawText(g, 'THE SOAP SHOP', W / 2, 30, {
    scale: 2,
    align: 'center',
    color: RAMPS.gold[4],
    outline: INK,
  })
  renderIcon(g, 'soap', 56, 66, 2)
  drawText(g, `${v.bars} SOAP BARS`, 74, 62, {
    color: RAMPS.cream[4],
    outline: INK,
  })
  drawText(g, `GOLDEN SOAP ${v.golden}/${v.goldenTotal}`, W - 50, 62, {
    align: 'right',
    color: RAMPS.gold[3],
    outline: INK,
  })
  v.items.forEach((item, i) => {
    const y = 84 + i * 21
    const on = i === v.cursor
    if (on) {
      g.fillStyle = rgba(RAMPS.gold[3], 0.25 + 0.1 * Math.sin(v.tick / 6))
      g.fillRect(44, y - 4, W - 88, 17)
      drawText(g, '>', 50, y, { color: RAMPS.gold[4], outline: INK })
    }
    const owned = v.owned(item)
    const colour = owned
      ? RAMPS.steel[3]
      : item.price > v.bars
        ? RAMPS.pink[2]
        : '#ffffff'
    drawText(g, item.name, 62, y, { color: colour, outline: INK })
    const tag = v.wearing(item)
      ? 'WEARING'
      : owned
        ? 'OWNED'
        : item.price
          ? `${item.price}`
          : ''
    drawText(g, tag, W - 74, y, {
      align: 'right',
      color: owned ? RAMPS.leaf[3] : RAMPS.gold[3],
      outline: INK,
    })
    if (item.price && !owned) renderIcon(g, 'soap', W - 62, y + 3)
  })
  const item = v.items[v.cursor]
  const foot = H - 52
  drawText(g, v.message || item?.blurb || '', W / 2, foot, {
    align: 'center',
    color: RAMPS.teal[4],
    outline: INK,
  })
  drawText(g, 'A BUY   B LEAVE', W / 2, foot + 16, {
    align: 'center',
    color: RAMPS.cream[3],
    outline: INK,
  })
}
