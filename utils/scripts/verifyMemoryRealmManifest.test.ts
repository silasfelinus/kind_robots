import assert from 'node:assert/strict'
import { validateRealmManifest } from '../memoryDungeon/realmManifestValidator'
assert.equal(typeof validateRealmManifest, 'function')
