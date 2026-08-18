// /utils/scripts/verifyStorybookSeedQueryRaceGuard.mjs
//
// Regression guard (storybook/t-010, front-end polish). storybook-page.vue's
// seedFromQuery() treats `?scenario=`, `?location=`, `?character=`, `?facet=`
// and `?reward=` as one-shot: it consumes the value into the setup draft,
// then strips it with its own `router.replace()` -- "The query is cleared
// immediately so a reload, bookmark or share does not silently re-add the
// ingredient after the author removed it."
//
// content/storybook.md mounts `:storybook-library-page`, which renders
// `<StorybookPage />` as a child, so BOTH components' onMounted() hooks run
// on the same page load -- the child's (seedFromQuery's replace) first, then
// the parent's (storybook-library-page.vue's own onMounted), same
// synchronous tick, no await between them.
//
// storybook-library-page.vue's onMounted() calls its own updateStoryQuery()
// whenever a session is already active and the URL has no `?story=` yet
// (`storyStore.session && !directId`) -- exactly the case seedFromQuery's own
// comment describes: arriving at a deep link such as
// `/storybook?character=<slug>` (character-manager.vue's
// startStoryWithCharacter() sends exactly this, with no `story` param and no
// clearing of any existing session) while a previous story is still active in
// localStorage.
//
// router.replace() resolves asynchronously -- the reactive `route.query`
// object is not updated until the navigation's guard pipeline finishes, which
// happens after this synchronous onMounted chain returns. So when
// updateStoryQuery() builds its target query from `{ ...route.query }`, it
// still sees the stale, not-yet-stripped ingredient key, and re-includes it
// alongside `story=<id>`. Its navigation is issued after seedFromQuery's and
// wins, so the ingredient key resurfaces in the URL -- undoing the one-shot
// consumption seedFromQuery just performed. On the next reload, bookmark, or
// share of that URL, seedFromQuery() fires again and silently re-adds a stale
// ingredient the reader has already moved past into whatever story is being
// set up at that point.
//
// This asserts the fix's shape stays in place: storybook-library-page.vue
// strips the same one-shot ingredient keys from `route.query` every time it
// rewrites the query, so its own navigation can never resurrect one
// regardless of ordering against seedFromQuery's.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { extractTsFunctionBody } from './lib/extractTsFunctionBody.mjs'

const PAGE_PATH = 'components/pages/storybook-library-page.vue'
const COMPONENT_PATH = 'components/conductor/storybook-page.vue'
const FN_NAME = 'updateStoryQuery'

const pageContent = readFileSync(resolve(process.cwd(), PAGE_PATH), 'utf8')
const componentContent = readFileSync(
  resolve(process.cwd(), COMPONENT_PATH),
  'utf8',
)

const body = extractTsFunctionBody(pageContent, FN_NAME, {
  path: PAGE_PATH,
  notFoundHint:
    'has it been renamed, removed, or inlined? If so, this guard (and the ' +
    'seed-query race it protects against) needs to move with it.',
})

// The one-shot keys seedFromQuery() consumes in storybook-page.vue. Extracted
// from its own source rather than hard-coded twice, so a future ingredient
// added to seedFromQuery() without updating this list fails loudly here
// instead of silently reopening the race for just that key.
const seedKeyPattern =
  /route\.query\.(scenario|location|character|facet|reward)\b/g
const seedKeysInComponent = new Set(
  Array.from(componentContent.matchAll(seedKeyPattern), (m) => m[1]),
)
assert.ok(
  seedKeysInComponent.size >= 5,
  `Expected seedFromQuery() in ${COMPONENT_PATH} to read at least 5 one-shot ` +
    'route.query ingredient keys -- has it changed shape? This guard reads ' +
    'that list directly off seedFromQuery() to stay in sync.',
)

assert.ok(
  body.includes('SEED_QUERY_KEYS'),
  `${FN_NAME}() in ${PAGE_PATH} no longer references SEED_QUERY_KEYS -- ` +
    'it must strip every one-shot ingredient key from route.query on every ' +
    'query rewrite this component makes, or its own navigation can win a ' +
    "race against seedFromQuery()'s stripping replace() and resurrect a " +
    'key that was supposed to be consumed once.',
)

const constDeclarationMatch = pageContent.match(
  /const SEED_QUERY_KEYS\s*=\s*(?:new Set\()?\s*\[([^\]]*)\]/,
)
assert.ok(
  constDeclarationMatch,
  `Could not find \`const SEED_QUERY_KEYS = [...]\` in ${PAGE_PATH}.`,
)
// Index via optional chaining (with a nullish fallback) even though the
// assert.ok above already guarantees constDeclarationMatch is truthy here --
// this repo's capture-group-guards contract requires every capture-group
// index to be syntactically guarded at the point of use, not just asserted
// earlier in the file.
const declaredKeys = new Set(
  Array.from(
    constDeclarationMatch?.[1]?.matchAll(/'([^']+)'|"([^"]+)"/g) ?? [],
    (m) => m[1] ?? m[2],
  ),
)

for (const key of seedKeysInComponent) {
  assert.ok(
    declaredKeys.has(key),
    `SEED_QUERY_KEYS in ${PAGE_PATH} is missing '${key}', which ` +
      `seedFromQuery() in ${COMPONENT_PATH} treats as a one-shot ingredient ` +
      'key -- updateStoryQuery() can still resurrect this specific key if ' +
      'it wins the mount-order race against seedFromQuery().',
  )
}

// The strip must run before the query is handed to router.replace(), not
// after -- a `delete` placed after the `void router.replace(...)` call would
// parse and reference SEED_QUERY_KEYS but do nothing for the navigation that
// matters.
const replaceIndex = body.indexOf('router.replace(')
const stripIndex = body.indexOf('SEED_QUERY_KEYS')
assert.ok(
  replaceIndex === -1 || (stripIndex !== -1 && stripIndex < replaceIndex),
  `${FN_NAME}() in ${PAGE_PATH} must strip SEED_QUERY_KEYS from the target ` +
    'query object before calling router.replace(), not after.',
)

console.log(
  'Storybook seed-query race guard contract passed: ' +
    `${FN_NAME}() strips every one-shot ingredient key seedFromQuery() ` +
    'consumes before rewriting route.query, so it can no longer win a ' +
    "mount-order race and resurrect a key seedFromQuery()'s own replace() " +
    'just stripped.',
)
