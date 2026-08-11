// /utils/scripts/verifyAnimationComponentAttempts.ts
//
// The Component-backed animation-attempt ledger was retired with WonderLab.
// Keep this command as a regression guard while callers migrate: Animation
// Manager must use the canonical animation catalog and must not recreate the
// museum ledger/helper under a new import path.
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

assert.equal(
  await pathExists('stores/helpers/animationComponentHelper.ts'),
  false,
  'retired animationComponentHelper must not return',
)
assert.equal(
  await pathExists('stores/componentStore.ts'),
  false,
  'retired componentStore must not return',
)

const managerStore = await readFile('stores/animationManagerStore.ts', 'utf8')
assert.match(managerStore, /animationCatalog/)
assert.match(managerStore, /useAnimationStore/)
assert.doesNotMatch(
  managerStore,
  /ComponentStatus|KindComponent|componentStore|animationComponentHelper|buildNumber|supersededBy/,
)

console.log(
  'Animation Component-attempt retirement verified: Animation Manager uses the live catalog and no museum ledger/helper remains.',
)
