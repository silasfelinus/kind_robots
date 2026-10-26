/** Persist the player's INPUTS, never the concealed hazards.
 * A loaded archive floor is regenerated from the seed and replays only bounded
 * visible actions. That makes resume deterministic and avoids leaking mines.
 */
import {
  createMinefield,
  disarm,
  step,
  toggleFlag,
  type Cell,
  type MinefieldState,
} from './minefield'

export type MinefieldSize = 8 | 10
export type MinefieldMove = {
  action: 'step' | 'flag' | 'disarm'
  row: number
  col: number
}
export type MinefieldRun = {
  version: 1
  seed: number
  size: MinefieldSize
  moves: MinefieldMove[]
}

export const MINEFIELD_SITE = '2,7'
export const MINEFIELD_MAX_MOVES = 600
export function minefieldRewardKey(size: MinefieldSize): string {
  return `2,7:archive-${size}`
}

export function restoreMinefieldRun(value: unknown): MinefieldRun | null {
  if (!value || typeof value !== 'object') return null
  const source = value as Partial<MinefieldRun>
  if (source.version !== 1 || (source.size !== 8 && source.size !== 10))
    return null
  if (
    !Number.isSafeInteger(source.seed) ||
    source.seed! < 0 ||
    source.seed! > 1000000
  )
    return null
  if (!Array.isArray(source.moves) || source.moves.length > MINEFIELD_MAX_MOVES)
    return null
  const moves: MinefieldMove[] = []
  for (const item of source.moves) {
    if (
      !item ||
      !['step', 'flag', 'disarm'].includes(item.action) ||
      !Number.isInteger(item.row) ||
      !Number.isInteger(item.col) ||
      item.row < 0 ||
      item.col < 0 ||
      item.row >= source.size ||
      item.col >= source.size
    )
      return null
    moves.push({ action: item.action, row: item.row, col: item.col })
  }
  return { version: 1, seed: source.seed!, size: source.size, moves }
}

export function createMinefieldRun(
  seed: number,
  size: MinefieldSize,
): MinefieldRun {
  return { version: 1, seed, size, moves: [] }
}

export function playMinefieldRun(run: MinefieldRun): MinefieldState {
  const state = createMinefield({
    seed: run.seed,
    rows: run.size,
    cols: run.size,
    hazards: run.size === 8 ? 10 : 16,
    hearts: 3,
    disarms: run.size === 8 ? 2 : 3,
  })
  let current = state
  for (const move of run.moves) {
    if (current.outcome !== 'exploring') break
    const cell: Cell = { row: move.row, col: move.col }
    current =
      move.action === 'step'
        ? step(current, cell)
        : move.action === 'flag'
          ? toggleFlag(current, cell)
          : disarm(current, cell)
  }
  return current
}

export function advanceMinefieldRun(
  run: MinefieldRun,
  move: MinefieldMove,
): MinefieldRun {
  if (
    run.moves.length >= MINEFIELD_MAX_MOVES ||
    playMinefieldRun(run).outcome !== 'exploring'
  )
    return run
  if (!restoreMinefieldRun({ ...run, moves: [move] })) return run
  return { ...run, moves: [...run.moves, move] }
}
