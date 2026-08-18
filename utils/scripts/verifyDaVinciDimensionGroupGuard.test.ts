// /utils/scripts/verifyDaVinciDimensionGroupGuard.test.ts
//
// Regression test for checkDimensionGroupGuard() in
// verifyDaVinciDimensionGroupGuard.ts (davinci/t-021 slice 7). Exercises the
// real check against synthetic component-shaped fixtures covering: the
// fixed shape (role="group" + aria-label="Life dimensions"), a
// reverted-to-ungrouped regression, a group-with-no-label regression, and a
// missing-region regression (the dimension grid removed entirely).
import assert from 'node:assert/strict'

import { checkDimensionGroupGuard } from './verifyDaVinciDimensionGroupGuard.js'

function fixture(gridAttrs: string): string {
  return `
<template>
  <div v-else-if="phase === 'playing' && run">
    <div class="grid grid-cols-5 gap-2 sm:grid-cols-10" ${gridAttrs}>
      <div
        v-for="dim in DAVINCI_DIMENSIONS"
        :key="dim"
        :title="\`\${DIMENSION_LABELS[dim]}: \${statMap[dim] ?? 0}\`"
      >
        {{ DIMENSION_LABELS[dim] }}
      </div>
    </div>
  </div>
</template>
`
}

const FIXED = fixture('role="group" aria-label="Life dimensions"')

// Pre-fix shape: the grid container carries neither role nor aria-label.
const UNGROUPED = fixture('')

// role="group" present but the accessible name got dropped.
const NO_LABEL = fixture('role="group"')

// The dimension grid itself no longer exists at all.
const REGION_REMOVED = `
<template>
  <div v-if="phase === 'ending'">
    <p>This life has ended.</p>
  </div>
</template>
`

function run(): void {
  const fixedErrors = checkDimensionGroupGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const ungroupedErrors = checkDimensionGroupGuard(UNGROUPED)
  assert.equal(
    ungroupedErrors.length,
    2,
    `expected the ungrouped fixture to fail both checks, got: ${JSON.stringify(ungroupedErrors)}`,
  )
  assert.ok(ungroupedErrors.some((e) => /no longer has role="group"/.test(e)))
  assert.ok(
    ungroupedErrors.some((e) =>
      /no longer has aria-label="Life dimensions"/.test(e),
    ),
  )

  const noLabelErrors = checkDimensionGroupGuard(NO_LABEL)
  assert.equal(noLabelErrors.length, 1)
  assert.ok(
    noLabelErrors.some((e) =>
      /no longer has aria-label="Life dimensions"/.test(e),
    ),
  )

  const removedErrors = checkDimensionGroupGuard(REGION_REMOVED)
  assert.equal(removedErrors.length, 1)
  assert.ok(
    removedErrors.some((e) =>
      /Could not find the `v-for="dim in DAVINCI_DIMENSIONS"` marker/.test(e),
    ),
  )

  console.log(
    'Da Vinci dimension-group guard self-test passed: ungrouped, ' +
      'no-label, and missing-region regressions all fail; the fixed ' +
      'fixture passes.',
  )
}

run()
