// /utils/arcade/rescueRally/credits.ts
//
// Rescue Rally's endings (conductor kr-arcade t-037, depth-pass/CABINETS.md section 1, "Ending" and
// "Secret: The Reunion"). When the Glitch Core reboots, every friend from the Shelter comes up to the
// roof to cheer and the credits roll. With all five golden chips the Reunion comes first, and the
// true ending: every family home together, and the Core joins them.

import { drawText } from '../font'
import {
  INK,
  RAMPS,
  bandedGradient,
  drawSprite,
  glow,
  rgba,
  shadedOrb,
} from '../snes'
import { H, W } from './arena'
import { SHIRTS, SKINS, familySprites } from './art'
import type { RescueeKind } from './family'

/** Each credit card shows for this long; the ending can be skipped after a moment. */
export const CARD_TICKS = 150
export const SKIP_AFTER = 60 * 4

export type Card = { title: string; lines: readonly string[] }

export const CREDITS: readonly Card[] = [
  {
    title: 'CITYWIDE REBOOT',
    lines: ['THE GLITCH IS GONE.', 'EVERY BOT IS A FRIEND AGAIN.'],
  },
  {
    title: 'THE HERO',
    lines: ['ONE KINDNESS BEAM,', 'FIVE DISTRICTS, A WHOLE CITY.'],
  },
  {
    title: 'THE DISTRICTS',
    lines: [
      'NEON PLAZA',
      'TOY FACTORY',
      'BOTANIC DOME',
      'DATA DOCKS',
      'STORM ROOFTOPS',
    ],
  },
  {
    title: 'THE BOSSES, NOW FRIENDS',
    lines: [
      'THE BIG WIND-UP',
      'THE JACK-IN-THE-BOX',
      'OVERGROWTH',
      'THE STATIC TWINS',
      'THE GLITCH CORE',
    ],
  },
  {
    title: 'THE REBOOT SQUAD',
    lines: ['EVERY DRONE YOU REBOOTED', 'IS OUT HELPING SOMEONE.'],
  },
  { title: 'KIND ROBOTS ARCADE', lines: ['THANK YOU FOR PLAYING!'] },
]

/** The Reunion's extra card, for the true ending. */
export const REUNION_CARD: Card = {
  title: 'THE REUNION',
  lines: ['FIVE GOLDEN CHIPS.', 'EVERY FAMILY, TOGETHER AGAIN.'],
}

export function endingCards(trueEnding: boolean): readonly Card[] {
  return trueEnding ? [REUNION_CARD, ...CREDITS] : CREDITS
}

export function endingTicks(trueEnding: boolean) {
  return endingCards(trueEnding).length * CARD_TICKS
}

const CROWD: readonly RescueeKind[] = ['person', 'dog', 'person', 'cat', 'bot']

export type EndingView = {
  tick: number
  /** Ticks into the ending. */
  t: number
  trueEnding: boolean
  friends: number
  chips: number
}

export function renderEnding(g: CanvasRenderingContext2D, v: EndingView) {
  // The roof at dawn after the storm.
  bandedGradient(
    g,
    0,
    0,
    W,
    H,
    v.trueEnding
      ? [RAMPS.night[2], RAMPS.purple[1], RAMPS.pink[1], RAMPS.gold[1]]
      : [RAMPS.night[0], RAMPS.night[2], RAMPS.purple[1], RAMPS.pink[1]],
    10,
  )
  for (let i = 0; i < 40; i++) {
    const x = (i * 97) % W
    const y = (i * 53) % 150
    if ((v.tick + i * 13) % 90 < 70) {
      g.fillStyle = i % 3 ? RAMPS.steel[4] : RAMPS.gold[4]
      g.fillRect(x, y, 1, 1)
    }
  }
  // The city skyline, every window lit again.
  g.fillStyle = RAMPS.night[1]
  for (let i = 0; i < 12; i++) {
    const bw = 30 + ((i * 17) % 20)
    const bh = 40 + ((i * 31) % 60)
    const bx = i * 42 - 6
    g.fillRect(bx, 230 - bh, bw, bh)
    g.fillStyle = RAMPS.gold[3]
    for (let wy = 236 - bh; wy < 224; wy += 8)
      for (let wx = bx + 4; wx < bx + bw - 4; wx += 7)
        if ((wx + wy + i) % 3) g.fillRect(wx, wy, 2, 3)
    g.fillStyle = RAMPS.night[1]
  }
  g.fillStyle = RAMPS.steel[1]
  g.fillRect(0, 230, W, H - 230)
  g.fillStyle = RAMPS.steel[2]
  g.fillRect(0, 230, W, 2)
  // The Core, rebooted: a friendly bot bobbing over everyone.
  const cy = 70 + Math.sin(v.tick / 20) * 4
  glow(g, W / 2, cy, 46, RAMPS.gold[3], 0.6)
  shadedOrb(g, W / 2, cy, 14, RAMPS.gold)
  g.fillStyle = RAMPS.leaf[3]
  g.fillRect(W / 2 - 6, cy - 3, 3, 2)
  g.fillRect(W / 2 + 3, cy - 3, 3, 2)
  g.fillRect(W / 2 - 4, cy + 4, 8, 1)
  // The crowd cheers on the roof.
  const shown = Math.min(v.friends, 90)
  for (let i = 0; i < shown; i++) {
    const row = Math.floor(i / 30)
    const x = 14 + (i % 30) * 15 + (row % 2) * 7
    const y = 262 + row * 22
    const hop = Math.floor((v.tick + i * 7) / 10) % 3 === 0 ? 3 : 0
    const sprites = familySprites(
      CROWD[i % CROWD.length]!,
      SHIRTS[(i * 5) % SHIRTS.length]!,
      SKINS[(i * 3) % SKINS.length]!,
    )
    drawSprite(g, sprites[(Math.floor(v.tick / 9) + i) % 2]!, x, y - hop, {
      anchor: 'feet',
      flipX: i % 2 === 0,
    })
  }
  // The credit card.
  const cards = endingCards(v.trueEnding)
  const card = cards[Math.min(cards.length - 1, Math.floor(v.t / CARD_TICKS))]!
  const into = v.t % CARD_TICKS
  const fade = Math.min(1, into / 20, (CARD_TICKS - into) / 20)
  g.fillStyle = rgba(INK, 0.6)
  g.fillRect(0, 96, W, 50 + card.lines.length * 16)
  g.save()
  g.globalAlpha = Math.max(0, fade)
  drawText(g, card.title, W / 2, 104, {
    scale: 3,
    align: 'center',
    color: RAMPS.gold[4],
    outline: INK,
    shadow: RAMPS.pink[1],
  })
  card.lines.forEach((line, i) => {
    drawText(g, line, W / 2, 140 + i * 16, {
      scale: 2,
      align: 'center',
      color: '#ffffff',
      outline: INK,
    })
  })
  g.restore()
  drawText(
    g,
    `${v.friends} FRIENDS HOME   ${v.chips}/5 GOLDEN CHIPS`,
    W / 2,
    H - 12,
    {
      align: 'center',
      color: RAMPS.gold[3],
      outline: INK,
    },
  )
}
