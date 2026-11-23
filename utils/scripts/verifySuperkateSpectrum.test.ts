import assert from 'node:assert/strict'
import {
  COLS,
  ROWS,
  activeHues,
  attachAndPop,
  fireSpecial,
  center,
  chooseHue,
  emptyBoard,
  makeBoard,
  nearestSnap,
  neighbors,
  pushCeiling,
} from '../arcade/superkateSpectrum/board'
import { emptyInput } from '../arcade/types'
import {
  rankForXp,
  recordClassicEnd,
  recordClear,
  recordPop,
  readSpectrumSave,
  styleForRank,
} from '../arcade/superkateSpectrum/progress'
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
assert.equal(
  pushCeiling(pushed, () => 0),
  true,
)
assert.equal(
  pushed[0]!.every((hue) => hue === 'pink'),
  true,
)
const palette = makeBoard(30, () => 0.99)
assert.ok(activeHues(palette).includes('lime'))
assert.equal(
  chooseHue(palette, () => 0),
  'lime',
)
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
const vintage = readSpectrumSave({
  version: 1,
  stage: 12,
  score: 3500,
  lives: 2,
})
assert.equal(vintage.career.highestStage, 12)
assert.equal(vintage.stage, 12)
const resumed = create({
  ...options,
  resume: {
    version: 2,
    career: {
      xp: 9000,
      highestStage: 12,
      stars: Array(30).fill(2),
      lifetimePops: 550,
      classicBest: 1200,
      classicRuns: 4,
    },
    mode: 'story',
    stage: 12,
  },
} as Parameters<typeof create>[0])
assert.equal(resumed.level, 12)
assert.equal(resumed.save.career.highestStage, 12)
assert.equal(resumed.save.career.xp, 9000)
assert.equal(rankForXp(0), 1)
assert.ok(rankForXp(9000) > rankForXp(100))
assert.equal(styleForRank(1), 'glass')
assert.equal(styleForRank(4), 'candy')
assert.equal(styleForRank(9), 'starlight')
assert.equal(styleForRank(15), 'prismatic')
const achieved = recordClear(vintage.career, 12, 8, 18)
assert.equal(achieved.highestStage, 13)
assert.equal(achieved.stars[11], 3)
assert.equal(vintage.career.stars[11], 0, 'Old save stays immutable')
assert.equal(recordClear(achieved, 12, 40, 1).stars[11], 3)
const replay = recordPop(achieved, 3, 7)
assert.equal(replay.lifetimePops, 10)
assert.ok(replay.xp > achieved.xp)
assert.equal(recordClassicEnd(replay, 4200).classicBest, 4200)
assert.equal(recordClassicEnd(replay, 4200).classicRuns, 1)
const invalid = readSpectrumSave({
  version: 2,
  career: {
    xp: -1,
    highestStage: 1000,
    stars: Array(2).fill(10),
    lifetimePops: Infinity,
    classicBest: -1,
    classicRuns: -1,
  },
  mode: 'story',
  stage: 9000,
})
assert.equal(invalid.career.highestStage, 1)
assert.equal(invalid.career.xp, 0)
assert.equal(invalid.career.stars.length, 30)
assert.equal(invalid.stage, 1)
const prism = emptyBoard()
prism[0]![0] = 'pink'
prism[0]![1] = 'pink'
assert.deepEqual(
  fireSpecial(prism, { row: 1, col: 0 }, 'blue', 'prism'),
  { matched: 3, dropped: 0, cleared: true },
)
const burst = emptyBoard()
burst[0]![0] = 'gold'
burst[0]![1] = 'teal'
burst[1]![0] = 'lime'
const blast = fireSpecial(burst, { row: 1, col: 1 }, 'pink', 'burst')
assert.ok(blast.matched >= 3)
assert.equal(blast.cleared, true)
const ribbon = emptyBoard()
ribbon[0]![0] = 'pink'
ribbon[1]![0] = 'lime'
const wave = fireSpecial(ribbon, { row: 1, col: 1 }, 'blue', 'ribbon')
assert.equal(wave.matched, 2)
assert.equal(wave.dropped, 0)
assert.equal(ribbon[0]![0], 'pink')
const classic = create({
  ...options,
  resume: {
    version: 2,
    career: replay,
    mode: 'classic',
    stage: 1,
  },
} as Parameters<typeof create>[0])
assert.equal(classic.level, 1)
assert.equal(classic.save.career.xp, replay.xp)
const start = emptyInput()
start.pressed.a = true
classic.update(start)
assert.equal(classic.menuOpen, false)
assert.equal(classic.save.mode, 'classic')
assert.equal(classic.save.career.highestStage, replay.highestStage)
assert.equal(classic.over, false)
console.log('Superkate Spectrum: board, powers, career, Classic and save checks passed')
