// /utils/scripts/verifyModelBuilderErrorCalloutRoleGuard.test.ts
//
// Regression test for checkItemPanelErrorRoleGuard() and
// checkSourcePickerErrorRoleGuard() in
// verifyModelBuilderErrorCalloutRoleGuard.ts (model-builder/t-029, cycle
// 11). Exercises both checks against synthetic component-shaped fixtures
// covering: the fixed shape (role="alert" present), the pre-fix shape (no
// role attribute at all), and a missing-block regression (the callout
// removed entirely).
import assert from 'node:assert/strict'

import {
  checkItemPanelErrorRoleGuard,
  checkSourcePickerErrorRoleGuard,
} from './verifyModelBuilderErrorCalloutRoleGuard.js'

function itemPanelFixture(openingTagExtra: string): string {
  return `
<template>
  <p
    v-if="item.error"
    ${openingTagExtra}
    class="rounded-lg bg-error/10 px-2 py-1 text-xs font-semibold text-error"
  >
    {{ item.error }}
  </p>
</template>
`
}

function sourcePickerFixture(openingTagExtra: string): string {
  return `
<template>
  <div
    v-else-if="store.sourcesError"
    ${openingTagExtra}
    class="flex h-full min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-error/30 bg-error/5 p-6 text-center text-sm text-error"
  >
    <Icon name="kind-icon:warning" class="h-6 w-6" />
    {{ store.sourcesError }}
    <button type="button" @click="store.loadSources()">Retry</button>
  </div>
</template>
`
}

const ITEM_PANEL_FIXED = itemPanelFixture('role="alert"')
const ITEM_PANEL_BUGGY = itemPanelFixture('')
const ITEM_PANEL_BLOCK_REMOVED = `
<template>
  <p v-if="item.warning">{{ item.warning }}</p>
</template>
`

const SOURCE_PICKER_FIXED = sourcePickerFixture('role="alert"')
const SOURCE_PICKER_BUGGY = sourcePickerFixture('')
const SOURCE_PICKER_BLOCK_REMOVED = `
<template>
  <div v-else class="flex h-full min-h-32">Nothing here.</div>
</template>
`

function run(): void {
  // item-panel: fixed fixture passes.
  const itemFixedErrors = checkItemPanelErrorRoleGuard(ITEM_PANEL_FIXED)
  assert.deepEqual(
    itemFixedErrors,
    [],
    `expected the fixed item-panel fixture to pass, got: ${JSON.stringify(itemFixedErrors)}`,
  )

  // item-panel: pre-fix (no role) fails exactly one check.
  const itemBuggyErrors = checkItemPanelErrorRoleGuard(ITEM_PANEL_BUGGY)
  assert.equal(
    itemBuggyErrors.length,
    1,
    `expected the missing-role item-panel fixture to fail exactly one check, got: ${JSON.stringify(itemBuggyErrors)}`,
  )
  assert.ok(
    itemBuggyErrors.some((e) => /no longer carries role="alert"/.test(e)),
  )

  // item-panel: block removed entirely fails with a "could not find" error.
  const itemRemovedErrors = checkItemPanelErrorRoleGuard(
    ITEM_PANEL_BLOCK_REMOVED,
  )
  assert.equal(itemRemovedErrors.length, 1)
  assert.ok(itemRemovedErrors.some((e) => /Could not find a/.test(e)))

  // source-picker: fixed fixture passes.
  const sourceFixedErrors = checkSourcePickerErrorRoleGuard(SOURCE_PICKER_FIXED)
  assert.deepEqual(
    sourceFixedErrors,
    [],
    `expected the fixed source-picker fixture to pass, got: ${JSON.stringify(sourceFixedErrors)}`,
  )

  // source-picker: pre-fix (no role) fails exactly one check.
  const sourceBuggyErrors = checkSourcePickerErrorRoleGuard(SOURCE_PICKER_BUGGY)
  assert.equal(
    sourceBuggyErrors.length,
    1,
    `expected the missing-role source-picker fixture to fail exactly one check, got: ${JSON.stringify(sourceBuggyErrors)}`,
  )
  assert.ok(
    sourceBuggyErrors.some((e) => /no longer carries role="alert"/.test(e)),
  )

  // source-picker: block removed entirely fails with a "could not find" error.
  const sourceRemovedErrors = checkSourcePickerErrorRoleGuard(
    SOURCE_PICKER_BLOCK_REMOVED,
  )
  assert.equal(sourceRemovedErrors.length, 1)
  assert.ok(sourceRemovedErrors.some((e) => /Could not find a/.test(e)))

  console.log(
    'Model Builder error callout role guard self-test passed: buggy ' +
      'fixtures fail, fixed fixtures pass, missing-block regressions fail ' +
      'for both the item-panel and source-picker checks.',
  )
}

run()
