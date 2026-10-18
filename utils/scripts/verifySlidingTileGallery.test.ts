import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  adjacentTileIndices,
  makeSlidingTilePuzzle,
  puzzleIsSolved,
  restoreSlidingTilePuzzle,
  slideTile,
  utcPuzzleDay,
  type SlidingTilePuzzle,
} from '../slidingTileGallery/engine'

const day = utcPuzzleDay(new Date('2026-10-13T12:00:00Z'))
assert.equal(day, '2026-10-13')

const a = makeSlidingTilePuzzle(day)
const b = makeSlidingTilePuzzle(day)
assert.deepEqual(a.tiles, b.tiles, 'same UTC day always generates same puzzle')
assert.equal(a.tiles.length, 9)
assert.deepEqual(
  [...a.tiles].sort((x, y) => x - y),
  [0, 1, 2, 3, 4, 5, 6, 7, 8],
)
assert.equal(puzzleIsSolved(a.tiles), false, 'first board must need solving')
assert.notDeepEqual(
  makeSlidingTilePuzzle('2026-10-14').tiles,
  a.tiles,
  'daily board should change between consecutive days',
)

function inversionCount(tiles: readonly number[]) {
  let inversions = 0
  for (let x = 0; x < tiles.length; x += 1) {
    for (let y = x + 1; y < tiles.length; y += 1) {
      if (tiles[x] && tiles[y] && tiles[x]! > tiles[y]!) inversions += 1
    }
  }
  return inversions
}
for (const board of [a, makeSlidingTilePuzzle(day, 'practice', 'seed-1')]) {
  assert.equal(inversionCount(board.tiles) % 2, 0)
}

assert.deepEqual(adjacentTileIndices(0).sort(), [1, 3])
assert.deepEqual(adjacentTileIndices(4).sort(), [1, 3, 5, 7])
assert.deepEqual(adjacentTileIndices(8).sort(), [5, 7])
assert.deepEqual(adjacentTileIndices(15), [])

const next = slideTile(a, adjacentTileIndices(a.tiles.indexOf(0))[0]!)
assert.equal(next.moves, 1)
assert.notDeepEqual(next.tiles, a.tiles)
assert.equal(a.moves, 0)
const forbidden = a.tiles.findIndex(
  (_, index) => !adjacentTileIndices(a.tiles.indexOf(0)).includes(index),
)
assert.equal(slideTile(a, forbidden), a, 'illegal move preserves identity')

const nearlySolved: SlidingTilePuzzle = {
  key: 'daily:2026-10-13',
  day,
  mode: 'daily',
  tiles: [1, 2, 3, 4, 5, 6, 7, 0, 8],
  moves: 7,
  solved: false,
}
const solved = slideTile(nearlySolved, 8)
assert.equal(solved.solved, true)
assert.equal(solved.moves, 8)
assert.equal(slideTile(solved, 7), solved)
assert.deepEqual(restoreSlidingTilePuzzle(solved), solved)
assert.equal(
  restoreSlidingTilePuzzle({ ...solved, tiles: [1, 1, 2, 3, 4, 5, 6, 7, 0] }),
  null,
)
assert.equal(restoreSlidingTilePuzzle({ ...solved, solved: false }), null)
assert.equal(restoreSlidingTilePuzzle({ ...solved, moves: -1 }), null)

const page = readFileSync('pages/play/sliding-tile-gallery.vue', 'utf8')
const tab = readFileSync(
  'content/channels/arcade/sliding-tile-gallery.md',
  'utf8',
)
const placements = readFileSync('utils/projectPlacements.ts', 'utf8')
const store = readFileSync('stores/slidingTileGalleryStore.ts', 'utf8')

assert.doesNotMatch(tab, /requiredRole: ADMIN/)
assert.match(tab, /route: \/play\/sliding-tile-gallery/)
assert.doesNotMatch(page, /v-else-if="!user\.isAdmin"/)
assert.match(tab, /Work in progress/)
assert.match(page, /gallery\.move\(index\)/)
assert.match(page, /gallery\.keepsakes/)
assert.match(page, /v-if="gallery\.puzzle\.solved"/)
assert.match(page, /A mystery postcard awaits/)

assert.doesNotMatch(page, /\blocalStorage\b/)
assert.match(store, /localStorage\.setItem/)
assert.match(placements, /'kind-sliding-tile-gallery'/)

console.log('verifySlidingTileGallery: ok')
