import assert from 'node:assert/strict'
import {
  canonicalFusionPair,
  clientIngredientKey,
  fusionDisplayTitle,
  fusionIdForIdentity,
  normalizedIngredientKey,
  starterForIdentity,
} from '../../server/utils/hybridizerFusion'

const cat = canonicalFusionPair('cat', 'banana')
const swapped = canonicalFusionPair('banana', 'cat')
assert.deepEqual(cat, swapped, 'A + B must use the same durable key as B + A')
assert.equal(cat.leftKey, 'starter:banana')
assert.equal(cat.rightKey, 'starter:cat')
assert.equal(cat.id.length, 64)
assert.equal(canonicalFusionPair('starter:cat', 'banana').id, cat.id)
assert.equal(starterForIdentity('starter:banana')?.taxonomy, 'OTHER')
assert.equal(clientIngredientKey('starter:banana'), 'banana')
assert.equal(fusionIdForIdentity('fusion:' + cat.id), cat.id)
assert.equal(
  canonicalFusionPair('fusion:' + cat.id, 'vampire').leftKey,
  'fusion:' + cat.id,
)
assert.equal(fusionDisplayTitle('Banana', 'Cat'), 'Bananacat')
assert.equal(fusionDisplayTitle('Vampire', 'Bananacat'), 'Vampire Bananacat')
assert.notEqual(canonicalFusionPair('cat', 'vampire').id, cat.id)
assert.throws(() => canonicalFusionPair('cat', 'cat'), /different/)
assert.throws(() => normalizedIngredientKey('invalid'), /Unknown/)
assert.throws(
  () => normalizedIngredientKey('hybrid:some-local-study'),
  /Unknown/,
)
console.log('Hybridizer canonical pair identity contracts passed.')
