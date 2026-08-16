// /utils/scripts/verifyDaVinciChoiceListGuard.test.ts
//
// Regression test for checkChoiceListGuard() in
// verifyDaVinciChoiceListGuard.ts (davinci/t-021 slice 6). Exercises the
// real check against synthetic component-shaped fixtures covering: the
// fixed shape (kr-choice-list with @select), a reverted-to-hand-rolled-loop
// regression, a kr-choice-list-with-no-handler regression, and a
// missing-region regression (the currentChapter block removed entirely).
import assert from 'node:assert/strict'

import { checkChoiceListGuard } from './verifyDaVinciChoiceListGuard.js'

function fixture(choiceMarkup: string): string {
  return `
<template>
  <div v-else-if="currentChapter">
    <p>{{ currentChapter.narrative }}</p>
    ${choiceMarkup}
  </div>
</template>
`
}

const FIXED = fixture(
  '<kr-choice-list layout="stack" :choices="currentChapterChoices" @select="chooseOptionByKey" />',
)

// Pre-fix shape: a hand-rolled v-for of plain buttons instead of the shared
// component.
const HAND_ROLLED_LOOP = fixture(`
  <div class="flex flex-col gap-2">
    <button v-for="choice in currentChapter.choices" :key="choice.label" @click="chooseOption(choice)">
      {{ choice.label }}
    </button>
  </div>
`)

// kr-choice-list present but its @select handler dropped.
const NO_SELECT_HANDLER = fixture(
  '<kr-choice-list layout="stack" :choices="currentChapterChoices" />',
)

// The currentChapter block itself -- and its narrative marker -- no longer
// exists at all.
const REGION_REMOVED = `
<template>
  <div v-if="phase === 'ending'">
    <p>This life has ended.</p>
  </div>
</template>
`

function run(): void {
  const fixedErrors = checkChoiceListGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const loopErrors = checkChoiceListGuard(HAND_ROLLED_LOOP)
  assert.equal(
    loopErrors.length,
    1,
    `expected the hand-rolled-loop fixture to fail exactly one check, got: ${JSON.stringify(loopErrors)}`,
  )
  assert.ok(
    loopErrors.some((e) =>
      /no longer render(s)? through <kr-choice-list>/.test(e),
    ),
  )

  const noHandlerErrors = checkChoiceListGuard(NO_SELECT_HANDLER)
  assert.equal(noHandlerErrors.length, 1)
  assert.ok(noHandlerErrors.some((e) => /has no @select handler/.test(e)))

  const removedErrors = checkChoiceListGuard(REGION_REMOVED)
  assert.equal(removedErrors.length, 1)
  assert.ok(
    removedErrors.some((e) =>
      /Could not find the `\{\{ currentChapter\.narrative \}\}` marker/.test(e),
    ),
  )

  console.log(
    'Da Vinci choice-list guard self-test passed: hand-rolled-loop, ' +
      'no-select-handler, and missing-region regressions all fail; the ' +
      'fixed fixture passes.',
  )
}

run()
