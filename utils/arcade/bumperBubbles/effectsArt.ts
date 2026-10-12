// /utils/arcade/bumperBubbles/effectsArt.ts
//
// The art for slice 2's systems (conductor kr-arcade/t-060): water channels, the special
// bubbles' icons and what they unleash (wave, bolt, flames, ice), the grumps' jets and beams,
// the hidden-condition items, the pantry door and its recipe card, and THE BIG CORK. All
// cosmetic; nothing here touches the game's rng.

import { INK, RAMPS, drawSprite, glow, pixelSprite, rgba } from '../snes'
import type { PixelSprite, Ramp } from '../snes'
import { CORK_RAMP, GRUMP_FRAMES } from './art'
import type { Boss } from './bosses'
import type { ItemId } from './items'
import { ITEMS } from './items'
import type { Bolt, Fire, Ice, Wave } from './specials'
import type { Hazard } from './grumps'
import { COLS, ROWS, TILE, TOP, WATER } from './tower'
import type { Floor, SpecialKind } from './tower'

// --- water ---------------------------------------------------------------------------------------

/** Water channels and pools: a translucent body, a rippling surface, streaks along the flow. */
export function paintWater(
  g: CanvasRenderingContext2D,
  f: Floor,
  tick: number,
) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const w = f.water[r * COLS + c]!
      if (w === WATER.none) continue
      const x = c * TILE
      const y = TOP + r * TILE
      g.fillStyle = rgba(RAMPS.water[2], 0.38)
      g.fillRect(x, y, TILE, TILE)
      const above = r > 0 ? f.water[(r - 1) * COLS + c]! : WATER.none
      if (above === WATER.none) {
        // The surface, rippling.
        const lift = Math.round(Math.sin(tick / 12 + c * 0.9))
        g.fillStyle = rgba(RAMPS.water[4], 0.75)
        g.fillRect(x, y + 1 + lift, TILE, 1)
        g.fillStyle = rgba(RAMPS.water[3], 0.5)
        g.fillRect(x, y + 2 + lift, TILE, 1)
      }
      if (w !== WATER.still) {
        const dir = w === WATER.right ? 1 : -1
        const phase = (((tick * 1.2 * dir + c * 5) % TILE) + TILE) % TILE
        g.fillStyle = rgba('#ffffff', 0.35)
        g.fillRect(x + phase, y + 4 + (r % 2), 3, 1)
      }
    }
  }
}

// --- special bubbles -----------------------------------------------------------------------------

const ICON_PALETTE = {
  b: RAMPS.water[2],
  B: RAMPS.water[4],
  y: RAMPS.gold[3],
  Y: '#ffffff',
  r: RAMPS.ember[2],
  R: RAMPS.ember[3],
  g: RAMPS.leaf[2],
}

/** The icon inside a special bubble: a drop, a bolt or a pepper. */
export const SPECIAL_ICONS: Record<SpecialKind, PixelSprite> = {
  splash: pixelSprite(
    ['..B..', '.bBb.', 'bbbBb', 'bbbbb', '.bbb.'],
    ICON_PALETTE,
  ),
  zap: pixelSprite(
    ['...yY', '..yy.', '.yyyy', '..yy.', '.yy..', 'Yy...'],
    ICON_PALETTE,
  ),
  toasty: pixelSprite(
    ['...g.', '..g..', '.rRr.', 'rrRr.', 'rrr..', '.r...'],
    ICON_PALETTE,
  ),
}

/** The film tint for each special bubble. */
export const SPECIAL_TINT: Record<SpecialKind, string> = {
  splash: RAMPS.water[3],
  zap: RAMPS.gold[3],
  toasty: RAMPS.ember[3],
}

export function paintWave(g: CanvasRenderingContext2D, w: Wave, tick: number) {
  w.trail.forEach((p, i) => {
    const r = 6 - i * 0.25
    g.fillStyle = rgba(RAMPS.water[2], 0.7 - i * 0.03)
    g.beginPath()
    g.arc(p.x, p.y - 5, Math.max(2, r), 0, Math.PI * 2)
    g.fill()
  })
  g.fillStyle = rgba(RAMPS.water[4], 0.9)
  g.beginPath()
  g.arc(w.x, w.y - 7, 7, Math.PI, 0)
  g.fill()
  // The crest, curling the way it runs, with spray.
  g.fillStyle = '#ffffff'
  g.fillRect(Math.round(w.x + w.dir * 3), Math.round(w.y - 13), 3, 2)
  if (tick % 6 < 3)
    g.fillRect(Math.round(w.x + w.dir * 7), Math.round(w.y - 15), 1, 1)
  for (const gr of w.carried) {
    drawSprite(g, GRUMP_FRAMES[gr.kind].walk[0], w.x, w.y - 6, {
      flipY: tick % 16 < 8,
    })
  }
}

export function paintBolt(g: CanvasRenderingContext2D, b: Bolt, tick: number) {
  glow(g, b.x, b.y, 18, RAMPS.gold[3], 0.6)
  g.strokeStyle = RAMPS.gold[4]
  g.lineWidth = 2
  g.beginPath()
  let x = b.x - b.dir * 24
  g.moveTo(x, b.y)
  for (let i = 0; i < 6; i++) {
    x += b.dir * 4
    g.lineTo(x, b.y + ((i + (tick >> 1)) % 2 ? -3 : 3))
  }
  g.stroke()
  g.fillStyle = '#ffffff'
  g.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 3, 3)
}

export function paintFire(
  g: CanvasRenderingContext2D,
  fire: Fire,
  tick: number,
) {
  const fade = fire.t > 260 ? (300 - fire.t) / 40 : 1
  for (let x = fire.left; x <= fire.right; x += 4) {
    const h = 5 + ((x * 7 + tick * 3) % 6)
    g.fillStyle = rgba(RAMPS.ember[2], 0.85 * fade)
    g.fillRect(Math.round(x), Math.round(fire.y - h), 3, h)
    g.fillStyle = rgba(RAMPS.ember[4], 0.9 * fade)
    g.fillRect(Math.round(x) + 1, Math.round(fire.y - h + 2), 1, h - 3)
  }
  glow(
    g,
    (fire.left + fire.right) / 2,
    fire.y - 4,
    (fire.right - fire.left) / 2 + 8,
    RAMPS.ember[3],
    0.25 * fade,
  )
}

export function paintIce(g: CanvasRenderingContext2D, ice: Ice) {
  const x = Math.round(ice.x) - 8
  const y = Math.round(ice.y) - 15
  g.fillStyle = INK
  g.fillRect(x - 1, y - 1, 18, 17)
  g.fillStyle = '#9fdcf5'
  g.fillRect(x, y, 16, 15)
  drawSprite(g, GRUMP_FRAMES[ice.grump.kind].walk[0], x + 8, y + 8, {
    alpha: 0.7,
  })
  g.fillStyle = rgba('#ffffff', 0.55)
  g.fillRect(x, y, 16, 15)
  g.fillStyle = '#ffffff'
  g.fillRect(x + 1, y + 1, 6, 1)
  g.fillRect(x + 1, y + 1, 1, 5)
}

export function paintHazard(
  g: CanvasRenderingContext2D,
  h: Hazard,
  tick: number,
) {
  if (h.kind === 'jet') {
    g.fillStyle = INK
    g.fillRect(Math.round(h.x) - 4, Math.round(h.y) - 2, 8, 5)
    g.fillStyle = RAMPS.water[3]
    g.fillRect(Math.round(h.x) - 3, Math.round(h.y) - 1, 6, 3)
    g.fillStyle = '#ffffff'
    g.fillRect(Math.round(h.x) + (h.vx > 0 ? 1 : -2), Math.round(h.y) - 1, 2, 1)
    return
  }
  const flick = tick % 4 < 2 ? 1 : 0.7
  glow(
    g,
    (h.x0 + h.x1) / 2,
    h.y,
    (h.x1 - h.x0) / 2 + 6,
    RAMPS.purple[3],
    0.35 * flick,
  )
  g.fillStyle = rgba(RAMPS.purple[3], 0.8 * flick)
  g.fillRect(Math.round(h.x0), Math.round(h.y) - 2, Math.round(h.x1 - h.x0), 5)
  g.fillStyle = rgba('#ffffff', flick)
  g.fillRect(Math.round(h.x0), Math.round(h.y), Math.round(h.x1 - h.x0), 1)
}

// --- items, the door, the card -------------------------------------------------------------------

const ITEM_ROWS: Record<ItemId, string[]> = {
  shoes: [
    '..........',
    '..aa......',
    '..ab......',
    '..abb.....',
    '.abbbbb...',
    'abbbccbbb.',
    'kkkkkkkkk.',
  ],
  sugar: [
    '..wwwwww..',
    '.wcccccw..',
    'wccccccww.',
    'wcccccwcw.',
    'wcccccwcw.',
    'wcccccww..',
    '.wwwwww...',
  ],
  chew: ['abbbbbbba.', 'bcwwwwwcb.', 'bcwkkkwcb.', 'bcwwwwwcb.', 'abbbbbbba.'],
  umbrella: [
    '...bbbb...',
    '.bbccbbbb.',
    'bbccbbbbbb',
    'a.a.ka.a.a',
    '....k.....',
    '....k.....',
    '..k.k.....',
    '...k......',
  ],
  party: [
    'w.....c...',
    '..c.w...w.',
    '.w..ab....',
    '...abb..c.',
    '..abbb....',
    '.abbb.....',
    'abba......',
  ],
  star: [
    '....c.....',
    '....c.....',
    '..ccccc...',
    'cccbbbccc.',
    '..cbbbc...',
    '..cc.cc...',
    '.cc...cc..',
  ],
  lamp: [
    '...kk.....',
    '..kwwk....',
    '.kwccwk...',
    '.kccccw...',
    '.kbccbk...',
    '..kbbk....',
    '.kkkkkk...',
  ],
  necklace: [
    'a.......a.',
    '.a.....a..',
    '..a...a...',
    '...aca....',
    '...cwc....',
    '....c.....',
  ],
  clock: [
    '..kkkkk...',
    '.kwwwwwk..',
    'kwwwkwwwk.',
    'kwwwkkwwk.',
    'kwwwwwwwk.',
    '.kwwwwwk..',
    '..kkkkk...',
  ],
  map: [
    'cccccccc..',
    'cbbcccbc..',
    'ccbcccbb..',
    'cccbbccc..',
    'cccccbcc..',
    'cckcccbc..',
    'cccccccc..',
  ],
}

export const ITEM_SPRITES = Object.fromEntries(
  (Object.keys(ITEM_ROWS) as ItemId[]).map((id) => {
    const ramp: Ramp = ITEMS[id].ramp
    return [
      id,
      pixelSprite(ITEM_ROWS[id], {
        a: ramp[1],
        b: ramp[2],
        c: ramp[3],
        w: '#ffffff',
        k: INK,
      }),
    ]
  }),
) as Record<ItemId, PixelSprite>

export const DOOR_SPRITE = pixelSprite(
  [
    '..dddddddd..',
    '.dwwwwwwwwd.',
    'dwbbbbbbbbwd',
    'dwbccbbccbwd',
    'dwbccbbccbwd',
    'dwbbbbbbbbwd',
    'dwbbbbbbbbwd',
    'dwbbbbbbgbwd',
    'dwbbbbbbbbwd',
    'dwbccbbccbwd',
    'dwbccbbccbwd',
    'dwbbbbbbbbwd',
    'dwbbbbbbbbwd',
    'dddddddddddd',
  ],
  {
    d: RAMPS.earth[0],
    w: RAMPS.earth[3],
    b: RAMPS.earth[2],
    c: RAMPS.earth[1],
    g: RAMPS.gold[3],
  },
)

export const CARD_SPRITE = pixelSprite(
  [
    'wwwwwwwwwww',
    'wppppppppkw',
    'wwwwwwwwwww',
    'wkkkk.kkk.w',
    'wkk.kkkk..w',
    'wkkkkk.kk.w',
    'wwwwwwwwwww',
  ],
  { w: RAMPS.cream[3], p: RAMPS.pink[2], k: RAMPS.earth[1] },
)

// --- THE BIG CORK --------------------------------------------------------------------------------

const BIG_CORK = pixelSprite(
  [
    '.......LLLLLLLLLL.......',
    '.....LLHHHHHHHHHHLL.....',
    '....LHBBBBBBBBBBBBHL....',
    '...LBBdBBBBBdBBBBBBBb...',
    '...LBBBBBBBBBBBBBdBBb...',
    '..LBBBBBdBBBBBBBBBBBBb..',
    '..LBkkkkBBBBBBBBkkkkBb..',
    '..LBBkwwkBBBBBBkwwkBBb..',
    '..LBBkwkkBBBBBBkkwkBBb..',
    '..LBBBkkBBBBBBBBkkBBBb..',
    '..LBBBBBBBBdBBBBBBBBBb..',
    '..LBBBBBBBBBBBBBBBBBBb..',
    '..LBBBkkkkkkkkkkkkBBBb..',
    '..LBBkwwkwwkwwkwwkkBBb..',
    '..LBBBkkkkkkkkkkkkBBBb..',
    '..LBBdBBBBBBBBBBBBBBBb..',
    '..LBBBBBBBBBBBBBBdBBBb..',
    '...bBBBBBdBBBBBBBBBBb...',
    '...rrrrrrrrrrrrrrrrrr...',
    '...bBBBBBBBBBBBBBBBBb...',
    '....bbbbbbbbbbbbbbbb....',
  ],
  {
    d: CORK_RAMP[1],
    b: CORK_RAMP[1],
    B: CORK_RAMP[2],
    L: CORK_RAMP[3],
    H: CORK_RAMP[4],
    r: RAMPS.ember[1],
    k: INK,
    w: '#ffffff',
  },
)

export function paintBoss(g: CanvasRenderingContext2D, b: Boss, tick: number) {
  if (b.state === 'done') return
  if (b.state === 'popping') {
    // Shaking, then gone in a fizz.
    const shake = (tick % 4) - 2
    if (b.t < 60)
      drawSprite(g, BIG_CORK, b.x + shake, b.y, { alpha: 1 - b.t / 90 })
    glow(g, b.x, b.y, 30 + b.t / 2, RAMPS.gold[3], 0.5)
    return
  }
  if (b.hurt > 0 && Math.floor(tick / 3) % 2) return
  const creak = b.state === 'creak' ? (tick % 4 < 2 ? -1 : 1) : 0
  if (b.phase === 3)
    glow(g, b.x, b.y, 26, RAMPS.teal[3], 0.25 + 0.1 * Math.sin(tick / 4))
  drawSprite(g, BIG_CORK, b.x + creak, b.y, { flipX: b.vx < 0 })
  if (b.state === 'creak') {
    // The creak: dust shaken loose from the ceiling.
    g.fillStyle = rgba(RAMPS.cream[3], 0.8)
    for (let i = 0; i < 4; i++)
      g.fillRect(
        Math.round(b.x - 12 + i * 8),
        Math.round(b.y - b.r - 4 + ((tick + i * 5) % 10)),
        1,
        2,
      )
  }
}
