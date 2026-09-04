// /utils/scripts/verifyStorybookPickerRestoredSelectionGuard.mjs
//
// Regression guard (storybook/t-010, front-end polish). Both narrative
// ingredient pickers collapse to `initialLimit` options by default and only
// grow when the reader clicks "Show all" (`expanded`). storybook-page.vue's
// `setupDraft` persists to localStorage and can restore a pick made in an
// earlier session (a plot thread Scenario, a Location, a Facet, a Reward)
// before the picker's option list has even loaded. If that restored slug
// sorts beyond the initial collapsed slice, the picker rendered collapsed
// with no card showing as selected at all -- a reader resuming a draft saw
// what looked like an empty, unset picker even though a real choice was
// already stored in modelValue.
//
// Fix shape this asserts, in both components:
//   - an immediate `watch` over `[items, modelValue]` that finds the
//     restored slug's position in `items` and sets `expanded.value = true`
//     when it falls at or past `initialLimit`;
//   - it must never assign `expanded.value = false` itself -- only the
//     existing items.length reset watcher does that -- so it can't fight a
//     reader's manual "Show fewer" toggle or collapse a list just because a
//     selection was made within the visible slice.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function source(path) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

const SINGLE = 'components/narrative/narrative-ingredient-picker.vue'
const MULTI = 'components/narrative/narrative-ingredient-multi-picker.vue'

for (const path of [SINGLE, MULTI]) {
  const content = source(path)

  assert.ok(
    /watch\(\s*\(\)\s*=>\s*\[props\.items,\s*props\.modelValue\]\s*as const,/.test(
      content,
    ),
    `${path}: expected an immediate \`watch(() => [props.items, ` +
      'props.modelValue] as const, ...)\` that can reveal a restored selection.',
  )
  assert.ok(
    /\{\s*immediate:\s*true\s*\}/.test(content),
    `${path}: the restored-selection watch must run \`immediate: true\` so a ` +
      'selection already set at mount time is checked before first paint, not ' +
      'only on the next change.',
  )

  const watcherStart = content.indexOf(
    'watch(\n  () => [props.items, props.modelValue] as const,',
  )
  assert.notEqual(
    watcherStart,
    -1,
    `${path}: could not locate the restored-selection watch body to check its ` +
      'callback for a stray expanded.value = false.',
  )
  const callbackEnd = content.indexOf('{ immediate: true }', watcherStart)
  const callback = content.slice(watcherStart, callbackEnd)
  assert.ok(
    !/expanded\.value\s*=\s*false/.test(callback),
    `${path}: the restored-selection watch must only ever set ` +
      '`expanded.value = true` -- setting it false there would fight a manual ' +
      '"Show fewer" toggle or collapse the list on an in-range selection.',
  )
  assert.ok(
    /expanded\.value\s*=\s*true/.test(callback),
    `${path}: the restored-selection watch must set \`expanded.value = true\` ` +
      'once it finds the selection past the initial slice.',
  )
}

const single = source(SINGLE)
assert.ok(
  /items\.findIndex\(\(item\) => item\.slug === value\)/.test(single),
  `${SINGLE}: expected the watch to look up modelValue's single slug via ` +
    '`items.findIndex((item) => item.slug === value)`.',
)

const multi = source(MULTI)
assert.ok(
  /values\.map\(\(slug\) => items\.findIndex\(\(item\) => item\.slug === slug\)\)/.test(
    multi,
  ),
  `${MULTI}: expected the watch to look up every selected slug's position via ` +
    '`values.map((slug) => items.findIndex((item) => item.slug === slug))`, ' +
    'so any one of several restored selections can trigger the reveal.',
)

console.log(
  'Storybook picker restored-selection guard passed: both narrative ' +
    'ingredient pickers auto-expand to reveal a modelValue restored from a ' +
    "persisted setupDraft, without ever forcing a collapse of a reader's own " +
    'expanded view.',
)
