// /utils/scripts/verifyStorybookVisualSetupChoiceGroupGuard.test.ts
//
// Regression test for checkStorybookVisualSetupChoiceGroupGuard() in
// verifyStorybookVisualSetupChoiceGroupGuard.ts (storybook/t-010). Exercises
// the real check against synthetic component-shaped fixtures covering: the
// fixed shape (role="group" + a matching aria-label on both grids), a
// reverted-to-ungrouped regression, a group-with-no-label regression, and a
// missing-region regression (one grid removed entirely).
import assert from 'node:assert/strict'

import { checkStorybookVisualSetupChoiceGroupGuard } from './verifyStorybookVisualSetupChoiceGroupGuard.js'

function fixture(narratorAttrs: string, structureAttrs: string): string {
  return `
<template>
  <section class="space-y-2">
    <h2>Narrator voice</h2>
    <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-2" ${narratorAttrs}>
      <button v-for="option in narratorCards" :key="option.value">
        {{ option.label }}
      </button>
    </div>
  </section>
  <section class="space-y-2">
    <h2>Shape of the tale</h2>
    <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-2" ${structureAttrs}>
      <button v-for="option in structureCards" :key="option.value">
        {{ option.label }}
      </button>
    </div>
  </section>
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
  <section class="space-y-2">
    <h2>Narrator voice</h2>
    <div role="group" aria-label="Narrator voice">
      <button v-for="option in narratorCards" :key="option.value">
        {{ option.label }}
      </button>
    </div>
  </section>
</template>
`

function run(): void {
  const fixedErrors = checkStorybookVisualSetupChoiceGroupGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const ungroupedErrors = checkStorybookVisualSetupChoiceGroupGuard(UNGROUPED)
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
    checkStorybookVisualSetupChoiceGroupGuard(NARRATOR_NO_LABEL)
  assert.equal(narratorNoLabelErrors.length, 1)
  assert.ok(
    narratorNoLabelErrors.some((e) =>
      /"Narrator voice" grid container no longer has aria-label="Narrator voice"/.test(
        e,
      ),
    ),
  )

  const structureRemovedErrors =
    checkStorybookVisualSetupChoiceGroupGuard(STRUCTURE_REMOVED)
  assert.equal(structureRemovedErrors.length, 1)
  assert.ok(
    structureRemovedErrors.some((e) =>
      /Could not find the `v-for="option in structureCards"` marker/.test(e),
    ),
  )

  console.log(
    'Storybook visual-setup choice-group guard self-test passed: ' +
      'ungrouped, no-label, and missing-region regressions all fail; the ' +
      'fixed fixture passes.',
  )
}

run()
