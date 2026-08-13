// /utils/scripts/verifyDaVinciResolvePanelGuard.test.ts
//
// Regression test for checkResolvePanelGuard() in
// verifyDaVinciResolvePanelGuard.ts (davinci/t-021 slice 3). Exercises the
// real check against synthetic component-shaped fixtures covering: the
// fixed shape (narrationError excluded), the pre-fix shape (narrationError
// not excluded, letting the resolve panel stack under the narration-error
// panel), a narrating-not-excluded regression, a canEndRun-dropped
// regression, and a missing-condition regression (the resolve panel
// removed/restructured entirely).
import assert from 'node:assert/strict'

import { checkResolvePanelGuard } from './verifyDaVinciResolvePanelGuard.js'

function fixture(condition: string): string {
  return `
<template>
  <div
    v-if="${condition}"
    class="flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center"
  >
    <button type="button" @click="resolveLife">See your ending</button>
  </div>
</template>
`
}

const FIXED = fixture(
  '!narrating && !narrationError && (canEndRun || !currentChapter)',
)

// Pre-fix shape: narrationError not excluded, so the panel renders stacked
// under the narration-error retry panel whenever currentChapter is null
// (which is always true while narrationError is set).
const BUGGY = fixture('!narrating && (canEndRun || !currentChapter)')

// narrating no longer excluded.
const NARRATING_NOT_EXCLUDED = fixture(
  '!narrationError && (canEndRun || !currentChapter)',
)

// canEndRun dropped entirely.
const CAN_END_RUN_DROPPED = fixture(
  '!narrating && !narrationError && !currentChapter',
)

// The resolve panel itself -- and its resolveLife button -- no longer
// exists at all.
const CONDITION_REMOVED = `
<template>
  <div v-if="phase === 'ending'">
    <p>This life has ended.</p>
  </div>
</template>
`

function run(): void {
  const fixedErrors = checkResolvePanelGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const buggyErrors = checkResolvePanelGuard(BUGGY)
  assert.equal(
    buggyErrors.length,
    1,
    `expected the pre-fix fixture to fail exactly one check, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(
    buggyErrors.some((e) => /no longer excludes `narrationError`/.test(e)),
  )

  const narratingErrors = checkResolvePanelGuard(NARRATING_NOT_EXCLUDED)
  assert.equal(narratingErrors.length, 1)
  assert.ok(
    narratingErrors.some((e) => /no longer excludes `narrating`/.test(e)),
  )

  const canEndRunErrors = checkResolvePanelGuard(CAN_END_RUN_DROPPED)
  assert.equal(canEndRunErrors.length, 1)
  assert.ok(
    canEndRunErrors.some((e) => /no longer references `canEndRun`/.test(e)),
  )

  const removedErrors = checkResolvePanelGuard(CONDITION_REMOVED)
  assert.equal(removedErrors.length, 1)
  assert.ok(removedErrors.some((e) => /Could not find a `<div v-if=/.test(e)))

  console.log(
    'Da Vinci resolve-panel guard self-test passed: buggy fixture fails, ' +
      'fixed fixture passes, narrating-not-excluded, canEndRun-dropped, and ' +
      'missing-condition regressions all fail.',
  )
}

run()
