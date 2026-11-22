import assert from 'node:assert/strict'
import {
  rainbowEndingArchive,
  rainbowEndingMemoryIds,
} from '../arcade/games/rainbowEndingArchive'
import { FINALE_ENDINGS } from '../arcade/games/rainbowEclipseFinale'

const ids = [
  'ending-restore',
  'ending-evacuate',
  'ending-sever',
  'ending-rebel-restore',
  'ending-rebel-evacuate',
  'ending-rebel-sever',
  'ending-loyal-restore',
  'ending-loyal-evacuate',
  'ending-loyal-sever',
]
const fresh = rainbowEndingArchive([])
assert.deepEqual(
  fresh.map((entry) => entry.id),
  ids,
)
assert.equal(fresh.filter((entry) => entry.unlocked).length, 0)
assert.equal(new Set(ids).size, 9)

assert.deepEqual(rainbowEndingMemoryIds('restore', null), ['ending-restore'])
for (const road of ['rebel', 'loyal'] as const) {
  for (const choice of ['restore', 'evacuate', 'sever'] as const) {
    const earned = rainbowEndingMemoryIds(choice, road)
    assert.deepEqual(earned, [
      `ending-${choice}`,
      `ending-${road}-${choice}`,
    ])
    const collected = rainbowEndingArchive(earned)
    assert.deepEqual(
      collected.filter((entry) => entry.unlocked).map((entry) => entry.id),
      earned,
    )
    const named = collected.find((entry) => entry.id === earned[1])
    assert.equal(named?.title, FINALE_ENDINGS[road][choice].title)
    assert.equal(named?.summary, FINALE_ENDINGS[road][choice].world)
  }
}

const historical = rainbowEndingArchive([
  'ending-sever',
  'ending-restore',
  'loyal-road',
  'ending-restore-extra',
])
assert.deepEqual(
  historical.filter((entry) => entry.unlocked).map((entry) => entry.id),
  ['ending-restore', 'ending-sever'],
  'historical generic feats do not falsely unlock any Motherland-road endings',
)
const mixed = rainbowEndingArchive([
  'ending-restore',
  'ending-rebel-restore',
  'ending-loyal-evacuate',
])
assert.deepEqual(
  mixed.filter((entry) => entry.unlocked).map((entry) => entry.id),
  ['ending-restore', 'ending-rebel-restore', 'ending-loyal-evacuate'],
)
assert.ok(fresh.every((entry) => entry.summary.length > 20))
console.log('rainbow ending archive: 9 exact memories, 6 route titles and safe legacy choices passed')
