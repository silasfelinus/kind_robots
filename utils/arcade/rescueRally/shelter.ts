// /utils/arcade/rescueRally/shelter.ts
//
// The Shelter (conductor kr-arcade t-036, depth-pass/CABINETS.md section 1, "The Shelter"). It opens
// between districts: every friend the hero has got home lives there, shown as a crowd that grows all
// campaign, and they say thank you in hearts (never real money). Hearts buy a spare hero, a squad bot
// to start the next district with, a wider beam or a longer chain window. This module is the Shelter's
// data and its screen; the game keeps the wallet and applies what is bought.

import { drawText, measureText } from '../font'
import {
  INK,
  RAMPS,
  bandedGradient,
  bevel,
  drawSprite,
  glow,
  hudPanel,
} from '../snes'
import { W, H } from './arena'
import { HEART_SPRITE, SHIRTS, SKINS, familySprites } from './art'
import type { RescueeKind } from './family'

export type ShelterItemId =
  'hero' | 'squad' | 'beam' | 'chain' | 'hint' | 'leave'

/** What the hero has bought that lasts: beam width and chain window levels, and squad bots to start with. */
export type Upgrades = { beam: number; chain: number; squad: number }

export type ShelterItem = {
  id: ShelterItemId
  name: string
  line: string
  /** Hearts for the next one, given how many were bought this campaign. */
  cost(bought: number): number
  /** The most that can be held (null: no limit). */
  max: number | null
}

export const SHELTER_ITEMS: readonly ShelterItem[] = [
  {
    id: 'hero',
    name: 'SPARE HERO',
    line: 'ONE MORE TRY',
    cost: (n) => 40 + n * 20,
    max: null,
  },
  {
    id: 'squad',
    name: 'SQUAD BOT',
    line: 'A FRIEND AT YOUR SIDE, RIGHT AWAY',
    cost: (n) => 25 + n * 10,
    max: 3,
  },
  {
    id: 'beam',
    name: 'WIDER BEAM',
    line: 'A FATTER KINDNESS BEAM, FOR GOOD',
    cost: (n) => 35 + n * 25,
    max: 2,
  },
  {
    id: 'chain',
    name: 'LONGER CHAIN',
    line: 'MORE TIME TO CHAIN REBOOTS',
    cost: (n) => 25 + n * 15,
    max: 2,
  },
  {
    id: 'hint',
    name: 'CHIP HINT',
    line: "WHERE THE NEXT DISTRICT'S GOLDEN CHIP WAITS",
    cost: () => 8,
    max: null,
  },
  {
    id: 'leave',
    name: 'ON TO THE NEXT DISTRICT',
    line: '',
    cost: () => 0,
    max: null,
  },
]

/** Thank-you hearts: one per rescue, more for getting everyone home and for a boss. */
export const HEARTS_PER_RESCUE = 1
export const HEARTS_EVERYONE_HOME = 3
export const HEARTS_PER_BOSS = 10
/** The Shelter waits this long for a choice, then moves on by itself. */
export const SHELTER_TICKS = 60 * 40

/** Ticks of chain window per Longer Chain bought, and px of beam per Wider Beam. */
export const CHAIN_STEP = 45
export const BEAM_STEP = 2

/** What the screen needs to draw. */
export type ShelterView = {
  tick: number
  cursor: number
  hearts: number
  friends: number
  bought: Record<ShelterItemId, number>
  held: Upgrades
  lives: number
  next: string
  /** A line of thanks, rolled when the Shelter opens. */
  thanks: string
  /** Golden chips found, and whether the next district's chip hint is already bought. */
  chips: number
  hinted: boolean
}

export const THANKS = [
  'THANK YOU FOR GETTING US HOME!',
  'THE KIDS MADE YOU A CARD!',
  'THE CATS HAVE FORGIVEN THE BEAM.',
  'THE LITTLE BOTS ARE ALL CHARGED UP!',
  'WE SAVED YOU A SEAT BY THE HEATER.',
]

/** Whether an item can be had right now: affordable and under its cap. */
export function canBuy(
  item: ShelterItem,
  v: Pick<ShelterView, 'hearts' | 'bought' | 'held' | 'hinted'>,
) {
  if (item.id === 'leave') return true
  if (item.id === 'hint' && v.hinted) return false
  const n = v.bought[item.id]
  if (item.max !== null) {
    const have =
      item.id === 'squad'
        ? v.held.squad
        : item.id === 'beam'
          ? v.held.beam
          : v.held.chain
    if (have >= item.max) return false
  }
  return v.hearts >= item.cost(n)
}

const CROWD_KINDS: readonly RescueeKind[] = [
  'person',
  'cat',
  'person',
  'dog',
  'bot',
]

export function renderShelter(g: CanvasRenderingContext2D, v: ShelterView) {
  // A warm room: wallpaper bands, a rug, lamps.
  bandedGradient(
    g,
    0,
    0,
    W,
    H,
    [RAMPS.rust[0], RAMPS.earth[1], RAMPS.rust[1], RAMPS.earth[0]],
    6,
  )
  for (let x = 12; x < W; x += 24) {
    g.fillStyle = 'rgba(255, 220, 180, 0.06)'
    g.fillRect(x, 0, 8, 200)
  }
  for (const lx of [60, W - 60]) {
    glow(g, lx, 40, 60, RAMPS.gold[3], 0.35)
    bevel(g, lx - 6, 28, 12, 10, RAMPS.gold, { depth: 1 })
  }
  drawText(g, 'THE SHELTER', W / 2, 8, {
    scale: 3,
    align: 'center',
    color: RAMPS.gold[4],
    outline: INK,
    shadow: RAMPS.rust[1],
  })
  drawText(g, v.thanks, W / 2, 34, {
    align: 'center',
    color: RAMPS.cream[3],
    outline: INK,
  })

  // The menu.
  const top = 50
  SHELTER_ITEMS.forEach((item, i) => {
    const y = top + i * 23
    const on = i === v.cursor
    const able = canBuy(item, v)
    hudPanel(g, 40, y, W - 80, 20, on ? RAMPS.gold : RAMPS.purple)
    if (on) glow(g, 46, y + 10, 14, RAMPS.gold[3], 0.6)
    drawText(g, on ? '>' : ' ', 48, y + 6, {
      color: RAMPS.gold[4],
      outline: INK,
    })
    drawText(g, item.name, 60, y + 3, {
      scale: 1,
      color: able ? '#ffffff' : RAMPS.steel[2],
      outline: INK,
    })
    if (item.id === 'leave') {
      drawText(g, v.next, 60, y + 11, { color: RAMPS.teal[3], outline: INK })
      return
    }
    drawText(g, item.line, 60, y + 11, { color: RAMPS.cream[2], outline: INK })
    const have =
      item.id === 'hint'
        ? `${v.chips}/5 CHIPS`
        : item.id === 'hero'
          ? `${v.lives} HEROES`
          : item.id === 'squad'
            ? `${v.held.squad}/3`
            : item.id === 'beam'
              ? `${v.held.beam}/2`
              : `${v.held.chain}/2`
    drawText(g, have, W - 140, y + 7, {
      align: 'right',
      color: RAMPS.leaf[3],
      outline: INK,
    })
    const capped =
      (item.id === 'hint' && v.hinted) ||
      (item.max !== null &&
        (item.id === 'squad'
          ? v.held.squad
          : item.id === 'beam'
            ? v.held.beam
            : v.held.chain) >= item.max)
    const price = capped
      ? item.id === 'hint'
        ? 'BOUGHT'
        : 'FULL'
      : String(item.cost(v.bought[item.id]))
    drawText(g, price, W - 64, y + 7, {
      align: 'right',
      color: able ? RAMPS.pink[3] : RAMPS.steel[2],
      outline: INK,
    })
    if (!capped) drawSprite(g, HEART_SPRITE, W - 56, y + 10)
  })

  // The wallet.
  const wallet = `${v.hearts}`
  const ww = measureText(wallet, 2) + 34
  hudPanel(
    g,
    W / 2 - ww / 2,
    top + SHELTER_ITEMS.length * 23 + 2,
    ww,
    18,
    RAMPS.pink,
  )
  drawSprite(
    g,
    HEART_SPRITE,
    W / 2 - ww / 2 + 12,
    top + SHELTER_ITEMS.length * 23 + 11,
    {
      scale: 2,
    },
  )
  drawText(
    g,
    wallet,
    W / 2 - ww / 2 + 24,
    top + SHELTER_ITEMS.length * 23 + 4,
    {
      scale: 2,
      color: '#ffffff',
      shadow: INK,
    },
  )

  // Everyone the hero got home, waving.
  const floorY = 226
  g.fillStyle = RAMPS.earth[1]
  g.fillRect(0, floorY, W, H - floorY)
  bandedGradient(
    g,
    0,
    floorY,
    W,
    H - floorY,
    [RAMPS.earth[2], RAMPS.earth[1], RAMPS.earth[0]],
    4,
  )
  g.fillStyle = 'rgba(255, 200, 150, 0.12)'
  g.beginPath()
  g.ellipse(W / 2, floorY + 70, 210, 50, 0, 0, Math.PI * 2)
  g.fill()
  const perRow = 28
  const rows = 4
  const shown = Math.min(v.friends, perRow * rows)
  for (let i = 0; i < shown; i++) {
    const row = Math.floor(i / perRow)
    const col = i % perRow
    const x = 24 + col * 16 + (row % 2) * 8
    const y = floorY + 30 + row * 22
    const kind = CROWD_KINDS[i % CROWD_KINDS.length]!
    const sprites = familySprites(
      kind,
      SHIRTS[(i * 7) % SHIRTS.length]!,
      SKINS[(i * 3) % SKINS.length]!,
    )
    const hop = Math.floor((v.tick + i * 9) / 14) % 4 === 0 ? 2 : 0
    drawSprite(g, sprites[(Math.floor(v.tick / 12) + i) % 2]!, x, y - hop, {
      anchor: 'feet',
      flipX: i % 3 === 0,
    })
  }
  const label =
    v.friends > shown
      ? `${v.friends} FRIENDS HOME (+${v.friends - shown} MORE INSIDE)`
      : `${v.friends} FRIENDS HOME`
  drawText(g, label, W / 2, H - 14, {
    align: 'center',
    color: RAMPS.gold[4],
    outline: INK,
  })
  drawText(g, 'UP/DOWN PICK   A CHOOSE', W / 2, floorY + 6, {
    align: 'center',
    color: RAMPS.cream[3],
    outline: INK,
  })
}
