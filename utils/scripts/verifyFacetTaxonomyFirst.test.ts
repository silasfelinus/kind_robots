// /utils/scripts/verifyFacetTaxonomyFirst.test.ts
//
// The Facet gallery opens on the TAXONOMIES and loads a collection only when
// one is picked.
//
// Silas, 2026-09-21: "when we get facets, wouldn't it be better to be getting
// the types first, then loading the appropriate collection when a user selects
// to move down a level?"
//
// What it replaced: 1,736 catalog rows downloaded and 1,717 cards built in one
// scroll, to render 26 headings and their counts. On a phone that is the whole
// cost of the screen, paid before the first picture is even requested.
//
// The three things that can quietly undo it:
//
//   1. The index gets its counts from the full catalog again, so the drill-down
//      saves the rendering and none of the transfer.
//   2. A narrowed read is assigned to the shared store, which would leave the
//      builder decks holding one taxonomy and believing it to be the catalog.
//   3. The index and the drill-down stop applying the same visibility rules,
//      so a tile promises 143 Facets and opens on 97.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path: string): string => readFileSync(path, 'utf8')

const gallery = read('components/facets/facet-gallery.vue')
const store = read('stores/facetCatalogStore.ts')
const endpoint = read('server/api/facets/taxonomies.get.ts')
const catalogUtil = read('server/utils/facetCatalog.ts')
const interact = read('components/facets/facet-interact.vue')

/* ── 1. The index is its own cheap request. ─────────────────────────────── */

assert.ok(
  gallery.includes("'/api/facets/taxonomies'"),
  'the gallery must open on the taxonomy index endpoint',
)
assert.ok(
  !/catalog\.fetchCatalog\(/.test(gallery),
  'the gallery must never load the whole catalog -- that is the cost this ' +
    'whole shape exists to stop paying',
)
assert.ok(
  !/catalog\.fetchCatalog\(/.test(interact),
  'facet-interact must resolve a deep link with fetchFacetBySlug, not by ' +
    'downloading 1,736 rows to find one',
)
assert.ok(
  interact.includes('fetchFacetBySlug'),
  'a ?facet=<slug> deep link must still resolve on a cold load',
)

/* ── 2. A slice is returned, never assigned to the shared store. ────────── */

assert.ok(
  gallery.includes('fetchCatalogSlice('),
  'the drill-down must read a narrowed slice',
)
const sliceBody = store.match(
  /async function fetchCatalogSlice\([\s\S]*?\n {2}}/,
)
assert.ok(sliceBody?.[0], 'fetchCatalogSlice could not be located')
assert.ok(
  !/entries\.value\s*=/.test(sliceBody[0]),
  'fetchCatalogSlice must RETURN its rows -- assigning them to `entries` is ' +
    'how a gallery drilling into ANIMAL would hand every other consumer 143 ' +
    'rows and call it the catalog',
)

const fetchCatalogBody = store.match(
  /async function fetchCatalog\([\s\S]*?\n {2}}/,
)
assert.ok(fetchCatalogBody?.[0], 'fetchCatalog could not be located')
assert.ok(
  /entries\.value\s*=/.test(fetchCatalogBody[0]),
  'fetchCatalog still owns the shared catalog; the two must not converge',
)

/* ── 3. Index and drill-down agree on who can see what. ─────────────────── */

// The row-level predicate, whose reference is the catalog loader itself.
for (const clause of [
  'isActive: true',
  'isMature: false',
  'isPublic: true',
  'viewablePackIds',
]) {
  assert.ok(
    endpoint.includes(clause),
    `the taxonomy index must apply the same visibility rule as the catalog ` +
      `loader (${clause}), or a tile counts Facets the drill-down refuses`,
  )
  assert.ok(
    catalogUtil.includes(clause),
    `the catalog loader is the reference for ${clause}`,
  )
}

/*
 * ...and the maturity decision, which the loader takes as a plain boolean and
 * the ROUTE resolves from the viewer's own account. Both Facet routes have to
 * resolve it the same way or the index and the drill-down disagree about an
 * adult viewer.
 */
const catalogRoute = read('server/api/facets/catalog.get.ts')
for (const source of [endpoint, catalogRoute]) {
  assert.ok(
    source.includes('viewerShowsMature'),
    'both Facet routes must let the account decide maturity, never the caller',
  )
}

assert.ok(
  /normalizeTaxonomy\(profile\.taxonomy\)/.test(endpoint),
  'an unrecognized taxonomy must normalize to OTHER exactly as the catalog ' +
    'loader does; counting the raw value drops those Facets out of the index',
)

/* ── The URL carries the level, so every view stays linkable. ───────────── */

assert.ok(
  gallery.includes('route.query.taxonomy'),
  'the selected taxonomy must live in the URL, same house rule as ?facet=',
)

console.log(
  'verifyFacetTaxonomyFirst: ok (index is its own request, slices stay local, ' +
    'visibility matches, level is linkable)',
)
