// /utils/zuzuShowdown/select.ts
//
// Zuzu Showdown character select (conductor zuzu-showdown t-019): the arcade
// grid between the title and the VS screen. Two cursors, P1's and P2's, move
// over the roster in rows of SELECT_COLUMNS, wrapping at the edges. LP or
// Start picks the fighter under a cursor; HP takes a pick back. With two
// players each drives their own cursor; with one (against the CPU or the
// training dummy) P1 picks their fighter and then the opponent's. Pure: the
// stage component feeds it each frame's presses and draws it with
// screens.ts drawSelectScreen.

/** Fighters per row on the select grid. */
export const SELECT_COLUMNS = 4

export type SelectPress = Partial<
  Record<'up' | 'down' | 'left' | 'right' | 'lp' | 'hp' | 'start', boolean>
>

export type SelectState = {
  /** Each side's cursor, an index into the roster. */
  cursor: [number, number]
  picked: [boolean, boolean]
  /** Frames since the screen opened (the cursors' blink). */
  frame: number
}

/** The grid with each cursor on that side's current fighter. */
export function newSelect(
  slugs: readonly string[],
  fighters: readonly [string, string],
): SelectState {
  const at = (slug: string, fallback: number) => {
    const index = slugs.indexOf(slug)
    return index >= 0 ? index : fallback
  }
  return {
    cursor: [
      at(fighters[0], 0),
      at(fighters[1], Math.min(1, slugs.length - 1)),
    ],
    picked: [false, false],
    frame: 0,
  }
}

/** Where a cursor lands after this frame's direction presses, wrapping. */
function moved(index: number, press: SelectPress, count: number): number {
  let next = index
  if (press.left) next -= 1
  if (press.right) next += 1
  if (press.up) next -= SELECT_COLUMNS
  if (press.down) next += SELECT_COLUMNS
  return ((next % count) + count) % count
}

/** The side a single player is choosing for: their own, then the opponent's. */
export function activeSide(s: SelectState): 0 | 1 {
  return s.picked[0] ? 1 : 0
}

/** One frame of the select screen. */
export function advanceSelect(
  s: SelectState,
  presses: [SelectPress, SelectPress],
  count: number,
  twoPlayers: boolean,
): SelectState {
  const next: SelectState = {
    cursor: [...s.cursor],
    picked: [...s.picked],
    frame: s.frame + 1,
  }
  const sides: Array<[0 | 1, SelectPress]> = twoPlayers
    ? [
        [0, presses[0]],
        [1, presses[1]],
      ]
    : [[activeSide(s), presses[0]]]
  for (const [side, press] of sides) {
    if (press.hp) {
      // Back: un-pick this side, or for a lone player still on the opponent, their own pick.
      if (next.picked[side]) next.picked[side] = false
      else if (!twoPlayers && side === 1) next.picked[0] = false
      continue
    }
    if (next.picked[side]) continue
    if (press.lp || press.start) {
      next.picked[side] = true
      continue
    }
    next.cursor[side] = moved(next.cursor[side], press, count)
  }
  return next
}

/** Both fighters chosen: on to the VS screen. */
export function selectDone(s: SelectState): boolean {
  return s.picked[0] && s.picked[1]
}
