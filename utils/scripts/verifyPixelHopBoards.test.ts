import assert from 'node:assert/strict'
import {
  RULES,
  prismComplete,
  speedPaintBonus,
  speedPaintPar,
  stripeComplete,
  bridgeBoard,
  cellKey,
  boardRows,
  endlessFoes,
  endlessPressure,
  hopTile,
  miniMap,
  paintPicture,
  pictureProgress,
  pyramidBoard,
  resolveTile,
  tileDone,
  withSpecial,
} from '../arcade/games/pixelHopBoards'

const p7 = pyramidBoard(7)
assert.equal(p7.cells.length, 28, 'legacy pyramid is 28 cubes')
assert.equal(pyramidBoard(8).cells.length, 36)
assert.equal(new Set(p7.cells.map((c) => cellKey(c.r, c.c))).size, 28)

assert.equal(hopTile(RULES.one, 0), 1)
assert.equal(hopTile(RULES.one, 1), 1, 'one-hop tiles stay painted')
assert.equal(hopTile(RULES.two, 0), 1)
assert.equal(hopTile(RULES.two, 1), 2)
assert.ok(tileDone(RULES.two, 2) && !tileDone(RULES.two, 1))
assert.equal(hopTile(RULES.flip, 1), 0, 'flip returns a finished tile')
assert.equal(hopTile(RULES.both, 2), 0)
let level = 0
const seen: number[] = []
for (let i = 0; i < 8; i++) seen.push((level = hopTile(RULES.cycle, level)))
assert.deepEqual(seen, [1, 2, 3, 0, 1, 2, 3, 0], 'cycle wraps')
assert.ok(!tileDone(RULES.cycle, 0))

const target = [1, 2, 1, 3]
const painted = [0, 0, 0, 0]
assert.equal(paintPicture(target, painted, 1, 2), true)
assert.equal(paintPicture(target, painted, 0, 3), false)
assert.deepEqual(pictureProgress(target, painted), {
  right: 1,
  total: 4,
  done: false,
})
paintPicture(target, painted, 0, 1)
paintPicture(target, painted, 2, 1)
paintPicture(target, painted, 3, 3)
assert.ok(pictureProgress(target, painted).done)
assert.deepEqual(miniMap(pyramidBoard(2), [1, 0, 2]), ['a', '.b'])

assert.deepEqual(resolveTile(p7, { r: 0, c: 0 }, 2), { r: 1, c: 0 })
const spring = withSpecial(p7, [[1, 0, 'spring']])
assert.deepEqual(resolveTile(spring, { r: 0, c: 0 }, 2), { r: 3, c: 0 })
const ice = withSpecial(p7, [[1, 1, 'ice']])
assert.deepEqual(resolveTile(ice, { r: 0, c: 0 }, 1), { r: 2, c: 2 })
const edgeIce = withSpecial(p7, [[6, 6, 'ice']])
assert.equal(resolveTile(edgeIce, { r: 5, c: 5 }, 1), null, 'ice slides off')
const belt = withSpecial(p7, [[1, 0, 'conveyor']])
assert.deepEqual(resolveTile(belt, { r: 0, c: 0 }, 2), { r: 2, c: 1 })
assert.equal(resolveTile(p7, { r: 0, c: 0 }, 0), null, 'off the top falls')
assert.throws(() => withSpecial(p7, [[9, 9, 'star']]))
assert.equal(bridgeBoard(5).cells.length, 5)

assert.equal(endlessFoes(1).length, 4)
assert.equal(endlessFoes(4).length, 4)
assert.equal(endlessFoes(5).length, 5)
assert.ok(endlessFoes(13).length > endlessFoes(12).length)
assert.equal(endlessFoes(999).length, 10)

const old = endlessPressure(12)
assert.deepEqual(
  [old.maxEnemies, old.hopTrim, old.dropTrim, old.gremlinBonus],
  [4, 0, 0, 0],
  'rounds up to 12 are unchanged',
)
const late = endlessPressure(40)
assert.ok(late.maxEnemies > 4 && late.hopTrim > 0 && late.dropTrim > 0)
assert.ok(endlessPressure(24).hopTrim > endlessPressure(16).hopTrim)
assert.ok(endlessPressure(9999).maxEnemies <= 6, 'pressure is capped')

console.log('Pixel Hop boards, rule engine and tile effects passed')

assert.equal(boardRows(1), 7)
assert.equal(boardRows(3), 7)
assert.equal(boardRows(4), 8, 'the wide pyramid remixes every 4th round')
assert.equal(boardRows(8), 8)
assert.equal(pyramidBoard(boardRows(4)).cells.length, 36)

{
  const b = pyramidBoard(4)
  const done = b.cells.map(() => false)
  const at = (r: number, c: number) =>
    b.cells.findIndex((x) => x.r === r && x.c === c)
  done[at(2, 0)] = done[at(2, 1)] = true
  assert.equal(stripeComplete(b, done, { r: 2, c: 1 }), false, 'row 2 has 3')
  done[at(2, 2)] = true
  assert.equal(stripeComplete(b, done, { r: 2, c: 2 }), true, 'full row')
  assert.equal(stripeComplete(b, done, { r: 9, c: 0 }), false, 'off board')

  const d2 = b.cells.map(() => false)
  d2[at(1, 0)] = d2[at(2, 0)] = d2[at(2, 1)] = true
  assert.equal(prismComplete(b, d2, { r: 1, c: 0 }), true, 'filled triangle')
  assert.equal(prismComplete(b, d2, { r: 3, c: 0 }), false, 'unpainted')
  d2[at(2, 1)] = false
  assert.equal(prismComplete(b, d2, { r: 1, c: 0 }), false, 'missing corner')

  const par = speedPaintPar(pyramidBoard(7), RULES.one)
  assert.equal(par, 28 * 22)
  assert.ok(speedPaintPar(pyramidBoard(7), RULES.two) > par)
  assert.equal(speedPaintBonus(par + 1, par), 0)
  assert.ok(speedPaintBonus(par / 2, par) > speedPaintBonus(par - 1, par))
  assert.ok(speedPaintBonus(0, par) <= 5000)
  console.log('Pixel Hop combos passed')
}
