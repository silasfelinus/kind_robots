// /utils/arcade/cableCrawler/tangleArenas.ts
//
// Cable Crawler's Tangle arenas (conductor kr-arcade/t-068): four mazes drawn for two to four
// cables at once. Each is mirrored left to right and top to bottom, so every seat starts as far
// from the sockets as every other: player 1 at the bottom middle (the maze's 'P'), player 2 at
// the top middle, players 3 and 4 at the left and right middles. Every corridor sits on a loop,
// so a cable is never sent down a dead end it cannot back out of. Each arena borrows a
// component's look, sparks and music. Content is data; tangleMatch.ts plays it.

import type { MazeLayout } from './mazes'
import { COLS, ROWS, cellKey } from './mazes'

export type TangleArena = {
  layout: MazeLayout
  /** The component whose look, spark set and music the arena wears (COMPONENTS index). */
  comp: number
  /** Team Tangle's shared battery on this arena, in seconds, before the lap ramp. */
  battery: number
  /** Where each seat's plug starts, player 1 first. */
  seats: readonly number[]
}

const MID = COLS >> 1

/** The seats every arena uses: bottom middle, top middle, left middle, right middle. */
export const ARENA_SEATS: readonly number[] = [
  cellKey(MID, ROWS - 2),
  cellKey(MID, 1),
  cellKey(1, ROWS >> 1),
  cellKey(COLS - 2, ROWS >> 1),
]

/**
 * A mirrored arena from its top-left quarter: the ten top rows of the left half and the middle
 * column. The bottom half is the top turned over, with player 1's 'P' at the bottom middle.
 */
function quartered(top: readonly string[]): string[] {
  const rows = [...top]
  for (let y = top.length - 2; y >= 0; y--) rows.push(top[y]!)
  const last = rows.length - 2
  rows[last] = `${rows[last]!.slice(0, MID)}P`
  return rows
}

export const TANGLE_ARENAS: readonly TangleArena[] = [
  {
    comp: 0,
    battery: 80,
    seats: ARENA_SEATS,
    layout: {
      id: 'tangle-1',
      name: 'PATCH BAY',
      mirror: true,
      rows: quartered([
        '############',
        '#. . . .#.  ',
        '# ### # # # ',
        '#.#S . . .#.',
        '# # ### ### ',
        '#. .#. . . .',
        '### # ### ##',
        '#. . .#. . .',
        '# ### # # ##',
        '#  . .#. . $',
      ]),
    },
  },
  {
    comp: 1,
    battery: 80,
    seats: ARENA_SEATS,
    layout: {
      id: 'tangle-2',
      name: 'RIBBON CABLE',
      mirror: true,
      rows: quartered([
        '############',
        '#. . . . .  ',
        '# ##### ####',
        '#. S . . . .',
        '##### ##### ',
        '#. . . . . .',
        '# ### ### # ',
        '#. . . . .#.',
        '# ####### # ',
        '#  . . . . $',
      ]),
    },
  },
  {
    comp: 2,
    battery: 75,
    seats: ARENA_SEATS,
    layout: {
      id: 'tangle-3',
      name: 'HEATSINK FINS',
      mirror: true,
      rows: quartered([
        '############',
        '#. . . . .  ',
        '# # # # # # ',
        '#.#.#S#.#.#.',
        '# # # # # # ',
        '#.#.#.#.#.#.',
        '# # # # # # ',
        '#.#.#.#.#.#.',
        '# # # # # # ',
        '#  . . . . $',
      ]),
    },
  },
  {
    comp: 3,
    battery: 85,
    seats: ARENA_SEATS,
    layout: {
      id: 'tangle-4',
      name: 'SPEAKER RINGS',
      mirror: true,
      rows: quartered([
        '############',
        '#. . . . .  ',
        '# ######### ',
        '#.#########.',
        '# ######### ',
        '#.###S . . .',
        '# ### ######',
        '#.###.###. .',
        '# ### ### ##',
        '#  . . . . $',
      ]),
    },
  },
]
