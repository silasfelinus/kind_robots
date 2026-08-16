// /utils/scripts/verifyStorybookCharacterDeepLinkGuard.mjs
//
// Regression guard (storybook/t-010, front-end polish). Storybook can be
// deep-linked with an ingredient already chosen -- Silas: "we should have
// links to these elements that start the process to tell a storybook story
// with that element as part of it." storybook-page.vue's seedFromQuery()
// reads `?scenario=`, `?location=`, `?character=`, `?facet=` and `?reward=`
// off the route and pushes the raw query value straight into the matching
// setupDraft field, on the assumption that the value IS the slug the
// corresponding `*Options` computed will key against later.
//
// That assumption held for scenarioOptions, locationOptions, facetOptions
// and rewardOptions -- each maps `slug: entity.slug || String(entity.id)`,
// the same real slug field scenario-manager.vue, facet-profile.vue and
// reward-encounter.vue read off their selected entity before navigating
// here (`query: { scenario: slug }` etc, where `slug = store.selected*?.slug`).
//
// characterOptions was the one outlier: it built a synthetic
// `slug: \`character-${character.id}\`` that never matched the real
// `character.slug` character-manager.vue's startStoryWithCharacter() sends
// as `?character=<slug>`. The result: clicking "Start a story with this
// character" navigated to Storybook, but `castSlugs.includes(item.slug)`
// never matched any characterOptions entry, so the character never appeared
// selected in the cast picker and beginStory()'s `cast:` array silently
// excluded it -- while the orphaned raw slug string sat in castSlugs anyway,
// quietly consuming one of the 5 max cast selections the picker enforces.
// No error, no visible indication, just a story that silently lost its
// deep-linked character.
//
// This asserts characterOptions keys off the real Character slug (falling
// back to the synthetic id-based form only when a character has none), and
// that both ends of the deep-link contract -- the sender in
// character-manager.vue and the receiver in storybook-page.vue -- still
// agree on sending/reading a real slug.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { extractTsFunctionBody } from './lib/extractTsFunctionBody.mjs'

const PAGE_PATH = 'components/conductor/storybook-page.vue'
const MANAGER_PATH = 'components/characters/character-manager.vue'

const pageContent = readFileSync(resolve(process.cwd(), PAGE_PATH), 'utf8')

const optionsStart = pageContent.indexOf('const characterOptions = computed')
assert.ok(
  optionsStart !== -1,
  `Could not find \`const characterOptions = computed\` in ${PAGE_PATH} -- ` +
    'has it been renamed, removed, or restructured? If so, this guard (and ' +
    'the dropped-character-deep-link bug it protects against) needs to ' +
    'move with it.',
)
const optionsEnd = pageContent.indexOf(
  'const scenarioOptions = computed',
  optionsStart,
)
assert.ok(
  optionsEnd !== -1 && optionsEnd > optionsStart,
  `Could not find the end of the characterOptions computed in ${PAGE_PATH} ` +
    '(expected `scenarioOptions` to follow it) -- has the ingredient ' +
    'option list been reordered or restructured?',
)
const characterOptionsBlock = pageContent.slice(optionsStart, optionsEnd)

assert.ok(
  /slug:\s*character\.slug\s*\|\|\s*`character-\$\{character\.id\}`/.test(
    characterOptionsBlock,
  ),
  'characterOptions in ' +
    PAGE_PATH +
    ' must key off the real `character.slug` (falling back to the ' +
    'synthetic `character-${character.id}` only when a character has no ' +
    'slug) -- a bare `character-${character.id}` slug never matches the ' +
    'real slug character-manager.vue sends via `?character=<slug>`, so a ' +
    'reader who clicks "Start a story with this character" gets a story ' +
    'whose cast silently excludes the very character they picked, while ' +
    'the unmatched slug still occupies one of the 5 max cast selections.',
)

// The receiving half of the contract: seedFromQuery() must still forward the
// raw ?character= query value into castSlugs unmodified -- the fix above is
// dead unless this still wires the query into the field characterOptions
// now actually matches against.
const seedFromQueryBody = extractTsFunctionBody(pageContent, 'seedFromQuery', {
  path: PAGE_PATH,
  notFoundHint:
    'has it been renamed, removed, or inlined? If so, this guard needs to ' +
    'move with it.',
})
assert.ok(
  /addOnce\(draft\.castSlugs,\s*single\(route\.query\.character\)\)/.test(
    seedFromQueryBody,
  ),
  `seedFromQuery() in ${PAGE_PATH} must still push \`route.query.character\` ` +
    'into `draft.castSlugs` -- otherwise the characterOptions fix above has ' +
    'nothing to match against.',
)

// The sending half of the contract: character-manager.vue must still send
// the character's real `.slug`, not its id or any other field, or the two
// ends drift apart again in the opposite direction.
const managerContent = readFileSync(
  resolve(process.cwd(), MANAGER_PATH),
  'utf8',
)
const startStoryBody = extractTsFunctionBody(
  managerContent,
  'startStoryWithCharacter',
  {
    path: MANAGER_PATH,
    notFoundHint:
      'has it been renamed, removed, or inlined? If so, this guard needs ' +
      'to move with it.',
  },
)
assert.ok(
  /const slug = characterStore\.selectedCharacter\?\.slug/.test(
    startStoryBody,
  ) && /query:\s*\{\s*character:\s*slug\s*\}/.test(startStoryBody),
  `startStoryWithCharacter() in ${MANAGER_PATH} must still send the ` +
    "selected character's real `.slug` as `?character=` -- otherwise it " +
    'no longer agrees with what characterOptions now matches against.',
)

console.log(
  'Storybook character-deep-link guard contract passed: characterOptions ' +
    "keys off the real Character slug, so character-manager.vue's " +
    '"Start a story with this character" link actually seats the character ' +
    'in the cast instead of silently dropping it.',
)
