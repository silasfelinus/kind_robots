export const SLIDING_TILE_SIZE = 3
export const SOLVED_TILES = [1, 2, 3, 4, 5, 6, 7, 8, 0] as const

export type SlidingTilePuzzle = {
  key: string
  day: string
  mode: 'daily' | 'practice'
  tiles: number[]
  moves: number
  solved: boolean
}

export type SlidingTileKeepsake = {
  key: string
  day: string
  moves: number
  mode: SlidingTilePuzzle['mode']
}

export function utcPuzzleDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function puzzleSeed(key: string): number {
  let hash = 2166136261
  for (const char of key) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function puzzleIsSolved(tiles: readonly number[]): boolean {
  return (
    tiles.length === 9 &&
    SOLVED_TILES.every((value, index) => tiles[index] === value)
  )
}

export function adjacentTileIndices(blank: number): number[] {
  if (!Number.isInteger(blank) || blank < 0 || blank > 8) return []
  const row = Math.floor(blank / SLIDING_TILE_SIZE)
  const col = blank % SLIDING_TILE_SIZE
  return [
    row > 0 ? blank - SLIDING_TILE_SIZE : -1,
    row < 2 ? blank + SLIDING_TILE_SIZE : -1,
    col > 0 ? blank - 1 : -1,
    col < 2 ? blank + 1 : -1,
  ].filter((index) => index >= 0)
}

export function makeSlidingTilePuzzle(
  day: string,
  mode: SlidingTilePuzzle['mode'] = 'daily',
  variant = '',
): SlidingTilePuzzle {
  const key = mode === 'daily' ? `daily:${day}` : `practice:${variant}`
  let random = puzzleSeed(key) || 1
  const nextRandom = () => {
    random ^= random << 13
    random ^= random >>> 17
    random ^= random << 5
    return random >>> 0
  }
  const tiles: number[] = [...SOLVED_TILES]
  let previousBlank = -1
  for (let step = 0; step < 96; step += 1) {
    const blank = tiles.indexOf(0)
    const options = adjacentTileIndices(blank).filter(
      (index) => index !== previousBlank,
    )
    const selected = options[nextRandom() % options.length]!
    ;[tiles[blank], tiles[selected]] = [tiles[selected]!, tiles[blank]!]
    previousBlank = blank
  }
  if (puzzleIsSolved(tiles)) {
    const blank = tiles.indexOf(0)
    const selected = adjacentTileIndices(blank)[0]!
    ;[tiles[blank], tiles[selected]] = [tiles[selected]!, tiles[blank]!]
  }
  return { key, day, mode, tiles, moves: 0, solved: false }
}

export function slideTile(
  puzzle: SlidingTilePuzzle,
  index: number,
): SlidingTilePuzzle {
  if (puzzle.solved || !Number.isInteger(index)) return puzzle
  const blank = puzzle.tiles.indexOf(0)
  if (!adjacentTileIndices(blank).includes(index)) return puzzle
  const tiles = [...puzzle.tiles]
  ;[tiles[blank], tiles[index]] = [tiles[index]!, tiles[blank]!]
  return {
    ...puzzle,
    tiles,
    moves: puzzle.moves + 1,
    solved: puzzleIsSolved(tiles),
  }
}

export function restoreSlidingTilePuzzle(
  value: unknown,
): SlidingTilePuzzle | null {
  if (!value || typeof value !== 'object') return null
  const puzzle = value as Partial<SlidingTilePuzzle>
  if (
    (puzzle.mode !== 'daily' && puzzle.mode !== 'practice') ||
    typeof puzzle.key !== 'string' ||
    typeof puzzle.day !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(puzzle.day) ||
    !Array.isArray(puzzle.tiles) ||
    typeof puzzle.moves !== 'number' ||
    !Number.isInteger(puzzle.moves) ||
    puzzle.moves < 0 ||
    !puzzle.tiles.every((number) => Number.isInteger(number)) ||
    [...puzzle.tiles].sort((a, b) => a - b).join(',') !== '0,1,2,3,4,5,6,7,8' ||
    puzzle.solved !== puzzleIsSolved(puzzle.tiles)
  )
    return null
  return puzzle as SlidingTilePuzzle
}
