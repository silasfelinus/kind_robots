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
  'ending-stood-down',
]
const fresh = rainbowEndingArchive([])
assert.deepEqual(
  fresh.map((entry) => entry.id),
  ids,
)
assert.equal(fresh.filter((entry) => entry.unlocked).length, 0)
assert.equal(new Set(ids).size, 10)
// Story critic S20: the scrapbook speaks in-world, and a crew that turned at the Crown has its own page.
for (const entry of fresh)
  assert.doesNotMatch(entry.summary, /original record|does not prove|save/i)
// Story critic round 2 (R2-4): a crew that stood down earns its choice and its own page, never a rebel road page
// it did not fly, and no page claims it was pressed before the roads were charted.
assert.deepEqual(rainbowEndingMemoryIds('evacuate', 'rebel', true), [
  'ending-evacuate',
  'ending-stood-down',
])
for (const entry of fresh)
  assert.doesNotMatch(entry.summary, /before the roads were charted/)
assert.equal(
  rainbowEndingArchive(['ending-stood-down']).find((entry) => entry.unlocked)
    ?.title,
  'Turned at the Crown',
)

assert.deepEqual(rainbowEndingMemoryIds('restore', null), ['ending-restore'])
for (const road of ['rebel', 'loyal'] as const) {
  for (const choice of ['restore', 'evacuate', 'sever'] as const) {
    const earned = rainbowEndingMemoryIds(choice, road)
    assert.deepEqual(earned, [`ending-${choice}`, `ending-${road}-${choice}`])
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
console.log(
  'rainbow ending archive: 10 exact memories, 6 route titles, the late turn and safe legacy choices passed',
)
