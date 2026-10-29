import assert from 'node:assert/strict'
import { IDENTITY_ARCS } from '../cometAcademy/identityArcs'
import { VILLAIN_HENCHMEN, henchmanForVillain } from '../cometAcademy/villainHenchmen'

assert.equal(IDENTITY_ARCS.length, 48)
assert.equal(VILLAIN_HENCHMEN.length, 48)
assert.deepEqual(
  new Set(VILLAIN_HENCHMEN.map((crew) => crew.signature)),
  new Set(IDENTITY_ARCS.map((person) => person.signature)),
)
assert.equal(new Set(VILLAIN_HENCHMEN.map((crew) => crew.name)).size, 48)
assert.equal(new Set(VILLAIN_HENCHMEN.map((crew) => crew.captain)).size, 48)
