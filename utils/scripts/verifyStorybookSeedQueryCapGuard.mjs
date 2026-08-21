// /utils/scripts/verifyStorybookSeedQueryCapGuard.mjs
//
// Regression guard (storybook/t-010, front-end polish, cycle 25). Cycle 24's
// kaizen lead about castRoles stickiness turned out not to be a live bug (a
// per-slug sidecar map can't leak between different characters, and the
// duplicate-role warning only ever looks at the currently-selected cast) --
// see the cycle 25 PR description for that finding. This guard covers a
// different, real gap found while re-reading the same setup surface.
//
// storybook-page.vue's three cast/Facet/Reward pickers
// (NarrativeIngredientMultiPicker) each cap how many slugs their v-model
// array may hold -- `:max-selections="MAX_CAST_SELECTIONS"` (5),
// `MAX_FACET_SELECTIONS` (5), `MAX_REWARD_SELECTIONS` (3) -- enforced by the
// picker's own toggle(): once modelValue.length reaches that cap, every
// unselected card disables itself and a further click is a no-op. But that
// enforcement lives entirely in click handling; the picker never clamps an
// oversized `modelValue` it is simply handed.
//
// seedFromQuery() is a second way a slug joins one of those same arrays --
// deep-linking `/storybook?character=<slug>` (or `?facet=`/`?reward=`) seeds
// the setup draft "on top of" whatever a reader already has assembled,
// including a draft restored from localStorage with a field already at its
// cap. Before this fix, seedFromQuery()'s addOnce() helper pushed the deep-
// linked slug unconditionally as long as it was not already present --
// oblivious to the field's own maxSelections. A reader who had already
// picked 3 Rewards (the max) and then followed a "Start a story with this
// Reward" link for a 4th landed back on Storybook with 4 Rewards in the
// draft: the picker's own badge read "4 / 3 selected", every other Reward
// card was disabled (modelValue.length >= maxSelections), and -- silently,
// with no error anywhere -- beginStory() would have carried all 4 into the
// story bible, one more than the picker's own contract ever allowed a reader
// to assemble by clicking.
//
// This asserts addOnce() takes a `max` argument and refuses to push once the
// list is already at it, and that each of the three call sites passes the
// same named constant the matching picker's :max-selections prop uses --
// one source of truth, so the enforced cap can't drift between the picker's
// own UI and the deep-link path that bypasses it.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { extractTsFunctionBody } from './lib/extractTsFunctionBody.mjs'

const PAGE_PATH = 'components/conductor/storybook-page.vue'

const pageContent = readFileSync(resolve(process.cwd(), PAGE_PATH), 'utf8')

// --- The three cap constants, and the field each one governs. -------------
const CAPS = [
  {
    constName: 'MAX_CAST_SELECTIONS',
    expected: 5,
    modelValue: 'store.setupDraft.castSlugs',
    queryKey: 'character',
    field: 'draft.castSlugs',
  },
  {
    constName: 'MAX_FACET_SELECTIONS',
    expected: 5,
    modelValue: 'store.setupDraft.facetSlugs',
    queryKey: 'facet',
    field: 'draft.facetSlugs',
  },
  {
    constName: 'MAX_REWARD_SELECTIONS',
    expected: 3,
    modelValue: 'store.setupDraft.rewardSlugs',
    queryKey: 'reward',
    field: 'draft.rewardSlugs',
  },
]

for (const cap of CAPS) {
  const constMatch = pageContent.match(
    new RegExp(`const ${cap.constName}\\s*=\\s*(\\d+)`),
  )
  assert.ok(
    constMatch,
    `Could not find \`const ${cap.constName} = <number>\` in ${PAGE_PATH} -- ` +
      'has the shared cap constant been renamed, removed, or inlined back ' +
      'into a magic number? If so, this guard (and the seed-query cap ' +
      'bypass it protects against) needs to move with it.',
  )
  const constValue = constMatch?.[1] ?? null
  assert.equal(
    constValue,
    String(cap.expected),
    `${cap.constName} in ${PAGE_PATH} is ${constValue}, expected ` +
      `${cap.expected} -- if the picker's real cap changed intentionally, ` +
      'update this guard alongside it.',
  )

  // The picker itself: :max-selections must reference the same named
  // constant, not a re-typed literal that can silently drift from it.
  const modelValueIndex = pageContent.indexOf(`v-model="${cap.modelValue}"`)
  assert.ok(
    modelValueIndex !== -1,
    `Could not find the ${cap.modelValue} picker (v-model="${cap.modelValue}") ` +
      `in ${PAGE_PATH} -- has it been renamed, removed, or restructured?`,
  )
  const pickerBlockEnd = pageContent.indexOf('/>', modelValueIndex)
  assert.ok(
    pickerBlockEnd !== -1,
    `Could not find the end of the ${cap.modelValue} picker's tag in ${PAGE_PATH}.`,
  )
  const pickerBlock = pageContent.slice(modelValueIndex, pickerBlockEnd)
  assert.ok(
    pickerBlock.includes(`:max-selections="${cap.constName}"`),
    `The ${cap.modelValue} picker in ${PAGE_PATH} must bind ` +
      `:max-selections="${cap.constName}" -- a re-typed numeric literal here ` +
      'can drift from the cap seedFromQuery() enforces for the same field.',
  )
}

// --- addOnce() itself must refuse to push once the list is at its cap. ----
const seedFromQueryBody = extractTsFunctionBody(pageContent, 'seedFromQuery', {
  path: PAGE_PATH,
  notFoundHint:
    'has it been renamed, removed, or inlined? If so, this guard needs to ' +
    'move with it.',
})

const addOnceMatch = seedFromQueryBody.match(
  /const addOnce = \(list: string\[\], slug: string \| null, max: number\) => \{([\s\S]*?)\n {2}\}/,
)
assert.ok(
  addOnceMatch,
  `seedFromQuery()'s addOnce() helper in ${PAGE_PATH} no longer has the ` +
    'expected `(list, slug, max)` signature -- has it been rewritten? If a ' +
    'deep-linked slug can once again be pushed without regard to the ' +
    "field's own selection cap, this guard (and the reader-visible " +
    '"N / max selected" overcount it protects against) needs attention.',
)
const addOnceBody = addOnceMatch?.[1] ?? ''
assert.ok(
  /list\.length < max/.test(addOnceBody),
  `seedFromQuery()'s addOnce() helper in ${PAGE_PATH} must guard its push ` +
    'with `list.length < max` -- without it, a deep-linked ingredient can ' +
    "silently exceed the picker's own enforced maximum.",
)

for (const cap of CAPS) {
  const callPattern = new RegExp(
    `addOnce\\(${cap.field.replace('.', '\\.')},\\s*single\\(route\\.query\\.${cap.queryKey}\\),\\s*${cap.constName}\\)`,
  )
  assert.ok(
    callPattern.test(seedFromQueryBody),
    `seedFromQuery() in ${PAGE_PATH} must call ` +
      `addOnce(${cap.field}, single(route.query.${cap.queryKey}), ${cap.constName}) -- ` +
      'passing a mismatched or missing cap argument here reopens the gap ' +
      'where a deep link can push a field past the maximum its own picker ' +
      'enforces.',
  )
}

console.log(
  'Storybook seed-query cap guard contract passed: seedFromQuery() bounds ' +
    'every deep-linked cast/Facet/Reward slug by the same cap its picker ' +
    'enforces in the UI, so a link can no longer silently push a field past ' +
    "its picker's own maximum.",
)
