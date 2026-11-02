import assert from 'node:assert/strict'
import { ALIEN_SPECIES } from '../gameOfCaptains/alienSpecies'
import { emptyAlienGuide } from '../gameOfCaptains/alienFieldGuide'
import { mergeAlienGuideSnapshots } from '../gameOfCaptains/alienGuideSync'

const [a, b, c] = ALIEN_SPECIES.map((species) => species.id)
assert.ok(a && b && c)
const remote = {
  ...emptyAlienGuide(),
  discovered: [a, b],
  friends: [a],
  milestoneSeen: [5],
  milestoneDecisions: { '5': 'a' as const },
  fieldReports: [{ speciesId: a, mood: 'wary' as const, outcome: 'bond' as const, choice: 'observe' as const }],
}
const incoming = {
  ...emptyAlienGuide(),
  discovered: [b, c],
  friends: [b],
  milestoneSeen: [5, 12],
  milestoneDecisions: { '5': 'c' as const, '12': 'b' as const },
  fieldReports: [{ speciesId: c, mood: 'playful' as const, outcome: 'chaos' as const, choice: 'observe' as const }],
}
const merged = mergeAlienGuideSnapshots(remote, incoming)
assert.deepEqual(merged.discovered, [a, b, c])
assert.deepEqual(merged.friends, [a, b])
assert.deepEqual(merged.milestoneSeen, [5, 12])
assert.deepEqual(merged.milestoneDecisions, { '5': 'a', '12': 'b' })
assert.equal(merged.fieldReports?.length, 2)
assert.deepEqual(mergeAlienGuideSnapshots(merged, incoming), merged, 'repeat sync is idempotent')
assert.deepEqual(mergeAlienGuideSnapshots(emptyAlienGuide(), remote).discovered, [a, b])
assert.deepEqual(mergeAlienGuideSnapshots(remote, null).discovered, [a, b])
assert.deepEqual(
  mergeAlienGuideSnapshots({ discovered: ['forged', a], milestoneDecisions: { '999': 'a' } }, null).discovered,
  [a],
)
console.log('Space Couch: cross-device scrapbook unions and first-earned collector decisions stable')
