// /utils/arcade/prizeShow/mapScreen.ts
//
// The season map shown between rooms (conductor kr-arcade t-026): the episode's grid of rooms, the
// route taken so far, and each door out of the room just cleared, with what it leads to (swarm,
// prize vault, trap, sponsor challenge or boss), a danger rating and a reward icon. The game owns the
// choice (games/prizeShowPanic.ts); this only draws a MapView of it.

import { drawText, measureText } from '../font'
import {
  INK,
  RAMPS,
  bandedGradient,
  bevel,
  drawSprite,
  glow,
  hudPanel,
  mix,
  rgba,
} from '../snes'
import type { PixelSprite, Ramp } from '../snes'
import {
  CAMERA_SPRITES,
  CHECK_SPRITE,
  MAP_ICONS,
  REWARD_ICONS,
  TICKET_ICON,
} from './art'
import { MEDALS, MEDAL_IDS, drawMedal } from './modes'
import { ICON_LABEL, MODIFIERS, ROOM_ICON, roomById } from './season'
import type { Episode, MapIcon, MapRoom, ModifierId, Side } from './season'

export type MapOption = { id: string; side: Side; modifier: ModifierId | null }

export type MapView = {
  episode: Episode
  loop: number
  /** Rooms played this episode, in route order. */
  visited: readonly string[]
  current: string
  options: readonly MapOption[]
  cursor: number
  tickets: number
  ticketsTotal: number
  /** Rooms whose secret has been found (a marker hangs off their tile). */
  secrets: readonly string[]
  marker: PixelSprite
  tick: number
  /** Top right: RERUN n (the default on later loops), or the Marathon's pace. */
  tag?: string
  /** The Marathon: rooms cleared so far, shown where the tickets would be. */
  rooms?: number
  /** Medals won per room (prizeShow/modes.ts), drawn on each tile's top edge. */
  medals?: Readonly<Record<string, number>>
}

const W = 320
const TILE_W = 52
const TILE_H = 34
const GAP_X = 8
const GAP_Y = 10
const GRID_TOP = 36

const ICON_RAMP: Record<MapIcon, Ramp> = {
  swarm: RAMPS.pink,
  trap: RAMPS.ember,
  vault: RAMPS.gold,
  sponsor: RAMPS.teal,
  boss: RAMPS.purple,
  secret: RAMPS.night,
}

const DIM: Ramp = [
  RAMPS.night[0],
  RAMPS.night[1],
  RAMPS.night[2],
  RAMPS.night[3],
  RAMPS.night[4],
]

/** The tile's picture: the trap rooms show their own hazard. */
function iconFor(room: MapRoom): PixelSprite {
  if (room.script.type === 'lights') return MAP_ICONS.lamp
  if (room.script.type === 'cameras') return CAMERA_SPRITES.down
  if (room.script.type === 'hotplates') return MAP_ICONS.hotplate
  if (room.script.type === 'conveyor') return MAP_ICONS.belt
  if (room.script.type === 'flour') return MAP_ICONS.flour
  if (room.script.type === 'speakers') return MAP_ICONS.speaker
  if (room.script.type === 'moshpit') return MAP_ICONS.mosh
  return MAP_ICONS[ROOM_ICON[room.script.type]]
}

/** Where a room's tile sits on screen for an episode `cols` wide. */
export function tileRect(episode: Episode, room: MapRoom) {
  const width = episode.cols * TILE_W + (episode.cols - 1) * GAP_X
  const x0 = Math.round((W - width) / 2)
  return {
    x: x0 + room.col * (TILE_W + GAP_X),
    y: GRID_TOP + room.row * (TILE_H + GAP_Y),
    w: TILE_W,
    h: TILE_H,
  }
}

function centre(episode: Episode, room: MapRoom) {
  const r = tileRect(episode, room)
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 }
}

/** A connector between two neighbouring tiles. */
function link(
  g: CanvasRenderingContext2D,
  episode: Episode,
  a: MapRoom,
  b: MapRoom,
  colour: string,
  thick: number,
) {
  const ca = centre(episode, a)
  const cb = centre(episode, b)
  const x = Math.min(ca.x, cb.x)
  const y = Math.min(ca.y, cb.y)
  const horizontal = ca.y === cb.y
  const w = horizontal ? Math.abs(ca.x - cb.x) : thick
  const h = horizontal ? thick : Math.abs(ca.y - cb.y)
  const lx = horizontal ? x : x - thick / 2
  const ly = horizontal ? y - thick / 2 : y
  g.fillStyle = INK
  g.fillRect(lx - 1, ly - 1, w + 2, h + 2)
  g.fillStyle = colour
  g.fillRect(lx, ly, w, h)
}

function pips(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  danger: number,
  size: number,
  dim: boolean,
) {
  for (let i = 0; i < 5; i++) {
    const on = i < danger
    g.fillStyle = INK
    g.fillRect(x + i * (size + 2) - 1, y - 1, size + 2, size + 1)
    g.fillStyle = on
      ? dim
        ? RAMPS.ember[1]
        : i >= 3
          ? RAMPS.ember[2]
          : RAMPS.gold[2]
      : RAMPS.night[1]
    g.fillRect(x + i * (size + 2), y, size, size - 1)
    if (on && !dim) {
      g.fillStyle = i >= 3 ? RAMPS.ember[4] : RAMPS.gold[4]
      g.fillRect(x + i * (size + 2), y, size, 1)
    }
  }
}

export function renderSeasonMap(g: CanvasRenderingContext2D, view: MapView) {
  const { episode, tick } = view
  // The control room: a banded backdrop with a chase of bulbs round the edge.
  bandedGradient(
    g,
    0,
    0,
    W,
    240,
    [RAMPS.night[1], RAMPS.purple[0], RAMPS.night[0]],
    4,
  )
  g.fillStyle = rgba(RAMPS.purple[2], 0.08)
  for (let x = 0; x < W; x += 16) g.fillRect(x, 0, 1, 240)
  for (let y = 0; y < 240; y += 16) g.fillRect(0, y, W, 1)
  const step = Math.floor(tick / 6)
  for (let i = 0; i < 40; i++) {
    const lit = (i + step) % 4 === 0
    const x = 4 + i * 8
    for (const y of [2, 236]) {
      g.fillStyle = lit ? RAMPS.gold[4] : RAMPS.gold[1]
      g.fillRect(x, y, 2, 2)
    }
  }

  // Title card.
  const billing =
    episode.billing ??
    (episode.vault
      ? 'BONUS ROUND'
      : episode.live
        ? 'LIVE!'
        : `EPISODE ${episode.number}`)
  drawText(g, `${billing}  ${episode.subtitle}`, 10, 6, {
    color: RAMPS.gold[3],
    shadow: INK,
  })
  drawText(g, episode.title, 10, 16, {
    scale: 2,
    color: '#ffffff',
    outline: INK,
    shadow: RAMPS.purple[1],
  })
  const tag = view.tag ?? (view.loop > 1 ? `RERUN ${view.loop - 1}` : '')
  if (tag)
    drawText(g, tag, W - 10, 6, {
      align: 'right',
      color: RAMPS.pink[3],
      shadow: INK,
    })
  if (view.rooms !== undefined) {
    drawText(g, `ROOMS ${view.rooms}`, W - 10, 19, {
      align: 'right',
      color: RAMPS.teal[4],
      outline: INK,
    })
  } else {
    const ticketText = `${view.tickets}/${view.ticketsTotal}`
    const tx = W - 10 - measureText(ticketText)
    drawSprite(g, TICKET_ICON, tx - 7, 22)
    drawText(g, ticketText, W - 10, 19, {
      align: 'right',
      color: RAMPS.gold[4],
      outline: INK,
    })
  }

  const visited = new Set(view.visited)
  const current = roomById(episode, view.current)
  const chosen = view.options[view.cursor]

  // Every corridor, dim; the route walked so far in gold; the doors out of here in green.
  for (const room of episode.rooms)
    for (const next of room.exits)
      link(g, episode, room, roomById(episode, next), RAMPS.night[2], 3)
  for (let i = 1; i < view.visited.length; i++) {
    const a = roomById(episode, view.visited[i - 1]!)
    const b = roomById(episode, view.visited[i]!)
    if (a.exits.includes(b.id)) link(g, episode, a, b, RAMPS.gold[3], 3)
  }
  const blink = Math.floor(tick / 10) % 2 === 0
  view.options.forEach((option, i) => {
    const to = roomById(episode, option.id)
    const colour =
      i === view.cursor
        ? blink
          ? RAMPS.leaf[4]
          : RAMPS.leaf[3]
        : RAMPS.leaf[1]
    link(g, episode, current, to, colour, i === view.cursor ? 5 : 3)
  })

  for (const room of episode.rooms) {
    const r = tileRect(episode, room)
    const icon = ROOM_ICON[room.script.type]
    const isOption = view.options.some((o) => o.id === room.id)
    const done = visited.has(room.id) && room.id !== view.current
    const ramp = done ? DIM : ICON_RAMP[icon]
    if (chosen && chosen.id === room.id)
      glow(g, r.x + r.w / 2, r.y + r.h / 2, 40, RAMPS.leaf[3], 0.45)
    bevel(g, r.x, r.y, r.w, r.h, ramp)
    // An inset screen: every tile is a little studio monitor.
    g.fillStyle = done ? RAMPS.night[0] : mix(ramp[0], INK, 0.35)
    g.fillRect(r.x + 3, r.y + 3, r.w - 6, r.h - 13)
    g.fillStyle = rgba(ramp[3], done ? 0.1 : 0.22)
    g.fillRect(r.x + 3, r.y + 3, r.w - 6, 1)
    drawSprite(g, iconFor(room), r.x + 13, r.y + 12, {
      alpha: done ? 0.45 : 1,
    })
    drawSprite(g, REWARD_ICONS[room.script.reward], r.x + r.w - 14, r.y + 12, {
      alpha: done ? 0.45 : 1,
    })
    pips(g, r.x + 4, r.y + r.h - 8, room.script.danger, 7, done)
    if (done) drawSprite(g, CHECK_SPRITE, r.x + r.w - 8, r.y + r.h - 7)
    if (view.secrets.includes(room.id)) {
      drawSprite(g, MAP_ICONS.secret, r.x + r.w - 2, r.y + 2)
    }
    // The room's medals, like gems set in the frame (only once one has been won): on its top
    // edge, or its foot when the MID / FINALE label sits over it.
    const won = view.medals?.[room.id] ?? 0
    const labelled =
      (room.id === episode.midBoss || room.id === episode.finale) &&
      !episode.rooms.some((o) => o.col === room.col && o.row === room.row - 1)
    if (won)
      MEDAL_IDS.forEach((id, k) =>
        drawMedal(
          g,
          r.x + r.w / 2 - 6 + k * 6,
          labelled ? r.y + r.h + 1 : r.y + 1,
          id,
          (won & MEDALS[id].bit) !== 0,
          2,
        ),
      )
    const option = view.options.find((o) => o.id === room.id)
    if (option?.modifier) {
      // A pink badge: this door comes with a twist.
      bevel(g, r.x - 3, r.y - 3, 9, 9, RAMPS.pink, { depth: 1 })
      drawText(g, '+', r.x - 1, r.y - 2, { color: '#ffffff' })
    }
    if (chosen && chosen.id === room.id) {
      g.strokeStyle = blink ? '#ffffff' : RAMPS.leaf[4]
      g.lineWidth = 1
      g.strokeRect(r.x - 2.5, r.y - 2.5, r.w + 5, r.h + 5)
    } else if (isOption) {
      g.strokeStyle = RAMPS.leaf[3]
      g.lineWidth = 1
      g.strokeRect(r.x - 1.5, r.y - 1.5, r.w + 3, r.h + 3)
    }
    if (room.id === episode.midBoss || room.id === episode.finale) {
      // Over the tile, or under it when another room sits just above.
      const above = episode.rooms.some(
        (o) => o.col === room.col && o.row === room.row - 1,
      )
      drawText(
        g,
        room.id === episode.finale ? 'FINALE' : 'MID',
        r.x + r.w / 2,
        above ? r.y + r.h + 2 : r.y - 9,
        {
          align: 'center',
          color: RAMPS.purple[3],
          outline: INK,
        },
      )
    }
  }
  // Sparkle waits on the tile just cleared.
  const here = tileRect(episode, current)
  const bob = Math.round(Math.sin(tick / 8) * 1.5)
  drawSprite(g, view.marker, here.x + here.w / 2, here.y + 18 + bob, {
    scale: 2,
  })

  // The card for the door under the cursor.
  hudPanel(g, 8, 176, W - 16, 58)
  if (!chosen) return
  const room = roomById(episode, chosen.id)
  const script = room.script
  const icon = ROOM_ICON[script.type]
  drawText(g, script.title, 16, 181, {
    scale: 2,
    color: '#ffffff',
    outline: INK,
  })
  drawText(g, ICON_LABEL[icon], 16, 199, {
    color: ICON_RAMP[icon][3],
    shadow: INK,
  })
  drawText(g, script.tagline, 16, 209, {
    color: RAMPS.cream[3],
    shadow: INK,
  })
  drawText(g, 'DANGER', 214, 182, { color: RAMPS.cream[3], shadow: INK })
  pips(g, 214, 192, script.danger, 9, false)
  drawText(g, 'PRIZE', 214, 203, { color: RAMPS.cream[3], shadow: INK })
  glow(g, 266, 207, 12, RAMPS.gold[3], 0.35)
  drawSprite(g, REWARD_ICONS[script.reward], 266, 207)
  if (chosen.modifier) {
    const mod = MODIFIERS[chosen.modifier]
    drawText(g, `+ ${mod.title}`, 16, 220, {
      color: RAMPS.pink[3],
      outline: INK,
    })
  } else if (view.options.length > 1) {
    drawText(g, 'SAFE OR RICH? YOUR CALL', 16, 220, {
      color: RAMPS.teal[3],
      shadow: INK,
    })
  }
  drawText(g, 'ARROWS PICK  A GO', W - 16, 222, {
    align: 'right',
    color: blink ? RAMPS.gold[4] : RAMPS.gold[3],
    shadow: INK,
  })
}
