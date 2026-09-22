// /utils/scripts/verifyStorybookPageChoiceGroupGuard.test.ts
//
// Regression test for checkStorybookPageChoiceGroupGuard() in
// verifyStorybookPageChoiceGroupGuard.ts (storybook/t-062). Exercises the
// real check against synthetic component-shaped fixtures covering: the fixed
// shape (role="group" + a matching aria-label on both grids), a
// reverted-to-ungrouped regression, a group-with-no-label regression, and a
// missing-region regression (one grid removed entirely).
import assert from 'node:assert/strict'

import { checkStorybookPageChoiceGroupGuard } from './verifyStorybookPageChoiceGroupGuard.js'

function fixture(narratorAttrs: string, structureAttrs: string): string {
  return `
<template>
  <div class="kr-panel-flat space-y-2 p-3">
    <h3>Narrator voice</h3>
    <div class="flex flex-wrap gap-2" ${narratorAttrs}>
      <button v-for="style in STORYBOOK_NARRATOR_STYLES" :key="style">
        {{ style }}
      </button>
    </div>
  </div>
  <div class="kr-panel-flat space-y-2 p-3">
    <h3>Shape of the tale</h3>
    <div class="grid gap-2 md:grid-cols-3" ${structureAttrs}>
      <button v-for="structure in STORYBOOK_STRUCTURES" :key="structure.value">
        {{ structure.label }}
      </button>
    </div>
  </div>
</template>
`
}

const FIXED = fixture(
  'role="group" aria-label="Narrator voice"',
  'role="group" aria-label="Shape of the tale"',
)

// Pre-fix shape: neither grid container carries role or aria-label.
const UNGROUPED = fixture('', '')

// role="group" present on both, but the narrator grid's accessible name got
// dropped.
const NARRATOR_NO_LABEL = fixture(
  'role="group"',
  'role="group" aria-label="Shape of the tale"',
)

// The "Shape of the tale" grid itself no longer exists at all.
const STRUCTURE_REMOVED = `
<template>
  <div class="kr-panel-flat space-y-2 p-3">
    <h3>Narrator voice</h3>
    <div role="group" aria-label="Narrator voice">
      <button v-for="style in STORYBOOK_NARRATOR_STYLES" :key="style">
        {{ style }}
      </button>
    </div>
  </div>
</template>
`

function run(): void {
  const fixedErrors = checkStorybookPageChoiceGroupGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const ungroupedErrors = checkStorybookPageChoiceGroupGuard(UNGROUPED)
  assert.equal(
    ungroupedErrors.length,
    4,
    `expected both ungrouped grids to fail both checks, got: ${JSON.stringify(ungroupedErrors)}`,
  )
  assert.ok(
    ungroupedErrors.some((e) =>
      /"Narrator voice" grid container no longer has role="group"/.test(e),
    ),
  )
  assert.ok(
    ungroupedErrors.some((e) =>
      /"Shape of the tale" grid container no longer has role="group"/.test(e),
    ),
  )

  const narratorNoLabelErrors =
    checkStorybookPageChoiceGroupGuard(NARRATOR_NO_LABEL)
  assert.equal(narratorNoLabelErrors.length, 1)
  assert.ok(
    narratorNoLabelErrors.some((e) =>
      /"Narrator voice" grid container no longer has aria-label="Narrator voice"/.test(
        e,
      ),
    ),
  )

  const structureRemovedErrors =
    checkStorybookPageChoiceGroupGuard(STRUCTURE_REMOVED)
  assert.equal(structureRemovedErrors.length, 1)
  assert.ok(
    structureRemovedErrors.some((e) =>
      /Could not find the `v-for="structure in STORYBOOK_STRUCTURES"` marker/.test(
        e,
      ),
    ),
  )

  console.log(
    'Storybook page choice-group guard self-test passed: ungrouped, ' +
      'no-label, and missing-region regressions all fail; the fixed ' +
      'fixture passes.',
  )
}

run()
