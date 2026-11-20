import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const store = readFileSync('stores/gameOfCaptainsStore.ts', 'utf8')
const trioStart = store.indexOf('  async function loadTrioArtwork(')
const trioEnd = store.indexOf('  async function loadOnboardingArt(', trioStart)
const trio = store.slice(trioStart, trioEnd)
assert.ok(trioStart >= 0 && trioEnd > trioStart)
assert.match(trio, /Promise<boolean>/)
assert.match(trio, /loadedTrioArtwork\.value\[trio\] = true\s+return true/)
assert.match(
  trio,
  /epoch === accountEpoch && response\.success && response\.data/,
)
assert.match(trio, /pendingTrioArtwork\.value\[trio\] = false/)
assert.match(trio, /return false\s+}\s*$/)

const refreshStart = store.indexOf('  async function refreshArtwork()')
const refreshEnd = store.indexOf('  // The title, opening reel', refreshStart)
const refresh = store.slice(refreshStart, refreshEnd)
assert.ok(refreshStart >= 0 && refreshEnd > refreshStart)
assert.match(refresh, /const results = await Promise\.all\(\[/)
assert.match(refresh, /loadTrioArtwork\(trioKey\(run\.value\.crew\)\)/)
assert.match(refresh, /results\.every\(\(result\) => result !== false\)/)
assert.match(refresh, /epoch !== accountEpoch/)
assert.match(
  refresh,
  /if \(epoch === accountEpoch\) artRefreshing\.value = false/,
)
assert.match(refresh, /Some paintings could not be checked/)

console.log('Space Couch trio painting failures remain retryable and visible')
