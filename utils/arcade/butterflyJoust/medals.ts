// /utils/arcade/butterflyJoust/medals.ts
//
// Butterfly Joust's medals (conductor kr-arcade/t-050, the Four Gardens Tourney's slice 4). Every
// tourney wave has three to win:
//
//   Unbonked     the wave cleared without losing a butterfly (in a party: nobody lost one).
//   Air Ace      an Air Combo of x4 in the wave (four bonks before landing).
//   Quick Lance  the wave cleared under its par time.
//
// A champion's bout has no Air Ace (there is only the one rider to bonk), so it offers two. The
// medal board keeps them per garden, wave by wave, in the save, and the board's cells are this
// file's data. Par is data too: a wave's par comes from its riders and its kind, a bout's from
// its champion.

import { drawText } from '../font'
import { INK, RAMPS, glow, rgba, shadedOrb, type Ramp } from '../snes'
import {
  ARENAS,
  RAINBOW_LISTS,
  type Arena,
  type ArenaId,
  type ChampionId,
} from './arenas'
import { LANTERN_WAVE, COMBO_ACE, type WaveKind } from './rules'

export type MedalId = 'unbonked' | 'ace' | 'quick'
export const MEDAL_IDS: readonly MedalId[] = ['unbonked', 'ace', 'quick']

export const MEDALS: Record<
  MedalId,
  { bit: number; title: string; blurb: string; ramp: Ramp }
> = {
  unbonked: {
    bit: 1,
    title: 'UNBONKED',
    blurb: 'NO BUTTERFLY LOST',
    ramp: RAMPS.teal,
  },
  ace: {
    bit: 2,
    title: 'AIR ACE',
    blurb: `AN X${COMBO_ACE} AIR COMBO`,
    ramp: RAMPS.pink,
  },
  quick: {
    bit: 4,
    title: 'QUICK LANCE',
    blurb: 'CLEARED UNDER PAR',
    ramp: RAMPS.gold,
  },
}

/** Medals won, by cell (medalKey): a bit for each (MEDALS[id].bit). */
export type MedalBoard = Record<string, number>

/** What each medal pays at the wave's bell, shared round the party. */
export const MEDAL_PAY = 500

/** A board cell's key: the garden and its wave (the bout is the wave after the last). */
export function medalKey(arena: ArenaId, wave: number): string {
  return `${arena}-${wave}`
}

export function medalCount(bits: number): number {
  return (bits & 1) + ((bits >> 1) & 1) + ((bits >> 2) & 1)
}

/** One cell on the board: a wave, or a champion's bout (which has no Air Ace). */
export type BoardCell = { key: string; wave: number; bout: boolean }
export type BoardRow = { arena: Arena; cells: BoardCell[] }

/** The board's rows: every garden in tourney order, then the Rainbow Lists. */
export function boardRows(): BoardRow[] {
  return [...ARENAS, RAINBOW_LISTS].map((arena) => {
    const cells: BoardCell[] = arena.waves.map((_, i) => ({
      key: medalKey(arena.id, i + 1),
      wave: i + 1,
      bout: false,
    }))
    if (arena.champion)
      cells.push({
        key: medalKey(arena.id, arena.waves.length + 1),
        wave: arena.waves.length + 1,
        bout: true,
      })
    return { arena, cells }
  })
}

/** The medals a cell offers. */
export function cellMedals(cell: Pick<BoardCell, 'bout'>): readonly MedalId[] {
  return cell.bout ? ['unbonked', 'quick'] : MEDAL_IDS
}

/** Medals won against medals there are, across the whole board. */
export function boardTotal(board: MedalBoard): { won: number; of: number } {
  let won = 0
  let of = 0
  for (const row of boardRows())
    for (const cell of row.cells) {
      won += medalCount(board[cell.key] ?? 0)
      of += cellMedals(cell).length
    }
  return { won, of }
}

/** A saved board, checked cell by cell: unknown cells and stray bits are dropped. */
export function readMedals(raw: unknown): MedalBoard {
  const board: MedalBoard = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return board
  const saved = raw as Record<string, unknown>
  for (const row of boardRows())
    for (const cell of row.cells) {
      const bits = saved[cell.key]
      if (typeof bits !== 'number' || !Number.isInteger(bits)) continue
      const mask = cellMedals(cell).reduce((m, id) => m | MEDALS[id].bit, 0)
      if (bits & mask) board[cell.key] = bits & mask
    }
  return board
}

// --- par --------------------------------------------------------------------------------------

/** A champion's bout par, in seconds. */
export const CHAMPION_PAR: Record<ChampionId, number> = {
  bumbleton: 90,
  duchess: 90,
  thunderhead: 75,
  kite: 100,
  queen: 45,
  mirror: 70,
}

/** A wave's par, in seconds: a little for the bell, and more for each rider and each chore. */
export const WAVE_PAR = {
  base: 6,
  perRider: 3.5,
  /** Scooping eight cocoons from round the ledges. */
  cocoon: 24,
  /** Hunting the Thundercap as well as the riders. */
  storm: 6,
} as const

/** The par for a tourney wave, in ticks (the bout is the wave after the last). */
export function parTicks(arena: Arena, wave: number): number {
  const spec = arena.waves[wave - 1]
  if (!spec) return arena.champion ? CHAMPION_PAR[arena.champion] * 60 : 60 * 60
  return waveParSeconds(spec.kind, spec.riders.length) * 60
}

export function waveParSeconds(kind: WaveKind, riders: number): number {
  let par = WAVE_PAR.base + WAVE_PAR.perRider * riders
  if (kind === 'cocoon') par += WAVE_PAR.cocoon
  if (kind === 'storm') par += WAVE_PAR.storm
  if (kind === 'lantern')
    par = Math.max(par, (LANTERN_WAVE.count * LANTERN_WAVE.every) / 60 + 12)
  return Math.round(par)
}

// --- drawing ----------------------------------------------------------------------------------

/** One medal: a shaded disc on a ribbon when won, an empty socket when not. */
export function drawMedal(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  id: MedalId,
  won: boolean,
  size = 3,
) {
  const m = MEDALS[id]
  if (!won) {
    g.fillStyle = INK
    g.fillRect(x - size, y - size, size * 2 + 1, size * 2 + 1)
    g.fillStyle = rgba(RAMPS.steel[2], 0.5)
    g.fillRect(x - size + 1, y - size + 1, size * 2 - 1, size * 2 - 1)
    return
  }
  g.fillStyle = INK
  g.fillRect(x - size + 1, y - size - 3, size * 2 - 1, 4)
  g.fillStyle = m.ramp[1]
  g.fillRect(x - size + 2, y - size - 2, size - 1, 3)
  g.fillStyle = m.ramp[3]
  g.fillRect(x + 1, y - size - 2, size - 2, 3)
  shadedOrb(g, x, y, size, m.ramp)
}

/** A big medal for the wave's bell: the disc, a glow, its name underneath. */
export function drawMedalBadge(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  id: MedalId,
  fresh: boolean,
  tick: number,
) {
  const m = MEDALS[id]
  if (fresh) glow(g, x, y, 18 + Math.sin(tick / 6) * 3, m.ramp[3], 0.5)
  drawMedal(g, x, y, id, true, 7)
  // A star stamped on the disc.
  g.fillStyle = m.ramp[4]
  g.fillRect(x - 1, y - 3, 2, 6)
  g.fillRect(x - 3, y - 1, 6, 2)
  drawText(g, m.title, x, y + 11, {
    align: 'center',
    color: fresh ? '#ffffff' : m.ramp[3],
    outline: INK,
  })
  if (fresh)
    drawText(g, 'NEW', x, y + 21, {
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    })
}
