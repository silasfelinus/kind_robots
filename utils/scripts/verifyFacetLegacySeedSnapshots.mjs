// /utils/scripts/verifyFacetLegacySeedSnapshots.mjs
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [characterSnapshot, creativeSnapshot, ...shimSources] = await Promise.all([
  readFile('utils/seeds/facetLegacyCharacterLists.ts', 'utf8'),
  readFile('utils/seeds/facetLegacyCreativeLists.ts', 'utf8'),
  readFile('stores/utils/randomClass.ts', 'utf8'),
  readFile('stores/utils/randomGenre.ts', 'utf8'),
  readFile('stores/utils/randomBackstory.ts', 'utf8'),
  readFile('stores/utils/randomColor.ts', 'utf8'),
  readFile('stores/utils/randomMaterial.ts', 'utf8'),
  readFile('stores/utils/randomPersonality.ts', 'utf8'),
  readFile('stores/utils/randomQuirks.ts', 'utf8'),
])

for (const snapshot of [characterSnapshot, creativeSnapshot]) {
  assert.match(snapshot, /Runtime selection must use Facets/)
  assert.doesNotMatch(snapshot, /Math\.random/)
}

for (const exportName of ['legacyFacetClassList', 'legacyFacetGenreList']) {
  assert.match(characterSnapshot, new RegExp(exportName))
}
for (const exportName of [
  'legacyFacetBackstoryList',
  'legacyFacetColorList',
  'legacyFacetMaterialList',
  'legacyFacetPersonalityList',
  'legacyFacetQuirkList',
]) {
  assert.match(creativeSnapshot, new RegExp(exportName))
}

const expectedShims = [
  ['legacyFacetClassList as classList', 'randomClass'],
  ['legacyFacetGenreList as genreList', 'randomGenre'],
  ['legacyFacetBackstoryList as backstoryList', 'randomBackstory'],
  ['legacyFacetColorList as colorList', 'randomColor'],
  ['legacyFacetMaterialList as materialList', 'randomMaterial'],
  ['legacyFacetPersonalityList as personalityList', 'randomPersonality'],
  ['legacyFacetQuirkList as quirkList', 'randomQuirk'],
]

for (const [index, [reExport, retiredFunction]] of expectedShims.entries()) {
  const shim = shimSources[index] ?? ''
  assert.match(shim, new RegExp(reExport))
  assert.match(shim, /canonical Facet seed only/)
  assert.doesNotMatch(shim, new RegExp(`function ${retiredFunction}`))
  assert.doesNotMatch(shim, /Math\.random/)
}

console.log('Legacy Facet seed snapshots verified.')
