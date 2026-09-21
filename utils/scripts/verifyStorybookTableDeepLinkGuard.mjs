// /utils/scripts/verifyStorybookTableDeepLinkGuard.mjs
//
// Regression guard (storybook/t-055). dream-narration.vue, reward-encounter.vue
// and facet-profile.vue each link into Storybook with `?location=`/`?reward=`/
// `?facet=` in the URL, expecting the same pre-fill the LEGACY
// storybook-page.vue's own seedFromQuery() used to give them (see
// verifyStorybookLocationDeepLinkGuard.mjs and
// verifyStorybookCharacterDeepLinkGuard.mjs for that half of the contract).
// But storybook-page.vue is not the default screen any more -- the new-engine
// storybook-table.vue is (storybook-storymaker.vue mounts it whenever no run
// is open) -- and storybook-table.vue had no query handling at all, so all
// three CTAs silently dropped the reader's chosen ingredient on arrival.
//
// Rewritten for storybook/t-061: seedFromQuery() no longer hand-rolls a
// per-key deck lookup + toggleCard() call. It now maps each query key to a
// slot and resolves it through cardForSlug()/playCardIfAbsent() -- the same
// pair seedFromPlayAgain() uses (storybook/t-060) -- so this guard checks
// that pairing instead of pinning the old literal toggleCard() shapes. The
// genre-lock check moved with the logic: withGenreLock() is now applied
// inside cardForSlug()'s 'genre' case, not in seedFromQuery() itself, so
// that assertion now reads cardForSlug()'s body.
//
// This guard is deliberately narrow, matching the legacy deep-link guards'
// convention: it does not assert UI classes or layout -- a restyle of the
// Table must not fail this.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { extractTsFunctionBody } from './lib/extractTsFunctionBody.mjs'

const TABLE_PATH = 'components/storybook/storybook-table.vue'

function source(path) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

const tableContent = source(TABLE_PATH)

const seedFromQueryBody = extractTsFunctionBody(tableContent, 'seedFromQuery', {
  path: TABLE_PATH,
  notFoundHint:
    'has it been renamed, removed, or inlined? If so, this guard needs to ' +
    'move with it.',
})

const cardForSlugBody = extractTsFunctionBody(tableContent, 'cardForSlug', {
  path: TABLE_PATH,
  notFoundHint:
    'seedFromQuery() resolves query slugs to cards through cardForSlug() ' +
    '(storybook/t-061) -- has it been renamed, removed, or inlined? If so, ' +
    'this guard needs to move with it.',
})

// Each of the three live CTAs' query keys must still be read by
// seedFromQuery() and mapped to the slot its deck deals from.
for (const [key, slot] of [
  ['location', 'place'],
  ['facet', 'genre'],
  ['reward', 'treasures'],
]) {
  assert.ok(
    new RegExp(`route\\.query\\.${key}`).test(seedFromQueryBody),
    `seedFromQuery() in ${TABLE_PATH} must read route.query.${key} -- ` +
      `otherwise the '${slot}' slot has nothing to seed.`,
  )
}

// The resolution must go through cardForSlug()/playCardIfAbsent() -- the
// same pair seedFromPlayAgain() uses -- rather than a bespoke per-key deck
// lookup + toggleCard() call.
assert.ok(
  /cardForSlug\(/.test(seedFromQueryBody) &&
    /playCardIfAbsent\(/.test(seedFromQueryBody),
  `seedFromQuery() in ${TABLE_PATH} must resolve each query slug through ` +
    'cardForSlug() and play it with playCardIfAbsent() (storybook/t-061) ' +
    '-- otherwise it has drifted back to a bespoke per-key lookup.',
)

// A genre card that resolves to a locked entry must be left off the board
// rather than forced past its own gate (storybook/t-038). That check now
// lives inside cardForSlug()'s 'genre' case, not in seedFromQuery() itself
// (storybook/t-061).
assert.ok(
  /withGenreLock\(toGenreCard\(facet\)\)/.test(cardForSlugBody) &&
    /card\.locked \? null : card/.test(cardForSlugBody),
  `cardForSlug() in ${TABLE_PATH} must resolve a genre slug through ` +
    'withGenreLock() and return null for a locked card -- a deep link must ' +
    'not bypass the gate every other path into that slot respects.',
)

// The query must still be cleared afterward, matching every other seed-once
// entry point in this app (facets?create=1, the legacy seedFromQuery): a
// reload or bookmark must not silently re-seed a card the reader removed.
assert.ok(
  /void router\.replace\(\{ query \}\)/.test(seedFromQueryBody),
  `seedFromQuery() in ${TABLE_PATH} must clear the consumed query keys via ` +
    'router.replace() -- otherwise reloading or bookmarking the deep-linked ' +
    'URL re-adds the card every time.',
)

// The receiving half of the contract: onMounted must call seedFromQuery()
// only after the board's decks (dreamStore/facetStore/rewardStore/etc.) have
// loaded -- calling it before means every lookup above finds nothing.
const onMountedBody = (() => {
  const match = /onMounted\(async \(\) => \{([\s\S]*?)\n\}\)/.exec(tableContent)
  if (!match) {
    throw new Error(
      `Could not find \`onMounted(async () => { ... })\` in ${TABLE_PATH} -- ` +
        'has it been renamed, removed, or restructured? If so, this guard ' +
        'needs to move with it.',
    )
  }
  return match[1]
})()
const allSettledIndex = onMountedBody.indexOf('Promise.allSettled')
const seedCallIndex = onMountedBody.indexOf('seedFromQuery()')
assert.ok(
  allSettledIndex !== -1 && seedCallIndex !== -1,
  `onMounted() in ${TABLE_PATH} must await Promise.allSettled(...) and call ` +
    'seedFromQuery() -- has the mount sequence been restructured? If so, ' +
    'this guard needs to move with it.',
)
assert.ok(
  seedCallIndex > allSettledIndex,
  `onMounted() in ${TABLE_PATH} must call seedFromQuery() AFTER awaiting ` +
    'Promise.allSettled([...]) -- calling it earlier means every deck ' +
    'lookup above runs against empty stores and silently finds nothing.',
)

console.log(
  "Storybook table deep-link guard contract passed: storybook-table.vue's " +
    'seedFromQuery() consumes ?location=/?facet=/?reward= into the matching ' +
    'board slot via cardForSlug()/playCardIfAbsent(), respects genre ' +
    'gating, clears the query, and only runs once the decks it looks cards ' +
    'up in have loaded.',
)
