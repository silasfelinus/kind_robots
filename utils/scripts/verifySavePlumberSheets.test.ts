import assert from 'node:assert/strict'
import { PLUMBER_ART } from '../arcade/games/savePlumberArt'
import { frameBoxes, keyedSheet } from '../arcade/games/savePlumberSheets'

type Rect = [number, number, number, number]

function sheet(rects: Rect[]) {
  return (x: number, y: number) =>
    rects.some(([l, t, r, b]) => x >= l && x <= r && y >= t && y <= b) ? 255 : 0
}

const six: Rect[] = [0, 1, 2, 3, 4, 5].map((i) => [
  10 + i * 50,
  10,
  40 + i * 50,
  50,
])
assert.deepEqual(
  frameBoxes(sheet(six), 320, 60, 6),
  six.map(([left, top, right, bottom]) => ({ left, top, right, bottom })),
)

const raisedHand: Rect[] = [
  [10, 20, 40, 55],
  [40, 5, 60, 20],
  [50, 22, 80, 55],
  [90, 20, 120, 55],
]
assert.deepEqual(
  frameBoxes(sheet(raisedHand), 130, 60, 3)?.map((b) => [b.left, b.right]),
  [
    [10, 60],
    [50, 80],
    [90, 120],
  ],
  'a raised hand over the next figure stays with its own figure',
)

const sparkle: Rect[] = [...six, [44, 4, 46, 6]]
assert.deepEqual(
  frameBoxes(sheet(sparkle), 320, 60, 6)?.[0],
  { left: 10, top: 4, right: 46, bottom: 50 },
  'a stray sparkle joins its nearest figure',
)

const touching: Rect[] = [[10, 10, 90, 50], ...six.slice(2)]
assert.equal(
  frameBoxes(sheet(touching), 320, 60, 6),
  null,
  'two figures that touch are rejected, not mis-sliced',
)
assert.equal(
  frameBoxes(() => 0, 100, 40, 6),
  null,
)

assert.equal(
  PLUMBER_ART.anim('heroine-a-run'),
  '/images/arcade/save-the-plumber/anim/heroine-a-run.webp',
)
assert.equal(keyedSheet(PLUMBER_ART.anim('heroine-a-run'), 6), null)

console.log(
  'Save the Plumber sprite sheets: shape slicing and fallbacks verified',
)
