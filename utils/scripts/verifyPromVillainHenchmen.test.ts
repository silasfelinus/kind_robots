import assert from 'node:assert/strict'
import { IDENTITY_ARCS } from '../cometAcademy/identityArcs'
import {
  VILLAIN_HENCHMEN,
  henchmanForVillain,
} from '../cometAcademy/villainHenchmen'

assert.equal(IDENTITY_ARCS.length, 48)
assert.equal(VILLAIN_HENCHMEN.length, 48)
assert.deepEqual(
  new Set(VILLAIN_HENCHMEN.map((crew) => crew.signature)),
  new Set(IDENTITY_ARCS.map((person) => person.signature)),
)
assert.equal(new Set(VILLAIN_HENCHMEN.map((crew) => crew.name)).size, 48)
assert.equal(new Set(VILLAIN_HENCHMEN.map((crew) => crew.captain)).size, 48)

for (const person of IDENTITY_ARCS) {
  const crew = henchmanForVillain(person.signature)
  assert.equal(crew.signature, person.signature)
  assert.equal(crew.hp, 1)
  assert.equal(crew.facetType, 'SPECIES')
  for (const key of ['look', 'move', 'counter', 'story'] as const)
    assert.ok(crew[key].length > 24, crew.name + ' needs authored ' + key)
}
assert.equal(henchmanForVillain('accident-earth').name, 'Warren Wreckers')
assert.match(henchmanForVillain('accident-earth').move, /burrow/i)
assert.equal(henchmanForVillain('tech-genius').name, "Mabel's Biscuit Bots")
console.log('Prom of Doom 48 villain henchman types: OK')
