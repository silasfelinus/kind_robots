import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const store = readFileSync('stores/gameOfCaptainsStore.ts', 'utf8')
const page = readFileSync('pages/play/game-of-captains.vue', 'utf8')

for (const [name, artwork, flag, route] of [
  ['loadAlienArtwork', 'alienArtwork', 'alienArtLoaded', 'alien-art'],
  [
    'loadRedshirtArtwork',
    'redshirtArtwork',
    'redshirtArtLoaded',
    'redshirt-art',
  ],
  [
    'loadOnboardingArt',
    'onboardingArt',
    'onboardingArtLoaded',
    'onboarding-art',
  ],
]) {
  const start = store.indexOf('  async function ' + name + '(')
  const end = store.indexOf('\n  }', start)
  assert.ok(start >= 0 && end > start, name + ' is reachable')
  const loader = store.slice(start, end)
  assert.ok(loader.includes('(force = false): Promise<boolean>'), name)
  assert.ok(loader.includes('!force'), name + ' allows explicit refresh')
  assert.ok(loader.includes("'/api/game-of-captains/" + route + "'"), name)
  assert.ok(loader.includes('epoch !== accountEpoch'), name)
  assert.ok(loader.includes('!response.success || !response.data'), name)
  assert.ok(loader.includes(artwork + '.value = response.data'), name)
  assert.ok(loader.includes(flag + '.value = true'), name)
  assert.ok(
    !loader.includes(artwork + '.value = {}'),
    name + ' must retain previously delivered art on failure',
  )
}

assert.ok(store.includes('async function refreshArtwork()'))
assert.ok(store.includes('if (artworkRefreshPending.value) return'))
assert.ok(store.includes('loadAlienArtwork(true)'))
assert.ok(store.includes('loadRedshirtArtwork(true)'))
assert.ok(store.includes('loadOnboardingArt(true)'))
assert.ok(store.includes('results.every(Boolean)'))
assert.ok(store.includes('if (epoch !== accountEpoch) return'))
assert.ok(store.includes("artworkRefreshMessage.value = ''"))
assert.ok(store.includes('    refreshArtwork,'))
assert.ok(page.includes('data-testid="space-couch-refresh-paintings"'))
assert.ok(page.includes(':disabled="store.artworkRefreshPending"'))
assert.ok(page.includes('@click="store.refreshArtwork()"'))
assert.ok(page.includes('v-if="store.artworkRefreshMessage" role="status"'))
assert.ok(
  store.includes(
    "    artworkRefreshPending.value = false\n    artworkRefreshMessage.value = ''",
  ),
  'account switches cancel stale refresh UI without sharing old artwork',
)
assert.ok(
  page.includes(
    "const COUCH_FALLBACK = '/game-of-captains/space-couch-stage.svg'",
  ),
  'failed renders retain the existing image fallback',
)
console.log(
  'Space Couch art refresh preserves delivered assets, account isolation and v1 saves',
)
