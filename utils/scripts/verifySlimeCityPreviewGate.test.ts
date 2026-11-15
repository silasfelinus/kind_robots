// Slime City preview gate (conductor slime-city/t-067): a signed-in visitor
// outside the admin preview gets HTTP 403 from progress/story. That is a
// calm local-play state, never a STORY SYNC ERROR badge or reload loop.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  isSlimeCityPreviewGate,
  SLIME_CITY_LOCAL_PLAY_NOTICE,
} from '../slimeCity/previewGate'

assert.equal(isSlimeCityPreviewGate({ status: 403 }), true)
for (const status of [undefined, 200, 401, 408, 500, 503])
  assert.equal(isSlimeCityPreviewGate({ status }), false, `status ${status}`)
assert.equal(isSlimeCityPreviewGate(null), false)
assert.doesNotMatch(SLIME_CITY_LOCAL_PLAY_NOTICE, /error|reload|failed/i)

const store = readFileSync('stores/slimeCity.ts', 'utf8')
const page = readFileSync('pages/admin/slime-city.vue', 'utf8')
const service = readFileSync('server/utils/slimeCityProgress.ts', 'utf8')

// The server gate itself is unchanged.
assert.match(service, /!auth\.isAdmin \|\| auth\.user\.isGuest/)
assert.match(service, /statusCode: 403/)

// Both account routes treat the 403 as the preview gate, not an error.
const story = store.slice(store.indexOf('async function hydrateStory'))
const gate = story.indexOf('isSlimeCityPreviewGate(response)')
assert.ok(gate > 0, 'story load recognizes the preview gate')
assert.ok(
  gate < story.indexOf('storyError.value =\n'),
  'preview gate is handled before any story error is set',
)
assert.match(
  story.slice(gate, gate + 200),
  /previewAccount\.value = userId\s+loadDeviceStory\(\)\s+return/,
)
const progress = store.slice(store.indexOf('async function hydrateProgression'))
assert.ok(
  progress.indexOf('isSlimeCityPreviewGate(result)') <
    progress.indexOf('progressError.value =\n'),
  'progress load recognizes the preview gate before reporting an error',
)
// Local play saves on this device and stays editable.
assert.match(
  store,
  /if \(!authId\(\) \|\| isGuest\(\) \|\| accountPreviewOnly\.value\) \{\s+if \(!writeGuestSlimeStory\(/,
)
assert.match(store, /isGuest\(\) \|\|\s+accountPreviewOnly\.value \|\|/)
// The preview state belongs to one account: switching users clears it.
assert.match(
  store,
  /previewAccount\.value !== null && previewAccount\.value === authId\(\)/,
)

// The header shows LOCAL PLAY with neutral copy instead of SIGN IN.
assert.match(page, /lab\.accountPreviewOnly\s+\? 'LOCAL PLAY'/)
assert.match(
  page,
  /v-if="lab\.progressNotice"\s+class="sc-progress-alert"\s+role="status"/,
)

console.log('slime city preview gate checks passed')
