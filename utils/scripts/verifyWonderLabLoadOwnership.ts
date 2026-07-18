// /utils/scripts/verifyWonderLabLoadOwnership.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [managerSource, interactSource, storeSource] = await Promise.all([
  readFile('components/wonderlab/lab-manager.vue', 'utf8'),
  readFile('components/wonderlab/lab-interact.vue', 'utf8'),
  readFile('stores/componentStore.ts', 'utf8'),
])

assert.doesNotMatch(
  managerSource,
  /useComponentStore|componentStore|initialize\(/,
  'lab-manager must only select the active Lab surface, not load Component data',
)
assert.doesNotMatch(
  managerSource,
  /onMounted|refreshLab|Warming up the lab goblins/,
  'lab-manager must not carry a duplicate museum loading lifecycle',
)
assert.match(managerSource, /activeTab === 'wonder-lab'/)
assert.match(managerSource, /<lab-interact/)
assert.match(managerSource, /activeTab === 'memory-dungeon'/)
assert.match(managerSource, /activeTab === 'screen-fx'/)

const interactInitializeCalls = interactSource.match(
  /componentStore\.initialize\(/g,
) || []
assert.equal(
  interactInitializeCalls.length,
  1,
  'lab-interact should own exactly one Component initialization call',
)
assert.match(interactSource, /async function refreshComponents\(\)/)
assert.match(interactSource, /componentStore\.initialize\(true\)/)
assert.match(interactSource, /onMounted\(async \(\) =>/)
assert.match(interactSource, /if \(components\.value\.length\) return/)

assert.match(
  storeSource,
  /if \(isInitialized\.value && !force\) return/,
  'the sole UI owner should still rely on the store initialization guard',
)

console.log('WonderLab single load-owner contract passed.')
