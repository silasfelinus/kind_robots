// /utils/scripts/verifyDaVinciDimensionToneGuard.test.ts
//
// Regression test for checkDimensionToneGuard() in
// verifyDaVinciDimensionToneGuard.ts (davinci/t-021). Exercises the real
// check against synthetic component-shaped fixtures covering: the pre-fix
// shape (template inlines a two-way ternary, no negative tone anywhere), the
// fixed shape (template calls the extracted helpers, both branch on
// `value < 0` into an error tone), and a partial regression (helpers exist
// and are called, but one of them lost its negative branch).
import assert from 'node:assert/strict'

import { checkDimensionToneGuard } from './verifyDaVinciDimensionToneGuard.js'

function fixture(opts: {
  templateUsesPillHelper: boolean
  templateUsesValueHelper: boolean
  pillBody: string
  valueBody: string
}): string {
  return `
<template>
  <div
    class="flex flex-col items-center gap-0.5 rounded-xl border p-2 text-center"
    :class="${
      opts.templateUsesPillHelper
        ? 'dimensionPillClass(statMap[dim] ?? 0)'
        : "(statMap[dim] ?? 0) >= 1 ? 'border-success/40 bg-success/10' : 'border-base-300 bg-base-200/40'"
    }"
  >
    <span
      class="text-xs font-black"
      :class="${
        opts.templateUsesValueHelper
          ? 'dimensionValueClass(statMap[dim] ?? 0)'
          : "''"
      }"
      >{{ statMap[dim] ?? 0 }}</span
    >
  </div>
</template>
<script setup lang="ts">
function dimensionPillClass(value: number): string {
  ${opts.pillBody}
}

function dimensionValueClass(value: number): string {
  ${opts.valueBody}
}
</script>
`
}

const FIXED = fixture({
  templateUsesPillHelper: true,
  templateUsesValueHelper: true,
  pillBody: `
    if (value >= 1) return 'border-success/40 bg-success/10'
    if (value < 0) return 'border-error/40 bg-error/10'
    return 'border-base-300 bg-base-200/40'
  `,
  valueBody: `
    if (value >= 1) return 'text-success'
    if (value < 0) return 'text-error'
    return ''
  `,
})

// Pre-fix shape: template never calls either helper (inlined two-way
// ternary instead), and neither helper exists at all.
const BUGGY = `
<template>
  <div
    :class="(statMap[dim] ?? 0) >= 1 ? 'border-success/40 bg-success/10' : 'border-base-300 bg-base-200/40'"
  >
    <span class="text-xs font-black">{{ statMap[dim] ?? 0 }}</span>
  </div>
</template>
`

// Partial regression: both helpers exist and are wired up in the template,
// but dimensionValueClass lost its negative branch (e.g. reverted to always
// returning '').
const PARTIALLY_REGRESSED = fixture({
  templateUsesPillHelper: true,
  templateUsesValueHelper: true,
  pillBody: `
    if (value >= 1) return 'border-success/40 bg-success/10'
    if (value < 0) return 'border-error/40 bg-error/10'
    return 'border-base-300 bg-base-200/40'
  `,
  valueBody: `
    if (value >= 1) return 'text-success'
    return ''
  `,
})

function run(): void {
  const fixedErrors = checkDimensionToneGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const buggyErrors = checkDimensionToneGuard(BUGGY)
  assert.ok(
    buggyErrors.length >= 2,
    `expected the pre-fix fixture (no helper calls, no helpers) to fail ` +
      `on both the template wiring and the missing functions, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(buggyErrors.some((e) => /no longer binds/.test(e)))
  assert.ok(buggyErrors.some((e) => /Could not find a function named/.test(e)))

  const regressedErrors = checkDimensionToneGuard(PARTIALLY_REGRESSED)
  assert.equal(
    regressedErrors.length,
    2,
    'expected a fixture where dimensionValueClass lost its negative branch ' +
      'and its error-tone reference entirely to fail on both checks for ' +
      `that function, got: ${JSON.stringify(regressedErrors)}`,
  )
  assert.ok(regressedErrors.every((e) => e.startsWith('dimensionValueClass()')))
  assert.ok(regressedErrors.some((e) => /no longer branches/.test(e)))
  assert.ok(regressedErrors.some((e) => /error\/danger tone/.test(e)))

  console.log(
    'Da Vinci dimension-tone guard self-test passed: buggy fixture fails, ' +
      'fixed fixture passes, a partially-regressed fixture fails.',
  )
}

run()
