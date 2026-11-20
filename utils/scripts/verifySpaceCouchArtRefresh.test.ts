import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const store = readFileSync('stores/gameOfCaptainsStore.ts', 'utf8')
const page = readFileSync('pages/play/game-of-captains.vue', 'utf8')
const alienRoute = readFileSync(
  'server/api/game-of-captains/alien-art.get.ts',
  'utf8',
)
const redshirtRoute = readFileSync(
  'server/api/game-of-captains/redshirt-art.get.ts',
  'utf8',
)
const paintingRoute = readFileSync(
  'server/api/game-of-captains/onboarding-art.get.ts',
  'utf8',
)

for (const [name, flag] of [
  ['alien', 'alienArtLoaded'],
  ['redshirt', 'redshirtArtLoaded'],
]) {
  const start = store.indexOf('async function load' + ({
    alien: 'AlienArtwork',
    redshirt: 'RedshirtArtwork',
    onboarding: 'OnboardingArt',
  } as Record<string, string>)[name] + '()')
  assert.ok(start >= 0, name + ' art loader exists')
  const loader = store.slice(start, store.indexOf('\n  }', start) + 4)
  assert.ok(loader.includes("response.success && response.data"))
  assert.ok(loader.includes(flag + '.value = true'))
  assert.ok(
    !loader.includes('finally {'),
    name + ' must not mark a failed fetch as loaded',
  )
}
// The onboarding UI uses "loaded" to show a fallback after any settled fetch.
// A separate verified flag permits retries without leaving the page spinning.
assert.ok(store.includes('const onboardingArtVerified = ref(false)'))
assert.ok(store.includes('if (onboardingArtVerified.value) return'))
assert.ok(store.includes('onboardingArtVerified.value = true'))
assert.ok(
  store.includes('if (epoch === accountEpoch) onboardingArtLoaded.value = true'),
)
assert.ok(store.includes('const epoch = accountEpoch'))
assert.ok(store.includes('if (epoch === accountEpoch && response.success'))
assert.ok(store.includes('async function refreshArtwork()'))
assert.ok(store.includes('if (artRefreshing.value) return'))
assert.ok(store.includes('artRefreshing.value = false'))
assert.ok(store.includes('artRefreshStatus.value ='))
assert.ok(store.includes('loadedTrioArtwork.value = {}'))
assert.ok(store.includes('...run.value ?') === false)
assert.ok(store.includes('loadAlienArtwork(),'))
assert.ok(store.includes('loadRedshirtArtwork(),'))
assert.ok(store.includes('loadOnboardingArt(),'))
assert.ok(store.includes('artRefreshing,'))
assert.ok(store.includes('refreshArtwork,'))
assert.ok(page.includes('data-testid="space-couch-refresh-paintings"'))
assert.ok(page.includes(':disabled="store.artRefreshing"'))
assert.ok(page.includes('@click="store.refreshArtwork()"'))
assert.ok(page.includes('role="status"'))
for (const route of [alienRoute, paintingRoute]) {
  assert.ok(route.includes('buildArtImageWhere(access)'))
  assert.ok(route.includes('getArtImageAccessContext(event)'))
}
assert.ok(redshirtRoute.includes('isApprovedRedshirtSelection('))
assert.ok(redshirtRoute.includes('isPublic: true'))
assert.ok(redshirtRoute.includes('isActive: true'))
assert.ok(redshirtRoute.includes('isMature: false'))
assert.ok(
  store.includes('game-of-captains-voyage-v1'),
  'legacy saved-game identity remains compatible',
)
console.log(
  'Space Couch artwork refresh retries failed responses without bypassing image selection or saved-game IDs',
)
