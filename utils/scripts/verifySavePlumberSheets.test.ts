import assert from 'node:assert/strict'
import { PLUMBER_ART } from '../arcade/games/savePlumberArt'
import { frameSpans, keyedSheet } from '../arcade/games/savePlumberSheets'

function sheet(width: number, height: number, blocks: [number, number][]) {
  return (x: number, y: number) =>
    y > 2 && y < height - 2 && blocks.some(([l, r]) => x >= l && x <= r)
      ? 255
      : 0
}

const six: [number, number][] = [
  [10, 40],
  [60, 92],
  [110, 140],
  [160, 190],
  [210, 241],
  [260, 290],
]
assert.deepEqual(
  frameSpans(sheet(300, 60, six), 300, 60, 6),
  six.map(([left, right]) => ({ left, right })),
)

const withSparkle: [number, number][] = [
  ...six.slice(0, 3),
  [143, 144],
  ...six.slice(3),
]
assert.deepEqual(
  frameSpans(sheet(300, 60, withSparkle), 300, 60, 6)?.[2],
  { left: 110, right: 144 },
  'a stray sparkle joins its nearest frame',
)

const touching: [number, number][] = [[10, 92], ...six.slice(2)]
assert.equal(
  frameSpans(sheet(300, 60, touching), 300, 60, 6),
  null,
  'two frames that touch are rejected, not mis-sliced',
)
assert.equal(
  frameSpans(() => 0, 100, 40, 6),
  null,
)

assert.equal(
  PLUMBER_ART.anim('heroine-a-run'),
  '/images/arcade/save-the-plumber/anim/heroine-a-run.webp',
)
assert.equal(keyedSheet(PLUMBER_ART.anim('heroine-a-run'), 6), null)

console.log(
  'Save the Plumber sprite sheets: frame slicing and fallbacks verified',
)
