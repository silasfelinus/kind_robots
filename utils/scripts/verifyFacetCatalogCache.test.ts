// /utils/scripts/verifyFacetCatalogCache.test.ts
//
// The Facet catalog is 1,736 rows. Downloading it once per page visit is the
// deal; downloading it two or three times is a bug that only shows up on a
// phone, as a gallery that sits on its spinner with every card blank.
//
// 2026-09-20, measured against production: ONE visit to /facets issued four
// /api/facets/catalog requests -- two full walks of the catalog. The client
// plugin fetches it on navigation, and then facet-gallery's onMounted fetched
// it again, because the store's cache guard was
//
//     if (loaded && !force && !Object.keys(options).length) return entries
//
// and every caller but one passes `take: 1000`. That value is already
// FACET_CATALOG_PAGE_SIZE and fetchAllCatalogPages walks every page anyway, so
// it narrows nothing -- it existed only to defeat the cache. The second fetch
// then replaced `entries` wholesale with fresh objects while the first set was
// already rendered.
//
// This pins the two halves of the fix: paging hints must not count as a
// different query, and a real filter still must.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const store = readFileSync('stores/facetCatalogStore.ts', 'utf8')
const gallery = readFileSync('components/facets/facet-gallery.vue', 'utf8')

assert.ok(
  store.includes('function narrowsTheQuery('),
  'the catalog store must decide cache reuse on the options that change WHICH Facets come back',
)
assert.ok(
  /narrowsTheQuery[\s\S]{0,400}key !== 'take'[\s\S]{0,80}key !== 'skip'/.test(
    store,
  ),
  'take and skip are paging hints and must never defeat the catalog cache',
)
assert.ok(
  store.includes('if (loaded.value && !force && !narrowsTheQuery(options))'),
  'fetchCatalog must reuse a completed load for any request that narrows nothing',
)
assert.ok(
  !/fetchCatalog\(\{[^}]*take:\s*1000/.test(gallery),
  'facet-gallery must not pass the default page size as an option; it only defeats the cache',
)
assert.ok(
  /await catalog\.fetchCatalog\(\)/.test(gallery),
  'facet-gallery must request the whole catalog with no options so a warm store is reused',
)

/*
 * The behaviour itself, not just its spelling. A tiny stand-in for the guard,
 * kept in step with the store by the assertions above.
 */
function narrowsTheQuery(options: Record<string, unknown>): boolean {
  return Object.entries(options).some(
    ([key, value]) =>
      key !== 'take' && key !== 'skip' && value !== undefined && value !== null,
  )
}

for (const reuse of [
  {},
  { take: 1000 },
  { skip: 0 },
  { take: 1000, skip: 0 },
]) {
  assert.equal(
    narrowsTheQuery(reuse),
    false,
    `a warm catalog must satisfy ${JSON.stringify(reuse)}`,
  )
}
for (const refetch of [
  { taxonomies: ['ANIMAL'] },
  { search: 'octopus' },
  { includeInactive: true },
  { includeMature: true },
  { randomizableOnly: true },
  { take: 1000, search: 'octopus' },
]) {
  assert.equal(
    narrowsTheQuery(refetch),
    true,
    `a real filter must still refetch: ${JSON.stringify(refetch)}`,
  )
}

console.log('verifyFacetCatalogCache: ok (paging hints reuse, filters refetch)')
