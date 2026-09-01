// /utils/scripts/verifyModelBuilderStartRunLoadingGuard.test.ts
//
// Regression test for checkStartRunLoadingGuard() in
// verifyModelBuilderStartRunLoadingGuard.ts (model-builder/t-029, cycle 80).
// Exercises the real check against synthetic file-shaped fixtures covering:
// the pre-fix shape (plain button, no aria-busy, no spinner), the fully
// fixed shape (aria-busy + spinner + icon/label fallback), and a partial fix
// (aria-busy present but no spinner wired).
import assert from 'node:assert/strict'

import { checkStartRunLoadingGuard } from './verifyModelBuilderStartRunLoadingGuard.js'

const BUGGY_FIXTURE = `
<template>
  <button
    type="button"
    class="btn btn-primary btn-sm rounded-xl"
    :disabled="!store.canStartRun"
    @click="store.startRun()"
  >
    <Icon name="kind-icon:play" class="h-4 w-4" />
    Start build run
  </button>
</template>
`

const FIXED_FIXTURE = `
<template>
  <button
    type="button"
    class="btn btn-primary btn-sm rounded-xl"
    :disabled="!store.canStartRun"
    :aria-busy="store.startingRun"
    @click="store.startRun()"
  >
    <span
      v-if="store.startingRun"
      class="loading loading-dots loading-sm"
      aria-hidden="true"
    />
    <template v-else>
      <Icon name="kind-icon:play" class="h-4 w-4" />
      Start build run
    </template>
  </button>
</template>
`

const PARTIAL_FIX_FIXTURE = `
<template>
  <button
    type="button"
    class="btn btn-primary btn-sm rounded-xl"
    :disabled="!store.canStartRun"
    :aria-busy="store.startingRun"
    @click="store.startRun()"
  >
    <Icon name="kind-icon:play" class="h-4 w-4" />
    Start build run
  </button>
</template>
`

const buggyErrors = checkStartRunLoadingGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  2,
  'expected the pre-fix shape (no aria-busy, no spinner) to raise 2 ' +
    `errors, got ${buggyErrors.length}: ${JSON.stringify(buggyErrors)}`,
)
assert.ok(buggyErrors[0]!.includes('aria-busy="store.startingRun"'))
assert.ok(buggyErrors[1]!.includes('loading-dots spinner'))

const fixedErrors = checkStartRunLoadingGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fully fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const partialErrors = checkStartRunLoadingGuard(PARTIAL_FIX_FIXTURE)
assert.equal(
  partialErrors.length,
  1,
  'expected the partial-fix shape (aria-busy present, spinner missing) to ' +
    `raise exactly 1 error, got ${partialErrors.length}: ` +
    `${JSON.stringify(partialErrors)}`,
)
assert.ok(partialErrors[0]!.includes('loading-dots spinner'))

console.log(
  'Model Builder "Start build run" loading-state guard checker verified: ' +
    'flags the pre-fix shape (no aria-busy, no spinner), clears the fully ' +
    'fixed shape, and flags a partial fix missing the spinner.',
)
