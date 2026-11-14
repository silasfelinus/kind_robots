import assert from 'node:assert/strict'
import { BRIAR_COLLISION_SCENES } from '../memoryDungeon/briarCollision'
import { BRIAR_COLLISION_ROUTE_SITES } from '../memoryDungeon/briarCollisionRoute'

// The player is Rowan in e09; Pip is a supporting goblin courier. Generated
// scene art must not silently recast the courier as the protagonist.
const scenes = [
  BRIAR_COLLISION_SCENES['2,2'],
  BRIAR_COLLISION_ROUTE_SITES['1,1'],
  BRIAR_COLLISION_ROUTE_SITES['2,1'],
]
for (const scene of scenes) {
  assert.match(scene.artSubject, /Rowan/, scene.title + ': establishing art must show Rowan')
  assert.match(scene.artSubject, /Pip/, scene.title + ': keep courier visible')
  for (const choice of scene.choices) {
    assert.ok(choice.id, scene.title + ': choice id remains stable')
    assert.ok(choice.flag, scene.title + ': consequence flag remains stable')
  }
}
for (const choice of BRIAR_COLLISION_SCENES['2,2'].choices.slice(0, 2))
  assert.match(choice.artSubject, /Rowan/, choice.id + ': Rowan directs the rescue')
for (const choice of BRIAR_COLLISION_ROUTE_SITES['2,1'].choices.slice(0, 1))
  assert.match(choice.artSubject, /Rowan/, choice.id + ': Rowan negotiates the gate')
console.log('e09 Rowan visual lead contract passed')
