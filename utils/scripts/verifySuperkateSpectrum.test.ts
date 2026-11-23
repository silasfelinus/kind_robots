import assert from 'node:assert/strict'
import {
  COLS,
  ROWS,
  activeHues,
  attachAndPop,
  center,
  chooseHue,
  emptyBoard,
  makeBoard,
  nearestSnap,
  neighbors,
  pushCeiling,
} from '../arcade/superkateSpectrum/board'
import { emptyInput } from '../arcade/types'
import { create } from '../arcade/games/superkateSpectrum'

const board = emptyBoard()
assert.equal(board.length, ROWS)
assert.equal(board[0]?.length, COLS)
assert.equal(neighbors({ row: 0, col: 0 }).length, 2)
assert.equal(neighbors({ row: 1, col: 0 }).length, 5)
assert.equal(neighbors({ row: 0, col: 9 }).length, 3)
assert.deepEqual(center({ row: 0, col: 0 }), { x: 22, y: 40 })
assert.deepEqual(center({ row: 1, col: 0 }), { x: 36, y: 64 })
board[0]![0] = 'pink'
board[0]![1] = 'pink'
board[1]![0] = 'teal'
board[2]![0] = 'teal'
assert.deepEqual(
  attachAndPop(board, { row: 1, col: 1 }, 'pink'),
  { matched: 3, dropped: 2, cleared: true },
  'A matching cluster pops and the disconnected branch falls',
)
assert.equal(activeHues(board).length, 0)
const noPop = emptyBoard()
noPop[0]![0] = 'gold'
assert.equal(attachAndPop(noPop, { row: 1, col: 0 }, 'teal').matched, 0)
assert.equal(noPop[1]![0], 'teal')
assert.equal(attachAndPop(noPop, { row: 1, col: 0 }, 'gold').matched, 0)
const snap = nearestSnap(noPop, { x: 22, y: 70 })
assert.ok(snap)
assert.equal(noPop[snap!.row]![snap!.col], null)
const pushed = emptyBoard()
pushed[ROWS - 1]![0] = 'pink'
assert.equal(pushCeiling(pushed), true)
assert.equal(pushed[0]!.some(Boolean), false)
const palette = makeBoard(30, () => 0.99)
assert.ok(activeHues(palette).includes('lime'))
assert.equal(chooseHue(palette, () => 0), 'lime')
const rng = () => 0.25
const options = {
  rng,
  demo: false,
  hiScore: 0,
  sound: {
    play: () => {},
  },
}
const game = create(options as Parameters<typeof create>[0])
assert.equal(game.level, 1)
assert.equal(game.over, false)
const input = emptyInput()
input.pressed.a = true
game.update(input)
assert.equal(game.level, 1)
assert.equal(game.over, false)
for (let i = 0; i < 90; i++) game.update(emptyInput())
assert.ok(game.score >= 0)
const resumed = create({
  ...options,
  resume: { version: 1, stage: 12, score: 3500, lives: 2 },
} as Parameters<typeof create>[0])
assert.equal(resumed.level, 12)
assert.equal(resumed.score, 3500)
assert.equal(resumed.lives, 2)
const invalid = create({
  ...options,
  resume: { version: 1, stage: 9000, score: -50, lives: 99 },
} as Parameters<typeof create>[0])
assert.equal(invalid.level, 1)
console.log('Superkate Spectrum: board, cascade, input and save checks passed')
