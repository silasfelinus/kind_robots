import assert from 'node:assert/strict'
import {
  RULES,
  bridgeBoard,
  cellKey,
  endlessFoes,
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

console.log('Pixel Hop boards, rule engine and tile effects passed')
