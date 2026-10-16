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

const pilot = readFileSync(
  'server/api/video-restyle/[id]/pilot.post.ts',
  'utf8',
)
const reconcile = readFileSync(
  'server/api/video-restyle/reconcile.post.ts',
  'utf8',
)
const artjob = readFileSync('server/utils/videoRestyleArtJob.ts', 'utf8')
const queueCard = readFileSync('components/art/artjob-queue-card.vue', 'utf8')
const media = readFileSync('utils/artJobMedia.ts', 'utf8')
assert.ok(pilot.includes('syncRestylePilotArtJob'))
assert.ok(reconcile.includes('requireAdminApiUser'))
assert.ok(reconcile.includes('syncRestylePilotArtJob'))
assert.ok(artjob.includes('attemptFingerprint: fingerprint'))
assert.ok(artjob.includes('projectSlug: PROJECT_SLUG'))
assert.ok(artjob.includes('priority: -100'))
assert.ok(studio.includes('View ArtJob #'))
assert.ok(queueCard.includes('isRestylePilot'))
assert.ok(queueCard.includes('Open Coat Dance Studio'))
assert.ok(media.includes('if (isVideoRestyleArtJobPayload(body)) return false'))

const storeSource = readFileSync('stores/videoRestyleStore.ts', 'utf8')
const refreshSource = storeSource.slice(
  storeSource.indexOf('async function refresh()'),
  storeSource.indexOf('async function stage('),
)
assert.match(refreshSource, /['"]\/api\/video-restyle\/reconcile['"]/)
assert.match(refreshSource, /method: 'POST'/)
assert.match(refreshSource, /registrationError\.value/)
assert.ok(
  refreshSource.indexOf('/api/video-restyle/reconcile') <
    refreshSource.indexOf("'/api/video-restyle'"),
)
assert.match(studio, /ArtJob registration failed:/)
assert.match(studio, /Register in ArtJob/)

const artQueueList = readFileSync('server/api/art/queue/index.get.ts', 'utf8')
const artQueueStore = readFileSync('stores/artJobStore.ts', 'utf8')
const artQueueView = readFileSync('components/art/artjob-queue-browser.vue', 'utf8')
assert.ok(artQueueList.includes("where.id = jobId"))
assert.ok(artQueueStore.includes("params.set('jobId', String(state.focusedJobId))"))
assert.ok(artQueueView.includes("route.query.jobId"))
assert.ok(artQueueView.includes("Showing ArtJob #"))
assert.ok(studio.includes("query: { jobId: store.selected.pilot.artJobId }"))
