import assert from 'node:assert/strict'
import {
  consequenceForRun,
  resolveConsequence,
  validConsequenceHistory,
} from '../gameOfCaptains/consequenceStories'
import { ACT_THREE_FINAL_CASES } from '../gameOfCaptains/consequenceStoriesActThreeFinal'
import {
  restoreVoyage,
  startVoyage,
  type VoyageRun,
} from '../gameOfCaptains/rules'
import { VOYAGE_BOARDS } from '../gameOfCaptains/voyageMap'

const episode = ACT_THREE_FINAL_CASES.inquiry
assert.ok(VOYAGE_BOARDS[8]?.includes('inquiry'))
assert.equal(episode.choices.length, 3)
assert.deepEqual(
  episode.choices.map((choice) => choice.policy).sort(),
  ['aid', 'intervene', 'observe'],
)
assert.equal(new Set(episode.choices.map((choice) => choice.id)).size, 3)

const narratives = new Set<string>()
const keys = new Set<string>()
for (const seed of [7, 19, 31, 43]) {
  const before: VoyageRun = {
    ...startVoyage('fluke', ['pell', 'mox', 'rue'], seed),
    chapter: 9,
    phase: 'decision',
    missionId: 'inquiry',
  }
  assert.equal(consequenceForRun(before)?.id, episode.id)
  assert.equal(resolveConsequence(before, 'invalid-choice'), before)
  for (const choice of episode.choices) {
    assert.ok(choice.label.length >= 35)
    assert.ok(choice.approach.length >= 50)
    assert.ok(choice.cost.length >= 60)
    for (const result of [choice.success, choice.failure]) {
      assert.ok(result.narrative.length >= 280)
      assert.ok(result.callback.length >= 65)
      assert.ok(result.flags.length >= 2)
      narratives.add(result.narrative)
    }
    const first = resolveConsequence(before, choice.id)
    const second = resolveConsequence(before, choice.id)
    assert.deepEqual(first, second, 'same seed and choice must replay')
    assert.equal(first.consequenceHistory?.length, 1)
    assert.ok(first.consequenceHistory?.[0]?.artKey.startsWith(
      `consequences/${episode.id}-${choice.id}-`,
    ))
    keys.add(first.consequenceHistory![0]!.artKey)
    assert.ok(validConsequenceHistory(first.consequenceHistory))
    assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(first))), first)
  }
}
const legacy = {
  ...startVoyage('fluke', ['pell', 'mox', 'rue'], 99),
  chapter: 9,
  phase: 'decision' as const,
  missionId: 'inquiry',
}
const consent = consequenceForRun({
  ...legacy,
  worldFlags: ['gate-hearing-consented'],
})
assert.match(consent!.opening, /right to correct their statements/)
const broadcast = consequenceForRun({
  ...legacy,
  worldFlags: ['gameworld-public-rescue-footage'],
})
assert.match(broadcast!.opening, /consent to publicity/)
assert.equal(consequenceForRun(legacy)?.opening, episode.opening)

assert.equal(narratives.size, 6)
assert.ok(keys.size >= 3)
console.log('Space Couch final inquiry: three policies, six distinct outcomes, four seeded deterministic save/restore passes')
