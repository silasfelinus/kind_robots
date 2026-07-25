// /utils/scripts/verifyFacetLegacySeedSnapshots.mjs
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [snapshot, classShim, genreShim] = await Promise.all([
  readFile('utils/seeds/facetLegacyCharacterLists.ts', 'utf8'),
  readFile('stores/utils/randomClass.ts', 'utf8'),
  readFile('stores/utils/randomGenre.ts', 'utf8'),
])

assert.match(snapshot, /legacyFacetClassList/)
assert.match(snapshot, /legacyFacetGenreList/)
assert.match(snapshot, /Runtime selection must use Facets/)
assert.doesNotMatch(snapshot, /Math\.random/)

assert.match(classShim, /legacyFacetClassList as classList/)
assert.match(classShim, /canonical Facet seed only/)
assert.doesNotMatch(classShim, /function randomClass/)
assert.doesNotMatch(classShim, /Math\.random/)

assert.match(genreShim, /legacyFacetGenreList as genreList/)
assert.match(genreShim, /canonical Facet seed only/)
assert.doesNotMatch(genreShim, /function randomGenre/)
assert.doesNotMatch(genreShim, /Math\.random/)

console.log('Legacy Facet seed snapshots verified.')
