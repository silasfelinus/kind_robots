import assert from 'node:assert/strict'
import {
  MAX_FAILED_ART_JOB_REQUEUE_IDS,
  normalizeFailedArtJobIds,
} from '../../server/utils/failedArtJobScope'

assert.deepEqual(normalizeFailedArtJobIds(undefined), {
  ok: false,
  message:
    'Provide jobIds with the explicit failed ArtJobs to requeue. Global failed-job retry is disabled.',
})

assert.deepEqual(normalizeFailedArtJobIds([]), {
  ok: false,
  message: 'Select at least one failed ArtJob to requeue.',
})

assert.deepEqual(normalizeFailedArtJobIds([12, 12, 27]), {
  ok: true,
  ids: [12, 27],
})

assert.equal(normalizeFailedArtJobIds([1, '2']).ok, false)
assert.equal(normalizeFailedArtJobIds([0]).ok, false)
assert.equal(normalizeFailedArtJobIds([1.5]).ok, false)

const maximumPage = Array.from(
  { length: MAX_FAILED_ART_JOB_REQUEUE_IDS },
  (_, index) => index + 1,
)
assert.deepEqual(normalizeFailedArtJobIds(maximumPage), {
  ok: true,
  ids: maximumPage,
})

assert.equal(
  normalizeFailedArtJobIds([...maximumPage, MAX_FAILED_ART_JOB_REQUEUE_IDS + 1])
    .ok,
  false,
)

console.log('Failed ArtJob retry scope checks passed.')
