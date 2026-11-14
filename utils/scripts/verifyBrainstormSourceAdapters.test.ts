// /utils/scripts/verifyBrainstormSourceAdapters.test.ts
//
// Regression guard for conductor brainstorm/t-012's adapter dispatch/fallback
// logic (stores/helpers/brainstormSourceAdapterKit.ts). Exercises it in
// isolation via injected fake adapters -- the real character/dream/scenario
// adapters (brainstormSourceAdapters.ts, the last added in brainstorm/t-014)
// call Pinia stores that need a live Nuxt runtime, which this test
// intentionally never touches; the kit module has no such dependency, which
// is exactly why the split exists.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  fetchFreshSourceRows,
  getBrainstormSourceAdapter,
  resolveBrainstormSource,
  searchBrainstormSources,
  type BrainstormSourceAdapter,
} from '../../stores/helpers/brainstormSourceAdapterKit.js'

const fakeCharacterAdapter: BrainstormSourceAdapter = {
  modelType: 'character',
  label: 'Character',
  async resolve(ref) {
    if (ref.id === 1) {
      return {
        modelType: 'character',
        id: 1,
        title: 'Captain Marrow',
        subtitle: 'Rogue · Human',
        thumbnailUrl: '/images/marrow.webp',
      }
    }
    return null // simulates a deleted/missing row
  },
  async search(query) {
    const rows = [{ id: 1, title: 'Captain Marrow', subtitle: 'Rogue' }]
    return rows
      .filter((row) => row.title.toLowerCase().includes(query.toLowerCase()))
      .map((row) => ({ modelType: 'character', ...row }))
  },
}

const throwingAdapter: BrainstormSourceAdapter = {
  modelType: 'scenario',
  label: 'Scenario',
  async resolve() {
    throw new Error('network exploded')
  },
  async search() {
    return []
  },
}

const registry = {
  character: fakeCharacterAdapter,
  scenario: throwingAdapter,
}

async function main() {
  // Registered modelType, case-insensitive lookup.
  assert.equal(
    getBrainstormSourceAdapter('character', registry),
    fakeCharacterAdapter,
  )
  assert.equal(
    getBrainstormSourceAdapter('CHARACTER', registry),
    fakeCharacterAdapter,
  )
  assert.equal(getBrainstormSourceAdapter('dream', registry), null)
  assert.equal(getBrainstormSourceAdapter(null, registry), null)

  // null ref resolves to null, not a fallback object.
  assert.equal(await resolveBrainstormSource(null, registry), null)

  // Registered adapter, successful resolve passes through untouched.
  const resolved = await resolveBrainstormSource(
    { modelType: 'character', id: 1 },
    registry,
  )
  assert.deepEqual(resolved, {
    modelType: 'character',
    id: 1,
    title: 'Captain Marrow',
    subtitle: 'Rogue · Human',
    thumbnailUrl: '/images/marrow.webp',
  })

  // Registered adapter, resolve misses (deleted row) -- generic fallback,
  // distinguishable "no longer available" subtitle, never null.
  const missing = await resolveBrainstormSource(
    { modelType: 'character', id: 999, slug: 'ghost-captain' },
    registry,
  )
  assert.ok(missing)
  assert.equal(missing?.title, 'ghost-captain')
  assert.equal(missing?.subtitle, 'No longer available')
  assert.equal(missing?.thumbnailUrl, null)

  // Registered adapter that throws -- caught, same fallback shape, no crash.
  const errored = await resolveBrainstormSource(
    { modelType: 'scenario', id: 5 },
    registry,
  )
  assert.ok(errored)
  assert.equal(errored?.title, 'scenario #5')
  assert.equal(errored?.subtitle, 'No longer available')

  // Unregistered modelType -- fallback built purely from the ref, distinct
  // subtitle from the "adapter exists but missed" case above.
  const unsupported = await resolveBrainstormSource(
    { modelType: 'bot', id: 3 },
    registry,
  )
  assert.ok(unsupported)
  assert.equal(unsupported?.title, 'bot #3')
  assert.equal(unsupported?.subtitle, 'Unsupported source type "bot"')

  // Fallback title prefers slug over the "#id" shape when both are present.
  const withSlug = await resolveBrainstormSource(
    { modelType: 'bot', id: 3, slug: 'the-narrator' },
    registry,
  )
  assert.equal(withSlug?.title, 'the-narrator')

  // Search delegates to the matched adapter and filters correctly.
  const hits = await searchBrainstormSources('character', 'marrow', registry)
  assert.equal(hits.length, 1)
  assert.equal(hits[0]?.title, 'Captain Marrow')

  const misses = await searchBrainstormSources('character', 'nobody', registry)
  assert.equal(misses.length, 0)

  // Search against an unregistered modelType returns empty, not an error.
  const unregistered = await searchBrainstormSources(
    'reward',
    'anything',
    registry,
  )
  assert.deepEqual(unregistered, [])

  // Source search must fail closed when a fresh authorization/list fetch
  // fails, even if the underlying store deliberately hands back cached rows
  // for offline-friendly surfaces. This simulates a cached private row from a
  // prior auth context plus a failed forced fetch: the picker must expose zero
  // candidates. A successful fresh fetch may return the same row normally.
  const cachedPrivateRows = [{ id: 99, title: 'Private Before Logout' }]
  assert.deepEqual(
    await fetchFreshSourceRows(
      async () => cachedPrivateRows,
      () => true,
    ),
    [],
  )
  assert.deepEqual(
    await fetchFreshSourceRows(
      async () => cachedPrivateRows,
      () => false,
    ),
    cachedPrivateRows,
  )

  // Real character adapter must revalidate authorization on every resolve,
  // not serve a cached/localStorage row: a persisted BrainstormSourceRef can
  // outlive an auth transition, and the server route's canView check only
  // runs on the live /api/characters/:id fetch, not the cached-store lookup.
  // Exercising this against the live Pinia store needs a Nuxt runtime this
  // sandbox doesn't have (documented repeatedly for this repo), so this
  // asserts the source contract directly -- same pattern as
  // verifyAchievementStoreFetchSafety.ts (reviewer finding on PR #1820).
  const adapterSource = readFileSync(
    'stores/helpers/brainstormSourceAdapters.ts',
    'utf8',
  )
  assert.ok(
    adapterSource.includes('store.fetchCharacterById(ref.id, true)'),
    'characterAdapter.resolve must force a fresh Character fetch (force=true) ' +
      'so a stale cached row cannot bypass canView after an auth transition.',
  )

  // Character and Dream search must both feed their fresh remote result through
  // the fail-closed helper, and neither may search the store's cached list after
  // revalidation fails. Character also still forces the remote list fetch.
  assert.ok(
    adapterSource.includes('() => store.fetchCharacters(true)') &&
      adapterSource.includes('return freshCharacters'),
    'characterAdapter.search must force a fresh Character list fetch and search ' +
      'only the fail-closed fresh result.',
  )
  assert.ok(
    adapterSource.includes('() => store.fetchDreams()') &&
      adapterSource.includes('return freshDreams'),
    'dreamAdapter.search must search only the fail-closed fresh result rather ' +
      'than store.dreams after a failed remote fetch.',
  )
  assert.ok(
    !adapterSource.includes('return store.characters') &&
      !adapterSource.includes('return store.dreams'),
    'Brainstorm source search must never return cached Character or Dream lists directly.',
  )

  // conductor brainstorm/t-014: Scenario as the second lightweight adapter
  // added beyond Character/Dream. Same force-revalidate and fail-closed
  // search discipline applies -- a cached/localStorage Scenario can predate
  // an auth transition exactly like a cached Character or Dream can.
  assert.ok(
    adapterSource.includes('scenario: scenarioAdapter'),
    'the client-side adapter registry must register a scenario entry',
  )
  assert.ok(
    adapterSource.includes('store.fetchScenarioById(ref.id, true)'),
    'scenarioAdapter.resolve must force a fresh Scenario fetch (force=true) ' +
      'so a stale cached row cannot bypass canView after an auth transition.',
  )
  assert.ok(
    adapterSource.includes('() => store.fetchScenarios(true)') &&
      adapterSource.includes('return freshScenarios'),
    'scenarioAdapter.search must force a fresh Scenario list fetch and search ' +
      'only the fail-closed fresh result.',
  )
  assert.ok(
    !adapterSource.includes('return store.scenarios'),
    'Brainstorm source search must never return the cached Scenario list directly.',
  )

  console.log(
    'Brainstorm source adapter registry verified: case-insensitive lookup, ' +
      'successful resolve passthrough, missing-row and unregistered-modelType ' +
      'fallbacks, thrown-adapter recovery, search dispatch/filtering, the ' +
      'Character/Scenario adapter force-revalidate contracts, fail-closed fresh ' +
      'source searches (brainstorm/t-012, t-014). The retired workbench that ' +
      'consumed it was removed 2026-11-14.',
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
