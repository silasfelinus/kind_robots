// /utils/arcade/stationSweep/scenery.ts
//
// Station Sweep's slice-2 scenery, drawn in code in the cabinet's 16-bit style (conductor
// kr-arcade/t-142): doorways (arched hatches with a lit sign, so they never read as the lifts'
// striped frames), vent grates, the rooms' furniture, the Greenhouse Ring's sprinklers and vine
// curtains, the Laundry Moon's conveyors, steam vents and washing machines, specimen jars, seed
// sacks, snacks, control consoles, stranded crewmates' help bubbles, and the three bosses.
// Everything here is cosmetic: positions come from the game, and nothing rolls gameplay dice.

import { drawText } from '../font'
import {
  INK,
  RAMPS,
  bandedGradient,
  bevel,
  dropShadow,
  glow,
  rgba,
  shadedOrb,
  type Ramp,
} from '../snes'
import type { RoomKind } from './stations'

export const CEILING = 70
export const FLOOR = 206

/** Each room's sign colour. */
export const ROOM_RAMPS: Record<RoomKind | 'vent' | 'exit', Ramp> = {
  closet: RAMPS.sky,
  cabin: RAMPS.gold,
  lab: RAMPS.teal,
  galley: RAMPS.rust,
  nest: ['#1f3d0a', '#3f6212', '#65a30d', '#a3e635', '#ecfccb'],
  control: RAMPS.ember,
  washer: RAMPS.water,
  vault: RAMPS.leaf,
  boss: RAMPS.pink,
  vent: RAMPS.steel,
  exit: RAMPS.steel,
}

/**
 * A doorway: an arched hatch in the bulkhead, its sign lit in the room's colour (dim once the
 * room is clean), its hatch half open on a dark room beyond.
 */
export function drawDoorway(
  g: CanvasRenderingContext2D,
  x: number,
  label: string,
  ramp: Ramp,
  dim: boolean,
  tick: number,
) {
  const top = CEILING + 46
  const w = 30
  // The arch: an ink outline, a steel frame with a rounded head.
  g.fillStyle = INK
  g.fillRect(x - w / 2 - 3, top + 6, w + 6, FLOOR - top - 6)
  g.beginPath()
  g.arc(x, top + 8, w / 2 + 3, Math.PI, 0)
  g.fill()
  g.fillStyle = RAMPS.steel[2]
  g.fillRect(x - w / 2 - 2, top + 8, w + 4, FLOOR - top - 8)
  g.beginPath()
  g.arc(x, top + 8, w / 2 + 2, Math.PI, 0)
  g.fill()
  g.fillStyle = RAMPS.steel[3]
  g.fillRect(x - w / 2 - 2, top + 8, 1, FLOOR - top - 8)
  // The dark room beyond, with a warm light spilling from inside.
  g.fillStyle = INK
  g.fillRect(x - w / 2, top + 8, w, FLOOR - top - 8)
  g.beginPath()
  g.arc(x, top + 8, w / 2, Math.PI, 0)
  g.fill()
  bandedGradient(
    g,
    x - w / 2 + 2,
    top + 18,
    w - 4,
    FLOOR - top - 18,
    [RAMPS.night[1], ramp[1], ramp[0]],
    4,
  )
  // The hatch, slid half up.
  bevel(g, x - w / 2 + 1, top + 4, w - 2, 12, RAMPS.steel, { depth: 1 })
  g.fillStyle = RAMPS.gold[2]
  for (let i = 0; i < 4; i++) g.fillRect(x - w / 2 + 4 + i * 7, top + 12, 3, 2)
  // The sign over the arch.
  const lit = dim ? 0.15 : 0.45 + 0.15 * Math.sin(tick / 12)
  glow(g, x, top - 8, 16, ramp[3], lit)
  const sw = Math.max(16, label.length * 6 + 6)
  bevel(g, x - sw / 2, top - 14, sw, 11, dim ? RAMPS.steel : ramp, {
    depth: 1,
  })
  drawText(g, label, x, top - 12, {
    align: 'center',
    color: dim ? RAMPS.steel[1] : '#ffffff',
    outline: INK,
  })
  // A threshold plate.
  bevel(g, x - w / 2 - 2, FLOOR, w + 4, 3, RAMPS.steel, { depth: 1 })
}

/** A vent grate low on the bulkhead, with an arrow for the deck it leads to. */
export function drawVent(
  g: CanvasRenderingContext2D,
  x: number,
  up: boolean,
  tick: number,
) {
  const y = FLOOR - 24
  bevel(g, x - 15, y, 30, 22, RAMPS.steel, { depth: 1 })
  g.fillStyle = INK
  for (let i = 0; i < 5; i++) g.fillRect(x - 12, y + 3 + i * 4, 24, 2)
  const bob = Math.floor(tick / 15) % 2
  const ay = up ? y - 9 - bob : y - 7 + bob
  g.fillStyle = RAMPS.teal[3]
  for (let i = 0; i < 4; i++) {
    const row = up ? i : 3 - i
    g.fillRect(x - row, ay + i, row * 2 + 1, 1)
  }
}

/** A sprinkler head on the ceiling; dripping as its tell, misting as it sprays. */
export function drawSprinkler(
  g: CanvasRenderingContext2D,
  x: number,
  state: 'idle' | 'tell' | 'mist',
  tick: number,
) {
  bevel(g, x - 5, CEILING - 2, 10, 5, RAMPS.steel, { depth: 1 })
  g.fillStyle = RAMPS.water[3]
  g.fillRect(x - 2, CEILING + 3, 4, 2)
  if (state === 'tell') {
    const d = (tick * 2) % 60
    g.fillStyle = RAMPS.water[4]
    g.fillRect(x, CEILING + 6 + d, 1, 3)
  } else if (state === 'mist') {
    glow(g, x, CEILING + 60, 40, RAMPS.water[3], 0.25)
    g.fillStyle = rgba(RAMPS.water[4], 0.7)
    for (let i = 0; i < 18; i++) {
      const fall = (tick * 3 + i * 23) % (FLOOR - CEILING - 8)
      const spread = ((i * 37) % 31) - 15
      g.fillRect(Math.round(x + spread * (fall / 70)), CEILING + 6 + fall, 1, 3)
    }
  }
}

/** A slick of water on the floor: a shine that slides as you look. */
export function drawWet(
  g: CanvasRenderingContext2D,
  x: number,
  r: number,
  fade: number,
  tick: number,
) {
  g.save()
  g.globalAlpha *= 0.5 * fade
  g.fillStyle = RAMPS.water[2]
  g.beginPath()
  g.ellipse(x, FLOOR + 1, r, 2.5, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = RAMPS.water[4]
  const sx = x - r + ((tick / 2) % (r * 2))
  g.fillRect(Math.round(sx), FLOOR, 6, 1)
  g.restore()
}

/** A curtain of vines from the ceiling, in front of everything behind it. */
export function drawVines(
  g: CanvasRenderingContext2D,
  from: number,
  to: number,
  tick: number,
) {
  for (let x = from; x <= to; x += 7) {
    const sway = Math.sin(tick / 30 + x / 17) * 2
    const len = 90 + ((x * 13) % 40)
    for (let y = CEILING; y < CEILING + len; y += 3) {
      const t = (y - CEILING) / len
      const vx = Math.round(x + sway * t)
      g.fillStyle = INK
      g.fillRect(vx - 1, y, 3, 3)
      g.fillStyle = t > 0.7 ? RAMPS.leaf[3] : RAMPS.leaf[2]
      g.fillRect(vx, y, 1, 3)
      if ((y + x) % 9 === 0) {
        g.fillStyle = RAMPS.leaf[3]
        g.fillRect(vx + 1, y, 3, 2)
        g.fillStyle = RAMPS.leaf[4]
        g.fillRect(vx + 1, y, 1, 1)
      }
    }
  }
}

/** A conveyor belt along the floor, its chevrons running the way it carries. */
export function drawConveyor(
  g: CanvasRenderingContext2D,
  from: number,
  to: number,
  speed: number,
  running: boolean,
  tick: number,
) {
  bevel(g, from, FLOOR - 1, to - from, 6, RAMPS.steel, { depth: 1 })
  g.fillStyle = INK
  g.fillRect(from, FLOOR + 1, to - from, 3)
  const shift = running ? Math.floor(tick * speed) : 0
  g.fillStyle = running ? RAMPS.gold[3] : RAMPS.steel[2]
  const dir = speed > 0 ? 1 : -1
  for (let cx = from + 4 + (((shift % 8) + 8) % 8); cx < to - 4; cx += 8) {
    g.fillRect(cx + dir, FLOOR + 2, 2, 1)
    g.fillRect(cx, FLOOR + 1, 2, 1)
    g.fillRect(cx, FLOOR + 3, 2, 1)
  }
  for (const x of [from, to]) shadedOrb(g, x, FLOOR + 2, 3, RAMPS.steel)
}

/** A steam vent in the floor: puffs as it hisses, a white column as it blows. */
export function drawSteamVent(
  g: CanvasRenderingContext2D,
  x: number,
  state: 'idle' | 'tell' | 'blow',
  tick: number,
) {
  bevel(g, x - 9, FLOOR - 2, 18, 4, RAMPS.steel, { depth: 1 })
  g.fillStyle = INK
  for (let i = 0; i < 4; i++) g.fillRect(x - 7 + i * 4, FLOOR - 1, 2, 2)
  if (state === 'tell') {
    for (let i = 0; i < 3; i++) {
      const rise = (tick + i * 9) % 22
      g.fillStyle = rgba('#ffffff', 0.6 * (1 - rise / 22))
      g.fillRect(Math.round(x - 4 + i * 4), FLOOR - 4 - rise, 3, 2)
    }
  } else if (state === 'blow') {
    glow(g, x, FLOOR - 30, 26, '#ffffff', 0.35)
    for (let i = 0; i < 10; i++) {
      const rise = (tick * 3 + i * 11) % 70
      const r = 3 + rise / 10
      g.fillStyle = rgba('#ffffff', 0.7 * (1 - rise / 70))
      g.beginPath()
      g.arc(x + Math.sin(i + tick / 9) * 4, FLOOR - 4 - rise, r, 0, Math.PI * 2)
      g.fill()
    }
  }
}

/** A washing machine: a box with a round door, its drum turning, rumbling when it's busy. */
export function drawWasher(
  g: CanvasRenderingContext2D,
  x: number,
  size: number,
  busy: boolean,
  hurt: boolean,
  tick: number,
) {
  const shake = busy ? (tick % 4 < 2 ? 1 : 0) : 0
  const w = size
  const h = size + 4
  const left = x - w / 2 + shake
  const top = FLOOR - h
  bevel(g, left, top, w, h, hurt ? RAMPS.cream : RAMPS.steel, { depth: 2 })
  g.fillStyle = RAMPS.steel[1]
  g.fillRect(left + 3, top + 3, w - 6, 4)
  g.fillStyle = busy ? RAMPS.ember[3] : RAMPS.leaf[3]
  g.fillRect(left + w - 8, top + 4, 3, 2)
  const r = w * 0.3
  const cy = top + h * 0.58
  shadedOrb(g, x + shake, cy, r + 2, RAMPS.steel)
  shadedOrb(g, x + shake, cy, r, RAMPS.water, { glint: false })
  g.fillStyle = rgba('#ffffff', 0.6)
  const a = tick / (busy ? 4 : 14)
  for (let i = 0; i < 3; i++)
    g.fillRect(
      Math.round(x + shake + Math.cos(a + i * 2.1) * r * 0.55),
      Math.round(cy + Math.sin(a + i * 2.1) * r * 0.55),
      2,
      2,
    )
}

/** A specimen jar on the floor: glass, a lid, and something small and green asleep inside. */
export function drawJar(g: CanvasRenderingContext2D, x: number, tick: number) {
  glow(g, x, FLOOR - 8, 12, RAMPS.teal[3], 0.3)
  dropShadow(g, x, FLOOR, 5, 1.5, 0.4)
  g.fillStyle = INK
  g.fillRect(x - 5, FLOOR - 15, 10, 15)
  g.fillStyle = rgba(RAMPS.teal[3], 0.55)
  g.fillRect(x - 4, FLOOR - 13, 8, 12)
  shadedOrb(g, x, FLOOR - 5 + Math.round(Math.sin(tick / 20)), 2, RAMPS.leaf, {
    glint: false,
  })
  bevel(g, x - 5, FLOOR - 17, 10, 3, RAMPS.cream, { depth: 1 })
  g.fillStyle = '#ffffff'
  g.fillRect(x - 3, FLOOR - 12, 1, 6)
}

/** A sack of seeds in the vault, tied at the top. */
export function drawSeedSack(g: CanvasRenderingContext2D, x: number) {
  dropShadow(g, x, FLOOR, 7, 1.5, 0.4)
  shadedOrb(g, x, FLOOR - 7, 7, RAMPS.earth)
  g.fillStyle = RAMPS.earth[1]
  g.fillRect(x - 2, FLOOR - 16, 4, 3)
  g.fillStyle = RAMPS.leaf[3]
  g.fillRect(x - 1, FLOOR - 19, 2, 3)
  g.fillRect(x + 1, FLOOR - 20, 2, 1)
}

/** A galley snack: a frosted bolt-nut doughnut. */
export function drawSnack(g: CanvasRenderingContext2D, x: number, bob: number) {
  glow(g, x, FLOOR - 7, 12, RAMPS.pink[3], 0.35)
  dropShadow(g, x, FLOOR, 5, 1.5, 0.4)
  shadedOrb(g, x, FLOOR - 6 + bob, 5, RAMPS.gold)
  shadedOrb(g, x, FLOOR - 7 + bob, 4, RAMPS.pink, { glint: false })
  g.fillStyle = INK
  g.fillRect(x - 1, FLOOR - 7 + bob, 2, 2)
  g.fillStyle = RAMPS.sky[3]
  g.fillRect(x - 3, FLOOR - 9 + bob, 1, 1)
  g.fillRect(x + 2, FLOOR - 8 + bob, 1, 1)
}

/** A control console: a screen, and a big lever; red while its hazard runs, green once off. */
export function drawConsole(
  g: CanvasRenderingContext2D,
  x: number,
  label: string,
  off: boolean,
  tick: number,
) {
  bevel(g, x - 18, FLOOR - 34, 36, 34, RAMPS.steel)
  g.fillStyle = INK
  g.fillRect(x - 14, FLOOR - 30, 28, 12)
  bandedGradient(
    g,
    x - 13,
    FLOOR - 29,
    26,
    10,
    off ? [RAMPS.leaf[2], RAMPS.leaf[1]] : [RAMPS.ember[2], RAMPS.ember[1]],
    2,
  )
  if (!off && Math.floor(tick / 15) % 2) {
    g.fillStyle = RAMPS.ember[4]
    g.fillRect(x - 10, FLOOR - 26, 20, 2)
  }
  bevel(g, x - 3, FLOOR - 14, 6, 10, RAMPS.gold, { depth: 1 })
  g.fillStyle = INK
  g.fillRect(x - 1, off ? FLOOR - 12 : FLOOR - 22, 2, 8)
  shadedOrb(
    g,
    x,
    off ? FLOOR - 12 : FLOOR - 22,
    3,
    off ? RAMPS.leaf : RAMPS.ember,
  )
  drawText(g, label, x, FLOOR - 45, {
    align: 'center',
    color: off ? RAMPS.leaf[3] : RAMPS.ember[3],
    outline: INK,
  })
}

/** A stranded crewmate's call for help, over its head. */
export function drawHelp(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
) {
  const w = text.length * 6 + 6
  bevel(g, x - w / 2, y - 11, w, 11, RAMPS.cream, { depth: 1 })
  g.fillStyle = RAMPS.cream[3]
  g.fillRect(x - 1, y, 3, 2)
  drawText(g, text, x, y - 9, { align: 'center', color: INK })
}

/** Furniture along a room's back wall, by what the room is. */
export function drawRoomDecor(
  g: CanvasRenderingContext2D,
  kind: RoomKind,
  width: number,
  tick: number,
) {
  const shelf = (x: number, y: number, w: number) =>
    bevel(g, x, y, w, 4, RAMPS.earth, { depth: 1 })
  switch (kind) {
    case 'closet':
      for (const y of [110, 140, 170]) shelf(70, y, width - 110)
      for (let x = 80; x < width - 50; x += 22) {
        bevel(g, x, 98, 12, 12, RAMPS.sky, { depth: 1 })
        bevel(g, x + 4, 158, 10, 12, RAMPS.gold, { depth: 1 })
      }
      return
    case 'cabin':
      bevel(g, 70, 150, 90, 14, RAMPS.purple, { depth: 2 })
      bevel(g, 70, 140, 24, 10, RAMPS.cream, { depth: 1 })
      bevel(g, 70, 110, 90, 6, RAMPS.earth, { depth: 1 })
      bevel(g, width - 80, 100, 40, 30, RAMPS.night, { depth: 2 })
      drawText(g, '*', width - 60, 111, {
        align: 'center',
        color: RAMPS.pink[3],
      })
      return
    case 'lab':
      for (const y of [120, 150]) shelf(60, y, width - 100)
      for (let x = 72; x < width - 50; x += 26)
        shadedOrb(g, x, 112, 5, RAMPS.teal, { glint: true })
      bevel(g, width - 70, 160, 40, 46, RAMPS.steel, { depth: 2 })
      return
    case 'galley':
      bevel(g, 60, 168, width - 100, 38, RAMPS.cream, { depth: 2 })
      bevel(g, 70, 110, 40, 26, RAMPS.steel, { depth: 1 })
      for (let x = 130; x < width - 50; x += 20)
        shadedOrb(g, x, 120, 4, RAMPS.rust, { glint: true })
      return
    case 'nest':
      g.fillStyle = rgba('#65a30d', 0.35)
      for (let x = 50; x < width; x += 30) {
        g.beginPath()
        g.ellipse(x, CEILING + 6, 16, 8 + ((x * 7) % 6), 0, 0, Math.PI)
        g.fill()
      }
      for (let x = 60; x < width; x += 44) {
        const len = 30 + ((x * 11) % 40)
        g.fillStyle = rgba('#a3e635', 0.5)
        g.fillRect(x, CEILING, 2, len - ((tick / 6 + x) % 8))
      }
      return
    case 'control':
      for (let x = 60; x < width - 90; x += 34) {
        bevel(g, x, 110, 28, 20, RAMPS.night, { depth: 1 })
        g.fillStyle =
          Math.floor(tick / 20 + x) % 2 ? RAMPS.leaf[3] : RAMPS.teal[3]
        g.fillRect(x + 4, 116, 20, 2)
      }
      return
    case 'washer':
      for (let x = 70; x < width - 40; x += 40)
        drawText(g, '~', x, 100, { color: RAMPS.water[3] })
      g.fillStyle = RAMPS.water[2]
      g.fillRect(40, 96, width - 60, 1)
      for (let x = 60; x < width - 40; x += 36) {
        bevel(g, x, 97, 12, 14, x % 72 ? RAMPS.pink : RAMPS.sky, { depth: 1 })
      }
      return
    case 'vault':
      shadedOrb(g, width / 2 + 40, 130, 34, RAMPS.steel)
      shadedOrb(g, width / 2 + 40, 130, 26, RAMPS.leaf, { glint: false })
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + tick / 120
        g.fillStyle = INK
        g.fillRect(
          Math.round(width / 2 + 40 + Math.cos(a) * 20) - 1,
          Math.round(130 + Math.sin(a) * 20) - 1,
          3,
          3,
        )
      }
      return
    case 'boss':
      glow(g, width / 2, 140, 160, RAMPS.pink[2], 0.18)
      return
  }
}

/** The Nest Mother: a queenly sac-mound in her station's colours, swelling as she lays. */
export function drawNestMother(
  g: CanvasRenderingContext2D,
  x: number,
  ramp: Ramp,
  swell: number,
  flash: boolean,
  tick: number,
) {
  const r = 18 + swell * 4 + Math.sin(tick / 15)
  dropShadow(g, x, FLOOR, r + 4, 3, 0.5)
  glow(g, x, FLOOR - r, r + 14, ramp[3], 0.3 + swell * 0.3)
  const body = flash ? RAMPS.cream : ramp
  shadedOrb(g, x, FLOOR - r + 2, r, body)
  shadedOrb(g, x - r * 0.7, FLOOR - 7, 8, body)
  shadedOrb(g, x + r * 0.7, FLOOR - 7, 8, body)
  for (const dx of [-6, 6]) {
    g.fillStyle = '#ffffff'
    g.fillRect(Math.round(x + dx - 2), Math.round(FLOOR - r - 4), 4, 4)
    g.fillStyle = INK
    g.fillRect(Math.round(x + dx), Math.round(FLOOR - r - 2), 2, 2)
  }
  // Her crown.
  const cy = FLOOR - r * 2
  g.fillStyle = INK
  g.fillRect(x - 9, cy - 2, 18, 6)
  g.fillStyle = RAMPS.gold[3]
  g.fillRect(x - 8, cy - 1, 16, 4)
  for (const dx of [-8, -1, 6]) {
    g.fillStyle = INK
    g.fillRect(x + dx - 1, cy - 6, 4, 5)
    g.fillStyle = RAMPS.gold[4]
    g.fillRect(x + dx, cy - 5, 2, 4)
  }
}

/** Mother Gloop: a pond of goo with a face, bulging where a blob is about to slop off. */
export function drawMotherGloop(
  g: CanvasRenderingContext2D,
  x: number,
  size: number,
  bulge: number,
  flash: boolean,
  tick: number,
) {
  const w = 60 * size
  const h = 24 * size
  const ramp = flash ? RAMPS.cream : RAMPS.teal
  glow(g, x, FLOOR - h / 2, w, ramp[3], 0.3)
  g.fillStyle = INK
  g.beginPath()
  g.ellipse(x, FLOOR, w + 1, h + 1 + bulge * 6, 0, Math.PI, 0)
  g.fill()
  for (let i = 0; i < 4; i++) {
    g.fillStyle = ramp[i + 1]!
    g.beginPath()
    g.ellipse(
      x - i * w * 0.08,
      FLOOR - i,
      w * (1 - i * 0.2),
      (h + bulge * 6) * (1 - i * 0.22),
      0,
      Math.PI,
      0,
    )
    g.fill()
  }
  for (let i = 0; i < 5; i++) {
    const bx = x - w * 0.7 + ((i * 31 + tick / 3) % (w * 1.4))
    const rise = (tick / 2 + i * 13) % 16
    g.fillStyle = rgba(RAMPS.teal[4], 0.7)
    g.fillRect(Math.round(bx), Math.round(FLOOR - h * 0.4 - rise), 2, 2)
  }
  for (const dx of [-10, 10]) {
    g.fillStyle = '#ffffff'
    g.fillRect(Math.round(x + dx * size - 3), Math.round(FLOOR - h * 0.7), 6, 6)
    g.fillStyle = INK
    g.fillRect(Math.round(x + dx * size), Math.round(FLOOR - h * 0.7 + 2), 3, 3)
  }
  g.fillStyle = RAMPS.gold[3]
  g.fillRect(
    Math.round(x - 8 * size),
    Math.round(FLOOR - h - 8),
    Math.round(16 * size),
    4,
  )
}

/** A Laundry Kraken tentacle, from its machine down to the floor (or hanging, ready). */
export function drawTentacle(
  g: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  x: number,
  y: number,
  flash: boolean,
) {
  const ramp = flash ? RAMPS.cream : RAMPS.purple
  const steps = 10
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const px = fromX + (x - fromX) * t
    const py = fromY + (y - fromY) * t - Math.sin(t * Math.PI) * 12
    shadedOrb(g, px, py, 7 - t * 2, ramp, { glint: false })
  }
  for (let i = 1; i < steps; i += 2) {
    const t = i / steps
    g.fillStyle = RAMPS.pink[3]
    g.fillRect(
      Math.round(fromX + (x - fromX) * t),
      Math.round(fromY + (y - fromY) * t - Math.sin(t * Math.PI) * 12 + 3),
      2,
      2,
    )
  }
}

/** The Laundry Kraken's head, risen from the big machine, a sock for a hat. */
export function drawKrakenHead(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  stunned: boolean,
  flash: boolean,
  tick: number,
) {
  const ramp = flash ? RAMPS.cream : RAMPS.purple
  glow(g, x, y, 34, stunned ? RAMPS.gold[3] : RAMPS.pink[3], 0.35)
  shadedOrb(g, x, y, 18, ramp)
  for (const dx of [-7, 7]) {
    g.fillStyle = '#ffffff'
    g.fillRect(x + dx - 3, y - 6, 6, stunned ? 2 : 6)
    if (!stunned) {
      g.fillStyle = INK
      g.fillRect(x + dx - 1, y - 4, 3, 3)
    }
  }
  g.fillStyle = INK
  g.fillRect(x - 5, y + 6, 10, 3)
  // The sock.
  bevel(g, x - 10, y - 26, 20, 8, RAMPS.ember, { depth: 1 })
  bevel(g, x + 4, y - 32, 8, 8, RAMPS.ember, { depth: 1 })
  g.fillStyle = '#ffffff'
  g.fillRect(x - 9, y - 22, 18, 1)
  if (stunned)
    for (let i = 0; i < 3; i++) {
      const a = tick / 6 + i * 2.1
      g.fillStyle = RAMPS.gold[4]
      g.fillRect(
        Math.round(x + Math.cos(a) * 16),
        Math.round(y - 28 + Math.sin(a) * 3),
        2,
        2,
      )
    }
}

/** A flung sock. */
export function drawSock(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  tick: number,
) {
  const flip = Math.floor(tick / 5) % 2 ? 1 : -1
  g.fillStyle = INK
  g.fillRect(x - 4, y - 4, 7, 9)
  g.fillStyle = RAMPS.ember[3]
  g.fillRect(x - 3, y - 3, 4, 6)
  g.fillRect(x - 3 + (flip > 0 ? 1 : -1), y + 2, 5, 2)
  g.fillStyle = '#ffffff'
  g.fillRect(x - 3, y - 3, 4, 1)
}

/** A boss's name and a gauge of what's left of it, along the top of the deck view. */
export function drawBossBar(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  name: string,
  frac: number,
) {
  bevel(g, x, y, w, 12, RAMPS.night, { depth: 1 })
  drawText(g, name, x + 4, y + 3, { color: RAMPS.pink[3], outline: INK })
  const gx = x + name.length * 6 + 10
  g.fillStyle = INK
  g.fillRect(gx - 1, y + 3, x + w - gx - 3, 6)
  bandedGradient(
    g,
    gx,
    y + 4,
    Math.max(0, Math.round((x + w - gx - 5) * frac)),
    4,
    [RAMPS.pink[4], RAMPS.pink[3], RAMPS.pink[2]],
    1,
  )
}
