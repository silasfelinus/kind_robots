import assert from 'node:assert/strict'
import { rainbowEndingArchive } from '../arcade/games/rainbowEndingArchive'

const fresh = rainbowEndingArchive([])
assert.deepEqual(
  fresh.map((entry) => entry.choice),
  ['restore', 'evacuate', 'sever'],
)
assert.equal(fresh.filter((entry) => entry.unlocked).length, 0)

const earned = rainbowEndingArchive([
  'ending-sever',
  'ending-restore',
  'loyal-road',
  'ending-restore-extra',
])
assert.deepEqual(
  earned.map((entry) => entry.unlocked),
  [true, false, true],
)
assert.ok(
  earned.every((entry) => entry.summary.length > 20 && entry.title.length > 0),
)
assert.equal(rainbowEndingArchive(['ending-evacuate'])[1]?.unlocked, true)
console.log(
  'rainbow ending archive: ok (exact earned choices, three locked slots)',
)
