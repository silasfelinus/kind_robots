import assert from 'node:assert/strict'
import {
  DECKS,
  ENDINGS,
  JOB_TITLES,
  MUTATIONS,
  SOCIETIES,
} from '../shiftingDesks/rules'
import {
  artUnlockKeysForReceipt,
  emptyRewardArchive,
  recordReward,
  restoreRewardArchive,
  type RunReceipt,
} from '../shiftingDesks/rewards'
import { artDiscovery } from '../shiftingDesks/artDiscovery'

const job = JOB_TITLES[0]!
const society = SOCIETIES[0]!
const mutation = MUTATIONS[0]!
const receipt: RunReceipt = {
  id: 'art-discovery-test:first',
  endingId: ENDINGS[0]!.id,
  completedAt: '2026-11-15T12:00:00.000Z',
  jobTitle: job.title,
  jobId: job.id,
  society: society.title,
  mutation: mutation.title,
  floors: 5,
  files: 12,
  employees: 1,
  forms: 2,
  successors: 1,
  grades: { empathy: 1, ingenuity: 1, obedience: 1, spite: 1 },
  flags: [],
  mutationUsed: false,
  societyMet: false,
}

const keys = artUnlockKeysForReceipt(receipt)
assert.deepEqual(keys, [
  `jobs:${job.id}`,
  `societies:${society.id}`,
  `mutations:${mutation.id}`,
])
const first = recordReward(emptyRewardArchive(), receipt, [receipt.endingId])
assert.deepEqual(first.artUnlocked, keys)
assert.equal(recordReward(first, receipt, [receipt.endingId]), first)

const entries = artDiscovery(first)
assert.equal(
  entries.length,
  JOB_TITLES.length + SOCIETIES.length + MUTATIONS.length,
)
assert.deepEqual(
  entries.filter((entry) => entry.unlocked).map((entry) => entry.key),
  keys,
)
assert.equal(entries.find((entry) => entry.key === keys[0])?.src,
  `/images/shifting-desks/jobs/${job.id}.webp`,
)
assert.equal(
  entries.find((entry) => entry.key === keys[0])?.prompt,
  DECKS.jobTitles.find((entry) => entry.id === job.id)?.art_prompt,
)
assert.ok(entries.some((entry) => !entry.unlocked))

const legacy = { version: 1, milestones: {}, runs: [receipt] }
const restored = restoreRewardArchive(legacy)
assert.deepEqual(restored.artUnlocked, keys)
assert.deepEqual(
  artDiscovery(restored)
    .filter((entry) => entry.unlocked)
    .map((entry) => entry.key),
  keys,
)

const permanent = restoreRewardArchive({
  version: 1,
  milestones: {},
  runs: [],
  artUnlocked: [...keys, 'jobs:fake', 9, keys[0]],
})
assert.deepEqual(permanent.artUnlocked, keys)
assert.deepEqual(
  artDiscovery(permanent)
    .filter((entry) => entry.unlocked)
    .map((entry) => entry.key),
  keys,
)

const recovered = recordReward(permanent, {
  ...receipt,
  id: 'art-discovery-test:second',
}, [receipt.endingId])
assert.deepEqual(recovered.artUnlocked, keys)
assert.equal(recovered.runs.length, 1)

console.log('Shifting Desks persistent art-discovery contract passed')
