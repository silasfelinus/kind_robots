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
// This guard is deliberately narrow, matching the legacy deep-link guards'
// convention: it checks that storybook-table.vue defines a `seedFromQuery`
// function, that it reads each of `?location=`/`?facet=`/`?reward=` and plays
// the matching card via `toggleCard()` into the right board slot, and that
// `onMounted` calls it only after the board's decks have loaded (a card can
// only be found in a deck that has already been fetched). It does not assert
// UI classes or layout -- a restyle of the Table must not fail this.
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

// Each of the three live CTAs' query keys must resolve to a real card lookup
// in the deck that slot deals from, then be played with toggleCard() -- not
// pushed onto the board as a bare slug, which the board's cards do not
// understand.
assert.ok(
  /const locationSlug = single\(route\.query\.location\)/.test(
    seedFromQueryBody,
  ) && /toggleCard\('place', toPlaceCard\(dream\)\)/.test(seedFromQueryBody),
  `seedFromQuery() in ${TABLE_PATH} must read \`route.query.location\`, look ` +
    "it up in the Place deck, and play it into the 'place' slot with " +
    'toggleCard() -- otherwise dream-narration.vue\'s "Start a story with ' +
    'this" CTA has nothing to seed.',
)

assert.ok(
  /const facetSlug = single\(route\.query\.facet\)/.test(seedFromQueryBody) &&
    /toggleCard\('genre', card\)/.test(seedFromQueryBody),
  `seedFromQuery() in ${TABLE_PATH} must read \`route.query.facet\`, look it ` +
    "up in the Genre deck, and play it into the 'genre' slot with " +
    "toggleCard() -- otherwise facet-profile.vue's CTA has nothing to seed.",
)

assert.ok(
  /const rewardSlug = single\(route\.query\.reward\)/.test(seedFromQueryBody) &&
    /toggleCard\('treasures', toTreasureCard\(reward\)\)/.test(
      seedFromQueryBody,
    ),
  `seedFromQuery() in ${TABLE_PATH} must read \`route.query.reward\`, look ` +
    "it up in the Treasures deck, and play it into the 'treasures' slot " +
    "with toggleCard() -- otherwise reward-encounter.vue's CTA has nothing " +
    'to seed.',
)

// A genre/hero card that resolves to a locked entry must be left off the
// board rather than forced past its own gate (storybook/t-038).
assert.ok(
  /const card = withGenreLock\(toGenreCard\(facet\)\)\s*\n\s*if \(!card\.locked\) toggleCard\('genre', card\)/.test(
    seedFromQueryBody,
  ),
  `seedFromQuery() in ${TABLE_PATH} must skip playing a genre card that ` +
    'withGenreLock() reports as locked -- a deep link must not bypass the ' +
    'gate every other path into that slot respects.',
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
  assert.ok(
    match,
    `Could not find \`onMounted(async () => { ... })\` in ${TABLE_PATH} -- ` +
      'has it been renamed, removed, or restructured? If so, this guard ' +
      'needs to move with it.',
  )
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
    'board slot via toggleCard(), respects genre gating, clears the query, ' +
    'and only runs once the decks it looks cards up in have loaded.',
)
