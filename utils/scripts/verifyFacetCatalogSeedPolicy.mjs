// /utils/scripts/verifyFacetCatalogSeedPolicy.mjs
import assert from 'node:assert/strict'
import {
  decideFacetCatalogSeed,
  isFacetCatalogSourcePath,
} from '../../scripts/lib/facetCatalogSeedPolicy.mjs'

assert.equal(isFacetCatalogSourcePath('stores/helpers/adventureCards.ts'), true)
assert.equal(isFacetCatalogSourcePath('stores/utils/animalData.ts'), true)
assert.equal(isFacetCatalogSourcePath('utils/seeds/facetGenderValues.ts'), true)
assert.equal(isFacetCatalogSourcePath('utils/scripts/seedGenderFacetCatalog.ts'), true)
assert.equal(
  isFacetCatalogSourcePath('utils/seeds/facetLegacyCharacterLists.ts'),
  true,
)
assert.equal(
  isFacetCatalogSourcePath('utils/seeds/facetLegacyCreativeLists.ts'),
  true,
)
assert.equal(
  isFacetCatalogSourcePath(
    'prisma/migrations/20260725113000_facet_catalog_cutover/migration.sql',
  ),
  true,
)
assert.equal(
  isFacetCatalogSourcePath('utils/scripts/mergeCanonicalFacetDuplicates.ts'),
  false,
)
assert.equal(isFacetCatalogSourcePath('components/facets/facet-manager.vue'), false)
assert.equal(isFacetCatalogSourcePath('README.md'), false)

assert.deepEqual(
  decideFacetCatalogSeed({
    isVercelBuild: false,
    isProductionDeployment: false,
    changedFiles: [],
  }).run,
  true,
)

assert.deepEqual(
  decideFacetCatalogSeed({
    isVercelBuild: true,
    isProductionDeployment: false,
    changedFiles: ['stores/helpers/adventureCards.ts'],
  }).run,
  false,
)

assert.deepEqual(
  decideFacetCatalogSeed({
    isVercelBuild: true,
    isProductionDeployment: true,
    changedFiles: ['components/facets/facet-manager.vue'],
  }).run,
  false,
)

assert.deepEqual(
  decideFacetCatalogSeed({
    isVercelBuild: true,
    isProductionDeployment: true,
    changedFiles: ['utils/scripts/mergeCanonicalFacetDuplicates.ts'],
  }).run,
  false,
)

assert.deepEqual(
  decideFacetCatalogSeed({
    isVercelBuild: true,
    isProductionDeployment: true,
    changedFiles: ['stores/helpers/adventureCards.ts'],
  }).run,
  true,
)

for (const snapshot of [
  'utils/seeds/facetGenderValues.ts',
  'utils/seeds/facetLegacyCharacterLists.ts',
  'utils/seeds/facetLegacyCreativeLists.ts',
  'utils/scripts/seedGenderFacetCatalog.ts',
]) {
  assert.deepEqual(
    decideFacetCatalogSeed({
      isVercelBuild: true,
      isProductionDeployment: true,
      changedFiles: [snapshot],
    }).run,
    true,
  )
}

assert.deepEqual(
  decideFacetCatalogSeed({
    isVercelBuild: true,
    isProductionDeployment: true,
    forceValue: 'true',
    changedFiles: [],
  }).run,
  true,
)

assert.deepEqual(
  decideFacetCatalogSeed({
    isVercelBuild: true,
    isProductionDeployment: true,
    changedFiles: [],
    diffError: 'missing ancestry',
  }).run,
  true,
)

console.log('Facet catalog seed policy verified.')
