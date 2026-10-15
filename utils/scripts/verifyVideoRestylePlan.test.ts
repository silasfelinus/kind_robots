import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  RESTYLE_STYLES,
  isRestyleStyle,
  planRestyleSegments,
} from '../videoRestylePlan'

assert.equal(RESTYLE_STYLES.length, 6)
assert.equal(isRestyleStyle('illustrious'), true)
assert.equal(isRestyleStyle('unverified'), false)
assert.throws(() => planRestyleSegments(0))
assert.throws(() => planRestyleSegments(901))
assert.throws(() => planRestyleSegments(10, 1, 1))
for (const duration of [1, 4.5, 5, 17, 30, 332, 900]) {
  const windows = planRestyleSegments(duration)
  assert.ok(windows.length > 0)
  assert.equal(windows[0]?.sourceStartSec, 0)
  assert.equal(windows[0]?.keepFromSec, 0)
  assert.equal(windows.at(-1)?.sourceEndSec, duration)
  assert.equal(windows.at(-1)?.keepToSec, duration)
  for (let index = 1; index < windows.length; index += 1) {
    const previous = windows[index - 1]!
    const current = windows[index]!
    assert.equal(previous.keepToSec, current.keepFromSec)
    assert.ok(previous.sourceEndSec >= current.sourceStartSec)
    assert.ok(current.sourceEndSec > current.sourceStartSec)
  }
}
console.info('Video restyle segment planning verified')

const studio = readFileSync('pages/admin/coat-dance.vue', 'utf8')
const source = readFileSync(
  'server/api/video-restyle/[id]/source.get.ts',
  'utf8',
)
const settings = readFileSync('server/api/video-restyle/[id].patch.ts', 'utf8')
assert.ok(!studio.includes('v-show="activePanel'))
assert.ok(studio.includes('hidden lg:flex'))
assert.ok(studio.includes('Preview saved source'))
assert.ok(studio.includes('Save look to this project'))
assert.ok(source.includes('requireAdminApiUser'))
assert.ok(source.includes('restyleSourcePath'))
assert.ok(settings.includes('updateRestyleSettings'))
