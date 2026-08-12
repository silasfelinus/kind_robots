// /utils/scripts/verifyBrainstormSourceAdapters.test.ts
//
// Regression guard for conductor brainstorm/t-012's adapter dispatch/fallback
// logic (stores/helpers/brainstormSourceAdapterKit.ts). Exercises it in
// isolation via injected fake adapters -- the real character/dream adapters
// (brainstormSourceAdapters.ts) call Pinia stores that need a live Nuxt
// runtime, which this test intentionally never touches; the kit module has
// no such dependency, which is exactly why the split exists.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
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

  // The source watcher in brainstorm-manager.vue must guard against a
  // slower, superseded resolve overwriting a later selection or resurrecting
  // a removed source -- request-identity/token invalidation, not just a
  // loading flag.
  const managerSource = readFileSync(
    'components/brainstorm/brainstorm-manager.vue',
    'utf8',
  )
  assert.ok(
    managerSource.includes('let sourceResolveToken = 0'),
    'brainstorm-manager.vue must track a request-identity token for the ' +
      'source resolve watcher.',
  )
  assert.ok(
    managerSource.includes('if (token !== sourceResolveToken) return'),
    'A stale resolve (token mismatch) must not overwrite resolvedSource.',
  )
  assert.ok(
    /if\s*\(!ref\)\s*\{\s*resolvedSource\.value = null\s*\n\s*isResolvingSource\.value = false/.test(
      managerSource,
    ),
    'Clearing the source (ref becomes null) must reset isResolvingSource too, ' +
      'so a superseded in-flight resolve cannot leave the loading flag stuck.',
  )

  console.log(
    'Brainstorm source adapter registry verified: case-insensitive lookup, ' +
      'successful resolve passthrough, missing-row and unregistered-modelType ' +
      'fallbacks, thrown-adapter recovery, search dispatch/filtering, the ' +
      "Character adapter force-revalidate contract, and the source watcher's " +
      'request-identity invalidation contract (brainstorm/t-012).',
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
