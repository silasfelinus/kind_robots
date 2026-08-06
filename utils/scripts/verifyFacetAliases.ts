// /utils/scripts/verifyFacetAliases.ts
import assert from 'node:assert/strict'
import {
  normalizeFacetLookupKey,
  prepareFacetAlias,
  prepareUniqueFacetAliases,
} from './../facetAliases'

assert.equal(normalizeFacetLookupKey('cowCore'), 'cowcore')
assert.equal(normalizeFacetLookupKey('cow-core'), 'cowcore')
assert.equal(normalizeFacetLookupKey('  Cow core  '), 'cowcore')
assert.equal(normalizeFacetLookupKey('Café Noir'), 'cafenoir')

// Formatting is normalized, but semantic variants stay explicit.
assert.notEqual(normalizeFacetLookupKey('cow'), normalizeFacetLookupKey('cows'))

assert.deepEqual(prepareFacetAlias('  cows  '), {
  alias: 'cows',
  lookupKey: 'cows',
})

assert.deepEqual(prepareUniqueFacetAliases(['cowCore', 'cow-core', 'cow core', 'cow', 'cows']), [
  { alias: 'cowCore', lookupKey: 'cowcore' },
  { alias: 'cow', lookupKey: 'cow' },
  { alias: 'cows', lookupKey: 'cows' },
])

assert.throws(() => prepareFacetAlias('---'), /letter or number/)

console.log('Facet alias normalization verified.')
