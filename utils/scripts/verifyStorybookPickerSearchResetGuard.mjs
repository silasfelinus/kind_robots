// /utils/scripts/verifyStorybookPickerSearchResetGuard.mjs
//
// Regression guard (storybook/t-010, front-end polish). Both narrative
// ingredient pickers render their search box only while the option list is
// longer than `initialLimit` (`v-if="searchVisible"`). The lists they are fed
// are store-derived -- storybook-page.vue maps `characterStore.browseCharacters`,
// the Dream/Reward/Facet stores' active filters, and taskmaster-page.vue swaps
// whole option sets with its mode toggle -- so a list can shrink AFTER a reader
// has typed a query. Before the fix the box then vanished but `query` kept
// filtering: the picker showed "No matching characters. Clear the search or
// leave the narrator free to choose." with no search left on screen to clear,
// and every option was hidden until the reader reloaded.
//
// Fix shape this asserts, in both components:
//   - a `searchVisible` computed owns the visibility rule, and the search
//     `<label>` renders from it (not from an inline length comparison);
//   - a `watch(searchVisible, ...)` clears `query` when it turns false.
// Plus, in the multi-picker only: `aria-describedby` must not name the count
// badge while `loading`, because that badge is `v-else` to the spinner and its
// id does not exist in the DOM during loading (a dangling reference).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function source(path) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

const PICKERS = [
  'components/narrative/narrative-ingredient-picker.vue',
  'components/narrative/narrative-ingredient-multi-picker.vue',
]

for (const path of PICKERS) {
  const content = source(path)

  assert.ok(
    content.includes('v-if="searchVisible"'),
    `${path}: the search <label> must render from \`v-if="searchVisible"\` so ` +
      'the visibility rule has exactly one owner the reset watcher can share.',
  )
  assert.ok(
    !/v-if="items\.length\s*>\s*initialLimit"/.test(content),
    `${path}: the search box must not use an inline \`items.length > ` +
      'initialLimit` test any more -- that is the shape that let the query ' +
      'outlive its input.',
  )
  assert.ok(
    /const searchVisible = computed\(\s*\(\) =>\s*props\.items\.length > Math\.max\(1, props\.initialLimit\),?\s*\)/.test(
      content,
    ),
    `${path}: expected \`const searchVisible = computed(() => ` +
      'props.items.length > Math.max(1, props.initialLimit))`.',
  )
  assert.ok(
    /watch\(searchVisible, \(visible\) => \{\s*if \(!visible\) query\.value = ''\s*\}\)/.test(
      content,
    ),
    `${path}: expected a \`watch(searchVisible, ...)\` that clears \`query\` ` +
      'when the search box stops rendering.',
  )
}

const multi = source(PICKERS[1])
assert.ok(
  multi.includes("props.loading ? '' : countId"),
  `${PICKERS[1]}: aria-describedby must drop the count badge id while loading ` +
    '(the badge is v-else to the spinner, so its id is absent from the DOM then).',
)

console.log(
  'Storybook picker search reset guard passed: both pickers clear a stranded ' +
    'query when their search box stops rendering; multi-picker describedby has ' +
    'no dangling id while loading.',
)
